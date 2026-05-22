'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { FileText, Upload, X, Check, Loader2, AlertTriangle, File, ChevronRight } from 'lucide-react';

interface Doc {
  id: string;
  original_name: string;
  matter_title?: string;
  matter_id?: string;
  size_bytes: number;
  status: string;
  created_at: string;
  mime_type: string;
}

interface UploadItem {
  tempId: string;
  docId?: string;
  name: string;
  size: number;
  status: 'uploading' | 'processing' | 'ready' | 'error';
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function FileIcon({ name, mime }: { name: string; mime: string }) {
  const lname = name.toLowerCase();
  const isPdf = mime?.includes('pdf') || lname.endsWith('.pdf');
  const isDocx = lname.endsWith('.docx') || lname.endsWith('.doc');
  const color = isPdf ? '#ef4444' : isDocx ? '#2563eb' : '#6b7280';
  const label = isPdf ? 'PDF' : isDocx ? 'DOC' : 'TXT';
  return (
    <div style={{ width: 40, height: 48, background: `${color}15`, border: `1px solid ${color}30`, borderRadius: '6px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <FileText size={16} color={color} />
      <span style={{ fontSize: '8px', fontWeight: '700', color, marginTop: '2px', letterSpacing: '0.3px' }}>{label}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'ready') return null;
  if (status === 'processing' || status === 'uploading') return (
    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '2px 8px', borderRadius: '20px' }}>
      <Loader2 size={9} className="animate-spin" />
      {status === 'uploading' ? 'Uploading' : 'Processing'}
    </span>
  );
  if (status === 'error') return (
    <span style={{ fontSize: '11px', color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '2px 8px', borderRadius: '20px' }}>Failed</span>
  );
  return null;
}

export default function DocumentsPage() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const fetchDocs = useCallback(() => {
    fetch('/api/documents')
      .then(r => r.json())
      .then(d => { setDocs(d || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  const uploadFile = useCallback(async (file: File) => {
    const tempId = Math.random().toString(36).slice(2);
    setUploads(u => [...u, { tempId, name: file.name, size: file.size, status: 'uploading' }]);

    const fd = new FormData();
    fd.append('file', file);

    try {
      const res = await fetch('/api/documents/upload', { method: 'POST', body: fd });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      if (!data.id) throw new Error('No ID returned');

      setUploads(u => u.map(up => up.tempId === tempId ? { ...up, docId: data.id, status: 'processing' } : up));

      // Poll for ready status
      let attempts = 0;
      while (attempts < 40) {
        await new Promise(r => setTimeout(r, 1500));
        const s = await fetch(`/api/documents/${data.id}/status`).then(r => r.json());
        if (s.status === 'ready') {
          setUploads(u => u.map(up => up.tempId === tempId ? { ...up, status: 'ready' } : up));
          // Refresh doc list
          fetchDocs();
          // Auto-remove upload item after 2s
          setTimeout(() => setUploads(u => u.filter(up => up.tempId !== tempId)), 2000);
          return;
        }
        attempts++;
      }
      // Timeout — still remove from uploads
      setUploads(u => u.filter(up => up.tempId !== tempId));
      fetchDocs();
    } catch {
      setUploads(u => u.map(up => up.tempId === tempId ? { ...up, status: 'error' } : up));
      setTimeout(() => setUploads(u => u.filter(up => up.tempId !== tempId)), 4000);
    }
  }, [fetchDocs]);

  const handleFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files);
    const valid = arr.filter(f => {
      const name = f.name.toLowerCase();
      return name.endsWith('.pdf') || name.endsWith('.docx') || name.endsWith('.doc') || name.endsWith('.txt');
    });
    valid.forEach(uploadFile);
  }, [uploadFile]);

  // Global drag & drop
  useEffect(() => {
    const onDragEnter = (e: DragEvent) => { e.preventDefault(); dragCounter.current++; setDragging(true); };
    const onDragLeave = (e: DragEvent) => { e.preventDefault(); dragCounter.current--; if (dragCounter.current === 0) setDragging(false); };
    const onDragOver = (e: DragEvent) => { e.preventDefault(); };
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current = 0;
      setDragging(false);
      if (e.dataTransfer?.files) handleFiles(e.dataTransfer.files);
    };
    document.addEventListener('dragenter', onDragEnter);
    document.addEventListener('dragleave', onDragLeave);
    document.addEventListener('dragover', onDragOver);
    document.addEventListener('drop', onDrop);
    return () => {
      document.removeEventListener('dragenter', onDragEnter);
      document.removeEventListener('dragleave', onDragLeave);
      document.removeEventListener('dragover', onDragOver);
      document.removeEventListener('drop', onDrop);
    };
  }, [handleFiles]);

  type AllItem =
    | { isUpload: true; upload: UploadItem; doc?: never }
    | { isUpload: false; doc: Doc; upload?: never };

  const allDocs: AllItem[] = [
    ...uploads.map(u => ({ isUpload: true as const, upload: u })),
    ...docs.map(d => ({ isUpload: false as const, doc: d })),
  ];

  return (
    <div style={{ padding: '32px 40px', maxWidth: '900px', position: 'relative' }}>

      {/* Drag overlay */}
      {dragging && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(34,197,94,0.08)', border: '2px dashed rgba(34,197,94,0.4)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', backdropFilter: 'blur(2px)', pointerEvents: 'none' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Upload size={28} color="#22c55e" />
          </div>
          <p style={{ fontSize: '18px', fontWeight: '600', color: '#22c55e' }}>Drop to upload</p>
          <p style={{ fontSize: '13px', color: 'rgba(34,197,94,0.7)' }}>PDF, DOCX or TXT</p>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--c-text)', marginBottom: '4px' }}>Documents</h1>
          <p style={{ fontSize: '13px', color: 'var(--c-text-3)' }}>
            {loading ? 'Loading…' : `${docs.length} document${docs.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button
          onClick={() => inputRef.current?.click()}
          style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'var(--c-accent-bg)', color: 'var(--c-accent-text)', border: 'none', borderRadius: '9px', padding: '9px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
        >
          <Upload size={13} />
          Upload
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.doc,.txt"
          style={{ display: 'none' }}
          onChange={e => { if (e.target.files) handleFiles(e.target.files); e.target.value = ''; }}
        />
      </div>

      {/* Drop hint when empty */}
      {!loading && docs.length === 0 && uploads.length === 0 && (
        <div
          onClick={() => inputRef.current?.click()}
          style={{ border: '1px dashed var(--c-border)', borderRadius: '14px', padding: '60px 40px', textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.15s' }}
        >
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--c-panel)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Upload size={22} color="var(--c-text-3)" />
          </div>
          <p style={{ fontSize: '15px', fontWeight: '500', color: 'var(--c-text)', marginBottom: '6px' }}>Drop documents here</p>
          <p style={{ fontSize: '13px', color: 'var(--c-text-3)' }}>PDF, Word or text files — Stu reads them instantly</p>
        </div>
      )}

      {/* Document list */}
      {allDocs.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {allDocs.map((item, i) => {
            if (item.isUpload && item.upload) {
              const u = item.upload;
              return (
                <div key={u.tempId} style={{ display: 'flex', alignItems: 'center', gap: '14px', background: 'var(--c-card)', border: '1px solid var(--c-border)', borderRadius: '11px', padding: '14px 16px', opacity: u.status === 'error' ? 0.6 : 1 }}>
                  <div style={{ width: 40, height: 48, background: 'var(--c-panel)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {u.status === 'error'
                      ? <X size={16} color="#ef4444" />
                      : <Loader2 size={16} color="var(--c-text-3)" className="animate-spin" />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--c-text)', marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--c-text-3)' }}>{formatSize(u.size)}</div>
                  </div>
                  <StatusBadge status={u.status} />
                </div>
              );
            }

            if (!item.doc) return null;
            const d = item.doc;
            return (
              <Link
                key={d.id}
                href={`/documents/${d.id}`}
                style={{ display: 'flex', alignItems: 'center', gap: '14px', background: 'var(--c-card)', border: '1px solid var(--c-border)', borderRadius: '11px', padding: '14px 16px', textDecoration: 'none', transition: 'border-color 0.12s' }}
              >
                <FileIcon name={d.original_name} mime={d.mime_type} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--c-text)', marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.original_name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--c-text-3)', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span>{formatSize(d.size_bytes)}</span>
                    {d.matter_title && <><span>·</span><span>{d.matter_title}</span></>}
                    <span>·</span>
                    <span>{formatDate(d.created_at)}</span>
                  </div>
                </div>
                <StatusBadge status={d.status} />
                <ChevronRight size={14} color="var(--c-text-3)" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
