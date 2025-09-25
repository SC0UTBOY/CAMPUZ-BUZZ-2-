# Test script for Supabase Edge Function
param(
    [string]$AuthToken = "",
    [string]$PostId = "test-post-id",
    [string]$Content = "Test comment from PowerShell"
)

Write-Host "Testing create-comment Edge Function..." -ForegroundColor Green

if ([string]::IsNullOrEmpty($AuthToken)) {
    Write-Host "Error: Please provide an auth token" -ForegroundColor Red
    Write-Host "Usage: .\test-function.ps1 -AuthToken 'your-jwt-token' -PostId 'actual-post-id'" -ForegroundColor Yellow
    exit 1
}

$headers = @{
    'Authorization' = "Bearer $AuthToken"
    'Content-Type' = 'application/json'
    'Origin' = 'http://localhost:8080'
}

$body = @{
    postId = $PostId
    content = $Content
} | ConvertTo-Json

try {
    Write-Host "Sending request to function..." -ForegroundColor Yellow
    $response = Invoke-RestMethod -Uri 'https://seqxzvkodvrqvrvekygy.supabase.co/functions/v1/create-comment' -Method POST -Headers $headers -Body $body
    
    Write-Host "Success! Function response:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 3
} catch {
    Write-Host "Error calling function:" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response body: $responseBody" -ForegroundColor Yellow
    }
}
