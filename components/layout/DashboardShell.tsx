'use client';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import Sidebar from './Sidebar';

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();

  // Close drawer whenever the route changes (user tapped a link)
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  return (
    <div style={{ display: 'flex', minHeight: '100dvh', position: 'relative' }}>

      {/* ── Desktop sidebar (hidden on mobile via CSS) ── */}
      <div className="desktop-sidebar">
        <Sidebar />
      </div>

      {/* ── Mobile: backdrop overlay ── */}
      {drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 40,
            background: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(2px)',
            WebkitBackdropFilter: 'blur(2px)',
          }}
        />
      )}

      {/* ── Mobile: slide-in drawer ── */}
      <div
        className="mobile-drawer"
        style={{
          transform: drawerOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.25s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        <Sidebar onClose={() => setDrawerOpen(false)} />
      </div>

      {/* ── Right side: mobile header + page content ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

        {/* Mobile top bar — only visible on mobile */}
        <header className="mobile-header">
          <button
            onClick={() => setDrawerOpen(o => !o)}
            aria-label="Open menu"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 36, height: 36, borderRadius: 8,
              background: 'none', border: '1px solid var(--c-border)',
              color: 'var(--c-text-2)', cursor: 'pointer', flexShrink: 0,
            }}
          >
            {drawerOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
          <span style={{
            fontSize: '16px', fontWeight: 700,
            color: 'var(--c-text)', letterSpacing: '-0.4px',
            fontFamily: 'Georgia, serif',
          }}>
            Stu
          </span>
          {/* Spacer to keep "Stu" visually centred */}
          <div style={{ width: 36 }} />
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflow: 'auto', background: 'var(--c-bg)' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
