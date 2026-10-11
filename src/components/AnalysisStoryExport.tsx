'use client';

import { useEffect, useRef, useState } from 'react';
import { Download, ImagePlus, Loader2, X } from 'lucide-react';
import type { AnalysisV2 } from '@/lib/analysis/core';
import { buildAnalysisStory } from '@/lib/analysis/story';
import { drawAnalysisStory } from '@/lib/analysis/story-canvas';
import { useLanguage } from '@/context/LanguageContext';

export default function AnalysisStoryExport({ result }: { result: AnalysisV2 }) {
  const { language } = useLanguage();
  const copy = (id: string, en: string) => language === 'id' ? id : en;
  const dialog = useRef<HTMLDialogElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!open || !dialog.current) return;
    const element = dialog.current;
    element.showModal();
    let cancelled = false;
    const bodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    void document.fonts.ready.then(() => {
      if (cancelled || !canvas.current) return;
      try {
        drawAnalysisStory(canvas.current, buildAnalysisStory(result, language), getComputedStyle(element).fontFamily);
        setReady(true);
      } catch {
        setError(copy('Pratinjau gagal dibuat. Tutup lalu coba lagi.', 'Could not create the preview. Close and try again.'));
      }
    });
    return () => { cancelled = true; element.close(); document.body.style.overflow = bodyOverflow; };
  // Copy is local text rather than an effect dependency.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, result, language]);
  async function download() {
    if (!canvas.current || !ready || saving) return;
    setSaving(true); setError('');
    try {
      const blob = await new Promise<Blob>((resolve, reject) => canvas.current!.toBlob(value =>
        value ? resolve(value) : reject(new Error('PNG unavailable')), 'image/png'));
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url; anchor.download = buildAnalysisStory(result, language).filename;
      document.body.appendChild(anchor); anchor.click(); anchor.remove();
      // Allow browsers (including mobile) to start consuming the download.
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch {
      setError(copy('Gambar gagal diunduh. Coba lagi.', 'Could not download the image. Try again.'));
    } finally { setSaving(false); }
  }
  return <>
    <button type="button" className="terminal-story-button" onClick={() => { setReady(false); setError(''); setOpen(true); }}>
      <ImagePlus size={16} aria-hidden="true" />{copy('Buat Story', 'Create Story')}
    </button>
    {open && <dialog ref={dialog} className="terminal-story-dialog" aria-label={copy('Pratinjau kartu story', 'Story card preview')}
      onCancel={() => setOpen(false)} onClose={() => setOpen(false)}>
      <header><h3>{copy('Kartu Story Trenova', 'Trenova Story Card')}</h3>
        <button type="button" autoFocus className="terminal-icon-button" onClick={() => setOpen(false)} aria-label={copy('Tutup pratinjau', 'Close preview')}><X size={18} /></button>
      </header>
      <div className="terminal-story-dialog-body">
        <canvas ref={canvas} className="terminal-story-preview" width={1080} height={1920} role="img"
          aria-label={copy('Kartu ringkasan hasil analisis. Angka dan pemicu ditampilkan pada laporan di belakang pratinjau.', 'Analysis summary card. Values and triggers are available in the report behind this preview.')} />
        <div className="terminal-story-copy">
          <h4>{copy('Siap untuk story kamu.', 'Ready for your story.')}</h4>
          <p>{copy('Unduh gambar, lalu unggah ke story Instagram, WhatsApp, atau platform pilihanmu.', 'Download the image, then upload it to Instagram, WhatsApp or your preferred platform.')}</p>
          <p>1080 × 1920 · PNG · 9:16</p>
          <p>{copy('Memakai laporan ini tanpa analisis ulang atau token tambahan. Identitas akun dan catatan pribadi tidak disertakan.', 'Uses this report without running another analysis or spending credits. Account details and private notes are excluded.')}</p>
          {!ready && !error && <p role="status" className="flex items-center gap-2"><Loader2 size={16} className="animate-spin" />{copy('Menyiapkan gambar…', 'Preparing image…')}</p>}
          {error && <p role="alert">{error}</p>}
          <button type="button" className="terminal-story-button" disabled={!ready || saving} onClick={download}>
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}{copy('Unduh PNG', 'Download PNG')}
          </button>
        </div>
      </div>
    </dialog>}
  </>;
}
