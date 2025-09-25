
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { chatService } from '@/services/chatService';
import { Volume2, VolumeX, Mic, MicOff, PhoneOff } from 'lucide-react';
import { motion } from 'framer-motion';

interface VoiceChatButtonProps {
  channelId: string;
  channelName: string;
}

export const VoiceChatButton: React.FC<VoiceChatButtonProps> = ({ 
  channelId, 
  channelName 
}) => {
  const [isInCall, setIsInCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [participants, setParticipants] = useState<string[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    // Check if there's an active voice session
    checkActiveSession();
  }, [channelId]);

  const checkActiveSession = async () => {
    // In a real implementation, you'd check for active sessions
    try {
      // This would query active voice sessions for this channel
      const activeSessions = []; // Mock data
      if (activeSessions.length > 0) {
        setParticipants(activeSessions);
      }
    } catch (error) {
      console.error('Failed to check active sessions:', error);
    }
  };

  const startVoiceChat = async () => {
    try {
      const newSessionId = await chatService.startVoiceSession(channelId);
      setSessionId(newSessionId);
      setIsInCall(true);
      
      // In a real implementation, you'd initialize Jitsi Meet here
      initializeJitsiMeet(newSessionId);
    } catch (error) {
      console.error('Failed to start voice chat:', error);
    }
  };

  const joinVoiceChat = async () => {
    if (sessionId) {
      try {
        await chatService.joinVoiceSession(sessionId);
        setIsInCall(true);
        initializeJitsiMeet(sessionId);
      } catch (error) {
        console.error('Failed to join voice chat:', error);
      }
    }
  };

  const leaveVoiceChat = async () => {
    if (sessionId) {
      try {
        await chatService.leaveVoiceSession(sessionId);
        setIsInCall(false);
        setSessionId(null);
        cleanupJitsiMeet();
      } catch (error) {
        console.error('Failed to leave voice chat:', error);
      }
    }
  };

  const initializeJitsiMeet = (roomId: string) => {
    // This would initialize Jitsi Meet iframe or API
    console.log('Initializing Jitsi Meet for room:', roomId);
    
    // Example Jitsi Meet initialization
    /*
    const domain = 'meet.jit.si';
    const options = {
      roomName: roomId,
      parentNode: document.querySelector('#jitsi-container'),
      interfaceConfigOverwrite: {
        TOOLBAR_BUTTONS: ['microphone', 'camera', 'hangup'],
      },
      configOverwrite: {
        disableSimulcast: false,
      },
    };
    
    const api = new JitsiMeetExternalAPI(domain, options);
    */
  };

  const cleanupJitsiMeet = () => {
    console.log('Cleaning up Jitsi Meet');
    // This would clean up the Jitsi Meet instance
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    // In real implementation, this would mute/unmute the microphone
  };

  const toggleDeafen = () => {
    setIsDeafened(!isDeafened);
    // In real implementation, this would enable/disable audio output
  };

  if (isInCall) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Volume2 className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium">Connected to {channelName}</span>
          </div>
          <Badge variant="outline" className="text-green-500 border-green-500">
            {participants.length} connected
          </Badge>
        </div>
        
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant={isMuted ? "destructive" : "outline"}
            size="sm"
            onClick={toggleMute}
          >
            {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
          
          <Button
            variant={isDeafened ? "destructive" : "outline"}
            size="sm"
            onClick={toggleDeafen}
          >
            {isDeafened ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
          
          <Button
            variant="destructive"
            size="sm"
            onClick={leaveVoiceChat}
          >
            <PhoneOff className="h-4 w-4" />
          </Button>
        </div>

        {/* Jitsi Meet container would go here */}
        <div id="jitsi-container" className="w-full h-64 bg-muted rounded-lg flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <Volume2 className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">Voice chat active</p>
            <p className="text-xs">Jitsi Meet integration would appear here</p>
          </div>
        </div>
      </motion.div>
    );
  }

  if (participants.length > 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-muted/50 border rounded-lg p-3"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Volume2 className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium">{participants.length} in voice</span>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={joinVoiceChat}
        >
          Join Voice Chat
        </Button>
      </motion.div>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="w-full"
      onClick={startVoiceChat}
    >
      <Volume2 className="h-4 w-4 mr-2" />
      Start Voice Chat
    </Button>
  );
};
