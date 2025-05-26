import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

interface Exhibition {
  id: string;
  title: string;
  organiser: {
    full_name: string;
  };
  venue_type: {
    name: string;
  };
  city: string;
  state: string;
  start_date: string;
  end_date: string;
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  cover_image?: string;
}

interface ExhibitionCardProps {
  exhibition: Exhibition;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (exhibition: Exhibition) => void;
  onStatusChange: (id: string, status: Exhibition['status']) => void;
  updatingStatus: string | null;
}

const getStatusDisplay = (status: Exhibition['status']) => {
  if (status === 'draft') {
    return 'Pending for Approval';
  }
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const getStatusBadgeVariant = (status: Exhibition['status']) => {
  switch (status) {
    case 'published':
      return 'default';
    case 'draft':
      return 'secondary';
    case 'cancelled':
      return 'destructive';
    case 'completed':
      return 'outline';
    default:
      return 'outline';
  }
};

const ExhibitionCard: React.FC<ExhibitionCardProps> = ({
  exhibition,
  onView,
  onEdit,
  onDelete,
  onStatusChange,
  updatingStatus,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="relative bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg transform-gpu transition-all duration-300"
      style={{
        perspective: '1000px',
      }}
    >
      <div className="relative h-48 overflow-hidden">
        <div 
          className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20 mix-blend-overlay"
        />
        <img
          src={exhibition.cover_image || '/default-exhibition.jpg'}
          alt={exhibition.title}
          className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-300"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
          <Badge variant={getStatusBadgeVariant(exhibition.status)} className="mb-2">
            {getStatusDisplay(exhibition.status)}
          </Badge>
        </div>
      </div>

      <div className="p-6">
        <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
          {exhibition.title}
        </h3>
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
          <p>Organiser: {exhibition.organiser.full_name}</p>
          <p>Venue: {exhibition.venue_type.name}</p>
          <p>Location: {exhibition.city}, {exhibition.state}</p>
          <p>
            Date: {format(new Date(exhibition.start_date), 'MMM dd, yyyy')} - {format(new Date(exhibition.end_date), 'MMM dd, yyyy')}
          </p>
        </div>

        <div className="mt-4 flex gap-2 justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onView(exhibition.id)}
          >
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(exhibition.id)}
          >
            <Pencil className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(exhibition)}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default ExhibitionCard; 