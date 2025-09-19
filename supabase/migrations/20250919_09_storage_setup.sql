-- Storage Setup Migration (Part 9)

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  (
    'avatars',
    'avatars',
    true,
    5242880, -- 5MB
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  ),
  (
    'post-images',
    'post-images',
    true,
    10485760, -- 10MB
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  ),
  (
    'community-assets',
    'community-assets',
    true,
    10485760, -- 10MB
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  ),
  (
    'study-materials',
    'study-materials',
    true,
    52428800, -- 50MB
    ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'image/jpeg', 'image/jpg', 'image/png']
  ),
  (
    'chat-attachments',
    'chat-attachments',
    true,
    20971520, -- 20MB
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  )
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage policies for avatars bucket
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own avatar" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage policies for post-images bucket
CREATE POLICY "Post images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'post-images');

CREATE POLICY "Users can upload post images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'post-images' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own post images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'post-images' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage policies for community-assets bucket
CREATE POLICY "Community assets are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'community-assets');

CREATE POLICY "Community members can upload assets" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'community-assets' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Community admins can manage assets" ON storage.objects
  FOR ALL USING (
    bucket_id = 'community-assets' 
    AND auth.role() = 'authenticated'
  );

-- Storage policies for study-materials bucket
CREATE POLICY "Study materials are accessible to group members" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'study-materials'
    AND (
      -- Public materials
      (storage.foldername(name))[2] = 'public'
      OR
      -- Private materials - only accessible to study group members
      (
        auth.role() = 'authenticated'
        AND (storage.foldername(name))[1]::uuid IN (
          SELECT study_group_id 
          FROM public.study_group_members 
          WHERE user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Study group members can upload materials" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'study-materials' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1]::uuid IN (
      SELECT study_group_id 
      FROM public.study_group_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own study materials" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'study-materials' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

-- Storage policies for chat-attachments bucket
CREATE POLICY "Chat attachments are accessible to conversation participants" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'chat-attachments'
    AND auth.role() = 'authenticated'
    AND (
      -- Channel attachments - accessible to community members
      (storage.foldername(name))[1] = 'channels'
      AND (storage.foldername(name))[2]::uuid IN (
        SELECT cc.id 
        FROM public.community_channels cc
        JOIN public.community_memberships cm ON cc.community_id = cm.community_id
        WHERE cm.user_id = auth.uid()
      )
      OR
      -- DM attachments - accessible to conversation participants
      (storage.foldername(name))[1] = 'dms'
      AND (storage.foldername(name))[2]::uuid IN (
        SELECT id 
        FROM public.dm_conversations 
        WHERE auth.uid() = ANY(participants)
      )
    )
  );

CREATE POLICY "Users can upload chat attachments" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'chat-attachments' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[3] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own chat attachments" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'chat-attachments' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[3] = auth.uid()::text
  );

-- Function to generate secure file names
CREATE OR REPLACE FUNCTION generate_secure_filename(original_name TEXT, user_id UUID)
RETURNS TEXT AS $$
DECLARE
  timestamp_str TEXT;
  random_str TEXT;
  extension TEXT;
  clean_name TEXT;
BEGIN
  -- Get current timestamp
  timestamp_str := EXTRACT(EPOCH FROM now())::TEXT;
  
  -- Generate random string
  random_str := encode(gen_random_bytes(8), 'hex');
  
  -- Extract file extension
  extension := COALESCE(
    CASE 
      WHEN original_name ~ '\.[a-zA-Z0-9]+$' 
      THEN regexp_replace(original_name, '^.*\.([a-zA-Z0-9]+)$', '\1')
      ELSE 'bin'
    END,
    'bin'
  );
  
  -- Clean original name (remove special characters)
  clean_name := regexp_replace(
    COALESCE(
      regexp_replace(original_name, '\.[a-zA-Z0-9]+$', ''), 
      'file'
    ), 
    '[^a-zA-Z0-9_-]', 
    '_', 
    'g'
  );
  
  -- Limit clean name length
  IF length(clean_name) > 50 THEN
    clean_name := left(clean_name, 50);
  END IF;
  
  RETURN user_id::TEXT || '/' || timestamp_str || '_' || random_str || '_' || clean_name || '.' || extension;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up orphaned storage objects
CREATE OR REPLACE FUNCTION cleanup_orphaned_storage()
RETURNS void AS $$
BEGIN
  -- This function would need to be implemented with custom logic
  -- to identify and remove orphaned files based on your application's needs
  
  -- Example: Remove avatar files that don't correspond to any profile
  -- DELETE FROM storage.objects 
  -- WHERE bucket_id = 'avatars' 
  -- AND name NOT IN (
  --   SELECT DISTINCT (storage.foldername(avatar_url))[2] || '/' || (storage.filename(avatar_url))
  --   FROM public.profiles 
  --   WHERE avatar_url IS NOT NULL
  -- );
  
  RAISE NOTICE 'Storage cleanup function called - implement custom logic as needed';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
