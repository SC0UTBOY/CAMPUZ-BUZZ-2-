import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Loader2, UserPlus, Check } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
}

interface AddMembersModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    roomId: string;
    roomName: string;
}

export const AddMembersModal: React.FC<AddMembersModalProps> = ({
    open,
    onOpenChange,
    roomId,
    roomName
}) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [addingUserId, setAddingUserId] = useState<string | null>(null);
    const [addedUsers, setAddedUsers] = useState<Set<string>>(new Set());
    const debouncedQuery = useDebounce(searchQuery, 300);

    useEffect(() => {
        if (debouncedQuery.trim().length > 0) {
            searchUsers(debouncedQuery);
        } else {
            setSearchResults([]);
        }
    }, [debouncedQuery]);

    // Reset when modal opens
    useEffect(() => {
        if (open) {
            setSearchQuery('');
            setSearchResults([]);
            setAddedUsers(new Set());
        }
    }, [open]);

    const searchUsers = async (query: string) => {
        setIsSearching(true);
        try {
            // Search for users not already in the room
            const { data: existingMembers } = await supabase
                .from('chat_participants')
                .select('user_id')
                .eq('room_id', roomId);

            const existingMemberIds = existingMembers?.map(m => m.user_id) || [];

            const { data, error } = await supabase
                .from('profiles')
                .select('id, display_name, avatar_url')
                .ilike('display_name', `%${query}%`)
                .not('id', 'in', `(${[user?.id, ...existingMemberIds].filter(Boolean).join(',')})`)
                .limit(10);

            if (error) {
                console.error('Error searching users:', error);
                setSearchResults([]);
            } else {
                setSearchResults(data || []);
            }
        } catch (error) {
            console.error('Error in searchUsers:', error);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    const handleAddMember = async (selectedUser: UserProfile) => {
        if (!user) return;

        setAddingUserId(selectedUser.id);
        try {
            const { error } = await (supabase
                .from('chat_participants') as any)
                .insert({
                    room_id: roomId,
                    user_id: selectedUser.id,
                    added_by: user.id
                });

            if (error) {
                console.error('Error adding member:', error);
                toast({
                    title: 'Error',
                    description: 'Failed to add member to the room.',
                    variant: 'destructive'
                });
                return;
            }

            // Mark as added
            setAddedUsers(prev => new Set(prev).add(selectedUser.id));

            toast({
                description: `${selectedUser.display_name || 'User'} added to ${roomName}!`
            });

            // Remove from search results
            setSearchResults(prev => prev.filter(u => u.id !== selectedUser.id));
        } catch (error) {
            console.error('Error in handleAddMember:', error);
            toast({
                title: 'Error',
                description: 'Failed to add member.',
                variant: 'destructive'
            });
        } finally {
            setAddingUserId(null);
        }
    };

    const getInitials = (name: string | null) => {
        if (!name) return '?';
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Add Members to {roomName}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                            placeholder="Search users by name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                            autoFocus
                        />
                    </div>

                    <ScrollArea className="h-[400px] pr-4">
                        {isSearching ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : searchResults.length > 0 ? (
                            <div className="space-y-2">
                                {searchResults.map((searchUser) => {
                                    const isAdded = addedUsers.has(searchUser.id);
                                    const isAdding = addingUserId === searchUser.id;

                                    return (
                                        <div
                                            key={searchUser.id}
                                            className="flex items-center justify-between p-3 hover:bg-muted rounded-lg transition-colors"
                                        >
                                            <div className="flex items-center space-x-3">
                                                <Avatar>
                                                    <AvatarImage src={searchUser.avatar_url || undefined} />
                                                    <AvatarFallback>{getInitials(searchUser.display_name)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium">{searchUser.display_name || 'Unknown User'}</p>
                                                </div>
                                            </div>

                                            <Button
                                                size="sm"
                                                onClick={() => handleAddMember(searchUser)}
                                                disabled={isAdded || isAdding}
                                                variant={isAdded ? 'outline' : 'default'}
                                            >
                                                {isAdding ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : isAdded ? (
                                                    <>
                                                        <Check className="h-4 w-4 mr-1" />
                                                        Added
                                                    </>
                                                ) : (
                                                    <>
                                                        <UserPlus className="h-4 w-4 mr-1" />
                                                        Add
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : searchQuery.trim().length > 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No users found
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                Start typing to search for users to add
                            </div>
                        )}
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    );
};
