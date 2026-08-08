'use client';

import React, { useState } from 'react';
import { Clock, Globe, Mic, Palette, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WelcomeViewProps {
  startButtonText: string;
  onStartCall: () => Promise<void>;
  onDisconnect: () => Promise<void>;
}

export const WelcomeView = ({
  startButtonText,
  onStartCall,
  onDisconnect,
  ref,
}: React.ComponentProps<'div'> & WelcomeViewProps) => {
  const categories = [
    {
      icon: <Rocket className="text-primary size-5" />,
      title: 'Science & Space',
      desc: 'Explore the cosmos and modern technology.',
    },
    {
      icon: <Clock className="text-primary size-5" />,
      title: 'History & Epochs',
      desc: 'Discover events and figures of the past.',
    },
    {
      icon: <Globe className="text-primary size-5" />,
      title: 'Geography & Earth',
      desc: 'Navigate world regions and physical systems.',
    },
    {
      icon: <Palette className="text-primary size-5" />,
      title: 'Arts & Literature',
      desc: 'Appreciate global culture and masterpieces.',
    },
  ];

  const [isConnecting, setIsConnecting] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);

  const handleStartCall = async () => {
    setMicError(null);
    setIsConnecting(true);
    try {
      await onStartCall();
    } catch (err: unknown) {
      setIsConnecting(false);
      console.error('Failed to start call:', err);
      try {
        await onDisconnect();
      } catch (disconnectErr) {
        console.error('Failed to disconnect after error:', disconnectErr);
      }

      const errMsg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
      if (
        errMsg.includes('permission') ||
        errMsg.includes('denied') ||
        errMsg.includes('getusermedia') ||
        errMsg.includes('notallowed')
      ) {
        setMicError(
          'Microphone permission blocked! Please click the microphone/lock icon in your browser address bar and set permissions to "Allow".'
        );
      } else {
        setMicError(
          'Could not access your microphone. Please make sure your mic is plugged in and enabled in system settings.'
        );
      }
    }
  };

  return (
    <div
      ref={ref}
      className="bg-background flex min-h-svh w-full items-center justify-center px-6 pt-24 pb-12 md:px-16 lg:px-24"
    >
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-stretch gap-16 lg:grid-cols-[1.2fr_0.8fr]">
        {/* Left Column: Spacious Editorial Headline & Category Cards */}
        <div className="flex flex-col justify-center text-left">
          {/* Bold attractive branding sub-header */}
          <div className="mb-2 flex items-center gap-4">
            <span className="dark:text-primary font-sans text-xl font-black tracking-[0.2em] text-[#E0533C] uppercase sm:text-2xl">
              BEACON
            </span>
            <div className="dark:bg-primary h-0.5 w-12 rounded-full bg-[#E0533C] opacity-60" />
          </div>

          {/* Main Serif Headline */}
          <h1 className="text-foreground mt-6 font-serif text-4xl leading-[1.15] font-bold tracking-tight sm:text-5xl md:text-6xl">
            <span className="text-primary font-serif font-normal italic">Guide</span> your curiosity{' '}
            <br />
            through the <span className="text-primary font-serif font-normal italic">
              wonders
            </span>{' '}
            of our world.
          </h1>

          {/* Detailed Paragraph */}
          <p className="text-muted-foreground mt-6 max-w-lg text-base leading-relaxed sm:text-lg">
            Beacon AI is an intelligent voice tutor designed to make learning more accessible
            through natural, real-time conversations. Speak to ask questions, explore history,
            science, geography, and culture with friendly, down-to-earth explanations.
          </p>

          {/* Clean Four-Category Grid */}
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {categories.map((cat, i) => (
              <div
                key={i}
                className="border-border/40 bg-card/50 hover:border-primary/40 hover:bg-card group flex flex-col items-start rounded-2xl border p-5 transition-all duration-200 select-none hover:scale-[1.02]"
              >
                <div className="border-border/30 bg-background group-hover:border-primary/20 flex items-center justify-center rounded-xl border p-2 transition-colors">
                  {cat.icon}
                </div>
                <h3 className="text-foreground mt-4 text-sm font-bold">{cat.title}</h3>
                <p className="text-muted-foreground mt-2 text-xs leading-relaxed">{cat.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Original Lighthouse Beacon Visualizer Card */}
        <div className="flex items-center justify-center">
          <div className="border-foreground bg-card relative flex w-full max-w-sm flex-col items-center justify-center overflow-hidden rounded-[24px] border-2 p-8 pt-12 pb-12 shadow-[6px_6px_0px_var(--foreground)] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_var(--foreground)]">
            {/* Lighthouse Tower Tower Line & Light Beam */}
            <div className="absolute inset-x-0 top-10 flex flex-col items-center">
              {/* Thin Vertical Tower Stem */}
              <div className="dark:from-primary via-foreground/20 h-[140px] w-0.5 bg-linear-to-b from-amber-400 to-transparent" />

              {/* Glowing Amber Beacon Orb */}
              <div className="dark:bg-primary absolute top-0 z-20 flex size-8 animate-pulse items-center justify-center rounded-full bg-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.6)]">
                <div className="size-3 rounded-full bg-white" />
              </div>

              {/* Sweeping Light Beam Overlay */}
              <div
                className="animate-sweep pointer-events-none absolute top-4 z-10 h-[50px] w-[280px] origin-left bg-gradient-to-r from-amber-400/20 via-amber-300/5 to-transparent"
                style={{ left: '50%' }}
              />
            </div>

            {/* Central Controls & Connect Action */}
            <div className="z-30 mt-[180px] flex w-full flex-col items-center gap-6">
              <div className="flex flex-col items-center text-center">
                {isConnecting ? (
                  <>
                    <span className="text-primary animate-pulse text-xs font-black tracking-wider uppercase">
                      Connecting
                    </span>
                    <span className="text-muted-foreground mt-1 text-[10px]">
                      Please wait while we connect to Beacon...
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-foreground text-xs font-bold tracking-wider uppercase">
                      Connection Terminal
                    </span>
                    <span className="text-muted-foreground mt-1 text-[10px]">
                      Click below to open the audio portal
                    </span>
                  </>
                )}
              </div>

              {micError && (
                <div className="border-destructive/30 bg-destructive/10 text-destructive animate-in fade-in slide-in-from-bottom-2 max-w-xs rounded-xl border p-4 text-center text-xs leading-relaxed duration-200">
                  <p className="mb-1 text-[10px] font-bold tracking-wider uppercase">
                    Permission Error
                  </p>
                  <p>{micError}</p>
                </div>
              )}

              <Button
                size="lg"
                onClick={handleStartCall}
                disabled={isConnecting}
                className="border-foreground bg-primary text-primary-foreground flex w-52 cursor-pointer items-center justify-center gap-2.5 rounded-xl border-2 px-6 py-6 text-xs font-bold tracking-widest uppercase shadow-[4px_4px_0px_var(--foreground)] transition-all duration-150 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_var(--foreground)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-75"
              >
                {isConnecting ? (
                  <span className="flex items-center gap-2">
                    <span className="border-primary-foreground size-3 animate-spin rounded-full border-2 border-t-transparent" />
                    Connecting...
                  </span>
                ) : (
                  <>
                    <Mic className="size-4" />
                    <span>{startButtonText}</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
WelcomeView.displayName = 'WelcomeView';
