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
const rateLimit = require('express-rate-limit');

const app = express();

// Trust proxy settings for proper IP detection (must be first)
app.set('trust proxy', 1);

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Basic middleware
app.use(cookieParser(process.env.COOKIE_SECRET || '931d91bc0db1d808102f4d1e5015ae21de196fdeeb632b6e9240b814a5b76009ecc25095af43f4219d8f2d0c7db5836d31dd7d4ac2eaf5f9f210c437aa383a86'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
const sessionConfig = {
    secret: process.env.SESSION_SECRET || 'salon_booking_secret_key_2024_secure_random_string_xyz789',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'lax'
    },
    name: 'sessionId', // Custom session name
    rolling: true, // Refresh session on every request
    unset: 'destroy', // Remove session when it expires
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        ttl: 24 * 60 * 60, // 24 hours
        autoRemove: 'native'
    }),
    // Add these options for better session handling
    proxy: true, // Trust the reverse proxy
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'lax',
        path: '/' // Ensure cookie is available for all paths
    }
};

// Apply session middleware first
app.use(session(sessionConfig));

// CORS configuration (adjusted origin settings)
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? 'https://afbarber-acdc6f830efb.herokuapp.com'
        : 'http://localhost:3000',
    credentials: true
}));

// Security middleware
app.use(securityHeaders);
app.use(limiter);

// CSRF Protection
const csrfProtection = csrf({
    cookie: {
        key: '_csrf',
        httpOnly: false, // Allow JavaScript to read this cookie
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        path: '/' // Ensure cookie is available for all paths
    }
});

// Apply CSRF middleware - SKIP FOR API ENDPOINTS TO DIAGNOSE ISSUES
app.use((req, res, next) => {
    // Skip CSRF for API requests during debugging
    if (req.path.startsWith('/api/')) {
        logger.info('=== Skipping CSRF for API endpoint ===', req.path);
        next();
    } else {
        csrfProtection(req, res, next);
    }
});

// Make CSRF token available to all views
app.use((req, res, next) => {
    try {
        // Skip for API routes during debugging
        if (req.path.startsWith('/api/')) {
            next();
            return;
        }
        
        // Check if CSRF protection is active for this route
        if (typeof req.csrfToken !== 'function') {
            // No CSRF function available - likely disabled for this route
            logger.info('CSRF token generation skipped for this route:', req.path);
            next();
            return;
        }
        
        const token = req.csrfToken();
        
        // Make token available to views
        res.locals.csrfToken = token;
        
        // Set CSRF token in response header for API requests
        res.setHeader('X-CSRF-Token', token);
        
        // Set CSRF token in cookie with proper settings
        res.cookie('_csrf', token, {
            httpOnly: false, // Make it accessible to JavaScript
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
            path: '/' // Ensure cookie is available for all paths
        });
        
        // Debug logging
        logger.info('=== CSRF Token Generation ===');
        logger.info('Generated Token:', token);
        logger.info('Token Set in Header:', res.getHeader('X-CSRF-Token'));
        logger.info('Token Set in Cookie:', res.getHeader('Set-Cookie'));
        logger.info('Token Set in Locals:', res.locals.csrfToken);
        logger.info('Session ID:', req.session.id);
        logger.info('Session:', JSON.stringify(req.session, null, 2));
        logger.info('Request Headers:', JSON.stringify(req.headers, null, 2));
        logger.info('Request Cookies:', JSON.stringify(req.cookies, null, 2));
        
        next();
    } catch (error) {
        logger.error('CSRF Middleware Error:', error);
        next(error);
    }
});

// Debug middleware
app.use((req, res, next) => {
    logger.info('=== Request Debug Info ===');
    logger.info(`Request: ${req.method} ${req.url}`);
    
    // Only log CSRF token if the function exists (it won't for API routes)
    if (typeof req.csrfToken === 'function') {
        logger.info('CSRF Token:', req.csrfToken());
    } else {
        logger.info('CSRF Token: Not available for this route (CSRF protection skipped)');
    }
    
    logger.info('Cookies:', JSON.stringify(req.cookies, null, 2));
    next();
});

// Routes
const reservationRoutes = require('./routes/reservationRoutes');
const availableSlotsRoutes = require('./routes/availableSlotsRoutes');
const authRoutes = require('./routes/authRoutes');

// Apply routes
app.use('/api/reservations', reservationRoutes);
app.use('/api/available-slots', availableSlotsRoutes);
app.use('/auth', authRoutes);

// Main route
app.get('/', (req, res) => {
    try {
        // Ensure CSRF token is available
        const csrfToken = typeof req.csrfToken === 'function' ? req.csrfToken() : 'CSRF_NOT_AVAILABLE';
        
        // Debug information for development
        const debug = process.env.NODE_ENV !== 'production' ? {
            sessionId: req.session.id,
            csrfToken: csrfToken,
            cookies: req.cookies
        } : null;
        
        res.render('index', {
            csrfToken: csrfToken,
            debug: debug
        });
    } catch (error) {
        logger.error('Error rendering index page:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Add dedicated CSRF token endpoint with rate limiting
const csrfLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

app.get('/csrf-token', csrfLimiter, (req, res) => {
    try {
        // Check if CSRF protection is active for this route
        if (typeof req.csrfToken !== 'function') {
            return res.status(200).json({ 
                csrfToken: 'DISABLED_FOR_DEVELOPMENT',
                mode: 'CSRF protection disabled for this environment'
            });
        }
        
        const token = req.csrfToken();
        logger.info('=== CSRF Token Endpoint ===');
        logger.info('Generated Token:', token);
        logger.info('Session ID:', req.session.id);
        logger.info('Session:', JSON.stringify(req.session, null, 2));
        logger.info('Request Headers:', JSON.stringify(req.headers, null, 2));
        logger.info('Request Cookies:', JSON.stringify(req.cookies, null, 2));
        
        // Set token in cookie
        res.cookie('_csrf', token, {
            httpOnly: false, // Make it accessible to JavaScript
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
            path: '/' // Ensure cookie is available for all paths
        });
        
        res.json({ csrfToken: token });
    } catch (error) {
        logger.error('Error generating CSRF token:', error);
        res.status(500).json({ error: 'Failed to generate CSRF token' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error('Error:', err);
    
    if (err.code === 'EBADCSRFTOKEN') {
        logger.error('CSRF Error Details:', {
            headers: req.headers,
            cookies: req.cookies,
            body: req.body,
            session: req.session,
            url: req.originalUrl,
            method: req.method
        });
        
        // Generate a new CSRF token if the function is available
        let newToken = null;
        if (typeof req.csrfToken === 'function') {
            try {
                newToken = req.csrfToken();
            } catch (tokenError) {
                logger.error('Error generating new CSRF token:', tokenError);
            }
        }
        
        // For API requests, return JSON response
        if (req.xhr || req.path.startsWith('/api/')) {
            return res.status(403).json({
                error: 'Security token expired. Please try again.',
                newToken: newToken
            });
        }
        
        // For regular requests, redirect with error message
        req.flash && req.flash('error', 'Security token missing or invalid. Please try again.');
        return res.redirect('back');
    }
    
    // For API requests, return JSON error
    if (req.xhr || req.path.startsWith('/api/')) {
        return res.status(500).json({
            error: 'An internal server error occurred. Please try again later.'
        });
    }
    
    // For normal requests, pass to Express's default error handler
    next(err);
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