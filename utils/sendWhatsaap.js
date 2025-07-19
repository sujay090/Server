import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

export default async function sendWhatsApp(to, imageUrl) {
  try {
    const number = to.startsWith('+91') ? to : `91${to}`;
    const message = 'Testing send message through API';
    const token = process.env.MSGWAPI_TOKEN; // Put token in .env

    const url = `https://www.msgwapi.com/api/whatsapp/send?receiver=${number}&msgtext=${encodeURIComponent(message)}&token=${token}&mediaurl=${encodeURIComponent(imageUrl)}`;
// &mediaurl=${encodeURIComponent(imageUrl)}
    console.log('📤 Sending WhatsApp via msgwapi.com');
    console.log('➡️ URL:', url);

    const res = await axios.get(url);
    console.log('✅ Response:', res.data);

    if (!res.data.success) {
      throw new Error(res.data.message || 'Unknown error');
    }

    return res.data;
  } catch (error) {
    console.error('❌ Failed to send via msgwapi:', error.message);
    throw error;
  }
}
