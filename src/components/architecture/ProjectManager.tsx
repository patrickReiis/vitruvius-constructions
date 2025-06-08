import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Save, 
  FolderOpen, 
  Share2, 
  Download, 
  Upload,
  FileText,
  Calendar,
  User,
  Tag,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Cloud,
  HardDrive,
  Trash2
} from 'lucide-react';
import { ArchitecturalProject } from '@/types/architecture';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useProjectManager } from '@/hooks/useProjectManager';

interface ProjectManagerProps {
  project: ArchitecturalProject;
  onProjectUpdate: (updates: Partial<ArchitecturalProject>) => void;
  onProjectLoad: (project: ArchitecturalProject) => void;
}

export function ProjectManager({ 
  project, 
  onProjectUpdate, 
  onProjectLoad,
}: ProjectManagerProps) {
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [newProjectData, setNewProjectData] = useState({
    name: '',
    description: '',
    style: '',
    tags: ''
  });

  const { user } = useCurrentUser();
  const {
    isLoading,
    error,
    saveToNostr,
    downloadLocal,
    loadFromFile,
    deleteFromNostr,
    clearError,
  } = useProjectManager();

  const handleNewProject = () => {
    const newProject: ArchitecturalProject = {
      id: crypto.randomUUID(),
      name: newProjectData.name || 'Untitled Project',
      description: newProjectData.description,
      author: user?.pubkey || 'anonymous',
      created_at: Date.now(),
      updated_at: Date.now(),
      elements: [],
      metadata: {
        style: newProjectData.style,
        scale: 1,
        units: 'metric',
        tags: newProjectData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
      }
    };

    onProjectLoad(newProject);
    setIsNewProjectOpen(false);
    setNewProjectData({ name: '', description: '', style: '', tags: '' });
  };

  const handleSaveToNostr = async () => {
    if (!user) return;

    try {
      await saveToNostr(project);
      setSuccessMessage('Project saved to Nostr successfully!');
      setIsSaveDialogOpen(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      // Error is handled by the hook
      console.error('Save failed:', err);
    }
  };

  const handleDownloadLocal = () => {
    try {
      downloadLocal(project);
      setSuccessMessage('Project downloaded successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      // Error is handled by the hook
      console.error('Download failed:', err);
    }
  };

  const handleLoadFromFile = async () => {
    try {
      const loadedProject = await loadFromFile();
      onProjectLoad(loadedProject);
      setSuccessMessage('Project loaded successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      // Error is handled by the hook
      console.error('Load failed:', err);
    }
  };

  const handleDismissError = () => {
    clearError();
  };

  const handleDeleteFromNostr = async () => {
    if (!user) return;

    try {
      await deleteFromNostr(project);
      setSuccessMessage('Project deleted from Nostr successfully!');
      setIsDeleteDialogOpen(false);
      
      // Create a new blank project after deletion
      const newProject: ArchitecturalProject = {
        id: crypto.randomUUID(),
        name: 'New Architecture Project',
        description: '',
        author: user?.pubkey || 'anonymous',
        created_at: Date.now(),
        updated_at: Date.now(),
        elements: [],
        metadata: {
          style: 'Modern',
          scale: 1,
          units: 'metric',
          tags: []
        }
      };
      
      onProjectLoad(newProject);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      // Error is handled by the hook
      console.error('Delete failed:', err);
    }
  };

  return (
    <Card className="w-80">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Project Manager
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Success Message */}
        {successMessage && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {successMessage}
            </AlertDescription>
          </Alert>
        )}

        {/* Error Message */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismissError}
                className="h-auto p-1"
              >
                ×
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Project Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4" />
            <span className="font-medium">{project.name}</span>
          </div>
          
          {project.description && (
            <p className="text-sm text-muted-foreground">
              {project.description}
            </p>
          )}
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>
              Created {new Date(project.created_at).toLocaleDateString()}
            </span>
          </div>

          {project.metadata.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {project.metadata.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-2">
          <Dialog open={isNewProjectOpen} onOpenChange={setIsNewProjectOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                New
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="project-name">Project Name</Label>
                  <Input
                    id="project-name"
                    value={newProjectData.name}
                    onChange={(e) => setNewProjectData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="My Architecture Project"
                  />
                </div>
                
                <div>
                  <Label htmlFor="project-description">Description</Label>
                  <Textarea
                    id="project-description"
                    value={newProjectData.description}
                    onChange={(e) => setNewProjectData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your architectural project..."
                  />
                </div>
                
                <div>
                  <Label htmlFor="project-style">Architectural Style</Label>
                  <Input
                    id="project-style"
                    value={newProjectData.style}
                    onChange={(e) => setNewProjectData(prev => ({ ...prev, style: e.target.value }))}
                    placeholder="Modern, Classical, Minimalist..."
                  />
                </div>
                
                <div>
                  <Label htmlFor="project-tags">Tags (comma-separated)</Label>
                  <Input
                    id="project-tags"
                    value={newProjectData.tags}
                    onChange={(e) => setNewProjectData(prev => ({ ...prev, tags: e.target.value }))}
                    placeholder="residential, sustainable, urban..."
                  />
                </div>
                
                <Button onClick={handleNewProject} className="w-full">
                  Create Project
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1"
            onClick={handleLoadFromFile}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FolderOpen className="h-4 w-4" />
            )}
            Load
          </Button>
        </div>

        <Separator />

        {/* Save & Storage Actions */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm font-medium">
            <span>Save & Storage</span>
          </div>

          {/* Local Download */}
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full flex items-center gap-2"
            onClick={handleDownloadLocal}
            disabled={isLoading}
          >
            <HardDrive className="h-4 w-4" />
            <span>Download Local JSON</span>
            <Download className="h-3 w-3 ml-auto" />
          </Button>

          {/* Nostr Save */}
          {user ? (
            <>
              <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    size="sm" 
                    className="w-full flex items-center gap-2"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Cloud className="h-4 w-4" />
                    )}
                    <span>Save to Nostr</span>
                    <Save className="h-3 w-3 ml-auto" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Save Project to Nostr</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Alert>
                      <Share2 className="h-4 w-4" />
                      <AlertDescription>
                        This will create/update an addressable event on Nostr, making your project 
                        discoverable and shareable with the community.
                      </AlertDescription>
                    </Alert>
                    
                    <div className="space-y-2">
                      <Label>Project Details</Label>
                      <div className="bg-muted p-3 rounded-lg space-y-1">
                        <p className="font-medium">{project.name}</p>
                        <p className="text-sm text-muted-foreground">{project.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {project.elements.length} elements • {project.metadata.style} style
                        </p>
                        {project.metadata.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {project.metadata.tags.map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <Button 
                      onClick={handleSaveToNostr} 
                      className="w-full"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Publishing...
                        </>
                      ) : (
                        <>
                          <Cloud className="h-4 w-4 mr-2" />
                          Publish to Nostr
                        </>
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Delete from Nostr */}
              {project.author === user.pubkey ? (
                <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="destructive"
                      size="sm" 
                      className="w-full flex items-center gap-2"
                      disabled={isLoading}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Delete from Nostr</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete Project from Nostr</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          This will request deletion of your project from Nostr relays. 
                          Note that some relays may not honor deletion requests, and cached 
                          copies may still exist.
                        </AlertDescription>
                      </Alert>
                      
                      <div className="space-y-2">
                        <Label>Project to Delete</Label>
                        <div className="bg-muted p-3 rounded-lg space-y-1">
                          <p className="font-medium">{project.name}</p>
                          <p className="text-sm text-muted-foreground">{project.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {project.elements.length} elements
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          onClick={() => setIsDeleteDialogOpen(false)}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button 
                          variant="destructive"
                          onClick={handleDeleteFromNostr} 
                          className="flex-1"
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Deleting...
                            </>
                          ) : (
                            <>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Project
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              ) : (
                <div className="p-3 bg-muted rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">
                    You can only delete your own projects
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="p-3 bg-muted rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Login required to save to Nostr
              </p>
              <Button variant="outline" size="sm" className="text-xs">
                Login to Share Projects
              </Button>
            </div>
          )}
        </div>

        <Separator />

        {/* Project Stats */}
        <div className="text-xs text-muted-foreground space-y-1">
          <div className="flex justify-between">
            <span>Elements:</span>
            <span>{project.elements.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Scale:</span>
            <span>1:{project.metadata.scale}</span>
          </div>
          <div className="flex justify-between">
            <span>Units:</span>
            <span className="capitalize">{project.metadata.units}</span>
          </div>
          <div className="flex justify-between">
            <span>Last Updated:</span>
            <span>{new Date(project.updated_at).toLocaleDateString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}