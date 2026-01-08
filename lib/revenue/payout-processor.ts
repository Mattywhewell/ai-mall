/**
 * Hybrid Supplier Payout Processor
 * Handles instant, weekly, and monthly payouts for suppliers
 */

import { supabase } from '../supabaseClient';
import Stripe from 'stripe';

// Lazy Stripe client to avoid throwing during build when secret not set
let stripeClient: Stripe | null = null;
function getStripe(): Stripe | null {
  if (stripeClient) return stripeClient;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  stripeClient = new Stripe(key, { apiVersion: '2025-12-15.clover' });
  return stripeClient;
}

export type PayoutMethod = 'instant' | 'weekly' | 'monthly';
export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

interface Supplier {
  id: string;
  business_name: string;
  payout_method: PayoutMethod;
  stripe_account_id: string | null;
  payout_email: string | null;
  commission_rate: number;
  minimum_payout_threshold: number;
  last_payout_date: string | null;
  next_payout_date: string | null;
}

interface EarningsData {
  total_revenue: number;
  commission_amount: number;
  net_amount: number;
  order_count: number;
  revenue_ids: string[];
}

interface PayoutResult {
  success: boolean;
  supplierId: string;
  payoutId?: string;
  amount?: number;
  error?: string;
  method: PayoutMethod;
}

export class PayoutProcessor {
  /**
   * Process all pending payouts based on schedule
   */
  static async processScheduledPayouts(payoutType: 'instant' | 'weekly' | 'monthly'): Promise<PayoutResult[]> {
    console.log(`[Payout Processor] Starting ${payoutType} payout processing...`);
    
    try {
      // Get suppliers eligible for this payout cycle
      const suppliers = await this.getEligibleSuppliers(payoutType);
      console.log(`[Payout Processor] Found ${suppliers.length} eligible suppliers`);

      const results: PayoutResult[] = [];

      for (const supplier of suppliers) {
        try {
          const result = await this.processSinglePayout(supplier);
          results.push(result);
        } catch (error) {
          console.error(`[Payout Processor] Error processing payout for supplier ${supplier.id}:`, error);
          results.push({
            success: false,
            supplierId: supplier.id,
            error: error instanceof Error ? error.message : 'Unknown error',
            method: supplier.payout_method,
          });
        }
      }

      return results;
    } catch (error) {
      console.error('[Payout Processor] Fatal error:', error);
      throw error;
    }
  }

