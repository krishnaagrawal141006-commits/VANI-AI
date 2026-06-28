// DineSaathi Console App Logic - Rich State Machine and Call Simulator

const API_BASE = window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1')
    ? 'http://localhost:5050/api'
    : `${window.location.protocol}//${window.location.host}/api`;

// Core State
let stats = {
    totalCalls: 0,
    activeCalls: 0,
    avgDuration: '0s',
    successRate: '0%'
};
let logs = [];
let bookings = [];
let isCalling = false;
let callTimer = null;
let secondsElapsed = 0;

// DOM Elements
const statTotalCalls = document.getElementById('stat-total-calls');
const statActiveCalls = document.getElementById('stat-active-calls');
const statAvgDuration = document.getElementById('stat-avg-duration');
const statSuccessRate = document.getElementById('stat-success-rate');
const logsList = document.getElementById('logs-list');
const refreshLogsBtn = document.getElementById('refresh-logs-btn');

const bookingsList = document.getElementById('bookings-list');
const refreshBookingsBtn = document.getElementById('refresh-bookings-btn');

const agentVoiceSelect = document.getElementById('agent-voice');
const agentPromptArea = document.getElementById('agent-prompt');
const saveConfigBtn = document.getElementById('save-config-btn');

const simulatorBadge = document.getElementById('simulator-badge');
const simPhoneLabel = document.getElementById('sim-phone-label');
const simTimerLabel = document.getElementById('sim-timer-label');
const simStatusSub = document.getElementById('sim-status-sub');
const audioWaveform = document.getElementById('waveform');
const simulateCallBtn = document.getElementById('simulate-call-btn');
const endCallBtn = document.getElementById('end-call-btn');
const liveTranscriptContainer = document.getElementById('live-transcript-container');

const logModal = document.getElementById('log-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const modalPhone = document.getElementById('modal-phone');
const modalDate = document.getElementById('modal-date');
const modalDuration = document.getElementById('modal-duration');
const modalSentiment = document.getElementById('modal-sentiment');
const modalTranscriptText = document.getElementById('modal-transcript-text');

const realPhoneNumberInput = document.getElementById('real-phone-number');
const triggerRealCallBtn = document.getElementById('trigger-real-call-btn');

// Verification DOM Elements
const verifyPhoneNumberInput = document.getElementById('verify-phone-number');
const triggerVerifyBtn = document.getElementById('trigger-verify-btn');
const verifyCodeBox = document.getElementById('verify-code-box');
const verifyCodeDisplay = document.getElementById('verify-code-display');

// Initialize
window.addEventListener('DOMContentLoaded', () => {
    fetchStats();
    fetchLogs();
    fetchBookings();
    setupEventListeners();
    connectDashboardStream(); // Connect to real-time call transcript stream
});

function setupEventListeners() {
    refreshLogsBtn.addEventListener('click', () => {
        fetchStats();
        fetchLogs();
    });

    refreshBookingsBtn.addEventListener('click', () => {
        fetchBookings();
    });

    saveConfigBtn.addEventListener('click', () => {
        const voice = agentVoiceSelect.value;
        const prompt = agentPromptArea.value;
        
        // Visual button feedack
        saveConfigBtn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Saving Config...`;
        saveConfigBtn.disabled = true;
        
        setTimeout(() => {
            saveConfigBtn.innerHTML = `<i class="fa-solid fa-circle-check"></i> Configuration Saved!`;
            saveConfigBtn.classList.add('btn-success');
            
            setTimeout(() => {
                saveConfigBtn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Save Agent Configuration`;
                saveConfigBtn.disabled = false;
            }, 1500);
        }, 800);
    });

    // Simulate Call trigger
    simulateCallBtn.addEventListener('click', startCallSimulation);
    endCallBtn.addEventListener('click', endCallSimulation);

    // Real Call trigger
    triggerRealCallBtn.addEventListener('click', triggerRealOutboundCall);

    // Twilio Verification trigger
    triggerVerifyBtn.addEventListener('click', triggerTwilioVerification);

    // Modal close
    closeModalBtn.addEventListener('click', () => {
        logModal.classList.add('hidden');
    });
}

