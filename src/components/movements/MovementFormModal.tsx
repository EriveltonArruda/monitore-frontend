"use client";

import { X, ArrowUpRight, ArrowDownLeft, Wrench, Boxes, Building, ChevronDown } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as Select from '@radix-ui/react-select';

// Tipos para os dados que o modal recebe
type Product = { id: number; name: string; salePrice: number; };
type Supplier = { id: number; name: string; };

type MovementFormModalProps = {
  onClose: () => void;
  products: Product[];
  suppliers: Supplier[];
};

export function MovementFormModal({ onClose, products, suppliers }: MovementFormModalProps) {
  const router = useRouter();

  // --- ESTADO DO COMPONENTE ---
  const [selectedType, setSelectedType] = useState('ENTRADA');
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- FUNÇÕES DE MANIPULAÇÃO ---
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(event.currentTarget);

    // --- LÓGICA DE COLETA DE DADOS ATUALIZADA ---
    // Coletamos os dados do formulário e os preparamos para a API.
    const dataToSend = {
      productId: parseInt(formData.get('productId') as string, 10),
      type: selectedType,
      quantity: parseInt(formData.get('quantity') as string, 10),
      unitPriceAtMovement: parseFloat(formData.get('unitPrice') as string),
      details: formData.get('motivo') as string,
      relatedParty: formData.get('relatedParty') as string, // Campo dinâmico para cliente ou fornecedor
      notes: formData.get('observacoes') as string,
      document: formData.get('document') as string,
    };

    // Validação simples no frontend
    if (!dataToSend.productId || !dataToSend.type || !dataToSend.quantity || !dataToSend.details) {
      setError('Produto, Tipo, Quantidade e Motivo são obrigatórios.');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/stock-movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha ao registrar movimentação.');
      }

      router.refresh();
      onClose();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProductChange = (value: string) => {
    const productId = parseInt(value, 10);
    const product = products.find(p => p.id === productId) || null;
    setUnitPrice(product?.salePrice || 0);
  };

  // --- RENDERIZAÇÃO DO COMPONENTE ---
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            {selectedType === 'ENTRADA' && <ArrowUpRight className="text-green-500" />}
            {selectedType === 'SAIDA' && <ArrowDownLeft className="text-red-500" />}
            {selectedType === 'AJUSTE' && <Wrench className="text-blue-500" />}
            <h2 className="text-2xl font-bold text-gray-800">Nova Movimentação</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
          {/* Linha 1: Produto e Tipo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <label htmlFor="productId" className="block text-sm font-medium text-gray-700 mb-1">Produto *</label>
              <select name="productId" id="productId" required onChange={(e) => handleProductChange(e.target.value)} className="w-full appearance-none border border-gray-300 rounded-md shadow-sm p-2 pl-10 bg-white">
                <option value="">Selecione um produto</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 pt-6"><Boxes size={20} className="text-gray-400" /></div>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 pt-6"><ChevronDown size={20} className="text-gray-400" /></div>
            </div>
            {/* ... o resto do formulário usa a mesma lógica ... */}
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">Tipo de Movimentação *</label>
              <Select.Root value={selectedType} onValueChange={setSelectedType}>
                {/* O 'name' aqui não é necessário pois controlamos o valor com o estado 'selectedType' */}
                <Select.Trigger className="w-full h-[42px] flex items-center justify-between border border-gray-300 rounded-md shadow-sm px-3 bg-white text-left">
                  <Select.Value asChild>
                    <div className="flex items-center gap-3">
                      {selectedType === 'ENTRADA' && <ArrowUpRight className="text-green-500" size={20} />}
                      {selectedType === 'SAIDA' && <ArrowDownLeft className="text-red-500" size={20} />}
                      {selectedType === 'AJUSTE' && <Wrench className="text-blue-500" size={20} />}
                      <span>{selectedType.charAt(0) + selectedType.slice(1).toLowerCase()}</span>
                    </div>
                  </Select.Value>
                  <Select.Icon><ChevronDown size={20} className="text-gray-400" /></Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content className="bg-white rounded-md shadow-lg border border-gray-200 w-[--radix-select-trigger-width] z-[60]">
                    <Select.Viewport className="p-1">
                      <Select.Item value="ENTRADA" className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-100 cursor-pointer outline-none"><ArrowUpRight className="text-green-500" size={20} /><Select.ItemText>Entrada</Select.ItemText></Select.Item>
                      <Select.Item value="SAIDA" className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-100 cursor-pointer outline-none"><ArrowDownLeft className="text-red-500" size={20} /><Select.ItemText>Saída</Select.ItemText></Select.Item>
                      <Select.Item value="AJUSTE" className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-100 cursor-pointer outline-none"><Wrench className="text-blue-500" size={20} /><Select.ItemText>Ajuste</Select.ItemText></Select.Item>
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
            </div>
          </div>

          {/* Linha 2: Quantidade e Preços */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">{selectedType === 'AJUSTE' ? 'Nova Quantidade *' : 'Quantidade *'}</label>
              <input type="number" name="quantity" id="quantity" required min="1" value={quantity} onChange={e => setQuantity(parseInt(e.target.value, 10) || 0)} className="w-full border border-gray-300 rounded-md shadow-sm p-2" />
            </div>
            <div>
              <label htmlFor="unitPrice" className="block text-sm font-medium text-gray-700 mb-1">Preço Unitário</label>
              <input type="number" name="unitPrice" id="unitPrice" step="0.01" value={unitPrice} onChange={e => setUnitPrice(parseFloat(e.target.value) || 0)} className="w-full border border-gray-300 rounded-md shadow-sm p-2" />
            </div>
            <div>
              <label htmlFor="totalPrice" className="block text-sm font-medium text-gray-700 mb-1">Valor Total</label>
              <input type="text" name="totalPrice" id="totalPrice" disabled value={`R$ ${(unitPrice * quantity).toFixed(2).replace('.', ',')}`} className="w-full border border-gray-200 rounded-md shadow-sm p-2 bg-gray-100" />
            </div>
          </div>

          {/* Linha 3: Motivo */}
          <div>
            <label htmlFor="motivo" className="block text-sm font-medium text-gray-700 mb-1">Motivo *</label>
            <input type="text" name="motivo" id="motivo" required placeholder="Ex: Compra do Fornecedor X, Venda para Cliente Y" className="w-full border border-gray-300 rounded-md shadow-sm p-2" />
          </div>

          {/* Linha 4: Campos Dinâmicos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              {selectedType === 'ENTRADA' && (
                <label htmlFor="relatedParty" className="block text-sm font-medium text-gray-700 mb-1">Fornecedor</label>
              )}
              {(selectedType === 'SAIDA' || selectedType === 'AJUSTE') && (
                <label htmlFor="relatedParty" className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
              )}
              <input type="text" name="relatedParty" id="relatedParty" placeholder={selectedType === 'ENTRADA' ? 'Nome do fornecedor' : 'Nome do cliente'} className="w-full border border-gray-300 rounded-md shadow-sm p-2" />
            </div>
            <div>
              <label htmlFor="document" className="block text-sm font-medium text-gray-700 mb-1">Documento de Referência</label>
              <input type="text" name="document" id="document" placeholder="Nº da NF, pedido, etc." className="w-full border border-gray-300 rounded-md shadow-sm p-2" />
            </div>
          </div>

          {/* Linha 5: Observações */}
          <div>
            <label htmlFor="observacoes" className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
            <textarea name="observacoes" id="observacoes" rows={3} placeholder="Observações adicionais sobre a movimentação" className="w-full border border-gray-300 rounded-md shadow-sm p-2"></textarea>
          </div>

          {error && <p className="text-red-500 text-sm mt-4">{error}</p>}

          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 mt-6">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="py-2 px-4 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-100">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="py-2 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-blue-300">
              {isSubmitting ? 'Registrando...' : 'Registrar Movimentação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
