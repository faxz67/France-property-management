const nodemailer = require('nodemailer');

class Mailer {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  /**
   * Initialize email transporter with Gmail credentials
   */
  initializeTransporter() {
    try {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      // Verify connection
      this.transporter.verify((error, success) => {
        if (error) {
          console.error('❌ Email service initialization failed:', error);
        } else {
          console.log('✅ Email service ready');
        }
      });
    } catch (error) {
      console.error('Error initializing email service:', error);
    }
  }

  /**
   * Send email with the specified options
   * @param {Object} options - Email configuration
   * @returns {Promise<void>}
   */
  async sendEmail(options) {
    if (!this.transporter) {
      throw new Error('Email service not initialized');
    }

    try {
      const mailOptions = {
        from: `"Property Management System" <${process.env.EMAIL_USER}>`,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        html: options.html,
        attachments: options.attachments || []
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email sent successfully:`, result.messageId);
    } catch (error) {
      console.error('❌ Error sending email:', error);
      throw error;
    }
  }

  /**
   * Send receipt email to multiple recipients
   * @param {Array} to - Array of email addresses
   * @param {string} subject - Email subject
   * @param {string} html - Email HTML content
   * @param {Array} attachments - Optional attachments
   * @returns {Promise<void>}
   */
  async sendReceiptEmail(to, subject, html, attachments) {
    await this.sendEmail({
      to,
      subject,
      html,
      attachments
    });
  }
}

// Export singleton instance
const mailer = new Mailer();

// Export the sendEmail function as requested
const sendEmail = async (to, subject, html) => {
  await mailer.sendEmail({ to, subject, html });
};

module.exports = { mailer, sendEmail };
