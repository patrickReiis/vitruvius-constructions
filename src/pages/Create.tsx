import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ArchitectureSimulator } from '@/components/architecture/ArchitectureSimulator';
import { ProjectGallery } from '@/components/architecture/ProjectGallery';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Building, 
  User, 
  Calendar, 
  Download,
  Grid3X3,
  Tag,
  Sparkles
} from 'lucide-react';
import { ArchitecturalProject } from '@/types/architecture';
import { useAuthor } from '@/hooks/useAuthor';

const Create = () => {
  const { projectId } = useParams<{ projectId?: string }>();
  // Note: projectId from URL is currently used for future features
  // The actual project loading is handled via localStorage by the simulator
  
  const [selectedProject, setSelectedProject] = useState<ArchitecturalProject | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handleProjectLoad = (project: ArchitecturalProject) => {
    // Store the project in localStorage for the main app to load
    localStorage.setItem('loadedProject', JSON.stringify(project));
    // The simulator should automatically pick this up and load it
    window.location.reload(); // Reload to trigger the load
  };

  const handleProjectPreview = (project: ArchitecturalProject) => {
    setSelectedProject(project);
    setIsPreviewOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Main Simulator Section */}
      <div className="h-screen">
        <ArchitectureSimulator />
      </div>

      {/* Gallery Section */}
      <div className="border-t bg-gradient-to-br from-muted/10 to-background">
        <div className="container mx-auto px-4 py-12">
          {/* Section Header */}
          <div className="text-center mb-8 space-y-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="h-6 w-6 text-primary" />
              <h2 className="text-3xl font-bold">Community Gallery</h2>
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover amazing architectural projects from the community. Click any project to preview details or load it into your simulator.
            </p>
          </div>

          {/* Gallery Component */}
          <ProjectGallery
            onProjectSelect={handleProjectPreview}
            onProjectLoad={handleProjectLoad}
          />
        </div>
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
  
  if (!project) return null;

  const authorName = author.data?.metadata?.name || 
                    author.data?.metadata?.display_name || 
                    project.author.slice(0, 8);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            {project.name}
          </DialogTitle>
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

export default Create;