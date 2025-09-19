
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, ArrowRight, ArrowLeft, Shield, Users, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

interface UserOnboardingProps {
  onComplete: () => void;
  onSkip?: () => void;
}

export const UserOnboarding: React.FC<UserOnboardingProps> = ({ onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to CampuzBuzz!',
      description: 'Your campus social network for connecting, learning, and growing together.',
      icon: <Users className="h-8 w-8 text-primary" />,
      content: (
        <div className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
            <Users className="h-10 w-10 text-primary" />
          </div>
          <p className="text-lg">
            Connect with classmates, join study groups, discover campus events, and make the most of your college experience.
          </p>
        </div>
      )
    },
    {
      id: 'profile',
      title: 'Complete Your Profile',
      description: 'Help others discover and connect with you by filling out your profile information.',
      icon: <Shield className="h-8 w-8 text-blue-500" />,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Academic Info</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Major and year</li>
                <li>• Academic interests</li>
                <li>• Skills and expertise</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Personal Touch</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Profile picture</li>
                <li>• Bio and interests</li>
                <li>• Social links</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'security',
      title: 'Secure Your Account',
      description: 'Keep your account safe with our security recommendations.',
      icon: <Shield className="h-8 w-8 text-green-500" />,
      content: (
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium">Strong Password</p>
                <p className="text-sm text-muted-foreground">Use a unique, complex password</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium">Two-Factor Authentication</p>
                <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium">Privacy Settings</p>
                <p className="text-sm text-muted-foreground">Control who can see your information</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'explore',
      title: 'Explore Communities',
      description: 'Discover and join communities that match your interests and academic goals.',
      icon: <Calendar className="h-8 w-8 text-purple-500" />,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold text-blue-600">Academic Communities</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Join study groups for your courses and connect with classmates.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold text-green-600">Interest Groups</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Find communities for hobbies, sports, and personal interests.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold text-purple-600">Campus Events</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Stay updated on campus events and activities.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold text-orange-600">Career Network</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Connect with mentors and career opportunities.
              </p>
            </div>
          </div>
        </div>
      )
    }
  ];

  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    setCompletedSteps(prev => new Set([...prev, currentStep]));
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onSkip?.();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted/20">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {steps[currentStep].icon}
              <div>
                <CardTitle>{steps[currentStep].title}</CardTitle>
                <CardDescription>{steps[currentStep].description}</CardDescription>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              {currentStep + 1} of {steps.length}
            </div>
          </div>
          <Progress value={progress} className="mt-4" />
        </CardHeader>
        
        <CardContent>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {steps[currentStep].content}
            </motion.div>
          </AnimatePresence>
          
          <div className="flex items-center justify-between mt-8">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 0}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              
              {currentStep < steps.length - 1 ? (
                <Button onClick={handleNext}>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleNext}>
                  Get Started
                  <CheckCircle className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
            
            <Button variant="ghost" onClick={handleSkip} className="text-muted-foreground">
              Skip for now
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
