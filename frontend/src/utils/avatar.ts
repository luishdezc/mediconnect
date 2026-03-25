const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api')
  .replace('/api', '');

export const resolveAvatar = (url: string | undefined | null): string | undefined => {
  if (!url) return undefined;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
};
