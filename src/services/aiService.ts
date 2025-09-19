
import { supabase } from '@/integrations/supabase/client';

export interface StudySuggestion {
  id: string;
  suggestion_type: 'topic' | 'group' | 'resource' | 'event';
  title: string;
  description: string;
  relevance_score: number;
  metadata?: Record<string, any>;
}

export interface AutoTagResult {
  suggestedTags: string[];
  suggestedCommunities: string[];
  confidence: number;
}

export interface TagSuggestion {
  tag: string;
  confidence: number;
  category: 'academic' | 'social' | 'professional' | 'interest';
}

class AIServiceClass {
  async getStudySuggestions(userId: string): Promise<StudySuggestion[]> {
    try {
      // Get user profile for context
      const { data: profile } = await supabase
        .from('profiles')
        .select('major, interests, skills, year')
        .eq('user_id', userId)
        .single();

      // Call the database function for study suggestions
      const { data, error } = await supabase
        .rpc('get_study_suggestions', { user_uuid: userId });

      if (error) throw error;

      return data?.map((suggestion: any) => ({
        id: `suggestion_${Date.now()}_${Math.random()}`,
        suggestion_type: suggestion.suggestion_type as 'topic' | 'group' | 'resource' | 'event',
        title: suggestion.title,
        description: suggestion.description,
        relevance_score: suggestion.relevance_score,
        metadata: {
          user_major: profile?.major,
          user_interests: profile?.interests || [],
          user_skills: profile?.skills || []
        }
      })) || [];
    } catch (error) {
      console.error('Error getting study suggestions:', error);
      
      // Fallback suggestions based on user profile
      return this.getFallbackSuggestions(userId);
    }
  }

  async autoTagPost(content: string, title?: string): Promise<AutoTagResult> {
    try {
      const tagSuggestions = await this.generateTagSuggestions(content);
      
      return {
        suggestedTags: tagSuggestions.map(s => s.tag),
        suggestedCommunities: this.extractCommunities(content),
        confidence: tagSuggestions.length > 0 ? Math.max(...tagSuggestions.map(s => s.confidence)) : 0.5
      };
    } catch (error) {
      console.error('Error auto-tagging post:', error);
      return {
        suggestedTags: [],
        suggestedCommunities: [],
        confidence: 0
      };
    }
  }

  async generateTagSuggestions(content: string): Promise<TagSuggestion[]> {
    try {
      // Extract keywords and phrases from content
      const words = content.toLowerCase().split(/\s+/).filter(word => word.length > 2);
      const suggestions: TagSuggestion[] = [];

      // Academic keywords mapping
      const academicKeywords = {
        'computer': { tag: 'Computer Science', confidence: 0.8, category: 'academic' as const },
        'science': { tag: 'Science', confidence: 0.7, category: 'academic' as const },
        'math': { tag: 'Mathematics', confidence: 0.8, category: 'academic' as const },
        'programming': { tag: 'Programming', confidence: 0.9, category: 'academic' as const },
        'study': { tag: 'Study Group', confidence: 0.6, category: 'academic' as const },
        'homework': { tag: 'Homework Help', confidence: 0.7, category: 'academic' as const },
        'project': { tag: 'Project', confidence: 0.6, category: 'academic' as const },
        'exam': { tag: 'Exam Prep', confidence: 0.8, category: 'academic' as const },
        'research': { tag: 'Research', confidence: 0.7, category: 'academic' as const }
      };

      // Social keywords mapping
      const socialKeywords = {
        'event': { tag: 'Event', confidence: 0.7, category: 'social' as const },
        'party': { tag: 'Social', confidence: 0.6, category: 'social' as const },
        'meetup': { tag: 'Meetup', confidence: 0.8, category: 'social' as const },
        'friend': { tag: 'Friends', confidence: 0.5, category: 'social' as const },
        'club': { tag: 'Club', confidence: 0.7, category: 'social' as const }
      };

      // Check for academic keywords
      words.forEach(word => {
        if (academicKeywords[word]) {
          suggestions.push(academicKeywords[word]);
        }
        if (socialKeywords[word]) {
          suggestions.push(socialKeywords[word]);
        }
      });

      // Remove duplicates and sort by confidence
      const uniqueSuggestions = suggestions
        .filter((suggestion, index, self) => 
          index === self.findIndex(s => s.tag === suggestion.tag)
        )
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 5); // Limit to top 5 suggestions

      return uniqueSuggestions;
    } catch (error) {
      console.error('Error generating tag suggestions:', error);
      return [];
    }
  }

  private extractCommunities(content: string): string[] {
    // Basic community extraction based on content analysis
    const communities: string[] = [];
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('study') || lowerContent.includes('homework')) {
      communities.push('Study Groups');
    }
    if (lowerContent.includes('event') || lowerContent.includes('party')) {
      communities.push('Events');
    }
    if (lowerContent.includes('tech') || lowerContent.includes('programming')) {
      communities.push('Tech');
    }
    
    return communities;
  }

  async moderateContent(content: string): Promise<{
    isAppropriate: boolean;
    confidence: number;
    flaggedReasons: string[];
  }> {
    try {
      // Basic content moderation using keyword filtering
      const inappropriateKeywords = [
        'spam', 'scam', 'inappropriate', 'offensive', 'hate', 'harassment'
      ];

      const lowerContent = content.toLowerCase();
      const flaggedReasons: string[] = [];
      
      inappropriateKeywords.forEach(keyword => {
        if (lowerContent.includes(keyword)) {
          flaggedReasons.push(`Contains potentially inappropriate content: ${keyword}`);
        }
      });

      const isAppropriate = flaggedReasons.length === 0;
      const confidence = isAppropriate ? 0.95 : 0.8;

      return {
        isAppropriate,
        confidence,
        flaggedReasons
      };
    } catch (error) {
      console.error('Error moderating content:', error);
      // Default to allowing content if moderation fails
      return {
        isAppropriate: true,
        confidence: 0.5,
        flaggedReasons: []
      };
    }
  }

  private async getFallbackSuggestions(userId: string): Promise<StudySuggestion[]> {
    try {
      // Get user's recent activity to generate relevant suggestions
      const { data: recentPosts } = await supabase
        .from('posts')
        .select('tags, content')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      const suggestions: StudySuggestion[] = [
        {
          id: 'fallback_1',
          suggestion_type: 'topic',
          title: 'Study Tips & Techniques',
          description: 'Discover effective study methods and productivity tips',
          relevance_score: 75,
          metadata: { source: 'fallback' }
        },
        {
          id: 'fallback_2',
          suggestion_type: 'group',
          title: 'Join Study Groups',
          description: 'Connect with peers in your field of study',
          relevance_score: 80,
          metadata: { source: 'fallback' }
        }
      ];

      // Add topic-specific suggestions based on recent posts
      if (recentPosts && recentPosts.length > 0) {
        const tags = recentPosts.flatMap(post => post.tags || []);
        const uniqueTags = [...new Set(tags)].slice(0, 3);

        uniqueTags.forEach((tag, index) => {
          suggestions.push({
            id: `topic_${index}`,
            suggestion_type: 'topic',
            title: `Advanced ${tag}`,
            description: `Dive deeper into ${tag} concepts and applications`,
            relevance_score: 70 - (index * 5),
            metadata: { source: 'user_activity', tag }
          });
        });
      }

      return suggestions;
    } catch (error) {
      console.error('Error generating fallback suggestions:', error);
      return [];
    }
  }
}

export const AIService = new AIServiceClass();
export const aiService = AIService; // Export both for compatibility
