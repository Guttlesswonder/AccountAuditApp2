import type { StoredTermsAttachment, TermsAttachmentStore } from './types';

const DB_NAME = 'strategic-account-audit-terms-db';
const STORE_NAME = 'terms-attachments';
const VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export class IndexedDbTermsStore implements TermsAttachmentStore {
  async put(accountId: string, file: File) {
    const db = await openDb();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const meta = { id: crypto.randomUUID(), fileName: file.name, fileSize: file.size, uploadedAt: new Date().toISOString() };
    store.put({ meta, file }, accountId);
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = reject;
    });
    return meta;
  }

  async get(accountId: string): Promise<StoredTermsAttachment | null> {
    const db = await openDb();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(accountId);
    return new Promise((resolve, reject) => {
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => reject(req.error);
    });
  }

  async remove(accountId: string): Promise<void> {
    const db = await openDb();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(accountId);
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = reject;
    });
  }
}
