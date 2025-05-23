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
    
    // Read the SQL file
    const migrationFilePath = path.resolve(
      __dirname, 
      '../../db/migrations/create_exhibition_attending.sql'
    );
    
    const sql = fs.readFileSync(migrationFilePath, 'utf8');
    
    // Execute the SQL against the database
    const { error } = await supabase.rpc('pg_execute', { query: sql });
    
    if (error) {
      console.error('Migration failed:', error);
      process.exit(1);
    }
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
}

runMigration(); 