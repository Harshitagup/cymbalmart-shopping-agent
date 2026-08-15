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
  SlidersHorizontal,
  ShieldCheck,
  ShieldAlert,
  ShoppingCart,
  Clock,
  Layers,
  Smartphone,
  Vibrate,
  MoveHorizontal,
  Flame,
  Utensils,
  Leaf,
} from 'lucide-react';
import { ShoppingItem, ItemCategory, PartyPlan, ItemShoppingStatus } from '../types';
import { CATEGORY_METADATA } from '../data/presets';
import { calculateBudgetMetrics, formatCurrency } from '../utils/calculator';
import { EssentialsCheckCard } from './EssentialsCheckCard';
import { SwipeableShoppingItemCard } from './SwipeableShoppingItemCard';
import { SmartBudgetOptimizerModal } from './SmartBudgetOptimizerModal';
import { WhatIfSimulatorModal } from './WhatIfSimulatorModal';
import { PartyIdeasModal } from './PartyIdeasModal';
import { DietaryIntelligenceModal } from './DietaryIntelligenceModal';
import { isHapticSupported } from '../utils/haptics';

interface ShoppingListDashboardProps {
  plan: PartyPlan;
  items: ShoppingItem[];
  onUpdateItems: (updated: ShoppingItem[]) => void;
  onOpenAddItem: () => void;
  onProceedToRefine?: () => void;
  onOpenOptimizer?: () => void;
  onOpenWhatIf?: () => void;
  onOpenIdeas?: () => void;
  onOpenDietary?: () => void;
}

