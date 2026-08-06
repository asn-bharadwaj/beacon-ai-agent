$ErrorActionPreference = "Stop"

# Dynamically add default installation paths for uv, Node.js, and pnpm to this script's local PATH environment
$uvPath = "$env:USERPROFILE\.local\bin"
$pnpmPath = "$env:APPDATA\npm"
$nodePath = "C:\Program Files\nodejs"

if (Test-Path $uvPath) { $env:PATH = "$uvPath;$env:PATH" }
if (Test-Path $pnpmPath) { $env:PATH = "$pnpmPath;$env:PATH" }
if (Test-Path $nodePath) { $env:PATH = "$nodePath;$env:PATH" }


function Test-CommandExists {
  param([string]$CommandName)

  return $null -ne (Get-Command $CommandName -ErrorAction SilentlyContinue)
}

if (-not (Test-CommandExists "uv")) {
  Write-Error "Missing required command: uv"
}

if (-not (Test-CommandExists "pnpm")) {
  Write-Error "Missing required command: pnpm"
}

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

# Start each service in its own PowerShell window so logs remain visible.
if (Test-CommandExists "livekit-server") {
  Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$repoRoot'; livekit-server --dev"
} else {
  Write-Warning "livekit-server was not found. Skipping local LiveKit startup and using your configured LIVEKIT_URL instead."
}

Start-Process powershell -ArgumentList "-ExecutionPolicy Bypass", "-NoExit", "-Command", "Set-Location '$repoRoot\backend'; `$env:PATH = '$uvPath;' + `$env:PATH; uv run python src/agent.py dev"
Start-Process powershell -ArgumentList "-ExecutionPolicy Bypass", "-NoExit", "-Command", "Set-Location '$repoRoot\frontend'; `$env:PATH = '$pnpmPath;$nodePath;' + `$env:PATH; pnpm dev"

Write-Host "Started backend and frontend in separate PowerShell windows."
