import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { searchUsers, findOrCreateDirectMessage } from '@/features/chat/chatApi';
import { UserSearchResult } from '@/features/chat/chatTypes';
import { useToast } from '@/hooks/use-toast';
import { Search, Loader2 } from 'lucide-react';

interface NewDMModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onDMCreated: (roomId: string) => void;
}

export const NewDMModal: React.FC<NewDMModalProps> = ({
    open,
    onOpenChange,
    onDMCreated,
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const { toast } = useToast();

    const handleSearch = async (query: string) => {
        setSearchQuery(query);

        if (!query.trim()) {
            setSearchResults([]);
            return;
        }

        try {
            setIsSearching(true);
            const results = await searchUsers(query);
            setSearchResults(results);
        } catch (error) {
            console.error('Failed to search users:', error);
            toast({
                title: 'Search failed',
                description: 'Could not search for users. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectUser = async (userId: string) => {
        try {
            setIsCreating(true);
            const room = await findOrCreateDirectMessage(userId);

            toast({
                title: 'Direct message ready',
                description: 'You can now start chatting!',
            });

            onDMCreated(room.id);
            onOpenChange(false);
            setSearchQuery('');
            setSearchResults([]);
        } catch (error) {
            console.error('Failed to create DM:', error);
            toast({
                title: 'Error',
                description: 'Failed to start direct message. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsCreating(false);
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
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>New Direct Message</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search users by name..."
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="pl-9"
                            autoFocus
                        />
                    </div>

                    <ScrollArea className="h-[300px] pr-4">
                        {isSearching ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : searchResults.length > 0 ? (
                            <div className="space-y-1">
                                {searchResults.map((user) => (
                                    <Button
                                        key={user.user_id}
                                        variant="ghost"
                                        className="w-full justify-start h-auto p-3"
                                        onClick={() => handleSelectUser(user.user_id)}
                                        disabled={isCreating}
                                    >
                                        <Avatar className="h-10 w-10 mr-3">
                                            <AvatarImage src={user.avatar_url || undefined} />
                                            <AvatarFallback>{getInitials(user.display_name)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 text-left">
                                            <div className="font-medium">{user.display_name || 'Unknown User'}</div>
                                            {user.username && (
                                                <div className="text-sm text-muted-foreground">@{user.username}</div>
                                            )}
                                        </div>
                                    </Button>
                                ))}
                            </div>
                        ) : searchQuery.trim() ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <p className="text-sm">No users found</p>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">Search for users to start a conversation</p>
                            </div>
                        )}
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    );
};
