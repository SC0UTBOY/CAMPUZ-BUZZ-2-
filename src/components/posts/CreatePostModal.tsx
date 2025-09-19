
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Image, X } from 'lucide-react';
import { AutoTagSuggestions } from '@/components/ai/AutoTagSuggestions';

interface CreatePostModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (post: any) => void;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({ open, onClose, onSubmit }) => {
  const [content, setContent] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call

    onSubmit({
      content,
      image,
      tags
    });

    // Reset form
    setContent('');
    setImage(null);
    setTags([]);
    setTagInput('');
    setLoading(false);
    
    toast({
      title: "Post created!",
      description: "Your post has been shared with the community."
    });
    
    onClose();
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create a New Post</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="content">What's on your mind?</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share something with your community..."
              className="min-h-[120px] mt-2"
              required
            />
            
            <AutoTagSuggestions
              content={content}
              onTagSelect={(tag) => {
                if (!tags.includes(tag)) {
                  setTags([...tags, tag]);
                }
              }}
              onCommunitySelect={(community) => {
                // Handle community selection
                console.log('Selected community:', community);
              }}
              selectedTags={tags}
            />
          </div>

          {/* Image Upload */}
          <div>
            <Label>Add an Image</Label>
            <div className="mt-2">
              {image ? (
                <div className="relative">
                  <img src={image} alt="Upload preview" className="w-full h-48 object-cover rounded-lg" />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => setImage(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <Image className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-500">Click to upload an image</span>
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                </label>
              )}
            </div>
          </div>

          {/* Tags */}
          <div>
            <Label>Tags</Label>
            <div className="mt-2 space-y-2">
              <div className="flex space-x-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Add a tag..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <Button type="button" onClick={addTag} variant="outline">
                  Add
                </Button>
              </div>
              
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center space-x-1">
                      <span>#{tag}</span>
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!content.trim() || loading}
              className="bg-gradient-to-r from-blue-600 to-indigo-600"
            >
              {loading ? 'Posting...' : 'Post'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
