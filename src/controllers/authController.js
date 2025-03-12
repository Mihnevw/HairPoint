const { getAuthUrl, handleCallback: handleGoogleCallback, refreshAccessToken } = require('../config/googleCalendar');
const logger = require('../utils/logger');
const { google } = require('googleapis');
const OAuth2 = google.auth.OAuth2;

// Initialize OAuth2 client
const oauth2Client = new OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

// Initiate Google OAuth flow
const initiateAuth = (req, res) => {
    try {
        const authUrl = getAuthUrl();
        logger.info('Initiating Google OAuth flow');
        res.redirect(authUrl);
    } catch (error) {
        logger.error('Error initiating auth:', error);
        res.status(500).json({ error: 'Failed to initiate authentication' });
    }
};

// Handle Google OAuth callback
const handleCallback = async (req, res) => {
    try {
        const { code, state } = req.query;
        
        if (!code) {
            logger.error('No authorization code provided in callback');
            return res.status(400).json({ error: 'No authorization code provided' });
        }

        if (!state) {
            logger.error('No state parameter provided in callback');
            return res.status(400).json({ error: 'No state parameter provided' });
        }

        // Validate state parameter
        try {
            const decodedState = JSON.parse(Buffer.from(state, 'base64').toString());
            const { timestamp, redirectUri } = decodedState;
            
            // Check if the state is not expired (15 minutes)
            if (Date.now() - timestamp > 15 * 60 * 1000) {
                logger.error('State parameter expired');
                return res.status(400).json({ error: 'Authentication expired, please try again' });
            }

            // Verify redirect URI matches
            if (redirectUri !== process.env.GOOGLE_REDIRECT_URI) {
                logger.error('Invalid redirect URI in state');
                return res.status(400).json({ error: 'Invalid authentication request' });
            }
        } catch (error) {
            logger.error('Invalid state parameter:', error);
            return res.status(400).json({ error: 'Invalid authentication request' });
        }

        const tokens = await handleGoogleCallback(code, state);
        
        // Store tokens in session
        req.session.tokens = tokens;
        req.session.save((err) => {
            if (err) {
                logger.error('Error saving session:', err);
                return res.status(500).json({ error: 'Failed to save session' });
            }
            
            // Redirect back to the main page
            logger.info('OAuth callback successful, redirecting to main page');
            res.redirect('/');
        });
    } catch (error) {
        logger.error('Error handling callback:', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
};

// Refresh access token
const refreshToken = async (req, res) => {
    try {
        const { refresh_token } = req.session.tokens;
        if (!refresh_token) {
            logger.error('No refresh token available in session');
            return res.status(401).json({ error: 'No refresh token available' });
        }

        const tokens = await refreshAccessToken(refresh_token);
        req.session.tokens = tokens;
        req.session.save((err) => {
            if (err) {
                logger.error('Error saving session after token refresh:', err);
                return res.status(500).json({ error: 'Failed to save session' });
            }
            res.json({ success: true });
        });
    } catch (error) {
        logger.error('Error refreshing token:', error);
        res.status(500).json({ error: 'Failed to refresh token' });
    }
};

// Fetch events from Google Calendar
const fetchEvents = async (req, res) => {
    if (!req.session.tokens) {
        return res.status(401).send('Not authenticated');
    }

    oauth2Client.setCredentials(req.session.tokens);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    try {
        const response = await calendar.events.list({
            calendarId: process.env.GOOGLE_CALENDAR_ID,
            timeMin: new Date().toISOString(),
            maxResults: 10,
            singleEvents: true,
            orderBy: 'startTime',
        });

        const events = response.data.items.map(event => ({
            title: event.summary,
            start: event.start.dateTime || event.start.date,
            end: event.end.dateTime || event.end.date,
        }));

        res.json(events);
    } catch (error) {
        console.error('Error fetching events', error);
        res.status(500).send('Error fetching events');
    }
};

module.exports = {
    initiateAuth,
    handleCallback,
    refreshToken,
    fetchEvents
}; 