
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { AvatarUpload } from './AvatarUpload';
import { Plus, X, Github, Linkedin, Twitter, Globe, Mail, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

interface ProfileData {
  id?: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  major?: string;
  department?: string;
  year?: string;
  school?: string;
  gpa?: number;
  graduation_year?: number;
  skills?: string[];
  interests?: string[];
  social_links?: Record<string, string>;
  privacy_settings?: {
    email_visible: boolean;
    profile_visible: boolean;
    academic_info_visible: boolean;
  };
}

interface ComprehensiveProfileEditorProps {
  profile?: ProfileData;
  onSave: (profile: ProfileData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const MAJORS = [
  'Computer Science', 'Engineering', 'Business Administration', 'Psychology', 
  'Biology', 'Mathematics', 'Physics', 'Chemistry', 'English', 'History',
  'Economics', 'Political Science', 'Art', 'Music', 'Philosophy'
];

const YEARS = ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate', 'PhD'];

const SOCIAL_PLATFORMS = [
  { key: 'github', label: 'GitHub', icon: Github },
  { key: 'linkedin', label: 'LinkedIn', icon: Linkedin },
  { key: 'twitter', label: 'Twitter', icon: Twitter },
  { key: 'website', label: 'Website', icon: Globe },
  { key: 'email', label: 'Email', icon: Mail },
  { key: 'phone', label: 'Phone', icon: Phone }
];

export const ComprehensiveProfileEditor: React.FC<ComprehensiveProfileEditorProps> = ({
  profile,
  onSave,
  onCancel,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<ProfileData>({
    display_name: profile?.display_name || '',
    bio: profile?.bio || '',
    avatar_url: profile?.avatar_url || '',
    major: profile?.major || '',
    department: profile?.department || '',
    year: profile?.year || '',
    school: profile?.school || '',
    gpa: profile?.gpa || undefined,
    graduation_year: profile?.graduation_year || undefined,
    skills: profile?.skills || [],
    interests: profile?.interests || [],
    social_links: profile?.social_links || {},
    privacy_settings: {
      email_visible: true,
      profile_visible: true,
      academic_info_visible: true,
      ...profile?.privacy_settings
    }
  });

  const [newSkill, setNewSkill] = useState('');
  const [newInterest, setNewInterest] = useState('');
  const { toast } = useToast();

  const updateFormData = (key: keyof ProfileData, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills?.includes(newSkill.trim())) {
      updateFormData('skills', [...(formData.skills || []), newSkill.trim()]);
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    updateFormData('skills', formData.skills?.filter(s => s !== skill) || []);
  };

  const addInterest = () => {
    if (newInterest.trim() && !formData.interests?.includes(newInterest.trim())) {
      updateFormData('interests', [...(formData.interests || []), newInterest.trim()]);
      setNewInterest('');
    }
  };

  const removeInterest = (interest: string) => {
    updateFormData('interests', formData.interests?.filter(i => i !== interest) || []);
  };

  const updateSocialLink = (platform: string, url: string) => {
    updateFormData('social_links', {
      ...formData.social_links,
      [platform]: url
    });
  };

  const removeSocialLink = (platform: string) => {
    const newLinks = { ...formData.social_links };
    delete newLinks[platform];
    updateFormData('social_links', newLinks);
  };

  const updatePrivacySetting = (key: keyof typeof formData.privacy_settings, value: boolean) => {
    updateFormData('privacy_settings', {
      ...formData.privacy_settings,
      [key]: value
    });
  };

  const handleSubmit = async () => {
    if (!formData.display_name?.trim()) {
      toast({
        title: "Display name required",
        description: "Please enter your display name",
        variant: "destructive"
      });
      return;
    }

    try {
      await onSave(formData);
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated"
      });
    } catch (error) {
      console.error('Failed to save profile:', error);
      toast({
        title: "Update failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit Profile</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="academic">Academic</TabsTrigger>
          <TabsTrigger value="social">Social & Links</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Upload */}
              <div className="flex flex-col items-center space-y-4">
                <AvatarUpload
                  currentAvatarUrl={formData.avatar_url}
                  fallbackText={formData.display_name?.charAt(0) || 'U'}
                  onAvatarChange={(url) => updateFormData('avatar_url', url)}
                  size="xl"
                />
              </div>

              {/* Display Name */}
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name *</Label>
                <Input
                  id="displayName"
                  value={formData.display_name || ''}
                  onChange={(e) => updateFormData('display_name', e.target.value)}
                  placeholder="Your display name"
                />
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio || ''}
                  onChange={(e) => updateFormData('bio', e.target.value)}
                  placeholder="Tell us about yourself..."
                  className="min-h-[100px]"
                  maxLength={500}
                />
                <div className="text-right">
                  <span className="text-xs text-muted-foreground">
                    {formData.bio?.length || 0}/500
                  </span>
                </div>
              </div>

              {/* Skills */}
              <div className="space-y-3">
                <Label>Skills</Label>
                <div className="flex gap-2">
                  <Input
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="Add a skill..."
                    onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                  />
                  <Button onClick={addSkill} disabled={!newSkill.trim()}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.skills?.map((skill) => (
                    <Badge key={skill} variant="secondary" className="gap-1">
                      {skill}
                      <button onClick={() => removeSkill(skill)}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Interests */}
              <div className="space-y-3">
                <Label>Interests</Label>
                <div className="flex gap-2">
                  <Input
                    value={newInterest}
                    onChange={(e) => setNewInterest(e.target.value)}
                    placeholder="Add an interest..."
                    onKeyPress={(e) => e.key === 'Enter' && addInterest()}
                  />
                  <Button onClick={addInterest} disabled={!newInterest.trim()}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.interests?.map((interest) => (
                    <Badge key={interest} variant="outline" className="gap-1">
                      {interest}
                      <button onClick={() => removeInterest(interest)}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="academic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Academic Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* School */}
              <div className="space-y-2">
                <Label htmlFor="school">School/University</Label>
                <Input
                  id="school"
                  value={formData.school || ''}
                  onChange={(e) => updateFormData('school', e.target.value)}
                  placeholder="Your school name"
                />
              </div>

              {/* Major */}
              <div className="space-y-2">
                <Label htmlFor="major">Major</Label>
                <Select value={formData.major || ''} onValueChange={(value) => updateFormData('major', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your major" />
                  </SelectTrigger>
                  <SelectContent>
                    {MAJORS.map(major => (
                      <SelectItem key={major} value={major}>{major}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Department */}
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={formData.department || ''}
                  onChange={(e) => updateFormData('department', e.target.value)}
                  placeholder="Department name"
                />
              </div>

              {/* Year */}
              <div className="space-y-2">
                <Label htmlFor="year">Academic Year</Label>
                <Select value={formData.year || ''} onValueChange={(value) => updateFormData('year', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your year" />
                  </SelectTrigger>
                  <SelectContent>
                    {YEARS.map(year => (
                      <SelectItem key={year} value={year}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* GPA */}
              <div className="space-y-2">
                <Label htmlFor="gpa">GPA (optional)</Label>
                <Input
                  id="gpa"
                  type="number"
                  step="0.01"
                  min="0"
                  max="4"
                  value={formData.gpa || ''}
                  onChange={(e) => updateFormData('gpa', e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="3.75"
                />
              </div>

              {/* Graduation Year */}
              <div className="space-y-2">
                <Label htmlFor="gradYear">Expected Graduation Year</Label>
                <Input
                  id="gradYear"
                  type="number"
                  min="2020"
                  max="2030"
                  value={formData.graduation_year || ''}
                  onChange={(e) => updateFormData('graduation_year', e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="2025"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Social Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {SOCIAL_PLATFORMS.map((platform) => {
                const PlatformIcon = platform.icon;
                const currentUrl = formData.social_links?.[platform.key] || '';
                
                return (
                  <div key={platform.key} className="flex items-center gap-3">
                    <div className="flex items-center gap-2 min-w-[120px]">
                      <PlatformIcon className="h-5 w-5" />
                      <Label>{platform.label}</Label>
                    </div>
                    <div className="flex-1 flex gap-2">
                      <Input
                        value={currentUrl}
                        onChange={(e) => updateSocialLink(platform.key, e.target.value)}
                        placeholder={`Your ${platform.label.toLowerCase()} ${platform.key === 'email' ? 'address' : platform.key === 'phone' ? 'number' : 'URL'}`}
                      />
                      {currentUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeSocialLink(platform.key)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="profile-visible">Profile Visibility</Label>
                  <p className="text-sm text-muted-foreground">Make your profile visible to other users</p>
                </div>
                <Switch
                  id="profile-visible"
                  checked={formData.privacy_settings?.profile_visible ?? true}
                  onCheckedChange={(checked) => updatePrivacySetting('profile_visible', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email-visible">Email Visibility</Label>
                  <p className="text-sm text-muted-foreground">Show your email to other users</p>
                </div>
                <Switch
                  id="email-visible"
                  checked={formData.privacy_settings?.email_visible ?? false}
                  onCheckedChange={(checked) => updatePrivacySetting('email_visible', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="academic-visible">Academic Info Visibility</Label>
                  <p className="text-sm text-muted-foreground">Show your academic information (major, year, etc.)</p>
                </div>
                <Switch
                  id="academic-visible"
                  checked={formData.privacy_settings?.academic_info_visible ?? true}
                  onCheckedChange={(checked) => updatePrivacySetting('academic_info_visible', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
