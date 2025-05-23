export interface EmailTemplate {
  id: string;
  type: string;
  subject: string;
  template: string;
  created_at: string;
  updated_at: string;
}

export type EmailTemplateType = 
  // Organizer Templates
  | 'organizer_exhibition_created'
  | 'organizer_new_application'
  | 'organizer_payment_received'
  | 'organizer_exhibition_reminder'
  
  // Brand Templates
  | 'brand_welcome'
  | 'brand_application_status'
  | 'brand_payment_reminder'
  | 'brand_exhibition_reminder'
  
  // Shopper Templates
  | 'shopper_welcome'
  | 'shopper_exhibition_reminder'
  | 'shopper_ticket_confirmation'
  | 'shopper_favorite_exhibition'
  
  // General Templates
  | 'user_registered'
  | 'exhibition_created'
  | 'stall_booked'
  | 'application_received'
  | 'exhibition_reminder'
  | 'payment_reminder'
  | 'exhibition_cancelled'
  | 'exhibition_updated'
  | 'message_received'; 