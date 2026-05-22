import { runMigrations, seedDatabase } from '@/lib/db/migrate';
import Sidebar from '@/components/layout/Sidebar';

// Bootstrap DB on first render
try { runMigrations(); seedDatabase().catch(console.error); } catch {}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <main style={{ flex: 1, overflow: 'auto', background: 'var(--c-bg)' }}>
        {children}
      </main>
    </div>
  );
}
