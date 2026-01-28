/// <reference types="chrome" />

// Unified storage abstraction for browser extension and web contexts

const isExtension = typeof chrome !== 'undefined' && !!chrome.storage?.sync;

export interface StorageData {
  'translingual-source-lang': string;
  'translingual-target-lang': string;
}

type StorageKey = keyof StorageData;

// Get a value from storage
export async function getStorageItem<K extends StorageKey>(
  key: K,
  defaultValue: StorageData[K]
): Promise<StorageData[K]> {
  if (isExtension) {
    return new Promise((resolve) => {
      chrome.storage.sync.get({ [key]: defaultValue }, (result) => {
        resolve(result[key] as StorageData[K]);
      });
    });
  }
  const value = localStorage.getItem(key);
  return (value ?? defaultValue) as StorageData[K];
}

// Set a value in storage
export async function setStorageItem<K extends StorageKey>(
  key: K,
  value: StorageData[K]
): Promise<void> {
  if (isExtension) {
    return new Promise((resolve) => {
      chrome.storage.sync.set({ [key]: value }, resolve);
    });
  }
  localStorage.setItem(key, value);
}

// Get multiple values at once
export async function getStorageItems<K extends StorageKey>(
  keys: { [P in K]: StorageData[P] }
): Promise<{ [P in K]: StorageData[P] }> {
  if (isExtension) {
    return new Promise((resolve) => {
      chrome.storage.sync.get(keys, (result) => {
        resolve(result as { [P in K]: StorageData[P] });
      });
    });
  }
  const result = {} as { [P in K]: StorageData[P] };
  for (const key of Object.keys(keys) as K[]) {
    const value = localStorage.getItem(key);
    result[key] = (value ?? keys[key]) as StorageData[K];
  }
  return result;
}

// Listen for storage changes (extension only, returns cleanup function)
export function onStorageChange(
  callback: (changes: Partial<StorageData>) => void
): () => void {
  if (isExtension) {
    const listener = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      const parsed: Partial<StorageData> = {};
      for (const [key, change] of Object.entries(changes)) {
        if (['translingual-source-lang', 'translingual-target-lang'].includes(key)) {
          (parsed as Record<string, string>)[key] = change.newValue as string;
        }
      }
      if (Object.keys(parsed).length > 0) {
        callback(parsed);
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }
  
  // Web: listen for localStorage changes from other tabs
  const handler = (e: StorageEvent) => {
    if (e.key && ['translingual-source-lang', 'translingual-target-lang'].includes(e.key)) {
      callback({ [e.key]: e.newValue } as Partial<StorageData>);
    }
  };
  window.addEventListener('storage', handler);
  return () => window.removeEventListener('storage', handler);
}

// Check if running as extension
export function isRunningAsExtension(): boolean {
  return isExtension;
}
