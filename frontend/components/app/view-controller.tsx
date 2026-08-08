'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { AnimatePresence, motion } from 'motion/react';
import { useConnectionState, useParticipants, useSessionContext } from '@livekit/components-react';
import type { AppConfig } from '@/app-config';
import { AgentSessionView_01 } from '@/components/agents-ui/blocks/agent-session-view-01';
import { CallEndedView } from '@/components/app/call-ended-view';
import { WelcomeView } from '@/components/app/welcome-view';

const MotionWelcomeView = motion.create(WelcomeView);
const MotionSessionView = motion.create(AgentSessionView_01);
const MotionCallEndedView = motion.create(CallEndedView);

const VIEW_MOTION_PROPS = {
  variants: {
    visible: {
      opacity: 1,
    },
    hidden: {
      opacity: 0,
    },
  },
  initial: 'hidden',
  animate: 'visible',
  exit: 'hidden',
  transition: {
    duration: 0.5,
    ease: 'linear',
  },
};

interface ViewControllerProps {
  appConfig: AppConfig;
}

export function ViewController({ appConfig }: ViewControllerProps) {
  const { start, end } = useSessionContext();
  const connectionState = useConnectionState();
  const participants = useParticipants();
  const { resolvedTheme } = useTheme();

  const [connectionStage, setConnectionStage] = useState<
    'idle' | 'igniting' | 'connecting' | 'waiting' | 'done'
  >('idle');
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isCallEnded, setIsCallEnded] = useState(false);

  useEffect(() => {
    if (connectionState === 'disconnected' && connectionStage !== 'igniting') {
      setConnectionStage('idle');
      return;
    }

    if (connectionStage === 'igniting' && connectionState === 'connecting') {
      setConnectionStage('connecting');
    }

    if (connectionState === 'connected') {
      const hasAgent = participants.some((p) => !p.isLocal);
      if (hasAgent) {
        setConnectionStage('done');
      } else {
        setConnectionStage('waiting');
      }
    }
  }, [connectionState, participants, connectionStage]);

  useEffect(() => {
    if (connectionStage === 'done') {
      const timer = setTimeout(() => {
        setIsSessionActive(true);
        setIsCallEnded(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [connectionStage]);

  useEffect(() => {
    if (connectionState === 'disconnected' && isSessionActive) {
      setIsSessionActive(false);
      setIsCallEnded(true);
      setConnectionStage('idle');
    }
  }, [connectionState, isSessionActive]);

  const handleStartCall = async () => {
    try {
      setConnectionStage('igniting');
      await start();
    } catch (err: unknown) {
      setConnectionStage('idle');
      try {
        await end();
      } catch (disconnectErr) {
        console.error('Failed to disconnect after error:', disconnectErr);
      }
      throw err;
    }
  };

  const handleRestart = () => {
    setIsCallEnded(false);
  };

  return (
    <AnimatePresence mode="wait">
      {/* Welcome view */}
      {!isSessionActive && !isCallEnded && (
        <MotionWelcomeView
          key="welcome"
          {...VIEW_MOTION_PROPS}
          startButtonText={appConfig.startButtonText}
          onStartCall={handleStartCall}
          connectionStage={connectionStage}
        />
      )}
      {/* Call ended view */}
      {!isSessionActive && isCallEnded && (
        <MotionCallEndedView key="call-ended" {...VIEW_MOTION_PROPS} onRestart={handleRestart} />
      )}
      {/* Session view */}
      {isSessionActive && isConnected && (
        <MotionSessionView
          key="session-view"
          {...VIEW_MOTION_PROPS}
          supportsChatInput={appConfig.supportsChatInput}
          supportsVideoInput={appConfig.supportsVideoInput}
          supportsScreenShare={appConfig.supportsScreenShare}
          isPreConnectBufferEnabled={appConfig.isPreConnectBufferEnabled}
          audioVisualizerType={appConfig.audioVisualizerType}
          audioVisualizerColor={
            resolvedTheme === 'dark'
              ? appConfig.audioVisualizerColorDark
              : appConfig.audioVisualizerColor
          }
          audioVisualizerColorShift={appConfig.audioVisualizerColorShift}
          audioVisualizerBarCount={appConfig.audioVisualizerBarCount}
          audioVisualizerGridRowCount={appConfig.audioVisualizerGridRowCount}
          audioVisualizerGridColumnCount={appConfig.audioVisualizerGridColumnCount}
          audioVisualizerRadialBarCount={appConfig.audioVisualizerRadialBarCount}
          audioVisualizerRadialRadius={appConfig.audioVisualizerRadialRadius}
          audioVisualizerWaveLineWidth={appConfig.audioVisualizerWaveLineWidth}
          className="fixed inset-0"
        />
      )}
    </AnimatePresence>
  );
}
