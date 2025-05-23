import React from 'react';
import { MessageReaction, ReactionType } from '@/types/conversation';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MessageReactionsProps {
  reactions: MessageReaction[];
  onAddReaction: (type: ReactionType) => void;
  onRemoveReaction: (type: ReactionType) => void;
  currentUserId: string;
  className?: string;
}

const AVAILABLE_REACTIONS: ReactionType[] = ['👍', '❤️', '😂', '😮', '😢', '😡'];

export function MessageReactions({
  reactions,
  onAddReaction,
  onRemoveReaction,
  currentUserId,
  className
}: MessageReactionsProps) {
  const reactionCounts = reactions.reduce((acc, reaction) => {
    acc[reaction.type] = (acc[reaction.type] || 0) + 1;
    return acc;
  }, {} as Record<ReactionType, number>);

  const userReactions = reactions
    .filter(r => r.user_id === currentUserId)
    .map(r => r.type);

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {Object.entries(reactionCounts).map(([type, count]) => (
        <Button
          key={type}
          variant="ghost"
          size="sm"
          className={cn(
            "h-6 px-2 text-xs hover:bg-muted",
            userReactions.includes(type as ReactionType) && "bg-muted"
          )}
          onClick={() => {
            if (userReactions.includes(type as ReactionType)) {
              onRemoveReaction(type as ReactionType);
            } else {
              onAddReaction(type as ReactionType);
            }
          }}
        >
          <span className="mr-1">{type}</span>
          <span>{count}</span>
        </Button>
      ))}
      
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs hover:bg-muted"
          >
            +
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-2">
          <div className="grid grid-cols-6 gap-1">
            {AVAILABLE_REACTIONS.map(type => (
              <Button
                key={type}
                variant="ghost"
                size="sm"
                className="h-8 hover:bg-muted"
                onClick={() => {
                  if (userReactions.includes(type)) {
                    onRemoveReaction(type);
                  } else {
                    onAddReaction(type);
                  }
                }}
              >
                {type}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
} 