  /**
   * Get suppliers eligible for payout
   */
  private static async getEligibleSuppliers(payoutType: PayoutMethod): Promise<Supplier[]> {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('payout_method', payoutType)
      .lte('next_payout_date', new Date().toISOString());

    if (error) {
      console.error('[Payout Processor] Error fetching suppliers:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Process payout for a single supplier
   */
  private static async processSinglePayout(supplier: Supplier): Promise<PayoutResult> {
    console.log(`[Payout Processor] Processing ${supplier.payout_method} payout for ${supplier.business_name}`);

    // Calculate earnings period
    const { periodStart, periodEnd } = this.getPayoutPeriod(supplier.payout_method, supplier.last_payout_date);

    // Calculate earnings
    const earnings = await this.calculateEarnings(supplier.id, periodStart, periodEnd);

    // Check minimum threshold
    if (earnings.net_amount < supplier.minimum_payout_threshold) {
      console.log(`[Payout Processor] Earnings below threshold for ${supplier.business_name}: $${earnings.net_amount}`);
      return {
        success: false,
        supplierId: supplier.id,
        error: `Earnings ($${earnings.net_amount}) below minimum threshold ($${supplier.minimum_payout_threshold})`,
        method: supplier.payout_method,
      };
    }

    // Create payout record
    const payoutRecord = await this.createPayoutRecord(supplier, earnings, periodStart, periodEnd);

    // Process based on method
    let result: PayoutResult;
    switch (supplier.payout_method) {
      case 'instant':
        result = await this.processInstantPayout(supplier, payoutRecord, earnings);
        break;
      case 'weekly':
      case 'monthly':
        result = await this.processManualPayout(supplier, payoutRecord, earnings);
        break;
      default:
        throw new Error(`Unknown payout method: ${supplier.payout_method}`);
    }

    // Update next payout date
    if (result.success) {
      await this.updateNextPayoutDate(supplier.id, supplier.payout_method);
    }

    return result;
  }

  /**
   * Process instant Stripe payout
   */
  private static async processInstantPayout(
    supplier: Supplier,
    payoutId: string,
    earnings: EarningsData
  ): Promise<PayoutResult> {
    if (!supplier.stripe_account_id) {
      return {
        success: false,
        supplierId: supplier.id,
        payoutId,
        error: 'No Stripe account connected',
        method: 'instant',
      };
    }

    try {
      // Update status to processing
      await this.updatePayoutStatus(payoutId, 'processing');
      await this.logPayoutTransaction(payoutId, 'processing', 'Initiating Stripe transfer');

      // Create Stripe transfer
      const stripe = getStripe();
      if (!stripe) throw new Error('STRIPE_SECRET_KEY not configured');

      const transfer = await stripe.transfers.create({
        amount: Math.round(earnings.net_amount * 100), // Convert to cents
        currency: 'usd',
        destination: supplier.stripe_account_id,
        description: `Payout to ${supplier.business_name}`,
        metadata: {
          supplier_id: supplier.id,
          payout_id: payoutId,
          order_count: earnings.order_count.toString(),
        },
      });

      console.log(`[Payout Processor] Stripe transfer created: ${transfer.id}`);

      // Update payout record with Stripe details
      await supabase
        .from('supplier_payouts')
        .update({
          stripe_transfer_id: transfer.id,
          status: 'completed',
          processed_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
        })
        .eq('id', payoutId);

      // Mark revenue as paid
      await this.markRevenueAsPaid(earnings.revenue_ids, payoutId);

      // Log completion
      await this.logPayoutTransaction(payoutId, 'completed', `Stripe transfer completed: ${transfer.id}`);

      return {
        success: true,
        supplierId: supplier.id,
        payoutId,
        amount: earnings.net_amount,
        method: 'instant',
      };
    } catch (error) {
      console.error('[Payout Processor] Stripe transfer failed:', error);

      // Update payout record as failed
      await supabase
        .from('supplier_payouts')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Stripe transfer failed',
          processed_at: new Date().toISOString(),
        })
        .eq('id', payoutId);

      await this.logPayoutTransaction(
        payoutId,
        'failed',
        error instanceof Error ? error.message : 'Stripe transfer failed'
      );

      return {
        success: false,
        supplierId: supplier.id,
        payoutId,
        error: error instanceof Error ? error.message : 'Stripe transfer failed',
        method: 'instant',
      };
    }
  }

  /**
   * Process manual payout (weekly/monthly)
   */
  private static async processManualPayout(
    supplier: Supplier,
    payoutId: string,
    earnings: EarningsData
  ): Promise<PayoutResult> {
    try {
      // Update payout status to pending (awaiting admin action)
      await this.updatePayoutStatus(payoutId, 'pending');
      await this.logPayoutTransaction(
        payoutId,
        'pending',
        `Manual payout created - awaiting admin processing`
      );

      // Mark revenue as pending payout
      await this.markRevenueAsPendingPayout(earnings.revenue_ids, payoutId);

      console.log(`[Payout Processor] Manual payout created for ${supplier.business_name}: $${earnings.net_amount}`);

      return {
        success: true,
        supplierId: supplier.id,
        payoutId,
        amount: earnings.net_amount,
        method: supplier.payout_method,
      };
    } catch (error) {
      console.error('[Payout Processor] Manual payout creation failed:', error);

      await supabase
        .from('supplier_payouts')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Payout creation failed',
        })
        .eq('id', payoutId);

      return {
        success: false,
        supplierId: supplier.id,
        payoutId,
        error: error instanceof Error ? error.message : 'Payout creation failed',
        method: supplier.payout_method,
      };
    }
  }

  /**
   * Calculate earnings for a supplier
   */
  private static async calculateEarnings(
    supplierId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<EarningsData> {
    const { data, error } = await supabase.rpc('calculate_supplier_earnings', {
      p_supplier_id: supplierId,
      p_start_date: periodStart.toISOString(),
      p_end_date: periodEnd.toISOString(),
    });

    if (error) {
      console.error('[Payout Processor] Error calculating earnings:', error);
      throw error;
    }

    const earnings = data[0] || {
      total_revenue: 0,
      commission_amount: 0,
      net_amount: 0,
      order_count: 0,
      revenue_ids: [],
    };

    return earnings;
  }

  /**
   * Create payout record in database
   */
  private static async createPayoutRecord(
    supplier: Supplier,
    earnings: EarningsData,
    periodStart: Date,
    periodEnd: Date
  ): Promise<string> {
    const { data, error } = await supabase
      .from('supplier_payouts')
      .insert({
        supplier_id: supplier.id,
        payout_method: supplier.payout_method,
        amount: earnings.total_revenue,
        commission_amount: earnings.commission_amount,
        net_amount: earnings.net_amount,
        order_count: earnings.order_count,
        revenue_ids: earnings.revenue_ids,
        period_start: periodStart.toISOString(),
        period_end: periodEnd.toISOString(),
        status: 'pending',
        payout_email: supplier.payout_email,
      })
      .select('id')
      .single();

    if (error || !data) {
      console.error('[Payout Processor] Error creating payout record:', error);
      throw error || new Error('Failed to create payout record');
    }

    await this.logPayoutTransaction(data.id, 'pending', 'Payout record created');

    return data.id;
  }

  /**
   * Get payout period based on method
   */
  private static getPayoutPeriod(
    method: PayoutMethod,
    lastPayoutDate: string | null
  ): { periodStart: Date; periodEnd: Date } {
    const now = new Date();
    let periodStart: Date;
    const periodEnd = new Date(now);

    if (lastPayoutDate) {
      periodStart = new Date(lastPayoutDate);
    } else {
      // Default period based on method
      switch (method) {
        case 'instant':
          periodStart = new Date(now.getTime() - 24 * 60 * 60 * 1000); // Last 24 hours
          break;
        case 'weekly':
          periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // Last 7 days
          break;
        case 'monthly':
          periodStart = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()); // Last month
          break;
      }
    }

    return { periodStart, periodEnd };
  }

  /**
   * Update next payout date for supplier
   */
  private static async updateNextPayoutDate(supplierId: string, method: PayoutMethod): Promise<void> {
    await supabase.rpc('update_next_payout_date', {
      p_supplier_id: supplierId,
      p_payout_method: method,
    });
  }

  /**
   * Update payout status
   */
  private static async updatePayoutStatus(payoutId: string, status: PayoutStatus): Promise<void> {
    await supabase.from('supplier_payouts').update({ status }).eq('id', payoutId);
  }

  /**
   * Mark revenue as paid
   */
  private static async markRevenueAsPaid(revenueIds: string[], payoutId: string): Promise<void> {
    if (revenueIds.length === 0) return;

    await supabase
      .from('revenue')
      .update({
        payout_id: payoutId,
        payout_status: 'paid',
      })
      .in('id', revenueIds);
  }

  /**
   * Mark revenue as pending payout
   */
  private static async markRevenueAsPendingPayout(revenueIds: string[], payoutId: string): Promise<void> {
    if (revenueIds.length === 0) return;

    await supabase
      .from('revenue')
      .update({
        payout_id: payoutId,
        payout_status: 'pending_payout',
      })
      .in('id', revenueIds);
  }

  /**
   * Log payout transaction for audit trail
   */
  private static async logPayoutTransaction(
    payoutId: string,
    status: PayoutStatus,
    description: string,
    metadata?: any
  ): Promise<void> {
    await supabase.from('payout_transactions').insert({
      payout_id: payoutId,
      transaction_type: status,
      status,
      description,
      metadata,
    });
  }

  /**
   * Manual admin trigger for a specific supplier
   */
  static async triggerManualPayout(supplierId: string): Promise<PayoutResult> {
    const { data: supplier, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', supplierId)
      .single();

    if (error || !supplier) {
      throw new Error('Supplier not found');
    }

    return await this.processSinglePayout(supplier);
  }

  /**
   * Complete a manual payout (called by admin after bank transfer)
   */
  static async completeManualPayout(payoutId: string, adminNotes?: string): Promise<void> {
    await supabase
      .from('supplier_payouts')
      .update({
        status: 'completed',
        processed_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        admin_notes: adminNotes,
      })
      .eq('id', payoutId);

    // Get revenue IDs and mark as paid
    const { data: payout } = await supabase
      .from('supplier_payouts')
      .select('revenue_ids')
      .eq('id', payoutId)
      .single();

    if (payout?.revenue_ids) {
      await this.markRevenueAsPaid(payout.revenue_ids, payoutId);
    }

    await this.logPayoutTransaction(payoutId, 'completed', 'Manually completed by admin', { admin_notes: adminNotes });
  }
}
