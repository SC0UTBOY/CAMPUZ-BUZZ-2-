# CampuzBuzz Database Migration Guide

This guide provides step-by-step instructions for implementing the complete PostgreSQL schema in your Supabase project.

## 📋 Migration Overview

The schema has been split into 10 migration files for easier management:

1. **Core Tables** - Profiles, posts, comments, likes, notifications
2. **Study Groups & Events** - Academic features
3. **Chat & Messaging** - Real-time communication
4. **Community Features** - Community management, roles, hashtags
5. **Moderation & Security** - Content moderation, user safety
6. **Analytics & Notifications** - Tracking and push notifications
7. **RLS Policies** - Row Level Security policies
8. **Functions & Triggers** - Database automation
9. **Storage Setup** - File upload buckets and policies
10. **Search Optimization** - Full-text search and performance

## 🚀 Step-by-Step Migration Process

### Prerequisites

1. **Supabase Project**: Ensure you have a Supabase project set up
2. **Database Access**: Admin access to your Supabase SQL editor
3. **Backup**: Create a backup of your current database (if you have existing data)

### Migration Steps

#### 1. Access Supabase SQL Editor

```bash
# Open your Supabase dashboard
https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql
```

#### 2. Run Migrations in Order

**IMPORTANT**: Run these migrations in the exact order listed below:

##### Migration 1: Core Tables
```sql
-- Copy and paste content from: 20250919_01_core_tables.sql
-- This creates: profiles, communities_enhanced, posts, comments, likes, notifications
```

##### Migration 2: Study Groups & Events
```sql
-- Copy and paste content from: 20250919_02_study_groups_events.sql
-- This creates: study_groups, study_sessions, events, event_rsvps
```

##### Migration 3: Chat & Messaging
```sql
-- Copy and paste content from: 20250919_03_chat_messaging.sql
-- This creates: chat_rooms, messages, dm_conversations
```

##### Migration 4: Community Features
```sql
-- Copy and paste content from: 20250919_04_community_features.sql
-- This creates: community_members, hashtags, post_reactions
```

##### Migration 5: Moderation & Security
```sql
-- Copy and paste content from: 20250919_05_moderation_security.sql
-- This creates: moderation_actions, user_reports, security_events
```

##### Migration 6: Analytics & Notifications
```sql
-- Copy and paste content from: 20250919_06_analytics_notifications.sql
-- This creates: analytics_events, user_achievements, push_notification_tokens
```

##### Migration 7: RLS Policies
```sql
-- Copy and paste content from: 20250919_07_rls_policies.sql
-- This creates all Row Level Security policies
```

##### Migration 8: Functions & Triggers
```sql
-- Copy and paste content from: 20250919_08_functions_triggers.sql
-- This creates database functions and triggers
```

##### Migration 9: Storage Setup
```sql
-- Copy and paste content from: 20250919_09_storage_setup.sql
-- This creates storage buckets and policies
```

##### Migration 10: Search Optimization
```sql
-- Copy and paste content from: 20250919_10_search_optimization.sql
-- This creates search indexes and functions
```

### 3. Verify Migration Success

After each migration, check for errors in the SQL editor. If you encounter errors:

1. **Read the error message carefully**
2. **Check for missing dependencies** (tables that should have been created in previous migrations)
3. **Verify the migration order** - some tables depend on others
4. **Check for naming conflicts** with existing tables

### 4. Test Basic Functionality

```sql
-- Test basic queries
SELECT * FROM public.profiles LIMIT 1;
SELECT * FROM public.posts LIMIT 1;
SELECT * FROM public.communities_enhanced LIMIT 1;

-- Test RLS policies
SELECT current_user;
SELECT auth.uid();
```

## 🔧 Integration with Next.js

### 1. Update Supabase Types

Generate new TypeScript types for your updated schema:

```bash
# Install Supabase CLI if you haven't
npm install -g supabase

# Generate types
supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/supabase.ts
```

### 2. Update Supabase Client

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
```

### 3. Create Service Classes

```typescript
// src/services/postsService.ts
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/supabase'

type Post = Database['public']['Tables']['posts']['Row']
type PostInsert = Database['public']['Tables']['posts']['Insert']

export class PostsService {
  static async createPost(post: PostInsert): Promise<Post> {
    const { data, error } = await supabase
      .from('posts')
      .insert(post)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async getPosts(limit = 20, offset = 0): Promise<Post[]> {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles:user_id (
          display_name,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    if (error) throw error
    return data || []
  }
}
```

### 4. Authentication Integration

```typescript
// src/hooks/useAuth.ts
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return { user, loading }
}
```

## 🛡️ Security Best Practices

### 1. Row Level Security (RLS)

All tables have RLS enabled. Key policies include:

- **Profiles**: Users can view all profiles, update only their own
- **Posts**: Public posts visible to all, private posts only to owners
- **Communities**: Public communities visible, private only to members
- **Messages**: Only accessible to conversation participants

### 2. Storage Security

- **Avatars**: Users can only upload/modify their own avatars
- **Post Images**: Users can upload images, delete only their own
- **Study Materials**: Access restricted to study group members

### 3. Authentication Requirements

Most operations require authentication:

```typescript
// Check if user is authenticated
const { data: { user } } = await supabase.auth.getUser()
if (!user) throw new Error('Authentication required')
```

## 🔍 Search Implementation

### Full-Text Search

```typescript
// Search across all content types
const { data } = await supabase.rpc('search_all', {
  search_query: 'javascript tutorial',
  search_type: 'all', // 'posts', 'profiles', 'events', 'communities'
  limit_count: 20,
  offset_count: 0
})
```

### Trending Hashtags

```typescript
// Get trending hashtags
const { data } = await supabase.rpc('get_trending_hashtags', {
  limit_count: 10,
  time_window: '7 days'
})
```

## 📊 Performance Optimization

### 1. Indexes

The schema includes optimized indexes for:
- Full-text search (GIN indexes)
- Common query patterns (composite indexes)
- Partial indexes for filtered queries

### 2. Materialized Views

```sql
-- Refresh popular posts view
SELECT refresh_materialized_views();
```

### 3. Cleanup Functions

```sql
-- Clean up expired data
SELECT cleanup_expired_data();

-- Update trending topics
SELECT update_trending_topics();
```

## 🚨 Troubleshooting

### Common Issues

1. **Foreign Key Errors**
   - Ensure migrations are run in order
   - Check that referenced tables exist

2. **RLS Policy Errors**
   - Verify user authentication
   - Check policy conditions match your use case

3. **Storage Access Errors**
   - Confirm bucket policies are correctly set
   - Verify file paths match policy patterns

4. **Search Not Working**
   - Ensure search vectors are populated
   - Check that GIN indexes are created

### Migration Rollback

If you need to rollback:

```sql
-- Drop tables in reverse order
DROP TABLE IF EXISTS public.trending_topics CASCADE;
DROP TABLE IF EXISTS public.user_achievements CASCADE;
-- ... continue in reverse order
```

## 📞 Support

If you encounter issues:

1. Check the Supabase dashboard for error logs
2. Verify all migrations completed successfully
3. Test with simple queries first
4. Check RLS policies if access is denied

## 🎉 Next Steps

After successful migration:

1. **Test Core Features**: Create posts, comments, likes
2. **Implement Search**: Add search functionality to your UI
3. **Set Up Real-time**: Configure real-time subscriptions
4. **Add File Uploads**: Implement image and file upload features
5. **Configure Analytics**: Set up event tracking
6. **Implement Moderation**: Add content moderation features

Your CampuzBuzz database is now ready for production! 🚀
