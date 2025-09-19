# PowerShell script to deploy Supabase Edge Functions

Write-Host "Deploying Supabase Edge Functions..." -ForegroundColor Green

# Deploy create-comment function
Write-Host "Deploying create-comment function..." -ForegroundColor Yellow
supabase functions deploy create-comment --project-ref seqxzvkodvrqvrvekygy

# Deploy get-comments function  
Write-Host "Deploying get-comments function..." -ForegroundColor Yellow
supabase functions deploy get-comments --project-ref seqxzvkodvrqvrvekygy

Write-Host ""
Write-Host "Functions deployed successfully!" -ForegroundColor Green
Write-Host "Please test your comment posting functionality now." -ForegroundColor Cyan
