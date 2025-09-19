import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { fixedChatService } from '@/services/fixedChatService';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const ChatSystemTest: React.FC = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [roomName, setRoomName] = useState('Test Chat Room');
  const [tablesStatus, setTablesStatus] = useState<string>('');
  const [roomsCount, setRoomsCount] = useState<number>(0);
  const { toast } = useToast();
  const { user } = useAuth();

  const checkChatTables = async () => {
    setIsChecking(true);
    setTablesStatus('');
    
    try {
      // Check if chat tables exist
      const { data: tables, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .in('table_name', ['chat_rooms', 'chat_participants', 'chat_messages']);

      if (error) {
        setTablesStatus(`❌ Error checking tables: ${error.message}`);
        return;
      }

      const tableNames = tables?.map(t => t.table_name) || [];
      const requiredTables = ['chat_rooms', 'chat_participants', 'chat_messages'];
      const missingTables = requiredTables.filter(table => !tableNames.includes(table));

      if (missingTables.length > 0) {
        setTablesStatus(`❌ Missing tables: ${missingTables.join(', ')}`);
        toast({
          title: 'Chat Tables Missing',
          description: `Missing tables: ${missingTables.join(', ')}. Run the fix_chat_system.sql script.`,
          variant: 'destructive'
        });
      } else {
        setTablesStatus('✅ All chat tables exist');
        
        // Try to get rooms count
        try {
          const rooms = await fixedChatService.getUserRooms();
          setRoomsCount(rooms.length);
          toast({
            title: 'Chat System Status ✅',
            description: `All tables exist. You have ${rooms.length} chat rooms.`
          });
        } catch (roomError) {
          setTablesStatus(`✅ Tables exist, but service error: ${roomError}`);
        }
      }
    } catch (error) {
      console.error('Check error:', error);
      setTablesStatus(`❌ Error: ${error}`);
      toast({
        title: 'Error',
        description: 'Failed to check chat system status',
        variant: 'destructive'
      });
    } finally {
      setIsChecking(false);
    }
  };

  const testCreateRoom = async () => {
    if (!roomName.trim()) return;
    
    setIsCreatingRoom(true);
    try {
      const room = await fixedChatService.createRoom(roomName.trim(), 'Test room for debugging');
      
      toast({
        title: 'Room Created! 🎉',
        description: `Successfully created "${roomName}"`
      });
      
      setRoomName('Test Chat Room');
      // Refresh rooms count
      const rooms = await fixedChatService.getUserRooms();
      setRoomsCount(rooms.length);
      
    } catch (error) {
      console.error('Create room error:', error);
      toast({
        title: 'Failed to Create Room ❌',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    } finally {
      setIsCreatingRoom(false);
    }
  };

  const testSendMessage = async () => {
    try {
      const rooms = await fixedChatService.getUserRooms();
      if (rooms.length === 0) {
        toast({
          title: 'No Rooms Found',
          description: 'Create a room first to test messaging',
          variant: 'destructive'
        });
        return;
      }

      const firstRoom = rooms[0];
      await fixedChatService.sendMessage(firstRoom.id, `Test message sent at ${new Date().toLocaleTimeString()}`);
      
      toast({
        title: 'Message Sent! 💬',
        description: `Sent test message to "${firstRoom.name}"`
      });
      
    } catch (error) {
      console.error('Send message error:', error);
      toast({
        title: 'Failed to Send Message ❌',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    if (user) {
      checkChatTables();
    }
  }, [user]);

  if (!user) {
    return (
      <Card className="p-6 m-4">
        <h2 className="text-xl font-bold mb-4">💬 Chat System Test</h2>
        <p className="text-muted-foreground">Please log in to test the chat system.</p>
      </Card>
    );
  }

  return (
    <Card className="p-6 m-4 max-w-lg">
      <h2 className="text-xl font-bold mb-4">💬 Chat System Test</h2>
      
      <div className="space-y-6">
        {/* Step 1: Check Tables */}
        <div>
          <h3 className="font-semibold mb-2">Step 1: Check Chat Tables</h3>
          <Button 
            onClick={checkChatTables}
            disabled={isChecking}
            variant="outline"
            className="w-full mb-2"
          >
            {isChecking ? 'Checking...' : 'Check Chat Tables'}
          </Button>
          {tablesStatus && (
            <p className="text-sm p-2 bg-muted rounded">{tablesStatus}</p>
          )}
          {roomsCount > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              Current rooms: {roomsCount}
            </p>
          )}
        </div>
        
        {/* Step 2: Test Room Creation */}
        <div>
          <h3 className="font-semibold mb-2">Step 2: Test Room Creation</h3>
          <div className="space-y-2">
            <Input
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Enter room name..."
              disabled={isCreatingRoom}
            />
            <Button 
              onClick={testCreateRoom}
              disabled={isCreatingRoom || !roomName.trim()}
              className="w-full"
            >
              {isCreatingRoom ? 'Creating...' : 'Create Test Room'}
            </Button>
          </div>
        </div>
        
        {/* Step 3: Test Messaging */}
        <div>
          <h3 className="font-semibold mb-2">Step 3: Test Messaging</h3>
          <Button 
            onClick={testSendMessage}
            variant="outline"
            className="w-full"
          >
            Send Test Message
          </Button>
        </div>
        
        {/* Instructions */}
        <div className="text-xs text-muted-foreground bg-blue-50 p-3 rounded">
          <p><strong>Setup Instructions:</strong></p>
          <ol className="list-decimal list-inside space-y-1 mt-2">
            <li>Run <code>fix_chat_system.sql</code> in Supabase SQL Editor</li>
            <li>Check that all tables exist ✅</li>
            <li>Create a test room 🏠</li>
            <li>Send a test message 💬</li>
            <li>Go to Chat page to see it working!</li>
          </ol>
        </div>
        
        {/* Common Issues */}
        <div className="text-xs text-muted-foreground bg-red-50 p-3 rounded">
          <p><strong>Common Issues:</strong></p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>Missing chat tables in database</li>
            <li>RLS policies blocking access</li>
            <li>User not authenticated</li>
            <li>Profiles table missing display_name</li>
          </ul>
        </div>
      </div>
    </Card>
  );
};
