# Comment Posting Debug Guide

## Issue Found: CORS Port Mismatch
Your Vite dev server runs on port **8080**, but your Edge Function CORS was configured for port **8082**.

## ✅ Fixed
- Updated `supabase/functions/create-comment/index.ts` to allow `http://localhost:8080`

## Next Steps to Deploy & Test

### 1. Check Function Deployment Status
Visit your Supabase Dashboard:
- Go to: https://supabase.com/dashboard/project/seqxzvkodvrqvrvekygy
- Navigate to: **Edge Functions** section
- Check if `create-comment` and `get-comments` functions are deployed
- If not deployed, you'll need to deploy them

### 2. Deploy Functions (Choose One Method)

#### Method A: Via Supabase Dashboard
1. Go to Edge Functions in your dashboard
2. Create new function or update existing
3. Copy the code from `supabase/functions/create-comment/index.ts`
4. Deploy directly from the web interface

#### Method B: Install Supabase CLI (Alternative Methods)
```bash
# Try with Chocolatey (if you have it)
choco install supabase

# Or download directly from GitHub
# Visit: https://github.com/supabase/cli/releases
# Download the Windows binary and add to PATH
```

#### Method C: Use the deployment scripts I created
```bash
# After CLI is installed, run:
.\deploy-functions.ps1
# or
.\deploy-functions.bat
```

### 3. Test the Function

#### Method A: Use the test script I created
```powershell
# Get your auth token from browser dev tools (Application > Local Storage > supabase.auth.token)
.\test-function.ps1 -AuthToken "your-jwt-token" -PostId "actual-post-id"
```

#### Method B: Test in your app with enhanced logging
1. Start your dev server: `npm run dev`
2. Open browser dev tools (F12)
3. Try posting a comment
4. Check console for detailed error information

### 4. Common Issues & Solutions

#### Issue: "Function not found" or 404 error
- **Solution**: Function not deployed. Deploy via dashboard or CLI.

#### Issue: CORS error
- **Solution**: Already fixed in the code. Deploy the updated function.

#### Issue: "Unauthorized" error
- **Solution**: Check if user is logged in and session is valid.

#### Issue: "Failed to send request"
- **Solution**: Check network connectivity and function URL.

### 5. Manual Function URL Test
Test if the function endpoint exists:
```bash
curl -X OPTIONS "https://seqxzvkodvrqvrvekygy.supabase.co/functions/v1/create-comment" -H "Origin: http://localhost:8080"
```

Expected response: HTTP 200 with CORS headers

### 6. Verify Environment Variables
In Supabase Dashboard > Settings > API:
- Ensure `SUPABASE_URL` and `SUPABASE_ANON_KEY` match your `.env` file
- Check that Edge Functions have access to these environment variables

## Quick Checklist
- [ ] Function code updated with correct CORS port (8080)
- [ ] Function deployed to Supabase
- [ ] User is authenticated in the app
- [ ] Network connectivity is working
- [ ] Browser dev tools show detailed error logs

## Need Help?
If you're still having issues:
1. Share the exact error message from browser console
2. Confirm if functions are visible in Supabase dashboard
3. Check if you can access the function URL directly
