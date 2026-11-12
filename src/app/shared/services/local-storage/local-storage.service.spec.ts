import { TestBed } from '@angular/core/testing';

import { LocalStorageService } from './local-storage.service';

describe('LocalStorageService', () => {
  let service: LocalStorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LocalStorageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('encrypts values by default', () => {
    service.setItem('test-key', { value: 'secret' });

    expect(localStorage.getItem('test-key')).not.toBe(JSON.stringify({ value: 'secret' }));
    expect(service.getItem<{ value: string }>('test-key')).toEqual({ value: 'secret' });
  });

  it('supports disabling encryption', () => {
    service.setEncryptionEnabled(false);
    service.setItem('test-key', { value: 'plain' });

    expect(service.isEncryptionEnabled()).toBeFalse();
    expect(localStorage.getItem('test-key')).toBe(JSON.stringify({ value: 'plain' }));
    expect(service.getItem<{ value: string }>('test-key')).toEqual({ value: 'plain' });
  });

  it('reads values written before switching encryption modes', () => {
    service.setItem('test-key', { value: 'encrypted' });
    service.setEncryptionEnabled(false);

    expect(service.getItem<{ value: string }>('test-key')).toEqual({ value: 'encrypted' });
  });
});
