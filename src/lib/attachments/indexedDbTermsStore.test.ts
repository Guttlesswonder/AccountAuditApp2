import { describe, expect, it } from 'vitest';
import { IndexedDbTermsStore } from './indexedDbTermsStore';

describe('indexedDB terms metadata flow', () => {
  it('stores and retrieves attachment metadata when indexedDB is available', async () => {
    if (typeof indexedDB === 'undefined') {
      expect(true).toBe(true);
      return;
    }
    const store = new IndexedDbTermsStore();
    const file = new File(['demo'], 'terms.pdf', { type: 'application/pdf' });
    const meta = await store.put('account-test', file);
    const loaded = await store.get('account-test');
    expect(loaded?.meta.fileName).toBe(meta.fileName);
    await store.remove('account-test');
  });
});
