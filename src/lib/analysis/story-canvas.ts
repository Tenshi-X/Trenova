import type { AnalysisStory } from './story';

export const STORY_WIDTH = 1080;
export const STORY_HEIGHT = 1920;
const colors = { gold: '#f0c060', red: '#ef7777', green: '#68ce98', muted: '#d8d8d8' };

/** Draws the same canvas shown in the preview and exported as a PNG. */
export function drawAnalysisStory(canvas: HTMLCanvasElement, story: AnalysisStory, fontFamily = 'monospace') {
  canvas.width = STORY_WIDTH; canvas.height = STORY_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');
  const copy = (id: string, en: string) => story.language === 'id' ? id : en;
  const font = (size: number, weight = 400) => { ctx.font = `${weight} ${size}px ${fontFamily}`; };
  const text = (value: string, x: number, y: number, size = 28, color = '#d8d8d8', weight = 400) => {
    font(size, weight); ctx.fillStyle = color; ctx.textAlign = 'left'; ctx.fillText(value, x, y);
  };
  const line = (y: number, color = '#2a2a2a') => {
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(80, y); ctx.lineTo(1000, y); ctx.stroke();
  };
  const fit = (value: string, x: number, y: number, width: number, size: number, color: string, weight = 700, align: CanvasTextAlign = 'left') => {
    font(size, weight);
    while (ctx.measureText(value).width > width && size > 16) { size--; font(size, weight); }
    ctx.fillStyle = color; ctx.textAlign = align; ctx.fillText(value, x, y); ctx.textAlign = 'left';
  };
  const paragraph = (value: string, x: number, y: number, width: number, size: number, maxLines: number) => {
    font(size);
    const lines: string[] = [];
    let current = '';
    for (const word of value.replace(/\s+/g, ' ').trim().split(' ')) {
      if (ctx.measureText(word).width > width) {
        // Only break within a word if it cannot fit on an empty line.
        if (current) { lines.push(current); current = ''; }
        for (const character of word) {
          if (current && ctx.measureText(current + character).width > width) { lines.push(current); current = ''; }
          current += character;
        }
      } else {
        const next = current ? `${current} ${word}` : word;
        if (current && ctx.measureText(next).width > width) { lines.push(current); current = word; }
        else current = next;
      }
    }
    if (current) lines.push(current.trim());
    const visible = lines.slice(0, maxLines);
    if (lines.length > maxLines) {
      let last = visible[maxLines - 1];
      while (ctx.measureText(last + '…').width > width) last = last.slice(0, -1);
      visible[maxLines - 1] = last + '…';
    }
    visible.forEach((value, index) => text(value, x, y + index * (size + 12), size, '#b8b8b8'));
  };
  ctx.fillStyle = '#0a0a0a'; ctx.fillRect(0, 0, STORY_WIDTH, STORY_HEIGHT);
  ctx.strokeStyle = '#b8902f'; ctx.lineWidth = 2; ctx.strokeRect(32, 32, 1016, 1856);
  text('TRENOVA', 80, 144, 64, '#f0c060', 700);
  text('TERMINAL INSIGHT', 82, 195, 25, '#929292');
  line(244, '#5b4826');
  fit(story.symbol, 80, 344, 920, 62, '#ededed');
  text([story.timeframe, story.marketType].filter(Boolean).join(' · '), 82, 405, 28, '#a0a0a0');
  fit(story.title, 80, 520, 920, 76, '#f0c060');
  font(27, 700);
  const badgeWidth = Math.min(920, ctx.measureText(story.status).width + 40);
  ctx.strokeStyle = '#d4a843'; ctx.strokeRect(80, 550, badgeWidth, 54);
  text(story.status, 100, 587, 27, '#f0c060', 700);
  fit(story.subtitle, 80, 654, 920, 28, '#b8b8b8', 400);
  text(copy('RINGKASAN RENCANA', 'PLAN SUMMARY'), 80, 733, 22, '#929292');
  if (story.rows.length) {
    story.rows.forEach((row, index) => {
      const y = 816 + index * 106;
      line(y + 34);
      text(row.label, 80, y, 30, '#a0a0a0');
      fit(row.value, 1000, y, 730, 42, colors[row.tone], 700, 'right');
    });
    text(copy('Harga dalam USDT · R:R sebelum biaya/slippage', 'Prices in USDT · R:R before fees/slippage'), 80, 1352, 23, '#929292');
    text(copy('PEMICU MASUK', 'ENTRY TRIGGER'), 80, 1426, 23, '#f0c060', 700);
    paragraph(story.trigger || copy('Lihat laporan lengkap untuk konfirmasi entry.', 'See the full report to confirm entry.'), 80, 1468, 920, 26, 3);
    text(copy('BATALKAN RENCANA JIKA', 'CANCEL THE PLAN IF'), 80, 1596, 23, '#f0c060', 700);
    paragraph(story.invalidation || copy('Lihat batas rencana pada laporan lengkap.', 'See the invalidation rules in the full report.'), 80, 1638, 920, 26, 2);
  } else {
    text(copy('BELUM ADA ZONA ENTRY', 'NO ENTRY ZONE YET'), 80, 830, 36, '#f0c060', 700);
    paragraph(story.reason, 80, 900, 920, 32, 7);
    text(copy('TUNGGU KONFIRMASI', 'WAIT FOR CONFIRMATION'), 80, 1300, 25, '#f0c060', 700);
    paragraph(story.trigger || copy('Belum ada pemicu entry pada laporan ini.', 'No entry trigger is available in this report.'), 80, 1358, 920, 30, 7);
  }
  line(1740, '#5b4826');
  fit(story.asOf, 80, 1790, 920, 26, '#a0a0a0', 400);
  fit(story.source, 80, 1832, 920, 23, '#f0c060', 400);
  text(copy('Ringkasan · Lihat laporan lengkap · Bukan jaminan hasil', 'Summary · See full report · Results are not guaranteed'), 80, 1867, 21, '#929292');
}
