'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, type MotionProps, motion } from 'motion/react';
import { useAgent, useSessionContext, useSessionMessages } from '@livekit/components-react';
import { AgentChatTranscript } from '@/components/agents-ui/agent-chat-transcript';
import {
  AgentControlBar,
  type AgentControlBarControls,
} from '@/components/agents-ui/agent-control-bar';
import { Shimmer } from '@/components/ai-elements/shimmer';
import { cn } from '@/lib/shadcn/utils';
import { TileLayout } from './tile-view';

const MotionMessage = motion.create(Shimmer);

const BOTTOM_VIEW_MOTION_PROPS: MotionProps = {
  variants: {
    visible: {
      opacity: 1,
      translateY: '0%',
    },
    hidden: {
      opacity: 0,
      translateY: '100%',
    },
  },
  initial: 'hidden',
  animate: 'visible',
  exit: 'hidden',
  transition: {
    duration: 0.3,
    delay: 0.5,
    ease: 'easeOut',
  },
};

const CHAT_MOTION_PROPS: MotionProps = {
  variants: {
    hidden: {
      opacity: 0,
      transition: {
        ease: 'easeOut',
        duration: 0.3,
      },
    },
    visible: {
      opacity: 1,
      transition: {
        delay: 0.2,
        ease: 'easeOut',
        duration: 0.3,
      },
    },
  },
  initial: 'hidden',
  animate: 'visible',
  exit: 'hidden',
};

const SHIMMER_MOTION_PROPS: MotionProps = {
  variants: {
    visible: {
      opacity: 1,
      transition: {
        ease: 'easeIn',
        duration: 0.5,
        delay: 0.8,
      },
    },
    hidden: {
      opacity: 0,
      transition: {
        ease: 'easeIn',
        duration: 0.5,
        delay: 0,
      },
    },
  },
  initial: 'hidden',
  animate: 'visible',
  exit: 'hidden',
};

interface FadeProps {
  top?: boolean;
  bottom?: boolean;
  className?: string;
}

export function Fade({ top = false, bottom = false, className }: FadeProps) {
  return (
    <div
      className={cn(
        'from-background pointer-events-none h-4 bg-linear-to-b to-transparent',
        top && 'bg-linear-to-b',
        bottom && 'bg-linear-to-t',
        className
      )}
    />
  );
}

export interface AgentSessionView_01Props {
  /**
   * Message shown above the controls before the first chat message is sent.
   *
   * @default 'Agent is speaking'
   */
  preConnectMessage?: string;
  /**
   * Enables or disables the chat toggle and transcript input controls.
   *
   * @default true
   */
  supportsChatInput?: boolean;
  /**
   * Enables or disables camera controls in the bottom control bar.
   *
   * @default true
   */
  supportsVideoInput?: boolean;
  /**
   * Enables or disables screen sharing controls in the bottom control bar.
   *
   * @default true
   */
  supportsScreenShare?: boolean;
  /**
   * Shows a pre-connect buffer state with a shimmer message before messages appear.
   *
   * @default true
   */
  isPreConnectBufferEnabled?: boolean;

  /** Selects the visualizer style rendered in the main tile area. */
  audioVisualizerType?: 'bar' | 'wave' | 'grid' | 'radial' | 'aura';
  /** Primary hex color used by supported audio visualizer variants. */
  audioVisualizerColor?: `#${string}`;
  /** Hue shift intensity used by certain visualizers. */
  audioVisualizerColorShift?: number;
  /** Number of bars to render when `audioVisualizerType` is `bar`. */
  audioVisualizerBarCount?: number;
  /** Number of rows in the visualizer when `audioVisualizerType` is `grid`. */
  audioVisualizerGridRowCount?: number;
  /** Number of columns in the visualizer when `audioVisualizerType` is `grid`. */
  audioVisualizerGridColumnCount?: number;
  /** Number of radial bars when `audioVisualizerType` is `radial`. */
  audioVisualizerRadialBarCount?: number;
  /** Base radius of the radial visualizer when `audioVisualizerType` is `radial`. */
  audioVisualizerRadialRadius?: number;
  /** Stroke width of the wave path when `audioVisualizerType` is `wave`. */
  audioVisualizerWaveLineWidth?: number;
  /** Optional class name merged onto the outer `<section>` container. */
  className?: string;
}

