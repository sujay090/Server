import express from 'express';
import sendWhatsApp from '../utils/sendWhatsaap.js';

const router = express.Router();

// Test WhatsApp sending
router.post('/whatsapp', async (req, res) => {
  try {
    const { phoneNumber, imageUrl } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({ 
        success: false, 
        message: 'Phone number is required' 
      });
    }

    const testImageUrl = imageUrl || 'https://www.msgwapi.com/users/1/avatar.png';
    
    console.log('🧪 Testing WhatsApp send...');
    console.log('📱 Phone:', phoneNumber);
    console.log('🖼️ Image:', testImageUrl);
    
    const result = await sendWhatsApp(phoneNumber, testImageUrl);
    
    res.json({
      success: true,
      message: 'WhatsApp message sent successfully',
      result: result
    });
    
  } catch (error) {
    console.error('❌ Test WhatsApp failed:', error.message);
    res.status(500).json({
      success: false,
      message: error.message,
      error: error.toString()
    });
  }
});

// Check environment variables
router.get('/env-check', (req, res) => {
  res.json({
    hasToken: !!process.env.MSGWAPI_TOKEN,
    hasWhatsappToken: !!process.env.WHATSAPP_API_TOKEN,
    baseUrl: process.env.BASE_URL,
    serverUrl: process.env.SERVER_URL,
    tokenLastFour: process.env.MSGWAPI_TOKEN ? 
      '***' + process.env.MSGWAPI_TOKEN.slice(-4) : 'Not found'
  });
});

export default router;
