'use client';

import React, { useState } from 'react';
import { Clock, Globe, Mic, Palette, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/shadcn/utils';

interface WelcomeViewProps {
  startButtonText: string;
  onStartCall: () => Promise<void>;
  connectionStage: 'idle' | 'igniting' | 'connecting' | 'waiting' | 'done';
}

export const WelcomeView = ({
  startButtonText,
  onStartCall,
  connectionStage,
  ref,
}: React.ComponentProps<'div'> & WelcomeViewProps) => {
  const categories = [
    {
      icon: <Rocket className="size-5 text-indigo-500 dark:text-indigo-400" />,
      title: 'Science & Space',
      desc: 'Explore the cosmos and modern technology.',
      color: 'indigo',
    },
    {
      icon: <Clock className="size-5 text-amber-500 dark:text-amber-400" />,
      title: 'History & Epochs',
      desc: 'Discover events and figures of the past.',
      color: 'amber',
    },
    {
      icon: <Globe className="size-5 text-emerald-500 dark:text-emerald-400" />,
      title: 'Geography & Travel',
      desc: 'Embark on a voyage to discover our planet.',
      color: 'emerald',
    },
    {
      icon: <Palette className="size-5 text-rose-500 dark:text-rose-400" />,
      title: 'Arts & Literature',
      desc: 'Appreciate global culture and masterpieces.',
      color: 'rose',
    },
  ];

  const [micError, setMicError] = useState<string | null>(null);

  const handleStartCall = async () => {
    setMicError(null);
    try {
      await onStartCall();
    } catch (err: unknown) {
      console.error('Failed to start call:', err);

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
        <div className="animate-in fade-in slide-in-from-left-4 flex flex-col justify-center text-left duration-500">
          {/* Contest/Powered By Badge */}
          <div className="border-primary/20 bg-primary/5 text-primary mb-6 flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-bold tracking-wider uppercase select-none">
            <span className="relative flex h-1.5 w-1.5">
              <span className="bg-primary absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"></span>
              <span className="bg-primary relative inline-flex size-1.5 rounded-full"></span>
            </span>
            Powered by Murf Falcon TTS API & LiveKit Agents
          </div>

          {/* Bold attractive branding sub-header */}
          <div className="flex items-center gap-4">
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
                className={cn(
                  'border-border/40 bg-card/50 hover:bg-card/90 group flex flex-col items-start rounded-2xl border p-5 transition-all duration-300 select-none hover:scale-[1.02] hover:shadow-lg',
                  cat.color === 'indigo' && 'hover:border-indigo-500/30 hover:shadow-indigo-500/5',
                  cat.color === 'amber' && 'hover:border-amber-500/30 hover:shadow-amber-500/5',
                  cat.color === 'emerald' &&
                    'hover:border-emerald-500/30 hover:shadow-emerald-500/5',
                  cat.color === 'rose' && 'hover:border-rose-500/30 hover:shadow-rose-500/5'
                )}
              >
                <div
                  className={cn(
                    'flex items-center justify-center rounded-xl border p-2 transition-colors duration-300',
                    cat.color === 'indigo' &&
                      'border-indigo-500/20 bg-indigo-500/10 group-hover:bg-indigo-500/20',
                    cat.color === 'amber' &&
                      'border-amber-500/20 bg-amber-500/10 group-hover:bg-amber-500/20',
                    cat.color === 'emerald' &&
                      'border-emerald-500/20 bg-emerald-500/10 group-hover:bg-emerald-500/20',
                    cat.color === 'rose' &&
                      'border-rose-500/20 bg-rose-500/10 group-hover:bg-rose-500/20'
                  )}
                >
                  {cat.icon}
                </div>
                <h3 className="text-foreground mt-4 text-sm font-bold">{cat.title}</h3>
                <p className="text-muted-foreground mt-2 text-xs leading-relaxed">{cat.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Original Lighthouse Beacon Visualizer Card */}
        <div className="animate-in fade-in slide-in-from-right-4 flex items-center justify-center duration-500">
          <div className="border-foreground bg-card/65 relative flex w-full max-w-sm flex-col items-center justify-center overflow-hidden rounded-[24px] border-2 p-8 pt-12 pb-12 shadow-[6px_6px_0px_var(--foreground)] backdrop-blur-md transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_var(--foreground)]">
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
              {micError && (
                <div className="border-destructive/30 bg-destructive/10 text-destructive animate-in fade-in slide-in-from-bottom-2 max-w-xs rounded-xl border p-4 text-center text-xs leading-relaxed duration-200">
                  <p className="mb-1 text-[10px] font-bold tracking-wider uppercase">
                    Permission Error
                  </p>
                  <p>{micError}</p>
                </div>
              )}

              {connectionStage !== 'idle' ? (
                <div className="border-foreground bg-card/75 animate-in fade-in zoom-in-95 flex w-full max-w-xs flex-col rounded-2xl border-2 p-5 text-left shadow-[4px_4px_0px_var(--foreground)] backdrop-blur-sm">
                  {/* Header */}
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-foreground text-[10px] font-black tracking-widest uppercase">
                      Session Link
                    </span>
                    <span className="text-muted-foreground flex items-center gap-1.5 text-[9px] font-bold uppercase">
                      <span
                        className={cn(
                          'size-1.5 rounded-full',
                          connectionStage === 'done'
                            ? 'animate-pulse bg-emerald-500'
                            : 'bg-primary animate-ping'
                        )}
                      />
                      {connectionStage === 'done' ? 'Done' : 'Linking'}
                    </span>
                  </div>

                  {/* Progress Track */}
                  <div className="border-foreground bg-muted relative h-3.5 w-full overflow-hidden rounded-full border-2">
                    <div
                      className={cn(
                        'h-full transition-all duration-500 ease-out',
                        connectionStage === 'done' ? 'bg-emerald-500' : 'bg-primary'
                      )}
                      style={{
                        width:
                          connectionStage === 'igniting'
                            ? '25%'
                            : connectionStage === 'connecting'
                              ? '50%'
                              : connectionStage === 'waiting'
                                ? '75%'
                                : connectionStage === 'done'
                                  ? '100%'
                                  : '0%',
                      }}
                    />
                  </div>

                  {/* Steps status message */}
                  <div className="mt-3 flex items-start gap-2">
                    <span className="text-foreground/80 mt-0.5 text-[10px] font-bold">
                      {connectionStage === 'igniting' && '1/3'}
                      {connectionStage === 'connecting' && '2/3'}
                      {connectionStage === 'waiting' && '3/3'}
                      {connectionStage === 'done' && '✔'}
                    </span>
                    <p className="text-foreground text-[11px] leading-relaxed font-semibold">
                      {connectionStage === 'igniting' && 'Igniting conversation request...'}
                      {connectionStage === 'connecting' && 'Connecting to secure voice room...'}
                      {connectionStage === 'waiting' && 'Handshaking: Waiting for agent...'}
                      {connectionStage === 'done' && 'Connected! Done.'}
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-col items-center text-center">
                    <span className="text-foreground text-xs font-bold tracking-wider uppercase">
                      Connection Terminal
                    </span>
                    <span className="text-muted-foreground mt-1 text-[10px]">
                      Click below to open the audio portal
                    </span>
                  </div>

                  <Button
                    size="lg"
                    onClick={handleStartCall}
                    className="border-foreground bg-primary text-primary-foreground flex w-52 cursor-pointer items-center justify-center gap-2.5 rounded-xl border-2 px-6 py-6 text-xs font-bold tracking-widest uppercase shadow-[4px_4px_0px_var(--foreground)] transition-all duration-150 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_var(--foreground)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
                  >
                    <Mic className="size-4" />
                    <span>{startButtonText}</span>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
WelcomeView.displayName = 'WelcomeView';
