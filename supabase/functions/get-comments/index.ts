import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  parent_id?: string;
  depth: number;
  likes_count: number;
  reply_count: number;
  created_at: string;
  updated_at: string;
  reactions: Record<string, any>;
  profiles: {
    id: string;
    display_name: string;
    avatar_url?: string;
    major?: string;
    year?: string;
  };
  replies?: Comment[];
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body
    const { postId, limit = 20 }: { postId: string; limit?: number } = await req.json()

    if (!postId) {
      return new Response(
        JSON.stringify({ error: 'Post ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get user from auth
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // First, get comments
    const { data: comments, error: commentsError } = await supabaseClient
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
      .limit(limit)

    if (commentsError) {
      console.error('Error fetching comments:', commentsError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch comments' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!comments || comments.length === 0) {
      return new Response(
        JSON.stringify([]),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user IDs from comments
    const userIds = [...new Set(comments.map(c => c.user_id))]

    // Get profiles for these users
    const { data: profiles, error: profilesError } = await supabaseClient
      .from('profiles')
      .select('*')
      .in('id', userIds)

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch profiles' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create a map of user_id to profile
    const profileMap = new Map()
    profiles?.forEach(profile => {
      profileMap.set(profile.id, profile)
    })

    // Combine comments with profiles
    const commentsWithProfiles = comments.map(comment => ({
      ...comment,
      reactions: (comment.reactions as Record<string, any>) || {},
      profiles: profileMap.get(comment.user_id) || {
        id: comment.user_id,
        user_id: comment.user_id,
        display_name: 'Unknown User',
        avatar_url: null,
        major: null,
        year: null
      }
    }))

    // Transform flat comments into threaded structure
    const threadedComments = buildCommentTree(commentsWithProfiles)

    return new Response(
      JSON.stringify(threadedComments),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in get-comments function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Build threaded comment tree from flat array
function buildCommentTree(comments: any[]): Comment[] {
  const commentMap = new Map<string, Comment>()
  const rootComments: Comment[] = []

  // First pass: create comment objects
  comments.forEach(comment => {
    const processedComment: Comment = {
      ...comment,
      profiles: Array.isArray(comment.profiles) ? comment.profiles[0] : comment.profiles,
      replies: [],
      reply_count: 0
    }
    commentMap.set(comment.id, processedComment)
  })

  // Second pass: build tree structure
  comments.forEach(comment => {
    const processedComment = commentMap.get(comment.id)!
    if (comment.parent_id) {
      const parent = commentMap.get(comment.parent_id)
      if (parent) {
        parent.replies = parent.replies || []
        parent.replies.push(processedComment)
        parent.reply_count = (parent.reply_count || 0) + 1
      }
    } else {
      rootComments.push(processedComment)
    }
  })

  // Sort replies by creation time
  const sortReplies = (comment: Comment) => {
    if (comment.replies && comment.replies.length > 0) {
      comment.replies.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      comment.replies.forEach(sortReplies)
    }
  }

  rootComments.forEach(sortReplies)
  return rootComments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}
