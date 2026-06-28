import express from 'express';
import { WebSocketServer } from 'ws';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { router } from './routes.js';
import { handleTwilioStream, handleDashboardStream } from './twilio-stream.js';
import { startTunnel } from './tunnel.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Start programmatic tunnel (disabled since we use permanent Nginx + SSL)
// startTunnel();

const app = express();
const PORT = process.env.PORT || 5050;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../../frontend')));

// Register api endpoints
app.use('/api', router);

// Create HTTP server to share with WebSocket server
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// WebSocket connection routing
wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;

  if (path === '/media-stream') {
    console.log('[Server] New Twilio Media Stream connection established.');
    handleTwilioStream(ws, req);
  } else if (path === '/dashboard-stream') {
    console.log('[Server] New Dashboard connection established.');
    handleDashboardStream(ws);
  } else {
    console.warn(`[Server] Unhandled WebSocket path: ${path}`);
    ws.close(1008, 'Unsupported path');
  }
});

server.listen(PORT, () => {
  console.log(`🚀 VaniAI Backend is running on port ${PORT}`);
});
