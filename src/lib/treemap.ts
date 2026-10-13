// Squarified treemap (Bruls, Huizing, van Wijk). Pure function so it can be unit-tested.

export interface TreemapItem { id: string; value: number }
export interface TreemapRect { id: string; x: number; y: number; w: number; h: number }

function worst(row: number[], side: number): number {
  const sum = row.reduce((a, b) => a + b, 0);
  const max = Math.max(...row);
  const min = Math.min(...row);
  return Math.max((side * side * max) / (sum * sum), (sum * sum) / (side * side * min));
}

/** Lay items out inside a width x height box. Items with value <= 0 are dropped. Largest first. */
export function squarify(items: TreemapItem[], width: number, height: number): TreemapRect[] {
  const valid = items.filter((item) => Number.isFinite(item.value) && item.value > 0).sort((a, b) => b.value - a.value);
  const total = valid.reduce((sum, item) => sum + item.value, 0);
  if (!valid.length || total <= 0 || width <= 0 || height <= 0) return [];
  const scale = (width * height) / total;
  const areas = valid.map((item) => ({ id: item.id, area: item.value * scale }));
  const out: TreemapRect[] = [];
  let x = 0, y = 0, w = width, h = height;
  let i = 0;
  while (i < areas.length) {
    const side = Math.min(w, h);
    let end = i + 1;
    const row = [areas[i].area];
    while (end < areas.length && worst([...row, areas[end].area], side) <= worst(row, side)) {
      row.push(areas[end].area);
      end++;
    }
    const rowArea = row.reduce((a, b) => a + b, 0);
    if (w >= h) { // lay the row as a column on the left
      const colW = rowArea / h;
      let cy = y;
      for (let k = 0; k < row.length; k++) {
        const rh = row[k] / colW;
        out.push({ id: areas[i + k].id, x, y: cy, w: colW, h: rh });
        cy += rh;
      }
      x += colW; w -= colW;
    } else { // lay the row along the top
      const rowH = rowArea / w;
      let cx = x;
      for (let k = 0; k < row.length; k++) {
        const rw = row[k] / rowH;
        out.push({ id: areas[i + k].id, x: cx, y, w: rw, h: rowH });
        cx += rw;
      }
      y += rowH; h -= rowH;
    }
    i = end;
  }
  return out;
}
