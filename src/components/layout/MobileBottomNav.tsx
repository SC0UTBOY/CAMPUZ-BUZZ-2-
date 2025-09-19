
import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { 
  Home, 
  Search, 
  Plus, 
  MessageSquare, 
  User,
  Calendar,
  Users
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';

export const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.pathname);

  const isActive = (path: string) => location.pathname === path;

  const createMenuItems = [
    { icon: MessageSquare, label: 'New Post', path: '/' },
    { icon: Calendar, label: 'Create Event', path: '/events' },
    { icon: Users, label: 'Study Group', path: '/study-groups' }
  ];

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Search, label: 'Explore', path: '/explore' },
    { icon: MessageSquare, label: 'Chat', path: '/chat', badge: 3 },
    { icon: User, label: 'Profile', path: '/profile' }
  ];

  const springTransition = {
    type: "spring" as const,
    stiffness: 500,
    damping: 30
  };

  return (
    <motion.nav 
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={springTransition}
    >
      {/* Backdrop blur with safe area */}
      <div className="bg-background/80 backdrop-blur-xl border-t border-border/40">
        <div className="flex items-center justify-around px-2 py-2 pb-safe">
          {navItems.map((item, index) => (
            <NavLink
              key={item.path}
              to={item.path}
              className="relative flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200 min-w-0"
              onClick={() => setActiveTab(item.path)}
            >
              {/* Active indicator */}
              <AnimatePresence>
                {isActive(item.path) && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-primary/10 rounded-xl"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={springTransition}
                  />
                )}
              </AnimatePresence>

              {/* Icon with animation */}
              <motion.div
                className="relative"
                whileTap={{ scale: 0.9 }}
                transition={springTransition}
              >
                <item.icon 
                  className={`h-5 w-5 transition-colors ${
                    isActive(item.path) ? 'text-primary' : 'text-muted-foreground'
                  }`} 
                />
                
                {/* Badge */}
                {item.badge && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1"
                  >
                    <Badge className="h-4 w-4 flex items-center justify-center p-0 bg-red-500 text-white text-xs rounded-full">
                      {item.badge}
                    </Badge>
                  </motion.div>
                )}
              </motion.div>
              
              {/* Label */}
              <motion.span 
                className={`text-xs mt-1 transition-colors truncate ${
                  isActive(item.path) ? 'text-primary font-medium' : 'text-muted-foreground'
                }`}
                animate={{ 
                  scale: isActive(item.path) ? 1.05 : 1,
                  fontWeight: isActive(item.path) ? 600 : 400
                }}
                transition={springTransition}
              >
                {item.label}
              </motion.span>
            </NavLink>
          ))}

          {/* Create Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.button
                className="flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200"
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.05 }}
              >
                <motion.div 
                  className="bg-primary text-primary-foreground rounded-full p-2"
                  whileTap={{ scale: 0.9 }}
                  transition={springTransition}
                >
                  <Plus className="h-4 w-4" />
                </motion.div>
                <span className="text-xs mt-1 text-muted-foreground">Create</span>
              </motion.button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent 
              align="center" 
              side="top" 
              className="mb-2 bg-background/95 backdrop-blur-xl border-border/50"
              asChild
            >
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={springTransition}
              >
                {createMenuItems.map((item) => (
                  <DropdownMenuItem key={item.label} asChild>
                    <NavLink 
                      to={item.path} 
                      className="cursor-pointer flex items-center gap-2 w-full"
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </NavLink>
                  </DropdownMenuItem>
                ))}
              </motion.div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.nav>
  );
};
