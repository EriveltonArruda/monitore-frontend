// components/nfe-imports/NfeUploadModal.tsx
'use client';

import { useState, ChangeEvent } from 'react';
import { X } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001';

type Props = {
  onClose: () => void;
  onSuccess: () => void;
};

export function NfeUploadModal({ onClose, onSuccess }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
  };

  const submit = async () => {
    if (!file) {
      setError('Selecione um arquivo XML.');
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      // ✅ endpoint correto no backend: POST /nfe-imports/upload
      const res = await fetch(`${API_BASE}/nfe-imports/upload`, {
        method: 'POST',
        body: fd,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Falha ao importar XML');
      }
      onSuccess();
    } catch (e: any) {
      setError(e?.message || 'Erro ao importar XML');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-lg">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Importar XML de NF-e</h2>
          <button className="text-gray-500 hover:text-gray-700" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <input type="file" accept=".xml,text/xml" onChange={onFile} />
          {error && <div className="text-sm text-red-600">{error}</div>}
        </div>

        <div className="flex justify-end gap-2 p-4 border-t">
          <button className="px-3 py-2 border rounded-md" onClick={onClose} disabled={uploading}>
            Cancelar
          </button>
          <button
            className="px-3 py-2 rounded-md bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:bg-emerald-300"
            onClick={submit}
            disabled={uploading}
          >
            {uploading ? 'Importando...' : 'Importar'}
          </button>
        </div>
      </div>
    </div>
  );
}
