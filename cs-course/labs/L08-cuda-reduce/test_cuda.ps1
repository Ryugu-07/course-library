$ErrorActionPreference = "Stop"
New-Item -ItemType Directory -Force -Path build | Out-Null
nvcc -O3 -lineinfo reduce_scan.cu -o build/reduce_scan.exe
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
& .\build\reduce_scan.exe
exit $LASTEXITCODE

