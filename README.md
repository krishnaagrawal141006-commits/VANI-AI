# VaniAI - AI Receptionist & Call Reservation Console

VaniAI is an advanced, ultra-low latency AI-powered Voice Receptionist designed for Indian restaurants. It automates table reservations, answers queries about restaurant specials, and streams interactive conversations in real-time to a gorgeous dashboard interface.

---

## 🌟 Key Features

* **Natural Hinglish AI Agent:** Auto-detects and transitions between Hindi, English, and Hinglish. Uses conversational verbal fillers ("Sure", "Ji", "Theek hai") for a human-like voice response.
* **VoiceProbe Adversarial Testing:** Integrated red-teaming simulator to verify voice agent reliability against 12 built-in customer personas (e.g. angry customer, prompt injector, non-native accents). Evaluates reliability scores across 5 dimensions using LLM-powered judge diagnostics.
* **Ambient Noise Filtration:** Prevents loop-hallucinations by ignoring short, single-character, or garbage audio transcripts (e.g. ambient static).
* **Live Call Transcript Broadcasts:** Streams real-time call logs and transcripts directly to the frontend console using persistent WebSockets (`/dashboard-stream`).
* **Twilio Caller ID Verification:** Directly trigger Twilio validation calls from the dashboard to verify new numbers in real-time.
* **Dual Dialing Modes:** 
  1. **Twilio Cloud:** For direct carrier-grade VoIP routing.
  2. **Local Phone Bridge:** For running call streams locally on Windows via PyAudio/SoundDevice callbacks.

---

## 🛠️ Technology Stack

* **Frontend:** Vanilla HTML5, CSS3 (Glassmorphism layout), FontAwesome icons, WebSockets Client.
* **Backend:** Node.js, Express, WS WebSocket Server, Twilio SDK, Groq SDK (Llama 3.1 8B Instant), Sarvam AI (STT & TTS).
* **Local Bridge:** Python 3.x, `sounddevice`, `numpy`, `websockets`.

---

## 🚀 Setup & Installation

### 1. Prerequisites
* Install Node.js (v18+)
* Register accounts for **Twilio**, **Groq**, and **Sarvam AI**.

### 2. Configure Environment Variables
Create a `.env` file inside the `backend/` directory:
```env
PORT=5050
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
SARVAM_API_KEY=your_sarvam_api_key
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.1-8b-instant
```

### 3. Run Backend Server
```bash
cd backend
npm install
node src/server.js
```

### 4. Open SSH Tunnel (Serveo)
To expose port `5050` so Twilio can hit the webhook, run this on your VPS or host:
```bash
ssh -o ServerAliveInterval=60 -R 80:localhost:5050 serveo.net
```

---

## 💻 How to Use

1. Navigate to your Serveo URL.
2. Select **Twilio Cloud** or **Local Phone Bridge**.
3. **Verify Number:** Use the security widget to trigger a verification call, input the code on your phone's keypad, and get verified instantly.
4. **Make Call:** Input the target number and click **Make Live AI Call**!
5. **Adversarial Testing:** Go to the **Adversarial Testing** tab in the sidebar, select an adversarial persona (such as Angry Customer or Prompt Injector), and click **Run Adversarial Simulation Test** to test your voice agent's reliability under pressure.
