import { redirect } from 'next/navigation';

// Account creation lives on the unified auth page in `signup` mode.
export default function SignUpPage() {
  redirect('/sign-in?mode=signup');
}
