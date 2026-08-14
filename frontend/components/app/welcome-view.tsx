'use client';

import React, { useState, useEffect } from 'react';
import { Brain, Database, Globe, Languages, Mic, PhoneCall, AlertTriangle, Activity } from 'lucide-react';
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
  const [micError, setMicError] = useState<string | null>(null);
  const [isSecure, setIsSecure] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const secure =
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.protocol === 'https:';
      setIsSecure(secure);
    }
  }, []);

  const categories = [
    {
      icon: <Languages className="size-5 text-indigo-500 dark:text-indigo-400" />,
      title: 'Multilingual Practice',
      desc: 'Learn & converse naturally in native Hindi (Devanagari), Tamil, or English.',
      color: 'indigo',
    },
    {
      icon: <PhoneCall className="size-5 text-amber-500 dark:text-amber-400" />,
      title: 'Scheduled Outbound Calls',
      desc: 'Receive proactive language practice check-ins via Linphone/SIP at your preferred times.',
      color: 'amber',
    },
    {
      icon: <Database className="size-5 text-emerald-500 dark:text-emerald-400" />,
      title: 'Smart Memory Profiles',
      desc: 'Stores learning levels, topics covered, and recent mistakes in SQLite to personalize check-ins.',
      color: 'emerald',
    },
    {
      icon: <Brain className="size-5 text-rose-500 dark:text-rose-400" />,
      title: 'Live News & Headlines',
      desc: 'Retrieves and reads live general knowledge digests fetched in real-time from BBC News RSS.',
      color: 'rose',
    },
  ];

  const checkMicPermission = async (): Promise<boolean> => {
    try {
      if (navigator.permissions && navigator.permissions.query) {
        const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        if (result.state === 'denied') {
          setMicError(
            'Microphone permission blocked! Please click the microphone/lock icon in your browser address bar and set permissions to "Allow".'
          );
          return false;
        }
      }
    } catch (e) {
      console.warn('Permissions API query failed:', e);
    }
    return true;
  };

  const handleStartCall = async () => {
    setMicError(null);
    const hasPermission = await checkMicPermission();
    if (!hasPermission) return;

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

  const handleRequestPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setMicError(null);
      await handleStartCall();
    } catch (err: unknown) {
      console.error('Permission request rejected:', err);
      setMicError(
        'Microphone permission blocked! Please click the microphone/lock icon in your browser address bar and set permissions to "Allow".'
      );
    }
  };

  return (
    <div
      ref={ref}
      className="bg-transparent flex min-h-svh w-full items-center justify-center px-6 pt-20 pb-16 md:px-12 lg:px-24 relative"
    >
      {/* Welcome page floating header */}
      <header className="absolute top-0 inset-x-0 flex h-16 w-full items-center justify-between px-6 md:px-12 lg:px-24 select-none">
        <div className="flex items-center gap-3">
          <span className="font-sans text-sm font-black tracking-widest text-[#E0533C] dark:text-primary uppercase">
            BEACON
          </span>
        </div>
        <div className="flex items-center gap-3">
          <a 
            href="/analytics" 
            className="border-border/10 bg-card/40 hover:bg-card/75 text-foreground flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold tracking-wider uppercase transition-colors"
          >
            <span>Analytics Dashboard</span>
          </a>
          <a 
            href="/tickets" 
            className="border-border/10 bg-card/40 hover:bg-card/75 text-foreground flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold tracking-wider uppercase transition-colors"
          >
            <span>Help Desk Dashboard</span>
          </a>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-12 text-center animate-in fade-in duration-500">
        {/* Top Header & Branding */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-3">
            <span className="dark:text-primary font-sans text-xs font-black tracking-[0.3em] text-[#E0533C] uppercase">
              BEACON SYSTEM
            </span>
            <div className="h-1.5 w-1.5 rounded-full bg-[#E0533C] dark:bg-primary" />
            <span className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase">
              v2.0 VOICE ASSISTANT
            </span>
          </div>

          <h1 className="text-foreground mt-4 font-serif text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl max-w-3xl">
            Your Proactive <span className="text-primary font-serif font-normal italic">Voice Learning</span> Companion.
          </h1>

          <p className="text-muted-foreground mt-4 max-w-2xl text-sm leading-relaxed sm:text-base">
            Beacon is an interactive voice tutor designed to make language practice and general knowledge access natural. Spark conversation to practice Hindi, Tamil, or English, fetch live news updates, and let Beacon personalize your learning status.
          </p>
        </div>

        {/* Central Glowing Audio Portal Container */}
        <div className="w-full max-w-md">
          <div className="bg-card/30 border-border/10 relative flex w-full flex-col items-center justify-center overflow-hidden rounded-[32px] border p-8 shadow-2xl backdrop-blur-xl">
            
            {/* Ambient Backlight Pulsing */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-40 rounded-full bg-primary/10 blur-3xl pointer-events-none animate-pulse" />

            {/* Glowing Audio Portal Sphere */}
            <div className="relative z-10 flex size-44 items-center justify-center">
              {/* Outer Pulsing Wave Ring */}
              <div className="absolute inset-0 rounded-full border border-primary/20 animate-ping opacity-25" style={{ animationDuration: '3s' }} />
              {/* Second Pulsing Wave Ring */}
              <div className="absolute inset-4 rounded-full border border-primary/35 animate-pulse opacity-40" />
              
              {/* Rotating Gradient Core */}
              <div className="absolute inset-8 rounded-full bg-gradient-to-tr from-primary/20 via-background to-primary/5 p-[1px] animate-spin" style={{ animationDuration: '10s' }} />
              
              {/* Central Core sphere */}
              <div className="absolute inset-10 rounded-full bg-card/85 flex items-center justify-center shadow-inner border border-border/5">
                <Mic className="size-8 text-primary animate-pulse" />
              </div>
            </div>

            {/* Insecure Context Warning Alert */}
            {!isSecure && (
              <div className="z-20 mt-6 border-amber-500/20 bg-amber-500/10 text-amber-500 animate-in fade-in slide-in-from-bottom-2 max-w-xs rounded-xl border p-4 text-left text-xs leading-relaxed duration-200">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold uppercase tracking-wider text-[9px] mb-1">Insecure Context Warning</p>
                    <p>Browser security blocks microphone access over HTTP on local IPs. Please open the website at <strong>http://localhost:3000</strong> to talk to Beacon.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Mic Permission Error Message */}
            {micError && (
              <div className="z-20 mt-6 border-destructive/30 bg-destructive/10 text-destructive animate-in fade-in slide-in-from-bottom-2 max-w-xs rounded-xl border p-4 text-center text-xs leading-relaxed duration-200">
                <p className="mb-1 font-sans text-[10px] font-bold tracking-wider uppercase">
                  Permission Error
                </p>
                <p className="mb-3">{micError}</p>
                <Button
                  size="sm"
                  onClick={handleRequestPermission}
                  className="border-destructive/40 hover:bg-destructive/20 text-destructive h-8 w-full cursor-pointer rounded-lg border bg-transparent text-[10px] font-bold uppercase transition-all duration-150 active:scale-95"
                >
                  Request Microphone Access
                </Button>
              </div>
            )}

            {/* Session Linking States or CTA Button */}
            <div className="z-20 mt-8 flex w-full flex-col items-center gap-4">
              {connectionStage !== 'idle' ? (
                <div className="border-border/15 bg-card/60 animate-in fade-in zoom-in-95 flex w-full max-w-xs flex-col rounded-2xl border p-5 text-left shadow-lg backdrop-blur-sm">
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
                  <div className="bg-muted relative h-2.5 w-full overflow-hidden rounded-full border border-border/10">
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
                <Button
                  size="lg"
                  disabled={!isSecure}
                  onClick={handleStartCall}
                  className={cn(
                    "bg-primary hover:bg-primary/90 text-primary-foreground flex w-60 cursor-pointer items-center justify-center gap-2.5 rounded-2xl px-6 py-6 text-xs font-bold tracking-widest uppercase transition-all duration-300 shadow-xl shadow-primary/20 hover:scale-105 active:scale-95",
                    !isSecure && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <Activity className="size-4 animate-pulse" />
                  <span>{startButtonText}</span>
                </Button>
              )}
            </div>

          </div>
        </div>

        {/* Categories Grid at Bottom */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 w-full">
          {categories.map((cat, i) => (
            <div
              key={i}
              className={cn(
                'border-border/10 bg-card/25 hover:bg-card/45 group flex flex-col items-center rounded-2xl border p-6 transition-all duration-300 select-none hover:scale-[1.03] hover:shadow-lg',
                cat.color === 'indigo' && 'hover:border-indigo-500/20 hover:shadow-indigo-500/5',
                cat.color === 'amber' && 'hover:border-amber-500/20 hover:shadow-amber-500/5',
                cat.color === 'emerald' && 'hover:border-emerald-500/20 hover:shadow-emerald-500/5',
                cat.color === 'rose' && 'hover:border-rose-500/20 hover:shadow-rose-500/5'
              )}
            >
              <div
                className={cn(
                  'flex items-center justify-center rounded-xl border p-2.5 transition-colors duration-300',
                  cat.color === 'indigo' && 'border-indigo-500/20 bg-indigo-500/10 group-hover:bg-indigo-500/20',
                  cat.color === 'amber' && 'border-amber-500/20 bg-amber-500/10 group-hover:bg-amber-500/20',
                  cat.color === 'emerald' && 'border-emerald-500/20 bg-emerald-500/10 group-hover:bg-emerald-500/20',
                  cat.color === 'rose' && 'border-rose-500/20 bg-rose-500/10 group-hover:bg-rose-500/20'
                )}
              >
                {cat.icon}
              </div>
              <h3 className="text-foreground mt-4 text-sm font-bold tracking-wide">{cat.title}</h3>
              <p className="text-muted-foreground mt-2 text-center text-xs leading-relaxed">{cat.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
WelcomeView.displayName = 'WelcomeView';
