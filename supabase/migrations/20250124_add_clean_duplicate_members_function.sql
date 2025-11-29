-- Add function to clean duplicate community members
-- This ensures idempotent join operations

CREATE OR REPLACE FUNCTION clean_duplicate_members()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete duplicate memberships, keeping only the oldest one for each (community_id, user_id) pair
  DELETE FROM public.community_members
  WHERE id IN (
    SELECT id
    FROM (
      SELECT id,
             ROW_NUMBER() OVER (
               PARTITION BY community_id, user_id 
               ORDER BY joined_at ASC
             ) AS rn
      FROM public.community_members
    ) duplicates
    WHERE rn > 1
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION clean_duplicate_members() TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION clean_duplicate_members() IS 'Removes duplicate community memberships, keeping the oldest record for each user-community pair';



