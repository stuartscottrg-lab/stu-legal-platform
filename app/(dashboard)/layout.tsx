import Sidebar from '@/components/layout/Sidebar';

// All dashboard routes render on-demand, never at build time
export const dynamic = 'force-dynamic';

let dbReady = false;

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Init DB on first real request, not at build/module-load time
  if (!dbReady) {
    try {
      const { runMigrations, seedDatabase } = await import('@/lib/db/migrate');
      runMigrations();
      await seedDatabase();
      dbReady = true;
    } catch (e) {
      console.error('DB init error:', e);
    }
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <main style={{ flex: 1, overflow: 'auto', background: 'var(--c-bg)' }}>
        {children}
      </main>
    </div>
  );
}
