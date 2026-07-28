param()

Write-Host "Packaging standalone Next.js app..."
cd frontend
Copy-Item -Path "public" -Destination ".next/standalone/" -Recurse -Force
Copy-Item -Path ".next/static" -Destination ".next/standalone/.next/" -Recurse -Force
Compress-Archive -Path ".next/standalone/*" -DestinationPath "standalone.zip" -Force
Write-Host "Done!"
