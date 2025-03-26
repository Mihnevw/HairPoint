const nodemailer = require('nodemailer');
const logger = require('./logger');

// Create reusable transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED === 'true'
    }
});

// Verify transporter configuration
transporter.verify((error, success) => {
    if (error) {
        logger.error('Email service configuration error:', error);
    } else {
        logger.info('Email service is ready to send messages');
        logger.info('SMTP Configuration:', {
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: process.env.SMTP_SECURE,
            user: process.env.EMAIL_USER,
            rejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED
        });
    }
});

// Send email to client
const sendClientConfirmation = async (appointment) => {
    logger.info('Preparing to send client confirmation email:', {
        to: appointment.email,
        name: `${appointment.firstName} ${appointment.lastName}`,
        date: appointment.startTime
    });

    const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME || 'AF_Barbershop'}" <${process.env.EMAIL_USER}>`,
        to: appointment.email,
        subject: 'Потвърждение за резервация - Фризьорски салон',
        html: `
            <h2>Потвърждение за резервация</h2>
            <p>Здравейте ${appointment.firstName} ${appointment.lastName},</p>
            <p>Вашата резервация е успешно направена за:</p>
            <p><strong>Дата:</strong> ${new Date(appointment.startTime).toLocaleDateString('bg-BG')}</p>
            <p><strong>Час:</strong> ${new Date(appointment.startTime).toLocaleTimeString('bg-BG')} - ${new Date(appointment.endTime).toLocaleTimeString('bg-BG')}</p>
            <p>Ако имате нужда от промяна на часа, моля свържете се с нас.</p>
            <p>Благодарим ви, че избрахте нашия салон!</p>
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
        throw error;
    }
};

// Send email to salon
const sendSalonNotification = async (appointment) => {
    logger.info('Preparing to send salon notification email:', {
        to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
        client: `${appointment.firstName} ${appointment.lastName}`,
        date: appointment.startTime
    });

    const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME || 'AF_Barbershop'}" <${process.env.EMAIL_USER}>`,
        to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
        subject: 'Нова резервация',
        html: `
            <h2>Нова резервация</h2>
            <p><strong>Клиент:</strong> ${appointment.firstName} ${appointment.lastName}</p>
            <p><strong>Имейл:</strong> ${appointment.email}</p>
            <p><strong>Телефон:</strong> ${appointment.phone}</p>
            <p><strong>Дата:</strong> ${new Date(appointment.startTime).toLocaleDateString('bg-BG')}</p>
            <p><strong>Час:</strong> ${new Date(appointment.startTime).toLocaleTimeString('bg-BG')} - ${new Date(appointment.endTime).toLocaleTimeString('bg-BG')}</p>
            <p><strong>Съобщение:</strong> ${appointment.message || 'Няма съобщение'}</p>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        logger.info('Salon notification email sent successfully:', {
            messageId: info.messageId,
            response: info.response
        });
        return info;
    } catch (error) {
        logger.error('Error sending salon notification email:', error);
        logger.error('Email configuration at time of error:', {
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: process.env.SMTP_SECURE,
            user: process.env.EMAIL_USER,
            hasPassword: !!process.env.EMAIL_PASS
        });
        throw error;
    }
};

module.exports = {
    sendClientConfirmation,
    sendSalonNotification
}; 