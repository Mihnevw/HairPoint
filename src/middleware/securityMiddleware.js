const rateLimit = require('express-rate-limit');
const csrf = require('csurf');
const logger = require('../utils/logger');
const helmet = require('helmet');

// Rate limiting configuration
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    // Add trusted proxy configuration
    trustProxy: true,
    // Custom key generator to handle various IP scenarios
    keyGenerator: (req) => {
        return req.ip || 
               req.headers['x-forwarded-for'] || 
               req.headers['x-real-ip'] ||
               req.connection.remoteAddress ||
               '127.0.0.1';
    }
});

// CSRF protection
const csrfProtection = csrf({
    cookie: {
        key: '_csrf',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    }
});

// Security headers middleware
const securityHeaders = (req, res, next) => {
    // Basic security headers
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    // Cross-Origin-Resource-Policy header
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    
    // Cross-Origin-Embedder-Policy header
    res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
    
    // Cross-Origin-Opener-Policy header
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    
    // Generate a nonce for inline scripts
    const nonce = Buffer.from(Math.random().toString()).toString('base64');
    res.locals.nonce = nonce;
    
    // Content Security Policy with nonce
    res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; " +
        "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; " +
        "img-src 'self' data: https:; " +
        "font-src 'self' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; " +
        "connect-src 'self' https://www.googleapis.com; " +
        "frame-src 'self' https://www.google.com; " +
        "base-uri 'self'; " +
        "form-action 'self'; " +
        "frame-ancestors 'none'; " +
        "object-src 'none';"
    );

    // Remove X-Content-Type-Options to allow CDN resources
    res.removeHeader('X-Content-Type-Options');

    next();
};

function setupSecurityMiddleware(app) {
    // Basic security headers
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "cdn.jsdelivr.net", "cdnjs.cloudflare.com"],
                styleSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net", "cdnjs.cloudflare.com"],
                imgSrc: ["'self'", "data:", "blob:", "https:"],
                fontSrc: ["'self'", "data:", "https:", "cdnjs.cloudflare.com"],
                connectSrc: ["'self'", "https://www.googleapis.com", "https://oauth2.googleapis.com"],
                frameSrc: ["'none'"],
                objectSrc: ["'none'"],
                formAction: ["'self'"],
                frameAncestors: ["'none'"]
            }
        },
        crossOriginEmbedderPolicy: false,
        crossOriginResourcePolicy: { policy: "cross-origin" },
        crossOriginOpenerPolicy: { policy: "same-origin" },
        referrerPolicy: { policy: "strict-origin-when-cross-origin" },
        xContentTypeOptions: false // Disable X-Content-Type-Options to allow CDN resources
    }));

    // Additional security headers
    app.use((req, res, next) => {
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        next();
    });
}

module.exports = {
    limiter,
    csrfProtection,
    securityHeaders,
    setupSecurityMiddleware
}; 