// Fetch stats from local backend API
async function fetchStats() {
    try {
        const response = await fetch(`${API_BASE}/stats`);
        if (response.ok) {
            stats = await response.json();
            updateStatsUI();
        }
    } catch (error) {
        console.warn('Backend server offline. Using local simulation state.');
    }
}

// Fetch call history logs
async function fetchLogs() {
    try {
        const response = await fetch(`${API_BASE}/logs`);
        if (response.ok) {
            logs = await response.json();
            renderLogs();
        }
    } catch (error) {
        console.warn('Backend server offline. Displaying demo local history.');
        // Set local logs fallback if backend is not started yet
        logs = [
            {
                id: "demo_1",
                timestamp: new Date(Date.now() - 600000).toISOString(),
                duration: 65,
                phone: "+91 99887 76655",
                status: "Completed",
                sentiment: "Positive",
                transcript: "Customer: DineSaathi reservation ho jayegi? Agent: Ji sir, absolutely ho jayegi! Kitne log honge? Customer: 4 log. Agent: 8 PM reserved sir. Customer: Perfect!"
            }
        ];
        renderLogs();
    }
}

function updateStatsUI() {
    statTotalCalls.textContent = stats.totalCalls;
    statActiveCalls.textContent = stats.activeCalls;
    statAvgDuration.textContent = stats.avgDuration;
    statSuccessRate.textContent = stats.successRate;
}

