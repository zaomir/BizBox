const nodemailer = require('nodemailer');

/**
 * Email Service using Nodemailer
 */

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || 587),
  secure: false, // TLS
  auth: {
    user: process.env.SMTP_USER || 'diroco@diroco.com',
    pass: process.env.SMTP_PASS || 'app-password'
  }
});

/**
 * Send welcome email to new lead
 */
const sendWelcomeEmail = async (email, name, language = 'ru') => {
  try {
    const templates = {
      ru: {
        subject: 'Добро пожаловать в BizBox! 🚀',
        html: `
          <h1>Привет, ${name}! 👋</h1>
          <p>Спасибо что начали консультацию с AI Советником BizBox.</p>
          <p>Мы проанализируем вашу ситуацию и порекомендуем лучший готовый бизнес для вас.</p>
          <p>Средний результат клиентов: <strong>$280,000+ за 6 месяцев</strong></p>
          <a href="https://direco.com" style="background: #2C3E50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Вернуться на сайт</a>
          <p style="margin-top: 30px; color: #666; font-size: 12px;">
            © 2024 BizBox. All rights reserved.
          </p>
        `
      },
      en: {
        subject: 'Welcome to BizBox! 🚀',
        html: `
          <h1>Hi, ${name}! 👋</h1>
          <p>Thank you for starting a consultation with BizBox AI Advisor.</p>
          <p>We'll analyze your situation and recommend the best ready-made business for you.</p>
          <p>Average client results: <strong>$280,000+ in 6 months</strong></p>
          <a href="https://direco.com" style="background: #2C3E50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Return to website</a>
          <p style="margin-top: 30px; color: #666; font-size: 12px;">
            © 2024 BizBox. All rights reserved.
          </p>
        `
      }
    };

    const template = templates[language] || templates.en;

    const mailOptions = {
      from: process.env.SMTP_USER || 'diroco@diroco.com',
      to: email,
      subject: template.subject,
      html: template.html
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Welcome email sent to ${email}`);
    return true;
  } catch (err) {
    console.error('❌ Email Error:', err);
    return false;
  }
};

/**
 * Send qualified lead notification to admin
 */
const sendLeadQualificationEmail = async (lead, analysis) => {
  try {
    const mailOptions = {
      from: process.env.SMTP_USER || 'diroco@diroco.com',
      to: 'admin@direco.com',
      subject: `🎯 New Qualified Lead: ${lead.name} (Score: ${analysis.readiness_score})`,
      html: `
        <h2>New Qualified Lead</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Name:</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">${lead.name}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Email:</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">${lead.email}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Phone:</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">${lead.phone || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Country:</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">${lead.country || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Language:</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">${lead.language}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Readiness Score:</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>${analysis.readiness_score}/100</strong></td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Stage:</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">${analysis.stage}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Recommended Product:</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">${analysis.recommended_product}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Urgency:</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">${analysis.urgency}</td>
          </tr>
        </table>
        <p style="margin-top: 20px;">
          <a href="https://direco.com/admin/leads/${lead.email}" style="background: #27AE60; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Lead</a>
        </p>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Lead qualification email sent to admin`);
    return true;
  } catch (err) {
    console.error('❌ Admin Email Error:', err);
    return false;
  }
};

/**
 * Send payment confirmation email
 */
const sendPaymentConfirmationEmail = async (customer) => {
  try {
    const mailOptions = {
      from: process.env.SMTP_USER || 'diroco@diroco.com',
      to: customer.email,
      subject: `Payment Confirmed ✅ - BizBox Order #${customer.id}`,
      html: `
        <h1>Payment Confirmed! ✅</h1>
        <p>Hi ${customer.name},</p>
        <p>Your payment has been successfully processed.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Order ID:</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">#${customer.id}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Product:</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">${customer.product_name}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Amount:</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">$${(customer.price_paid / 100).toFixed(2)} USD</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Date:</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">${customer.payment_date}</td>
          </tr>
        </table>
        <p>Your onboarding starts immediately. Check your email for setup instructions.</p>
        <p>Our team will contact you within 24 hours to begin the setup process.</p>
        <p style="margin-top: 30px; color: #666; font-size: 12px;">
          © 2024 BizBox. All rights reserved.
        </p>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Payment confirmation email sent to ${customer.email}`);
    return true;
  } catch (err) {
    console.error('❌ Payment Email Error:', err);
    return false;
  }
};

/**
 * Send onboarding email
 */
const sendOnboardingEmail = async (customer) => {
  try {
    const mailOptions = {
      from: process.env.SMTP_USER || 'diroco@diroco.com',
      to: customer.email,
      subject: `🚀 Your BizBox Onboarding Starts Now - ${customer.product_name}`,
      html: `
        <h1>🚀 Welcome Aboard, ${customer.name}!</h1>
        <p>Your ready-made business setup is starting now.</p>

        <h2>What Happens Next:</h2>
        <ol>
          <li><strong>Day 1-2:</strong> Initial setup and configuration</li>
          <li><strong>Day 3-5:</strong> Client base and operations setup</li>
          <li><strong>Day 6-7:</strong> Launch and first customers</li>
        </ol>

        <h2>Your Onboarding Manager:</h2>
        <p>Name: <strong>BizBox Support Team</strong><br>
        Email: <strong>support@direco.com</strong><br>
        Phone: <strong>+1 (800) BIZBOX-1</strong></p>

        <p>Expect a call from our onboarding specialist within 24 hours.</p>

        <p style="margin-top: 30px; color: #666; font-size: 12px;">
          © 2024 BizBox. All rights reserved.
        </p>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Onboarding email sent to ${customer.email}`);
    return true;
  } catch (err) {
    console.error('❌ Onboarding Email Error:', err);
    return false;
  }
};

/**
 * Send 30-day check-in email
 */
const send30DayCheckInEmail = async (customer) => {
  try {
    const mailOptions = {
      from: process.env.SMTP_USER || 'diroco@diroco.com',
      to: customer.email,
      subject: `30-Day Check-In ✨ - How is your ${customer.product_name} doing?`,
      html: `
        <h1>30-Day Check-In ✨</h1>
        <p>Hi ${customer.name},</p>
        <p>It's been 30 days since you launched your ${customer.product_name}!</p>
        <p>We'd love to hear about your progress and discuss optimization strategies.</p>
        <p>
          <a href="https://direco.com/customer/survey/${customer.id}" style="background: #F4B736; color: black; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Share Your Results
          </a>
        </p>
        <p>Looking forward to hearing your success story! 🎉</p>
        <p style="margin-top: 30px; color: #666; font-size: 12px;">
          © 2024 BizBox. All rights reserved.
        </p>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ 30-day check-in email sent to ${customer.email}`);
    return true;
  } catch (err) {
    console.error('❌ 30-Day Email Error:', err);
    return false;
  }
};

/**
 * Verify email connection
 */
const verifyConnection = async () => {
  try {
    await transporter.verify();
    console.log('✅ Email service connected and ready');
    return true;
  } catch (err) {
    console.error('❌ Email service connection error:', err);
    return false;
  }
};

module.exports = {
  sendWelcomeEmail,
  sendLeadQualificationEmail,
  sendPaymentConfirmationEmail,
  sendOnboardingEmail,
  send30DayCheckInEmail,
  verifyConnection
};
