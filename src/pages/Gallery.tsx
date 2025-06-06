import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProjectGallery } from '@/components/architecture/ProjectGallery';
import { LoginArea } from '@/components/auth/LoginArea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/useToast';
import { setTransferProject } from '@/hooks/useProjectManager';
import { 
  ArrowLeft, 
  Building, 
  User, 
  Calendar, 
  Download,
  Grid3X3,
  Tag,
  Copy,
  Check
} from 'lucide-react';
import { ArchitecturalProject } from '@/types/architecture';
import { useAuthor } from '@/hooks/useAuthor';

const Gallery = () => {
  const navigate = useNavigate();
  const [selectedProject, setSelectedProject] = useState<ArchitecturalProject | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handleProjectLoad = (project: ArchitecturalProject) => {
    // Store the project in memory for the simulator to load
    setTransferProject(project);
    navigate('/create');
  };

  const handleProjectPreview = (project: ArchitecturalProject) => {
    setSelectedProject(project);
    setIsPreviewOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/create')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Simulator
              </Button>
              
              <Separator orientation="vertical" className="h-6" />
              
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Building className="h-6 w-6 text-primary" />
                Project Gallery
              </h1>
            </div>

            <div className="scale-100">
              <LoginArea />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Discover Architecture Projects</h2>
          <p className="text-muted-foreground">
            Browse and load 3D architectural projects shared by the community on Nostr.
          </p>
        </div>

        <ProjectGallery
          onProjectSelect={handleProjectPreview}
          onProjectLoad={handleProjectLoad}
        />
      </div>

      {/* Project Preview Dialog */}
      <ProjectPreviewDialog
        project={selectedProject}
        isOpen={isPreviewOpen}
        onClose={() => {
          setIsPreviewOpen(false);
          setSelectedProject(null);
        }}
        onLoad={() => {
          if (selectedProject) {
            handleProjectLoad(selectedProject);
          }
        }}
      />
    </div>
  );
};

function ProjectPreviewDialog({ 
  project, 
  isOpen, 
  onClose, 
  onLoad 
}: {
  project: ArchitecturalProject | null;
  isOpen: boolean;
  onClose: () => void;
  onLoad: () => void;
}) {
  const author = useAuthor(project?.author || '');
  const { toast } = useToast();
  const [eventIdCopied, setEventIdCopied] = useState(false);
  
  if (!project) return null;

  const authorName = author.data?.metadata?.name || 
                    author.data?.metadata?.display_name || 
                    project.author.slice(0, 8);

  const copyEventId = async () => {
    if (!project.eventId) return;

    try {
      await navigator.clipboard.writeText(project.eventId);
      setEventIdCopied(true);
      toast({
        title: "Event ID Copied",
        description: "Nostr event ID copied to clipboard",
      });
      setTimeout(() => setEventIdCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy event ID to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              {project.name}
            </DialogTitle>
            {project.eventId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={copyEventId}
                className="h-8 px-3 text-xs"
              >
                {eventIdCopied ? (
                  <Check className="h-3 w-3 mr-1" />
                ) : (
                  <Copy className="h-3 w-3 mr-1" />
                )}
                {eventIdCopied ? "Copied" : "Copy Event ID"}
              </Button>
            )}
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Project Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                <span>{authorName}</span>
              </div>
              
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{new Date(project.created_at).toLocaleDateString()}</span>
              </div>
              
              {project.metadata.style && (
                <Badge variant="secondary">
                  {project.metadata.style}
                </Badge>
              )}
            </div>

            {project.description && (
              <p className="text-muted-foreground">
                {project.description}
              </p>
            )}
          </div>

          <Separator />

          {/* Project Details */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Grid3X3 className="h-4 w-4" />
                  Project Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Elements:</span>
                  <span className="font-medium">{project.elements.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Scale:</span>
                  <span className="font-medium">1:{project.metadata.scale}</span>
                </div>
                <div className="flex justify-between">
                  <span>Units:</span>
                  <span className="font-medium capitalize">{project.metadata.units}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent>
                {project.metadata.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {project.metadata.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No tags</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Element Breakdown */}
          <div>
            <h4 className="text-sm font-medium mb-3">Element Breakdown</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {Object.entries(
                project.elements.reduce((acc, element) => {
                  acc[element.type] = (acc[element.type] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)
              ).map(([type, count]) => (
                <div key={type} className="flex justify-between p-2 bg-muted rounded">
                  <span className="capitalize">{type}:</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex gap-3">
            <Button onClick={onLoad} className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Load Project
            </Button>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default Gallery;