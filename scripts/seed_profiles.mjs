import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

const serviceRoleKey = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
const adminAuthClient = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Generate 100 doctor profiles
const firstNames = [
  'Alex', 'Jordan', 'Taylor', 'Casey', 'Riley', 'Morgan', 'Quinn', 'Avery', 'Parker', 'Reese',
  'Rowan', 'Skyler', 'Cameron', 'Sydney', 'Dakota', 'Emerson', 'Hayden', 'Jesse', 'Kendall', 'Logan',
  'Blake', 'Drew', 'Sage', 'River', 'Phoenix', 'Kai', 'Remy', 'Finley', 'Elliot', 'Jamie',
  'Sam', 'Charlie', 'Robin', 'Peyton', 'Aubrey', 'Bailey', 'Harley', 'Marlowe', 'Indigo', 'Nova',
  'Zara', 'Luna', 'Aria', 'Maya', 'Zoe', 'Ivy', 'Ruby', 'Sage', 'Iris', 'Jade'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
  'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts'
];

const domains = [
  'healthcorp.net', 'medgroup.org', 'clinicplus.com', 'docnet.io', 'caretech.co', 'wellness.pro',
  'healthhub.net', 'medcare.org', 'doclink.com', 'healthnet.io', 'careplus.co', 'medtech.pro',
  'wellness.net', 'healthpro.org', 'doccare.com', 'medlink.io', 'healthwise.pro', 'medgroup.net',
  'wellness.org', 'healthsys.com', 'medcenter.net', 'carelink.org', 'healthtech.io', 'docplus.co',
  'mednet.pro', 'healthcare.net', 'clinicnet.org', 'doctech.com', 'medwise.io', 'caretech.net'
];

function generateDoctors(count) {
  const doctors = [];
  for (let i = 1; i <= count; i++) {
    const firstName = firstNames[(i - 1) % firstNames.length];
    const lastName = lastNames[Math.floor((i - 1) / firstNames.length) % lastNames.length];
    const domain = domains[(i - 1) % domains.length];
    
    const username = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${String(i).padStart(3, '0')}`;
    const email = `${username}@${domain}`;
    const fullName = `${firstName} ${lastName}`;
    
    doctors.push({ username, full_name: fullName, email });
  }
  return doctors;
}

const doctors = generateDoctors(100);

async function seedProfiles() {
  console.log('Starting fresh seeding (cleanup via SQL first)...');
  console.log('Creating 100 doctors...');
  let doctorCount = 0;
  
  for (const doctor of doctors) {
    try {
      // Create auth user
      const { data: user, error: authError } = await adminAuthClient.auth.admin.createUser({
        email: doctor.email,
        password: 'SeedDoc123!',
        email_confirm: true,
        user_metadata: { full_name: doctor.full_name }
      });

      if (authError) throw authError;

      // Update profile using service role client to bypass RLS
      const { error: profileError } = await adminAuthClient
        .from('profiles')
        .update({
          username: doctor.username,
          full_name: doctor.full_name,
          email: doctor.email,
          role: 'doctor'
        })
        .eq('id', user.user.id);

      if (profileError) throw profileError;

      doctorCount++;
      console.log(`Created doctor ${doctorCount}/100: ${doctor.email}`);
    } catch (error) {
      console.error(`Error creating doctor ${doctor.email}:`, error.message);
    }
  }

}


seedProfiles().then(() => console.log('Seeding complete: 100 doctors'));