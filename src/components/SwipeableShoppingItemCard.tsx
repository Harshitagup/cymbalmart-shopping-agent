import React, { useState, useRef } from 'react';
import { motion, PanInfo } from 'motion/react';
import {
  Check,
  ShoppingCart,
  Circle,
  Home,
  Trash2,
  BadgePercent,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import { ShoppingItem, ItemShoppingStatus } from '../types';
import { CATEGORY_METADATA } from '../data/presets';
import { formatCurrency } from '../utils/calculator';
import { triggerHaptic } from '../utils/haptics';

interface SwipeableShoppingItemCardProps {
  item: ShoppingItem;
  currencyCode?: string;
  onCycleStatus: (id: string) => void;
  onSetStatus: (id: string, status: ItemShoppingStatus) => void;
  onTogglePantry: (id: string) => void;
  onApplyBrandSwap: (id: string) => void;
  onQuantityChange: (id: string, delta: number) => void;
  onDeleteItem: (id: string) => void;
}

const SWIPE_THRESHOLD = 70;

export const SwipeableShoppingItemCard: React.FC<SwipeableShoppingItemCardProps> = ({
  item,
  currencyCode = 'IN',
  onCycleStatus,
  onSetStatus,
  onTogglePantry,
  onApplyBrandSwap,
  onQuantityChange,
  onDeleteItem,
}) => {
  const [dragOffset, setDragOffset] = useState(0);
  const [isThresholdPassed, setIsThresholdPassed] = useState<'right' | 'left' | null>(null);
  const [isTipExpanded, setIsTipExpanded] = useState(false);
  const [justSwipedAction, setJustSwipedAction] = useState<string | null>(null);

  const prevPassedRef = useRef<'right' | 'left' | null>(null);

  const catMeta = CATEGORY_METADATA[item.category] || CATEGORY_METADATA['food_sides_snacks'];
  const itemTotal = (item.quantity || 1) * (item.estimatedPrice || 0);
  const isCymbalBrand = item.brandType === 'cymbal_brand';
  const status = item.shoppingStatus || (item.isPurchased ? 'purchased' : 'to_buy');

  const handleDrag = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const x = info.offset.x;
    setDragOffset(x);

    let currentPassed: 'right' | 'left' | null = null;
    if (x >= SWIPE_THRESHOLD) {
      currentPassed = 'right';
    } else if (x <= -SWIPE_THRESHOLD) {
      currentPassed = 'left';
    }

    if (currentPassed !== prevPassedRef.current) {
      if (currentPassed) {
        // Just crossed threshold! Provide haptic feedback tick
        triggerHaptic('light');
      }
      prevPassedRef.current = currentPassed;
      setIsThresholdPassed(currentPassed);
    }
  };

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const x = info.offset.x;
    setDragOffset(0);
    setIsThresholdPassed(null);
    prevPassedRef.current = null;

    // Swiped right -> Mark as In Cart
    if (x >= SWIPE_THRESHOLD) {
      if (item.isAlreadyOwned) {
        // If it was already owned, move to in cart
        onTogglePantry(item.id);
        onSetStatus(item.id, 'in_cart');
      } else {
        onSetStatus(item.id, 'in_cart');
      }
      triggerHaptic('success');
      setJustSwipedAction('🛒 Added to Cart!');
      setTimeout(() => setJustSwipedAction(null), 1800);
    }
    // Swiped left -> Mark as Already Have (Pantry)
    else if (x <= -SWIPE_THRESHOLD) {
      if (!item.isAlreadyOwned) {
        onTogglePantry(item.id);
      }
      triggerHaptic('medium');
      setJustSwipedAction('🏡 Marked as In Pantry ($0)');
      setTimeout(() => setJustSwipedAction(null), 1800);
    }
  };

  return (
    <div
      id={`item-swipe-container-${item.id}`}
      className="relative overflow-hidden rounded-xl group select-none touch-pan-y"
    >
      {/* Background Action Panels revealed during swipe */}
      <div
        className={`absolute inset-0 flex items-center justify-between px-5 transition-colors duration-150 ${
          isThresholdPassed === 'right'
            ? 'bg-blue-600'
            : isThresholdPassed === 'left'
            ? 'bg-amber-600'
            : 'bg-zinc-100'
        }`}
      >
        {/* Left reveal panel: In Cart */}
        <div
          className={`flex items-center space-x-2 transition-all duration-150 ${
            dragOffset > 15
              ? 'opacity-100 translate-x-0'
              : 'opacity-0 -translate-x-4 pointer-events-none'
          } ${isThresholdPassed === 'right' ? 'text-white scale-105' : 'text-blue-700'}`}
        >
          <div className="p-2 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-black uppercase tracking-wider block">
              {isThresholdPassed === 'right' ? 'Release: Add to Cart' : 'Swipe for Cart'}
            </span>
            <span className="text-[10px] opacity-80 font-medium">Quick Cart Action</span>
          </div>
        </div>

        {/* Right reveal panel: Already Have / In Pantry */}
        <div
          className={`flex items-center space-x-2 flex-row-reverse space-x-reverse transition-all duration-150 ${
            dragOffset < -15
              ? 'opacity-100 translate-x-0'
              : 'opacity-0 translate-x-4 pointer-events-none'
          } ${isThresholdPassed === 'left' ? 'text-white scale-105' : 'text-amber-700'}`}
        >
          <div className="p-2 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center">
            <Home className="w-5 h-5" />
          </div>
          <div className="text-right">
            <span className="text-xs font-black uppercase tracking-wider block">
              {isThresholdPassed === 'left' ? 'Release: In Pantry' : 'Swipe for Pantry'}
            </span>
            <span className="text-[10px] opacity-80 font-medium">Mark Already Owned</span>
          </div>
        </div>
      </div>

      {/* Foreground Swipeable Card */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: 0.55, right: 0.55 }}
        dragSnapToOrigin={true}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        id={`item-row-${item.id}`}
        className={`relative z-10 bg-white rounded-xl border transition-colors p-3 sm:p-4 cursor-grab active:cursor-grabbing ${
          status === 'purchased'
            ? 'border-emerald-200 bg-emerald-50/30'
            : status === 'in_cart'
            ? 'border-blue-200 bg-blue-50/25'
            : item.isAlreadyOwned
            ? 'border-amber-200 bg-amber-50/25'
            : 'border-zinc-200 hover:border-zinc-300 shadow-2xs'
        }`}
      >
        {/* Swipe Feedback Confirmation Banner */}
        {justSwipedAction && (
          <div className="mb-2 px-2.5 py-1 rounded-lg bg-zinc-900 text-white text-xs font-bold flex items-center justify-between animate-in fade-in slide-in-from-top-1 duration-200">
            <span>{justSwipedAction}</span>
            <span className="text-[10px] text-zinc-400 font-normal">Updated</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Left Status Toggle + Item Info */}
          <div className="flex items-start space-x-3 flex-1 min-w-0">
            {/* 3-State Status Stepper: To Buy -> In Cart -> Purchased */}
            <button
              type="button"
              id={`cycle-status-item-${item.id}`}
              onClick={(e) => {
                e.stopPropagation();
                triggerHaptic('light');
                onCycleStatus(item.id);
              }}
              disabled={item.isAlreadyOwned}
              className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                item.isAlreadyOwned
                  ? 'cursor-not-allowed opacity-40 bg-zinc-100 text-zinc-400'
                  : status === 'purchased'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : status === 'in_cart'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'border-2 border-zinc-300 bg-white hover:border-zinc-400 text-transparent'
              }`}
              title={
                item.isAlreadyOwned
                  ? 'Item in home pantry'
                  : status === 'to_buy'
                  ? 'Click to mark: In Cart'
                  : status === 'in_cart'
                  ? 'Click to mark: Purchased'
                  : 'Click to mark: To Buy'
              }
            >
              {status === 'purchased' ? (
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              ) : status === 'in_cart' ? (
                <ShoppingCart className="w-3.5 h-3.5" />
              ) : (
                <Circle className="w-3 h-3" />
              )}
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

                {/* Status Indicator Badge */}
                {!item.isAlreadyOwned && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      status === 'purchased'
                        ? 'bg-emerald-100 text-emerald-800'
                        : status === 'in_cart'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-zinc-100 text-zinc-600'
                    }`}
                  >
                    {status === 'purchased'
                      ? '✓ Purchased'
                      : status === 'in_cart'
                      ? '🛒 In Cart'
                      : 'To Buy'}
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

                {/* Mobile Gesture Hint Pill */}
                <span className="hidden sm:inline-flex text-[9px] text-zinc-400 font-medium items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>⇄ swipe to cart/pantry</span>
                </span>
              </div>

              {/* Name & Unit */}
              <div className="flex items-baseline space-x-2">
                <span
                  className={`text-sm font-bold tracking-tight text-zinc-900 ${
                    status === 'purchased'
                      ? 'line-through text-zinc-400'
                      : item.isAlreadyOwned
                      ? 'text-zinc-500'
                      : ''
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
                    <strong>{formatCurrency(item.cymbalBrandSwap.savings * (item.quantity || 1), currencyCode)}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerHaptic('success');
                      onApplyBrandSwap(item.id);
                    }}
                    className="ml-1 text-[10px] font-bold bg-emerald-700 hover:bg-emerald-800 text-white px-2 py-0.5 rounded cursor-pointer transition-colors"
                  >
                    Apply Swap
                  </button>
                </div>
              )}

              {/* Alternative tip expand */}
              {item.alternativeOrBulkTip && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerHaptic('selection');
                    setIsTipExpanded(!isTipExpanded);
                  }}
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
              onClick={(e) => {
                e.stopPropagation();
                triggerHaptic('medium');
                onTogglePantry(item.id);
              }}
              className={`inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                item.isAlreadyOwned
                  ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-2xs ring-1 ring-amber-400'
                  : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-600 border-zinc-200'
              }`}
              title="Toggle if you already have this at home in your pantry"
            >
              <Home className="w-3.5 h-3.5" />
              <span>{item.isAlreadyOwned ? `In Pantry (${formatCurrency(0, currencyCode)})` : 'I Have This'}</span>
            </button>

            {/* Quantity Stepper */}
            <div className="flex items-center space-x-1 bg-zinc-100 p-0.5 rounded-lg border border-zinc-200">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerHaptic('selection');
                  onQuantityChange(item.id, -1);
                }}
                className="w-6 h-6 rounded bg-white hover:bg-zinc-50 text-zinc-700 flex items-center justify-center font-bold text-xs cursor-pointer active:scale-95 transition-transform"
              >
                -
              </button>
              <span className="text-xs font-bold text-zinc-900 w-5 text-center">{item.quantity}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerHaptic('selection');
                  onQuantityChange(item.id, 1);
                }}
                className="w-6 h-6 rounded bg-white hover:bg-zinc-50 text-zinc-700 flex items-center justify-center font-bold text-xs cursor-pointer active:scale-95 transition-transform"
              >
                +
              </button>
            </div>

            {/* Line Cost */}
            <div className="text-right min-w-[70px]">
              {item.isAlreadyOwned ? (
                <div>
                  <span className="text-xs font-bold text-emerald-700 block">{formatCurrency(0, currencyCode)}</span>
                  <span className="text-[10px] text-zinc-400 line-through">{formatCurrency(itemTotal, currencyCode)}</span>
                </div>
              ) : (
                <div>
                  <span className="text-xs font-bold text-zinc-900 block">{formatCurrency(itemTotal, currencyCode)}</span>
                  <span className="text-[10px] text-zinc-500">~{formatCurrency(item.estimatedPrice, currencyCode)}/ea</span>
                </div>
              )}
            </div>

            {/* Delete */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                triggerHaptic('heavy');
                onDeleteItem(item.id);
              }}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              title="Remove item"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
