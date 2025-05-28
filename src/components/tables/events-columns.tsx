import { ColumnDef, TableMeta } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Eye, Pencil, Trash } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export type EventType = {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
};

interface EventTypeTableMeta extends TableMeta<EventType> {
  refreshData: () => void;
}

export const columns: ColumnDef<EventType>[] = [
  {
    accessorKey: "name",
    header: "Event Type Name",
    cell: ({ row }) => {
      return (
        <div className="font-medium">
          {row.getValue("name")}
        </div>
      );
    },
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => {
      const description = row.getValue("description") as string;
      return (
        <div className="max-w-[500px] truncate" title={description}>
          {description}
        </div>
      );
    },
  },
  {
    accessorKey: "created_at",
    header: "Created At",
    cell: ({ row }) => {
      return new Date(row.getValue("created_at")).toLocaleDateString();
    },
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const event = row.original;
      const meta = table.options.meta as EventTypeTableMeta;

      const handleDelete = async () => {
        try {
          // Check if the event type is being used by any exhibitions
          const { data: exhibitions, error: checkError } = await supabase
            .from('exhibitions')
            .select('id')
            .eq('event_type_id', event.id)
            .limit(1);

          if (checkError) throw checkError;

          if (exhibitions && exhibitions.length > 0) {
            toast({
              title: "Error",
              description: "Cannot delete event type as it is being used by exhibitions",
              variant: "destructive",
            });
            return;
          }

          const { error } = await supabase
            .from('event_types')
            .delete()
            .eq('id', event.id);

          if (error) throw error;

          toast({
            title: "Success",
            description: "Event type deleted successfully",
          });

          // Refresh the data
          meta.refreshData();
        } catch (error: any) {
          console.error('Error deleting event type:', error);
          toast({
            title: "Error",
            description: error.message || "Failed to delete event type",
            variant: "destructive",
          });
        }
      };

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link 
                to={`/dashboard/manager/events/${event.id}`}
                className="flex items-center"
              >
                <Eye className="mr-2 h-4 w-4" />
                View
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link 
                to={`/dashboard/manager/events/${event.id}/edit`}
                className="flex items-center"
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </DropdownMenuItem>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem
                  onSelect={(e) => e.preventDefault()}
                  className="text-red-600 flex items-center cursor-pointer"
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the
                    event type and remove it from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
]; 