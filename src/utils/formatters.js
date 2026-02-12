export function formatDate(isoStr) {
  const d = new Date(isoStr);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function formatTime(date) {
  return new Date(date).toLocaleString();
}

export function truncateText(text, maxLength = 200) {
  if (!text) return '';
  return text.substring(0, maxLength).replace(/\n/g, ' ').trim();
}
