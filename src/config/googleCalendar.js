const { google } = require('googleapis');
const logger = require('../utils/logger');

// Verify required environment variables
const requiredEnvVars = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GOOGLE_REDIRECT_URI',
    'GOOGLE_CALENDAR_ID'
];

requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
        logger.error(`Missing required environment variable: ${varName}`);
        throw new Error(`Missing required environment variable: ${varName}`);
    }
});

// OAuth2 configuration
const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

// Log OAuth2 configuration (without sensitive data)
logger.info('OAuth2 configuration initialized with redirect URI:', process.env.GOOGLE_REDIRECT_URI);

// Google Calendar API configuration
const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

// Generate authentication URL
function getAuthUrl() {
    const scopes = [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/calendar.readonly'
    ];

    const state = Buffer.from(JSON.stringify({
        timestamp: Date.now(),
        redirectUri: process.env.GOOGLE_REDIRECT_URI
    })).toString('base64');

    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        prompt: 'consent',
        state: state,
        include_granted_scopes: true
    });
}

// Handle OAuth2 callback
async function handleCallback(code, state) {
    try {
        if (!code) {
            logger.error('No authorization code provided');
            throw new Error('No authorization code provided');
        }

        logger.info('Attempting to exchange authorization code for tokens');
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);
        logger.info('Successfully obtained tokens');
        
        return tokens;
    } catch (error) {
        logger.error('Error getting tokens:', error);
        throw error;
    }
}

// Refresh access token
async function refreshAccessToken(refreshToken) {
    try {
        if (!refreshToken) {
            throw new Error('No refresh token provided');
        }

        oauth2Client.setCredentials({
            refresh_token: refreshToken
        });
        const { credentials } = await oauth2Client.refreshAccessToken();
        return credentials;
    } catch (error) {
        logger.error('Error refreshing access token:', error);
        throw error;
    }
}

// Get calendar events
async function getCalendarEvents(startTime, endTime) {
    try {
        const response = await calendar.events.list({
            calendarId: process.env.GOOGLE_CALENDAR_ID,
            timeMin: startTime,
            timeMax: endTime,
            singleEvents: true,
            orderBy: 'startTime'
        });
        return response.data.items;
    } catch (error) {
        logger.error('Error fetching calendar events:', error);
        throw error;
    }
}

// Create calendar event
async function createCalendarEvent(event) {
    try {
        const response = await calendar.events.insert({
            calendarId: process.env.GOOGLE_CALENDAR_ID,
            resource: event
        });
        return response.data;
    } catch (error) {
        logger.error('Error creating calendar event:', error);
        throw error;
    }
}

module.exports = {
    oauth2Client,
    getAuthUrl,
    handleCallback,
    refreshAccessToken,
    getCalendarEvents,
    createCalendarEvent
}; 