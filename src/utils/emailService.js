const nodemailer = require('nodemailer');

// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS  // Using EMAIL_PASS as defined in your .env
    }
});

// Send email to client
const sendClientConfirmation = async (appointment) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: appointment.email,
        subject: 'Потвърждение за резервация - Фризьорски салон',
        html: `
            <h2>Потвърждение за резервация</h2>
            <p>Здравейте ${appointment.name},</p>
            <p>Вашата резервация е успешно направена за:</p>
            <p><strong>Дата:</strong> ${new Date(appointment.startTime).toLocaleDateString()}</p>
            <p><strong>Час:</strong> ${new Date(appointment.startTime).toLocaleTimeString()}</p>
            <p>Ако имате нужда от промяна на часа, моля свържете се с нас.</p>
            <p>Благодарим ви, че избрахте нашия салон!</p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Client confirmation email sent successfully');
    } catch (error) {
        console.error('Error sending client confirmation email:', error);
        throw error;
    }
};

// Send email to salon
const sendSalonNotification = async (appointment) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER, // Send salon notifications to the same email
        subject: 'Нова резервация',
        html: `
            <h2>Нова резервация</h2>
            <p><strong>Клиент:</strong> ${appointment.name}</p>
            <p><strong>Имейл:</strong> ${appointment.email}</p>
            <p><strong>Телефон:</strong> ${appointment.phone}</p>
            <p><strong>Дата:</strong> ${new Date(appointment.startTime).toLocaleDateString()}</p>
            <p><strong>Час:</strong> ${new Date(appointment.startTime).toLocaleTimeString()}</p>
            <p><strong>Съобщение:</strong> ${appointment.message || 'Няма съобщение'}</p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Salon notification email sent successfully');
    } catch (error) {
        console.error('Error sending salon notification email:', error);
        throw error;
    }
};

module.exports = {
    sendClientConfirmation,
    sendSalonNotification
}; 