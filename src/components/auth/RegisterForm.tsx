
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const RegisterForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    major: '',
    year: ''
  });
  const { signUp, loading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await signUp(formData.email, formData.password, {
      full_name: formData.name,
      major: formData.major,
      year: formData.year
    });
  };

  const majors = [
    'Computer Science', 'Engineering', 'Business', 'Psychology', 
    'Biology', 'Chemistry', 'Mathematics', 'English', 'History', 'Art'
  ];

  const years = ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate'];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          placeholder="Enter your full name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">College Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          placeholder="your.email@college.edu"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({...formData, password: e.target.value})}
          placeholder="Create a password"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Major</Label>
          <Select value={formData.major} onValueChange={(value) => setFormData({...formData, major: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Select major" />
            </SelectTrigger>
            <SelectContent>
              {majors.map((major) => (
                <SelectItem key={major} value={major}>{major}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Year</Label>
          <Select value={formData.year} onValueChange={(value) => setFormData({...formData, year: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button 
        type="submit" 
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
        disabled={loading}
      >
        {loading ? 'Creating Account...' : 'Create Account'}
      </Button>
    </form>
  );
};
