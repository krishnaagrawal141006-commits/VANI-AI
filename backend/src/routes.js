import express from 'express';
import twilio from 'twilio';
import { triggerOutboundDial } from './twilio-stream.js';

export const router = express.Router();

// Mock call logs to give a rich dashboard feel right from the beginning
let callLogs = [
  {
    id: "call_101",
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
    duration: 124, // seconds
    phone: "+91 98765 43210",
    status: "Completed",
    sentiment: "Positive",
    transcript: "Customer: Table book karni hai 4 baje. Agent: Ji ho jayegi, 4 baje table reserved hai. Customer: Thank you! Agent: Have a good meal!"
  },
  {
    id: "call_102",
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(), // 5 hours ago
    duration: 78,
    phone: "+91 98123 45678",
    status: "Completed",
    sentiment: "Neutral",
    transcript: "Customer: Menu me kya kya specials hain aaj? Agent: Sir aaj humare paas special Shahi Paneer aur Garlic Naan hai. Customer: Theek hai main check karta hoon."
  },
  {
    id: "call_103",
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(), // 1 day ago
    duration: 45,
    phone: "+91 90000 11111",
    status: "Failed",
    sentiment: "Negative",
    transcript: "Customer: Hello? Aawaz nahi aa rahi... Hello? Agent: Hello sir, main aapki kya madad kar sakta hoon? Customer: (Cuts call)"
  }
];

// 1. Twilio Incoming HTTP Webhook
// Twilio call aane par is route par hit karega aur TwiML fetch karega
router.post('/twilio/incoming', (req, res) => {
  console.log('[Twilio Webhook] Incoming call received.');
  res.type('text/xml');
  
  // Dynamic websocket URL based on req host (works out of the box with ngrok!)
  const host = req.headers.host;
  const fromNumber = req.body.From || 'Unknown';
  const responseXml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Pause length="1"/>
  <Connect>
    <Stream url="wss://${host}/media-stream?phone=${encodeURIComponent(fromNumber)}" />
  </Connect>
</Response>`;
  res.send(responseXml);
});

// 2. Fetch Call Stats
router.get('/stats', (req, res) => {
  const completedCalls = callLogs.filter(log => log.status === 'Completed');
  const totalDuration = completedCalls.reduce((acc, curr) => acc + curr.duration, 0);
  const avgDuration = completedCalls.length > 0 ? Math.round(totalDuration / completedCalls.length) : 0;
  const successRate = callLogs.length > 0 
    ? Math.round((callLogs.filter(log => log.sentiment === 'Positive' || log.sentiment === 'Neutral').length / callLogs.length) * 100)
    : 0;

  res.json({
    totalCalls: callLogs.length,
    activeCalls: 0, // Will be updated dynamically in frontend
    avgDuration: `${avgDuration}s`,
    successRate: `${successRate}%`
  });
});

// 3. Fetch Call Logs
router.get('/logs', (req, res) => {
  res.json(callLogs);
});

// 4. Save new Call Log (from backend streaming handler)
router.post('/logs', (req, res) => {
  const { phone, duration, sentiment, transcript, status } = req.body;
  const newLog = {
    id: `call_${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    duration: duration || 0,
    phone: phone || "Unknown",
    status: status || "Completed",
    sentiment: sentiment || "Neutral",
    transcript: transcript || ""
  };
  callLogs.unshift(newLog);
  res.status(201).json(newLog);
});

// Helper to dynamically get the public server URL (checking for local ngrok tunnels first)
async function getPublicUrl(req) {
  // 1. Prioritize request host header to support dynamic tunnels like Serveo out-of-the-box
  if (req && req.headers.host) {
    const host = req.headers.host;
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const resolvedUrl = `${protocol}://${host}`;
    console.log(`[Twilio Outbound] Dynamically resolved URL from Host header: ${resolvedUrl}`);
    return resolvedUrl;
  }

  if (process.env.PUBLIC_URL) {
    console.log(`[Twilio Outbound] Using configured PUBLIC_URL override: ${process.env.PUBLIC_URL}`);
    return process.env.PUBLIC_URL;
  }
  try {
    const response = await fetch('http://127.0.0.1:4040/api/tunnels');
    if (response.ok) {
      const data = await response.json();
      const publicUrl = data.tunnels?.[0]?.public_url;
      if (publicUrl) {
        console.log(`[Twilio Outbound] Discovered active ngrok public URL: ${publicUrl}`);
        return publicUrl;
      }
    }
  } catch (err) {
    console.log('[Twilio Outbound] Ngrok local API not reachable. Using fallback.');
  }
  
  const host = req ? (req.headers.host || 'localhost:5050') : 'localhost:5050';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  return `${protocol}://${host}`;
}

