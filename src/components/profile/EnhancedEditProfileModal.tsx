
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { OptimizedUserProfile } from '@/hooks/useOptimizedProfile';
import { 
  User, 
  GraduationCap, 
  Shield, 
  Link2, 
  X, 
  Upload,
  Plus
} from 'lucide-react';

interface EnhancedEditProfileModalProps {
  open: boolean;
  onClose: () => void;
  profile: OptimizedUserProfile;
  onProfileUpdate: () => void;
}

export const EnhancedEditProfileModal: React.FC<EnhancedEditProfileModalProps> = ({
  open,
  onClose,
  profile,
  onProfileUpdate
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Basic Info
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  
  // Academic Info
  const [school, setSchool] = useState('');
  const [major, setMajor] = useState('');
  const [year, setYear] = useState('');
  const [gpa, setGpa] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  
  // Skills & Interests
  const [skills, setSkills] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [interestInput, setInterestInput] = useState('');
  
  // Social Links
  const [socialLinks, setSocialLinks] = useState({
    linkedin: '',
    github: '',
    twitter: '',
    instagram: '',
    website: ''
  });
  
  // Privacy Settings
  const [privacySettings, setPrivacySettings] = useState({
    profile_visible: true,
    email_visible: false,
    academic_info_visible: true
  });

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setBio(profile.bio || '');
      setAvatarUrl(profile.avatar_url || '');
      setSchool(profile.school || '');
      setMajor(profile.major || '');
      setYear(profile.year || '');
      setGpa(profile.gpa?.toString() || '');
      setGraduationYear(profile.graduation_year?.toString() || '');
      setSkills(profile.skills || []);
      setInterests(profile.interests || []);
      setSocialLinks({
        linkedin: profile.social_links?.linkedin || '',
        github: profile.social_links?.github || '',
        twitter: profile.social_links?.twitter || '',
        instagram: profile.social_links?.instagram || '',
        website: profile.social_links?.website || ''
      });
      setPrivacySettings({
        profile_visible: profile.privacy_settings?.profile_visible ?? true,
        email_visible: profile.privacy_settings?.email_visible ?? false,
        academic_info_visible: profile.privacy_settings?.academic_info_visible ?? true
      });
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName.trim(),
          bio: bio.trim(),
          avatar_url: avatarUrl,
          school: school.trim(),
          major: major.trim(),
          year: year,
          gpa: gpa ? parseFloat(gpa) : null,
          graduation_year: graduationYear ? parseInt(graduationYear) : null,
          skills,
          interests,
          social_links: socialLinks,
          privacy_settings: privacySettings,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Profile updated!",
        description: "Your profile has been successfully updated."
      });

      onProfileUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error updating profile",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };

  const addInterest = () => {
    if (interestInput.trim() && !interests.includes(interestInput.trim())) {
      setInterests([...interests, interestInput.trim()]);
      setInterestInput('');
    }
  };

  const removeInterest = (interestToRemove: string) => {
    setInterests(interests.filter(interest => interest !== interestToRemove));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Basic
              </TabsTrigger>
              <TabsTrigger value="academic" className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Academic
              </TabsTrigger>
              <TabsTrigger value="social" className="flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                Social
              </TabsTrigger>
              <TabsTrigger value="privacy" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Privacy
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={avatarUrl} />
                  <AvatarFallback className="text-lg">
                    {displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Label htmlFor="avatar">Profile Picture URL</Label>
                  <div className="flex space-x-2 mt-1">
                    <Input
                      id="avatar"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      placeholder="https://example.com/avatar.jpg"
                    />
                    <Button type="button" variant="outline" size="sm">
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Display Name */}
              <div>
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="How should others see your name?"
                  className="mt-1"
                />
              </div>

              {/* Bio */}
              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell others about yourself..."
                  className="mt-1 min-h-[100px]"
                />
              </div>
            </TabsContent>

            <TabsContent value="academic" className="space-y-6">
              {/* School */}
              <div>
                <Label htmlFor="school">School/University</Label>
                <Input
                  id="school"
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                  placeholder="University of Example"
                  className="mt-1"
                />
              </div>

              {/* Major and Year */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="major">Major</Label>
                  <Input
                    id="major"
                    value={major}
                    onChange={(e) => setMajor(e.target.value)}
                    placeholder="Computer Science"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="year">Year Level</Label>
                  <Select value={year} onValueChange={setYear}>
                    <SelectTrigger className="mt-1">
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

              {/* GPA and Graduation Year */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="gpa">GPA (Optional)</Label>
                  <Input
                    id="gpa"
                    type="number"
                    step="0.01"
                    min="0"
                    max="4.0"
                    value={gpa}
                    onChange={(e) => setGpa(e.target.value)}
                    placeholder="3.75"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="graduationYear">Graduation Year</Label>
                  <Input
                    id="graduationYear"
                    type="number"
                    min="2020"
                    max="2030"
                    value={graduationYear}
                    onChange={(e) => setGraduationYear(e.target.value)}
                    placeholder="2025"
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Skills */}
              <div>
                <Label>Skills</Label>
                <div className="mt-2 space-y-3">
                  <div className="flex space-x-2">
                    <Input
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      placeholder="Add a skill..."
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                    />
                    <Button type="button" onClick={addSkill} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {skills.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill) => (
                        <Badge key={skill} variant="secondary" className="flex items-center space-x-1">
                          <span>{skill}</span>
                          <button
                            type="button"
                            onClick={() => removeSkill(skill)}
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

              {/* Interests */}
              <div>
                <Label>Interests</Label>
                <div className="mt-2 space-y-3">
                  <div className="flex space-x-2">
                    <Input
                      value={interestInput}
                      onChange={(e) => setInterestInput(e.target.value)}
                      placeholder="Add an interest..."
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addInterest())}
                    />
                    <Button type="button" onClick={addInterest} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {interests.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {interests.map((interest) => (
                        <Badge key={interest} variant="outline" className="flex items-center space-x-1">
                          <span>{interest}</span>
                          <button
                            type="button"
                            onClick={() => removeInterest(interest)}
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
            </TabsContent>

            <TabsContent value="social" className="space-y-6">
              {Object.entries(socialLinks).map(([platform, url]) => (
                <div key={platform}>
                  <Label htmlFor={platform}>
                    {platform.charAt(0).toUpperCase() + platform.slice(1)}
                  </Label>
                  <Input
                    id={platform}
                    value={url}
                    onChange={(e) => setSocialLinks({
                      ...socialLinks,
                      [platform]: e.target.value
                    })}
                    placeholder={`Your ${platform} URL`}
                    className="mt-1"
                  />
                </div>
              ))}
            </TabsContent>

            <TabsContent value="privacy" className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Profile Visibility</Label>
                    <p className="text-sm text-gray-500">Make your profile visible to other users</p>
                  </div>
                  <Switch
                    checked={privacySettings.profile_visible}
                    onCheckedChange={(checked) => 
                      setPrivacySettings({...privacySettings, profile_visible: checked})
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email Visibility</Label>
                    <p className="text-sm text-gray-500">Show your email address to other users</p>
                  </div>
                  <Switch
                    checked={privacySettings.email_visible}
                    onCheckedChange={(checked) => 
                      setPrivacySettings({...privacySettings, email_visible: checked})
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Academic Info Visibility</Label>
                    <p className="text-sm text-gray-500">Show your school, major, and academic details</p>
                  </div>
                  <Switch
                    checked={privacySettings.academic_info_visible}
                    onCheckedChange={(checked) => 
                      setPrivacySettings({...privacySettings, academic_info_visible: checked})
                    }
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-2 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
