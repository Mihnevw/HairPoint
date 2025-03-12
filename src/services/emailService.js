const nodemailer = require('nodemailer');

// Create reusable transporter
const transporter = nodemailer.createTransport({
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
    console.error('Email configuration error:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});

const sendClientConfirmation = async (appointmentDetails) => {
  const { name, date, startTime, endTime, email } = appointmentDetails;
  
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || 'Hair Salon'}" <${process.env.EMAIL_USER}>`,
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
      <p>Поздрави,<br>Вашият фризьорски салон</p>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Client confirmation email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending client confirmation email:', error);
    throw error;
  }
};

const sendAdminNotification = async (appointmentDetails) => {
  const { name, email, phone, date, startTime, endTime } = appointmentDetails;
  
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || 'Hair Salon'}" <${process.env.EMAIL_USER}>`,
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
    console.log('Admin notification email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending admin notification email:', error);
    throw error;
  }
};

module.exports = {
  sendClientConfirmation,
  sendAdminNotification
}; 