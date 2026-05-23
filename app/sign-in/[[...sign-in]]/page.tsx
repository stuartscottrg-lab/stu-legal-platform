import { redirect } from 'next/navigation';

// Redirect to Clerk's hosted sign-in (accounts.stu.ink)
// More reliable than embedded <SignIn> component in production
export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect_url?: string; __clerk_ticket?: string }>;
}) {
  const params = await searchParams;

  // If there's a Clerk ticket (access key), pass it through to Clerk's hosted UI
  const ticket = params.__clerk_ticket;
  const redirectUrl = params.redirect_url ?? 'https://stu.ink/';

  let clerkSignIn = `https://accounts.stu.ink/sign-in?redirect_url=${encodeURIComponent(redirectUrl)}`;
  if (ticket) clerkSignIn += `&__clerk_ticket=${encodeURIComponent(ticket)}`;

  redirect(clerkSignIn);
}
