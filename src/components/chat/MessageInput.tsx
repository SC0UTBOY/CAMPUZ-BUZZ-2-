import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { sendMessage } from '@/features/chat/chatApi';
import { useToast } from '@/hooks/use-toast';
import { Send, Paperclip, Image as ImageIcon, X, Loader2 } from 'lucide-react';

interface MessageInputProps {
    roomId: string;
    onMessageSent?: () => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({ roomId, onMessageSent }) => {
    const [content, setContent] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isSending, setIsSending] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Check file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
            toast({
                title: 'File too large',
                description: 'Please select a file smaller than 10MB',
                variant: 'destructive',
            });
            return;
        }

        setSelectedFile(file);
    };

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();

        if (!content.trim() && !selectedFile) return;

        try {
            setIsSending(true);

            const isImage = selectedFile?.type.startsWith('image/');

            await sendMessage({
                roomId,
                content: content.trim() || (selectedFile ? selectedFile.name : ''),
                imageFile: isImage ? selectedFile : undefined,
                documentFile: !isImage && selectedFile ? selectedFile : undefined,
            });

            setContent('');
            setSelectedFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }

            onMessageSent?.();
        } catch (error) {
            console.error('Failed to send message:', error);
            toast({
                title: 'Failed to send',
                description: 'Could not send your message. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsSending(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const isImage = selectedFile?.type.startsWith('image/');

    return (
        <div className="border-t bg-background p-4">
            {selectedFile && (
                <div className="mb-2 flex items-center gap-2 p-2 bg-muted rounded-lg">
                    {isImage ? (
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    ) : (
                        <Paperclip className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="text-sm flex-1 truncate">{selectedFile.name}</span>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            setSelectedFile(null);
                            if (fileInputRef.current) {
                                fileInputRef.current.value = '';
                            }
                        }}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            )}

            <form onSubmit={handleSend} className="flex gap-2">
                <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx,.txt"
                    onChange={handleFileSelect}
                />

                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSending}
                >
                    <Paperclip className="h-5 w-5" />
                </Button>

                <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    className="flex-1 min-h-[44px] max-h-[120px] resize-none"
                    rows={1}
                    disabled={isSending}
                />

                <Button
                    type="submit"
                    size="icon"
                    disabled={(!content.trim() && !selectedFile) || isSending}
                >
                    {isSending ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                        <Send className="h-5 w-5" />
                    )}
                </Button>
            </form>
        </div>
    );
};
