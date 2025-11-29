import { useEffect, useState } from 'react';
import { useParams, useNavigate, NavigateFunction } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  Image as ImageIcon,
  Send,
  MoreVertical,
  Trash2,
  Users,
  Lock,
  Globe,
  Loader2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  joinCommunity,
  leaveCommunity,
  isCommunityMember,
  fetchCommunityPosts,
  deleteCommunityPost,
  createCommunityPost
} from '@/services/communityActions';
import CreateImagePostModal from '@/components/community/CreateImagePostModal';

// Types based on Supabase schema
interface Community {
  id: string;
  name: string;
  description: string | null;
  is_private: boolean | null;
  member_count: number | null;
  created_by: string;
  category: string | null;
  created_at: string;
}

interface CommunityPost {
  id: string;
  community_id: string;
  user_id: string;
  caption: string | null;
  image_url: string | null;
  image_path: string | null;
  post_type: string;
  created_at: string | null;
  comments_count: number | null;
  reactions: any;
  profiles?: {
    display_name: string | null;
    avatar_url: string | null;
    username: string | null;
  };
}

export default function CommunityPage() {
  const { id: communityId } = useParams<{ id: string }>();
  const navigate: NavigateFunction = useNavigate();
  const { toast } = useToast();

  // State
  const [community, setCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [userIsMember, setUserIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  // Post creation state
  const [newPostText, setNewPostText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

  useEffect(() => {
    if (communityId) {
      initializePage();
    }
  }, [communityId]);

  // Realtime subscription
  useEffect(() => {
    if (!communityId) return;

    const channel = supabase
      .channel(`community-posts:${communityId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'community_posts',
          filter: `community_id=eq.${communityId}`
        },
        () => {
          loadPosts(); // Refresh posts on any change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [communityId]);

  const initializePage = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user?.id || null);

      await Promise.all([
        fetchCommunityDetails(),
        checkMembership(),
        loadPosts()
      ]);
    } catch (error) {
      console.error("Error initializing page:", error);
      toast({
        title: "Error",
        description: "Failed to load community data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCommunityDetails = async () => {
    if (!communityId) return;
    const { data, error } = await supabase
      .from('communities')
      .select('*')
      .eq('id', communityId)
      .single();

    if (error) throw error;
    setCommunity(data);
  };

  const checkMembership = async () => {
    if (!communityId) {
      setUserIsMember(false);
      return;
    }
    const isMember = await isCommunityMember(communityId);
    setUserIsMember(isMember);
  };

  const loadPosts = async () => {
    if (!communityId) return;

    const result = await fetchCommunityPosts(communityId);
    if (result.success && result.data) {
      setPosts(result.data as unknown as CommunityPost[]);
    } else {
      console.error("Failed to load posts:", result.error);
    }
  };

  const handleJoin = async () => {
    if (!communityId || !currentUser) {
      toast({ title: "Please login to join", variant: "destructive" });
      return;
    }

    try {
      const result = await joinCommunity(communityId);
      if (result.success) {
        setUserIsMember(true);
        toast({ title: "Joined community successfully!" });
        fetchCommunityDetails(); // Refresh member count
        // Redirect to ensure we are on the correct route and state is fresh
        navigate(`/communities/${communityId}`);
      }
    } catch (error) {
      console.error("Join error:", error);
      toast({ title: "Failed to join", variant: "destructive" });
    }
  };

  const handleLeave = async () => {
    if (!communityId) return;

    try {
      const result = await leaveCommunity(communityId);
      if (result.success) {
        setUserIsMember(false);
        toast({ title: "Left community" });
        fetchCommunityDetails(); // Refresh member count
      }
    } catch (error) {
      console.error("Leave error:", error);
      toast({ title: "Failed to leave", variant: "destructive" });
    }
  };

  const handleCreateTextPost = async () => {
    if (!communityId || !currentUser) return;
    if (!newPostText.trim()) {
      toast({ title: "Post cannot be empty", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const result = await createCommunityPost({
        user_id: currentUser,
        community_id: communityId,
        caption: newPostText,
        image_url: null,
        image_path: null
      });

      if (result.success && result.data) {
        toast({ title: "Post created!" });
        setNewPostText("");
        // Add the new post to the top of the list immediately
        setPosts([result.data as CommunityPost, ...posts]);
      } else {
        throw result.error;
      }
    } catch (error) {
      console.error("Create post error:", error);
      toast({ title: "Failed to create post", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      const result = await deleteCommunityPost(postId);
      if (result.success) {
        toast({ title: "Post deleted" });
        setPosts(posts.filter(p => p.id !== postId));
      } else {
        throw result.error;
      }
    } catch (error) {
      console.error("Delete post error:", error);
      toast({ title: "Failed to delete post", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!community) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h1 className="text-2xl font-bold">Community not found</h1>
        <Button onClick={() => navigate('/communities')} className="mt-4">
          Back to Communities
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto py-6 px-4">
          <Button
            variant="ghost"
            className="mb-4 pl-0 hover:bg-transparent"
            onClick={() => navigate('/communities')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Communities
          </Button>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold">{community.name}</h1>
              <p className="text-muted-foreground mt-1">{community.description}</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {community.member_count || 0} members
                </span>
                <span className="flex items-center gap-1">
                  {community.is_private ? (
                    <><Lock className="h-4 w-4" /> Private</>
                  ) : (
                    <><Globe className="h-4 w-4" /> Public</>
                  )}
                </span>
              </div>
            </div>

            <Button
              variant={userIsMember ? "outline" : "default"}
              onClick={userIsMember ? handleLeave : handleJoin}
            >
              {userIsMember ? "Leave Community" : "Join Community"}
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto py-8 px-4 max-w-3xl">
        {/* Create Post Section */}
        {userIsMember && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg">Create a Post</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="What's on your mind?"
                value={newPostText}
                onChange={(e) => setNewPostText(e.target.value)}
                className="mb-4"
              />
              <div className="flex justify-between items-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowImageModal(true)}
                >
                  <ImageIcon className="mr-2 h-4 w-4" />
                  Add Image
                </Button>
                <Button
                  onClick={handleCreateTextPost}
                  disabled={uploading || !newPostText.trim()}
                >
                  {uploading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Post
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Posts Feed */}
        <div className="space-y-6">
          {posts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No posts yet. Be the first to post!
            </div>
          ) : (
            posts.map((post) => (
              <Card key={post.id}>
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={post.profiles?.avatar_url || ""} />
                      <AvatarFallback>{post.profiles?.display_name?.[0] || "?"}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-sm">
                        {post.profiles?.display_name || "Unknown User"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        @{post.profiles?.username || "user"} • {post.created_at && formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>

                  {currentUser === post.user_id && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDeletePost(post.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Post
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </CardHeader>
                <CardContent className="pb-2">
                  {post.caption && (
                    <p className="mb-4 whitespace-pre-wrap">{post.caption}</p>
                  )}
                  {post.image_url && (
                    <div className="rounded-md overflow-hidden border">
                      <img
                        src={post.image_url}
                        alt="Post content"
                        className="w-full h-auto object-cover max-h-[500px]"
                      />
                    </div>
                  )}
                </CardContent>
                <CardFooter className="pt-2">
                  {/* Add reactions/comments buttons here if needed later */}
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      </div>

      {communityId && (
        <CreateImagePostModal
          open={showImageModal}
          onOpenChange={setShowImageModal}
          communityId={communityId}
          onSuccess={(newPost) => {
            // Add the new post to the top of the list immediately
            if (newPost) {
              setPosts([newPost as CommunityPost, ...posts]);
            } else {
              // Fallback to refetch if post data not returned
              loadPosts();
            }
            setShowImageModal(false);
          }}
        />
      )}
    </div>
  );
}
