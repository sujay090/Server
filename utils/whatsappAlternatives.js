import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Alternative WhatsApp APIs to try if msgwapi.com is not working
 */

// WhatsApp Web API (if you have a different service)
export const sendViaWhatsAppWeb = async (phoneNumber, message, imageUrl) => {
  try {
    // This is a placeholder for other WhatsApp API services
    // You can replace this with services like:
    // - Twilio WhatsApp API
    // - ChatAPI
    // - WhatsMate
    // - UltraMsg
    
    const response = await axios.post('https://api.whatsapp.com/send', {
      phone: phoneNumber,
      message: message,
      media: imageUrl
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_WEB_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    throw new Error(`WhatsApp Web API failed: ${error.message}`);
  }
};

// Twilio WhatsApp API
export const sendViaTwilio = async (phoneNumber, message, imageUrl) => {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_WHATSAPP_FROM; // whatsapp:+14155238886
    
    if (!accountSid || !authToken || !fromNumber) {
      throw new Error('Twilio credentials not configured');
    }
    
    const client = require('twilio')(accountSid, authToken);
    
    const messageData = {
      from: fromNumber,
      to: `whatsapp:+${phoneNumber}`,
      body: message
    };
    
    if (imageUrl) {
      messageData.mediaUrl = [imageUrl];
    }
    
    const response = await client.messages.create(messageData);
    return response;
    
  } catch (error) {
    throw new Error(`Twilio WhatsApp API failed: ${error.message}`);
  }
};

// ChatAPI service
export const sendViaChatAPI = async (phoneNumber, message, imageUrl) => {
  try {
    const token = process.env.CHATAPI_TOKEN;
    const instanceId = process.env.CHATAPI_INSTANCE_ID;
    
    if (!token || !instanceId) {
      throw new Error('ChatAPI credentials not configured');
    }
    
    const url = `https://api.chat-api.com/instance${instanceId}/sendFile?token=${token}`;
    
    const data = {
      phone: phoneNumber,
      body: imageUrl,
      filename: 'poster.png',
      caption: message
    };
    
    const response = await axios.post(url, data);
    return response.data;
    
  } catch (error) {
    throw new Error(`ChatAPI failed: ${error.message}`);
  }
};

// UltraMsg API
export const sendViaUltraMsg = async (phoneNumber, message, imageUrl) => {
  try {
    const token = process.env.ULTRAMSG_TOKEN;
    const instanceId = process.env.ULTRAMSG_INSTANCE_ID;
    
    if (!token || !instanceId) {
      throw new Error('UltraMsg credentials not configured');
    }
    
    const url = `https://api.ultramsg.com/${instanceId}/messages/image`;
    
    const data = new URLSearchParams({
      token: token,
      to: phoneNumber,
      image: imageUrl,
      caption: message
    });
    
    const response = await axios.post(url, data, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    return response.data;
    
  } catch (error) {
    throw new Error(`UltraMsg failed: ${error.message}`);
  }
};

// Enhanced msgwapi with different approaches
export const sendViaMsgWAPIAlternative = async (phoneNumber, message, imageUrl) => {
  try {
    const token = process.env.MSGWAPI_TOKEN;
    
    if (!token) {
      throw new Error('MSGWAPI token not found');
    }
    
    // Try POST method instead of GET
    const response = await axios.post('https://www.msgwapi.com/api/whatsapp/send', {
      receiver: phoneNumber,
      msgtext: message,
      token: token,
      mediaurl: imageUrl
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 30000
    });
    
    return response.data;
    
  } catch (error) {
    throw new Error(`MSGWAPI Alternative failed: ${error.message}`);
  }
};

// Fallback to simple HTTP request
export const sendViaSimpleHTTP = async (phoneNumber, message, imageUrl) => {
  try {
    // Sometimes APIs work better with simple HTTP requests
    const token = process.env.MSGWAPI_TOKEN;
    const url = `https://www.msgwapi.com/api/whatsapp/send`;
    
    const params = new URLSearchParams({
      receiver: phoneNumber,
      msgtext: message,
      token: token,
      mediaurl: imageUrl
    });
    
    const response = await fetch(`${url}?${params}`, {
      method: 'GET',
      headers: {
        'User-Agent': 'PostersApp/1.0'
      }
    });
    
    const data = await response.json();
    return data;
    
  } catch (error) {
    throw new Error(`Simple HTTP failed: ${error.message}`);
  }
};

export default {
  sendViaWhatsAppWeb,
  sendViaTwilio,
  sendViaChatAPI,
  sendViaUltraMsg,
  sendViaMsgWAPIAlternative,
  sendViaSimpleHTTP
};
