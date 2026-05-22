'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import {
  Sparkles, FolderOpen, Workflow, History, Library,
  Mail, Clock, Search, Settings, Sun, Moon, ChevronDown, ChevronRight, Plus, Plug, Table2,
} from 'lucide-react';
import { useConnectors } from '@/lib/hooks/useConnectors';
import { useTheme } from '@/components/ThemeProvider';

interface Matter { id: string; title: string; client_name: string; }

export default function Sidebar() {
  const path = usePathname();
  const { theme, toggle } = useTheme();
  const [matters, setMatters] = useState<Matter[]>([]);
  const [mattersOpen, setMattersOpen] = useState(false);
  const { anyConnected } = useConnectors();

  useEffect(() => {
    fetch('/api/matters').then(r => r.json()).then(d => {
      const list = (d || []).slice(0, 5);
      setMatters(list);
      if (path.startsWith('/matters')) setMattersOpen(true);
    }).catch(() => {});
  }, [path]);

  const isActive = useCallback((href: string) => {
    if (href === '/') return path === '/';
    return path.startsWith(href);
  }, [path]);

  const navItem = (href: string, icon: React.ReactNode, label: string, badge?: number) => {
    const active = isActive(href);
    return (
      <Link href={href} className="nav-link" style={{
        display: 'flex', alignItems: 'center', gap: '9px',
        padding: '6px 10px', borderRadius: '7px',
        fontSize: '13px', textDecoration: 'none',
        color: active ? 'var(--c-text)' : 'var(--c-text-2)',
        background: active ? 'var(--c-active)' : 'transparent',
        fontWeight: active ? '500' : '400',
        transition: 'all 0.1s',
      }}>
        <span style={{ opacity: active ? 1 : 0.6, display: 'flex', alignItems: 'center' }}>{icon}</span>
        <span style={{ flex: 1 }}>{label}</span>
        {badge != null && badge > 0 && (
          <span style={{ fontSize: '10px', background: 'var(--c-border)', color: 'var(--c-text-3)', borderRadius: '10px', padding: '1px 6px' }}>{badge}</span>
        )}
      </Link>
    );
  };

  return (
    <aside style={{
      width: '220px', flexShrink: 0,
      background: 'var(--c-sidebar)',
      borderRight: '1px solid var(--c-border)',
      display: 'flex', flexDirection: 'column',
      height: '100vh', transition: 'background 0.2s',
    }}>
      {/* Header */}
      <div style={{ padding: '14px 14px 10px', borderBottom: '1px solid var(--c-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span style={{ fontSize: '16px', fontWeight: '700', color: 'var(--c-text)', letterSpacing: '-0.4px', fontFamily: 'Georgia, serif' }}>Stu</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button onClick={toggle} title="Toggle theme" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--c-text-3)', padding: '4px', borderRadius: '5px', display: 'flex', alignItems: 'center' }}>
              {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
            </button>
          </div>
        </div>
        <Link href="/matters/new" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          width: '100%', padding: '7px', borderRadius: '8px',
          border: '1px solid var(--c-border)', background: 'var(--c-card)',
          fontSize: '12px', fontWeight: '500', color: 'var(--c-text-2)',
          textDecoration: 'none', transition: 'all 0.1s',
        }}>
          <Plus size={12} /> New matter
        </Link>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '8px 6px', display: 'flex', flexDirection: 'column', gap: '1px', overflowY: 'auto' }}>
        {navItem('/', <Sparkles size={14} />, 'Assistant')}

        {/* Matters collapsible */}
        <div>
          <button
            onClick={() => setMattersOpen(o => !o)}
            className="nav-link"
            style={{
              display: 'flex', alignItems: 'center', gap: '9px', width: '100%',
              padding: '6px 10px', borderRadius: '7px', border: 'none',
              fontSize: '13px', cursor: 'pointer', textAlign: 'left',
              color: isActive('/matters') ? 'var(--c-text)' : 'var(--c-text-2)',
              background: isActive('/matters') ? 'var(--c-active)' : 'transparent',
              fontWeight: isActive('/matters') ? '500' : '400',
              transition: 'all 0.1s',
            }}
          >
            <span style={{ opacity: 0.6, display: 'flex', alignItems: 'center' }}><FolderOpen size={14} /></span>
            <span style={{ flex: 1 }}>Matters</span>
            <span style={{ color: 'var(--c-text-4)', display: 'flex', alignItems: 'center' }}>
              {mattersOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </span>
          </button>
          {mattersOpen && matters.length > 0 && (
            <div style={{ paddingLeft: '22px', marginTop: '2px', display: 'flex', flexDirection: 'column', gap: '1px' }}>
              {matters.map(m => (
                <Link key={m.id} href={`/matters/${m.id}`} style={{
                  display: 'block', padding: '5px 10px', borderRadius: '6px',
                  fontSize: '12px', textDecoration: 'none',
                  color: path === `/matters/${m.id}` ? 'var(--c-text)' : 'var(--c-text-3)',
                  background: path === `/matters/${m.id}` ? 'var(--c-active)' : 'transparent',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  transition: 'all 0.1s',
                }}>
                  {m.title}
                </Link>
              ))}
              <Link href="/matters" style={{ display: 'block', padding: '5px 10px', borderRadius: '6px', fontSize: '12px', color: 'var(--c-text-4)', textDecoration: 'none' }}>
                View all →
              </Link>
            </div>
          )}
          {mattersOpen && matters.length === 0 && (
            <div style={{ paddingLeft: '22px', marginTop: '2px' }}>
              <Link href="/matters/new" style={{ display: 'block', padding: '5px 10px', fontSize: '12px', color: 'var(--c-text-4)', textDecoration: 'none' }}>
                + Create first matter
              </Link>
            </div>
          )}
        </div>

        {navItem('/playbooks', <Workflow size={14} />, 'Workflows')}
        {navItem('/tabular-reviews', <Table2 size={14} />, 'Tabular Reviews')}
        {navItem('/research', <Search size={14} />, 'Research')}
        {navItem('/documents', <Library size={14} />, 'Library')}

        <div style={{ height: '1px', background: 'var(--c-border)', margin: '6px 4px' }} />

        {navItem('/email', <Mail size={14} />, 'Email Drafter')}
        {navItem('/timekeeping', <Clock size={14} />, 'Time Keeping')}
        {navItem('/templates', <History size={14} />, 'Templates')}
        {navItem('/connectors', <Plug size={14} />, 'Connectors', anyConnected ? undefined : 0)}
      </nav>

      {/* Footer */}
      <div style={{ padding: '8px 6px 12px', borderTop: '1px solid var(--c-border)', display: 'flex', flexDirection: 'column', gap: '1px' }}>
        {navItem('/settings', <Settings size={14} />, 'Settings')}
      </div>
    </aside>
  );
}
