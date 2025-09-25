
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Camera } from 'lucide-react';
import { SecureForm } from '@/components/common/SecureForm';
import { useRateLimit } from '@/hooks/useRateLimit';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  bio?: string;
  major: string;
  year: string;
  department: string;
  avatar?: string;
  role: 'student' | 'professor' | 'admin' | 'club';
  privacy: {
    profileVisible: boolean;
    emailVisible: boolean;
    joinedGroupsVisible: boolean;
  };
}

interface EditProfileModalProps {
  open: boolean;
  onClose: () => void;
  user: UserProfile;
  onSave: (updatedUser: Partial<UserProfile>) => Promise<void>;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  open,
  onClose,
  user,
  onSave
}) => {
  const [formData, setFormData] = useState({
    name: user.name,
    bio: user.bio || '',
    major: user.major,
    year: user.year,
    department: user.department,
    privacy: user.privacy
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Rate limiting for profile updates (max 5 updates per 10 minutes)
  const { checkRateLimit, isBlocked } = useRateLimit({
    maxAttempts: 5,
    windowMs: 10 * 60 * 1000, // 10 minutes
    blockDurationMs: 5 * 60 * 1000 // 5 minute block
  });

  const handleSecureSubmit = async (formData: any) => {
    if (!checkRateLimit()) {
      return;
    }

    setLoading(true);

    try {
      await onSave(formData);
      onClose();
      toast({
        title: "Profile updated successfully!",
        description: "Your changes have been saved."
      });
    } catch (error) {
      toast({
        title: "Error updating profile",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePrivacyChange = (key: keyof typeof formData.privacy, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        [key]: value
      }
    }));
  };

  const profileValidator = (data: any) => {
    const errors: string[] = [];
    
    if (!data.name || data.name.trim().length < 1) {
      errors.push('Name is required');
    }
    
    if (data.name && data.name.length > 100) {
      errors.push('Name cannot exceed 100 characters');
    }
    
    if (data.bio && data.bio.length > 500) {
      errors.push('Bio cannot exceed 500 characters');
    }
    
    // Check for potentially malicious content
    const dangerousPatterns = [/<script/i, /javascript:/i, /on\w+=/i];
    const allText = `${data.name} ${data.bio} ${data.major}`;
    
    if (dangerousPatterns.some(pattern => pattern.test(allText))) {
      errors.push('Invalid characters detected');
    }

    return {
      success: errors.length === 0,
      error: errors.length > 0 ? { message: errors.join(', ') } : undefined
    };
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>

        <SecureForm 
          onSubmit={handleSecureSubmit} 
          validationType="custom"
          customValidator={profileValidator}
          className="space-y-6"
        >
          {/* Profile Picture */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="text-2xl">{user.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <Button
                type="button"
                size="sm"
                className="absolute bottom-0 right-0 rounded-full h-8 w-8 p-0"
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Click to change profile picture
            </p>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={user.email}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              placeholder="Tell us about yourself..."
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {formData.bio.length}/500 characters
            </p>
          </div>

          {/* Academic Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select 
                value={formData.department} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Computer Science">Computer Science</SelectItem>
                  <SelectItem value="Engineering">Engineering</SelectItem>
                  <SelectItem value="Business">Business</SelectItem>
                  <SelectItem value="Psychology">Psychology</SelectItem>
                  <SelectItem value="Biology">Biology</SelectItem>
                  <SelectItem value="Mathematics">Mathematics</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="major">Major</Label>
              <Input
                id="major"
                name="major"
                value={formData.major}
                onChange={(e) => setFormData(prev => ({ ...prev, major: e.target.value }))}
                placeholder="Your major"
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Select 
                value={formData.year} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, year: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Freshman">Freshman</SelectItem>
                  <SelectItem value="Sophomore">Sophomore</SelectItem>
                  <SelectItem value="Junior">Junior</SelectItem>
                  <SelectItem value="Senior">Senior</SelectItem>
                  <SelectItem value="Graduate">Graduate</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Privacy Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Privacy Settings</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Profile Visibility</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow others to view your profile
                  </p>
                </div>
                <Switch
                  checked={formData.privacy.profileVisible}
                  onCheckedChange={(checked) => handlePrivacyChange('profileVisible', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Email Visibility</Label>
                  <p className="text-sm text-muted-foreground">
                    Show your email on your profile
                  </p>
                </div>
                <Switch
                  checked={formData.privacy.emailVisible}
                  onCheckedChange={(checked) => handlePrivacyChange('emailVisible', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Groups Visibility</Label>
                  <p className="text-sm text-muted-foreground">
                    Show your joined groups and study sessions
                  </p>
                </div>
                <Switch
                  checked={formData.privacy.joinedGroupsVisible}
                  onCheckedChange={(checked) => handlePrivacyChange('joinedGroupsVisible', checked)}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || isBlocked}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </SecureForm>
      </DialogContent>
    </Dialog>
  );
};
