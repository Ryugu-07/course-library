$ErrorActionPreference = "Stop"
New-Item -ItemType Directory -Force -Path build | Out-Null
nvcc -O3 -lineinfo attention.cu -o build/attention.exe
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
& .\build\attention.exe
exit $LASTEXITCODE

