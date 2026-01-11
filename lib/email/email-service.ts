import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail(options: EmailOptions) {
  if (!resend) {
    console.warn('Resend API key not configured. Email not sent:', options.to);
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const { to, subject, html, from = 'AI Mall <noreply@ai-mall.com>' } = options;

    const result = await resend.emails.send({
      from,
      to,
      subject,
      html,
    });

    console.log('Email sent successfully:', result);
    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error };
  }
}

// Email templates
export const emailTemplates = {
  supplierApproved: (supplierName: string, businessName: string) => ({
    subject: 'Welcome to AI Mall - Your Supplier Account is Approved!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #7c3aed;">Welcome to AI Mall, ${supplierName}!</h1>
        <p>Great news! Your supplier application for <strong>${businessName}</strong> has been approved.</p>
        <p>You can now:</p>
        <ul>
          <li>List your products on our AI-powered marketplace</li>
          <li>Access detailed analytics and insights</li>
          <li>Connect your Stripe account for seamless payouts</li>
          <li>Utilize our AI tools for product descriptions and optimization</li>
        </ul>
        <p>Get started by logging into your dashboard and adding your first product!</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/supplier/dashboard"
           style="background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">
          Access Your Dashboard
        </a>
        <p>If you have any questions, feel free to reach out to our support team.</p>
        <p>Best regards,<br>The AI Mall Team</p>
      </div>
    `,
  }),

  supplierRejected: (supplierName: string, businessName: string, reason?: string) => ({
    subject: 'AI Mall Supplier Application Update',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #dc2626;">Supplier Application Update</h1>
        <p>Dear ${supplierName},</p>
        <p>Thank you for your interest in joining AI Mall with <strong>${businessName}</strong>.</p>
        <p>After careful review, we regret to inform you that your supplier application has not been approved at this time.</p>
        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
        <p>You can reapply after addressing the issues mentioned above, or contact our support team for more information.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/contact"
           style="background-color: #6b7280; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">
          Contact Support
        </a>
        <p>We appreciate your understanding.</p>
        <p>Best regards,<br>The AI Mall Team</p>
      </div>
    `,
  }),

  orderConfirmation: (customerName: string, orderId: string, orderTotal: string) => ({
    subject: `Order Confirmation - ${orderId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #059669;">Order Confirmed!</h1>
        <p>Hi ${customerName},</p>
        <p>Thank you for your order! Your order <strong>${orderId}</strong> has been successfully placed.</p>
        <p><strong>Order Total:</strong> ${orderTotal}</p>
        <p>You'll receive another email when your order ships. You can track your order status in your account dashboard.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/orders/${orderId}"
           style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">
          View Order Details
        </a>
        <p>Best regards,<br>The AI Mall Team</p>
      </div>
    `,
  }),

  adminAlert: (subject: string, message: string, details?: any) => ({
    subject: `AI Mall Admin Alert: ${subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #dc2626;">Admin Alert</h1>
        <p><strong>${subject}</strong></p>
        <p>${message}</p>
        ${details ? `<pre style="background-color: #f3f4f6; padding: 12px; border-radius: 6px;">${JSON.stringify(details, null, 2)}</pre>` : ''}
        <p>Please check the admin dashboard for more details.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin"
           style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">
          Access Admin Dashboard
        </a>
      </div>
    `,
  }),
};