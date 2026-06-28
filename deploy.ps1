# deploy.ps1
# Script to automate deployment of DineSaathi Backend to your AWS VPS.

# 1. Get VPS details from user
$vpsIp = (Read-Host -Prompt "Enter your AWS VPS Public IP address").Trim().Trim('"', "'")
$username = (Read-Host -Prompt "Enter the VPS username [Default: ubuntu]").Trim().Trim('"', "'")
if (-not $username) { $username = "ubuntu" }

$keyPath = (Read-Host -Prompt "Enter the path to your AWS private key (.pem file)").Trim().Trim('"', "'")
if (-not $keyPath) {
    Write-Error "Private key path is required."
    exit
}

# 2. Verify key file exists
if (-not (Test-Path $keyPath)) {
    Write-Error "Private key file not found at $keyPath. Please check the path and try again."
    exit
}

Write-Host "`n[1/3] Copying backend files to AWS VPS ($vpsIp)..." -ForegroundColor Cyan
# Run SCP to copy backend folder to the server
scp -i $keyPath -r ./backend "${username}@${vpsIp}:/home/${username}/dinesaathi-backend"

if ($LASTEXITCODE -ne 0) {
    Write-Host "`nFailed to copy files via SCP. Please verify your IP, username, and key file." -ForegroundColor Red
    exit
}

Write-Host "`n[2/3] Installing dependencies and starting server with PM2..." -ForegroundColor Cyan
# Commands to execute on the remote VPS
$remoteCommands = @"
cd /home/${username}/dinesaathi-backend &&
npm install --production &&
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2 globally..."
    sudo npm install -g pm2
fi &&
pm2 delete dinesaathi-backend 2>/dev/null || true &&
pm2 start src/server.js --name dinesaathi-backend &&
pm2 save
"@

ssh -i $keyPath "${username}@${vpsIp}" $remoteCommands

if ($LASTEXITCODE -ne 0) {
    Write-Host "`nFailed to execute setup commands over SSH." -ForegroundColor Red
    exit
}

Write-Host "`n[3/3] Deployment completed successfully!" -ForegroundColor Green
Write-Host "Your server is running on the VPS. If you configured localtunnel or ngrok, check the console logs on the server for the public URL." -ForegroundColor Yellow
