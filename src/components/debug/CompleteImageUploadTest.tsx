import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { completeImageUploadService } from '@/services/completeImageUploadService';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const CompleteImageUploadTest: React.FC = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [bucketStatus, setBucketStatus] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const checkBucketStatus = async () => {
    setIsChecking(true);
    setBucketStatus('');
    
    try {
      const { data: buckets, error } = await supabase.storage.listBuckets();
      
      if (error) {
        setBucketStatus(`❌ Error: ${error.message}`);
        toast({
          title: 'Error',
          description: `Failed to check buckets: ${error.message}`,
          variant: 'destructive'
        });
        return;
      }

      const postImagesBucket = buckets?.find(bucket => bucket.name === 'post-images');
      
      if (postImagesBucket) {
        setBucketStatus(`✅ Bucket exists and is ${postImagesBucket.public ? 'public' : 'private'}`);
        toast({
          title: 'Bucket Status ✅',
          description: `post-images bucket exists and is ${postImagesBucket.public ? 'public' : 'private'}`
        });
        console.log('Bucket details:', postImagesBucket);
      } else {
        setBucketStatus('❌ Bucket "post-images" not found');
        toast({
          title: 'Bucket Missing ❌',
          description: 'post-images bucket not found. Create it using the SQL scripts provided.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Check error:', error);
      setBucketStatus(`❌ Error: ${error}`);
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
      console.log('🧪 Testing upload for file:', file.name, file.size, file.type);
      
      const result = await completeImageUploadService.uploadImage(file);
      
      console.log('✅ Upload successful:', result);
      setUploadedUrl(result.url);
      
      toast({
        title: 'Upload Success! 🎉',
        description: `Image uploaded successfully: ${file.name}`
      });
      
    } catch (error) {
      console.error('❌ Upload failed:', error);
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
    canvas.width = 400;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Draw a colorful test image
      const gradient = ctx.createLinearGradient(0, 0, 400, 300);
      gradient.addColorStop(0, '#4F46E5');
      gradient.addColorStop(1, '#06B6D4');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 400, 300);
      
      ctx.fillStyle = 'white';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('CampuzBuzz Test Upload', 200, 120);
      
      ctx.font = '16px Arial';
      ctx.fillText('Generated: ' + new Date().toLocaleString(), 200, 160);
      
      ctx.font = '14px Arial';
      ctx.fillText('If you can see this, upload works! 🎉', 200, 200);
    }

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'campuzbuzz-test-upload.png', { type: 'image/png' });
        testImageUpload(file);
      }
    }, 'image/png');
  };

  return (
    <Card className="p-6 m-4 max-w-lg">
      <h2 className="text-xl font-bold mb-4">🧪 Complete Image Upload Test</h2>
      
      <div className="space-y-6">
        {/* Step 1: Check Bucket */}
        <div>
          <h3 className="font-semibold mb-2">Step 1: Check Bucket Status</h3>
          <Button 
            onClick={checkBucketStatus}
            disabled={isChecking}
            variant="outline"
            className="w-full mb-2"
          >
            {isChecking ? 'Checking...' : 'Check post-images Bucket'}
          </Button>
          {bucketStatus && (
            <p className="text-sm p-2 bg-muted rounded">{bucketStatus}</p>
          )}
        </div>
        
        {/* Step 2: Test Upload */}
        <div>
          <h3 className="font-semibold mb-2">Step 2: Test Image Upload</h3>
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
              {isUploading ? 'Uploading...' : 'Generate & Upload Test Image'}
            </Button>
          </div>
        </div>
        
        {/* Step 3: View Result */}
        {uploadedUrl && (
          <div>
            <h3 className="font-semibold mb-2">✅ Upload Result:</h3>
            <div className="space-y-2">
              <img 
                src={uploadedUrl} 
                alt="Uploaded test" 
                className="w-full rounded border"
                onLoad={() => console.log('✅ Image loaded successfully from:', uploadedUrl)}
                onError={() => console.error('❌ Image failed to load from:', uploadedUrl)}
              />
              <p className="text-xs text-muted-foreground break-all">
                <strong>URL:</strong> {uploadedUrl}
              </p>
            </div>
          </div>
        )}
        
        {/* Instructions */}
        <div className="text-xs text-muted-foreground bg-blue-50 p-3 rounded">
          <p><strong>Setup Instructions:</strong></p>
          <ol className="list-decimal list-inside space-y-1 mt-2">
            <li>Run <code>create_storage_bucket.sql</code> in Supabase SQL Editor</li>
            <li>Run <code>storage_rls_policies.sql</code> in Supabase SQL Editor</li>
            <li>Click "Check Bucket" - should show ✅</li>
            <li>Upload test image - should work perfectly!</li>
          </ol>
        </div>
      </div>
    </Card>
  );
};
