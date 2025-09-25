
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOptimizedProfile } from '@/hooks/useOptimizedProfile';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { EnhancedEditProfileModal } from '@/components/profile/EnhancedEditProfileModal';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { AchievementsDisplay } from '@/components/achievements/AchievementsDisplay';
import { UserPostsTab } from '@/components/profile/UserPostsTab';
import { UserCommunitiesTab } from '@/components/profile/UserCommunitiesTab';
import { UserActivityTab } from '@/components/profile/UserActivityTab';

export default function Profile() {
  const { user } = useAuth();
  const { profile, loading, updateProfile, refetchProfile } = useOptimizedProfile();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleProfileUpdate = async () => {
    if (refetchProfile) {
      await refetchProfile();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6">
          <Card className="mb-6">
            <CardHeader>
              <Skeleton className="h-8 w-48" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-2xl font-semibold">
              {profile?.display_name || 'Your Profile'}
            </CardTitle>
            <Button variant="ghost" onClick={() => setIsEditModalOpen(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={profile?.avatar_url || ''} alt={profile?.display_name || 'User'} />
                <AvatarFallback>{profile?.display_name?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm text-muted-foreground">
                  {profile?.major && profile?.year ? `${profile.major} - ${profile.year}` : 'No academic info'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {profile?.bio || 'No bio yet'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left sidebar with achievements */}
          <div className="lg:col-span-1 space-y-6">
            <AchievementsDisplay />
            
            {profile && (
              <Card>
                <CardHeader>
                  <CardTitle>About</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm">
                    <span className="font-bold">Name:</span> {profile.display_name || 'Not set'}
                  </div>
                  <div className="text-sm">
                    <span className="font-bold">Major:</span> {profile.major || 'Not set'}
                  </div>
                  <div className="text-sm">
                    <span className="font-bold">Year:</span> {profile.year || 'Not set'}
                  </div>
                  <div className="text-sm">
                    <span className="font-bold">School:</span> {profile.school || 'Not set'}
                  </div>
                  {profile.skills && profile.skills.length > 0 && (
                    <div className="text-sm">
                      <span className="font-bold">Skills:</span> {profile.skills.join(', ')}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main content area */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="posts" className="w-full">
              <TabsList>
                <TabsTrigger value="posts">Posts</TabsTrigger>
                <TabsTrigger value="communities">Communities</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>
              <TabsContent value="posts">
                <UserPostsTab />
              </TabsContent>
              <TabsContent value="communities">
                <UserCommunitiesTab />
              </TabsContent>
              <TabsContent value="activity">
                <UserActivityTab />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {profile && (
        <EnhancedEditProfileModal
          open={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          profile={profile}
          onProfileUpdate={handleProfileUpdate}
        />
      )}
    </div>
  );
}
