# Comments API Implementation TODO

## Current Status
- [x] Analyzed current CommentsService.ts implementation
- [x] Understood schema and relationships
- [x] Created implementation plan
- [x] Created supabase/functions directory structure
- [x] Created GET /posts/:id/comments Edge Function
- [x] Created POST /posts/:id/comments Edge Function
- [x] Updated CommentsService.ts to use API endpoints

## Tasks to Complete

### 1. Create Supabase Functions Directory Structure
- [x] Create supabase/functions directory
- [x] Set up proper Edge Function structure

### 2. Create GET /posts/:id/comments Edge Function
- [x] Create supabase/functions/get-comments/index.ts
- [x] Implement comment fetching with profile joins
- [x] Add threading support (build comment tree)
- [x] Handle pagination and limiting
- [x] Add proper error handling and auth validation

### 3. Create POST /posts/:id/comments Edge Function
- [x] Create supabase/functions/create-comment/index.ts
- [x] Implement comment creation with user validation
- [x] Add depth calculation for threading
- [x] Include profile data in response
- [x] Handle notifications via PostComments.addComment

### 4. Update CommentsService.ts
- [x] Replace getPostComments() direct calls with API endpoint
- [x] Replace getRecentComments() direct calls with API endpoint
- [x] Replace createComment() direct calls with API endpoint
- [x] Maintain same interface for useComments hook
- [x] Keep error handling and data transformation

### 5. Testing and Deployment
- [ ] Test functions locally with Supabase CLI
- [ ] Deploy functions to Supabase
- [ ] Test end-to-end comment functionality
- [ ] Verify loading states and error handling
- [ ] Apply any missing database migrations

### 6. Verification
- [ ] Ensure frontend works with new API endpoints
- [ ] Check that all comment features work (create, read, threading)
- [ ] Verify performance and error handling