export const ShoppingListDashboard: React.FC<ShoppingListDashboardProps> = ({
  plan,
  items,
  onUpdateItems,
  onOpenAddItem,
  onProceedToRefine,
  onOpenOptimizer,
  onOpenWhatIf,
  onOpenIdeas,
  onOpenDietary,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<
    'all' | 'to_buy' | 'in_cart' | 'purchased' | 'pantry'
  >('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [groupByAisle, setGroupByAisle] = useState<boolean>(true);
  const [showEssentialsCard, setShowEssentialsCard] = useState<boolean>(true);

  // Internal modal states
  const [internalOptimizerOpen, setInternalOptimizerOpen] = useState(false);
  const [internalWhatIfOpen, setInternalWhatIfOpen] = useState(false);
  const [internalIdeasOpen, setInternalIdeasOpen] = useState(false);
  const [internalDietaryOpen, setInternalDietaryOpen] = useState(false);

  const metrics = calculateBudgetMetrics(items, plan.targetBudget, plan.guestCount);
  const isOverBudget = metrics.isOverBudget;
  const currencyCode = plan.currencyCode || 'IN';

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Category filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }
      // Status filter
      if (selectedStatus === 'to_buy') {
        const isToBuy = !item.isPurchased && !item.isAlreadyOwned && item.shoppingStatus !== 'in_cart';
        if (!isToBuy) return false;
      }
      if (selectedStatus === 'in_cart' && item.shoppingStatus !== 'in_cart') {
        return false;
      }
      if (selectedStatus === 'purchased' && (!item.isPurchased || item.shoppingStatus !== 'purchased')) {
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

  // Cycle Shopping Status: to_buy -> in_cart -> purchased -> to_buy
  const handleCycleStatus = (id: string) => {
    const updated = items.map((item) => {
      if (item.id === id) {
        if (item.isAlreadyOwned) return item;
        const currentStatus = item.shoppingStatus || (item.isPurchased ? 'purchased' : 'to_buy');
        let nextStatus: ItemShoppingStatus = 'to_buy';
        let isPurchased = false;

        if (currentStatus === 'to_buy') {
          nextStatus = 'in_cart';
          isPurchased = false;
        } else if (currentStatus === 'in_cart') {
          nextStatus = 'purchased';
          isPurchased = true;
        } else {
          nextStatus = 'to_buy';
          isPurchased = false;
        }

        return {
          ...item,
          shoppingStatus: nextStatus,
          isPurchased,
        };
      }
      return item;
    });
    onUpdateItems(updated);
  };

  // Set direct status (e.g. from swipe gestures)
  const handleSetStatus = (id: string, nextStatus: ItemShoppingStatus) => {
    const updated = items.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          shoppingStatus: nextStatus,
          isPurchased: nextStatus === 'purchased',
          isAlreadyOwned: nextStatus === 'already_owned',
        };
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
          shoppingStatus: isOwned ? ('already_owned' as const) : ('to_buy' as const),
          isPurchased: isOwned ? false : item.isPurchased,
        };
      }
      return item;
    });
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

  // Add missing essential item to list
  const handleAddEssentialItem = (newItem: ShoppingItem) => {
    onUpdateItems([...items, newItem]);
  };

  const handleOpenOptimizerModal = () => {
    if (onOpenOptimizer) {
      onOpenOptimizer();
    } else {
      setInternalOptimizerOpen(true);
    }
  };

  const handleOpenWhatIfModal = () => {
    if (onOpenWhatIf) {
      onOpenWhatIf();
    } else {
      setInternalWhatIfOpen(true);
    }
  };

  const handleOpenIdeasModal = () => {
    if (onOpenIdeas) {
      onOpenIdeas();
    } else {
      setInternalIdeasOpen(true);
    }
  };

  const handleOpenDietaryModal = () => {
    if (onOpenDietary) {
      onOpenDietary();
    } else {
      setInternalDietaryOpen(true);
    }
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
                className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                  isOverBudget
                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                }`}
              >
                {isOverBudget
                  ? `Over Budget by ${formatCurrency(Math.abs(metrics.variance), currencyCode)}`
                  : `Within Budget (${formatCurrency(metrics.variance, currencyCode)} buffer)`}
              </span>
            </div>

            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <div className="flex items-baseline space-x-1.5">
                <span className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
                  {formatCurrency(metrics.totalEstimatedCost, currencyCode)}
                </span>
                <span className="text-xs text-zinc-500 font-semibold">
                  cart total / {formatCurrency(plan.targetBudget, currencyCode)} target
                </span>
              </div>

              <div className="text-xs text-zinc-600 font-medium">
                ~<strong>{formatCurrency(metrics.costPerGuest, currencyCode)}</strong> / guest ({plan.guestCount} guests)
              </div>

              {metrics.alreadyOwnedSavings > 0 && (
                <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Pantry Savings: -{formatCurrency(metrics.alreadyOwnedSavings, currencyCode)}
                </div>
              )}
            </div>

            {/* Shopping Progress Bar */}
            <div className="mt-3 space-y-1">
              <div className="flex justify-between text-[11px] font-semibold text-zinc-600">
                <span>
                  Shopping Progress: {metrics.purchasedItemsCount + metrics.pantryItemsCount} of{' '}
                  {metrics.totalItemsCount} accounted for ({metrics.shoppingProgressPercentage}%)
                </span>
                <span className="text-zinc-500">
                  {metrics.itemsInCartCount > 0 && `${metrics.itemsInCartCount} in cart · `}
                  {metrics.toBuyItemsCount} remaining
                </span>
              </div>
              <div className="w-full h-2.5 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200 flex">
                <div
                  className="h-full bg-emerald-600 transition-all duration-300"
                  style={{
                    width: `${
                      metrics.totalItemsCount > 0
                        ? (metrics.purchasedItemsCount / metrics.totalItemsCount) * 100
                        : 0
                    }%`,
                  }}
                  title="Purchased"
                />
                <div
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{
                    width: `${
                      metrics.totalItemsCount > 0
                        ? (metrics.itemsInCartCount / metrics.totalItemsCount) * 100
                        : 0
                    }%`,
                  }}
                  title="In Cart"
                />
                <div
                  className="h-full bg-amber-400 transition-all duration-300"
                  style={{
                    width: `${
                      metrics.totalItemsCount > 0
                        ? (metrics.pantryItemsCount / metrics.totalItemsCount) * 100
                        : 0
                    }%`,
                  }}
                  title="Pantry"
                />
              </div>
            </div>
          </div>

          {/* Right: Smart Budget Optimizer & Quick Actions */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              id="btn-smart-budget-optimizer"
              onClick={handleOpenOptimizerModal}
              className={`inline-flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer ${
                isOverBudget
                  ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                  : 'bg-emerald-700 hover:bg-emerald-800 text-white'
              }`}
              title="Open AI Smart Budget Optimizer for store brand swaps and portion tuning"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isOverBudget ? 'Smart Optimize Budget' : 'Budget Optimizer'}</span>
            </button>

            <button
              onClick={onOpenAddItem}
              id="btn-add-item-modal"
              className="inline-flex items-center space-x-1.5 px-3 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Item</span>
            </button>

            {onProceedToRefine && (
              <button
                onClick={onProceedToRefine}
                id="btn-proceed-to-refine"
                className="inline-flex items-center space-x-1 px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <span>Proceed to Refine & Checkout</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* AI Toolkit Shortcuts Toolbar */}
        <div className="mt-3 pt-3 border-t border-zinc-100 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
            AI Planners & Tools:
          </span>

          <button
            type="button"
            onClick={handleOpenWhatIfModal}
            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-xs font-semibold text-zinc-700 transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
            <span>What-If Simulator</span>
          </button>

          <button
            type="button"
            onClick={handleOpenDietaryModal}
            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-xs font-semibold text-zinc-700 transition-colors cursor-pointer"
          >
            <Leaf className="w-3.5 h-3.5 text-emerald-600" />
            <span>Dietary Intelligence</span>
          </button>

          <button
            type="button"
            onClick={handleOpenIdeasModal}
            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-xs font-semibold text-zinc-700 transition-colors cursor-pointer"
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            <span>Theme Ideas & Activities</span>
          </button>
        </div>

        {/* Filter / Search Row */}
        <div className="mt-3 pt-3 border-t border-zinc-100 flex flex-col md:flex-row gap-3 items-center justify-between">
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
          <div className="flex items-center space-x-1 overflow-x-auto w-full md:w-auto text-xs scrollbar-none">
            <button
              onClick={() => setSelectedStatus('all')}
              className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-all ${
                selectedStatus === 'all'
                  ? 'bg-zinc-900 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              All ({items.length})
            </button>
            <button
              onClick={() => setSelectedStatus('to_buy')}
              className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-all ${
                selectedStatus === 'to_buy'
                  ? 'bg-zinc-800 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              To Buy ({metrics.toBuyItemsCount})
            </button>
            <button
              onClick={() => setSelectedStatus('in_cart')}
              className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-all ${
                selectedStatus === 'in_cart'
                  ? 'bg-blue-700 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              In Cart ({metrics.itemsInCartCount})
            </button>
            <button
              onClick={() => setSelectedStatus('purchased')}
              className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-all ${
                selectedStatus === 'purchased'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              Purchased ({metrics.purchasedItemsCount})
            </button>
            <button
              onClick={() => setSelectedStatus('pantry')}
              className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-all ${
                selectedStatus === 'pantry'
                  ? 'bg-amber-600 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              Pantry ({metrics.pantryItemsCount})
            </button>
          </div>

          {/* Grouping Toggle */}
          <button
            type="button"
            onClick={() => setGroupByAisle(!groupByAisle)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center space-x-1.5 transition-colors cursor-pointer shrink-0 ${
              groupByAisle
                ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                : 'bg-zinc-50 text-zinc-600 border-zinc-200'
            }`}
          >
            <Navigation className="w-3.5 h-3.5 text-emerald-700" />
            <span>{groupByAisle ? 'Grouped by CymbalMart Aisle' : 'Flat List'}</span>
          </button>
        </div>
      </div>

      {/* Category Pills Filter Bar */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap border transition-all cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-emerald-800 text-white border-emerald-900 shadow-2xs'
              : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
          }`}
        >
          All Categories ({items.length})
        </button>

        {Object.entries(CATEGORY_METADATA).map(([key, meta]) => {
          const count = items.filter((i) => i.category === key).length;
          if (count === 0) return null;
          const isSelected = selectedCategory === key;
          return (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={`px-3 py-1.5 rounded-full font-semibold whitespace-nowrap border transition-all cursor-pointer flex items-center space-x-1.5 ${
                isSelected
                  ? 'bg-emerald-800 text-white border-emerald-900 shadow-2xs'
                  : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
              }`}
            >
              <span>{meta.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isSelected ? 'bg-emerald-950 text-emerald-200' : 'bg-zinc-100 text-zinc-600'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Essentials Auto-Check Intelligence Card */}
      {showEssentialsCard && (
        <EssentialsCheckCard
          plan={plan}
          items={items}
          onAddItem={handleAddEssentialItem}
        />
      )}

      {/* Touch & Swipe Gesture Hint Bar with Haptic Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-linear-to-r from-blue-50/70 via-emerald-50/50 to-amber-50/70 border border-zinc-200 text-xs text-zinc-700 shadow-2xs">
        <div className="flex items-center space-x-2">
          <MoveHorizontal className="w-4 h-4 text-emerald-700 shrink-0 animate-pulse" />
          <span className="font-semibold text-zinc-900">
            Touch & Gesture Shortcuts:
          </span>
          <span className="text-zinc-600 hidden sm:inline">
            Swipe <strong className="text-blue-700">Right 👉</strong> to put <strong>In Cart</strong> · Swipe <strong className="text-amber-800">👈 Left</strong> for <strong>Already Have (Pantry)</strong>
          </span>
          <span className="text-zinc-600 sm:hidden text-[11px]">
            👉 Swipe for Cart · 👈 for Pantry
          </span>
        </div>

        <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-emerald-800 bg-white/80 border border-emerald-200 px-2.5 py-0.5 rounded-full">
          <Smartphone className="w-3 h-3 text-emerald-700" />
          <span>{isHapticSupported() ? '📳 Haptic Touch Ready' : 'Touch Haptics Active'}</span>
        </div>
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
                {aisleItems.map((item) => (
                  <SwipeableShoppingItemCard
                    key={item.id}
                    item={item}
                    currencyCode={currencyCode}
                    onCycleStatus={handleCycleStatus}
                    onSetStatus={handleSetStatus}
                    onTogglePantry={handleTogglePantry}
                    onApplyBrandSwap={handleApplyBrandSwap}
                    onQuantityChange={handleQuantityChange}
                    onDeleteItem={handleDeleteItem}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredItems.map((item) => (
            <SwipeableShoppingItemCard
              key={item.id}
              item={item}
              currencyCode={currencyCode}
              onCycleStatus={handleCycleStatus}
              onSetStatus={handleSetStatus}
              onTogglePantry={handleTogglePantry}
              onApplyBrandSwap={handleApplyBrandSwap}
              onQuantityChange={handleQuantityChange}
              onDeleteItem={handleDeleteItem}
            />
          ))}
        </div>
      )}

      {/* Built-in Modals */}
      <SmartBudgetOptimizerModal
        isOpen={internalOptimizerOpen}
        onClose={() => setInternalOptimizerOpen(false)}
        plan={plan}
        onApplyOptimizations={(newItems) => {
          onUpdateItems(newItems);
        }}
      />

      <WhatIfSimulatorModal
        isOpen={internalWhatIfOpen}
        onClose={() => setInternalWhatIfOpen(false)}
        plan={plan}
        onApplyScenario={(updatedPlan) => {
          onUpdateItems(updatedPlan.items);
        }}
      />

      <DietaryIntelligenceModal
        isOpen={internalDietaryOpen}
        onClose={() => setInternalDietaryOpen(false)}
        plan={plan}
        onUpdatePlanDietary={(_newDietary, updatedItems) => {
          onUpdateItems(updatedItems);
        }}
      />

      <PartyIdeasModal
        isOpen={internalIdeasOpen}
        onClose={() => setInternalIdeasOpen(false)}
        plan={plan}
        onAddIdeaItem={(newItem) => {
          onUpdateItems([...items, newItem]);
        }}
      />
    </div>
  );
};
