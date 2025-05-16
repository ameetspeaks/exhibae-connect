import { useState } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { SupportCategory, SupportTicket } from '@/types/chat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

interface CreateTicketFormProps {
    categories: SupportCategory[];
    onSuccess?: (ticket: SupportTicket) => void;
    onCancel?: () => void;
}

export const CreateTicketForm = ({
    categories,
    onSuccess,
    onCancel,
}: CreateTicketFormProps) => {
    const supabase = useSupabaseClient();
    const user = useUser();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        subject: '',
        description: '',
        category_id: '',
        priority: 'medium' as const,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        try {
            setIsLoading(true);
            const { data: ticket, error } = await supabase
                .from('support_tickets')
                .insert({
                    ...formData,
                    user_id: user.id,
                    user_role: user.user_metadata.role,
                    created_by: user.id,
                    status: 'open',
                })
                .select(`
                    *,
                    category:support_categories(*)
                `)
                .single();

            if (error) throw error;

            toast({
                title: 'Success',
                description: 'Support ticket created successfully',
            });

            if (onSuccess && ticket) {
                onSuccess(ticket);
            }
        } catch (error) {
            console.error('Error creating ticket:', error);
            toast({
                title: 'Error',
                description: 'Failed to create support ticket',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Select
                    value={formData.category_id}
                    onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, category_id: value }))
                    }
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                        {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                                {category.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Select
                    value={formData.priority}
                    onValueChange={(value: 'low' | 'medium' | 'high' | 'urgent') =>
                        setFormData((prev) => ({ ...prev, priority: value }))
                    }
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Input
                    placeholder="Subject"
                    value={formData.subject}
                    onChange={(e) =>
                        setFormData((prev) => ({ ...prev, subject: e.target.value }))
                    }
                    required
                />
            </div>

            <div className="space-y-2">
                <Textarea
                    placeholder="Describe your issue..."
                    value={formData.description}
                    onChange={(e) =>
                        setFormData((prev) => ({ ...prev, description: e.target.value }))
                    }
                    required
                    rows={5}
                />
            </div>

            <div className="flex justify-end gap-2">
                {onCancel && (
                    <Button type="button" variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                )}
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Creating...
                        </>
                    ) : (
                        'Create Ticket'
                    )}
                </Button>
            </div>
        </form>
    );
}; 