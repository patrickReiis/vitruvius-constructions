import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  AlertTriangle, 
  Clock, 
  Save, 
  X 
} from 'lucide-react';
import { 
  hasWorkingProject, 
  getWorkingProjectLastModified, 
  clearWorkingProject 
} from '@/hooks/useProjectManager';
import { useCurrentUser } from '@/hooks/useCurrentUser';

interface WorkingStateIndicatorProps {
  onSaveRequested?: () => void;
  onDiscardRequested?: () => void;
  className?: string;
}

export function WorkingStateIndicator({ 
  onSaveRequested, 
  onDiscardRequested,
  className = ""
}: WorkingStateIndicatorProps) {
  const [hasUnsaved, setHasUnsaved] = useState(false);
  const [lastModified, setLastModified] = useState<Date | null>(null);
  const { user } = useCurrentUser();

  // Check for working state on mount and periodically
  useEffect(() => {
    const checkWorkingState = () => {
      const hasWorking = hasWorkingProject();
      setHasUnsaved(hasWorking);
      
      if (hasWorking) {
        const timestamp = getWorkingProjectLastModified();
        setLastModified(timestamp ? new Date(timestamp) : null);
      } else {
        setLastModified(null);
      }
    };

    // Check immediately
    checkWorkingState();

    // Check periodically to stay in sync
    const interval = setInterval(checkWorkingState, 1000);

    return () => clearInterval(interval);
  }, []);

  // Handle discard changes
  const handleDiscard = () => {
    if (confirm('Are you sure you want to discard all unsaved changes? This action cannot be undone.')) {
      clearWorkingProject();
      setHasUnsaved(false);
      setLastModified(null);
      onDiscardRequested?.();
    }
  };

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

  if (!hasUnsaved) return null;

  return (
    <Card className={`bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800 ${className}`}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <span className="text-amber-800 dark:text-amber-200 font-medium">
              Unsaved Changes
            </span>
            
            {lastModified && (
              <>
                <Separator orientation="vertical" className="h-4" />
                <div className="flex items-center gap-1 text-amber-700 dark:text-amber-300">
                  <Clock className="h-3 w-3" />
                  <span className="text-xs">
                    {formatRelativeTime(lastModified)}
                  </span>
                </div>
              </>
            )}

            <Badge 
              variant="secondary" 
              className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 text-xs"
            >
              Auto-saved
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            {user && onSaveRequested && (
              <Button 
                size="sm" 
                variant="default"
                onClick={onSaveRequested}
                className="h-7 px-3 text-xs bg-amber-600 hover:bg-amber-700 text-white"
              >
                <Save className="h-3 w-3 mr-1" />
                Save
              </Button>
            )}
            
            <Button 
              size="sm" 
              variant="ghost"
              onClick={handleDiscard}
              className="h-7 px-2 text-xs text-amber-700 hover:text-amber-900 dark:text-amber-300 dark:hover:text-amber-100"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        <p className="text-xs text-amber-700 dark:text-amber-300 mt-2">
          Your changes are temporarily saved and will persist when navigating between pages.
        </p>
      </CardContent>
    </Card>
  );
}