
// Query optimization utilities for database operations
export class QueryOptimizer {
  // Batch operations for better performance
  static batchSize = 50;

  // Optimize IN queries to avoid large parameter lists
  static async processBatches<T, R>(
    items: T[],
    processor: (batch: T[]) => Promise<R[]>
  ): Promise<R[]> {
    const results: R[] = [];
    
    for (let i = 0; i < items.length; i += this.batchSize) {
      const batch = items.slice(i, i + this.batchSize);
      const batchResults = await processor(batch);
      results.push(...batchResults);
    }
    
    return results;
  }

  // Generate optimized select statements with only needed fields
  static generateSelectFields(
    baseFields: string[],
    relationFields?: Record<string, string[]>
  ): string {
    let selectStr = baseFields.join(', ');
    
    if (relationFields) {
      Object.entries(relationFields).forEach(([relation, fields]) => {
        selectStr += `, ${relation} (${fields.join(', ')})`;
      });
    }
    
    return selectStr;
  }

  // Cache commonly used queries
  private static queryCache = new Map<string, { data: any; timestamp: number }>();
  private static CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  static getCachedResult<T>(key: string): T | null {
    const cached = this.queryCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }
    return null;
  }

  static setCachedResult<T>(key: string, data: T): void {
    this.queryCache.set(key, { data, timestamp: Date.now() });
  }

  static clearCache(): void {
    this.queryCache.clear();
  }

  // Optimize pagination with proper indexing
  static getPaginationParams(page: number, limit: number = 20) {
    return {
      from: page * limit,
      to: (page + 1) * limit - 1
    };
  }

  // Generate cache keys for consistent caching
  static generateCacheKey(prefix: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${JSON.stringify(params[key])}`)
      .join('|');
    return `${prefix}:${sortedParams}`;
  }
}
