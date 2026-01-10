import { sendEmail, emailTemplates } from '../email/email-service';
import { supabase } from '@/lib/supabaseClient';

export class NotificationService {
  static async notifySupplierApproval(supplierId: string) {
    try {
      // Get supplier details
      const { data: supplier, error } = await supabase
        .from('suppliers')
        .select('user_id, business_name, email')
        .eq('id', supplierId)
        .single();

      if (error || !supplier) {
        console.error('Failed to get supplier details:', error);
        return { success: false, error };
      }

      // Get user details
      const { data: user, error: userError } = await supabase.auth.admin.getUserById(supplier.user_id);

      if (userError || !user.user?.user_metadata?.full_name) {
        console.error('Failed to get user details:', userError);
        return { success: false, error: userError };
      }

      const template = emailTemplates.supplierApproved(
        user.user.user_metadata.full_name,
        supplier.business_name
      );

      const result = await sendEmail({
        to: supplier.email,
        ...template,
      });

      // Log notification
      await supabase.from('user_notifications').insert({
        user_id: supplier.user_id,
        notification_type: 'supplier_approved',
        title: 'Supplier Account Approved',
        message: 'Your supplier application has been approved. Welcome to AI Mall!',
        metadata: { supplier_id: supplierId },
      });

      return result;
    } catch (error) {
      console.error('Failed to send supplier approval notification:', error);
      return { success: false, error };
    }
  }

  static async notifySupplierRejection(supplierId: string, reason?: string) {
    try {
      // Get supplier details
      const { data: supplier, error } = await supabase
        .from('suppliers')
        .select('user_id, business_name, email')
        .eq('id', supplierId)
        .single();

      if (error || !supplier) {
        console.error('Failed to get supplier details:', error);
        return { success: false, error };
      }

      // Get user details
      const { data: user, error: userError } = await supabase.auth.admin.getUserById(supplier.user_id);

      if (userError || !user.user?.user_metadata?.full_name) {
        console.error('Failed to get user details:', userError);
        return { success: false, error: userError };
      }

      const template = emailTemplates.supplierRejected(
        user.user.user_metadata.full_name,
        supplier.business_name,
        reason
      );

      const result = await sendEmail({
        to: supplier.email,
        ...template,
      });

      // Log notification
      await supabase.from('user_notifications').insert({
        user_id: supplier.user_id,
        notification_type: 'supplier_rejected',
        title: 'Supplier Application Update',
        message: 'Your supplier application has been reviewed. Please check your email for details.',
        metadata: { supplier_id: supplierId, reason },
      });

      return result;
    } catch (error) {
      console.error('Failed to send supplier rejection notification:', error);
      return { success: false, error };
    }
  }

  static async notifyOrderConfirmation(orderId: string, customerEmail: string, customerName: string, orderTotal: string) {
    try {
      const template = emailTemplates.orderConfirmation(customerName, orderId, orderTotal);

      const result = await sendEmail({
        to: customerEmail,
        ...template,
      });

      return result;
    } catch (error) {
      console.error('Failed to send order confirmation:', error);
      return { success: false, error };
    }
  }

  static async notifyAdmin(subject: string, message: string, details?: any) {
    try {
      // Get all admin users
      const { data: adminUsers, error } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (error || !adminUsers?.length) {
        console.error('Failed to get admin users:', error);
        return { success: false, error };
      }

      // Get admin emails
      const adminEmails = [];
      for (const admin of adminUsers) {
        const { data: user } = await supabase.auth.admin.getUserById(admin.user_id);
        if (user.user?.email) {
          adminEmails.push(user.user.email);
        }
      }

      if (!adminEmails.length) {
        console.warn('No admin emails found');
        return { success: false, error: 'No admin emails found' };
      }

      const template = emailTemplates.adminAlert(subject, message, details);

      // Send to all admins
      const results = await Promise.allSettled(
        adminEmails.map(email =>
          sendEmail({
            to: email,
            ...template,
          })
        )
      );

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      return {
        success: successful > 0,
        data: { successful, failed, total: adminEmails.length }
      };
    } catch (error) {
      console.error('Failed to send admin notification:', error);
      return { success: false, error };
    }
  }

  static async createInAppNotification(userId: string, type: string, title: string, message: string, metadata?: any) {
    try {
      const { error } = await supabase.from('user_notifications').insert({
        user_id: userId,
        notification_type: type,
        title,
        message,
        metadata,
      });

      if (error) {
        console.error('Failed to create in-app notification:', error);
        return { success: false, error };
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to create in-app notification:', error);
      return { success: false, error };
    }
  }
}