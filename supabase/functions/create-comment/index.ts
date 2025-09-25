import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Define allowed origins
const allowedOrigins = [
  'http://localhost:8080', // Your local frontend (Vite dev server)
  'http://localhost:8082', // Alternative port
  'https://seqxzvkodvrqvrvekygy.supabase.co' // Your production domain
];

// Function to get appropriate CORS headers
const getCorsHeaders = (origin: string | null) => {
  if (origin && allowedOrigins.includes(origin)) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    };
  }
  // Fallback for other cases (e.g. server-side rendering or blocked origin)
  return {
    'Access-Control-Allow-Origin': '*', // More permissive for development, but consider tightening
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
};

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
}

serve(async (req) => {
  const origin = req.headers.get('Origin');
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { postId, content, parent_id }: { postId: string; content: string; parent_id?: string } = await req.json();

    if (!postId) {
      return new Response(
        JSON.stringify({ error: 'Post ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!content || !content.trim()) {
      return new Response(
        JSON.stringify({ error: 'Comment content is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let depth = 0;
    if (parent_id) {
      const { data: parentComment } = await supabaseClient
        .from('comments')
        .select('depth')
        .eq('id', parent_id)
        .maybeSingle();

      depth = Math.min((parentComment?.depth || 0) + 1, 3);
    }

    const { data: comment, error: commentError } = await supabaseClient
      .from('comments')
      .insert({
        post_id: postId,
        user_id: user.id,
        content: content.trim(),
        parent_id: parent_id || null,
        depth: depth
      })
      .select()
      .maybeSingle();

    if (commentError) {
      console.error('Error creating comment:', commentError);
      return new Response(
        JSON.stringify({ error: 'Failed to create comment', details: commentError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      console.warn('Profile not found for user:', user.id, profileError);
    }

    const commentWithProfile: Comment = {
      ...comment,
      reactions: (comment.reactions as Record<string, any>) || {},
      profiles: profile ? {
        id: profile.id,
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
        major: profile.major,
        year: profile.year
      } : {
        id: user.id,
        display_name: 'Unknown User',
        avatar_url: null,
        major: null,
        year: null
      }
    };

    return new Response(
      JSON.stringify(commentWithProfile),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in create-comment function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});