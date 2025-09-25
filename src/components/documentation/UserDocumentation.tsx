
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  BookOpen, 
  MessageSquare, 
  Users, 
  Calendar,
  Shield,
  Settings,
  Search,
  Bell,
  Video,
  FileText,
  HelpCircle
} from 'lucide-react';

interface DocumentationSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

export const UserDocumentation: React.FC = () => {
  const [activeSection, setActiveSection] = useState('getting-started');

  const documentationSections: DocumentationSection[] = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: <BookOpen className="h-5 w-5" />,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Welcome to CampuzBuzz</h3>
            <p className="text-muted-foreground mb-4">
              CampuzBuzz is your comprehensive campus social platform designed to connect students, 
              faculty, and staff in meaningful ways. Here's how to get started:
            </p>
          </div>

          <Accordion type="single" collapsible>
            <AccordionItem value="account-setup">
              <AccordionTrigger>Setting Up Your Account</AccordionTrigger>
              <AccordionContent className="space-y-3">
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Sign up with your campus email address</li>
                  <li>Verify your email to activate your account</li>
                  <li>Complete your profile with academic information</li>
                  <li>Upload a profile picture and write a bio</li>
                  <li>Set your privacy preferences</li>
                </ol>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Tip:</strong> A complete profile helps you connect with relevant people and communities!
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="navigation">
              <AccordionTrigger>Navigating the Platform</AccordionTrigger>
              <AccordionContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 border rounded">
                    <h4 className="font-medium">Home Feed</h4>
                    <p className="text-sm text-muted-foreground">See posts from your communities and followed users</p>
                  </div>
                  <div className="p-3 border rounded">
                    <h4 className="font-medium">Communities</h4>
                    <p className="text-sm text-muted-foreground">Join subject-specific or interest-based groups</p>
                  </div>
                  <div className="p-3 border rounded">
                    <h4 className="font-medium">Study Groups</h4>
                    <p className="text-sm text-muted-foreground">Find or create academic collaboration groups</p>
                  </div>
                  <div className="p-3 border rounded">
                    <h4 className="font-medium">Events</h4>
                    <p className="text-sm text-muted-foreground">Discover campus events and activities</p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      )
    },
    {
      id: 'posts-sharing',
      title: 'Posts & Sharing',
      icon: <FileText className="h-5 w-5" />,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Creating and Sharing Content</h3>
            <p className="text-muted-foreground mb-4">
              Share your thoughts, academic resources, and campus experiences with the community.
            </p>
          </div>

          <Accordion type="single" collapsible>
            <AccordionItem value="creating-posts">
              <AccordionTrigger>Creating Posts</AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div className="space-y-3">
                  <h4 className="font-medium">Post Types:</h4>
                  <div className="grid gap-3">
                    <div className="p-3 border rounded">
                      <Badge className="mb-2">Text Post</Badge>
                      <p className="text-sm">Share thoughts, questions, or announcements</p>
                    </div>
                    <div className="p-3 border rounded">
                      <Badge className="mb-2">Media Post</Badge>
                      <p className="text-sm">Upload images, videos, or documents</p>
                    </div>
                    <div className="p-3 border rounded">
                      <Badge className="mb-2">Poll Post</Badge>
                      <p className="text-sm">Create polls to gather opinions</p>
                    </div>
                    <div className="p-3 border rounded">
                      <Badge className="mb-2">Event Post</Badge>
                      <p className="text-sm">Share and promote campus events</p>
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>Best Practice:</strong> Use relevant hashtags and mention users to increase visibility!
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="engagement">
              <AccordionTrigger>Engaging with Content</AccordionTrigger>
              <AccordionContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">👍 Like</Badge>
                    <span className="text-sm">Show appreciation for content</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">💬 Comment</Badge>
                    <span className="text-sm">Join the conversation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">🔄 Share</Badge>
                    <span className="text-sm">Reshare with your network</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">🔖 Save</Badge>
                    <span className="text-sm">Bookmark for later reference</span>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      )
    },
    {
      id: 'communities',
      title: 'Communities',
      icon: <Users className="h-5 w-5" />,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Joining and Managing Communities</h3>
            <p className="text-muted-foreground mb-4">
              Communities are the heart of CampuzBuzz - join existing ones or create your own!
            </p>
          </div>

          <Accordion type="single" collapsible>
            <AccordionItem value="finding-communities">
              <AccordionTrigger>Finding Communities</AccordionTrigger>
              <AccordionContent className="space-y-3">
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Browse featured communities on the home page</li>
                  <li>Use the search function to find specific topics</li>
                  <li>Check out communities your friends have joined</li>
                  <li>Look for department or course-specific groups</li>
                </ul>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Popular categories: Academic Departments, Clubs & Organizations, Hobbies, Study Groups
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="creating-communities">
              <AccordionTrigger>Creating Your Own Community</AccordionTrigger>
              <AccordionContent className="space-y-3">
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Click "Create Community" from the Communities page</li>
                  <li>Choose a descriptive name and category</li>
                  <li>Write a clear description of the community's purpose</li>
                  <li>Set privacy settings (public or private)</li>
                  <li>Customize with avatar and banner images</li>
                  <li>Invite initial members to get started</li>
                </ol>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="community-roles">
              <AccordionTrigger>Community Roles & Permissions</AccordionTrigger>
              <AccordionContent className="space-y-3">
                <div className="grid gap-3">
                  <div className="p-3 border rounded">
                    <Badge className="mb-2">Owner</Badge>
                    <p className="text-sm">Full control over community settings and members</p>
                  </div>
                  <div className="p-3 border rounded">
                    <Badge className="mb-2">Moderator</Badge>
                    <p className="text-sm">Can moderate content and manage member behavior</p>
                  </div>
                  <div className="p-3 border rounded">
                    <Badge className="mb-2">Member</Badge>
                    <p className="text-sm">Can post, comment, and participate in discussions</p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      )
    },
    {
      id: 'messaging',
      title: 'Messaging & Chat',
      icon: <MessageSquare className="h-5 w-5" />,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Communication Features</h3>
            <p className="text-muted-foreground mb-4">
              Stay connected with real-time messaging, voice chat, and video calls.
            </p>
          </div>

          <Accordion type="single" collapsible>
            <AccordionItem value="direct-messages">
              <AccordionTrigger>Direct Messages</AccordionTrigger>
              <AccordionContent className="space-y-3">
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Send private messages to individual users</li>
                  <li>Create group conversations with multiple people</li>
                  <li>Share files, images, and documents</li>
                  <li>Use emoji reactions and stickers</li>
                  <li>Message history is preserved for easy reference</li>
                </ul>
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Privacy Note:</strong> Direct messages are private and only visible to participants
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="community-chat">
              <AccordionTrigger>Community Chat Channels</AccordionTrigger>
              <AccordionContent className="space-y-3">
                <div className="space-y-2">
                  <p className="text-sm">Each community can have multiple chat channels:</p>
                  <div className="grid gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">#general</Badge>
                      <span className="text-sm">Main discussion channel</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">#announcements</Badge>
                      <span className="text-sm">Important updates from moderators</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">#random</Badge>
                      <span className="text-sm">Casual conversations</span>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="voice-video">
              <AccordionTrigger>Voice & Video Features</AccordionTrigger>
              <AccordionContent className="space-y-3">
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Join voice channels for real-time conversations</li>
                  <li>Start video calls with individuals or groups</li>
                  <li>Screen sharing for study sessions and presentations</li>
                  <li>Push-to-talk or voice activation options</li>
                  <li>Recording capabilities for study groups (with permission)</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      )
    },
    {
      id: 'events',
      title: 'Events & Calendar',
      icon: <Calendar className="h-5 w-5" />,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Campus Events & Scheduling</h3>
            <p className="text-muted-foreground mb-4">
              Stay up-to-date with campus events and manage your academic schedule.
            </p>
          </div>

          <Accordion type="single" collapsible>
            <AccordionItem value="discovering-events">
              <AccordionTrigger>Discovering Events</AccordionTrigger>
              <AccordionContent className="space-y-3">
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Browse the campus events calendar</li>
                  <li>Filter by category, date, or location</li>
                  <li>See events from communities you've joined</li>
                  <li>Get personalized recommendations based on your interests</li>
                  <li>Search for specific types of events</li>
                </ul>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                  <div className="p-3 border rounded">
                    <h4 className="font-medium">Academic Events</h4>
                    <p className="text-sm text-muted-foreground">Lectures, seminars, workshops</p>
                  </div>
                  <div className="p-3 border rounded">
                    <h4 className="font-medium">Social Events</h4>
                    <p className="text-sm text-muted-foreground">Parties, meetups, networking</p>
                  </div>
                  <div className="p-3 border rounded">
                    <h4 className="font-medium">Sports & Recreation</h4>
                    <p className="text-sm text-muted-foreground">Games, tournaments, fitness</p>
                  </div>
                  <div className="p-3 border rounded">
                    <h4 className="font-medium">Career Events</h4>
                    <p className="text-sm text-muted-foreground">Job fairs, career talks</p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="rsvp-management">
              <AccordionTrigger>RSVP & Event Management</AccordionTrigger>
              <AccordionContent className="space-y-3">
                <div className="space-y-2">
                  <h4 className="font-medium">RSVP Options:</h4>
                  <div className="grid gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-green-50">Going</Badge>
                      <span className="text-sm">Confirm your attendance</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-yellow-50">Maybe</Badge>
                      <span className="text-sm">Tentative attendance</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-gray-50">Not Going</Badge>
                      <span className="text-sm">Decline the invitation</span>
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Tip:</strong> Events you RSVP to will automatically be added to your personal calendar
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="creating-events">
              <AccordionTrigger>Creating Your Own Events</AccordionTrigger>
              <AccordionContent className="space-y-3">
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Click "Create Event" from the Events page</li>
                  <li>Fill in event details (title, description, date, time)</li>
                  <li>Set location (physical address or virtual link)</li>
                  <li>Choose privacy settings and invite permissions</li>
                  <li>Add event banner image and tags</li>
                  <li>Send invitations to specific users or communities</li>
                </ol>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      )
    },
    {
      id: 'privacy-security',
      title: 'Privacy & Security',
      icon: <Shield className="h-5 w-5" />,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Protecting Your Privacy</h3>
            <p className="text-muted-foreground mb-4">
              Learn how to control your privacy settings and keep your account secure.
            </p>
          </div>

          <Accordion type="single" collapsible>
            <AccordionItem value="privacy-settings">
              <AccordionTrigger>Privacy Settings</AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div className="space-y-3">
                  <h4 className="font-medium">Profile Visibility:</h4>
                  <div className="grid gap-3">
                    <div className="p-3 border rounded">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Public Profile</span>
                        <Badge>Default</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Your profile is visible to all campus users
                      </p>
                    </div>
                    <div className="p-3 border rounded">
                      <span className="font-medium">Friends Only</span>
                      <p className="text-sm text-muted-foreground mt-1">
                        Only users you've connected with can see your profile
                      </p>
                    </div>
                    <div className="p-3 border rounded">
                      <span className="font-medium">Community Members</span>
                      <p className="text-sm text-muted-foreground mt-1">
                        Visible to members of your communities
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium">Content Privacy:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Control who can see your posts</li>
                    <li>Manage who can message you directly</li>
                    <li>Set preferences for event invitations</li>
                    <li>Choose whether to appear in search results</li>
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="account-security">
              <AccordionTrigger>Account Security</AccordionTrigger>
              <AccordionContent className="space-y-3">
                <div className="space-y-2">
                  <h4 className="font-medium">Security Best Practices:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Use a strong, unique password</li>
                    <li>Enable two-factor authentication (2FA)</li>
                    <li>Regularly review your login activity</li>
                    <li>Keep your email address up to date</li>
                    <li>Report suspicious activity immediately</li>
                  </ul>
                </div>
                <div className="p-3 bg-red-50 rounded-lg">
                  <p className="text-sm text-red-800">
                    <strong>Security Alert:</strong> Never share your login credentials with anyone!
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="blocking-reporting">
              <AccordionTrigger>Blocking & Reporting</AccordionTrigger>
              <AccordionContent className="space-y-3">
                <div className="space-y-2">
                  <h4 className="font-medium">Blocking Users:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Blocked users cannot message you or see your posts</li>
                    <li>They won't be able to find your profile in search</li>
                    <li>You won't see their content in your feeds</li>
                    <li>Blocking is mutual and private</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Reporting Content:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Report inappropriate posts, comments, or messages</li>
                    <li>Choose from specific violation categories</li>
                    <li>Provide additional context when necessary</li>
                    <li>Reports are reviewed by our moderation team</li>
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      )
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">CampuzBuzz User Guide</h1>
        <p className="text-muted-foreground">
          Everything you need to know to make the most of your campus social experience
        </p>
      </div>

      <Tabs value={activeSection} onValueChange={setActiveSection} className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6">
          {documentationSections.map((section) => (
            <TabsTrigger key={section.id} value={section.id} className="flex items-center gap-1">
              {section.icon}
              <span className="hidden lg:inline">{section.title}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {documentationSections.map((section) => (
          <TabsContent key={section.id} value={section.id}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {section.icon}
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {section.content}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Need More Help?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <h3 className="font-medium mb-1">Live Chat Support</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Get real-time help from our support team
              </p>
              <Button size="sm">Start Chat</Button>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Users className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <h3 className="font-medium mb-1">Community Forums</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Ask questions and get help from other users
              </p>
              <Button size="sm" variant="outline">Visit Forums</Button>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <FileText className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <h3 className="font-medium mb-1">Contact Support</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Send us a detailed message about your issue
              </p>
              <Button size="sm" variant="outline">Send Message</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
