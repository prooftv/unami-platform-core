import { apiFetch, type ApiConfig } from '../http';

export interface EvidenceRecord {
  id: string;
  momentId: string;
  title: string;
  fileType: 'image' | 'document' | 'pdf';
  storageP: string;
  publicUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  createdAt: string;
}

export interface UploadEvidenceInput {
  momentId: string;
  title: string;
  file: File;
}

export function createEvidenceClient(config: ApiConfig) {
  return {
    list(momentId: string): Promise<EvidenceRecord[]> {
      return apiFetch(config, `/evidence?moment_id=${momentId}`);
    },

    upload(input: UploadEvidenceInput): Promise<EvidenceRecord> {
      const fd = new FormData();
      fd.append('moment_id', input.momentId);
      fd.append('title', input.title);
      fd.append('file', input.file);
      return apiFetch(config, '/evidence', { method: 'POST', body: fd });
    },
  };
}

// Public (anon) — read-only
export function createPublicEvidenceClient(config: ApiConfig) {
  return {
    list(momentId: string): Promise<EvidenceRecord[]> {
      return apiFetch(config, `/evidence?moment_id=${momentId}`);
    },
  };
}
