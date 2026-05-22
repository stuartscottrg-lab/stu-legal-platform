import DashboardShell from '@/components/layout/DashboardShell';

// All dashboard routes render on-demand, never at build time
export const dynamic = 'force-dynamic';

let dbReady = false;

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  if (!dbReady) {
    try {
      const { runPgMigrations, seedLawFirms } = await import('@/lib/db/pg-migrate');
      await runPgMigrations();
      await seedLawFirms();
      dbReady = true;
    } catch (e) {
      console.error('DB init error:', e);
    }
  }

  return <DashboardShell>{children}</DashboardShell>;
}
