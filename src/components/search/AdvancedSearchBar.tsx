
import React, { useState, useRef, useEffect } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchFilters } from '@/services/searchService';

export interface AdvancedSearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  onFiltersChange: (filters: Partial<SearchFilters>) => void;
  suggestions?: string[];
  isLoading?: boolean;
}

export const AdvancedSearchBar: React.FC<AdvancedSearchBarProps> = ({
  query,
  onQueryChange,
  onFiltersChange,
  suggestions = [],
  isLoading = false
}) => {
  const [filters, setFilters] = useState<SearchFilters>({});
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    setFilters({});
    onFiltersChange({});
  };

  const activeFilterCount = Object.values(filters).filter(value => {
    if (Array.isArray(value)) return value.length > 0;
    return Boolean(value);
  }).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            ref={inputRef}
            placeholder="Search posts, users, communities, events..."
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            className="pl-10 pr-12"
            disabled={isLoading}
          />
          {isLoading && (
            <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            </div>
          )}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
              >
                <Filter className="h-4 w-4" />
                {activeFilterCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Search Filters</h3>
                  {activeFilterCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      Clear all
                    </Button>
                  )}
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Content Type</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {['posts', 'users', 'communities', 'events'].map((type) => (
                        <div key={type} className="flex items-center space-x-2">
                          <Checkbox
                            id={type}
                            checked={filters.type?.includes(type) || false}
                            onCheckedChange={(checked) => {
                              const currentTypes = filters.type || [];
                              const newTypes = checked
                                ? [...currentTypes, type]
                                : currentTypes.filter(t => t !== type);
                              handleFilterChange('type', newTypes.length ? newTypes : undefined);
                            }}
                          />
                          <label htmlFor={type} className="text-sm capitalize">
                            {type}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Date Range</label>
                    <Select
                      value={filters.dateRange}
                      onValueChange={(value) => handleFilterChange('dateRange', value)}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Any time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="day">Today</SelectItem>
                        <SelectItem value="week">This week</SelectItem>
                        <SelectItem value="month">This month</SelectItem>
                        <SelectItem value="year">This year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Sort By</label>
                    <Select
                      value={filters.sortBy}
                      onValueChange={(value) => handleFilterChange('sortBy', value)}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Relevance" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="relevance">Relevance</SelectItem>
                        <SelectItem value="recent">Date</SelectItem>
                        <SelectItem value="popular">Popularity</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 bg-popover border rounded-md shadow-md z-50 mt-1">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                className="w-full text-left px-4 py-2 hover:bg-accent text-sm"
                onClick={() => {
                  onQueryChange(suggestion);
                  setShowSuggestions(false);
                }}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>

      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.type?.map((type) => (
            <Badge key={type} variant="secondary" className="capitalize">
              {type}
              <X
                className="ml-1 h-3 w-3 cursor-pointer"
                onClick={() => {
                  const newTypes = filters.type?.filter(t => t !== type);
                  handleFilterChange('type', newTypes?.length ? newTypes : undefined);
                }}
              />
            </Badge>
          ))}
          {filters.dateRange && (
            <Badge variant="secondary">
              {filters.dateRange}
              <X
                className="ml-1 h-3 w-3 cursor-pointer"
                onClick={() => handleFilterChange('dateRange', undefined)}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};
