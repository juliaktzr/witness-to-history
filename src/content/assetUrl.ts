/**
 * Content authors write image links either as full URLs (https://...) or as
 * site-relative paths like "images/rev_1775_boycott/broadside.jpg" for files
 * stored in public/. The site is served from a subpath on GitHub Pages, so
 * relative paths are prefixed with Vite's BASE_URL.
 */
export function assetUrl(src: string): string {
  if (/^(https?:)?\/\//i.test(src) || src.startsWith('data:') || src.startsWith('blob:')) return src
  const base = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : import.meta.env.BASE_URL + '/'
  return base + src.replace(/^\.?\//, '')
}