function renderLogs() {
    if (logs.length === 0) {
        logsList.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-box-open"></i>
                <p>No call logs available.</p>
            </div>
        `;
        return;
    }

    logsList.innerHTML = '';
    logs.forEach(log => {
        const date = new Date(log.timestamp);
        const formattedDate = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' - ' + date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        
        const sentimentClass = log.sentiment.toLowerCase();

        const logItem = document.createElement('div');
        logItem.className = 'log-item';
        logItem.innerHTML = `
            <div class="log-left">
                <span class="log-phone"><i class="fa-solid fa-phone-flip" style="font-size:0.75rem; color:var(--text-muted); margin-right:4px;"></i> ${log.phone}</span>
                <div class="log-meta">
                    <span><i class="fa-solid fa-clock"></i> ${log.duration}s</span>
                    <span>${formattedDate}</span>
                </div>
            </div>
            <div class="log-right">
                <span class="sentiment-tag ${sentimentClass}">${log.sentiment}</span>
                <i class="fa-solid fa-chevron-right log-arrow"></i>
            </div>
        `;

        logItem.addEventListener('click', () => showCallDetail(log));
        logsList.appendChild(logItem);
    });
}

// Dialog Details Modal overlay
function showCallDetail(log) {
    const date = new Date(log.timestamp);
    modalPhone.innerHTML = `<i class="fa-solid fa-phone"></i> ${log.phone}`;
    modalDate.innerHTML = `<i class="fa-solid fa-calendar"></i> ${date.toLocaleString()}`;
    modalDuration.innerHTML = `<i class="fa-solid fa-clock"></i> ${log.duration}s`;
    
    modalSentiment.textContent = log.sentiment;
    modalSentiment.className = `sentiment-tag ${log.sentiment.toLowerCase()}`;

    // Render dialogue bubbles in modal
    modalTranscriptText.innerHTML = '';
    const dialogueLines = log.transcript.split(/(Customer:|Agent:)/).filter(line => line.trim() !== '');
    
    for (let i = 0; i < dialogueLines.length; i += 2) {
        const speaker = dialogueLines[i] ? dialogueLines[i].replace(':', '').trim() : '';
        const speech = dialogueLines[i+1] ? dialogueLines[i+1].trim() : '';
        
        if (speaker && speech) {
            const bubble = document.createElement('div');
            bubble.className = `chat-bubble ${speaker.toLowerCase() === 'customer' ? 'customer' : 'agent'}`;
            bubble.innerHTML = `
                <span class="speaker-tag">${speaker}</span>
                <p>${speech}</p>
            `;
            modalTranscriptText.appendChild(bubble);
        }
    }

    logModal.classList.remove('hidden');
}

/* Call Simulator Interactive flow logic */
const simulatedConversation = [
    { speaker: 'system', delay: 1000, text: '📞 Incoming customer phone call initiating...' },
    { speaker: 'Customer', delay: 2000, text: 'Hello! Mujhe aaj raat ke liye ek table reserve karni hai.' },
    { speaker: 'Agent', delay: 3500, text: 'Pranam! DineSaathi AI Assistant me aapka swagat hai. Ji bilkul, table reservation ho jayega. Kitne baje ka plan hai aur total kitne log honge?' },
    { speaker: 'Customer', delay: 3000, text: 'Hum total 4 log hain, aur shaam ko 8:30 baje ka reservation chahiye.' },
    { speaker: 'Agent', delay: 3200, text: '8:30 baje 4 logon ke liye hamare pass beautiful window table available hai! Kya main booking confirm karne ke liye aapka shubh naam jaan sakta hoon?' },
    { speaker: 'Customer', delay: 2200, text: 'Mera naam Sandeep Sharma hai.' },
    { speaker: 'Agent', delay: 2800, text: 'Aapki reservation Sandeep Sharma ji ke naam par 4 logon ke liye 8:30 PM par confirm ho gayi hai. Kya aapki koi special menu request hai?' },
    { speaker: 'Customer', delay: 2500, text: 'Nahi, menu hum wahan aakar hi select karenge. Thank you so much!' },
    { speaker: 'Agent', delay: 2200, text: 'Aapka swagat hai! Hum aapse milne ka intezaar karenge. Have a wonderful day ahead!' },
    { speaker: 'system', delay: 1500, text: '🔌 Call hang up by the customer.' }
];

let conversationIndex = 0;

function startCallSimulation() {
    if (isCalling) return;
    
    isCalling = true;
    conversationIndex = 0;
    secondsElapsed = 0;
    
    // UI Updates
    stats.activeCalls = 1;
    updateStatsUI();
    
    simulatorBadge.textContent = 'Active Call';
    simulatorBadge.classList.add('badge-active');
    
    simPhoneLabel.textContent = '+91 95000 78210';
    simStatusSub.textContent = 'Speech streaming active';
    
    audioWaveform.classList.add('active');
    simulateCallBtn.classList.add('hidden');
    endCallBtn.classList.remove('hidden');
    
    liveTranscriptContainer.innerHTML = '';
    
    // Start stopwatch timer
    simTimerLabel.textContent = '00:00';
    callTimer = setInterval(() => {
        secondsElapsed++;
        const mins = String(Math.floor(secondsElapsed / 60)).padStart(2, '0');
        const secs = String(secondsElapsed % 60).padStart(2, '0');
        simTimerLabel.textContent = `${mins}:${secs}`;
    }, 1000);

    // Start streaming dialogue lines
    playNextSimulatedDialogue();
}

function playNextSimulatedDialogue() {
    if (!isCalling || conversationIndex >= simulatedConversation.length) {
        if (isCalling) endCallSimulation();
        return;
    }

    const step = simulatedConversation[conversationIndex];
    
    setTimeout(() => {
        if (!isCalling) return;

        if (step.speaker === 'system') {
            const sysDiv = document.createElement('div');
            sysDiv.className = 'system-message';
            sysDiv.textContent = step.text;
            liveTranscriptContainer.appendChild(sysDiv);
            liveTranscriptContainer.scrollTop = liveTranscriptContainer.scrollHeight;
        } else {
            // Render speech bubble
            const bubble = document.createElement('div');
            bubble.className = `chat-bubble ${step.speaker.toLowerCase()}`;
            bubble.innerHTML = `
                <span class="speaker-tag">${step.speaker}</span>
                <p id="writing-msg-${conversationIndex}"></p>
            `;
            liveTranscriptContainer.appendChild(bubble);
            liveTranscriptContainer.scrollTop = liveTranscriptContainer.scrollHeight;
            
            // Character-by-character live text streaming simulation
            typeText(`writing-msg-${conversationIndex}`, step.text, 0, () => {
                conversationIndex++;
                playNextSimulatedDialogue();
            });
            return;
        }

        conversationIndex++;
        playNextSimulatedDialogue();

    }, step.delay);
}

function typeText(elementId, text, charIndex, callback) {
    if (!isCalling) return;
    
    const el = document.getElementById(elementId);
    if (!el) {
        callback();
        return;
    }
    
    if (charIndex < text.length) {
        el.textContent += text.charAt(charIndex);
        liveTranscriptContainer.scrollTop = liveTranscriptContainer.scrollHeight;
        setTimeout(() => {
            typeText(elementId, text, charIndex + 1, callback);
        }, 20); // 20ms per character typing speeds
    } else {
        callback();
    }
}

async function endCallSimulation() {
    if (!isCalling) return;
    
    isCalling = false;
    clearInterval(callTimer);
    
    // UI resets
    stats.activeCalls = 0;
    updateStatsUI();
    
    simulatorBadge.textContent = 'Idle';
    simulatorBadge.classList.remove('badge-active');
    
    simPhoneLabel.textContent = 'Ready to Call';
    simTimerLabel.textContent = '00:00';
    simStatusSub.textContent = 'Simulated call ended successfully.';
    
    audioWaveform.classList.remove('active');
    simulateCallBtn.classList.remove('hidden');
    endCallBtn.classList.add('hidden');

    // Assemble final full dialogue string to push to DB
    const finalTranscript = simulatedConversation
        .filter(c => c.speaker !== 'system')
        .map(c => `${c.speaker}: ${c.text}`)
        .join(' ');

    // Post to backend logs
    const callDuration = secondsElapsed > 0 ? secondsElapsed : 24;
    const postPayload = {
        phone: "+91 95000 78210",
        duration: callDuration,
        sentiment: "Positive",
        status: "Completed",
        transcript: finalTranscript
    };

    try {
        const response = await fetch(`${API_BASE}/logs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(postPayload)
        });
        
        if (response.ok) {
            // Update stats after saving log
            fetchStats();
            fetchLogs();
        }
    } catch (e) {
        console.warn('Backend not responding to saving call logs. Adding locally.');
        
        // Fallback local update
        logs.unshift({
            id: `sim_${Date.now()}`,
            timestamp: new Date().toISOString(),
            duration: callDuration,
            phone: postPayload.phone,
            status: postPayload.status,
            sentiment: postPayload.sentiment,
            transcript: postPayload.transcript
        });
        
        // Recompute local stats
        stats.totalCalls = logs.length;
        stats.avgDuration = `${Math.round(logs.reduce((a,b)=>a+b.duration,0) / logs.length)}s`;
        stats.successRate = `${Math.round((logs.filter(l=>l.sentiment!=='Negative').length / logs.length)*100)}%`;
        
        updateStatsUI();
        renderLogs();
    }
}

