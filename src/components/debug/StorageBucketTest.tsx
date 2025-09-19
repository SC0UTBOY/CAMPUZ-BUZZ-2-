import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const StorageBucketTest: React.FC = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const checkBuckets = async () => {
    setIsChecking(true);
    try {
      const { data: buckets, error } = await supabase.storage.listBuckets();
      
      if (error) {
        toast({
          title: 'Error',
          description: `Failed to list buckets: ${error.message}`,
          variant: 'destructive'
        });
        return;
      }

      const postImagesBucket = buckets?.find(bucket => bucket.name === 'post-images');
      
      if (postImagesBucket) {
        toast({
          title: 'Bucket Found! ✅',
          description: `post-images bucket exists and is ${postImagesBucket.public ? 'public' : 'private'}`
        });
      } else {
        toast({
          title: 'Bucket Missing ❌',
          description: 'post-images bucket does not exist. Click "Create Bucket" to fix this.',
          variant: 'destructive'
        });
      }

      console.log('All buckets:', buckets);
    } catch (error) {
      console.error('Check error:', error);
      toast({
        title: 'Error',
        description: 'Failed to check buckets',
        variant: 'destructive'
      });
    } finally {
      setIsChecking(false);
    }
  };

  const createBucket = async () => {
    setIsCreating(true);
    try {
      const { error } = await supabase.storage.createBucket('post-images', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
        fileSizeLimit: 10485760 // 10MB
      });

      if (error) {
        if (error.message.includes('already exists')) {
          toast({
            title: 'Bucket Already Exists ✅',
            description: 'The post-images bucket is already created!'
          });
        } else {
          toast({
            title: 'Creation Failed ❌',
            description: `Failed to create bucket: ${error.message}`,
            variant: 'destructive'
          });
        }
      } else {
        toast({
          title: 'Bucket Created! 🎉',
          description: 'post-images bucket created successfully!'
        });
      }
    } catch (error) {
      console.error('Create error:', error);
      toast({
        title: 'Error',
        description: 'Failed to create bucket',
        variant: 'destructive'
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card className="p-6 m-4">
      <h2 className="text-xl font-bold mb-4">🪣 Storage Bucket Test</h2>
      
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          This will help diagnose and fix the "Bucket not found" error.
        </p>
        
        <div className="flex gap-2">
          <Button 
            onClick={checkBuckets}
            disabled={isChecking}
            variant="outline"
          >
            {isChecking ? 'Checking...' : 'Check Buckets'}
          </Button>
          
          <Button 
            onClick={createBucket}
            disabled={isCreating}
          >
            {isCreating ? 'Creating...' : 'Create Bucket'}
          </Button>
        </div>
        
        <div className="mt-4 p-4 bg-muted rounded">
          <h3 className="font-semibold mb-2">Steps to Fix:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Click "Check Buckets" to see current status</li>
            <li>If bucket is missing, click "Create Bucket"</li>
            <li>Try uploading a photo again</li>
            <li>If still failing, check Supabase dashboard → Storage</li>
          </ol>
        </div>
      </div>
    </Card>
  );
};
