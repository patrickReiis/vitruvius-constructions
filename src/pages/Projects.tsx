/**
 * Project Picker - Shows user's projects and allows selection or creation
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, 
  Building, 
  Clock, 
  User, 
  FolderOpen,
  Loader2,
  AlertCircle,
  Zap
} from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useVitruviusProjectsByAuthor } from '@/hooks/useVitruviusProjects';
import { useProjectManager, setTransferProject } from '@/hooks/useProjectManager';
import { ArchitecturalProject } from '@/types/architecture';
import { LoginArea } from '@/components/auth/LoginArea';

export function ProjectPicker() {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const { data: projects, isLoading, error } = useVitruviusProjectsByAuthor(user?.pubkey || '');
  const { loadFromFile } = useProjectManager();
  const [isLoadingFile, setIsLoadingFile] = useState(false);

  const handleCreateNew = () => {
    navigate('/create');
  };

  const handleLoadProject = (project: ArchitecturalProject) => {
    // Store project in memory for the simulator to pick up
    setTransferProject(project);
    navigate(`/create/${project.id}`);
  };

  const handleLoadFromFile = async () => {
    try {
      setIsLoadingFile(true);
      const project = await loadFromFile();
      setTransferProject(project);
      navigate(`/create/${project.id}`);
    } catch (err) {
      console.error('Failed to load project from file:', err);
    } finally {
      setIsLoadingFile(false);
    }
  };

  // If user is not logged in, redirect to create directly
  if (!user) {
    navigate('/create');
    return null;
  }

  // If user has no projects and not loading, auto-create new project
  if (!isLoading && !error && (!projects || projects.length === 0)) {
    navigate('/create');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-6 w-6 text-red-500" />
              <h1 
                className="text-2xl font-bold cursor-pointer hover:text-red-500 transition-colors"
                onClick={() => navigate('/')}
              >
                Vitruvius Constructions
              </h1>
            </div>
            <div className="scale-100">
              <LoginArea />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">Your Architecture Projects</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Choose an existing project to continue building, or start fresh with a new design.
            </p>
          </div>

          {/* Error State */}
          {error && (
            <Alert variant="destructive" className="mb-8">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to load your projects. Please check your connection and try again.
              </AlertDescription>
            </Alert>
          )}

          {/* Projects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Create New Project Card */}
            <Card className="border-2 border-dashed border-primary/30 hover:border-primary/60 transition-colors cursor-pointer group">
              <CardContent 
                className="p-8 text-center space-y-4"
                onClick={handleCreateNew}
              >
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto group-hover:bg-primary/20 transition-colors">
                  <Plus className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">Create New Project</h3>
                <p className="text-sm text-muted-foreground">
                  Start building a fresh architectural design from scratch
                </p>
              </CardContent>
            </Card>

            {/* Load from File Card */}
            <Card className="border-2 border-dashed border-blue-200 hover:border-blue-400 transition-colors cursor-pointer group">
              <CardContent 
                className="p-8 text-center space-y-4"
                onClick={handleLoadFromFile}
              >
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto group-hover:bg-blue-200 transition-colors">
                  {isLoadingFile ? (
                    <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                  ) : (
                    <FolderOpen className="h-8 w-8 text-blue-600" />
                  )}
                </div>
                <h3 className="text-lg font-semibold">Load from File</h3>
                <p className="text-sm text-muted-foreground">
                  Import a project from a local JSON file
                </p>
              </CardContent>
            </Card>

            {/* Loading Skeletons */}
            {isLoading && (
              <>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i}>
                    <CardHeader className="pb-3">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Skeleton className="h-32 w-full rounded" />
                      <div className="flex gap-2">
                        <Skeleton className="h-6 w-16 rounded-full" />
                        <Skeleton className="h-6 w-20 rounded-full" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}

            {/* User's Projects */}
            {projects?.map((project) => (
              <ProjectCard 
                key={project.id} 
                project={project} 
                onSelect={() => handleLoadProject(project)}
              />
            ))}
          </div>

          {/* Empty State (if no projects and not loading) */}
          {!isLoading && projects && projects.length === 0 && (
            <div className="text-center py-12">
              <Building className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
              <p className="text-muted-foreground mb-6">
                You haven't created any architectural projects on Nostr yet. Start building to see them here!
              </p>
              <Button onClick={handleCreateNew} size="lg">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Project
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProjectCard({ 
  project, 
  onSelect 
}: { 
  project: ArchitecturalProject; 
  onSelect: () => void;
}) {
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={onSelect}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg group-hover:text-primary transition-colors">
          {project.name}
        </CardTitle>
        {project.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {project.description}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Project Preview Area - Could add 3D thumbnail in future */}
        <div className="bg-muted/30 rounded-lg p-8 text-center border-2 border-dashed border-muted-foreground/20">
          <Building className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            {project.elements.length} elements
          </p>
        </div>

        {/* Project Metadata */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>
              Updated {new Date(project.updated_at).toLocaleDateString()}
            </span>
          </div>

          {/* Tags */}
          {project.metadata.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {project.metadata.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {project.metadata.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{project.metadata.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Style and Stats */}
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{project.metadata.style} style</span>
            <span>1:{project.metadata.scale} scale</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default ProjectPicker;