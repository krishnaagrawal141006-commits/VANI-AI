import asyncio
import websockets
import json
import base64
import sounddevice as sd
import numpy as np
import audioop
import sys

# Audio configuration
SAMPLE_RATE = 8000
CHANNELS = 1
BLOCK_SIZE = 160  # 20ms of audio at 8kHz

print("==================================================")
print("DineSaathi Local Audio Phone Bridge")
print("==================================================")
print(f"Audio Sample Rate: {SAMPLE_RATE}Hz (Mono)")
print("This bridge allows routing your physical phone calls to the AI agent.")
print("==================================================\n")

# Get server URL from arguments or default to the active VPS tunnel
import argparse
parser = argparse.ArgumentParser(description="DineSaathi Local Audio Phone Bridge")
parser.add_argument("--url", default="wss://mean-moose-know.loca.lt/media-stream", help="Backend WebSocket URL")
parser.add_argument("--input", type=int, default=None, help="Input Device Index")
parser.add_argument("--output", type=int, default=None, help="Output Device Index")
args = parser.parse_args()
ws_url = args.url

# Convert ws:// to wss:// if secure protocol is needed
if ws_url.startswith("https://"):
    ws_url = ws_url.replace("https://", "wss://")
elif ws_url.startswith("http://"):
    ws_url = ws_url.replace("http://", "ws://")

# Available Audio Devices listing
print("Available Audio Devices:")
devices = sd.query_devices()
for i, d in enumerate(devices):
    io_type = ""
    if d['max_input_channels'] > 0: io_type += " [Input]"
    if d['max_output_channels'] > 0: io_type += " [Output]"
    print(f"  [{i}] {d['name']} ({d['hostapi']}){io_type}")

# Auto-detect Bluetooth Hands-Free devices
auto_in = sd.default.device[0]
auto_out = sd.default.device[1]
for i, d in enumerate(devices):
    name = d['name'].lower()
    if 'hands-free' in name or 'krishna' in name:
        if d['max_input_channels'] > 0:
            auto_in = i
        if d['max_output_channels'] > 0:
            auto_out = i

# Set device indexes from args or fallback to prompting/autodetect
if args.input is not None:
    input_device_index = args.input
else:
    print(f"\nDefault input device index: {auto_in}")
    input_idx = input(f"\nSelect Input Device index [Default: {auto_in}]: ").strip()
    input_device_index = int(input_idx) if input_idx else auto_in

if args.output is not None:
    output_device_index = args.output
else:
    print(f"Default output device index: {auto_out}")
    output_idx = input(f"Select Output Device index [Default: {auto_out}]: ").strip()
    output_device_index = int(output_idx) if output_idx else auto_out

print(f"\nUsing Input Device #{input_device_index}: {devices[input_device_index]['name']}")
print(f"Using Output Device #{output_device_index}: {devices[output_device_index]['name']}\n")

# Get device default sample rates for resampling support
try:
    input_info = sd.query_devices(input_device_index, 'input')
    INPUT_SAMPLE_RATE = int(input_info['default_samplerate'])
except Exception:
    INPUT_SAMPLE_RATE = 8000

try:
    output_info = sd.query_devices(output_device_index, 'output')
    OUTPUT_SAMPLE_RATE = int(output_info['default_samplerate'])
except Exception:
    OUTPUT_SAMPLE_RATE = 8000

INPUT_BLOCK_SIZE = int(0.02 * INPUT_SAMPLE_RATE)
OUTPUT_BLOCK_SIZE = int(0.02 * OUTPUT_SAMPLE_RATE)

print(f"Device Input Sample Rate: {INPUT_SAMPLE_RATE}Hz (Block Size: {INPUT_BLOCK_SIZE})")
print(f"Device Output Sample Rate: {OUTPUT_SAMPLE_RATE}Hz (Block Size: {OUTPUT_BLOCK_SIZE})\n")

# Thread-safe audio queues and buffers
import queue
import threading

send_queue = queue.Queue()

class PlaybackBuffer:
    def __init__(self):
        self.lock = threading.Lock()
        self.buffer = np.array([], dtype=np.float32)

    def write(self, data):
        with self.lock:
            self.buffer = np.append(self.buffer, data)

    def read(self, num_frames):
        with self.lock:
            if len(self.buffer) >= num_frames:
                chunk = self.buffer[:num_frames]
                self.buffer = self.buffer[num_frames:]
                return chunk
            else:
                chunk = self.buffer
                self.buffer = np.array([], dtype=np.float32)
                # Pad with silence
                padding = np.zeros(num_frames - len(chunk), dtype=np.float32)
                return np.append(chunk, padding)

    def clear(self):
        with self.lock:
            self.buffer = np.array([], dtype=np.float32)

