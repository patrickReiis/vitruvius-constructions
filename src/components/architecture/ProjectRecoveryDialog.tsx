import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AlertTriangle,
  Clock,
  Save,
  Trash2,
  ArrowRight
} from 'lucide-react';
import { 
  hasWorkingProject, 
  getWorkingProject,
  getWorkingProjectLastModified,
  clearWorkingProject 
} from '@/hooks/useProjectManager';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { ArchitecturalProject } from '@/types/architecture';

interface ProjectRecoveryDialogProps {
  open: boolean;
  onClose: () => void;
  onLoadWorking: () => void;
  onDiscardWorking: () => void;
  onSaveAndContinue?: () => void;
}

export function ProjectRecoveryDialog({
  open,
  onClose,
  onLoadWorking,
  onDiscardWorking,
  onSaveAndContinue
}: ProjectRecoveryDialogProps) {
  const [workingProject, setWorkingProject] = useState<ArchitecturalProject | null>(null);
  const [lastModified, setLastModified] = useState<Date | null>(null);
  const { user } = useCurrentUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      const project = getWorkingProject();
      const timestamp = getWorkingProjectLastModified();
      setWorkingProject(project);
      setLastModified(timestamp ? new Date(timestamp) : null);
    }
  }, [open]);

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const handleDiscardAndContinue = () => {
    clearWorkingProject();
    onDiscardWorking();
    onClose();
  };

  const handleLoadAndEdit = () => {
    onLoadWorking();
    onClose();
    navigate('/create');
  };

  if (!workingProject) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
            Unsaved Changes Found
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            You have unsaved changes in your architecture project. What would you like to do?
          </p>

          {/* Project Info */}
          <Card className="bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{workingProject.name}</span>
                <Badge variant="secondary" className="text-xs">
                  {workingProject.elements?.length || 0} elements
                </Badge>
              </div>
              
              {lastModified && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Last modified {formatRelativeTime(lastModified)}
                </div>
              )}

              <div className="text-xs text-muted-foreground">
                Project automatically saved to browser memory
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="flex-col space-y-2 sm:space-y-0">
          {/* Primary Actions */}
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <Button 
              onClick={handleLoadAndEdit}
              className="flex-1 gap-2"
            >
              <ArrowRight className="h-4 w-4" />
              Continue Editing
            </Button>
            
            {user && onSaveAndContinue && (
              <Button 
                onClick={onSaveAndContinue}
                variant="secondary"
                className="flex-1 gap-2"
              >
                <Save className="h-4 w-4" />
                Save & Continue
              </Button>
            )}
          </div>

          <Separator />

          {/* Secondary Actions */}
          <div className="flex gap-2 w-full">
            <Button 
              onClick={handleDiscardAndContinue}
              variant="outline"
              size="sm"
              className="flex-1 gap-2 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              Discard Changes
            </Button>
            
            <Button 
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}