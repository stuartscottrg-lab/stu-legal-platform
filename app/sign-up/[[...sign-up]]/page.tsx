import { redirect } from 'next/navigation';

// Registration is handled via invitation / magic link from sign-in
export default function SignUpPage() {
  redirect('/sign-in');
}
