import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/useToast';
import { Copy, Check } from 'lucide-react';

interface EventIdButtonProps {
  eventId: string | undefined;
}

export function EventIdButton({ eventId }: EventIdButtonProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const copyEventId = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!eventId) return;

    try {
      await navigator.clipboard.writeText(eventId);
      setCopied(true);
      toast({
        title: "Event ID Copied",
        description: "Nostr event ID copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy event ID to clipboard",
        variant: "destructive",
      });
    }
  };

  if (!eventId) return null;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={copyEventId}
      className="h-6 px-2 text-xs"
    >
      {copied ? (
        <Check className="h-3 w-3 mr-1" />
      ) : (
        <Copy className="h-3 w-3 mr-1" />
      )}
      {copied ? "Copied" : "Event ID"}
    </Button>
  );
}