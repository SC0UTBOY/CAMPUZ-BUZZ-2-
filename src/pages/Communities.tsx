
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Search, Plus, Users, Lock, Globe, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { joinCommunity, leaveCommunity } from '@/services/communityActions';
import { isMember } from '@/lib/community/isMember';

interface Community {
  id: string;
  name: string;
  description: string;
  category: string;
  is_private: boolean;
  member_count: number;
  created_by: string;
  isJoined?: boolean;
}

const CommunityCard: React.FC<{ community: Community; onJoin: (id: string) => void; onLeave: (id: string) => void; onDelete: (id: string) => void; onClick: () => void; currentUserId: string | null }> = ({
  community,
  onJoin,
  onLeave,
  onDelete,
  onClick,
  currentUserId
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback>{community.name.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">{community.name}</CardTitle>
                <div className="flex items-center space-x-2 mt-1">
                  {community.is_private ? (
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Globe className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm text-muted-foreground flex items-center">
                    <Users className="h-3 w-3 mr-1" />
                    {community.member_count} members
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end space-y-2">
              {community.category && (
                <Badge variant="secondary" className="text-xs">
                  {community.category}
                </Badge>
              )}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={community.isJoined ? "outline" : "default"}
                  onClick={(e) => {
                    e.stopPropagation();
                    community.isJoined ? onLeave(community.id) : onJoin(community.id);
                  }}
                >
                  {community.isJoined ? "Leave" : "Join"}
                </Button>
                {community.created_by === currentUserId && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(community.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {community.description}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const CreateCommunityModal: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCommunityCreated: () => void;
}> = ({ open, onOpenChange, onCommunityCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    is_private: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create the community
      const { data: newCommunity, error: createError } = await supabase
        .from('communities')
        .insert({
          name: formData.name,
          description: formData.description,
          category: formData.category,
          is_private: formData.is_private,
          created_by: user.id,
          member_count: 0 // Will be updated by trigger
        })
        .select()
        .single();

      if (createError) throw createError;

      // Add creator as the first member
      const { error: memberError } = await supabase
        .from('community_members')
        .insert({
          community_id: newCommunity.id,
          user_id: user.id,
          joined_at: new Date().toISOString()
        });

      if (memberError) {
        console.error('Error adding creator as member:', memberError);
        // Don't throw - community is created, just log the error
      }

      toast({
        title: "Community created!",
        description: "Your community has been created successfully."
      });
      onCommunityCreated();
      onOpenChange(false);
      setFormData({
        name: '',
        description: '',
        category: '',
        is_private: false
      });
    } catch (error: any) {
      console.error('Error creating community:', error);
      toast({
        title: "Error Creating Community",
        description: error.message || 'Failed to create community.',
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-background rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Create Community</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Community Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter community name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                className="w-full min-h-[80px] px-3 py-2 bg-slate-900 text-slate-200 border border-slate-700 rounded-md resize-none focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your community"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <Input
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                placeholder="e.g., Academic, Social, Professional"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_private"
                checked={formData.is_private}
                onChange={(e) => setFormData(prev => ({ ...prev, is_private: e.target.checked }))}
                className="rounded"
              />
              <label htmlFor="is_private" className="text-sm">
                Make this community private
              </label>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Community"}
              </Button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default function Communities() {
  const navigate = useNavigate();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [filteredCommunities, setFilteredCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { toast } = useToast();

  const categories = ['Academic', 'Social', 'Professional', 'Sports', 'Arts', 'Technology'];

  useEffect(() => {
    loadCommunities();
  }, []);

  useEffect(() => {
    filterCommunities();
  }, [communities, searchQuery, selectedCategory]);

  // Realtime subscription for community_members changes
  useEffect(() => {
    const channel = supabase
      .channel('community-members-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'community_members',
        },
        (payload) => {
          console.log("Realtime event:", payload);
          loadCommunities(); // refresh community list and member counts
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadCommunities = async () => {
    try {
      setLoading(true);

      // Fetch communities with actual schema
      const { data, error } = await supabase
        .from("communities")
        .select("*")
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get current user for membership status
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;
      setCurrentUserId(userId || null);

      // Add membership status
      const communitiesWithStatus = await Promise.all(
        (data || []).map(async (community) => {
          let isJoined = false;

          if (userId) {
            isJoined = await isMember(community.id);
          }

          return {
            ...community,
            isJoined
          };
        })
      );

      setCommunities(communitiesWithStatus);
    } catch (error) {
      console.error('❌ Error loading communities:', error);
      toast({
        title: "Error",
        description: "Failed to load communities.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterCommunities = () => {
    let filtered = communities;

    if (searchQuery) {
      filtered = filtered.filter(community =>
        community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        community.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(community => community.category === selectedCategory);
    }

    setFilteredCommunities(filtered);
  };

  const handleJoinCommunity = async (communityId: string) => {
    try {
      const result = await joinCommunity(communityId);

      if (!result.success || result.error) {
        toast({
          title: "Failed to join",
          description: (typeof result.error === 'string' ? result.error : (result.error as any)?.message) || "Failed to join community",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Joined!",
        description: "You are now a member of this community."
      });

      await loadCommunities();

    } catch (error: any) {
      console.error('Join error:', error);
      toast({
        title: "Failed to join",
        description: error?.message || "An error occurred while joining the community.",
        variant: "destructive"
      });
    }
  };

  const handleLeaveCommunity = async (communityId: string) => {
    try {
      const result = await leaveCommunity(communityId);

      if (!result.success || result.error) {
        toast({
          title: "Failed to leave",
          description: (typeof result.error === 'string' ? result.error : (result.error as any)?.message) || "Failed to leave community",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Left",
        description: "You are no longer a member of this community."
      });

      await loadCommunities();

    } catch (error: any) {
      console.error('Error leaving community:', error);
      toast({
        title: "Error",
        description: "Failed to leave community.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteCommunity = async (communityId: string) => {
    if (!confirm("Are you sure? This will delete the community for everyone.")) return;

    try {
      const { error } = await supabase
        .from("communities")
        .delete()
        .eq("id", communityId);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to delete community.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: "Community deleted successfully."
        });
        loadCommunities(); // Refresh UI
      }
    } catch (error: any) {
      console.error('Error deleting community:', error);
      toast({
        title: "Error",
        description: "Failed to delete community.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Communities</h1>
            <p className="text-muted-foreground">Discover and join communities that match your interests</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)} className="mt-4 md:mt-0">
            <Plus className="h-4 w-4 mr-2" />
            Create Community
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search communities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            <Button
              variant={selectedCategory === '' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('')}
            >
              All
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="whitespace-nowrap"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Communities Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-12 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredCommunities.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No communities found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || selectedCategory
                ? "Try adjusting your search or filters"
                : "Be the first to create a community!"}
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Community
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredCommunities.map((community) => (
                <CommunityCard
                  key={community.id}
                  community={community}
                  onJoin={handleJoinCommunity}
                  onLeave={handleLeaveCommunity}
                  onDelete={handleDeleteCommunity}
                  onClick={() => navigate(`/communities/${community.id}`)}
                  currentUserId={currentUserId}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Create Community Modal */}
        <CreateCommunityModal
          open={showCreateModal}
          onOpenChange={setShowCreateModal}
          onCommunityCreated={loadCommunities}
        />
      </div>
    </div>
  );
}
