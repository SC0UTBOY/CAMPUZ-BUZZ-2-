
import { PostQueries } from './postQueries';
import { PostActions } from './postActions';
import { PostReactions } from './postReactions';
import { PostComments } from './postComments';

// Main service class that combines all post-related functionality
export class EnhancedPostsService {
  // Re-export all the methods from individual modules
  static getPosts = PostQueries.getPosts;
  static createPost = PostActions.createPost;
  static savePost = PostActions.savePost;
  static sharePost = PostActions.sharePost;
  static reactToPost = PostReactions.reactToPost;
  static addComment = PostComments.addComment;
}

// Export types and service
export type { PostFilter, EnhancedPostData } from '@/types/posts';
export { EnhancedPostsService as enhancedPostsService };
