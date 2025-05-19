"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PaymentReviewForm } from "@/components/exhibitions/PaymentReviewForm";
import { useState } from "react";

interface PaymentSubmission {
  id: string;
  application_id: string;
  amount: number;
  transaction_id: string;
  email: string;
  proof_file_url?: string;
  notes?: string;
  status: 'pending_review' | 'approved' | 'rejected';
  rejection_reason?: string;
  rejection_date?: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

export interface Application {
  id: string;
  status: string;
  payment_submission?: PaymentSubmission | null;
  brand_id: string;
  exhibition_id: string;
  stall_id: string;
  created_at: string;
  updated_at: string;
  exhibition_title: string;
  brand_name: string;
  stall_name: string;
  stall_price: number;
}

// Create a client component for the payment review action
const PaymentReviewAction = ({ application }: { application: Application }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Review Payment
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Review Payment</DialogTitle>
        </DialogHeader>
        {application.payment_submission && (
          <PaymentReviewForm 
            paymentSubmission={application.payment_submission}
            onSuccess={() => {
              setIsDialogOpen(false);
              window.location.reload();
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export const columns: ColumnDef<Application>[] = [
  {
    accessorKey: "exhibition_title",
    header: "Exhibition",
  },
  {
    accessorKey: "brand_name",
    header: "Brand",
  },
  {
    accessorKey: "stall_name",
    header: "Stall",
  },
  {
    accessorKey: "stall_price",
    header: "Price",
    cell: ({ row }) => {
      const price = row.getValue("stall_price") as number;
      return `₹${price.toLocaleString()}`;
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge
          variant={
            status === 'pending' ? 'secondary' :
            status === 'payment_pending' ? 'secondary' :
            status === 'payment_review' ? 'default' :
            status === 'booked' ? 'secondary' :
            status === 'rejected' ? 'destructive' :
            'outline'
          }
        >
          {status.replace(/_/g, ' ').toUpperCase()}
        </Badge>
      );
    },
  },
  {
    accessorKey: "created_at",
    header: "Applied On",
    cell: ({ row }) => {
      return format(new Date(row.getValue("created_at")), "PPP");
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const application = row.original;

      if (application.status === 'payment_review') {
        return <PaymentReviewAction application={application} />;
      }

      return null;
    }
  }
]; 