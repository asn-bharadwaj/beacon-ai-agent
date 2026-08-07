'use client';

import React from 'react';
import { PhoneOff, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CallEndedViewProps {
  onRestart: () => void;
}

export const CallEndedView = ({
  onRestart,
  ref,
}: React.ComponentProps<'div'> & CallEndedViewProps) => {
  return (
    <div
      ref={ref}
      className="bg-background flex min-h-svh w-full items-center justify-center px-6 pt-24 pb-12 md:px-16 lg:px-24"
    >
      <div className="border-foreground bg-card relative flex w-full max-w-md flex-col items-center justify-center overflow-hidden rounded-[24px] border-2 p-8 pt-12 pb-12 shadow-[6px_6px_0px_var(--foreground)] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_var(--foreground)] animate-in fade-in zoom-in-95 duration-200">
        {/* PhoneOff icon container */}
        <div className="border-border/30 bg-destructive/10 text-destructive flex size-16 items-center justify-center rounded-full border p-4 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
          <PhoneOff className="size-8" />
        </div>

        {/* Text Details */}
        <div className="z-30 mt-8 flex w-full flex-col items-center gap-6 text-center">
          <div className="flex flex-col items-center">
            <span className="text-foreground text-lg font-black tracking-wider uppercase">
              Call Ended
            </span>
            <p className="text-muted-foreground mt-3 text-sm max-w-xs leading-relaxed">
              Your conversation with Beacon is complete. Thank you for exploring the world's wonders with us!
            </p>
          </div>

          <Button
            size="lg"
            onClick={onRestart}
            className="border-foreground bg-primary text-primary-foreground flex w-56 cursor-pointer items-center justify-center gap-2.5 rounded-xl border-2 px-6 py-6 text-xs font-bold tracking-widest uppercase shadow-[4px_4px_0px_var(--foreground)] transition-all duration-150 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_var(--foreground)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
          >
            <RotateCcw className="size-4" />
            <span>Ignite Conversation Again</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
CallEndedView.displayName = 'CallEndedView';
