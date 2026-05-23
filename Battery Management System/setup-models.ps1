# Copies trained .joblib models from your BMS folder into this project (one-time).
$Source = "C:\Users\RAZEEN\Downloads\AI_CEP\BMS\battery_classifier\models"
$Dest = "$PSScriptRoot\server\models"

if (-not (Test-Path $Source)) {
    Write-Host "Optional copy source not found: $Source" -ForegroundColor Yellow
    Write-Host "If server\models\*.joblib are missing, run: npm run train (needs dataset) or commit models to the repo." -ForegroundColor Yellow
    exit 0
}

New-Item -ItemType Directory -Force -Path $Dest | Out-Null
Copy-Item "$Source\*.joblib" $Dest -Force -ErrorAction SilentlyContinue
Copy-Item "$Source\metadata.json" $Dest -Force -ErrorAction SilentlyContinue

$count = (Get-ChildItem $Dest -Filter "*.joblib").Count
if ($count -ge 3) {
    Write-Host "Copied $count model files to server\models\" -ForegroundColor Green
} else {
    Write-Host "No .joblib files found. Run training in BMS folder or: npm run train" -ForegroundColor Yellow
}

# Copy ESP32 sketches into this repo
$espSrc = "C:\Users\RAZEEN\Downloads\AI_CEP\BMS\battery_classifier\esp32"
$espDst = "$PSScriptRoot\server\esp32"
if (Test-Path $espSrc) {
    robocopy $espSrc $espDst /E /NFL /NDL /NJH /NJS | Out-Null
    Write-Host "ESP32 sketches copied to server\esp32\" -ForegroundColor Green
}
