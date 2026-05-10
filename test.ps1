# Login pour récupérer un token
$loginBody = @{ email = "patient@test.com"; password = "test1234" } | ConvertTo-Json

$resp = Invoke-RestMethod -Uri "http://localhost:4000/api/auth/login" `
    -Method POST -ContentType "application/json" -Body $loginBody

$token = $resp.accessToken
Write-Host "Token: $($token.Substring(0,30))..."

# Tester POST /consultations
$consultBody = @{ reason = "fievre" } | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:4000/api/consultations" `
    -Method POST -ContentType "application/json" `
    -Headers @{ Authorization = "Bearer $token" } -Body $consultBody