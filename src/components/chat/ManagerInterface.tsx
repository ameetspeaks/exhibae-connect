import { useState, useEffect } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { Plus, Search, Filter, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { SupportTicket, SupportCategory } from '@/types/chat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ChatInterface } from './ChatInterface';
import { CreateTicketForm } from './CreateTicketForm';
import { useChat } from '@/hooks/useChat';

const statusColors = {
    open: 'bg-green-500',
    in_progress: 'bg-blue-500',
    resolved: 'bg-yellow-500',
    closed: 'bg-gray-500',
};

const priorityColors = {
    low: 'bg-gray-500',
    medium: 'bg-yellow-500',
    high: 'bg-orange-500',
    urgent: 'bg-red-500',
};

export const ManagerInterface = () => {
    const supabase = useSupabaseClient();
    const user = useUser();
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [categories, setCategories] = useState<SupportCategory[]>([]);
    const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [filters, setFilters] = useState({
        status: '',
        priority: '',
        category: '',
        search: '',
    });

    const { messages, sendMessage, updateTicket } = useChat(selectedTicket || undefined);

    const loadTickets = async () => {
        try {
            setIsLoading(true);
            let query = supabase
                .from('support_tickets')
                .select(`
                    *,
                    category:support_categories(*),
                    user:users!support_tickets_user_id_fkey(
                        id,
                        full_name,
                        email
                    )
                `)
                .order('created_at', { ascending: false });

            if (filters.status) {
                query = query.eq('status', filters.status);
            }
            if (filters.priority) {
                query = query.eq('priority', filters.priority);
            }
            if (filters.category) {
                query = query.eq('category_id', filters.category);
            }
            if (filters.search) {
                query = query.or(`subject.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
            }

            const { data, error } = await query;

            if (error) throw error;
            setTickets(data || []);
        } catch (error) {
            console.error('Error loading tickets:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadCategories = async () => {
        try {
            const { data, error } = await supabase
                .from('support_categories')
                .select('*')
                .order('name');

            if (error) throw error;
            setCategories(data || []);
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    };

    useEffect(() => {
        loadCategories();
    }, []);

    useEffect(() => {
        loadTickets();
    }, [filters]);

    const handleStatusChange = async (ticketId: string, newStatus: string) => {
        await updateTicket(ticketId, { status: newStatus });
        loadTickets();
    };

    const handleTicketCreated = (ticket: SupportTicket) => {
        setTickets((prev) => [ticket, ...prev]);
        setIsCreateDialogOpen(false);
    };

    return (
        <div className="flex h-full">
            <div className="w-1/2 p-4 border-r">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold">Support Tickets</h2>
                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="w-4 h-4 mr-2" />
                                New Ticket
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create New Support Ticket</DialogTitle>
                            </DialogHeader>
                            <CreateTicketForm
                                categories={categories}
                                onSuccess={handleTicketCreated}
                                onCancel={() => setIsCreateDialogOpen(false)}
                            />
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="flex gap-2 mb-4">
                    <div className="flex-1">
                        <Input
                            placeholder="Search tickets..."
                            value={filters.search}
                            onChange={(e) =>
                                setFilters((prev) => ({ ...prev, search: e.target.value }))
                            }
                            className="w-full"
                            leftIcon={<Search className="w-4 h-4" />}
                        />
                    </div>
                    <Select
                        value={filters.status}
                        onValueChange={(value) =>
                            setFilters((prev) => ({ ...prev, status: value }))
                        }
                    >
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">All Status</SelectItem>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select
                        value={filters.priority}
                        onValueChange={(value) =>
                            setFilters((prev) => ({ ...prev, priority: value }))
                        }
                    >
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Priority" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">All Priority</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select
                        value={filters.category}
                        onValueChange={(value) =>
                            setFilters((prev) => ({ ...prev, category: value }))
                        }
                    >
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">All Categories</SelectItem>
                            {categories.map((category) => (
                                <SelectItem key={category.id} value={category.id}>
                                    {category.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center h-[calc(100vh-200px)]">
                        <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                ) : (
                    <div className="overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Subject</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Priority</TableHead>
                                    <TableHead>Created</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {tickets.map((ticket) => (
                                    <TableRow
                                        key={ticket.id}
                                        className={`cursor-pointer ${
                                            selectedTicket === ticket.id ? 'bg-muted' : ''
                                        }`}
                                        onClick={() => setSelectedTicket(ticket.id)}
                                    >
                                        <TableCell>
                                            <div className="font-medium">{ticket.subject}</div>
                                            <div className="text-sm text-muted-foreground">
                                                {ticket.user?.full_name}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="secondary"
                                                className={statusColors[ticket.status]}
                                            >
                                                {ticket.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="secondary"
                                                className={priorityColors[ticket.priority]}
                                            >
                                                {ticket.priority}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {format(
                                                new Date(ticket.created_at),
                                                'MMM d, yyyy HH:mm'
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>

            <div className="flex-1">
                {selectedTicket ? (
                    <ChatInterface
                        messages={messages}
                        onSendMessage={sendMessage}
                        isLoading={isLoading}
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                        Select a ticket to view the conversation
                    </div>
                )}
            </div>
        </div>
    );
}; 