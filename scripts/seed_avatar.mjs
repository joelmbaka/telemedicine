import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing Supabase env vars. Ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY are set.');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const [id, avatarArg] = process.argv.slice(2);
  if (!id) {
    console.error('Usage: node scripts/seed_avatar.mjs <profileId> [avatarUrl]');
    process.exit(1);
  }

  try {
    let avatarUrl = avatarArg;

    // If no explicit URL passed, derive from profile name using UI Avatars
    if (!avatarUrl) {
      const { data: prof, error: profErr } = await admin
        .from('profiles')
        .select('full_name')
        .eq('id', id)
        .single();
      if (profErr) {
        console.error('Failed to fetch profile name:', profErr.message);
        process.exit(1);
      }
      const name = encodeURIComponent((prof?.full_name || 'Doctor').trim());
      // Random background color; transparent foreground; rounded default
      avatarUrl = `https://ui-avatars.com/api/?name=${name}&background=random&length=2&size=128`;
    }

    const { error } = await admin
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('id', id);

    if (error) {
      console.error('Failed to update avatar_url:', error.message);
      process.exit(1);
    }

    console.log(`✅ Updated avatar_url for profile ${id} -> ${avatarUrl}`);
  } catch (err) {
    console.error('Unexpected error:', err?.message || err);
    process.exit(1);
  }
}

main();
