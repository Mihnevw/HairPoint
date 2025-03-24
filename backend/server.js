const express = require('express');
const fetch = require('node-fetch');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000 // Timeout after 5s instead of 30s
}).then(() => {
  console.log('Connected to MongoDB successfully');
}).catch((error) => {
  console.error('MongoDB connection error:', error.message);
  if (error.code === 8000) {
    console.error('Authentication failed. Please check your MongoDB credentials');
  } else if (error.code === 'ECONNREFUSED') {
    console.error('Could not connect to MongoDB. Please check if the server is running and accessible');
  }
  // Don't exit the process, let the app continue running
});

// Add error handler for MongoDB connection
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

// Add disconnection handler
mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected. Attempting to reconnect...');
  setTimeout(() => {
    mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    });
  }, 5000);
});

// Contact Schema
const contactSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  message: String,
  createdAt: { type: Date, default: Date.now }
});

const Contact = mongoose.model('Contact', contactSchema);

// Routes
app.post('/api/contact', async (req, res) => {
  try {
    const contact = new Contact(req.body);
    await contact.save();
    res.status(201).json({ message: 'Contact form submitted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error submitting contact form' });
  }
});

// Instagram Feed
app.get('/instagram-feed', async (req, res) => {
  try {
    if (!process.env.INSTAGRAM_TOKEN) {
      console.error('Instagram token is not configured');
      return res.json({ data: [] });
    }

    // First, get the Instagram Business Account ID
    const accountResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${process.env.INSTAGRAM_TOKEN}`
    );
    
    const accountData = await accountResponse.json();
    
    if (accountData.error) {
      console.error('Facebook API error:', accountData.error);
      if (accountData.error.code === 190) {
        console.error('Token expired or invalid');
      }
      return res.json({ data: [] });
    }
    
    if (!accountData.data || accountData.data.length === 0) {
      console.error('No Facebook pages found');
      return res.json({ data: [] });
    }
    
    const pageId = accountData.data[0].id;
    
    // Get Instagram Business Account ID
    const igAccountResponse = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}?fields=instagram_business_account&access_token=${process.env.INSTAGRAM_TOKEN}`
    );
    
    const igAccountData = await igAccountResponse.json();
    
    if (igAccountData.error) {
      console.error('Instagram API error:', igAccountData.error);
      return res.json({ data: [] });
    }
    
    if (!igAccountData.instagram_business_account) {
      console.error('Instagram Business Account not connected');
      return res.json({ data: [] });
    }
    
    const igAccountId = igAccountData.instagram_business_account.id;
    
    // Get Instagram Media with error handling
    const mediaResponse = await fetch(
      `https://graph.facebook.com/v18.0/${igAccountId}/media?fields=id,caption,media_url,permalink&access_token=${process.env.INSTAGRAM_TOKEN}&limit=6`
    );
    
    const mediaData = await mediaResponse.json();
    
    if (mediaData.error) {
      console.error('Instagram Media API error:', mediaData.error);
      return res.json({ data: [] });
    }
    
    // Cache the response for 1 hour
    res.set('Cache-Control', 'public, max-age=3600');
    res.json(mediaData);
  } catch (error) {
    console.error('Instagram feed error:', error);
    res.json({ data: [] });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  const status = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  };
  res.json(status);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 