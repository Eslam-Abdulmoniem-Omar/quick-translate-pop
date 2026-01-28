/// <reference types="chrome" />
// Cross-platform storage abstraction
// Works in both web (localStorage) and extension (chrome.storage.sync) contexts

// Type guard for chrome extension environment
const isExtension = typeof chrome !== 'undefined' && 
  typeof chrome.storage !== 'undefined' && 
  typeof chrome.storage.sync !== 'undefined';

export const storage = {
  async get(key: string): Promise<string | null> {
    if (isExtension) {
      return new Promise((resolve) => {
        chrome.storage.sync.get([key], (result: Record<string, string>) => {
          resolve(result[key] || null);
        });
      });
    }
    return localStorage.getItem(key);
  },

  async set(key: string, value: string): Promise<void> {
    if (isExtension) {
      return new Promise((resolve) => {
        chrome.storage.sync.set({ [key]: value }, () => resolve());
      });
    }
    localStorage.setItem(key, value);
  },

  async remove(key: string): Promise<void> {
    if (isExtension) {
      return new Promise((resolve) => {
        chrome.storage.sync.remove([key], () => resolve());
      });
    }
    localStorage.removeItem(key);
  },

  async getMultiple(keys: string[]): Promise<Record<string, string | null>> {
    if (isExtension) {
      return new Promise((resolve) => {
        chrome.storage.sync.get(keys, (result: Record<string, string>) => {
          const mapped: Record<string, string | null> = {};
          keys.forEach(key => {
            mapped[key] = result[key] || null;
          });
          resolve(mapped);
        });
      });
    }
    
    const result: Record<string, string | null> = {};
    keys.forEach(key => {
      result[key] = localStorage.getItem(key);
    });
    return result;
  },

  async setMultiple(items: Record<string, string>): Promise<void> {
    if (isExtension) {
      return new Promise((resolve) => {
        chrome.storage.sync.set(items, () => resolve());
      });
    }
    
    Object.entries(items).forEach(([key, value]) => {
      localStorage.setItem(key, value);
    });
  }
};

// Type-safe settings helpers
export const settings = {
  async getSourceLanguage(): Promise<string> {
    return (await storage.get('translingual-source-lang')) || 'en';
  },

  async getTargetLanguage(): Promise<string> {
    return (await storage.get('translingual-target-lang')) || 'ar';
  },

  async setSourceLanguage(lang: string): Promise<void> {
    await storage.set('translingual-source-lang', lang);
  },

  async setTargetLanguage(lang: string): Promise<void> {
    await storage.set('translingual-target-lang', lang);
  },

  async getLanguages(): Promise<{ source: string; target: string }> {
    const result = await storage.getMultiple([
      'translingual-source-lang',
      'translingual-target-lang'
    ]);
    return {
      source: result['translingual-source-lang'] || 'en',
      target: result['translingual-target-lang'] || 'ar'
    };
  },

  async setLanguages(source: string, target: string): Promise<void> {
    await storage.setMultiple({
      'translingual-source-lang': source,
      'translingual-target-lang': target
    });
  }
};
