
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DateRange } from 'react-day-picker';
import { CalendarIcon, X, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { PostFilter as PostFilterType } from '@/services/enhancedPostsService';

interface PostFilterProps {
  filter: PostFilterType;
  onFilterChange: (filter: Partial<PostFilterType>) => void;
  onClearFilters: () => void;
  className?: string;
}

export const PostFilter: React.FC<PostFilterProps> = ({
  filter,
  onFilterChange,
  onClearFilters,
  className = ''
}) => {
  const [tagInput, setTagInput] = React.useState('');
  const [hashtagInput, setHashtagInput] = React.useState('');
  const [showFilters, setShowFilters] = React.useState(false);

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      const currentTags = filter.tags || [];
      if (!currentTags.includes(tagInput.trim())) {
        onFilterChange({ tags: [...currentTags, tagInput.trim()] });
      }
      setTagInput('');
    }
  };

  const handleAddHashtag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && hashtagInput.trim()) {
      const hashtag = hashtagInput.trim().replace('#', '');
      const currentHashtags = filter.hashtags || [];
      if (!currentHashtags.includes(hashtag)) {
        onFilterChange({ hashtags: [...currentHashtags, hashtag] });
      }
      setHashtagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    const updatedTags = (filter.tags || []).filter(tag => tag !== tagToRemove);
    onFilterChange({ tags: updatedTags });
  };

  const removeHashtag = (hashtagToRemove: string) => {
    const updatedHashtags = (filter.hashtags || []).filter(hashtag => hashtag !== hashtagToRemove);
    onFilterChange({ hashtags: updatedHashtags });
  };

  const handleDateRangeSelect = (range: DateRange | undefined) => {
    if (range?.from && range?.to) {
      onFilterChange({ 
        dateRange: { 
          start: range.from, 
          end: range.to 
        } 
      });
    } else {
      onFilterChange({ dateRange: undefined });
    }
  };

  const hasActiveFilters = !!(
    filter.type ||
    (filter.tags && filter.tags.length > 0) ||
    (filter.hashtags && filter.hashtags.length > 0) ||
    filter.author ||
    filter.dateRange ||
    (filter.sortBy && filter.sortBy !== 'recent') ||
    (filter.visibility && filter.visibility !== 'all')
  );

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? 'Hide' : 'Show'} Filters
            </Button>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="text-muted-foreground"
              >
                Clear All
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {showFilters && (
        <CardContent className="space-y-4">
          {/* Post Type Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Post Type</label>
            <Select
              value={filter.type || 'all'}
              onValueChange={(value) => onFilterChange({ type: value === 'all' ? undefined : value as any })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="image">Image</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="poll">Poll</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort By */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Sort By</label>
            <Select
              value={filter.sortBy || 'recent'}
              onValueChange={(value) => onFilterChange({ sortBy: value as any })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Recent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="trending">Trending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Visibility Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Visibility</label>
            <Select
              value={filter.visibility || 'all'}
              onValueChange={(value) => onFilterChange({ visibility: value === 'all' ? undefined : value as any })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="friends">Friends Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tags Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Tags</label>
            <Input
              placeholder="Add tag and press Enter"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
            />
            {filter.tags && filter.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {filter.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Hashtags Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Hashtags</label>
            <Input
              placeholder="Add hashtag and press Enter"
              value={hashtagInput}
              onChange={(e) => setHashtagInput(e.target.value)}
              onKeyDown={handleAddHashtag}
            />
            {filter.hashtags && filter.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {filter.hashtags.map((hashtag) => (
                  <Badge key={hashtag} variant="outline" className="flex items-center gap-1">
                    #{hashtag}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeHashtag(hashtag)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Date Range Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Date Range</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filter.dateRange ? (
                    `${format(filter.dateRange.start, 'PPP')} - ${format(filter.dateRange.end, 'PPP')}`
                  ) : (
                    'Select date range'
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={{
                    from: filter.dateRange?.start,
                    to: filter.dateRange?.end
                  }}
                  onSelect={handleDateRangeSelect}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      )}
    </Card>
  );
};
