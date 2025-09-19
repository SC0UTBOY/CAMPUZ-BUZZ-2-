
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Upload, 
  Download, 
  FileText, 
  Image, 
  Video, 
  Archive,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';
import { useStudyGroups } from '@/hooks/useStudyGroups';
import { useAuth } from '@/contexts/AuthContext';
import { StudyMaterial } from '@/services/studyGroupsService';
import { studyGroupsService } from '@/services/studyGroupsService';

interface StudyMaterialsProps {
  studyGroupId: string;
}

const getFileIcon = (fileType: string) => {
  if (fileType.startsWith('image/')) return Image;
  if (fileType.startsWith('video/')) return Video;
  if (fileType.includes('zip') || fileType.includes('rar')) return Archive;
  return FileText;
};

const formatFileSize = (bytes: number) => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

export const StudyMaterials: React.FC<StudyMaterialsProps> = ({ studyGroupId }) => {
  const { user } = useAuth();
  const { 
    materials, 
    loadingMaterials, 
    uploadMaterial, 
    deleteMaterial,
    uploadingMaterial,
    deletingMaterial,
    refetchMaterials 
  } = useStudyGroups(studyGroupId);

  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadData, setUploadData] = useState({
    title: '',
    description: '',
    tags: '',
    is_public: true,
    file: null as File | null
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadData(prev => ({ 
        ...prev, 
        file,
        title: prev.title || file.name.split('.')[0]
      }));
    }
  };

  const handleUpload = () => {
    if (!uploadData.file || !uploadData.title.trim()) return;

    const materialData = {
      title: uploadData.title.trim(),
      description: uploadData.description.trim() || undefined,
      tags: uploadData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      is_public: uploadData.is_public
    };

    uploadMaterial(uploadData.file, materialData);
    
    // Reset form
    setUploadData({
      title: '',
      description: '',
      tags: '',
      is_public: true,
      file: null
    });
    setShowUploadForm(false);
  };

  const handleDownload = async (material: StudyMaterial) => {
    try {
      // Increment download count
      await studyGroupsService.incrementDownloadCount(material.id);
      
      // Open file in new tab or trigger download
      window.open(material.file_url, '_blank');
      
      // Refresh materials to update download count
      refetchMaterials();
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  if (loadingMaterials) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Study Materials</h3>
        <Button 
          onClick={() => setShowUploadForm(!showUploadForm)}
          disabled={uploadingMaterial}
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload Material
        </Button>
      </div>

      {showUploadForm && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Study Material</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="file-upload">Select File</Label>
              <Input
                id="file-upload"
                type="file"
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.png,.gif,.mp4,.zip,.rar"
              />
            </div>

            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={uploadData.title}
                onChange={(e) => setUploadData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter material title"
              />
            </div>

            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={uploadData.description}
                onChange={(e) => setUploadData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what this material covers"
                className="min-h-[80px]"
              />
            </div>

            <div>
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={uploadData.tags}
                onChange={(e) => setUploadData(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="e.g., lecture notes, assignment, quiz"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_public"
                checked={uploadData.is_public}
                onChange={(e) => setUploadData(prev => ({ ...prev, is_public: e.target.checked }))}
              />
              <Label htmlFor="is_public" className="flex items-center space-x-2">
                {uploadData.is_public ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                <span>Make this material public</span>
              </Label>
            </div>

            <div className="flex space-x-2">
              <Button 
                onClick={handleUpload}
                disabled={!uploadData.file || !uploadData.title.trim() || uploadingMaterial}
              >
                {uploadingMaterial ? 'Uploading...' : 'Upload'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowUploadForm(false)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {materials.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No materials shared yet</h3>
              <p className="text-muted-foreground">Be the first to share study materials with your group!</p>
            </CardContent>
          </Card>
        ) : (
          materials.map((material) => {
            const FileIcon = getFileIcon(material.file_type);
            const isOwner = material.uploaded_by === user?.id;

            return (
              <Card key={material.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <FileIcon className="h-8 w-8 text-primary mt-1" />
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">{material.title}</h4>
                          {!material.is_public && (
                            <Badge variant="secondary">
                              <EyeOff className="h-3 w-3 mr-1" />
                              Private
                            </Badge>
                          )}
                        </div>
                        
                        {material.description && (
                          <p className="text-sm text-muted-foreground">{material.description}</p>
                        )}
                        
                        <div className="flex flex-wrap gap-1">
                          {material.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={material.profiles?.avatar_url} />
                              <AvatarFallback className="text-xs">
                                {material.profiles?.display_name?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <span>by {material.profiles?.display_name || 'Unknown'}</span>
                          </div>
                          <span>{formatFileSize(material.file_size)}</span>
                          <span>{material.download_count} downloads</span>
                          <span>{new Date(material.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(material)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      {isOwner && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteMaterial(material.id)}
                          disabled={deletingMaterial}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};
