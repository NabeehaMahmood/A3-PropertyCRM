import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const FROM_EMAIL = process.env.SMTP_USER || '';

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

export interface LeadEmailData {
  leadName: string;
  leadEmail: string;
  leadPhone: string;
  propertyInterest: string;
  budget: string;
  agentName?: string;
  adminName?: string;
}

export async function sendNewLeadNotification(data: LeadEmailData) {
  const adminEmail = 'nabeehamahmood7@gmail.com';
  const mailOptions = {
    from: `PropertyCRM <${FROM_EMAIL}>`,
    to: adminEmail,
    subject: 'New Lead Created - Attention Required',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2d5a3d;">New Lead Created</h2>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Name:</strong> ${data.leadName}</p>
          <p><strong>Email:</strong> ${data.leadEmail}</p>
          <p><strong>Phone:</strong> ${data.leadPhone}</p>
          <p><strong>Property Interest:</strong> ${data.propertyInterest}</p>
          <p><strong>Budget:</strong> ${data.budget}</p>
        </div>
        <p style="color: #666; font-size: 14px;">
          Please log in to PropertyCRM to follow up with this lead.
        </p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
}

export async function sendLeadAssignmentNotification(data: LeadEmailData) {
  const mailOptions = {
    from: `PropertyCRM <${FROM_EMAIL}>`,
    to: data.agentName ? `${data.agentName} <agent@propertycrm.com>` : 'agent@propertycrm.com',
    subject: 'New Lead Assigned - Action Required',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2d5a3d;">New Lead Assigned to You</h2>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Lead Name:</strong> ${data.leadName}</p>
          <p><strong>Email:</strong> ${data.leadEmail}</p>
          <p><strong>Phone:</strong> ${data.leadPhone}</p>
          <p><strong>Property Interest:</strong> ${data.propertyInterest}</p>
          <p><strong>Budget:</strong> ${data.budget}</p>
        </div>
        <p style="color: #666; font-size: 14px;">
          Please contact this lead as soon as possible.
        </p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
}