export function AgentSessionView_01({
  preConnectMessage = 'Agent is speaking',
  supportsChatInput = true,
  supportsVideoInput = true,
  supportsScreenShare = true,
  isPreConnectBufferEnabled = true,

  audioVisualizerType,
  audioVisualizerColor,
  audioVisualizerColorShift,
  audioVisualizerBarCount,
  audioVisualizerGridRowCount,
  audioVisualizerGridColumnCount,
  audioVisualizerRadialBarCount,
  audioVisualizerRadialRadius,
  audioVisualizerWaveLineWidth,
  ref,
  className,
  ...props
}: React.ComponentProps<'section'> & AgentSessionView_01Props) {
  const session = useSessionContext();
  const { messages } = useSessionMessages(session);
  const [chatOpen, setChatOpen] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { state: agentState } = useAgent();

  const controls: AgentControlBarControls = {
    leave: true,
    microphone: true,
    chat: supportsChatInput,
    camera: supportsVideoInput,
    screenShare: supportsScreenShare,
  };

  useEffect(() => {
    const lastMessage = messages.at(-1);
    const lastMessageIsLocal = lastMessage?.from?.isLocal === true;

    if (scrollAreaRef.current && lastMessageIsLocal) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <section
      ref={ref}
      className={cn('bg-background beacon-bg relative z-10 h-full w-full overflow-hidden flex flex-col', className)}
      {...props}
    >
      {/* Top Header */}
      <header className="border-border/10 bg-background/50 flex h-16 w-full shrink-0 items-center justify-between border-b px-6 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="font-sans text-sm font-black tracking-widest text-primary uppercase">
            BEACON CONSOLE
          </span>
          <span className="bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-[10px] font-bold">
            Live Telephony & AI
          </span>
        </div>
        <div className="flex items-center gap-4">
          <a 
            href="/tickets" 
            className="border-border/10 bg-card/40 hover:bg-card/75 text-foreground flex items-center gap-2 rounded-full border px-4 py-1 text-xs font-bold tracking-wider uppercase transition-colors"
          >
            <span>Help Desk</span>
          </a>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
            <span className="size-2 animate-pulse rounded-full bg-emerald-500" />
            Livekit Cloud: Connected
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* LEFT PANEL: Session Insights (hidden on mobile, visible on desktop) */}
        <aside className="border-border/10 bg-card/10 w-80 border-r p-6 hidden xl:flex flex-col justify-between backdrop-blur-xs select-none">
          <div className="space-y-6">
            <div>
              <h3 className="text-foreground text-xs font-bold tracking-wider uppercase mb-3">
                System Architecture
              </h3>
              <div className="space-y-3">
                <div className="bg-card/40 border-border/20 rounded-xl border p-3">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase">
                    TTS Voice Engine
                  </p>
                  <p className="text-foreground text-xs font-semibold mt-1">Murf Falcon (Anisha)</p>
                </div>
                <div className="bg-card/40 border-border/20 rounded-xl border p-3">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase">LLM Brain</p>
                  <p className="text-foreground text-xs font-semibold mt-1">
                    Gemini 3.5 Flash-lite
                  </p>
                </div>
                <div className="bg-card/40 border-border/20 rounded-xl border p-3">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase">STT Ears</p>
                  <p className="text-foreground text-xs font-semibold mt-1">
                    Deepgram Nova-3 (Multilingual)
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-foreground text-xs font-bold tracking-wider uppercase mb-3">
                Suggested Prompts
              </h3>
              <div className="space-y-2 text-xs text-muted-foreground leading-relaxed">
                <p className="bg-card/30 border border-border/10 hover:border-primary/20 rounded-lg p-2.5 transition-colors cursor-pointer">
                  "बीकन, आज के मुख्य समाचार क्या हैं?"
                </p>
                <p className="bg-card/30 border border-border/10 hover:border-primary/20 rounded-lg p-2.5 transition-colors cursor-pointer">
                  "Tell me a story about space."
                </p>
                <p className="bg-card/30 border border-border/10 hover:border-primary/20 rounded-lg p-2.5 transition-colors cursor-pointer">
                  "My name is Ramesh. Can you remember me?"
                </p>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-muted-foreground/60 leading-relaxed">
            Beacon reads RSS news and saves profile progress in SQLite.
          </div>
        </aside>

        {/* CENTER PANEL: Visualizer (always visible) */}
        <div className="relative flex flex-1 flex-col items-center justify-center p-4">
          {/* Ambient background glow pulsing when speaking */}
          <div
            className={cn(
              'absolute size-[350px] rounded-full blur-[100px] opacity-20 transition-all duration-1000 pointer-events-none',
              agentState === 'speaking' ? 'bg-primary scale-110 animate-pulse' : 'bg-emerald-500 scale-95'
            )}
          />

          {/* Audio Visualizer container */}
          <div className="relative flex items-center justify-center w-full max-w-lg aspect-square">
            <TileLayout
              chatOpen={false}
              audioVisualizerType={audioVisualizerType}
              audioVisualizerColor={audioVisualizerColor}
              audioVisualizerColorShift={audioVisualizerColorShift}
              audioVisualizerBarCount={audioVisualizerBarCount}
              audioVisualizerRadialBarCount={audioVisualizerRadialBarCount}
              audioVisualizerRadialRadius={audioVisualizerRadialRadius}
              audioVisualizerGridRowCount={audioVisualizerGridRowCount}
              audioVisualizerGridColumnCount={audioVisualizerGridColumnCount}
              audioVisualizerWaveLineWidth={audioVisualizerWaveLineWidth}
            />
          </div>

          {/* Status Indicators */}
          <div className="z-10 mt-6 flex flex-col items-center gap-3">
            <div
              className={cn(
                'border-foreground flex items-center gap-2 rounded-full border px-5 py-2 text-xs font-bold tracking-widest uppercase shadow-[3px_3px_0px_var(--foreground)] transition-all duration-300',
                agentState === 'speaking'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-foreground'
              )}
            >
              <div
                className={cn(
                  'size-2 rounded-full',
                  agentState === 'speaking' ? 'animate-pulse bg-white' : 'animate-ping bg-emerald-500'
                )}
              />
              <span>{agentState === 'speaking' ? 'Beacon is speaking' : 'Listening to you'}</span>
            </div>

            {isPreConnectBufferEnabled && messages.length === 0 && (
              <p className="text-muted-foreground animate-pulse text-xs font-semibold">
                {preConnectMessage}
              </p>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Live Transcript (always visible on desktop, toggle on mobile) */}
        <aside
          className={cn(
            'border-border/10 bg-card/10 w-96 border-l flex flex-col transition-all duration-300 backdrop-blur-xs',
            'hidden md:flex'
          )}
        >
          <div className="border-border/10 flex h-14 items-center justify-between border-b px-6 shrink-0">
            <span className="text-foreground text-xs font-bold tracking-wider uppercase">
              Live Transcript
            </span>
            <span className="bg-foreground/5 text-muted-foreground rounded-full px-2.5 py-0.5 text-[10px] font-bold">
              {messages.length} Messages
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <AgentChatTranscript
              agentState={agentState}
              messages={messages}
              className="w-full h-full [&_.is-user>div]:rounded-[22px] [&>div>div]:px-2 [&>div>div]:pt-4"
            />
          </div>
        </aside>
      </div>

      {/* Control Bar at Bottom */}
      <footer className="border-border/10 bg-background/85 flex h-24 w-full shrink-0 items-center justify-center border-t px-6 backdrop-blur-md">
        <div className="w-full max-w-2xl">
          <AgentControlBar
            variant="livekit"
            controls={controls}
            isChatOpen={chatOpen}
            isConnected={session.isConnected}
            onDisconnect={session.end}
            onIsChatOpenChange={setChatOpen}
          />
        </div>
      </footer>
    </section>
  );
}
