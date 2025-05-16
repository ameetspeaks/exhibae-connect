import { useEffect } from 'react';
import { useUser } from '@supabase/auth-helpers-react';
import { useNavigate } from 'react-router-dom';
import { ManagerInterface } from '@/components/chat/ManagerInterface';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { Loader2 } from 'lucide-react';

const ChatPage = () => {
    const user = useUser();
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) {
            navigate('/auth/login');
        }
    }, [user, navigate]);

    if (!user) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="w-6 h-6 animate-spin" />
            </div>
        );
    }

    const userRole = user.user_metadata.role;

    // Render different interfaces based on user role
    switch (userRole) {
        case 'manager':
        case 'admin':
        case 'superadmin':
            return <ManagerInterface />;
        case 'organiser':
        case 'brand':
            return <ChatInterface />;
        default:
            return (
                <div className="flex items-center justify-center h-screen">
                    <p className="text-lg text-muted-foreground">
                        You do not have access to the chat system.
                    </p>
                </div>
            );
    }
};

export default ChatPage; 