import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';

@Injectable({
  providedIn: 'root',
})
export class LocalStorageService {
  private readonly encryptionKey = 'your-secure-encryption-key';
  private encryptionEnabled = false;

  /** Enable or disable encryption for values written by this service. */
  setEncryptionEnabled(enabled: boolean): void {
    this.encryptionEnabled = enabled;
  }

  /** Return whether this service currently encrypts values before storing them. */
  isEncryptionEnabled(): boolean {
    return this.encryptionEnabled;
  }

  setItem(key: string, value: unknown, location: 'local' | 'session' = 'local'): void {
    const serializedValue = JSON.stringify(value);
    const storedValue = this.encryptionEnabled
      ? CryptoJS.AES.encrypt(serializedValue, this.encryptionKey).toString()
      : serializedValue;

    const target = location === 'session' ? sessionStorage : localStorage;
    const other = location === 'session' ? localStorage : sessionStorage;
    other.removeItem(key);
    target.setItem(key, storedValue);
  }

  getItem<T>(key: string): T | null {
    const storedValue = sessionStorage.getItem(key) ?? localStorage.getItem(key);
    if (storedValue === null) {
      return null;
    }

    try {
      return this.parseStoredValue<T>(storedValue);
    } catch (error) {
      console.error('Error reading data from localStorage:', error);
      return null;
    }
  }

  removeItem(key: string): void {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  }

  clearAll(): void {
    localStorage.clear();
    sessionStorage.clear();
  }

  private parseStoredValue<T>(storedValue: string): T {
    if (!this.encryptionEnabled) {
      try {
        return JSON.parse(storedValue) as T;
      } catch {
        return this.decrypt<T>(storedValue);
      }
    }

    try {
      return this.decrypt<T>(storedValue);
    } catch {
      // Allow encrypted mode to read values written while encryption was disabled.
      return JSON.parse(storedValue) as T;
    }
  }

  private decrypt<T>(storedValue: string): T {
    const bytes = CryptoJS.AES.decrypt(storedValue, this.encryptionKey);
    const decryptedValue = bytes.toString(CryptoJS.enc.Utf8);
    if (!decryptedValue) {
      throw new Error('Unable to decrypt localStorage value.');
    }

    return JSON.parse(decryptedValue) as T;
  }
}
