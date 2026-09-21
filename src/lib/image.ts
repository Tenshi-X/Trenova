/**
 * Kompresi gambar di sisi browser (tanpa dependency: FileReader + <canvas>).
 * Dipakai form Feedback supaya lampiran yang di-upload ke Supabase Storage kecil
 * (Storage free tier terbatas, dan bandwidth lebih hemat).
 */

export type CompressedImage = {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  /** Ukuran hasil kompresi (bytes). */
  size: number;
  /** Ukuran file asli (bytes). */
  originalSize: number;
};

export type CompressImageOptions = {
  maxDimension?: number;
  quality?: number;
  /** Jika diisi, kompresi diulang dengan `fallbackSteps` sampai hasil <= maxBytes. */
  maxBytes?: number;
  fallbackSteps?: Array<{ maxDimension: number; quality: number }>;
};

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target?.result as string;
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to read image'));
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read compressed image'));
    reader.readAsDataURL(blob);
  });
}

function canvasToJpegBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Failed to compress image'))),
      'image/jpeg',
      quality
    );
  });
}

function drawToCanvas(img: HTMLImageElement, maxDimension: number): HTMLCanvasElement {
  let width = img.width;
  let height = img.height;

  if (width >= height && width > maxDimension) {
    height = Math.round((height * maxDimension) / width);
    width = maxDimension;
  } else if (height > width && height > maxDimension) {
    width = Math.round((width * maxDimension) / height);
    height = maxDimension;
  }

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, width);
  canvas.height = Math.max(1, height);

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not supported in this browser');

  // Latar putih agar PNG transparan tidak menjadi hitam setelah dikonversi ke JPEG
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  return canvas;
}

/**
 * Kompres file gambar menjadi JPEG.
 * Bila `maxBytes` diberikan, ukuran/quality diturunkan bertahap (beberapa pass)
 * sampai hasilnya masuk di bawah batas tersebut.
 */
export async function compressImageFile(
  file: File,
  options: CompressImageOptions = {}
): Promise<CompressedImage> {
  const { maxDimension = 1600, quality = 0.75, maxBytes, fallbackSteps } = options;

  const img = await loadImageFromFile(file);
  const steps = [{ maxDimension, quality }, ...(fallbackSteps ?? [])];

  let blob: Blob | null = null;
  let width = 0;
  let height = 0;

  for (const step of steps) {
    const canvas = drawToCanvas(img, step.maxDimension);
    blob = await canvasToJpegBlob(canvas, step.quality);
    width = canvas.width;
    height = canvas.height;

    if (!maxBytes || blob.size <= maxBytes) break;
  }

  if (!blob) throw new Error('Failed to compress image');

  return {
    blob,
    dataUrl: await blobToDataUrl(blob),
    width,
    height,
    size: blob.size,
    originalSize: file.size,
  };
}
