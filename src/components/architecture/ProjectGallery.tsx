import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EventIdButton } from '@/components/ui/event-id-button';
import { useUnsavedChangesContext } from '@/hooks/useUnsavedChangesContext';
import { useUnsavedChangesDialog } from './UnsavedChangesDialog';
import { 
  Search, 
  Calendar, 
  User, 
  Download, 
  Eye,
  Filter,
  Grid3X3,
  Building
} from 'lucide-react';
import { useVitruviusProjects } from '@/hooks/useVitruviusProjects';
import { useAuthor } from '@/hooks/useAuthor';
import { ArchitecturalProject } from '@/types/architecture';

interface ProjectGalleryProps {
  onProjectSelect: (project: ArchitecturalProject) => void;
  onProjectLoad: (project: ArchitecturalProject) => void;
}

function ProjectCard({ 
  project, 
  onSelect, 
  onLoad 
}: { 
  project: ArchitecturalProject; 
  onSelect: () => void;
  onLoad: () => void;
}) {
  const author = useAuthor(project.author);
  const authorName = author.data?.metadata?.name || 
                    author.data?.metadata?.display_name || 
                    project.author.slice(0, 8);

  // Get unsaved changes context (available when inside simulator)
  const unsavedChangesContext = useUnsavedChangesContext();
  
  // Set up dialog for load warning
  const { 
    isOpen: isLoadDialogOpen, 
    showDialog: showLoadDialog, 
    handleConfirm: handleLoadConfirm, 
    handleCancel: handleLoadCancel, 
    Dialog: LoadWarningDialog 
  } = useUnsavedChangesDialog();

  const handleLoad = () => {
    const doLoad = () => {
      onLoad();
    };

    // Check for unsaved changes before loading
    unsavedChangesContext.checkUnsavedChangesBeforeAction(doLoad, showLoadDialog);
  };

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <CardTitle className="text-lg line-clamp-1">{project.name}</CardTitle>
              <EventIdButton eventId={project.eventId} />
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-3 w-3" />
              <span>{authorName}</span>
              <Calendar className="h-3 w-3 ml-2" />
              <span>{new Date(project.created_at).toLocaleDateString()}</span>
            </div>
          </div>
          
          {project.metadata.style && (
            <Badge variant="secondary" className="text-xs ml-2">
              {project.metadata.style}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {project.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {project.description}
          </p>
        )}
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Building className="h-3 w-3" />
            <span>{project.elements.length} elements</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Grid3X3 className="h-3 w-3" />
            <span className="capitalize">{project.metadata.units}</span>
          </div>
        </div>
        
        {project.metadata.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {project.metadata.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
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
        
        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
            className="flex-1"
          >
            <Eye className="h-4 w-4 mr-1" />
            Preview
          </Button>
          
          <Button 
            size="sm" 
            onClick={(e) => {
              e.stopPropagation();
              handleLoad();
            }}
            className="flex-1"
          >
            <Download className="h-4 w-4 mr-1" />
            Load
          </Button>
        </div>
      </CardContent>
      
      {/* Load Project Warning Dialog */}
      <LoadWarningDialog 
        isOpen={isLoadDialogOpen}
        onConfirm={handleLoadConfirm}
        onCancel={handleLoadCancel}
        title="Load Project"
        description={`You haven't saved your current work. Loading "${project.name}" will replace your current design. Are you sure you want to continue?`}
        actionText="Load Project"
      />
    </Card>
  );
}

export function ProjectGallery({ onProjectSelect, onProjectLoad }: ProjectGalleryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<string>('');
  
  const { data: projects, isLoading, error } = useVitruviusProjects();

  const filteredProjects = projects?.filter(project => {
    const matchesSearch = !searchTerm || 
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.metadata.tags.some(tag => 
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      );
    
    const matchesStyle = !selectedStyle || 
      project.metadata.style.toLowerCase() === selectedStyle.toLowerCase();
    
    return matchesSearch && matchesStyle;
  }) || [];

  const availableStyles = Array.from(
    new Set(projects?.map(p => p.metadata.style).filter(Boolean) || [])
  );

  if (error) {
    return (
      <Card className="w-full h-96 flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <Building className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Failed to load projects</p>
          <p className="text-sm">Check your connection and try again</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects, tags, or descriptions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <select
            value={selectedStyle}
            onChange={(e) => setSelectedStyle(e.target.value)}
            className="px-3 py-2 border border-input bg-background rounded-md text-sm"
          >
            <option value="">All Styles</option>
            {availableStyles.map(style => (
              <option key={style} value={style}>{style}</option>
            ))}
          </select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchTerm('');
              setSelectedStyle('');
            }}
          >
            <Filter className="h-4 w-4 mr-1" />
            Clear
          </Button>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {isLoading ? 'Loading...' : `${filteredProjects.length} projects found`}
        </span>
      </div>

      {/* Projects Grid */}
      <ScrollArea className="h-[600px]">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="p-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-3" />
                <Skeleton className="h-16 w-full mb-3" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 flex-1" />
                  <Skeleton className="h-8 flex-1" />
                </div>
              </Card>
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          <Card className="h-64 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Building className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No projects found</p>
              <p className="text-sm">Try adjusting your search criteria</p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onSelect={() => onProjectSelect(project)}
                onLoad={() => onProjectLoad(project)}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}