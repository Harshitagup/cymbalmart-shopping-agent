import React, { useState } from 'react';
import { X, Plus, DollarSign, Store, Tag, Sparkles } from 'lucide-react';
import { ShoppingItem, ItemCategory } from '../types';
import { CATEGORY_METADATA, STORE_OPTIONS } from '../data/presets';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItem: (item: ShoppingItem) => void;
}

export const AddItemModal: React.FC<AddItemModalProps> = ({
  isOpen,
  onClose,
  onAddItem,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ItemCategory>('food_sides_snacks');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('pack');
  const [estimatedPrice, setEstimatedPrice] = useState(10);
  const [targetStore, setTargetStore] = useState('Grocery');
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState<'must_have' | 'nice_to_have' | 'optional'>('must_have');
  const [isAlreadyOwned, setIsAlreadyOwned] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newItem: ShoppingItem = {
      id: `item-custom-${Date.now()}`,
      name: name.trim(),
      category,
      quantity: Number(quantity) || 1,
      unit: unit.trim() || 'item',
      estimatedPrice: Number(estimatedPrice) || 0,
      targetStore,
      notes: notes.trim(),
      priority,
      isAlreadyOwned,
      isPurchased: false,
    };

    onAddItem(newItem);
    setName('');
    setNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-lg w-full border border-zinc-200 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-zinc-100 text-zinc-900">
              <Plus className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-zinc-900">Add Item to Shopping Cart</h3>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
              Item Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Lime Seltzer (12-pack), Compostable Cups, Ice Bag"
              className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 text-xs font-medium text-zinc-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ItemCategory)}
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs font-medium text-zinc-900"
              >
                {Object.entries(CATEGORY_METADATA).map(([key, meta]) => (
                  <option key={key} value={key}>
                    {meta.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                Target Store
              </label>
              <select
                value={targetStore}
                onChange={(e) => setTargetStore(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs font-medium text-zinc-900"
              >
                <option value="Grocery">Local Grocery / Supermarket</option>
                <option value="Costco">Costco Wholesale</option>
                <option value="Target">Target</option>
                <option value="Trader Joe's">Trader Joe's</option>
                <option value="Amazon / Party City">Amazon / Party City</option>
                <option value="Specialty Beverage">Liquor / Beverage Depot</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                Quantity
              </label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value) || 1)}
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs font-medium text-zinc-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                Pack Unit
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g. 12-pack, lb, bag"
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs font-medium text-zinc-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                Unit Price ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.25"
                required
                value={estimatedPrice}
                onChange={(e) => setEstimatedPrice(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs font-medium text-zinc-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs"
              >
                <option value="must_have">Must-Have</option>
                <option value="nice_to_have">Nice-to-Have</option>
                <option value="optional">Optional / Extra</option>
              </select>
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center space-x-2 text-xs font-semibold text-zinc-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAlreadyOwned}
                  onChange={(e) => setIsAlreadyOwned(e.target.checked)}
                  className="rounded border-zinc-300 text-rose-600 focus:ring-rose-500"
                />
                <span>Already in Pantry (Owned)</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
              Notes or Dietary Tag
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Gluten-Free brand only, chilled before serving"
              className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs font-medium text-zinc-900"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-zinc-200 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold shadow-2xs"
            >
              Add Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
