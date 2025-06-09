import React, { useState } from 'react';
import { useAuth } from '@/integrations/supabase/AuthProvider';
import { MessageCircle, X, MessageSquare } from 'lucide-react';

const WhatsAppSupport = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [message, setMessage] = useState('');
  const whatsappNumber = '+919871130866';

  // Get user role from metadata
  const userRole = user?.user_metadata?.role?.toLowerCase() || '';

  // Hide for manager, admin, and superadmin roles
  if (['manager', 'admin', 'superadmin'].includes(userRole)) {
    return null;
  }

  const messages = [
    { text: 'Hi! I am Organiser. I am looking for help', role: 'organiser' },
    { text: 'Hi! I am Brand owner. I am looking for help', role: 'brand' },
    { text: 'Hi! I am Shopper. I am looking for help', role: 'shopper' }
  ];

  const handleMessageClick = (message: string) => {
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${whatsappNumber}?text=${encodedMessage}`, '_blank');
    setIsOpen(false);
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-2 right-2 z-50">
        <button
          onClick={() => setIsVisible(true)}
          className="bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full p-2 shadow-sm transition-colors duration-200 flex items-center gap-2 text-xs"
        >
          <MessageSquare className="w-6 h-6" />
          <span>Support</span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen && (
        <div className="absolute bottom-24 right-0 bg-white rounded-lg shadow-lg p-4 mb-2 w-72">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium text-gray-700">Choose a message:</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2">
            {messages.map((message, index) => (
              <button
                key={index}
                onClick={() => handleMessageClick(message.text)}
                className="w-full text-left p-3 rounded-lg hover:bg-gray-100 transition-colors duration-200 text-sm"
              >
                {message.text}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="flex flex-col items-center">
        <div className="relative mb-2">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="bg-green-500 hover:bg-green-600 text-white rounded-full p-3 shadow-lg transition-colors duration-200 flex items-center justify-center"
          >
            <MessageCircle className="w-6 h-6" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsVisible(false);
            }}
            className="absolute -top-2 -right-2 bg-gray-100 rounded-full p-1 shadow-md hover:bg-gray-200"
          >
            <X className="w-3 h-3 text-gray-600" />
          </button>
        </div>
        <span className="text-sm font-medium text-gray-600">Chat on WhatsApp</span>
      </div>
    </div>
  );
};

export default WhatsAppSupport; 