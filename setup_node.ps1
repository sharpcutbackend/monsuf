# setup_node.ps1
$ErrorActionPreference = "Stop"

$workspaceDir = "c:\Users\izzyb\Pictures\Monsuf"
$nodeZipUrl = "https://nodejs.org/dist/v20.12.2/node-v20.12.2-win-x64.zip"
$zipPath = Join-Path $workspaceDir "node.zip"
$extractPath = Join-Path $workspaceDir "node_temp"
$nodeEnvPath = Join-Path $workspaceDir "node_env"

if (Test-Path $nodeEnvPath) {
    Write-Host "node_env folder already exists. Verifying node executable..."
    $nodeExe = Join-Path $nodeEnvPath "node.exe"
    if (Test-Path $nodeExe) {
        Write-Host "Node.js executable found!"
        & $nodeExe -v
        exit 0
    } else {
        Write-Host "Node.js executable missing, re-downloading..."
        Remove-Item -Path $nodeEnvPath -Recurse -Force
    }
}

Write-Host "Downloading portable Node.js v20.12.2..."
Invoke-WebRequest -Uri $nodeZipUrl -OutFile $zipPath

Write-Host "Extracting archive..."
if (Test-Path $extractPath) {
    Remove-Item -Path $extractPath -Recurse -Force
}
New-Item -ItemType Directory -Path $extractPath | Out-Null
Expand-Archive -Path $zipPath -DestinationPath $extractPath

Write-Host "Setting up node_env folder..."
$extractedFolder = Get-ChildItem -Path $extractPath -Directory | Select-Object -First 1
Move-Item -Path $extractedFolder.FullName -Destination $nodeEnvPath

Write-Host "Cleaning up temp files..."
Remove-Item -Path $zipPath -Force
Remove-Item -Path $extractPath -Recurse -Force

$nodeExe = Join-Path $nodeEnvPath "node.exe"
if (Test-Path $nodeExe) {
    Write-Host "Node.js environment setup successfully!"
    Write-Host "Node version:"
    & $nodeExe -v
} else {
    Write-Error "Failed to locate node.exe after extraction"
}
