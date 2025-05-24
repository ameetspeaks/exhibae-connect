import React, { useState, useEffect } from 'react';
import { useContactMessages } from '@/hooks/useContactMessages';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Search, Filter, RefreshCw, Inbox, Mail, Check, Archive, Send, ExternalLink } from 'lucide-react';
import { ContactMessage, ContactMessageStatus } from '@/types/contact';
import { createContactReplyMailto } from '@/utils/emailUtils';

const ContactMessagesPage = () => {
  const {
    messages,
    isLoading,
    refreshMessages,
    respondToMessage,
    markAsRead,
    archiveMessage,
  } = useContactMessages();

  // Log messages for debugging
  useEffect(() => {
    console.log('Contact messages data:', messages);
  }, [messages]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContactMessageStatus | 'all'>('all');
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [isReplyOpen, setIsReplyOpen] = useState(false);
  const [response, setResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter messages based on search term and status
  const filteredMessages = messages.filter((message) => {
    const matchesSearch =
      searchTerm === '' ||
      message.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.message.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || message.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleOpenMessage = async (message: ContactMessage) => {
    setSelectedMessage(message);
    // Mark as read if it's unread
    if (message.status === 'unread') {
      await markAsRead(message.id);
    }
  };

  const handleCloseMessage = () => {
    setSelectedMessage(null);
  };

  const handleOpenReply = () => {
    if (!selectedMessage) return;
    setIsReplyOpen(true);
    // Pre-fill response with greeting
    setResponse(`Dear ${selectedMessage.name},\n\nThank you for contacting us.\n\n\n\nBest regards,\nExhiBae Support Team`);
  };

  const handleCloseReply = () => {
    setIsReplyOpen(false);
    setResponse('');
  };

  const handleSubmitReply = async () => {
    if (!selectedMessage || !response.trim()) return;
    
    setIsSubmitting(true);
    const success = await respondToMessage(selectedMessage.id, response);
    setIsSubmitting(false);
    
    if (success) {
      setIsReplyOpen(false);
      // Update the local selectedMessage for UI consistency
      setSelectedMessage(prev => {
        if (!prev) return null;
        return {
          ...prev,
          status: 'replied',
          response,
        };
      });
    }
  };

  const handleArchive = async () => {
    if (!selectedMessage) return;
    const success = await archiveMessage(selectedMessage.id);
    if (success) {
      setSelectedMessage(prev => {
        if (!prev) return null;
        return {
          ...prev,
          status: 'archived',
        };
      });
    }
  };

  // Open email client with pre-filled response template
  const handleEmailClientReply = (message: ContactMessage) => {
    // Create mailto link using utility function
    const mailtoLink = createContactReplyMailto(message);
    
    // Open default email client
    window.open(mailtoLink, '_blank');
  };

  // Helper to get badge color based on status
  const getStatusBadge = (status: ContactMessageStatus) => {
    switch (status) {
      case 'unread':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Unread</Badge>;
      case 'read':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">Read</Badge>;
      case 'replied':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Replied</Badge>;
      case 'archived':
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">Archived</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Contact Messages</h1>
          <p className="text-muted-foreground">
            Manage all contact form submissions from users
          </p>
        </div>
        <Button
          onClick={refreshMessages}
          variant="outline"
          size="sm"
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search messages..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as ContactMessageStatus | 'all')}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Messages</SelectItem>
            <SelectItem value="unread">Unread</SelectItem>
            <SelectItem value="read">Read</SelectItem>
            <SelectItem value="replied">Replied</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Message Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Contact Messages</CardTitle>
          <CardDescription>
            {filteredMessages.length} messages found
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center p-4">
              <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-medium text-lg">No messages found</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'When users submit contact forms, they will appear here'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead className="w-[300px]">Subject</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMessages.map((message) => (
                  <TableRow 
                    key={message.id} 
                    className={message.status === 'unread' ? 'font-medium' : ''}
                  >
                    <TableCell>{getStatusBadge(message.status)}</TableCell>
                    <TableCell>{message.name}</TableCell>
                    <TableCell className="max-w-[300px] truncate">
                      {message.subject}
                    </TableCell>
                    <TableCell>
                      {format(new Date(message.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="View Details"
                          onClick={() => handleOpenMessage(message)}
                        >
                          <Search className="h-4 w-4" />
                        </Button>
                        {message.status !== 'archived' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Direct Email Reply"
                            onClick={() => handleEmailClientReply(message)}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Message Detail Dialog */}
      {selectedMessage && (
        <Dialog open={!!selectedMessage} onOpenChange={() => handleCloseMessage()}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedMessage.subject}</DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                {getStatusBadge(selectedMessage.status)}
                <span className="text-sm text-muted-foreground">
                  {format(new Date(selectedMessage.created_at), 'PPpp')}
                </span>
              </div>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-medium">
                      {selectedMessage.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium">{selectedMessage.name}</div>
                    <div className="text-sm text-muted-foreground">{selectedMessage.email}</div>
                  </div>
                </div>
                <div className="mt-4 whitespace-pre-line">
                  {selectedMessage.message}
                </div>
              </div>
              
              {selectedMessage.response && (
                <div className="bg-primary/5 p-4 rounded-md">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-medium">S</span>
                    </div>
                    <div>
                      <div className="font-medium">Support Team</div>
                      <div className="text-sm text-muted-foreground">
                        {selectedMessage.responded_at && format(new Date(selectedMessage.responded_at), 'PPpp')}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 whitespace-pre-line">
                    {selectedMessage.response}
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter className="gap-2 sm:gap-0">
              <div className="flex items-center gap-2 flex-wrap">
                {selectedMessage.status !== 'archived' && (
                  <Button variant="outline" size="sm" onClick={handleArchive}>
                    <Archive className="h-4 w-4 mr-2" />
                    Archive
                  </Button>
                )}
                
                {selectedMessage.status !== 'archived' && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleEmailClientReply(selectedMessage)}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Email Client Reply
                  </Button>
                )}
                
                {selectedMessage.status !== 'replied' && selectedMessage.status !== 'archived' && (
                  <Button onClick={handleOpenReply}>
                    <Mail className="h-4 w-4 mr-2" />
                    System Reply
                  </Button>
                )}
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Reply Dialog */}
      <Dialog open={isReplyOpen} onOpenChange={handleCloseReply}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Reply to {selectedMessage?.name}</DialogTitle>
            <DialogDescription>
              Your response will be sent to {selectedMessage?.email}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="response" className="text-sm font-medium">
                Your Response
              </label>
              <Textarea
                id="response"
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                rows={10}
                placeholder="Type your response here..."
                className="mt-1"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseReply} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmitReply} disabled={isSubmitting || !response.trim()}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Reply
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContactMessagesPage; 