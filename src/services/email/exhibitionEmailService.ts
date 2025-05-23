import emailService from './emailService';
import { supabase } from '@/integrations/supabase/client';
import { EmailTemplateType } from '@/types/email';
import { format } from 'date-fns';

// Define types for the database responses
interface Exhibition {
  id: string;
  title: string;
  description: string;
  address: string;
  city: string;
  state: string;
  country: string;
  start_date: string;
  end_date: string;
  organiser_id: string;
}

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  company_name?: string;
}

/**
 * Send an exhibition created notification to the organizer
 * @param exhibitionId The ID of the exhibition
 * @returns Promise indicating success or failure
 */
export async function sendExhibitionCreatedEmail(exhibitionId: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Get the exhibition details
    const { data: exhibition, error: exhibitionError } = await supabase
      .from('exhibitions')
      .select('*')
      .eq('id', exhibitionId)
      .single();

    if (exhibitionError) {
      console.error('Error fetching exhibition:', exhibitionError);
      return { success: false, error: exhibitionError.message };
    }

    const typedExhibition = exhibition as Exhibition;

    // Get the organizer details
    const { data: organizer, error: organizerError } = await supabase
      .from('profiles')
      .select('id, email, full_name, company_name')
      .eq('id', typedExhibition.organiser_id)
      .single();

    if (organizerError) {
      console.error('Error fetching organizer:', organizerError);
      return { success: false, error: organizerError.message };
    }

    const typedOrganizer = organizer as UserProfile;

    // Format dates
    const formattedStartDate = format(new Date(typedExhibition.start_date), 'MMMM dd, yyyy');
    const formattedEndDate = format(new Date(typedExhibition.end_date), 'MMMM dd, yyyy');

    // Prepare the template data
    const templateData = {
      name: typedOrganizer.full_name || typedOrganizer.company_name || 'Organizer',
      exhibition_name: typedExhibition.title,
      exhibition_description: typedExhibition.description,
      exhibition_location: `${typedExhibition.address}, ${typedExhibition.city}, ${typedExhibition.state}, ${typedExhibition.country}`,
      exhibition_date: `${formattedStartDate} - ${formattedEndDate}`,
      exhibition_time: '9:00 AM - 6:00 PM', // Default time if not available
      exhibition_link: `${import.meta.env.VITE_APP_URL || 'https://exhibae.com'}/exhibitions/${exhibitionId}`,
      organizer_name: typedOrganizer.full_name || typedOrganizer.company_name || 'You',
      role: 'organiser',
      role_is_organiser: true,
      unsubscribe_link: `${import.meta.env.VITE_APP_URL || 'https://exhibae.com'}/unsubscribe`
    };

    // Send the email
    const emailResult = await emailService.sendTemplateEmail({
      to: typedOrganizer.email,
      templateId: 'exhibition-created',
      data: templateData
    });

    return emailResult;
  } catch (error: any) {
    console.error('Error sending exhibition created email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send an exhibition reminder to attendees
 * @param exhibitionId The ID of the exhibition
 * @param daysUntil Number of days until the exhibition starts
 * @returns Promise indicating success or failure
 */
export async function sendExhibitionReminderEmails(exhibitionId: string, daysUntil: number): Promise<{ success: boolean; processed?: number; error?: string }> {
  try {
    // Get the exhibition details
    const { data: exhibition, error: exhibitionError } = await supabase
      .from('exhibitions')
      .select('*')
      .eq('id', exhibitionId)
      .single();

    if (exhibitionError) {
      console.error('Error fetching exhibition:', exhibitionError);
      return { success: false, error: exhibitionError.message };
    }

    const typedExhibition = exhibition as Exhibition;

    // Get all attendees
    const { data: attendees, error: attendeesError } = await supabase
      .from('exhibition_attendance')
      .select('user_id')
      .eq('exhibition_id', exhibitionId)
      .eq('attending', true);

    if (attendeesError) {
      console.error('Error fetching attendees:', attendeesError);
      return { success: false, error: attendeesError.message };
    }

    if (!attendees || attendees.length === 0) {
      console.log('No attendees found for exhibition:', exhibitionId);
      return { success: true, processed: 0 }; // No attendees to notify, so technically successful
    }

    // Get all user profiles
    const userIds = attendees.map(attendee => attendee.user_id);
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, email, full_name, company_name')
      .in('id', userIds);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return { success: false, error: usersError.message };
    }

    const typedUsers = users as UserProfile[];

    // Format dates
    const formattedStartDate = format(new Date(typedExhibition.start_date), 'MMMM dd, yyyy');
    const formattedEndDate = format(new Date(typedExhibition.end_date), 'MMMM dd, yyyy');

    // Send emails to all attendees
    const emailPromises = typedUsers.map(user => {
      const templateData = {
        name: user.full_name || user.company_name || 'Attendee',
        user_role: 'attending',
        exhibition_name: typedExhibition.title,
        exhibition_location: `${typedExhibition.address}, ${typedExhibition.city}, ${typedExhibition.state}, ${typedExhibition.country}`,
        exhibition_date: `${formattedStartDate} - ${formattedEndDate}`,
        exhibition_time: '9:00 AM - 6:00 PM', // Default time if not available
        exhibition_description: typedExhibition.description,
        days_until: daysUntil,
        exhibition_link: `${import.meta.env.VITE_APP_URL || 'https://exhibae.com'}/exhibitions/${exhibitionId}`,
        role_is_shopper: true
      };

      return emailService.queueTemplateEmail({
        to: user.email,
        templateId: 'exhibition-reminder',
        data: templateData
      });
    });

    // Wait for all emails to be queued
    await Promise.all(emailPromises);
    return { success: true, processed: typedUsers.length };
  } catch (error: any) {
    console.error('Error sending exhibition reminder emails:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send an exhibition cancelled notification to all attendees
 * @param exhibitionId The ID of the cancelled exhibition
 * @param reason Optional reason for cancellation
 * @returns Promise indicating success or failure
 */
export async function sendExhibitionCancelledEmails(exhibitionId: string, reason?: string): Promise<{ success: boolean; processed?: number; error?: string }> {
  try {
    // Get the exhibition details
    const { data: exhibition, error: exhibitionError } = await supabase
      .from('exhibitions')
      .select('*')
      .eq('id', exhibitionId)
      .single();

    if (exhibitionError) {
      console.error('Error fetching exhibition:', exhibitionError);
      return { success: false, error: exhibitionError.message };
    }

    const typedExhibition = exhibition as Exhibition;

    // Get all attendees
    const { data: attendees, error: attendeesError } = await supabase
      .from('exhibition_attendance')
      .select('user_id')
      .eq('exhibition_id', exhibitionId)
      .eq('attending', true);

    if (attendeesError) {
      console.error('Error fetching attendees:', attendeesError);
      return { success: false, error: attendeesError.message };
    }

    // Get all approved applications
    const { data: applications, error: applicationsError } = await supabase
      .from('exhibition_applications')
      .select('brand_id')
      .eq('exhibition_id', exhibitionId)
      .eq('status', 'approved');

    if (applicationsError) {
      console.error('Error fetching applications:', applicationsError);
      return { success: false, error: applicationsError.message };
    }

    // Combine attendees and brands
    const userIds = [
      ...(attendees?.map(attendee => attendee.user_id) || []),
      ...(applications?.map(application => application.brand_id) || [])
    ];

    // Remove duplicates
    const uniqueUserIds = [...new Set(userIds)];

    if (uniqueUserIds.length === 0) {
      console.log('No users found for exhibition:', exhibitionId);
      return { success: true, processed: 0 }; // No users to notify, so technically successful
    }

    // Get all user profiles
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, email, full_name, company_name')
      .in('id', uniqueUserIds);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return { success: false, error: usersError.message };
    }

    const typedUsers = users as UserProfile[];

    // Format dates
    const formattedStartDate = format(new Date(typedExhibition.start_date), 'MMMM dd, yyyy');

    // Send emails to all users
    const emailPromises = typedUsers.map(user => {
      const templateData = {
        name: user.full_name || user.company_name || 'User',
        exhibition_name: typedExhibition.title,
        exhibition_date: formattedStartDate,
        cancellation_reason: reason || 'The exhibition has been cancelled by the organizer.',
        exhibitions_link: `${import.meta.env.VITE_APP_URL || 'https://exhibae.com'}/exhibitions`,
        contact_email: 'support@exhibae.com'
      };

      return emailService.queueTemplateEmail({
        to: user.email,
        templateId: 'exhibition-cancelled',
        data: templateData
      });
    });

    // Wait for all emails to be queued
    await Promise.all(emailPromises);
    return { success: true, processed: typedUsers.length };
  } catch (error: any) {
    console.error('Error sending exhibition cancellation emails:', error);
    return { success: false, error: error.message };
  }
} 