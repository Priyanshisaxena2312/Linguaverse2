import { WebSocket, WebSocketServer } from 'ws';
import http from 'http';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const API_KEY =
  process.env.GEMINI_API_KEY ||
  process.env.GOOGLE_API_KEY ||
  process.env.GOOGLE_GENAI_API_KEY ||
  process.env.VERTEX_API_KEY;
const PORT = Number(process.env.PORT) || 3001;
const REGION = process.env.GCP_REGION || 'us-central1';
const PROJECT_ID = process.env.GCP_PROJECT_ID;

if (!API_KEY) {
  console.error('ERROR: GEMINI_API_KEY or GOOGLE_API_KEY not found in environment variables.');
  process.exit(1);
}

const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Gemini Live Proxy is healthy\n');
});

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:9002',
  'https://linguaverse-c25ff.web.app',
  'https://linguaverse-c25ff.firebaseapp.com',
];

const wss = new WebSocketServer({
  server,
  verifyClient: (info: any) => {
    const origin = info.origin;
    const isAllowed =
      ALLOWED_ORIGINS.some((allowed) => origin?.startsWith(allowed)) ||
      origin?.includes('hosted.app') ||
      origin?.includes('run.app') ||
      !origin; // Allow internal/direct connections

    if (!isAllowed) {
      console.warn(`⚠️ [Proxy] Blocked connection from unauthorized origin: ${origin}`);
    }
    return isAllowed;
  },
});

wss.on('connection', (clientWs, req) => {
  console.log('[Proxy] Client connected');

  const isAIStudio = !PROJECT_ID;
  const geminiUrl = isAIStudio
    ? `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${API_KEY}`
    : `wss://${REGION}-aiplatform.googleapis.com/ws/google.cloud.aiplatform.v1beta1.LlmBidiService/BidiGenerateContent?key=${API_KEY}`;

  const geminiWs = new WebSocket(geminiUrl);

  // Queue to hold messages until Gemini is OPEN
  const messageQueue: any[] = [];
  let isGeminiReady = false;

  geminiWs.on('open', () => {
    console.log(`[Proxy] Connected to Gemini (${isAIStudio ? 'Google AI Studio' : 'Vertex AI'}). Flushing queue...`);
    isGeminiReady = true;
    while (messageQueue.length > 0) {
      const msg = messageQueue.shift();
      geminiWs.send(msg);
    }
  });

  geminiWs.on('message', (data) => {
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(data);
    }
  });

  clientWs.on('message', (data) => {
    let outgoingData: any = data;
    try {
      const message = JSON.parse(data.toString());
      if (message.setup && message.setup.model) {
        let modelName = message.setup.model;
        if (isAIStudio) {
          // Google AI Studio expects model format: models/gemini-2.0-flash-exp
          if (!modelName.startsWith('models/')) {
            modelName = `models/${modelName}`;
          }
          message.setup.model = modelName;
        } else {
          // Vertex AI expects project resource path
          if (modelName.startsWith('models/')) {
            modelName = modelName.substring(7);
          }
          const fullResourcePath = `projects/${PROJECT_ID}/locations/${REGION}/publishers/google/models/${modelName}`;
          console.log(`[Proxy] Transforming model for Vertex: ${message.setup.model} -> ${fullResourcePath}`);
          message.setup.model = fullResourcePath;
        }
        outgoingData = JSON.stringify(message);
      }
    } catch (e) {
      // Pass through raw data if not JSON setup message
    }

    if (isGeminiReady && geminiWs.readyState === WebSocket.OPEN) {
      geminiWs.send(outgoingData);
    } else {
      messageQueue.push(outgoingData);
    }
  });

  geminiWs.on('close', (code, reason) => {
    console.log(`[Proxy] Gemini connection closed: ${code} ${reason}`);
    clientWs.close();
  });

  clientWs.on('close', () => {
    console.log('[Proxy] Client connection closed');
    geminiWs.close();
  });

  geminiWs.on('error', (err) => {
    console.error('[Proxy] Gemini WebSocket error:', err);
  });

  clientWs.on('error', (err) => {
    console.error('[Proxy] Client WebSocket error:', err);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 [Proxy] Listening on 0.0.0.0:${PORT}`);
  console.log(`📍 [Proxy] Mode: ${PROJECT_ID ? 'Vertex AI' : 'Google AI Studio (Free Tier)'}`);
});
