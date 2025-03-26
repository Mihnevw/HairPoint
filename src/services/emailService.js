const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

// Check if email configuration is available
const hasEmailConfig = !!process.env.EMAIL_USER && !!process.env.EMAIL_PASS;

// Create reusable transporter if configuration is available
let transporter;

if (hasEmailConfig) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  // Verify transporter configuration
  transporter.verify((error, success) => {
    if (error) {
      logger.error('Email configuration error:', error);
      logger.error('Email configuration details:', {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true',
        user: process.env.EMAIL_USER,
        hasPassword: !!process.env.EMAIL_PASS
      });
    } else {
      logger.info('Email server is ready to send messages');
      logger.info('Email configuration:', {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true',
        user: process.env.EMAIL_USER
      });
    }
  });
} else {
  logger.warn('Email configuration is missing. Email functionality will be disabled.');
}

const sendClientConfirmation = async (appointmentDetails) => {
  // Return early if email configuration is missing
  if (!hasEmailConfig || !transporter) {
    logger.warn('Skipping client confirmation email - email configuration missing');
    return { messageId: null, response: 'Email service not configured', skipped: true };
  }

  const { name, date, startTime, endTime, email } = appointmentDetails;
  
  logger.info('Attempting to send client confirmation email:', {
    to: email,
    name,
    date,
    startTime,
    endTime
  });
  
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || 'AF_Barbershop'}" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Потвърждение за резервация',
    html: `
      <h2>Потвърждение за резервация</h2>
      <p>Здравейте ${name},</p>
      <p>Вашата резервация е успешно направена за:</p>
      <p><strong>Дата:</strong> ${date}</p>
      <p><strong>Час:</strong> ${startTime} - ${endTime}</p>
      <p>Очакваме ви!</p>
      <p>Ако имате нужда от промяна на часа, моля свържете се с нас.</p>
      <p>Поздрави,<br>AF_Barbershop</p>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info('Client confirmation email sent successfully:', {
      messageId: info.messageId,
      response: info.response
    });
    return info;
  } catch (error) {
    logger.error('Error sending client confirmation email:', error);
    logger.error('Email configuration at time of error:', {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE,
      user: process.env.EMAIL_USER,
      hasPassword: !!process.env.EMAIL_PASS
    });
    // Don't rethrow the error - instead return info about the failure
    return { 
      error: error.message, 
      failed: true 
    };
  }
};

const sendAdminNotification = async (appointmentDetails) => {
  // Return early if email configuration is missing
  if (!hasEmailConfig || !transporter) {
    logger.warn('Skipping admin notification email - email configuration missing');
    return { messageId: null, response: 'Email service not configured', skipped: true };
  }

  const { name, email, phone, date, startTime, endTime } = appointmentDetails;
  
  logger.info('Attempting to send admin notification email:', {
    to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
    name,
    email,
    phone,
    date,
    startTime,
    endTime
  });
  
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || 'AF_Barbershop'}" <${process.env.EMAIL_USER}>`,
    to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
    subject: 'Нова резервация',
    html: `
      <h2>Нова резервация</h2>
      <p><strong>Клиент:</strong> ${name}</p>
      <p><strong>Телефон:</strong> ${phone}</p>
      <p><strong>Имейл:</strong> ${email}</p>
      <p><strong>Дата:</strong> ${date}</p>
      <p><strong>Час:</strong> ${startTime} - ${endTime}</p>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info('Admin notification email sent successfully:', {
      messageId: info.messageId,
      response: info.response
    });
    return info;
  } catch (error) {
    logger.error('Error sending admin notification email:', error);
    logger.error('Email configuration at time of error:', {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE,
      user: process.env.EMAIL_USER,
      hasPassword: !!process.env.EMAIL_PASS
    });
    // Don't rethrow the error - instead return info about the failure
    return { 
      error: error.message, 
      failed: true 
    };
  }
};

module.exports = {
  sendClientConfirmation,
  sendAdminNotification,
  hasEmailConfig
}; 