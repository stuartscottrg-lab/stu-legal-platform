#!/usr/bin/env node
/**
 * Generate a one-time Clerk sign-in access key for Stu Legal.
 * Usage: node scripts/generate-access-key.mjs [label] [expires_in_seconds]
 *
 * Examples:
 *   node scripts/generate-access-key.mjs "Demo for Smith & Co" 86400
 *   node scripts/generate-access-key.mjs "Test user" 3600
 *
 * Default: expires in 24 hours.
 */

const CLERK_SECRET = process.env.CLERK_SECRET_KEY;
if (!CLERK_SECRET) {
  console.error('❌ Set CLERK_SECRET_KEY env var first.\n   export CLERK_SECRET_KEY=sk_live_...');
  process.exit(1);
}
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://stu.ink';

const label = process.argv[2] || 'access key';
const expiresIn = parseInt(process.argv[3] || '86400', 10); // default 24h

async function generate() {
  const res = await fetch('https://api.clerk.com/v1/sign_in_tokens', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CLERK_SECRET}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ expires_in_seconds: expiresIn }),
  });

  const data = await res.json();

  if (!res.ok || data.errors) {
    console.error('❌ Failed:', data.errors?.[0]?.message ?? JSON.stringify(data));
    process.exit(1);
  }

  const token = data.token;
  const link = `${BASE_URL}/sign-in?__clerk_ticket=${token}`;
  const expiresAt = new Date(Date.now() + expiresIn * 1000).toLocaleString('en-GB');

  console.log('\n✅ Access key generated');
  console.log('─'.repeat(60));
  console.log(`Label:    ${label}`);
  console.log(`Expires:  ${expiresAt} (${expiresIn / 3600}h)`);
  console.log(`\nLink:\n${link}\n`);
  console.log('─'.repeat(60));
  console.log('Send this link to the user. It works once then expires.\n');
}

generate().catch(console.error);
