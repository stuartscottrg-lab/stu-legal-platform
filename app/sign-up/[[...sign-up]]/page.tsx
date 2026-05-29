import { redirect } from 'next/navigation';

// Accounts are provisioned by an administrator — no public sign-up.
export default function SignUpPage() {
  redirect('/sign-in');
}
