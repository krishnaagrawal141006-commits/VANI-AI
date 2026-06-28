import { handleSarvamLlamaMedia, handleSarvamLlamaClose } from './sarvam-llama.js';

// Keep track of active WebSocket connections for Phone Bridge
export const activeSockets = new Set();

/**
 * Triggers an outbound dial command to all connected local audio bridges.
 */
export function triggerOutboundDial(phone) {
  console.log(`[Phone Bridge Outbound] Sending dial event for number: ${phone}`);
  const message = JSON.stringify({
    event: 'dial',
    number: phone
  });

  let sent = false;
  for (const ws of activeSockets) {
    if (ws.readyState === 1) { // WebSocket.OPEN
      try {
        ws.send(message);
        sent = true;
      } catch (err) {
        console.error('[Phone Bridge Outbound] Failed to send dial command:', err.message);
      }
    }
  }
  return sent;
}

export function handleTwilioStream(ws, req) {
  let streamSid = null;
  let phone = 'Unknown';

  // Add socket to active sockets list
  activeSockets.add(ws);

  if (req) {
    try {
      const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      phone = url.searchParams.get('phone') || 'Unknown';
    } catch (err) {
      console.warn('[Twilio Stream] Could not parse request URL for query parameters:', err.message);
    }
  }

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);

      switch (data.event) {
        case 'connected':
          console.log('[Twilio] Media Stream WebSocket handshake established.');
          break;

        case 'start':
          streamSid = data.start.streamSid;
          console.log(`[Twilio] Stream started. StreamSid: ${streamSid}. Caller: ${phone}`);
          break;

        case 'media':
          // Route raw G711 mu-law base64 audio frames directly to our custom engine
          if (streamSid) {
            handleSarvamLlamaMedia(ws, streamSid, data.media.payload, phone);
          }
          break;

        case 'stop':
          console.log(`[Twilio] Stream stopped for StreamSid: ${streamSid}`);
          handleSarvamLlamaClose(streamSid);
          break;

        default:
          break;
      }
    } catch (error) {
      console.error('[Twilio] Error processing message:', error);
    }
  });

  ws.on('close', () => {
    console.log(`[Twilio] Socket closed for StreamSid: ${streamSid}`);
    activeSockets.delete(ws);
    if (streamSid) {
      handleSarvamLlamaClose(streamSid);
      broadcastToDashboard({ event: 'system', text: 'Call disconnected.' });
    }
  });
}

// Keep track of active dashboard connections
export const dashboardSockets = new Set();

/**
 * Handles incoming WebSocket connection from the dashboard
 */
export function handleDashboardStream(ws) {
  dashboardSockets.add(ws);
  console.log(`[Dashboard WebSocket] Client connected. Total clients: ${dashboardSockets.size}`);

  ws.on('close', () => {
    dashboardSockets.delete(ws);
    console.log(`[Dashboard WebSocket] Client disconnected. Total clients: ${dashboardSockets.size}`);
  });
}

/**
 * Broadcasts an event to all connected dashboard WebSockets
 */
export function broadcastToDashboard(eventData) {
  const message = JSON.stringify(eventData);
  for (const ws of dashboardSockets) {
    if (ws.readyState === 1) { // WebSocket.OPEN
      try {
        ws.send(message);
      } catch (err) {
        console.error('[Dashboard WebSocket] Failed to send broadcast:', err.message);
      }
    }
  }
}
