-- ============================================
-- FIX POST LIKE COUNTS
-- ============================================
-- This script will:
-- 1. Update all posts with their REAL like count
-- 2. Create triggers to keep counts updated automatically

-- Step 1: Update all posts with real like counts
UPDATE posts
SET likes_count = (
  SELECT COUNT(*)
  FROM likes
  WHERE likes.post_id = posts.id
);

-- Step 2: Create function to auto-update like counts
CREATE OR REPLACE FUNCTION update_post_like_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts
  SET likes_count = (
    SELECT COUNT(*)
    FROM likes
    WHERE post_id = COALESCE(NEW.post_id, OLD.post_id)
  )
  WHERE id = COALESCE(NEW.post_id, OLD.post_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Step 3: Drop old triggers if they exist
DROP TRIGGER IF EXISTS update_like_count_on_like ON likes;
DROP TRIGGER IF EXISTS update_like_count_on_unlike ON likes;

-- Step 4: Create triggers for automatic updates
CREATE TRIGGER update_like_count_on_like
AFTER INSERT ON likes
FOR EACH ROW
EXECUTE FUNCTION update_post_like_count();

CREATE TRIGGER update_like_count_on_unlike
AFTER DELETE ON likes
FOR EACH ROW
EXECUTE FUNCTION update_post_like_count();

-- Step 5: Verify the fix worked
SELECT 
  '✅ Verification Results' as message,
  p.id,
  p.content,
  p.likes_count as stored_count,
  COUNT(l.id) as actual_likes,
  CASE 
    WHEN p.likes_count = COUNT(l.id) THEN '✅ Correct'
    ELSE '❌ Mismatch'
  END as status
FROM posts p
LEFT JOIN likes l ON p.id = l.post_id
GROUP BY p.id, p.content, p.likes_count
ORDER BY p.created_at DESC
LIMIT 20;

SELECT '🎉 Fix complete! Like counts are now accurate and will auto-update.' as final_message;
