import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get current file's directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase URL or service key. Please check your environment variables.');
  process.exit(1);
}

// Create a Supabase client with the service key for admin privileges
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('Starting migration...');
    
    // Read and execute the email_logs migration
    const emailLogsMigrationPath = path.resolve(
      __dirname, 
      '../../db/migrations/update_email_logs.sql'
    );
    
    console.log('Running email_logs migration...');
    const emailLogsSql = fs.readFileSync(emailLogsMigrationPath, 'utf8');
    const { error: emailLogsError } = await supabase.from('email_logs').select('*').limit(1);
    
    if (emailLogsError && emailLogsError.code === '42P01') {
      // Table doesn't exist, create it
      const createTableSql = `
        CREATE TABLE IF NOT EXISTS email_logs (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          operation VARCHAR(50),
          status VARCHAR(50) DEFAULT 'pending',
          recipient_email VARCHAR(255),
          subject TEXT,
          template_id VARCHAR(100),
          content JSONB,
          message_id VARCHAR(255),
          error_message TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Add indexes for better performance
        CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
        CREATE INDEX IF NOT EXISTS idx_email_logs_operation ON email_logs(operation);
        CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at);
      `;
      
      const { error: createError } = await supabase.from('_sql').rpc('raw_query', { query: createTableSql });
      if (createError) {
        console.error('Failed to create email_logs table:', createError);
        process.exit(1);
      }
      console.log('Created email_logs table successfully!');
    } else if (emailLogsError) {
      console.error('Error checking email_logs table:', emailLogsError);
      process.exit(1);
    } else {
      // Table exists, alter it
      const { error: alterError } = await supabase.from('_sql').rpc('raw_query', { query: emailLogsSql });
      if (alterError) {
        console.error('Failed to update email_logs table:', alterError);
        process.exit(1);
      }
      console.log('Updated email_logs table successfully!');
    }
    
    // Read and execute the exhibition attending migration
    const exhibitionMigrationPath = path.resolve(
      __dirname, 
      '../../db/migrations/create_exhibition_attending.sql'
    );
    
    console.log('Running exhibition attending migration...');
    const exhibitionSql = fs.readFileSync(exhibitionMigrationPath, 'utf8');
    const { error: exhibitionError } = await supabase.from('_sql').rpc('raw_query', { query: exhibitionSql });
    
    if (exhibitionError) {
      console.error('Exhibition migration failed:', exhibitionError);
      process.exit(1);
    }
    
    console.log('All migrations completed successfully!');
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
}

runMigration(); 