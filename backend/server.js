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
  ssl: true,
  tlsAllowInvalidCertificates: false
}).then(() => {
  console.log('Connected to MongoDB successfully');
}).catch((error) => {
  console.error('MongoDB connection error:', error.message);
  console.error('Error code:', error.code);
  console.error('Error name:', error.name);
  if (error.code === 8000) {
    console.error('Authentication failed. Please check your username and password in the .env file');
  }
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
      throw new Error('Instagram token is not configured in .env file');
    }

    console.log('Token length:', process.env.INSTAGRAM_TOKEN.length);
    
    // First, get the Instagram Business Account ID
    const accountResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${process.env.INSTAGRAM_TOKEN}`
    );
    
    const accountData = await accountResponse.json();
    console.log('Facebook Account Response:', JSON.stringify(accountData, null, 2));
    
    if (accountData.error) {
      throw new Error(`Facebook API error: ${accountData.error.message} (Code: ${accountData.error.code})`);
    }
    
    if (!accountData.data || accountData.data.length === 0) {
      throw new Error('No Facebook pages found');
    }
    
    const pageId = accountData.data[0].id;
    
    // Get Instagram Business Account ID
    const igAccountResponse = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}?fields=instagram_business_account&access_token=${process.env.INSTAGRAM_TOKEN}`
    );
    
    const igAccountData = await igAccountResponse.json();
    console.log('Instagram Account Response:', igAccountData);
    
    if (igAccountData.error) {
      throw new Error(`Instagram API error: ${igAccountData.error.message}`);
    }
    
    if (!igAccountData.instagram_business_account) {
      throw new Error('Instagram Business Account not connected. Please connect your Instagram account to your Facebook page.');
    }
    
    const igAccountId = igAccountData.instagram_business_account.id;
    
    // Get Instagram Media
    const mediaResponse = await fetch(
      `https://graph.facebook.com/v18.0/${igAccountId}/media?fields=id,caption,media_url,permalink&access_token=${process.env.INSTAGRAM_TOKEN}&limit=6`
    );
    
    const mediaData = await mediaResponse.json();
    console.log('Instagram Media Response:', mediaData);
    
    if (mediaData.error) {
      throw new Error(`Instagram Media API error: ${mediaData.error.message}`);
    }
    
    res.json(mediaData);
  } catch (error) {
    console.error('Instagram feed error:', error);
    res.status(500).json({ 
      error: 'Error fetching Instagram posts',
      details: error.message
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 