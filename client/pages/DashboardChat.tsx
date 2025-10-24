import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Pin, MoreVertical, Send, RefreshCw } from 'lucide-react';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/contexts/AuthContext';

interface ChatMessage {
  _id: string;
  sender: {
    _id: string;
    name: string;
    email: string;
    profilePhoto?: string;
  };
  content: string;
  isPinned: boolean;
  createdAt: string;
}

interface OnlineUser {
  _id: string;
  name: string;
  email: string;
  profilePhoto?: string;
  role?: string;
}

export default function DashboardChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { socket } = useSocket();
  const { user } = useAuth();

  useEffect(() => {
    fetchMessages();
  }, []);

  useEffect(() => {
    if (!socket || !user) return;

    // Notify server that user is online
    socket.emit('user:online', user.id);

    // Listen for new messages
    socket.on('message:new', (message: ChatMessage) => {
      setMessages((prev) => {
        // Remove optimistic message if it exists
        const filtered = prev.filter(msg => !msg._id.startsWith('temp-'));
        // Check if message already exists to avoid duplicates
        if (filtered.some(msg => msg._id === message._id)) {
          return prev;
        }
        return [...filtered, message];
      });
    });

    // Listen for pinned message updates
    socket.on('message:pinned', (message: ChatMessage) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === message._id ? { ...msg, isPinned: message.isPinned } : msg
        )
      );
    });

    // Listen for online users
    socket.on('users:online', (users: OnlineUser[]) => {
      setOnlineUsers(users);
    });

    // Listen for typing indicators
    socket.on('user:typing', (data: { userId: string; userName: string }) => {
      if (data.userId !== user.id) {
        setTypingUsers((prev) => new Set(prev).add(data.userName));
      }
    });

    socket.on('user:stop-typing', (data: { userId: string }) => {
      setTypingUsers((prev) => {
        const newSet = new Set(prev);
        Array.from(newSet).forEach((name) => {
          if (name.includes(data.userId)) {
            newSet.delete(name);
          }
        });
        return newSet;
      });
    });

    return () => {
      socket.off('message:new');
      socket.off('message:pinned');
      socket.off('users:online');
      socket.off('user:typing');
      socket.off('user:stop-typing');
    };
  }, [socket, user]);

  useEffect(() => {
    // Auto-scroll to bottom when messages change
    const scrollToBottom = () => {
      if (scrollRef.current) {
        // Find the actual scrollable viewport element inside ScrollArea (Radix UI)
        const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
        if (viewport) {
          viewport.scrollTop = viewport.scrollHeight;
        }
      }
    };

    // Use setTimeout to ensure DOM has updated with new message
    const timer = setTimeout(scrollToBottom, 0);
    
    return () => clearTimeout(timer);
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/messages', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !socket || !user) return;

    const messageContent = newMessage.trim();
    
    // Optimistic UI update - add message immediately
    const optimisticMessage: ChatMessage = {
      _id: `temp-${Date.now()}`,
      sender: {
        _id: user.id,
        name: user.name,
        email: user.email,
        profilePhoto: user.profilePhoto,
      },
      content: messageContent,
      isPinned: false,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setNewMessage('');

    // Scroll to bottom immediately after adding message
    setTimeout(() => {
      if (scrollRef.current) {
        const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
        if (viewport) {
          viewport.scrollTop = viewport.scrollHeight;
        }
      }
    }, 10);

    socket.emit('message:send', {
      content: messageContent,
      userId: user.id,
    });
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    socket.emit('message:stop-typing', { userId: user.id });
  };

  const handleTyping = (value: string) => {
    setNewMessage(value);

    if (!socket || !user) return;

    // Only emit typing if user is actually typing (not empty)
    if (value.trim()) {
      socket.emit('message:typing', { userId: user.id, userName: user.name });

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Stop typing after 1 second of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('message:stop-typing', { userId: user.id });
      }, 1000);
    } else {
      // If input is cleared, stop typing immediately
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      socket.emit('message:stop-typing', { userId: user.id });
    }
  };

  const handlePinMessage = async (messageId: string, isPinned: boolean) => {
    try {
      const response = await fetch(`/api/messages/${messageId}/pin`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isPinned: !isPinned }),
      });

      if (!response.ok) {
        alert('Failed to pin message');
      }
    } catch (error) {
      console.error('Failed to pin message:', error);
    }
  };

  const pinnedMessages = messages.filter((msg) => msg.isPinned);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const getAvatar = (user: { profilePhoto?: string; name: string }) => {
    if (user.profilePhoto) return user.profilePhoto;
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`;
  };

  const isUserOnline = (userId: string) => {
    return onlineUsers.some(u => u._id === userId);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen bg-white dark:bg-gray-900">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-primary mb-3 shadow-lg">
              <RefreshCw className="w-8 h-8 text-white animate-spin" />
            </div>
            <p className="text-gray-600 dark:text-gray-400 font-medium">Loading #general...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="h-screen flex flex-col bg-white dark:bg-gray-900">
        {/* Slack-style header */}
        <div className="flex-none border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 shadow-sm">
          <div className="px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-primary flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-lg">#</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                  general
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <span className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                    {onlineUsers.length} member{onlineUsers.length !== 1 ? 's' : ''}
                  </span>
                  <span className="text-gray-300 dark:text-gray-700">|</span>
                  <span>Team-wide announcements and work-based matters</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Main chat area */}
          <div className="flex-1 flex flex-col bg-white dark:bg-gray-900">
            {/* Pinned messages banner - Slack style */}
            {pinnedMessages.length > 0 && (
              <div className="px-6 py-3 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-100 dark:border-amber-900 flex items-center gap-3">
                <Pin className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-100 truncate">
                    {pinnedMessages[0].sender.name}: {pinnedMessages[0].content}
                  </p>
                </div>
                {pinnedMessages.length > 1 && (
                  <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                    +{pinnedMessages.length - 1} more
                  </span>
                )}
              </div>
            )}

            {/* Messages area - Slack style */}
            <ScrollArea ref={scrollRef} className="flex-1 px-6 py-4">
                  <div className="space-y-1">
                    {messages.map((msg, index) => {
                      const isOwnMessage = msg.sender._id === user?.id;
                      const showAvatar = index === 0 || messages[index - 1]?.sender._id !== msg.sender._id;
                      const showTimestamp = showAvatar;
                      
                      return (
                        <div 
                          key={msg._id} 
                          className="group hover:bg-gray-50 dark:hover:bg-gray-800/50 -mx-6 px-6 py-2 transition-colors"
                        >
                          <div className="flex gap-3">
                            {/* Avatar column - always present for alignment */}
                            <div className="w-9 flex-shrink-0 pt-0.5">
                              {showAvatar ? (
                                <div className="relative">
                                  <Avatar className="w-9 h-9 ring-2 ring-white dark:ring-gray-900">
                                    <AvatarImage 
                                      src={getAvatar(msg.sender)} 
                                      alt={msg.sender.name}
                                    />
                                    <AvatarFallback className="bg-gradient-primary text-white font-semibold text-sm">
                                      {msg.sender.name.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  {isUserOnline(msg.sender._id) && (
                                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
                                  )}
                                </div>
                              ) : (
                                <div className="text-[10px] text-gray-400 dark:text-gray-600 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  {formatTime(msg.createdAt).split(' ')[0]}
                                </div>
                              )}
                            </div>
                            
                            {/* Message content */}
                            <div className="flex-1 min-w-0">
                              {showTimestamp && (
                                <div className="flex items-baseline gap-2 mb-1">
                                  <span className="font-bold text-[15px] text-gray-900 dark:text-white hover:underline cursor-pointer">
                                    {msg.sender.name}
                                  </span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {formatTime(msg.createdAt)}
                                  </span>
                                  {msg.isPinned && (
                                    <Pin className="w-3 h-3 text-amber-500" />
                                  )}
                                </div>
                              )}
                              
                              <div className="text-[15px] text-gray-900 dark:text-gray-100 leading-relaxed break-words">
                                {msg.content}
                              </div>
                            </div>

                            {/* Actions menu - appears on hover */}
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="h-7 w-7 p-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                                  >
                                    <MoreVertical className="w-3.5 h-3.5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="min-w-[160px]">
                                  <DropdownMenuItem onClick={() => handlePinMessage(msg._id, msg.isPinned)} className="gap-2">
                                    <Pin className="w-4 h-4" />
                                    {msg.isPinned ? 'Unpin' : 'Pin'} message
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {messages.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-full py-20">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-primary/10 flex items-center justify-center mb-4">
                          <span className="text-3xl">#</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                          This is the very beginning of #general
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
                          This channel is for team-wide communication and announcements. Everyone is in this channel.
                        </p>
                      </div>
                    )}
                  </div>
            </ScrollArea>

            {/* Typing indicator - Slack style */}
            {typingUsers.size > 0 && (
              <div className="px-6 py-2 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce" style={{ animationDelay: '0s' }}></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce" style={{ animationDelay: '0.15s' }}></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce" style={{ animationDelay: '0.3s' }}></span>
                  </div>
                  <span className="font-semibold">{Array.from(typingUsers).join(', ')}</span>
                  <span>{typingUsers.size === 1 ? 'is' : 'are'} typing...</span>
                </div>
              </div>
            )}

            {/* Message input - Slack style */}
            <div className="px-6 pb-6 pt-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <div className="relative">
                <Input
                  placeholder="Message #general"
                  value={newMessage}
                  onChange={(e) => handleTyping(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="pr-12 border-2 border-gray-300 dark:border-gray-700 focus:border-teal-500 dark:focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 rounded-lg h-11 text-[15px]"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0 bg-gradient-primary hover:brightness-110 disabled:opacity-40"
                >
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Sidebar - Slack style */}
          <div className="w-64 border-l border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex flex-col">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">Team Members</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{onlineUsers.length} online</p>
            </div>
            
            <ScrollArea className="flex-1 px-4 py-3">
              {onlineUsers.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 mb-2">
                    <span className="text-2xl">👥</span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">No one online</p>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {onlineUsers.map((onlineUser) => {
                    const isCurrentUser = onlineUser._id === user?.id;
                    return (
                      <div 
                        key={onlineUser._id} 
                        className={`flex items-center gap-2 px-3 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors ${
                          isCurrentUser ? 'bg-teal-50 dark:bg-teal-900/20' : ''
                        }`}
                      >
                        <div className="relative flex-shrink-0">
                          <Avatar className="w-7 h-7">
                            <AvatarImage 
                              src={getAvatar(onlineUser)} 
                              alt={onlineUser.name}
                            />
                            <AvatarFallback className="bg-gradient-primary text-white text-xs font-semibold">
                              {onlineUser.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-gray-50 dark:border-gray-900"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {onlineUser.name}
                            {isCurrentUser && ' (you)'}
                          </p>
                        </div>
                        {onlineUser.role && (
                          <span className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                            onlineUser.role === 'admin' 
                              ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' 
                              : onlineUser.role === 'manager'
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                          }`}>
                            {onlineUser.role}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
