const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envPath = '/Users/igbayilolakazeem/Desktop/MTIQ/meetiq-app/.env.local';
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    env[match[1]] = value;
  }
});

const adminSupabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['SUPABASE_SERVICE_ROLE_KEY']);

async function run() {
  try {
    const { data, error } = await adminSupabase.auth.admin.listUsers();
    if (error) throw error;
    console.log('Total users:', data.users.length);
    console.log('Sample user structure:', JSON.stringify(data.users[0], null, 2));

    const emailToSearch = 'jimbatemilayo@gmail.com';
    const found = data.users.find(u => u.email === emailToSearch);
    console.log('\nFound user by email:', found ? 'YES' : 'NO');
    if (found) {
      console.log('ID:', found.id);
    }
  } catch (err) {
    console.error('Error running test:', err);
  }
}

run();