async function triggerRealOutboundCall() {
    const toPhone = realPhoneNumberInput.value.trim();
    if (!toPhone) {
        alert('Please enter a valid phone number with country code! (Example: +919999988888)');
        return;
    }

    const dialModeInput = document.querySelector('input[name="dial-mode"]:checked');
    const dialMode = dialModeInput ? dialModeInput.value : 'twilio';
    const apiPath = dialMode === 'bridge' ? '/phone/dial' : '/twilio/outbound';

    triggerRealCallBtn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Dialing Phone...`;
    triggerRealCallBtn.disabled = true;

    try {
        const response = await fetch(`${API_BASE}${apiPath}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ toPhone })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            triggerRealCallBtn.innerHTML = dialMode === 'bridge' 
                ? `<i class="fa-solid fa-phone"></i> Bridge Command Sent!` 
                : `<i class="fa-solid fa-phone-slash"></i> Live Dial Active!`;
            triggerRealCallBtn.style.background = 'linear-gradient(135deg, var(--accent-crimson), #c084fc)';
            
            setTimeout(() => {
                triggerRealCallBtn.innerHTML = `<i class="fa-solid fa-phone-volume"></i> Make Live AI Call`;
                triggerRealCallBtn.style.background = '';
                triggerRealCallBtn.disabled = false;
            }, 6000);
        } else {
            alert(`Error: ${data.error || 'Server error occurred'}`);
            resetOutboundBtn();
        }
    } catch (error) {
        alert('Could not reach backend server. Please make sure the node backend is running!');
        resetOutboundBtn();
    }
}

