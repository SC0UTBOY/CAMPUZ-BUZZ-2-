-- ============================================
-- COMPLETE FIX FOR COMMUNITY MEMBER COUNTS
-- ============================================
-- This script will:
-- 1. Add creators as members to their communities (if missing)
-- 2. Update all member counts to real values
-- 3. Create triggers for automatic updates

-- Step 1: Add creators as members if they're not already
-- This fixes communities where the creator wasn't added as a member
INSERT INTO community_members (community_id, user_id, joined_at)
SELECT 
  c.id as community_id,
  c.created_by as user_id,
  c.created_at as joined_at
FROM communities c
WHERE NOT EXISTS (
  SELECT 1 
  FROM community_members cm 
  WHERE cm.community_id = c.id 
    AND cm.user_id = c.created_by
);

-- Step 2: Update all communities with real member counts
UPDATE communities
SET member_count = (
  SELECT COUNT(*)
  FROM community_members
  WHERE community_members.community_id = communities.id
);

-- Step 3: Create function to auto-update member counts
CREATE OR REPLACE FUNCTION update_community_member_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE communities
  SET member_count = (
    SELECT COUNT(*)
    FROM community_members
    WHERE community_id = COALESCE(NEW.community_id, OLD.community_id)
  )
  WHERE id = COALESCE(NEW.community_id, OLD.community_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Step 4: Drop old triggers if they exist
DROP TRIGGER IF EXISTS update_member_count_on_join ON community_members;
DROP TRIGGER IF EXISTS update_member_count_on_leave ON community_members;

-- Step 5: Create triggers for automatic updates
CREATE TRIGGER update_member_count_on_join
AFTER INSERT ON community_members
FOR EACH ROW
EXECUTE FUNCTION update_community_member_count();

CREATE TRIGGER update_member_count_on_leave
AFTER DELETE ON community_members
FOR EACH ROW
EXECUTE FUNCTION update_community_member_count();

-- Step 6: Verify the fix worked
SELECT 
  '✅ Verification Results' as message,
  c.name as community_name,
  c.member_count as displayed_count,
  COUNT(cm.id) as actual_members,
  CASE 
    WHEN c.member_count = COUNT(cm.id) THEN '✅ Correct'
    ELSE '❌ Mismatch'
  END as status
FROM communities c
LEFT JOIN community_members cm ON c.id = cm.community_id
GROUP BY c.id, c.name, c.member_count
ORDER BY c.name;

SELECT '🎉 Fix complete! Member counts are now accurate and will auto-update.' as final_message;
