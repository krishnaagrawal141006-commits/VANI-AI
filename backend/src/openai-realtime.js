import WebSocket from 'ws';

/**
 * Connects to OpenAI Realtime API and handles bidirectional audio streaming.
 * @param {WebSocket} twilioWs - The WebSocket connection from Twilio.
 * @param {string} streamSid - The Twilio Stream SID for sending media packets.
 */
export function connectToOpenAI(twilioWs, streamSid) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.warn('[OpenAI] OPENAI_API_KEY missing in .env! Running in Mock/Simulation Mode.');
    startSimulation(twilioWs, streamSid);
    return null;
  }

  const url = 'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01';
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    'OpenAI-Beta': 'realtime=v1',
  };

  const openAiWs = new WebSocket(url, { headers });

  openAiWs.on('open', () => {
    console.log('[OpenAI] Connected successfully to OpenAI Realtime API!');
    
    // 1. Send session.update to configure voice and audio formats
    const sessionUpdate = {
      type: 'session.update',
      session: {
        modalities: ['text', 'audio'],
        instructions: `Eres DineSaathi, un asistente de llamadas inteligente y amable para un restaurante de alta cocina india.
Aapka naam DineSaathi hai. Aap Hindi aur English (Hinglish) me natural tarike se baat karte hain.
Aapka kaam hai customer ke tables book karna, specials batana aur unki query solve karna.
Be extremely polite, concise, and helpful. Keep responses short and sweet (under 2 sentences) for voice calls.`,
        voice: 'alloy', // Voices: alloy, echo, shimmer, coral, sage
        input_audio_format: 'g711_ulaw', // Twilio uses 8kHz G711 mu-law audio
        output_audio_format: 'g711_ulaw',
        turn_detection: {
          type: 'server_vad', // Server Voice Activity Detection
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 500
        }
      }
    };
    openAiWs.send(JSON.stringify(sessionUpdate));
  });

  openAiWs.on('message', (data) => {
    try {
      const response = JSON.parse(data);

      switch (response.type) {
        case 'session.updated':
          console.log('[OpenAI] Session configured successfully.');
          break;

        case 'response.audio.delta':
          // We received raw audio chunk from OpenAI! Let's stream it straight to Twilio
          if (response.delta && twilioWs.readyState === WebSocket.OPEN) {
            const twilioPayload = {
              event: 'media',
              streamSid: streamSid,
              media: {
                payload: response.delta // Base64 encoded mu-law audio
              }
            };
            twilioWs.send(JSON.stringify(twilioPayload));
          }
          break;

        case 'response.audio_transcript.delta':
          // Live speaking transcript
          if (response.delta) {
            process.stdout.write(response.delta);
          }
          break;

        case 'response.audio_transcript.done':
          console.log('\n[OpenAI Agent Finished Speaking]');
          break;

        case 'input_audio_buffer.speech_started':
          // Customer interrupted! We must clear Twilio's audio playback queue instantly
          console.log('\n[OpenAI] Interruption detected! Clearing Twilio audio queue.');
          if (twilioWs.readyState === WebSocket.OPEN) {
            twilioWs.send(JSON.stringify({
              event: 'clear',
              streamSid: streamSid
            }));
          }
          // Notify OpenAI to cancel current agent output response
          openAiWs.send(JSON.stringify({ type: 'response.cancel' }));
          break;

        case 'error':
          console.error('[OpenAI Error]', response.error);
          break;

        default:
          // Unhandled event
          break;
      }
    } catch (error) {
      console.error('[OpenAI] Error parsing message:', error);
    }
  });

  openAiWs.on('close', () => {
    console.log('[OpenAI] Connection closed.');
  });

  openAiWs.on('error', (err) => {
    console.error('[OpenAI] WebSocket error:', err.message);
  });

  return openAiWs;
}

/**
 * Simulates a voice agent responses when API Key is missing.
 */
function startSimulation(twilioWs, streamSid) {
  console.log('[Simulation] Simulation started. Agent will say standard greeting.');

  // Simulated greeting after 1.5 seconds
  setTimeout(() => {
    sendMockPhrase(twilioWs, streamSid, "Welcome to DineSaathi! Kaise madad karu aapki table booking me?");
  }, 1500);
}

function sendMockPhrase(twilioWs, streamSid, text) {
  console.log(`[Simulation Speaking]: ${text}`);
  // In a full mock, we could send some static mu-law audio files.
  // For safety, if no key is entered, we log it beautifully and print in console.
}