play_buffer = PlaybackBuffer()

def resample(audio_data, orig_sr, target_sr):
    if orig_sr == target_sr:
        return audio_data
    duration = len(audio_data) / orig_sr
    orig_x = np.arange(len(audio_data))
    target_x = np.linspace(0, len(audio_data) - 1, int(duration * target_sr))
    return np.interp(target_x, orig_x, audio_data).astype(np.float32)

def input_callback(indata, frames, time, status):
    """Callback for capture/microphone stream."""
    if status:
        print(status, file=sys.stderr)
    send_queue.put(indata.copy())

def output_callback(outdata, frames, time, status):
    """Callback for playback/speaker stream."""
    if status:
        print(status, file=sys.stderr)
    data = play_buffer.read(frames)
    outdata[:] = data.reshape(-1, 1)

async def send_audio(websocket):
    print("Microphone streaming active. Streaming to AI agent...")
    while True:
        try:
            # Check for captured mic frames
            while not send_queue.empty():
                indata = send_queue.get_nowait()
                audio_1d = indata.flatten()
                # Resample to 8000Hz
                resampled = resample(audio_1d, INPUT_SAMPLE_RATE, 8000)
                # Convert float32 to int16 PCM
                pcm = (resampled * 32767).astype(np.int16).tobytes()
                # Convert to 8-bit mu-law (companding)
                mulaw = audioop.lin2ulaw(pcm, 2)
                # Encode base64
                payload = base64.b64encode(mulaw).decode('utf-8')
                
                # Send Twilio media message format
                message = {
                    "event": "media",
                    "streamSid": "local_stream",
                    "media": {
                        "payload": payload
                    }
                }
                await websocket.send(json.dumps(message))
            await asyncio.sleep(0.01)  # Yield control
        except Exception as e:
            print(f"\n[Error sending audio]: {e}")
            break

async def receive_audio(websocket):
    print("Speaker playback active. Playing AI agent voice...")
    while True:
        try:
            message = await websocket.recv()
            data = json.loads(message)
            
            if data.get("event") == "media":
                payload = data["media"]["payload"]
                # Decode base64
                mulaw = base64.b64decode(payload)
                # Convert mu-law to int16 PCM
                pcm = audioop.ulaw2lin(mulaw, 2)
                # Convert int16 PCM to float32 at 8000Hz
                audio_array_8k = np.frombuffer(pcm, dtype=np.int16).astype(np.float32) / 32767.0
                # Resample to device output rate
                resampled = resample(audio_array_8k, 8000, OUTPUT_SAMPLE_RATE)
                # Accumulate in playback buffer
                play_buffer.write(resampled)
            elif data.get("event") == "clear":
                print("\n[VAD Interruption] Customer speaking. Stopping current playback.")
                play_buffer.clear()
            elif data.get("event") == "dial":
                number = data.get("number")
                print(f"\n[Command] Triggering dialing command for: {number}")
                import os
                try:
                    os.startfile(f"tel:{number}")
                    print(f"Launched Phone Link/Dialer successfully for: tel:{number}")
                except Exception as ex:
                    print(f"os.startfile failed: {ex}. Falling back to webbrowser.")
                    import webbrowser
                    webbrowser.open(f"tel:{number}")
        except Exception as e:
            print(f"\n[Error receiving audio]: {e}")
            break

async def main():
    print(f"\nConnecting to: {ws_url} ...")
    try:
        headers = {
            "Bypass-Tunnel-Reminder": "true"
        }
        async with websockets.connect(ws_url, additional_headers=headers) as websocket:
            print("Connected to DineSaathi Server successfully!")
            
            # Send Twilio handshake emulation events
            await websocket.send(json.dumps({"event": "connected"}))
            await websocket.send(json.dumps({
                "event": "start",
                "start": {
                    "streamSid": "local_stream"
                }
            }))
            print("Handshake complete. Call stream is active!")
            
            # Initialize callback-based streams
            with sd.InputStream(device=input_device_index, samplerate=INPUT_SAMPLE_RATE, channels=CHANNELS, blocksize=INPUT_BLOCK_SIZE, dtype='float32', callback=input_callback), \
                 sd.OutputStream(device=output_device_index, samplerate=OUTPUT_SAMPLE_RATE, channels=CHANNELS, blocksize=OUTPUT_BLOCK_SIZE, dtype='float32', callback=output_callback):
                
                # Start concurrent capture and playback tasks
                send_task = asyncio.create_task(send_audio(websocket))
                receive_task = asyncio.create_task(receive_audio(websocket))
                
                await asyncio.gather(send_task, receive_task)
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nPhone Bridge stopped by user.")
