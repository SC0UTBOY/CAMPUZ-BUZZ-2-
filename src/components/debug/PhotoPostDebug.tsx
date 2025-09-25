import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSimplePosts } from '@/hooks/useSimplePosts';
import { imageUploadService } from '@/services/imageUploadService';
import { useToast } from '@/hooks/use-toast';

export const PhotoPostDebug: React.FC = () => {
  const { createPost, isCreating } = useSimplePosts();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const testImageUpload = async () => {
    // Create a test image file
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#4F46E5';
      ctx.fillRect(0, 0, 200, 200);
      ctx.fillStyle = 'white';
      ctx.font = '20px Arial';
      ctx.fillText('Test Image', 50, 100);
    }

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      
      const file = new File([blob], 'test-image.png', { type: 'image/png' });
      
      setIsUploading(true);
      try {
        const result = await imageUploadService.uploadImage(file);
        console.log('Upload result:', result);
        
        toast({
          title: 'Upload Success',
          description: `Image uploaded: ${result.url}`
        });
        
        // Now create a post with the image
        await createPost({
          content: 'Test photo post with uploaded image',
          title: 'Test Photo Post',
          image: result.url,
          type: 'photo',
          post_type: 'image'
        });
        
      } catch (error) {
        console.error('Upload error:', error);
        toast({
          title: 'Upload Failed',
          description: error instanceof Error ? error.message : 'Unknown error',
          variant: 'destructive'
        });
      } finally {
        setIsUploading(false);
      }
    }, 'image/png');
  };

  const testTextPost = async () => {
    try {
      await createPost({
        content: 'This is a test text post to verify basic posting works',
        title: 'Test Text Post',
        type: 'text',
        post_type: 'text'
      });
    } catch (error) {
      console.error('Text post error:', error);
    }
  };

  return (
    <Card className="p-6 m-4">
      <h2 className="text-xl font-bold mb-4">📸 Photo Post Debug</h2>
      
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold mb-2">Test Functions:</h3>
          <div className="flex gap-2">
            <Button 
              onClick={testTextPost}
              disabled={isCreating}
              variant="outline"
            >
              {isCreating ? 'Creating...' : 'Test Text Post'}
            </Button>
            <Button 
              onClick={testImageUpload}
              disabled={isUploading || isCreating}
            >
              {isUploading ? 'Uploading...' : isCreating ? 'Creating...' : 'Test Photo Upload & Post'}
            </Button>
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-muted rounded">
          <h3 className="font-semibold mb-2">Debug Steps:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Check browser console for detailed logs</li>
            <li>Verify Supabase storage bucket exists</li>
            <li>Test image upload separately</li>
            <li>Test post creation with image URL</li>
            <li>Check database for created posts</li>
          </ol>
        </div>
        
        <div className="mt-4 p-4 bg-blue-50 rounded">
          <h3 className="font-semibold mb-2">Common Issues:</h3>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Storage bucket not created or misconfigured</li>
            <li>RLS policies blocking uploads</li>
            <li>Image URL not being saved to database</li>
            <li>Post type not set correctly</li>
            <li>Missing image_url column in posts table</li>
          </ul>
        </div>
      </div>
    </Card>
  );
};
