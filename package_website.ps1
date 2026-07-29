param()

Write-Host "Building static Next.js website..."
cd law-firm-website
npm run build
Write-Host "Packaging website..."
if (Test-Path "website.zip") { Remove-Item "website.zip" }
Compress-Archive -Path "out\*" -DestinationPath "website.zip" -Force
Write-Host "Done! You can now transfer website.zip to your server."