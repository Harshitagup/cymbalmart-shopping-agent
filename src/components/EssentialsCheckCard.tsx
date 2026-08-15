import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Plus,
  Check,
  X,
  AlertCircle,
  Sparkles,
  ShoppingBag,
  CheckCircle2,
} from 'lucide-react';
import { PartyPlan, ShoppingItem, MissingEssentialItem } from '../types';
import { checkMissingEssentials, formatCurrency } from '../utils/calculator';

interface EssentialsCheckCardProps {
  plan: PartyPlan;
  items: ShoppingItem[];
  onAddItem: (item: ShoppingItem) => void;
}

export function EssentialsCheckCard({
  plan,
  items,
  onAddItem,
}: EssentialsCheckCardProps) {
  const [missingItems, setMissingItems] = useState<MissingEssentialItem[]>([]);
  const [ignoredIds, setIgnoredIds] = useState<Record<string, boolean>>({});
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const detected = checkMissingEssentials(plan, items);
    setMissingItems(detected);
  }, [plan, items]);

  const activeMissing = missingItems.filter((i) => !ignoredIds[i.id] && !addedIds[i.id]);

  if (activeMissing.length === 0) {
    return (
      <div
        id="essentials-check-passed-card"
        className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-xs"
      >
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-emerald-950">
              Host Essentials Check Complete: All Crucial Supplies Accounted For!
            </h4>
            <p className="text-xs text-emerald-700 mt-0.5">
              Cups, ice, tableware, trash bags, and event supplies are all present in your cart.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleAdd = (missing: MissingEssentialItem) => {
    const newItem: ShoppingItem = {
      id: `essential-${Date.now()}-${missing.id}`,
      name: missing.name,
      category: missing.category,
      quantity: 1,
      unit: missing.unit,
      estimatedPrice: missing.estimatedPrice,
      aisle: missing.aisle,
      brandType: 'cymbal_brand',
      notes: `Essential supply: ${missing.reason}`,
      priority: missing.priority,
      isAlreadyOwned: false,
      isPurchased: false,
      shoppingStatus: 'to_buy',
    };

    onAddItem(newItem);
    setAddedIds((prev) => ({ ...prev, [missing.id]: true }));
  };

  const handleIgnore = (id: string) => {
    setIgnoredIds((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <div
      id="essentials-check-card"
      className="bg-amber-50/80 border border-amber-300 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-200/70 flex items-center justify-center text-amber-900 shrink-0">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="font-bold text-sm text-amber-950">
                AI Missing Essentials Check ({activeMissing.length} potential gaps detected)
              </h4>
              <span className="bg-amber-200/80 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Prevent Forgotten Supplies
              </span>
            </div>
            <p className="text-xs text-amber-800 mt-0.5">
              We checked your menu and venue against CymbalMart party hosting checklists:
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
        {activeMissing.map((item) => (
          <div
            key={item.id}
            id={`essential-item-${item.id}`}
            className="bg-white rounded-xl p-3 border border-amber-200 shadow-2xs flex flex-col justify-between space-y-2"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <span className="font-bold text-xs text-zinc-900 leading-snug">
                  {item.name}
                </span>
                <span className="text-xs font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md shrink-0">
                  {formatCurrency(item.estimatedPrice)}
                </span>
              </div>
              <p className="text-[11px] text-zinc-600 mt-1 leading-normal">
                {item.reason} ({item.aisle})
              </p>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-1 border-t border-zinc-100">
              <button
                id={`ignore-essential-btn-${item.id}`}
                type="button"
                onClick={() => handleIgnore(item.id)}
                className="text-[11px] font-medium text-zinc-500 hover:text-zinc-700 px-2 py-1 rounded-md hover:bg-zinc-100 transition-colors"
              >
                Already have at home
              </button>
              <button
                id={`add-essential-btn-${item.id}`}
                type="button"
                onClick={() => handleAdd(item)}
                className="text-[11px] font-bold bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-1 rounded-lg flex items-center space-x-1 shadow-xs transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>Add to Cart</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
