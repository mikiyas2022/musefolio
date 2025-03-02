// Polyfill for 'global' in browser environment
if (typeof window !== 'undefined') {
  (window as any).global = window;
}

// Adding an empty export to make this a module
export {}; 