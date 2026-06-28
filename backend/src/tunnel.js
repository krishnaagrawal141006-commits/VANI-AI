import { spawn } from 'child_process';

export function startTunnel() {
  console.log('[Tunnel] Starting localtunnel on port 5050...');
  
  const child = spawn('npx', ['localtunnel', '--port', '5050', '--subdomain', 'vaniai-telecom'], {
    shell: true
  });

  child.stdout.on('data', (data) => {
    const output = data.toString();
    const cleanOutput = output.trim();
    if (cleanOutput) {
      console.log(`[Tunnel Log] ${cleanOutput}`);
    }
    
    const match = output.match(/your url is:\s+(https:\/\/\S+)/i);
    if (match) {
      const url = match[1];
      console.log(`🚀 [Tunnel] Dynamic Tunnel URL established: ${url}`);
      process.env.PUBLIC_URL = url;
    }
  });

  child.stderr.on('data', (data) => {
    const errOutput = data.toString().trim();
    if (errOutput) {
      console.error(`[Tunnel Error Log] ${errOutput}`);
    }
  });

  child.on('close', (code) => {
    console.log(`[Tunnel] localtunnel exited with code ${code}. Restarting in 5 seconds...`);
    setTimeout(startTunnel, 5000);
  });
}
