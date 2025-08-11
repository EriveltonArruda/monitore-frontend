"use client";

import { X } from 'lucide-react';
import { useState, FormEvent, useEffect, ChangeEvent } from 'react';

const API_BASE = 'http://localhost:3001';

type Category = { id: number; name: string; };
type Supplier = { id: number; name: string; };
type Product = {
  id: number; name: string; sku: string | null; description: string | null;
  stockQuantity: number; minStockQuantity: number;
  costPrice: number | null; location: string | null; status: string;
  categoryId: number | null; supplierId: number | null;
  mainImageUrl?: string | null;
};
type ProductFormModalProps = {
  onClose: () => void;
  onSuccess: () => void;
  categories: Category[];
  suppliers: Supplier[];
  productToEdit?: Product | null;
};

export function ProductFormModal({
  onClose,
  onSuccess,
  categories,
  suppliers,
  productToEdit,
}: ProductFormModalProps) {
  const isEditMode = Boolean(productToEdit);

  const [formData, setFormData] = useState({
    name: '', sku: '', description: '', categoryId: '', status: 'ATIVO',
    stockQuantity: 0, minStockQuantity: 10, costPrice: 0,
    supplierId: '', location: '',
    mainImageUrl: '',
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isEditMode && productToEdit) {
      setFormData({
        name: productToEdit.name || '',
        sku: productToEdit.sku || '',
        description: productToEdit.description || '',
        categoryId: String(productToEdit.categoryId || ''),
        status: productToEdit.status || 'ATIVO',
        stockQuantity: productToEdit.stockQuantity || 0,
        minStockQuantity: productToEdit.minStockQuantity || 10,
        costPrice: productToEdit.costPrice || 0,
        supplierId: String(productToEdit.supplierId || ''),
        location: productToEdit.location || '',
        mainImageUrl: productToEdit.mainImageUrl || '',
      });
      if (productToEdit.mainImageUrl) setImagePreview(productToEdit.mainImageUrl);
    }
  }, [isEditMode, productToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    setImageFile(file || null);

    if (file) {
      setImagePreview(URL.createObjectURL(file));
      if (isEditMode && productToEdit) {
        await uploadImageToApi(file, productToEdit.id);
      }
    }
  };

  const uploadImageToApi = async (file: File, productId: number) => {
    setUploading(true);
    setError(null);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      const res = await fetch(`${API_BASE}/products/${productId}/upload-image`, {
        method: 'POST',
        body: formDataUpload,
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({} as any));
        throw new Error(errorData.message || 'Falha ao enviar imagem');
      }
      const data = await res.json();
      setFormData(prev => ({ ...prev, mainImageUrl: data.imageUrl }));
      setImagePreview(data.imageUrl);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!isEditMode || !productToEdit) return;
    if (!formData.mainImageUrl) return;

    if (!confirm('Remover imagem do produto?')) return;

    try {
      const res = await fetch(`${API_BASE}/products/${productToEdit.id}/main-image`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({} as any));
        throw new Error(errorData.message || 'Falha ao remover imagem');
      }

      setFormData(prev => ({ ...prev, mainImageUrl: '' }));
      setImagePreview(null);
      setImageFile(null);
    } catch (err: any) {
      alert(err.message || 'Erro ao remover imagem');
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const dataToSend = {
      ...formData,
      categoryId: parseInt(formData.categoryId, 10),
      supplierId: formData.supplierId ? parseInt(formData.supplierId, 10) : undefined,
      stockQuantity: parseInt(String(formData.stockQuantity), 10),
      minStockQuantity: parseInt(String(formData.minStockQuantity), 10),
      costPrice: formData.costPrice ? parseFloat(String(formData.costPrice)) : undefined,
      mainImageUrl: formData.mainImageUrl || undefined,
    };

    try {
      let response, createdId;
      if (isEditMode) {
        if (!productToEdit) throw new Error('Erro: Produto para edição não foi encontrado.');
        const url = `${API_BASE}/products/${productToEdit.id}`;
        response = await fetch(url, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataToSend),
        });
        createdId = productToEdit.id;
      } else {
        const url = `${API_BASE}/products`;
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataToSend),
        });
        if (response.ok) {
          const product = await response.json();
          createdId = product.id;
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({} as any));
        throw new Error(errorData.message || 'Falha ao salvar produto.');
      }

      // Se criou agora e tem imagem escolhida, envia upload
      if (!isEditMode && createdId && imageFile) {
        await uploadImageToApi(imageFile, createdId);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resolvedPreview =
    imagePreview
      ? (imagePreview.startsWith('/uploads') ? `${API_BASE}${imagePreview}` : imagePreview)
      : (formData.mainImageUrl ? `${API_BASE}${formData.mainImageUrl}` : null);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">
            {isEditMode ? 'Editar Produto' : 'Novo Produto'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {/* Upload + Preview + Remover */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Imagem do Produto</label>
            <div className="flex items-start gap-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="block text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                disabled={isSubmitting || uploading}
              />
              {isEditMode && formData.mainImageUrl && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="block text-sm text-red-500 font-semibold rounded-full border-0 py-2 px-4 bg-gray-100 hover:bg-red-500 hover:text-white"
                  disabled={isSubmitting || uploading}
                  title="Remover imagem"
                >
                  Remover imagem
                </button>
              )}
            </div>

            {resolvedPreview && (
              <div className="mt-2">
                <img
                  src={resolvedPreview}
                  alt="Produto"
                  className="max-h-32 rounded shadow border border-gray-200"
                />
              </div>
            )}
          </div>

          {/* Demais campos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nome do Produto *</label>
              <input type="text" id="name" value={formData.name} onChange={handleChange} required className="w-full border border-gray-300 rounded-md shadow-sm p-2" />
            </div>
            <div>
              <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-1">SKU *</label>
              <input type="text" id="sku" value={formData.sku} onChange={handleChange} required className="w-full border border-gray-300 rounded-md shadow-sm p-2" />
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <textarea id="description" value={formData.description} onChange={handleChange} rows={3} className="w-full border border-gray-300 rounded-md shadow-sm p-2"></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
              <select id="categoryId" value={formData.categoryId} onChange={handleChange} required className="w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white">
                <option value="">Selecione uma categoria</option>
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select id="status" value={formData.status} onChange={handleChange} className="w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white">
                <option value="ATIVO">Ativo</option>
                <option value="INATIVO">Inativo</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="stockQuantity" className="block text-sm font-medium text-gray-700 mb-1">Estoque Atual</label>
              <input
                type="number"
                id="stockQuantity"
                value={formData.stockQuantity}
                readOnly
                disabled
                className="w-full border border-gray-200 rounded-md shadow-sm p-2 bg-gray-100 text-gray-500 cursor-not-allowed"
                tabIndex={-1}
              />
              <span className="text-xs text-gray-400">Só é alterado por movimentações</span>
            </div>
            <div>
              <label htmlFor="minStockQuantity" className="block text-sm font-medium text-gray-700 mb-1">Estoque Mínimo</label>
              <input type="number" id="minStockQuantity" value={formData.minStockQuantity} onChange={handleChange} className="w-full border border-gray-300 rounded-md shadow-sm p-2" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="costPrice" className="block text-sm font-medium text-gray-700 mb-1">Preço de Custo</label>
              <input type="number" id="costPrice" value={formData.costPrice} onChange={handleChange} step="0.01" className="w-full border border-gray-300 rounded-md shadow-sm p-2" />
            </div>
            <div>
              <label htmlFor="supplierId" className="block text-sm font-medium text-gray-700 mb-1">Fornecedor</label>
              <select
                id="supplierId"
                value={formData.supplierId}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white"
              >
                <option value="">Selecione um fornecedor</option>
                {Array.isArray(suppliers)
                  ? suppliers.map(sup => (
                    <option key={sup.id} value={sup.id}>
                      {sup.name}
                    </option>
                  ))
                  : <option disabled>Erro ao carregar fornecedores</option>}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">Localização</label>
            <input type="text" id="location" value={formData.location} onChange={handleChange} className="w-full border border-gray-300 rounded-md shadow-sm p-2" />
          </div>

          {error && <div className="text-red-600 text-sm">{error}</div>}

          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 mt-6">
            <button type="button" onClick={onClose} disabled={isSubmitting || uploading} className="py-2 px-4 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-100">
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting || uploading} className="py-2 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-blue-300">
              {isSubmitting ? 'Salvando...' : (isEditMode ? 'Salvar Alterações' : uploading ? 'Enviando Imagem...' : 'Criar Produto')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
