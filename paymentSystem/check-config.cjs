// Quick diagnostic script
require('dotenv').config({ path: '.env.local' });

console.log('\n🔍 Configuration Check\n');

// Supabase Configuration
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ SET' : '❌ MISSING');
if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.log('   URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
}

console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ SET' : '❌ MISSING');
if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.log('   Key length:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length);
}

// CDP Configuration
console.log('\nCDP_API_KEY_NAME:', process.env.CDP_API_KEY_NAME ? '✅ SET' : '❌ MISSING');
console.log('CDP_API_KEY_SECRET:', process.env.CDP_API_KEY_SECRET ? '✅ SET (length: ' + process.env.CDP_API_KEY_SECRET.length + ')' : '❌ MISSING');

console.log('\nNETWORK_ID:', process.env.NETWORK_ID || 'base-sepolia (default)');

// Check what's missing
let missing = [];
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) missing.push('NEXT_PUBLIC_SUPABASE_URL');
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
if (!process.env.CDP_API_KEY_NAME) missing.push('CDP_API_KEY_NAME');
if (!process.env.CDP_API_KEY_SECRET) missing.push('CDP_API_KEY_SECRET');

if (missing.length > 0) {
  console.log('\n❌ Missing configuration:');
  console.log('   ' + missing.join(', '));
  console.log('\nAdd these to your .env.local file:');
  console.log('\n# Supabase (from your Supabase dashboard)');
  console.log('NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here');
  console.log('\n# Coinbase CDP (from portal.cdp.coinbase.com)');
  console.log('CDP_API_KEY_NAME=organizations/YOUR-ORG/apiKeys/YOUR-KEY-ID');
  console.log('CDP_API_KEY_SECRET=-----BEGIN EC PRIVATE KEY-----\\n...\\n-----END EC PRIVATE KEY-----');
} else {
  console.log('\n✅ All configuration looks good!');
}

console.log('\n✅ Check complete!\n');