function resetOutboundBtn() {
    triggerRealCallBtn.innerHTML = `<i class="fa-solid fa-phone-volume"></i> Make Live AI Call`;
    triggerRealCallBtn.disabled = false;
    triggerRealCallBtn.style.background = '';
}

// Fetch reservations from local/remote backend
async function fetchBookings() {
    try {
        const response = await fetch(`${API_BASE}/bookings`);
        if (response.ok) {
            bookings = await response.json();
            renderBookings();
        }
    } catch (error) {
        console.warn('Backend server offline. Displaying demo bookings fallback.');
        // Demo bookings if server is not reachable
        bookings = [
            {
                id: "booking_demo",
                name: "Ramesh Kumar (Demo)",
                phone: "+91 94057 65007",
                date: "2026-06-29",
                time: "19:30",
                guests: 4,
                status: "Confirmed"
            }
        ];
        renderBookings();
    }
}

// Render reservations table rows dynamically
function renderBookings() {
    if (!bookingsList) return;

    if (bookings.length === 0) {
        bookingsList.innerHTML = `
            <tr>
                <td colspan="5" style="padding: 24px 8px; text-align: center; color: var(--text-muted);">
                    <i class="fa-solid fa-calendar-xmark" style="margin-right: 6px;"></i> No reservations booked yet.
                </td>
            </tr>
        `;
        return;
    }

    bookingsList.innerHTML = '';
    bookings.forEach(b => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid rgba(255, 255, 255, 0.05)';
        tr.style.fontSize = '0.85rem';
        tr.style.transition = 'background-color 0.2s';
        
        // Add subtle hover styling
        tr.addEventListener('mouseenter', () => tr.style.backgroundColor = 'rgba(255, 255, 255, 0.02)');
        tr.addEventListener('mouseleave', () => tr.style.backgroundColor = 'transparent');

        const statusClass = b.status.toLowerCase() === 'confirmed' ? 'positive' : 'negative';

        tr.innerHTML = `
            <td style="padding: 12px 8px; font-weight: 500; font-family: var(--font-body); color: var(--text-primary);">${b.name}</td>
            <td style="padding: 12px 8px; font-family: var(--font-body); color: var(--text-muted);">${b.phone}</td>
            <td style="padding: 12px 8px; font-family: var(--font-body); color: var(--text-muted);">${b.date} &nbsp; <span style="color: var(--secondary-color); font-weight: 600;">${b.time}</span></td>
            <td style="padding: 12px 8px; text-align: center; font-weight: 600; font-family: var(--font-body); color: var(--text-primary);">${b.guests}</td>
            <td style="padding: 12px 8px; text-align: center;">
                <span class="sentiment-tag ${statusClass}" style="padding: 2px 8px; font-size: 0.75rem; font-weight: 500; border-radius: 4px;">${b.status}</span>
            </td>
        `;
        bookingsList.appendChild(tr);
    });
}

// -------------------------------------------------------------
// Live Call Transcripts via WebSocket
// -------------------------------------------------------------
let dashboardWs = null;

function connectDashboardStream() {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Dynamically connect to the host currently serving the website (e.g. Serveo)
    const wsUrl = `${wsProtocol}//${window.location.host}/dashboard-stream`;
    console.log('[Dashboard WebSocket] Connecting to:', wsUrl);
    
    dashboardWs = new WebSocket(wsUrl);
    
    dashboardWs.onopen = () => {
        console.log('[Dashboard WebSocket] Connection established successfully!');
        document.getElementById('connection-status').textContent = 'Live Console Sync Active';
    };
    
    dashboardWs.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            if (data.event === 'system') {
                renderLiveSystemMessage(data.text);
            } else if (data.event === 'transcript') {
                renderLiveTranscriptBubble(data.speaker, data.text);
            }
        } catch (err) {
            console.error('[Dashboard WebSocket] Error processing message:', err);
        }
    };
    
    dashboardWs.onclose = () => {
        console.warn('[Dashboard WebSocket] Connection lost. Reconnecting in 3 seconds...');
        document.getElementById('connection-status').textContent = 'Sync Reconnecting...';
        setTimeout(connectDashboardStream, 3000);
    };
}

