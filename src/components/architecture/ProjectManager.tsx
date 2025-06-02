import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Save, 
  FolderOpen, 
  Share2, 
  Download, 
  Upload,
  FileText,
  Calendar,
  User,
  Tag
} from 'lucide-react';
import { ArchitecturalProject } from '@/types/architecture';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';

interface ProjectManagerProps {
  project: ArchitecturalProject;
  onProjectUpdate: (updates: Partial<ArchitecturalProject>) => void;
  onProjectSave: () => void;
  onProjectLoad: (project: ArchitecturalProject) => void;
  onProjectExport: () => void;
}

export function ProjectManager({ 
  project, 
  onProjectUpdate, 
  onProjectSave,
  onProjectLoad,
  onProjectExport
}: ProjectManagerProps) {
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [newProjectData, setNewProjectData] = useState({
    name: '',
    description: '',
    style: '',
    tags: ''
  });

  const { user } = useCurrentUser();
  const { mutate: publishProject } = useNostrPublish();

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

  const handleSaveToNostr = () => {
    if (!user) return;

    const projectData = {
      ...project,
      updated_at: Date.now()
    };

    publishProject({
      kind: 30023, // Long-form content (NIP-23) for architectural projects
      content: JSON.stringify(projectData),
      tags: [
        ['d', project.id], // Replaceable event identifier
        ['title', project.name],
        ['summary', project.description],
        ['t', 'architecture'],
        ['t', '3d-design'],
        ...project.metadata.tags.map(tag => ['t', tag])
      ]
    });

    setIsSaveDialogOpen(false);
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const projectData = JSON.parse(e.target?.result as string);
        onProjectLoad(projectData);
      } catch (error) {
        console.error('Failed to import project:', error);
      }
    };
    reader.readAsText(file);
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

        {/* Project Actions */}
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

          <div>
            <input
              type="file"
              accept=".json"
              onChange={handleFileImport}
              className="hidden"
              id="file-import"
            />
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-1 w-full"
              onClick={() => document.getElementById('file-import')?.click()}
            >
              <FolderOpen className="h-4 w-4" />
              Load
            </Button>
          </div>

          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1"
            onClick={onProjectSave}
          >
            <Save className="h-4 w-4" />
            Save
          </Button>

          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1"
            onClick={onProjectExport}
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>

        {user && (
          <>
            <Separator />
            
            <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="w-full flex items-center gap-1">
                  <Share2 className="h-4 w-4" />
                  Share on Nostr
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Share Project on Nostr</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    This will publish your architectural project to the Nostr network, 
                    making it discoverable by other architects and designers.
                  </p>
                  
                  <div className="space-y-2">
                    <Label>Project Details</Label>
                    <div className="bg-muted p-3 rounded-lg space-y-1">
                      <p className="font-medium">{project.name}</p>
                      <p className="text-sm text-muted-foreground">{project.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {project.elements.length} elements
                      </p>
                    </div>
                  </div>
                  
                  <Button onClick={handleSaveToNostr} className="w-full">
                    Publish to Nostr
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </>
        )}

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
        </div>
      </CardContent>
    </Card>
  );
}