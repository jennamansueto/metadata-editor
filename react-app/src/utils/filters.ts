// Port of Vue global filters from index_vuetify.php lines 137-155

export function truncate(text: string, stop: number, clamp = '...'): string {
  return text.slice(0, stop) + (stop < text.length ? clamp : '');
}

export function formatKB(val: number): number {
  return Math.floor(val / 1024);
}

export function formatMB(val: number): string {
  return (val / (1024 * 1024)).toFixed(2);
}

export function formatKBMB(val: number): string {
  if (val < 1024 * 1024) {
    return Math.floor(val / 1024) + ' KB';
  }
  return (val / (1024 * 1024)).toFixed(2) + ' MB';
}
