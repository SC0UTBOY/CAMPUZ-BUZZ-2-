import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { imageUploadService } from '@/services/imageUploadService';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const ImageUploadTest: React.FC = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const checkBucketStatus = async () => {
    setIsChecking(true);
    try {
      const { data: buckets, error } = await supabase.storage.listBuckets();
      
      if (error) {
        toast({
          title: 'Error',
          description: `Failed to check buckets: ${error.message}`,
          variant: 'destructive'
        });
        return;
      }

      const postImagesBucket = buckets?.find(bucket => bucket.name === 'post-images');
      
      if (postImagesBucket) {
        toast({
          title: 'Bucket Status ✅',
          description: `post-images bucket exists and is ${postImagesBucket.public ? 'public' : 'private'}`
        });
        console.log('Bucket details:', postImagesBucket);
      } else {
        toast({
          title: 'Bucket Missing ❌',
          description: 'post-images bucket not found. Create it in Supabase dashboard.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Check error:', error);
      toast({
        title: 'Error',
        description: 'Failed to check bucket status',
        variant: 'destructive'
      });
    } finally {
      setIsChecking(false);
    }
  };

  const testImageUpload = async (file: File) => {
    setIsUploading(true);
    setUploadedUrl(null);
    
    try {
      console.log('Testing upload for file:', file.name, file.size, file.type);
      
      const result = await imageUploadService.uploadImage(file);
      
      console.log('Upload successful:', result);
      setUploadedUrl(result.url);
      
      toast({
        title: 'Upload Success! 🎉',
        description: `Image uploaded successfully: ${file.name}`
      });
      
    } catch (error) {
      console.error('Upload failed:', error);
      toast({
        title: 'Upload Failed ❌',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      testImageUpload(file);
    }
  };

  const createTestImage = () => {
    // Create a test image programmatically
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Draw a simple test image
      ctx.fillStyle = '#4F46E5';
      ctx.fillRect(0, 0, 300, 200);
      ctx.fillStyle = 'white';
      ctx.font = '20px Arial';
      ctx.fillText('Test Upload', 100, 100);
      ctx.fillText(new Date().toLocaleTimeString(), 80, 130);
    }

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'test-upload.png', { type: 'image/png' });
        testImageUpload(file);
      }
    }, 'image/png');
  };

  return (
    <Card className="p-6 m-4 max-w-md">
      <h2 className="text-xl font-bold mb-4">🧪 Image Upload Test</h2>
      
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold mb-2">1. Check Bucket Status</h3>
          <Button 
            onClick={checkBucketStatus}
            disabled={isChecking}
            variant="outline"
            className="w-full"
          >
            {isChecking ? 'Checking...' : 'Check post-images Bucket'}
          </Button>
        </div>
        
        <div>
          <h3 className="font-semibold mb-2">2. Test Upload</h3>
          <div className="space-y-2">
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              disabled={isUploading}
            />
            <Button 
              onClick={createTestImage}
              disabled={isUploading}
              className="w-full"
            >
              {isUploading ? 'Uploading...' : 'Create & Upload Test Image'}
            </Button>
          </div>
        </div>
        
        {uploadedUrl && (
          <div>
            <h3 className="font-semibold mb-2">✅ Upload Result:</h3>
            <div className="space-y-2">
              <img 
                src={uploadedUrl} 
                alt="Uploaded test" 
                className="w-full rounded border"
                onLoad={() => console.log('Image loaded successfully')}
                onError={() => console.error('Image failed to load')}
              />
              <p className="text-xs text-muted-foreground break-all">
                URL: {uploadedUrl}
              </p>
            </div>
          </div>
        )}
        
        <div className="text-xs text-muted-foreground">
          <p><strong>Expected flow:</strong></p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Check bucket exists ✅</li>
            <li>Upload image ✅</li>
            <li>Get public URL ✅</li>
            <li>Display image ✅</li>
          </ol>
        </div>
      </div>
    </Card>
  );
};
