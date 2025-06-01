export type EmailStatus = 'pending' | 'sent' | 'failed';

export type EmailType = 
  | 'exhibition_created'
  | 'exhibition_approved'
  | 'exhibition_rejected'
  | 'exhibition_status_update'
  | 'exhibition_interest'
  | 'stall_application'
  | 'application_approved'
  | 'application_rejected'
  | 'application_waitlisted'
  | 'payment_status'
  | 'payment_completed'
  | 'payment_reminder'
  | 'welcome_email'
  | 'contact_response';

export interface EmailLogInsert {
  email_type: EmailType;
  recipient_email: string;
  recipient_name: string | null;
  subject: string;
  content: Record<string, any>;
  status: EmailStatus;
}

export interface EmailLogUpdate {
  status: EmailStatus;
  error_message?: string | null;
  sent_at?: string | null;
}

export interface EmailLog extends EmailLogInsert {
  id: string;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmailData {
  to: string;
  [key: string]: any;
}

export interface ExhibitionCreatedData extends EmailData {
  exhibitionTitle: string;
  organiserName: string;
  exhibitionId: string;
  createdDate: Date;
}

export interface ExhibitionStatusData extends EmailData {
  exhibitionTitle: string;
  organiserName: string;
  status: string;
  dashboardLink: string;
  updatedDate: Date;
}

export interface ExhibitionInterestData extends EmailData {
  exhibitionTitle: string;
  brandName: string;
  brandEmail: string;
  brandPhone: string;
  interestDate: Date;
}

export interface StallApplicationApprovedData extends EmailData {
  exhibitionTitle: string;
  brandName: string;
  paymentLink: string;
  approvedDate: Date;
}

export interface PaymentCompletedData extends EmailData {
  exhibitionTitle: string;
  brandName: string;
  paymentAmount: number;
  paymentDate: Date;
  stallDetails: string;
}

export interface PaymentReminderData extends EmailData {
  exhibitionTitle: string;
  brandName: string;
  dueDate: Date;
  paymentAmount: number;
  paymentLink: string;
}

export interface WelcomeEmailData extends EmailData {
  userName: string;
  userRole: string;
} 