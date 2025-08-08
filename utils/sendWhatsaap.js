import axios from 'axios';
import dotenv from 'dotenv';
import { sendViaMsgWAPIAlternative, sendViaSimpleHTTP } from './whatsappAlternatives.js';
dotenv.config();

export default async function sendWhatsApp(to, imageUrl) {
  try {
    // Clean phone number format
    let number = to.toString().replace(/\D/g, ''); // Remove non-digits
    
    // Add country code if not present
    if (!number.startsWith('91') && number.length === 10) {
      number = `91${number}`;
    }
    
    const message = 'Your marketing poster is ready! 🎨✨';
    const token = process.env.MSGWAPI_TOKEN || process.env.WHATSAPP_API_TOKEN;

    if (!token) {
      throw new Error('WhatsApp API token not found in environment variables');
    }

    // Try multiple API endpoints for better reliability
    const apiEndpoints = [
      {
        name: 'msgwapi.com',
        url: `https://www.msgwapi.com/api/whatsapp/send?receiver=${number}&msgtext=${encodeURIComponent(message)}&token=${token}&mediaurl=${encodeURIComponent(imageUrl)}`,
        method: 'GET'
      },
      {
        name: 'msgwapi.com (POST)',
        url: 'https://www.msgwapi.com/api/whatsapp/send',
        method: 'POST',
        data: {
          receiver: number,
          msgtext: message,
          token: token,
          mediaurl: imageUrl
        }
      }
    ];

    console.log('📤 Sending WhatsApp message');
    console.log('📱 Phone Number:', number);
    console.log('🖼️ Image URL:', imageUrl);
    console.log('� Token:', token ? '***' + token.slice(-4) : 'Not found');

    let lastError = null;

    // Try each API endpoint
    for (let i = 0; i < apiEndpoints.length; i++) {
      const endpoint = apiEndpoints[i];
      
      try {
        console.log(`🔄 Attempting ${endpoint.name} (${i + 1}/${apiEndpoints.length})`);
        
        let response;
        if (endpoint.method === 'GET') {
          console.log('➡️ GET URL:', endpoint.url);
          response = await axios.get(endpoint.url, {
            timeout: 30000, // 30 seconds timeout
            headers: {
              'User-Agent': 'PostersApp/1.0',
              'Accept': 'application/json'
            }
          });
        } else {
          console.log('➡️ POST URL:', endpoint.url);
          console.log('➡️ POST Data:', endpoint.data);
          response = await axios.post(endpoint.url, endpoint.data, {
            timeout: 30000,
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'User-Agent': 'PostersApp/1.0',
              'Accept': 'application/json'
            }
          });
        }

        console.log('✅ Response from', endpoint.name, ':', response.data);

        // Check if the response indicates success
        if (response.data && response.data.success !== false) {
          // Success! Return the response
          return response.data;
        } else if (response.data && response.data.success === false) {
          // API returned failure but we got a response
          lastError = new Error(response.data.message || `${endpoint.name} API returned failure`);
          console.log(`⚠️ ${endpoint.name} returned failure:`, response.data.message);
          continue; // Try next endpoint
        } else {
          // Unexpected response format
          lastError = new Error(`Unexpected response format from ${endpoint.name}`);
          console.log(`⚠️ Unexpected response from ${endpoint.name}:`, response.data);
          continue;
        }
        
      } catch (error) {
        lastError = error;
        console.log(`❌ Failed with ${endpoint.name}:`, error.message);
        
        if (error.response) {
          console.log('Response status:', error.response.status);
          console.log('Response data:', error.response.data);
        }
        
        // If this is the last endpoint, we'll throw the error
        if (i === apiEndpoints.length - 1) {
          break;
        }
        
        console.log(`🔄 Trying next API endpoint...`);
      }
    }

    // If we get here, all endpoints failed
    throw lastError || new Error('All WhatsApp API endpoints failed');

  } catch (error) {
    console.error('❌ Complete WhatsApp send failure:', error.message);
    
    // Log additional debugging info
    console.error('📋 Debug Info:');
    console.error('   Phone:', to);
    console.error('   Image URL:', imageUrl);
    console.error('   Token available:', !!process.env.MSGWAPI_TOKEN);
    
    throw error;
  }
}
