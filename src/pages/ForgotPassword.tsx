import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import { ArrowLeft, KeyRound } from 'lucide-react';

const ForgotPassword: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Logo/Branding */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                CampuzBuzz
              </h1>
            </motion.div>
          </div>

          {/* Main Card */}
          <Card className="shadow-lg border-border/50">
            <CardHeader className="space-y-3">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <KeyRound className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl text-center">Forgot Password?</CardTitle>
              <CardDescription className="text-center">
                No worries! Enter your registered email and we'll send you a reset link.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <ForgotPasswordForm />

              {/* Back to Login Link */}
              <div className="text-center pt-4 border-t border-border/50">
                <Link to="/">
                  <Button 
                    variant="ghost" 
                    className="text-sm font-medium hover:text-primary"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Login
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Additional Help */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-6 text-center text-sm text-muted-foreground"
          >
            <p>
              Need help?{' '}
              <a 
                href="mailto:support@campuzbuzz.com" 
                className="text-primary hover:underline font-medium"
              >
                Contact Support
              </a>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default ForgotPassword;

