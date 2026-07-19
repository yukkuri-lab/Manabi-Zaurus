/** Build an asset URL that works on localhost and GitHub Pages subpaths. */
export const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`
