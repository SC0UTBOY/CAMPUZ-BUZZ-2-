
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserPlus, LogIn, BookOpen, Users, Calendar, MessageSquare } from 'lucide-react';

export const AuthPages: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    major: '',
    year: ''
  });

  const { signIn, signUp } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await signIn(formData.email, formData.password);
      } else {
        if (!formData.fullName) {
          toast({
            title: "Missing fields",
            description: "Please enter your full name.",
            variant: "destructive"
          });
          return;
        }
        await signUp(formData.email, formData.password, {
          full_name: formData.fullName,
          major: formData.major,
          year: formData.year
        });
      }
    } catch (error: any) {
      toast({
        title: isLogin ? "Sign in failed" : "Sign up failed",
        description: error.message || "An error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        
        {/* Left side - Branding & Features */}
        <div className="hidden lg:block space-y-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              CampuzBuzz
            </h1>
            <p className="text-xl text-muted-foreground mt-2">
              Connect, Study, and Grow Together
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Study Groups</h3>
                <p className="text-sm text-muted-foreground">
                  Join or create study groups with classmates
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Real-time Chat</h3>
                <p className="text-sm text-muted-foreground">
                  Instant messaging with your study partners
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Event Planning</h3>
                <p className="text-sm text-muted-foreground">
                  Organize study sessions and campus events
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Academic Communities</h3>
                <p className="text-sm text-muted-foreground">
                  Connect with students in your field of study
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right side - Authentication Form */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card className="w-full max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                {isLogin ? <LogIn className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
                <span>{isLogin ? 'Welcome Back' : 'Join CampuzBuzz'}</span>
              </CardTitle>
              <CardDescription>
                {isLogin 
                  ? 'Sign in to your account to continue' 
                  : 'Create your account to get started'
                }
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <AnimatePresence mode="wait">
                  {!isLogin && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="fullName">Full Name</Label>
                          <Input
                            id="fullName"
                            type="text"
                            value={formData.fullName}
                            onChange={(e) => updateField('fullName', e.target.value)}
                            placeholder="Enter your full name"
                            required={!isLogin}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="major">Major</Label>
                            <Select onValueChange={(value) => updateField('major', value)}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select major" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="computer-science">Computer Science</SelectItem>
                                <SelectItem value="engineering">Engineering</SelectItem>
                                <SelectItem value="business">Business</SelectItem>
                                <SelectItem value="psychology">Psychology</SelectItem>
                                <SelectItem value="biology">Biology</SelectItem>
                                <SelectItem value="mathematics">Mathematics</SelectItem>
                                <SelectItem value="chemistry">Chemistry</SelectItem>
                                <SelectItem value="physics">Physics</SelectItem>
                                <SelectItem value="english">English</SelectItem>
                                <SelectItem value="history">History</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="year">Year</Label>
                            <Select onValueChange={(value) => updateField('year', value)}>
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
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    placeholder="your.email@university.edu"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => updateField('password', e.target.value)}
                    placeholder="Enter your password"
                    required
                  />
                  {!isLogin && (
                    <p className="text-xs text-muted-foreground">
                      Password must be at least 8 characters with uppercase, lowercase, number, and special character.
                    </p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isLogin ? 'Signing in...' : 'Creating account...'}
                    </>
                  ) : (
                    <>{isLogin ? 'Sign In' : 'Create Account'}</>
                  )}
                </Button>

                <div className="text-center">
                  <Button
                    type="button"
                    variant="link"
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-sm"
                  >
                    {isLogin 
                      ? "Don't have an account? Sign up" 
                      : "Already have an account? Sign in"
                    }
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};
