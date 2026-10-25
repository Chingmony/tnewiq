export const VIEWS = ['home', 'latest', 'topics', 'explore', 'bookmarks', 'settings'] as const
export type View = (typeof VIEWS)[number]
