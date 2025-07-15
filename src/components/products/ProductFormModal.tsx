// CORREÇÃO: A função handleSubmit foi refatorada com um bloco if/else explícito.
"use client";

import { X } from 'lucide-react';
import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Tipos para os dados que o modal recebe
type Category = { id: number; name: string; };
type Supplier = { id: number; name: string; };

// O tipo Product completo, correspondente ao que o ProductPageClient envia
type Product = {
  id: number; name: string; sku: string | null; description: string | null;
  stockQuantity: number; minStockQuantity: number; salePrice: number;
  costPrice: number | null; location: string | null; status: string;
  categoryId: number | null; supplierId: number | null;
};

type ProductFormModalProps = {
  onClose: () => void;
  onSuccess: () => void;
  categories: Category[];
  suppliers: Supplier[];
  productToEdit?: Product | null;
};

export function ProductFormModal({ onClose, onSuccess, categories, suppliers, productToEdit }: ProductFormModalProps) {
  const isEditMode = Boolean(productToEdit);

  const [formData, setFormData] = useState({
    name: '', sku: '', description: '', categoryId: '', status: 'ATIVO',
    stockQuantity: 0, minStockQuantity: 10, salePrice: 0, costPrice: 0,
    supplierId: '', location: '',
  });

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
        salePrice: productToEdit.salePrice || 0,
        costPrice: productToEdit.costPrice || 0,
        supplierId: String(productToEdit.supplierId || ''),
        location: productToEdit.location || '',
      });
    }
  }, [isEditMode, productToEdit]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
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
      salePrice: parseFloat(String(formData.salePrice)),
      costPrice: formData.costPrice ? parseFloat(String(formData.costPrice)) : undefined,
    };

    try {
      let response;
      if (isEditMode) {
        if (!productToEdit) {
          throw new Error("Erro: Produto para edição não foi encontrado.");
        }
        const url = `http://localhost:3001/products/${productToEdit.id}`;
        response = await fetch(url, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataToSend),
        });
      } else {
        const url = 'http://localhost:3001/products';
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataToSend),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha ao salvar produto.');
      }

      onSuccess();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nome do Produto *</label>
              <input type="text" id="name" value={formData.name} onChange={handleChange} required placeholder="Digite o nome do produto" className="w-full border border-gray-300 rounded-md shadow-sm p-2" />
            </div>
            <div>
              <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-1">SKU *</label>
              <input type="text" id="sku" value={formData.sku} onChange={handleChange} required placeholder="Código único do produto" className="w-full border border-gray-300 rounded-md shadow-sm p-2" />
            </div>
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <textarea id="description" value={formData.description} onChange={handleChange} rows={3} placeholder="Descrição detalhada do produto" className="w-full border border-gray-300 rounded-md shadow-sm p-2"></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
              <select id="categoryId" name="categoryId" value={formData.categoryId} onChange={handleChange} required className="w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white">
                <option value="">Selecione uma categoria</option>
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select id="status" name="status" value={formData.status} onChange={handleChange} className="w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white">
                <option value="ATIVO">Ativo</option>
                <option value="INATIVO">Inativo</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="stockQuantity" className="block text-sm font-medium text-gray-700 mb-1">Estoque Atual</label>
              <input type="number" id="stockQuantity" name="stockQuantity" value={formData.stockQuantity} onChange={handleChange} className="w-full border border-gray-300 rounded-md shadow-sm p-2" />
            </div>
            <div>
              <label htmlFor="minStockQuantity" className="block text-sm font-medium text-gray-700 mb-1">Estoque Mínimo</label>
              <input type="number" id="minStockQuantity" name="minStockQuantity" value={formData.minStockQuantity} onChange={handleChange} className="w-full border border-gray-300 rounded-md shadow-sm p-2" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="salePrice" className="block text-sm font-medium text-gray-700 mb-1">Preço de Venda *</label>
              <input type="number" id="salePrice" name="salePrice" value={formData.salePrice} onChange={handleChange} step="0.01" required className="w-full border border-gray-300 rounded-md shadow-sm p-2" />
            </div>
            <div>
              <label htmlFor="costPrice" className="block text-sm font-medium text-gray-700 mb-1">Preço de Custo</label>
              <input type="number" id="costPrice" name="costPrice" value={formData.costPrice} onChange={handleChange} step="0.01" className="w-full border border-gray-300 rounded-md shadow-sm p-2" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="supplierId" className="block text-sm font-medium text-gray-700 mb-1">Fornecedor</label>
              <select id="supplierId" name="supplierId" value={formData.supplierId} onChange={handleChange} className="w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white">
                <option value="">Selecione um fornecedor</option>
                {suppliers.map(sup => <option key={sup.id} value={sup.id}>{sup.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">Localização</label>
              <input type="text" id="location" name="location" value={formData.location} onChange={handleChange} placeholder="Localização no estoque" className="w-full border border-gray-300 rounded-md shadow-sm p-2" />
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 mt-6">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="py-2 px-4 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-100">
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting} className="py-2 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-blue-300">
              {isSubmitting ? 'Salvando...' : (isEditMode ? 'Salvar Alterações' : 'Criar Produto')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
