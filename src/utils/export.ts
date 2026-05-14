export function downloadSvg(svgContent: string, filename = 'diagram.svg') {
  const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  triggerDownload(url, filename);
  URL.revokeObjectURL(url);
}

export async function downloadPng(svgContent: string, filename = 'diagram.png') {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');

  const img = new Image();
  const svgBlob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = url;
  });

  // Scale 2x for retina
  const scale = 2;
  canvas.width = img.naturalWidth * scale || img.width * scale;
  canvas.height = img.naturalHeight * scale || img.height * scale;
  ctx.scale(scale, scale);
  ctx.drawImage(img, 0, 0);
  URL.revokeObjectURL(url);

  canvas.toBlob((blob) => {
    if (!blob) return;
    const pngUrl = URL.createObjectURL(blob);
    triggerDownload(pngUrl, filename);
    URL.revokeObjectURL(pngUrl);
  }, 'image/png');
}

export async function downloadSvgParts(svgs: string[], baseName = 'diagram') {
  for (let i = 0; i < svgs.length; i++) {
    if (i > 0) await new Promise<void>((r) => setTimeout(r, 300));
    downloadSvg(svgs[i], `${baseName}_${i + 1}.svg`);
  }
}

export async function downloadPngParts(svgs: string[], baseName = 'diagram') {
  for (let i = 0; i < svgs.length; i++) {
    if (i > 0) await new Promise<void>((r) => setTimeout(r, 300));
    await downloadPng(svgs[i], `${baseName}_${i + 1}.png`);
  }
}

function triggerDownload(url: string, filename: string) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
