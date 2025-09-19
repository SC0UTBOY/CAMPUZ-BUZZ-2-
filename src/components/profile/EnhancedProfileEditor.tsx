
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Camera, Save, User, GraduationCap, MapPin, Calendar, Award, Link as LinkIcon, Eye, EyeOff } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EnhancedButton } from '@/components/ui/enhanced-button';
import { EnhancedCard } from '@/components/ui/enhanced-card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { EnhancedFileUpload } from '@/components/common/EnhancedFileUpload';
import type { UserProfile } from '@/hooks/useUserProfile';
import type { UploadResult } from '@/services/fileUploadService';

interface EnhancedProfileEditorProps {
  open: boolean;
  onClose: () => void;
  profile: UserProfile | null;
  onProfileUpdate: () => void;
}

interface ProfileFormData {
  display_name: string;
  bio: string;
  avatar_url?: string;
  major: string;
  department: string;
  year: string;
  school: string;
  gpa?: number;
  graduation_year?: number;
  skills: string[];
  interests: string[];
  social_links: Record<string, string>;
  privacy_settings: Record<string, boolean>;
}

export const EnhancedProfileEditor: React.FC<EnhancedProfileEditorProps> = ({
  open,
  onClose,
  profile,
  onProfileUpdate
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>({
    display_name: '',
    bio: '',
    major: '',
    department: '',
    year: '',
    school: '',
    skills: [],
    interests: [],
    social_links: {},
    privacy_settings: {
      profile_visible: true,
      email_visible: false,
      academic_info_visible: true
    }
  });
  const [newSkill, setNewSkill] = useState('');
  const [newInterest, setNewInterest] = useState('');

  useEffect(() => {
    if (profile) {
      setFormData({
        display_name: profile.display_name || '',
        bio: profile.bio || '',
        avatar_url: profile.avatar_url,
        major: profile.major || '',
        department: profile.department || '',
        year: profile.year || '',
        school: profile.school || '',
        gpa: profile.gpa || undefined,
        graduation_year: profile.graduation_year || undefined,
        skills: profile.skills || [],
        interests: profile.interests || [],
        social_links: profile.social_links || {},
        privacy_settings: profile.privacy_settings || {
          profile_visible: true,
          email_visible: false,
          academic_info_visible: true
        }
      });
    }
  }, [profile]);

  const handleInputChange = (field: keyof ProfileFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSocialLinkChange = (platform: string, url: string) => {
    setFormData(prev => ({
      ...prev,
      social_links: { ...prev.social_links, [platform]: url }
    }));
  };

  const handlePrivacyChange = (setting: string, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      privacy_settings: { ...prev.privacy_settings, [setting]: value }
    }));
  };

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  };

  const addInterest = () => {
    if (newInterest.trim() && !formData.interests.includes(newInterest.trim())) {
      setFormData(prev => ({
        ...prev,
        interests: [...prev.interests, newInterest.trim()]
      }));
      setNewInterest('');
    }
  };

  const removeInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.filter(i => i !== interest)
    }));
  };

  const handleAvatarUploaded = (results: UploadResult[]) => {
    if (results.length > 0) {
      setFormData(prev => ({ ...prev, avatar_url: results[0].url }));
    }
  };

  const handleSubmit = async () => {
    if (!formData.display_name.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter your display name.',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Here you would call your profile update service
      // await updateProfile(formData);
      
      onProfileUpdate();
      onClose();
      
      toast({
        title: 'Profile updated!',
        description: 'Your changes have been saved successfully.'
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Update failed',
        description: 'Please try again later.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl">Edit Profile</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic" className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="academic">Academic</TabsTrigger>
            <TabsTrigger value="social">Social</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
          </TabsList>

          <div className="overflow-y-auto max-h-[calc(90vh-180px)] mt-4">
            <TabsContent value="basic" className="space-y-6">
              {/* Avatar Section */}
              <EnhancedCard variant="glass" className="p-6">
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={formData.avatar_url} />
                      <AvatarFallback className="text-2xl bg-gradient-to-r from-primary to-accent text-primary-foreground">
                        {formData.display_name.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <EnhancedFileUpload
                      type="avatar"
                      onFilesUploaded={handleAvatarUploaded}
                      accept="image/*"
                    >
                      <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-colors">
                        <Camera className="h-4 w-4" />
                      </div>
                    </EnhancedFileUpload>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">Profile Photo</h3>
                    <p className="text-sm text-muted-foreground">
                      Upload a photo to help others recognize you
                    </p>
                  </div>
                </div>
              </EnhancedCard>

              {/* Basic Information */}
              <EnhancedCard variant="glass" className="p-6 space-y-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Basic Information
                </h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="display_name">Display Name *</Label>
                    <Input
                      id="display_name"
                      value={formData.display_name}
                      onChange={(e) => handleInputChange('display_name', e.target.value)}
                      placeholder="Your name"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="school">School/University</Label>
                    <Input
                      id="school"
                      value={formData.school}
                      onChange={(e) => handleInputChange('school', e.target.value)}
                      placeholder="University name"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    placeholder="Tell us about yourself..."
                    className="min-h-[100px]"
                  />
                </div>
              </EnhancedCard>
            </TabsContent>

            <TabsContent value="academic" className="space-y-6">
              <EnhancedCard variant="glass" className="p-6 space-y-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <GraduationCap className="h-5 w-5 mr-2" />
                  Academic Information
                </h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="major">Major</Label>
                    <Input
                      id="major"
                      value={formData.major}
                      onChange={(e) => handleInputChange('major', e.target.value)}
                      placeholder="Computer Science"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                      placeholder="Engineering"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="year">Academic Year</Label>
                    <Select
                      value={formData.year}
                      onValueChange={(value) => handleInputChange('year', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="freshman">Freshman</SelectItem>
                        <SelectItem value="sophomore">Sophomore</SelectItem>
                        <SelectItem value="junior">Junior</SelectItem>
                        <SelectItem value="senior">Senior</SelectItem>
                        <SelectItem value="graduate">Graduate</SelectItem>
                        <SelectItem value="phd">PhD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="graduation_year">Graduation Year</Label>
                    <Input
                      id="graduation_year"
                      type="number"
                      value={formData.graduation_year || ''}
                      onChange={(e) => handleInputChange('graduation_year', parseInt(e.target.value) || undefined)}
                      placeholder="2025"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="gpa">GPA (Optional)</Label>
                    <Input
                      id="gpa"
                      type="number"
                      step="0.01"
                      max="4.0"
                      value={formData.gpa || ''}
                      onChange={(e) => handleInputChange('gpa', parseFloat(e.target.value) || undefined)}
                      placeholder="3.75"
                    />
                  </div>
                </div>

                {/* Skills */}
                <div>
                  <Label>Skills</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="cursor-pointer">
                        {skill}
                        <X 
                          className="h-3 w-3 ml-1" 
                          onClick={() => removeSkill(skill)}
                        />
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      placeholder="Add a skill"
                      onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                    />
                    <EnhancedButton onClick={addSkill} size="sm">Add</EnhancedButton>
                  </div>
                </div>

                {/* Interests */}
                <div>
                  <Label>Interests</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.interests.map((interest, index) => (
                      <Badge key={index} variant="outline" className="cursor-pointer">
                        {interest}
                        <X 
                          className="h-3 w-3 ml-1" 
                          onClick={() => removeInterest(interest)}
                        />
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newInterest}
                      onChange={(e) => setNewInterest(e.target.value)}
                      placeholder="Add an interest"
                      onKeyPress={(e) => e.key === 'Enter' && addInterest()}
                    />
                    <EnhancedButton onClick={addInterest} size="sm">Add</EnhancedButton>
                  </div>
                </div>
              </EnhancedCard>
            </TabsContent>

            <TabsContent value="social" className="space-y-6">
              <EnhancedCard variant="glass" className="p-6 space-y-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <LinkIcon className="h-5 w-5 mr-2" />
                  Social Links
                </h3>
                
                {['linkedin', 'github', 'twitter', 'instagram', 'website'].map((platform) => (
                  <div key={platform}>
                    <Label htmlFor={platform} className="capitalize">{platform}</Label>
                    <Input
                      id={platform}
                      value={formData.social_links[platform] || ''}
                      onChange={(e) => handleSocialLinkChange(platform, e.target.value)}
                      placeholder={`Your ${platform} URL`}
                    />
                  </div>
                ))}
              </EnhancedCard>
            </TabsContent>

            <TabsContent value="privacy" className="space-y-6">
              <EnhancedCard variant="glass" className="p-6 space-y-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <Eye className="h-5 w-5 mr-2" />
                  Privacy Settings
                </h3>
                
                <div className="space-y-4">
                  {[
                    { key: 'profile_visible', label: 'Profile Visible', description: 'Allow others to view your profile' },
                    { key: 'email_visible', label: 'Email Visible', description: 'Show your email address on your profile' },
                    { key: 'academic_info_visible', label: 'Academic Info Visible', description: 'Show your academic information' }
                  ].map((setting) => (
                    <div key={setting.key} className="flex items-center justify-between p-4 rounded-lg border">
                      <div>
                        <Label className="text-base">{setting.label}</Label>
                        <p className="text-sm text-muted-foreground">{setting.description}</p>
                      </div>
                      <Switch
                        checked={formData.privacy_settings[setting.key]}
                        onCheckedChange={(value) => handlePrivacyChange(setting.key, value)}
                      />
                    </div>
                  ))}
                </div>
              </EnhancedCard>
            </TabsContent>
          </div>
        </Tabs>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <EnhancedButton variant="outline" onClick={onClose}>
            Cancel
          </EnhancedButton>
          <EnhancedButton 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            gradient
            glow
          >
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </EnhancedButton>
        </div>
      </DialogContent>
    </Dialog>
  );
};
