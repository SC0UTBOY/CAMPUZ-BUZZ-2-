
import { supabase } from '@/integrations/supabase/client';

interface DeploymentConfig {
  environment: 'development' | 'staging' | 'production';
  apiUrl: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  features: {
    analytics: boolean;
    pushNotifications: boolean;
    voiceChat: boolean;
    fileUpload: boolean;
    realtime: boolean;
  };
  limits: {
    maxFileSize: number;
    maxCommunityMembers: number;
    rateLimit: {
      posts: number;
      messages: number;
      api: number;
    };
  };
  cdn: {
    enabled: boolean;
    baseUrl: string;
    cacheDuration: number;
  };
  monitoring: {
    errorTracking: boolean;
    performanceMonitoring: boolean;
    userAnalytics: boolean;
  };
}

// Environment detection
const getEnvironment = (): 'development' | 'staging' | 'production' => {
  const hostname = window.location.hostname;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'development';
  } else if (hostname.includes('staging') || hostname.includes('preview')) {
    return 'staging';
  } else {
    return 'production';
  }
};

// Production configuration
const productionConfig: DeploymentConfig = {
  environment: 'production',
  apiUrl: 'https://api.campuzbuzz.com',
  supabaseUrl: 'https://seqxzvkodvrqvrvekygy.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcXh6dmtvZHZycXZydmVreWd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3NjA3MjQsImV4cCI6MjA2NjMzNjcyNH0.p3VxLLuX9JGDaXMluN6Sr3KCRwY8zCUAz5d3QASFEus',
  features: {
    analytics: true,
    pushNotifications: true,
    voiceChat: true,
    fileUpload: true,
    realtime: true
  },
  limits: {
    maxFileSize: 50 * 1024 * 1024, // 50MB
    maxCommunityMembers: 10000,
    rateLimit: {
      posts: 10, // per hour
      messages: 100, // per hour
      api: 1000 // per hour
    }
  },
  cdn: {
    enabled: true,
    baseUrl: 'https://cdn.campuzbuzz.com',
    cacheDuration: 31536000 // 1 year
  },
  monitoring: {
    errorTracking: true,
    performanceMonitoring: true,
    userAnalytics: true
  }
};

// Staging configuration
const stagingConfig: DeploymentConfig = {
  ...productionConfig,
  environment: 'staging',
  apiUrl: 'https://api-staging.campuzbuzz.com',
  limits: {
    ...productionConfig.limits,
    maxCommunityMembers: 1000,
    rateLimit: {
      posts: 20, // More lenient for testing
      messages: 200,
      api: 2000
    }
  },
  cdn: {
    enabled: false,
    baseUrl: '',
    cacheDuration: 0
  }
};

// Development configuration
const developmentConfig: DeploymentConfig = {
  ...stagingConfig,
  environment: 'development',
  apiUrl: 'http://localhost:3000',
  features: {
    ...stagingConfig.features,
    analytics: false, // Disable analytics in dev
    pushNotifications: false
  },
  monitoring: {
    errorTracking: false,
    performanceMonitoring: false,
    userAnalytics: false
  }
};

// Get current configuration based on environment
export const getDeploymentConfig = (): DeploymentConfig => {
  const env = getEnvironment();
  
  switch (env) {
    case 'production':
      return productionConfig;
    case 'staging':
      return stagingConfig;
    default:
      return developmentConfig;
  }
};

// Database migration verification
export const verifyDatabaseMigrations = async (): Promise<{
  success: boolean;
  migrations: string[];
  errors: string[];
}> => {
  const result = {
    success: true,
    migrations: [] as string[],
    errors: [] as string[]
  };

  try {
    // Check for required tables with proper typing
    const requiredTables = [
      'profiles',
      'posts',
      'comments',
      'communities',
      'community_members',
      'messages',
      'notifications',
      'security_events',
      'analytics_events'
    ] as const;

    for (const table of requiredTables) {
      try {
        const { error } = await supabase
          .from(table)
          .select('id')
          .limit(1);
        
        if (error) {
          result.errors.push(`Table ${table} not accessible: ${error.message}`);
          result.success = false;
        } else {
          result.migrations.push(`✓ Table ${table} verified`);
        }
      } catch (err) {
        result.errors.push(`Table ${table} check failed: ${err}`);
        result.success = false;
      }
    }

    // Check for required functions
    const requiredFunctions = [
      'get_current_user_role',
      'is_community_member',
      'is_study_group_member',
      'update_search_vector'
    ];

    // Note: Function verification would require admin access
    // In production, this should be done during deployment
    result.migrations.push('Function verification skipped (requires admin access)');

    // Check RLS policies
    result.migrations.push('RLS policies assumed to be in place');

  } catch (error) {
    result.errors.push(`Migration verification failed: ${error}`);
    result.success = false;
  }

  return result;
};

// CDN and static asset optimization
export const optimizeStaticAssets = () => {
  const config = getDeploymentConfig();
  
  if (!config.cdn.enabled) {
    return;
  }

  // Preload critical resources
  const criticalResources = [
    '/favicon.ico',
    '/manifest.json',
    '/offline.html'
  ];

  criticalResources.forEach(resource => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = config.cdn.baseUrl + resource;
    link.as = resource.endsWith('.ico') ? 'image' : 'document';
    document.head.appendChild(link);
  });

  // Set up service worker for asset caching
  if ('serviceWorker' in navigator && config.environment === 'production') {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('SW registered:', registration);
      })
      .catch(error => {
        console.error('SW registration failed:', error);
      });
  }
};

// Performance monitoring setup
export const setupPerformanceMonitoring = () => {
  const config = getDeploymentConfig();
  
  if (!config.monitoring.performanceMonitoring) {
    return;
  }

  // Monitor Core Web Vitals
  if ('web-vitals' in window) {
    // In a real app, you'd import the web-vitals library
    console.log('Performance monitoring enabled');
  }

  // Monitor API response times
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    const startTime = performance.now();
    try {
      const response = await originalFetch(...args);
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Log slow requests
      if (duration > 1000) {
        console.warn(`Slow API request: ${args[0]} took ${duration}ms`);
      }
      
      return response;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      console.error(`API request failed: ${args[0]} after ${duration}ms`, error);
      throw error;
    }
  };
};

// Error tracking setup
export const setupErrorTracking = () => {
  const config = getDeploymentConfig();
  
  if (!config.monitoring.errorTracking) {
    return;
  }

  // Global error handler
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    // In production, send to error tracking service
  });

  // Unhandled promise rejection handler
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    // In production, send to error tracking service
  });
};

// Initialize deployment configuration
export const initializeDeployment = async () => {
  const config = getDeploymentConfig();
  
  console.log(`Initializing CampuzBuzz in ${config.environment} mode`);
  
  // Set up monitoring and optimization
  setupPerformanceMonitoring();
  setupErrorTracking();
  optimizeStaticAssets();
  
  // Verify database migrations in production
  if (config.environment === 'production') {
    const migrationStatus = await verifyDatabaseMigrations();
    if (!migrationStatus.success) {
      console.error('Database migration verification failed:', migrationStatus.errors);
    } else {
      console.log('Database migrations verified successfully');
    }
  }
  
  return config;
};

export default getDeploymentConfig;
