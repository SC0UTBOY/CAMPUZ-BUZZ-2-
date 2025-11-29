-- Create user_profiles view to access auth.users data
CREATE OR REPLACE VIEW public.user_profiles AS
SELECT
  id,
  raw_user_meta_data->>'full_name' AS full_name,
  raw_user_meta_data->>'avatar_url' AS avatar_url,
  email
FROM auth.users;

-- Grant access to authenticated users
GRANT SELECT ON public.user_profiles TO authenticated;

-- Enable RLS on the view
ALTER VIEW public.user_profiles SET (security_invoker = true);
