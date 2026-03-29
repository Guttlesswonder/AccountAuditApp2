import type { TermsAttachmentMeta } from '../types';

export function TermsAttachmentPanel({ attachment, onUpload, onOpen, onRemove }: { attachment: TermsAttachmentMeta | null | undefined; onUpload: (file: File) => void; onOpen: () => void; onRemove: () => void; }) {
  return (
    <div className="card space-y-2">
      <p className="text-xs text-amber-700">Terms PDF is stored locally in this browser only for v1.1.</p>
      <input type="file" accept="application/pdf" onChange={(e) => { const file = e.target.files?.[0]; if (file) onUpload(file); }} />
      {attachment && <div className="text-sm"><div>{attachment.fileName}</div><div>{Math.round(attachment.fileSize / 1024)} KB</div><div>Uploaded {new Date(attachment.uploadedAt).toLocaleString()}</div><div className="flex gap-2 mt-2"><button className="btn-outline" onClick={onOpen}>Open PDF</button><button className="btn-outline" onClick={onRemove}>Remove PDF</button></div></div>}
    </div>
  );
}
