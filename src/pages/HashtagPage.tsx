import React from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Hash, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export const HashtagPage: React.FC = () => {
  const { hashtag } = useParams<{ hashtag: string }>();
  const navigate = useNavigate();

  if (!hashtag) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Hashtag not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        
        <div className="flex items-center gap-3 mb-4">
          <Hash className="h-8 w-8 text-blue-500" />
          <h1 className="text-3xl font-bold">#{hashtag}</h1>
        </div>
        
        <p className="text-muted-foreground">
          Posts tagged with #{hashtag}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Posts with #{hashtag}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Hash className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              No posts found with this hashtag yet.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Be the first to post with #{hashtag}!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HashtagPage;









