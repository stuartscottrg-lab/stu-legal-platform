import { redirect } from 'next/navigation';

// Stu is currently invitation-only. No public pricing.
export default function PricingPage() {
  redirect('/sign-in');
}
