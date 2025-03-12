const { oauth2Client } = require('../config/googleCalendar');

const checkAuth = (req, res, next) => {
  if (!req.session.tokens) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Set the credentials for this request
  oauth2Client.setCredentials(req.session.tokens);
  next();
};

module.exports = {
  checkAuth
}; 