const { createClient } = require('@supabase/supabase-js');
const { sendExhibitionReminderEmails } = require('../services/emailService');
const { addDays, differenceInDays } = require('date-fns');

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Reminder days configuration
const REMINDER_DAYS = [7, 3, 1]; // Send reminders 7 days, 3 days, and 1 day before

/**
 * Check and send exhibition reminders
 */
async function checkAndSendReminders() {
  try {
    console.log('Checking for exhibition reminders...');

    // Get upcoming exhibitions
    const { data: exhibitions, error } = await supabase
      .from('exhibitions')
      .select('*')
      .gte('start_date', new Date().toISOString())
      .order('start_date');

    if (error) throw error;

    for (const exhibition of exhibitions) {
      const daysUntil = differenceInDays(new Date(exhibition.start_date), new Date());

      // Check if we should send a reminder for this number of days
      if (REMINDER_DAYS.includes(daysUntil)) {
        console.log(`Sending ${daysUntil}-day reminder for exhibition: ${exhibition.title}`);

        try {
          // Send reminder emails
          await sendExhibitionReminderEmails({
            exhibition_id: exhibition.id,
            days_until: daysUntil
          });

          // Log the reminder
          await supabase
            .from('email_logs')
            .insert({
              type: 'exhibition_reminder',
              exhibition_id: exhibition.id,
              days_before: daysUntil,
              sent_at: new Date().toISOString()
            });

        } catch (reminderError) {
          console.error(`Error sending reminder for exhibition ${exhibition.id}:`, reminderError);
        }
      }
    }

    console.log('Finished checking exhibition reminders');
  } catch (error) {
    console.error('Error in checkAndSendReminders:', error);
  }
}

// Export for use in scheduler
module.exports = {
  checkAndSendReminders
}; 