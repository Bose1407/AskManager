// Email configuration using FREE Gmail SMTP
import nodemailer from 'nodemailer';

// Create transporter with Gmail SMTP (FREE - 100 emails/day)
let transporter: nodemailer.Transporter | null = null;

const getTransporter = () => {
  // Return existing transporter if already created
  if (transporter) {
    return transporter;
  }

  // Check if email is configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.warn('⚠️  Email not configured. Email features will be disabled.');
    console.warn('   Add EMAIL_USER and EMAIL_PASSWORD to .env to enable emails.');
    return null;
  }

  const emailConfig = {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  };

  transporter = nodemailer.createTransport(emailConfig);
  return transporter;
};

// Email templates
interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  const transporter = getTransporter();
  
  if (!transporter) {
    console.warn('Email not sent: Email service not configured');
    return false;
  }

  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${options.to}: ${options.subject}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    return false;
  }
};

// Email Templates
export const emailTemplates = {
  // Welcome email
  welcome: (name: string, companyName: string = 'Company') => ({
    subject: `Welcome to ${companyName}!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0d9488;">Welcome to ${companyName}!</h2>
        <p>Hi ${name},</p>
        <p>Your account has been successfully created. You can now:</p>
        <ul>
          <li>Manage your tasks</li>
          <li>Request leaves</li>
          <li>Chat with team members</li>
          <li>View analytics</li>
        </ul>
        <p>If you have any questions, please contact your manager.</p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          This is an automated email, please do not reply.
        </p>
      </div>
    `,
  }),

  // Password reset
  passwordReset: (name: string, resetLink: string) => ({
    subject: 'Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0d9488;">Password Reset Request</h2>
        <p>Hi ${name},</p>
        <p>We received a request to reset your password. Click the button below to reset it:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" 
             style="background-color: #0d9488; color: white; padding: 12px 30px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          This is an automated email, please do not reply.
        </p>
      </div>
    `,
  }),

  // Task assigned
  taskAssigned: (name: string, taskTitle: string, assignedBy: string, dueDate?: string) => ({
    subject: `New Task Assigned: ${taskTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0d9488;">New Task Assigned</h2>
        <p>Hi ${name},</p>
        <p>You have been assigned a new task by ${assignedBy}:</p>
        <div style="background: #f0fdfa; padding: 15px; border-left: 4px solid #0d9488; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #0d9488;">${taskTitle}</h3>
          ${dueDate ? `<p style="margin: 0; color: #666;">Due: ${dueDate}</p>` : ''}
        </div>
        <p>Login to your dashboard to view details and start working on it.</p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          This is an automated email, please do not reply.
        </p>
      </div>
    `,
  }),

  // Leave request submitted
  leaveRequestSubmitted: (employeeName: string, managerName: string, leaveType: string, startDate: string, endDate: string, reason: string) => ({
    subject: `Leave Request from ${employeeName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0d9488;">New Leave Request</h2>
        <p>Hi ${managerName},</p>
        <p>${employeeName} has submitted a leave request:</p>
        <div style="background: #f0fdfa; padding: 15px; border-left: 4px solid #0d9488; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Type:</strong> ${leaveType}</p>
          <p style="margin: 5px 0;"><strong>From:</strong> ${startDate}</p>
          <p style="margin: 5px 0;"><strong>To:</strong> ${endDate}</p>
          <p style="margin: 5px 0;"><strong>Reason:</strong> ${reason}</p>
        </div>
        <p>Please review and approve/reject this request in your dashboard.</p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          This is an automated email, please do not reply.
        </p>
      </div>
    `,
  }),

  // Leave request status update
  leaveStatusUpdate: (employeeName: string, status: string, leaveType: string, startDate: string, endDate: string) => ({
    subject: `Leave Request ${status}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${status === 'approved' ? '#10b981' : '#ef4444'};">
          Leave Request ${status.charAt(0).toUpperCase() + status.slice(1)}
        </h2>
        <p>Hi ${employeeName},</p>
        <p>Your leave request has been <strong>${status}</strong>:</p>
        <div style="background: #f0fdfa; padding: 15px; border-left: 4px solid #0d9488; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Type:</strong> ${leaveType}</p>
          <p style="margin: 5px 0;"><strong>From:</strong> ${startDate}</p>
          <p style="margin: 5px 0;"><strong>To:</strong> ${endDate}</p>
        </div>
        <p>${status === 'approved' ? 'Enjoy your time off!' : 'Please contact your manager for more information.'}</p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          This is an automated email, please do not reply.
        </p>
      </div>
    `,
  }),

  // Chat mention
  chatMention: (recipientName: string, senderName: string, message: string) => ({
    subject: `${senderName} mentioned you in chat`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0d9488;">You were mentioned in chat</h2>
        <p>Hi ${recipientName},</p>
        <p>${senderName} mentioned you in a message:</p>
        <div style="background: #f9fafb; padding: 15px; border-left: 4px solid #0d9488; margin: 20px 0; font-style: italic;">
          "${message.substring(0, 200)}${message.length > 200 ? '...' : ''}"
        </div>
        <p>Login to your dashboard to view the full conversation.</p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          This is an automated email, please do not reply.
        </p>
      </div>
    `,
  }),
};

export default {
  sendEmail,
  emailTemplates,
};
