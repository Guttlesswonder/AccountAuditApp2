import type { TermsAttachmentMeta } from '../../types';

export type StoredTermsAttachment = {
  meta: TermsAttachmentMeta;
  file: Blob;
};

export interface TermsAttachmentStore {
  put(accountId: string, file: File): Promise<TermsAttachmentMeta>;
  get(accountId: string): Promise<StoredTermsAttachment | null>;
  remove(accountId: string): Promise<void>;
}
