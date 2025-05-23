require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Function to execute SQL file
async function executeSQLFile(filePath) {
  try {
    console.log(`Reading SQL file: ${filePath}`);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // Split the SQL file into individual statements
    const statements = sql
      .split(';')
      .filter(statement => statement.trim() !== '')
      .map(statement => statement.trim() + ';');
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      // Execute the SQL statement using Supabase's REST API
      const { error } = await supabase.rpc('exec_sql', { sql: statement });
      
      if (error) {
        console.error(`Error executing statement ${i + 1}:`, error);
      }
    }
    
    console.log('SQL file executed successfully');
    return true;
  } catch (error) {
    console.error('Error executing SQL file:', error);
    return false;
  }
}

// Main function to set up the database
async function setupDatabase() {
  console.log('===== DATABASE SETUP =====');
  console.log('Supabase URL:', supabaseUrl ? supabaseUrl.substring(0, 20) + '...' : 'Not configured');
  console.log('Supabase Key:', supabaseKey ? '********' : 'Not configured');
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase configuration is missing. Please check your .env file.');
    return;
  }
  
  // Path to the schema SQL file
  const schemaFilePath = path.join(__dirname, 'schema.sql');
  
  // Check if the schema file exists
  if (!fs.existsSync(schemaFilePath)) {
    console.error(`Schema file not found at: ${schemaFilePath}`);
    return;
  }
  
  console.log('Setting up database schema...');
  const success = await executeSQLFile(schemaFilePath);
  
  if (success) {
    console.log('\nDatabase setup completed successfully!');
    console.log('You can now run the tests to verify the setup.');
  } else {
    console.error('\nDatabase setup failed. Please check the error messages above.');
    console.log('\nNote: If you are using Supabase, you may need to:');
    console.log('1. Enable the "pg_execute" extension in your Supabase project');
    console.log('2. Create the "exec_sql" function in your database with:');
    console.log(`
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void AS $$
BEGIN
  EXECUTE sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;`);
  }
}

// Run the setup
setupDatabase(); 