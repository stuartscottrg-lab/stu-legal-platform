'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload } from 'lucide-react';

export default function UploadZone({ matterId }: { matterId: string }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState('');
  const ref = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const upload = async (file: File) => {
    setUploading(true);
    setProgress('Uploading…');
    const fd = new FormData();
    fd.append('file', file);
    fd.append('matterId', matterId);
    const res = await fetch('/api/documents/upload', { method: 'POST', body: fd });
    const data = await res.json();
    setProgress('Processing document…');
    if (data.id) {
      // Poll until ready
      let attempts = 0;
      while (attempts < 60) {
        await new Promise(r => setTimeout(r, 2000));
        const s = await fetch(`/api/documents/${data.id}/status`).then(r => r.json());
        if (s.status === 'ready') { router.push(`/matters/${matterId}/documents/${data.id}`); return; }
        attempts++;
      }
      router.push(`/matters/${matterId}/documents/${data.id}`);
    }
    setUploading(false);
    setProgress('');
  };

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if(f) upload(f); }}
      onClick={() => !uploading && ref.current?.click()}
      style={{ border: `1px dashed ${dragging ? 'var(--c-border-s)' : 'var(--c-border)'}`, borderRadius: '10px', padding: '32px', textAlign: 'center', cursor: uploading ? 'default' : 'pointer', background: dragging ? 'var(--c-panel)' : 'transparent', transition: 'all 0.15s' }}
    >
      <input ref={ref} type="file" accept=".pdf,.docx,.txt" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if(f) upload(f); }} />
      <Upload size={18} color="#555" style={{ margin: '0 auto 10px' }} />
      {uploading
        ? <p style={{ color: 'var(--c-text-2)', fontSize: '13px' }}>{progress}</p>
        : <>
            <p style={{ color: 'var(--c-text-2)', fontSize: '13px', marginBottom: '4px' }}>Drop a file or click to upload</p>
            <p style={{ color: 'var(--c-text-3)', fontSize: '12px' }}>PDF, DOCX, TXT</p>
          </>
      }
    </div>
  );
}
