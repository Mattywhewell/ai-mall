import { getSupabaseClient } from '@/lib/supabase-server';

export async function logAudit(sellerId: string | null, actor: string, action: string, details: any = {}, ip?: string) {
  try {
    const supabase = getSupabaseClient();
    await supabase.from('audit_logs').insert({ seller_id: sellerId, actor, action, details, ip_addr: ip || null });
  } catch (err) {
    console.error('logAudit error', err);
  }
}
