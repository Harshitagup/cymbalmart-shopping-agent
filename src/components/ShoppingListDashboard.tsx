import React, { useState, useMemo } from 'react';
import {
  ShoppingBag,
  CheckCircle2,
  Circle,
  Home,
  Plus,
  Trash2,
  Search,
  Filter,
  Lightbulb,
  DollarSign,
  Store,
  Tag,
  AlertCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  BadgePercent,
  Check,
  TrendingDown,
  Navigation,
  ArrowRight,
} from 'lucide-react';
import { ShoppingItem, ItemCategory, PartyPlan } from '../types';
import { CATEGORY_METADATA } from '../data/presets';
import { calculateBudgetMetrics, formatCurrency } from '../utils/calculator';

interface ShoppingListDashboardProps {
  plan: PartyPlan;
  items: ShoppingItem[];
  onUpdateItems: (updated: ShoppingItem[]) => void;
  onOpenAddItem: () => void;
  onProceedToRefine?: () => void;
}

export const ShoppingListDashboard: React.FC<ShoppingListDashboardProps> = ({
  plan,
  items,
  onUpdateItems,
  onOpenAddItem,
  onProceedToRefine,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'to_buy' | 'purchased' | 'pantry'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [groupByAisle, setGroupByAisle] = useState<boolean>(true);
  const [expandedTips, setExpandedTips] = useState<Record<string, boolean>>({});

  const metrics = calculateBudgetMetrics(items, plan.targetBudget, plan.guestCount);
  const isOverBudget = metrics.isOverBudget;
  const budgetRatio = plan.targetBudget > 0 ? (metrics.totalEstimatedCost / plan.targetBudget) * 100 : 0;

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Category filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }
      // Status filter
      if (selectedStatus === 'to_buy' && (item.isPurchased || item.isAlreadyOwned)) {
        return false;
      }
      if (selectedStatus === 'purchased' && !item.isPurchased) {
        return false;
      }
      if (selectedStatus === 'pantry' && !item.isAlreadyOwned) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesNotes = item.notes?.toLowerCase().includes(query);
        const matchesAisle = item.aisle?.toLowerCase().includes(query);
        if (!matchesName && !matchesNotes && !matchesAisle) return false;
      }
      return true;
    });
  }, [items, selectedCategory, selectedStatus, searchQuery]);

  // Group items by Aisle/Department
  const groupedByAisles = useMemo(() => {
    const map = new Map<string, ShoppingItem[]>();
    filteredItems.forEach((item) => {
      const aisle = item.aisle || 'General Aisles';
      if (!map.has(aisle)) {
        map.set(aisle, []);
      }
      map.get(aisle)!.push(item);
    });
    return Array.from(map.entries());
  }, [filteredItems]);

  // Toggle item purchased
  const handleTogglePurchased = (id: string) => {
    const updated = items.map((item) => {
      if (item.id === id) {
        return { ...item, isPurchased: !item.isPurchased };
      }
      return item;
    });
    onUpdateItems(updated);
  };

  // Toggle item in pantry / already owned
  const handleTogglePantry = (id: string) => {
    const updated = items.map((item) => {
      if (item.id === id) {
        const isOwned = !item.isAlreadyOwned;
        return {
          ...item,
          isAlreadyOwned: isOwned,
          isPurchased: isOwned ? false : item.isPurchased,
        };
      }
      return item;
    });
    onUpdateItems(updated);
  };

  // 1-Click Auto Align to Budget
  const handleAutoAlignBudget = () => {
    // 1. Swap national brands to Cymbal Choice
    // 2. If still over, set optional items to pantry or reduce non-essential quantities
    let currentCost = metrics.totalEstimatedCost;
    const target = plan.targetBudget;
    
    let updated = items.map((item) => {
      if (item.cymbalBrandSwap && !item.isAlreadyOwned) {
        const saving = item.cymbalBrandSwap.savings * (item.quantity || 1);
        currentCost -= saving;
        return {
          ...item,
          name: item.cymbalBrandSwap.brandName,
          estimatedPrice: item.cymbalBrandSwap.price,
          brandType: 'cymbal_brand' as const,
          cymbalBrandSwap: undefined,
          notes: `${item.notes ? item.notes + ' ' : ''}(Swapped to Cymbal Choice store value brand)`,
        };
      }
      return item;
    });

    if (currentCost > target) {
      // Mark optional decor or entertainment as optional/pantry
      updated = updated.map((item) => {
        if (currentCost > target && item.priority === 'optional' && !item.isAlreadyOwned) {
          const itemCost = item.estimatedPrice * (item.quantity || 1);
          currentCost -= itemCost;
          return { ...item, isAlreadyOwned: true, notes: 'Auto-marked as already owned/pantry to balance budget' };
        }
        return item;
      });
    }

    onUpdateItems(updated);
  };

  // Apply single store brand swap
  const handleApplyBrandSwap = (id: string) => {
    const updated = items.map((item) => {
      if (item.id === id && item.cymbalBrandSwap) {
        return {
          ...item,
          name: item.cymbalBrandSwap.brandName,
          estimatedPrice: item.cymbalBrandSwap.price,
          brandType: 'cymbal_brand' as const,
          cymbalBrandSwap: undefined,
          notes: `${item.notes ? item.notes + ' ' : ''}(Swapped to Cymbal Choice)`,
        };
      }
      return item;
    });
    onUpdateItems(updated);
  };

  // Modify quantity
  const handleQuantityChange = (id: string, delta: number) => {
    const updated = items.map((item) => {
      if (item.id === id) {
        const newQty = Math.max(1, (item.quantity || 1) + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    });
    onUpdateItems(updated);
  };

  // Delete item
  const handleDeleteItem = (id: string) => {
    const updated = items.filter((item) => item.id !== id);
    onUpdateItems(updated);
  };

  const toggleTip = (id: string) => {
    setExpandedTips((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div id="shopping-list-dashboard" className="space-y-4">
      {/* CUJ Task 2: Budget Alignment & Variance Banner */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Spend vs Budget summary */}
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                Task 2: Review List & Align with Budget
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                  isOverBudget
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                }`}
              >
                {isOverBudget
                  ? `Over Budget by ${formatCurrency(Math.abs(metrics.variance))}`
                  : `Within Budget (${formatCurrency(metrics.variance)} buffer)`}
              </span>
            </div>

            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <div className="flex items-baseline space-x-1.5">
                <span className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
                  {formatCurrency(metrics.totalEstimatedCost)}
                </span>
                <span className="text-xs text-zinc-500 font-semibold">
                  cart total / {formatCurrency(plan.targetBudget)} target
                </span>
              </div>

              <div className="text-xs text-zinc-600 font-medium">
                ~<strong>{formatCurrency(metrics.costPerGuest)}</strong> / guest ({plan.guestCount} guests)
              </div>

              {metrics.alreadyOwnedSavings > 0 && (
                <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Pantry Savings: -{formatCurrency(metrics.alreadyOwnedSavings)}
                </div>
              )}
            </div>

            {/* Budget Bar Meter */}
            <div className="mt-3 w-full">
              <div className="w-full h-2.5 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200">
                <div
                  className={`h-full transition-all duration-300 rounded-full ${
                    isOverBudget ? 'bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500' : 'bg-emerald-600'
                  }`}
                  style={{ width: `${Math.min(100, budgetRatio)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Right: Auto-Align Action & Add Item */}
          <div className="flex items-center space-x-2 shrink-0">
            {isOverBudget && (
              <button
                type="button"
                id="btn-auto-align-budget"
                onClick={handleAutoAlignBudget}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold text-xs shadow-xs transition-colors cursor-pointer"
                title="Automatically swap to Cymbal Choice store brands and trim to fit target budget"
              >
                <TrendingDown className="w-4 h-4" />
                <span>1-Click Align to Budget</span>
              </button>
            )}

            <button
              onClick={onOpenAddItem}
              id="btn-add-item-modal"
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Custom Item</span>
            </button>

            {onProceedToRefine && (
              <button
                onClick={onProceedToRefine}
                id="btn-proceed-to-refine"
                className="inline-flex items-center space-x-1 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <span>Proceed to Refine & Checkout</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Filter / Search Row */}
        <div className="mt-4 pt-4 border-t border-zinc-100 flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Search */}
          <div className="relative w-full md:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search items, aisles, or notes..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white text-xs font-medium text-zinc-900"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-1 overflow-x-auto w-full md:w-auto text-xs">
            <button
              onClick={() => setSelectedStatus('all')}
              className={`px-3 py-1 rounded-lg font-medium cursor-pointer transition-all ${
                selectedStatus === 'all' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              All Items ({items.length})
            </button>
            <button
              onClick={() => setSelectedStatus('to_buy')}
              className={`px-3 py-1 rounded-lg font-medium cursor-pointer transition-all ${
                selectedStatus === 'to_buy' ? 'bg-emerald-700 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              To Buy ({metrics.totalItemsCount - metrics.pantryItemsCount})
            </button>
            <button
              onClick={() => setSelectedStatus('pantry')}
              className={`px-3 py-1 rounded-lg font-medium cursor-pointer transition-all ${
                selectedStatus === 'pantry' ? 'bg-amber-600 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              In Pantry ({metrics.pantryItemsCount})
            </button>
          </div>

          {/* Grouping Toggle */}
          <button
            type="button"
            onClick={() => setGroupByAisle(!groupByAisle)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center space-x-1.5 transition-colors cursor-pointer ${
              groupByAisle ? 'bg-emerald-50 text-emerald-900 border-emerald-300' : 'bg-zinc-50 text-zinc-600 border-zinc-200'
            }`}
          >
            <Navigation className="w-3.5 h-3.5 text-emerald-700" />
            <span>{groupByAisle ? 'Grouped by CymbalMart Aisle' : 'Flat List'}</span>
          </button>
        </div>
      </div>

      {/* Category Pills Bar */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-zinc-900 text-white shadow-xs'
              : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50'
          }`}
        >
          All Departments ({items.length})
        </button>

        {Object.entries(CATEGORY_METADATA).map(([catKey, meta]) => {
          const count = items.filter((i) => i.category === catKey).length;
          if (count === 0) return null;
          const isSelected = selectedCategory === catKey;
          return (
            <button
              key={catKey}
              onClick={() => setSelectedCategory(catKey)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap flex items-center space-x-1.5 border cursor-pointer ${
                isSelected
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                  : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50'
              }`}
            >
              <span>{meta.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isSelected ? 'bg-emerald-200 text-emerald-950' : 'bg-zinc-100 text-zinc-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Item Rendering (Aisle-Grouped or Flat) */}
      {filteredItems.length === 0 ? (
        <div className="bg-white p-10 text-center rounded-2xl border border-zinc-200">
          <ShoppingBag className="w-9 h-9 text-zinc-300 mx-auto mb-2" />
          <h3 className="font-bold text-zinc-800 text-sm">No items found matching your filters</h3>
          <p className="text-xs text-zinc-500 mt-1">Try resetting filters or searching for another item.</p>
        </div>
      ) : groupByAisle ? (
        <div className="space-y-4">
          {groupedByAisles.map(([aisleName, aisleItems]) => (
            <div key={aisleName} className="space-y-2">
              <div className="flex items-center space-x-2 px-1">
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                  📍 {aisleName}
                </span>
                <span className="text-xs text-zinc-500 font-medium">({aisleItems.length} items)</span>
              </div>

              <div className="space-y-2">
                {aisleItems.map((item) => renderItemCard(item))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredItems.map((item) => renderItemCard(item))}
        </div>
      )}
    </div>
  );

  function renderItemCard(item: ShoppingItem) {
    const catMeta = CATEGORY_METADATA[item.category] || CATEGORY_METADATA['food_sides_snacks'];
    const itemTotal = (item.quantity || 1) * (item.estimatedPrice || 0);
    const isTipExpanded = Boolean(expandedTips[item.id]);
    const isCymbalBrand = item.brandType === 'cymbal_brand';

    return (
      <div
        key={item.id}
        id={`item-row-${item.id}`}
        className={`bg-white rounded-xl border transition-all p-3 sm:p-4 ${
          item.isPurchased
            ? 'border-emerald-200 bg-emerald-50/25 opacity-85'
            : item.isAlreadyOwned
            ? 'border-amber-200 bg-amber-50/20'
            : 'border-zinc-200 hover:border-zinc-300 shadow-2xs'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Left Checkbox + Item Info */}
          <div className="flex items-start space-x-3 flex-1 min-w-0">
            <button
              type="button"
              id={`check-item-${item.id}`}
              onClick={() => handleTogglePurchased(item.id)}
              disabled={item.isAlreadyOwned}
              className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center transition-colors shrink-0 cursor-pointer ${
                item.isAlreadyOwned
                  ? 'cursor-not-allowed opacity-40 text-zinc-300'
                  : item.isPurchased
                  ? 'bg-emerald-600 text-white'
                  : 'border border-zinc-300 bg-white hover:border-zinc-400 text-transparent'
              }`}
              title={item.isAlreadyOwned ? 'Item is in home pantry' : 'Mark as checked off'}
            >
              <CheckCircle2 className="w-4 h-4" />
            </button>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5 mb-1">
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${catMeta.color}`}>
                  {catMeta.label}
                </span>

                {item.aisle && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 border border-zinc-200">
                    {item.aisle}
                  </span>
                )}

                {isCymbalBrand ? (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Cymbal Choice Brand
                  </span>
                ) : (
                  <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-600">
                    National Brand
                  </span>
                )}

                {item.priority === 'must_have' ? (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-200">
                    Must-Have
                  </span>
                ) : (
                  <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-500">
                    {item.priority.replace(/_/g, ' ')}
                  </span>
                )}
              </div>

              {/* Name & Unit */}
              <div className="flex items-baseline space-x-2">
                <span
                  className={`text-sm font-bold tracking-tight text-zinc-900 ${
                    item.isPurchased ? 'line-through text-zinc-400' : item.isAlreadyOwned ? 'text-zinc-500' : ''
                  }`}
                >
                  {item.name}
                </span>
                <span className="text-xs text-zinc-500 font-medium">({item.unit})</span>
              </div>

              {/* Notes */}
              {item.notes && <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{item.notes}</p>}

              {/* Cymbal Brand Swap Suggestion Banner */}
              {item.cymbalBrandSwap && !item.isAlreadyOwned && (
                <div className="mt-1.5 inline-flex items-center space-x-2 bg-emerald-50 border border-emerald-300 px-2.5 py-1 rounded-lg text-xs text-emerald-900">
                  <BadgePercent className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span>
                    Swap to <strong>{item.cymbalBrandSwap.brandName}</strong> & save{' '}
                    <strong>{formatCurrency(item.cymbalBrandSwap.savings * (item.quantity || 1))}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleApplyBrandSwap(item.id)}
                    className="ml-1 text-[10px] font-bold bg-emerald-700 hover:bg-emerald-800 text-white px-2 py-0.5 rounded cursor-pointer transition-colors"
                  >
                    Apply Swap
                  </button>
                </div>
              )}

              {/* Alternative tip expand */}
              {item.alternativeOrBulkTip && (
                <button
                  onClick={() => toggleTip(item.id)}
                  className="mt-1 inline-flex items-center space-x-1 text-[11px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer"
                >
                  <Lightbulb className="w-3 h-3 text-amber-600" />
                  <span>Cymbal Smart Savings Tip</span>
                  {isTipExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              )}

              {isTipExpanded && item.alternativeOrBulkTip && (
                <div className="mt-2 p-2.5 rounded-lg bg-amber-50/70 border border-amber-200 text-xs text-amber-900 leading-normal">
                  💡 <strong>Host Tip:</strong> {item.alternativeOrBulkTip}
                </div>
              )}
            </div>
          </div>

          {/* Right Controls: Pantry Toggle, Quantity, Price, Delete */}
          <div className="flex items-center justify-between sm:justify-end space-x-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-100">
            {/* Pantry Toggle */}
            <button
              type="button"
              id={`pantry-toggle-${item.id}`}
              onClick={() => handleTogglePantry(item.id)}
              className={`inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                item.isAlreadyOwned
                  ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-2xs ring-1 ring-amber-400'
                  : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-600 border-zinc-200'
              }`}
              title="Toggle if you already have this at home in your pantry"
            >
              <Home className="w-3.5 h-3.5" />
              <span>{item.isAlreadyOwned ? 'In Pantry ($0)' : 'I Have This'}</span>
            </button>

            {/* Quantity Stepper */}
            <div className="flex items-center space-x-1 bg-zinc-100 p-0.5 rounded-lg border border-zinc-200">
              <button
                type="button"
                onClick={() => handleQuantityChange(item.id, -1)}
                className="w-6 h-6 rounded bg-white hover:bg-zinc-50 text-zinc-700 flex items-center justify-center font-bold text-xs cursor-pointer"
              >
                -
              </button>
              <span className="text-xs font-bold text-zinc-900 w-5 text-center">{item.quantity}</span>
              <button
                type="button"
                onClick={() => handleQuantityChange(item.id, 1)}
                className="w-6 h-6 rounded bg-white hover:bg-zinc-50 text-zinc-700 flex items-center justify-center font-bold text-xs cursor-pointer"
              >
                +
              </button>
            </div>

            {/* Line Cost */}
            <div className="text-right min-w-[70px]">
              {item.isAlreadyOwned ? (
                <div>
                  <span className="text-xs font-bold text-emerald-700 block">$0.00</span>
                  <span className="text-[10px] text-zinc-400 line-through">{formatCurrency(itemTotal)}</span>
                </div>
              ) : (
                <div>
                  <span className="text-xs font-bold text-zinc-900 block">{formatCurrency(itemTotal)}</span>
                  <span className="text-[10px] text-zinc-500">~{formatCurrency(item.estimatedPrice)}/ea</span>
                </div>
              )}
            </div>

            {/* Delete */}
            <button
              type="button"
              onClick={() => handleDeleteItem(item.id)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              title="Remove item"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }
};
