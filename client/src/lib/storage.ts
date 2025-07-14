import { PGPKeyPair } from './pgp';

export interface StoredKeyPair extends PGPKeyPair {
  id: string;
  nickname?: string;
}

export interface ContactKey {
  id: string;
  name: string;
  email: string;
  publicKey: string;
  keyId: string;
  created: Date;
  nickname?: string;
}

const STORAGE_KEYS = {
  KEY_PAIRS: 'pgp_key_pairs',
  CONTACT_KEYS: 'pgp_contact_keys',
  SETTINGS: 'pgp_settings'
};

export class PGPStorage {
  private static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  static saveKeyPair(keyPair: PGPKeyPair, nickname?: string): string {
    const stored: StoredKeyPair = {
      ...keyPair,
      id: this.generateId(),
      nickname
    };

    const existing = this.getKeyPairs();
    existing.push(stored);
    
    localStorage.setItem(STORAGE_KEYS.KEY_PAIRS, JSON.stringify(existing));
    return stored.id;
  }

  static getKeyPairs(): StoredKeyPair[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.KEY_PAIRS);
      if (!stored) return [];
      
      return JSON.parse(stored).map((kp: any) => ({
        ...kp,
        keyInfo: {
          ...kp.keyInfo,
          created: new Date(kp.keyInfo.created)
        }
      }));
    } catch {
      return [];
    }
  }

  static getKeyPair(id: string): StoredKeyPair | null {
    const keyPairs = this.getKeyPairs();
    return keyPairs.find(kp => kp.id === id) || null;
  }

  static deleteKeyPair(id: string): boolean {
    const keyPairs = this.getKeyPairs();
    const filtered = keyPairs.filter(kp => kp.id !== id);
    
    if (filtered.length < keyPairs.length) {
      localStorage.setItem(STORAGE_KEYS.KEY_PAIRS, JSON.stringify(filtered));
      return true;
    }
    return false;
  }

  static saveContactKey(contactKey: Omit<ContactKey, 'id'>): string {
    const stored: ContactKey = {
      ...contactKey,
      id: this.generateId()
    };

    const existing = this.getContactKeys();
    existing.push(stored);
    
    localStorage.setItem(STORAGE_KEYS.CONTACT_KEYS, JSON.stringify(existing));
    return stored.id;
  }

  static getContactKeys(): ContactKey[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CONTACT_KEYS);
      if (!stored) return [];
      
      return JSON.parse(stored).map((ck: any) => ({
        ...ck,
        created: new Date(ck.created)
      }));
    } catch {
      return [];
    }
  }

  static getContactKey(id: string): ContactKey | null {
    const contactKeys = this.getContactKeys();
    return contactKeys.find(ck => ck.id === id) || null;
  }

  static deleteContactKey(id: string): boolean {
    const contactKeys = this.getContactKeys();
    const filtered = contactKeys.filter(ck => ck.id !== id);
    
    if (filtered.length < contactKeys.length) {
      localStorage.setItem(STORAGE_KEYS.CONTACT_KEYS, JSON.stringify(filtered));
      return true;
    }
    return false;
  }

  static clearAllData(): void {
    localStorage.removeItem(STORAGE_KEYS.KEY_PAIRS);
    localStorage.removeItem(STORAGE_KEYS.CONTACT_KEYS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
  }

  static exportBackup(): string {
    return JSON.stringify({
      keyPairs: this.getKeyPairs(),
      contactKeys: this.getContactKeys(),
      exportDate: new Date().toISOString()
    });
  }

  static importBackup(backupData: string): { success: boolean; error?: string } {
    try {
      const data = JSON.parse(backupData);
      
      if (data.keyPairs) {
        localStorage.setItem(STORAGE_KEYS.KEY_PAIRS, JSON.stringify(data.keyPairs));
      }
      
      if (data.contactKeys) {
        localStorage.setItem(STORAGE_KEYS.CONTACT_KEYS, JSON.stringify(data.contactKeys));
      }
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Invalid backup format' 
      };
    }
  }

  static getStorageStats(): {
    keyPairCount: number;
    contactKeyCount: number;
    storageSize: string;
  } {
    const keyPairs = this.getKeyPairs();
    const contactKeys = this.getContactKeys();
    
    // Calculate approximate storage size
    const allData = localStorage.getItem(STORAGE_KEYS.KEY_PAIRS) + 
                   localStorage.getItem(STORAGE_KEYS.CONTACT_KEYS) + 
                   localStorage.getItem(STORAGE_KEYS.SETTINGS);
    
    const sizeInBytes = new Blob([allData || '']).size;
    const sizeInKB = (sizeInBytes / 1024).toFixed(1);
    
    return {
      keyPairCount: keyPairs.length,
      contactKeyCount: contactKeys.length,
      storageSize: `${sizeInKB} KB`
    };
  }
}