// 5. Trigger Twilio Outbound Call
router.post('/twilio/outbound', async (req, res) => {
  const { toPhone } = req.body;
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    console.error('[Twilio Outbound] Missing Twilio credentials!');
    return res.status(400).json({ 
      success: false, 
      error: "Twilio credentials (Account SID / Auth Token) are missing in server .env!" 
    });
  }

  try {
    const client = twilio(accountSid, authToken);
    const publicUrl = await getPublicUrl(req);

    let webhookUrl = `${publicUrl}/api/twilio/incoming`;
    if (webhookUrl.startsWith('http://')) {
      webhookUrl = webhookUrl.replace('http://', 'https://');
    }

    console.log(`[Twilio Outbound] Dialing call to ${toPhone} using webhook: ${webhookUrl}`);
    
    const call = await client.calls.create({
      url: webhookUrl,
      to: toPhone,
      from: '+19126164325' // Twilio purchased number
    });

    console.log(`[Twilio Outbound] Call initiated successfully! SID: ${call.sid}`);
    res.json({ success: true, callSid: call.sid });

  } catch (error) {
    console.error('[Twilio Outbound Error]', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 6. Trigger Local Phone Bridge Outbound Dial
router.post('/phone/dial', async (req, res) => {
  const { toPhone } = req.body;
  if (!toPhone) {
    return res.status(400).json({ success: false, error: "Missing toPhone parameter!" });
  }

  const triggered = triggerOutboundDial(toPhone);
  if (triggered) {
    res.json({ success: true, message: "Dial command sent to local bridge!" });
  } else {
    res.status(503).json({ success: false, error: "No active local audio bridge connected to server!" });
  }
});

// ==========================================
// 📅 Appointment Booking Database & Endpoints
// ==========================================

export let bookings = [
  {
    id: "booking_1",
    name: "Ramesh Kumar",
    phone: "+919405765007",
    date: "2026-06-29",
    time: "19:30",
    guests: 4,
    status: "Confirmed"
  },
  {
    id: "booking_2",
    name: "Neha Sharma",
    phone: "+919812345678",
    date: "2026-06-30",
    time: "20:00",
    guests: 2,
    status: "Confirmed"
  }
];

// Helper to get bookings by phone number for RAG (matches clean digits)
export function getBookingsByPhone(phone) {
  if (!phone || phone === 'Unknown') return [];
  const cleanPhone = phone.replace(/\D/g, ''); // Extract only digits
  return bookings.filter(b => {
    const bClean = b.phone.replace(/\D/g, '');
    return bClean.includes(cleanPhone) || cleanPhone.includes(bClean);
  });
}

// Helper to add booking from the AI Agent pipeline
export function addBooking(booking) {
  const newBooking = {
    id: `booking_${Math.floor(Math.random() * 10000)}`,
    name: booking.name || "Guest",
    phone: booking.phone || "Unknown",
    date: booking.date || new Date().toISOString().split('T')[0],
    time: booking.time || "19:00",
    guests: parseInt(booking.guests) || 2,
    status: "Confirmed"
  };
  bookings.unshift(newBooking);
  console.log(`[Bookings Database] Saved new booking:`, newBooking);
  return newBooking;
}

// GET /api/bookings - fetch all bookings
router.get('/bookings', (req, res) => {
  res.json(bookings);
});

// POST /api/bookings - create a new booking manually or via testing
router.post('/bookings', (req, res) => {
  const { name, phone, date, time, guests } = req.body;
  const newBooking = addBooking({ name, phone, date, time, guests });
  res.status(201).json(newBooking);
});

// POST /api/twilio/verify-caller-id - trigger verification call
router.post('/twilio/verify-caller-id', async (req, res) => {
  const { phoneNumber } = req.body;
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    return res.status(400).json({ 
      success: false, 
      error: "Twilio credentials (Account SID / Auth Token) are missing in server .env!" 
    });
  }

  if (!phoneNumber) {
    return res.status(400).json({ success: false, error: "Phone number is required!" });
  }

  try {
    const client = twilio(accountSid, authToken);
    console.log(`[Twilio Verification] Requesting verification for number: ${phoneNumber}`);
    const validationRequest = await client.validationRequests.create({
      friendlyName: 'Dashboard Verified Number',
      phoneNumber: phoneNumber
    });

    console.log(`[Twilio Verification] Generated Validation Code: ${validationRequest.validationCode}`);
    res.json({
      success: true,
      validationCode: validationRequest.validationCode,
      phoneNumber: validationRequest.phoneNumber
    });

  } catch (error) {
    console.error('[Twilio Verification Error]', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});


