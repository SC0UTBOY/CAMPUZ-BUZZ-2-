import React from 'react';
import { AuthTestRunner } from '@/components/testing/AuthTestRunner';
import { PostTestRunner } from '@/components/testing/PostTestRunner';
import { PostInteractionTestRunner } from '@/components/testing/PostInteractionTestRunner';
import { EventTestRunner } from '@/components/testing/EventTestRunner';
import { ChatTestRunner } from '@/components/testing/ChatTestRunner';
import { ProfileTestRunner } from '@/components/testing/ProfileTestRunner';
import { SecurityTestRunner } from '@/components/testing/SecurityTestRunner';
import { ErrorHandlingTestRunner } from '@/components/testing/ErrorHandlingTestRunner';
import { UsabilityTestRunner } from '@/components/testing/UsabilityTestRunner';
import { HashtagMentionTest } from '@/components/common/HashtagMentionTest';
import { HashtagMentionDemo } from '@/components/common/HashtagMentionDemo';
import { HashtagMentionSummary } from '@/components/common/HashtagMentionSummary';
import { LikeButtonTest } from '@/components/common/LikeButtonTest';
import { SimpleLikeTest } from '@/components/common/SimpleLikeTest';
import { CommentTest } from '@/components/common/CommentTest';
import { CommentDemo } from '@/components/common/CommentDemo';
import { CommentSchemaTest } from '@/components/common/CommentSchemaTest';
import { CommentRelationshipTest } from '@/components/common/CommentRelationshipTest';
import { CommentsProfileTest } from '@/components/common/CommentsProfileTest';
import { CommentDebugTest } from '@/components/common/CommentDebugTest';
import { CommentLikesRepliesTest } from '@/components/common/CommentLikesRepliesTest';
import { DatabaseSchemaTest } from '@/components/common/DatabaseSchemaTest';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const Testing = () => {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            CampuzBuzz Testing Suite
          </h1>
          <p className="text-lg text-muted-foreground">
            Comprehensive testing for authentication, posts, and community features
          </p>
        </div>
        
        <Tabs defaultValue="auth" className="w-full">
        <TabsList className="grid w-full grid-cols-11">
          <TabsTrigger value="auth">Authentication</TabsTrigger>
          <TabsTrigger value="posts">Post Creation</TabsTrigger>
          <TabsTrigger value="interactions">Post Interactions</TabsTrigger>
          <TabsTrigger value="events">Events & RSVPs</TabsTrigger>
          <TabsTrigger value="chat">Direct Messaging</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="errors">Error Handling</TabsTrigger>
          <TabsTrigger value="usability">Usability</TabsTrigger>
          <TabsTrigger value="hashtags">Hashtags & Mentions</TabsTrigger>
          <TabsTrigger value="likes">Like Button</TabsTrigger>
          <TabsTrigger value="comments">Comments</TabsTrigger>
        </TabsList>
          
          <TabsContent value="auth" className="mt-6">
            <AuthTestRunner />
          </TabsContent>
          
          <TabsContent value="posts" className="mt-6">
            <PostTestRunner />
          </TabsContent>
          
          <TabsContent value="interactions" className="mt-6">
            <PostInteractionTestRunner />
          </TabsContent>
          
          <TabsContent value="events" className="mt-6">
            <EventTestRunner />
          </TabsContent>

          <TabsContent value="chat" className="mt-6">
            <ChatTestRunner />
          </TabsContent>

          <TabsContent value="profile" className="mt-6">
            <ProfileTestRunner />
          </TabsContent>

          <TabsContent value="security" className="mt-6">
            <SecurityTestRunner />
          </TabsContent>

          <TabsContent value="errors" className="mt-6">
            <ErrorHandlingTestRunner />
          </TabsContent>

          <TabsContent value="usability" className="mt-6">
            <UsabilityTestRunner />
          </TabsContent>

          <TabsContent value="hashtags" className="mt-6 space-y-6">
            <HashtagMentionSummary />
            <HashtagMentionDemo />
            <HashtagMentionTest />
          </TabsContent>

          <TabsContent value="likes" className="mt-6 space-y-6">
            <SimpleLikeTest />
            <LikeButtonTest />
          </TabsContent>

          <TabsContent value="comments" className="mt-6 space-y-6">
            <DatabaseSchemaTest />
            <CommentLikesRepliesTest />
            <CommentDebugTest />
            <CommentsProfileTest />
            <CommentRelationshipTest />
            <CommentSchemaTest />
            <CommentDemo />
            <CommentTest />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};