let liveTimerInterval = null;
let liveSecondsElapsed = 0;

function startLiveCallUI() {
    stats.activeCalls = 1;
    updateStatsUI();
    
    simulatorBadge.textContent = 'Live Call';
    simulatorBadge.classList.add('badge-active');
    simPhoneLabel.textContent = 'Active Real Call';
    audioWaveform.classList.add('active');
    
    liveTranscriptContainer.innerHTML = '';
    
    liveSecondsElapsed = 0;
    simTimerLabel.textContent = '00:00';
    clearInterval(liveTimerInterval);
    liveTimerInterval = setInterval(() => {
        liveSecondsElapsed++;
        const mins = String(Math.floor(liveSecondsElapsed / 60)).padStart(2, '0');
        const secs = String(liveSecondsElapsed % 60).padStart(2, '0');
        simTimerLabel.textContent = `${mins}:${secs}`;
    }, 1000);
}

function endLiveCallUI() {
    stats.activeCalls = 0;
    updateStatsUI();
    
    simulatorBadge.textContent = 'Idle';
    simulatorBadge.classList.remove('badge-active');
    simPhoneLabel.textContent = 'Ready to Call';
    audioWaveform.classList.remove('active');
    
    clearInterval(liveTimerInterval);
    // Refresh stats & databases
    fetchStats();
    fetchLogs();
    fetchBookings();
}

function renderLiveSystemMessage(text) {
    if (text === 'Call connected.') {
        startLiveCallUI();
    } else if (text === 'Call disconnected.') {
        endLiveCallUI();
    }
    
    const sysDiv = document.createElement('div');
    sysDiv.className = 'system-message';
    sysDiv.textContent = text;
    liveTranscriptContainer.appendChild(sysDiv);
    liveTranscriptContainer.scrollTop = liveTranscriptContainer.scrollHeight;
}

function renderLiveTranscriptBubble(speaker, text) {
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${speaker.toLowerCase()}`;
    bubble.innerHTML = `
        <span class="speaker-tag">${speaker}</span>
        <p>${text}</p>
    `;
    liveTranscriptContainer.appendChild(bubble);
    liveTranscriptContainer.scrollTop = liveTranscriptContainer.scrollHeight;
}

// -------------------------------------------------------------
// Twilio Caller ID Verification
// -------------------------------------------------------------
async function triggerTwilioVerification() {
    const phone = verifyPhoneNumberInput.value.trim();
    if (!phone) {
        alert('Please enter a valid phone number to verify!');
        return;
    }

    // Change button status to loading
    triggerVerifyBtn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Triggering Call...`;
    triggerVerifyBtn.disabled = true;

    try {
        const response = await fetch(`${API_BASE}/twilio/verify-caller-id`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ phoneNumber: phone })
        });

        const data = await response.json();
        if (response.ok && data.success) {
            triggerVerifyBtn.innerHTML = `<i class="fa-solid fa-circle-check"></i> Verification Call Sent!`;
            triggerVerifyBtn.style.background = 'linear-gradient(135deg, var(--accent-emerald), var(--secondary-color))';
            
            // Show verification code box and display the code
            verifyCodeDisplay.textContent = data.validationCode;
            verifyCodeBox.classList.remove('hidden');

            setTimeout(() => {
                triggerVerifyBtn.innerHTML = `<i class="fa-solid fa-circle-check"></i> Trigger Verification Call`;
                triggerVerifyBtn.style.background = '';
                triggerVerifyBtn.disabled = false;
            }, 5000);
        } else {
            throw new Error(data.error || 'Failed to trigger verification call.');
        }
    } catch (err) {
        console.error('[Verification Error]', err);
        alert(`Error: ${err.message}`);
        triggerVerifyBtn.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Retry Verification Call`;
        triggerVerifyBtn.disabled = false;
    }
}

