
export class DebugLogger {
  private static isDevelopment = process.env.NODE_ENV === 'development';
  
  static log(category: string, message: string, data?: any) {
    if (this.isDevelopment) {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] [${category}] ${message}`, data || '');
    }
  }
  
  static error(category: string, message: string, error?: any) {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [${category}] ${message}`, error || '');
  }
  
  static warn(category: string, message: string, data?: any) {
    if (this.isDevelopment) {
      const timestamp = new Date().toISOString();
      console.warn(`[${timestamp}] [${category}] ${message}`, data || '');
    }
  }
  
  static renderTrace(componentName: string, phase: 'mount' | 'update' | 'unmount') {
    if (this.isDevelopment) {
      this.log('RENDER', `${componentName} - ${phase}`);
    }
  }
  
  static authTrace(event: string, data?: any) {
    this.log('AUTH', event, data);
  }
  
  static routeTrace(from: string, to: string) {
    this.log('ROUTE', `Navigation: ${from} -> ${to}`);
  }
  
  static apiTrace(endpoint: string, method: string, status?: number) {
    this.log('API', `${method} ${endpoint}${status ? ` - ${status}` : ''}`);
  }
}
