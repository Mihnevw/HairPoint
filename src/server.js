require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cookieParser = require('cookie-parser');
const csrf = require('csurf');
const { limiter, securityHeaders } = require('./middleware/securityMiddleware');
const logger = require('./utils/logger');

const app = express();

// Trust proxy settings for proper IP detection (must be first)
app.set('trust proxy', 1);

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Basic middleware
app.use(cookieParser(process.env.COOKIE_SECRET || 'your-cookie-secret'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// CORS configuration
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'salon_booking_secret_key_2024_secure_random_string_xyz789',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/salon-reservation',
        ttl: 24 * 60 * 60 // 1 day
    }),
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 1 day
    }
}));

// Security middleware
app.use(securityHeaders);
app.use(limiter);

// Debug middleware
app.use((req, res, next) => {
    logger.info('=== Request Debug Info ===');
    logger.info(`Request: ${req.method} ${req.url}`);
    logger.info('Headers:', JSON.stringify(req.headers, null, 2));
    logger.info('Cookies:', JSON.stringify(req.cookies, null, 2));
    logger.info('Session ID:', req.sessionID);
    logger.info('Session Data:', JSON.stringify(req.session, null, 2));
    next();
});

// CSRF Protection with debug logging
app.use(csrf({ 
    cookie: {
        key: '_csrf',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
    }
}));

// Make CSRF token available to all views
app.use((req, res, next) => {
    try {
        const token = req.csrfToken();
        // Make token available to views
        res.locals.csrfToken = token;
        
        // Debug logging
        logger.info('=== CSRF Debug Info ===');
        logger.info('New CSRF Token Generated:', token);
        logger.info('CSRF Cookie:', req.cookies['_csrf']);
        logger.info('Session CSRF:', req.session._csrf);
        logger.info('Headers:', {
            'csrf-token': req.headers['csrf-token'],
            'x-csrf-token': req.headers['x-csrf-token'],
            'xsrf-token': req.headers['xsrf-token']
        });
        
        // Set CSRF token in cookie and header
        res.cookie('XSRF-TOKEN', token, {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        });
        next();
    } catch (error) {
        logger.error('CSRF Middleware Error:', error);
        next(error);
    }
});

// Main route to serve the index page
app.get('/', (req, res) => {
    try {
        const token = req.csrfToken();
        logger.info('=== Index Route Debug Info ===');
        logger.info('Generated CSRF token for index:', token);
        logger.info('Current Session ID:', req.sessionID);
        logger.info('Current Session:', JSON.stringify(req.session, null, 2));
        logger.info('Current Cookies:', JSON.stringify(req.cookies, null, 2));
        
        res.render('index', { 
            csrfToken: token,
            debug: process.env.NODE_ENV !== 'production' ? {
                sessionId: req.sessionID,
                csrfToken: token,
                cookies: req.cookies
            } : null
        });
    } catch (error) {
        logger.error('Error in index route:', error);
        res.status(500).json({
            error: 'Error generating security token',
            debug: process.env.NODE_ENV === 'development' ? {
                message: error.message,
                stack: error.stack
            } : undefined
        });
    }
});

// Routes
const reservationRoutes = require('./routes/reservationRoutes');
const availableSlotsRoutes = require('./routes/availableSlotsRoutes');
const authRoutes = require('./routes/authRoutes');

app.use('/api/reservations', reservationRoutes);
app.use('/api/available-slots', availableSlotsRoutes);
app.use('/auth', authRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error('Error:', err);
    logger.error('Stack:', err.stack);
    
    if (err.code === 'EBADCSRFTOKEN') {
        logger.error('CSRF Error Details:', {
            headers: req.headers,
            cookies: req.cookies,
            body: req.body,
            session: req.session,
            expectedToken: req.cookies['_csrf'],
            receivedToken: req.headers['csrf-token'] || req.headers['x-csrf-token'] || req.body._csrf
        });
        return res.status(403).json({
            error: 'Invalid CSRF token',
            message: 'Please refresh the page and try again',
            debug: process.env.NODE_ENV === 'development' ? {
                expectedToken: req.cookies['_csrf'],
                receivedToken: req.headers['csrf-token'] || req.headers['x-csrf-token'] || req.body._csrf
            } : undefined
        });
    }

    res.status(500).json({
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

const startServer = async (port) => {
    try {
        const portNumber = parseInt(port, 10);
        
        if (isNaN(portNumber) || portNumber < 0 || portNumber > 65535) {
            throw new Error(`Invalid port number: ${port}`);
        }

        await new Promise((resolve, reject) => {
            const server = app.listen(portNumber)
                .on('listening', () => {
                    logger.info(`Server is running on port ${portNumber}`);
                    logger.info(`Environment: ${process.env.NODE_ENV}`);
                    resolve();
                })
                .on('error', (err) => {
                    if (err.code === 'EADDRINUSE') {
                        logger.info(`Port ${portNumber} is busy, trying ${portNumber + 1}...`);
                        server.close();
                        startServer(portNumber + 1);
                    } else {
                        reject(err);
                    }
                });
        });
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

const PORT = parseInt(process.env.PORT, 10) || 3000;
startServer(PORT); 