@echo off
echo Deploying Supabase Edge Functions...

REM Deploy create-comment function
echo Deploying create-comment function...
supabase functions deploy create-comment --project-ref seqxzvkodvrqvrvekygy

REM Deploy get-comments function
echo Deploying get-comments function...
supabase functions deploy get-comments --project-ref seqxzvkodvrqvrvekygy

echo.
echo Functions deployed successfully!
echo Please test your comment posting functionality now.
pause
