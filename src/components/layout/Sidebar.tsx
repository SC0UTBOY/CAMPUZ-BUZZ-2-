
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { StatusIndicator } from '@/components/ui/status-indicator';
import { motion } from 'framer-motion';
import { 
  Home, 
  User, 
  Calendar, 
  MessageSquare, 
  Megaphone, 
  Search, 
  Users, 
  LogOut,
  X,
  Moon,
  Sun,
  BookOpen,
  Zap,
  TrendingUp
} from 'lucide-react';

interface SidebarProps {
  onClose: () => void;
}

const getRoleBadge = (role: string) => {
  const roleConfig = {
    admin: { label: 'Admin', className: 'badge-admin' },
    professor: { label: 'Prof', className: 'badge-professor' },
    club: { label: 'Club', className: 'badge-mentor' },
    student: { label: 'Student', className: 'badge-student' }
  };
  
  const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.student;
  return (
    <Badge className={`text-xs ${config.className}`}>
      {config.label}
    </Badge>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const { signOut } = useAuth();
  const { profile } = useUserProfile();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const navItems = [
    { icon: Home, label: 'Home', path: '/', color: 'text-blue-500' },
    { icon: TrendingUp, label: 'Trending', path: '/explore', color: 'text-orange-500' },
    { icon: Users, label: 'Communities', path: '/communities', color: 'text-green-500' },
    { icon: Calendar, label: 'Events', path: '/events', color: 'text-purple-500' },
    { icon: MessageSquare, label: 'Chat', path: '/chat', color: 'text-pink-500' },
    { icon: BookOpen, label: 'Study Groups', path: '/study-groups', color: 'text-indigo-500' },
    { icon: Megaphone, label: 'Announcements', path: '/announcements', color: 'text-red-500' },
  ];

  return (
    <motion.div 
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="h-full bg-sidebar border-r border-sidebar-border flex flex-col shadow-lg"
    >
      {/* Header */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center justify-between">
          <motion.div 
            className="flex items-center space-x-3"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <div className="relative flex items-center justify-center">
              {/* Light mode logo */}
              <img 
                src="/lovable-uploads/e51f26a6-a9d4-4b1f-a787-2f24bdc5c8bf.png" 
                alt="CampuzBuzz Logo" 
                className="w-10 h-10 object-contain dark:hidden"
              />
              {/* Dark mode logo */}
              <img 
                src="/5.png" 
                alt="CampuzBuzz Logo" 
                className="w-10 h-10 object-contain hidden dark:block"
              />
            </div>
            <span className="text-xl font-bold gradient-text bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              CampuzBuzz
            </span>
          </motion.div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="lg:hidden hover:bg-sidebar-accent"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* User Profile Card */}
      <div className="p-4 border-b border-sidebar-border/50">
        <motion.div 
          className="flex items-center space-x-3 p-3 rounded-lg hover:bg-sidebar-accent/50 transition-colors cursor-pointer"
          whileHover={{ scale: 1.02 }}
        >
          <div className="relative">
            <Avatar className="h-12 w-12 ring-2 ring-primary/20">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                {profile?.display_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <StatusIndicator 
              status="online" 
              className="absolute -bottom-1 -right-1" 
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <p className="text-sm font-semibold text-sidebar-foreground truncate">
                {profile?.display_name || 'User'}
              </p>
              {profile?.role && getRoleBadge(profile.role)}
            </div>
            <p className="text-xs text-sidebar-foreground/70 truncate">
              {profile?.major} • {profile?.year}
            </p>
            <div className="flex items-center space-x-1 mt-1">
              <Zap className="h-3 w-3 text-yellow-500" />
              <span className="text-xs text-sidebar-foreground/70">
                {profile?.engagement_score || 0} pts
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <div className="text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wide mb-3 px-3">
          Navigation
        </div>
        {navItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          return (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <NavLink
                to={item.path}
                onClick={onClose}
                className={`group flex items-center space-x-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 animated-underline ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-md transform scale-[1.02]'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:transform hover:scale-[1.02]'
                }`}
              >
                <item.icon className={`h-5 w-5 ${isActive ? '' : item.color} group-hover:scale-110 transition-transform`} />
                <span>{item.label}</span>
              </NavLink>
            </motion.div>
          );
        })}
      </nav>

      {/* Footer Actions */}
      <div className="p-4 border-t border-sidebar-border/50 space-y-2">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group"
          onClick={toggleTheme}
        >
          {theme === 'dark' ? (
            <Sun className="h-5 w-5 mr-3 group-hover:rotate-180 transition-transform duration-300" />
          ) : (
            <Moon className="h-5 w-5 mr-3 group-hover:-rotate-12 transition-transform duration-300" />
          )}
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </Button>
        
        <Button 
          variant="ghost" 
          className="w-full justify-start text-sidebar-foreground hover:bg-destructive hover:text-destructive-foreground group"
          onClick={signOut}
        >
          <LogOut className="h-5 w-5 mr-3 group-hover:translate-x-1 transition-transform" />
          Sign Out
        </Button>
      </div>
    </motion.div>
  );
};
