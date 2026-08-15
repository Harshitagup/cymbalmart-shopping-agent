import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Check,
  X,
  TrendingDown,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  ShoppingBag,
  HelpCircle,
} from 'lucide-react';
import { ShoppingItem, PartyPlan, BudgetOptimizationSuggestion } from '../types';
import {
  generateBudgetOptimizerSuggestions,
  calculateBudgetMetrics,
  formatCurrency,
} from '../utils/calculator';

interface SmartBudgetOptimizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: PartyPlan;
  onApplyOptimizations: (updatedItems: ShoppingItem[]) => void;
}

export function SmartBudgetOptimizerModal({
  isOpen,
  onClose,
  plan,
  onApplyOptimizations,
}: SmartBudgetOptimizerModalProps) {
  const [suggestions, setSuggestions] = useState<BudgetOptimizationSuggestion[]>([]);
  const [appliedCount, setAppliedCount] = useState<number>(0);

  useEffect(() => {
    if (isOpen && plan) {
      const generated = generateBudgetOptimizerSuggestions(plan.items, plan.targetBudget);
      setSuggestions(generated);
    }
  }, [isOpen, plan]);

  if (!isOpen) return null;

  const metrics = calculateBudgetMetrics(plan.items, plan.targetBudget, plan.guestCount);
  const overage = Math.max(0, metrics.totalEstimatedCost - plan.targetBudget);

  const toggleSuggestion = (id: string) => {
    setSuggestions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, selected: !s.selected } : s))
    );
  };

  const selectAll = () => {
    setSuggestions((prev) => prev.map((s) => ({ ...s, selected: true })));
  };

  const deselectAll = () => {
    setSuggestions((prev) => prev.map((s) => ({ ...s, selected: false })));
  };

  // Calculate projected metrics based on selected suggestions
  const selectedSuggestions = suggestions.filter((s) => s.selected);
  const totalProjectedSavings = selectedSuggestions.reduce((sum, s) => sum + s.estimatedSavings, 0);
  const projectedTotalCost = Math.max(0, metrics.totalEstimatedCost - totalProjectedSavings);
  const projectedVariance = plan.targetBudget - projectedTotalCost;
  const isProjectedWithinBudget = projectedTotalCost <= plan.targetBudget;

  const handleApply = () => {
    let nextItems = [...plan.items];

    selectedSuggestions.forEach((sug) => {
      const idx = nextItems.findIndex((i) => i.id === sug.itemId);
      if (idx !== -1 && sug.appliedPayload) {
        nextItems[idx] = {
          ...nextItems[idx],
          ...sug.appliedPayload,
          name: sug.appliedPayload.name || nextItems[idx].name,
          estimatedPrice:
            sug.appliedPayload.estimatedPrice !== undefined
              ? sug.appliedPayload.estimatedPrice
              : nextItems[idx].estimatedPrice,
          quantity:
            sug.appliedPayload.quantity !== undefined
              ? sug.appliedPayload.quantity
              : nextItems[idx].quantity,
          isAlreadyOwned:
            sug.appliedPayload.isAlreadyOwned !== undefined
              ? sug.appliedPayload.isAlreadyOwned
              : nextItems[idx].isAlreadyOwned,
          brandType: sug.appliedPayload.brandType || nextItems[idx].brandType,
          notes: sug.appliedPayload.notes || nextItems[idx].notes,
        };
      }
    });

    onApplyOptimizations(nextItems);
    setAppliedCount(selectedSuggestions.length);
    onClose();
  };

  return (
    <div
      id="budget-optimizer-modal-overlay"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="optimizer-title"
    >
      <div
        id="budget-optimizer-modal-container"
        className="relative bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-zinc-200 overflow-hidden"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-zinc-900 text-white p-5 sm:p-6 flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 id="optimizer-title" className="text-xl font-bold tracking-tight">
                  Smart Budget Optimizer
                </h2>
                <span className="bg-emerald-500/30 text-emerald-200 text-xs px-2.5 py-0.5 rounded-full font-medium border border-emerald-400/30">
                  AI & Store-Brand Analysis
                </span>
              </div>
              <p className="text-zinc-300 text-xs sm:text-sm mt-0.5">
                CymbalMart smart value substitutions, portion trimming & store-brand swaps
              </p>
            </div>
          </div>
          <button
            id="close-optimizer-modal-btn"
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Close Budget Optimizer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status & Budget Impact Banner */}
        <div className="bg-zinc-50 border-b border-zinc-200 p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-white rounded-xl p-3 border border-zinc-200 shadow-xs">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">
                Current Spend
              </span>
              <div className="flex items-baseline space-x-2 mt-1">
                <span
                  className={`text-lg font-bold ${
                    metrics.isOverBudget ? 'text-rose-600' : 'text-zinc-900'
                  }`}
                >
                  {formatCurrency(metrics.totalEstimatedCost)}
                </span>
                <span className="text-xs text-zinc-500">
                  Budget: {formatCurrency(plan.targetBudget)}
                </span>
              </div>
              {overage > 0 ? (
                <div className="flex items-center space-x-1 mt-1 text-xs font-semibold text-rose-600">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{formatCurrency(overage)} over target</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1 mt-1 text-xs font-semibold text-emerald-600">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Within budget target</span>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl p-3 border border-zinc-200 shadow-xs">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">
                Selected Savings
              </span>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-lg font-bold text-emerald-700">
                  -{formatCurrency(totalProjectedSavings)}
                </span>
                <span className="text-xs text-zinc-500">
                  ({selectedSuggestions.length} items)
                </span>
              </div>
              <span className="text-xs text-emerald-600 font-medium mt-1 block">
                Cymbal Choice private label savings
              </span>
            </div>

            <div
              className={`rounded-xl p-3 border shadow-xs ${
                isProjectedWithinBudget
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                  : 'bg-amber-50/80 border-amber-200 text-amber-950'
              }`}
            >
              <span className="text-xs font-semibold uppercase tracking-wider block opacity-75">
                Projected Cart Total
              </span>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-lg font-bold">
                  {formatCurrency(projectedTotalCost)}
                </span>
                <span className="text-xs font-medium">
                  {isProjectedWithinBudget
                    ? `(${formatCurrency(Math.abs(projectedVariance))} under)`
                    : `(${formatCurrency(Math.abs(projectedVariance))} over)`}
                </span>
              </div>
              <div className="flex items-center space-x-1 mt-1 text-xs font-semibold">
                {isProjectedWithinBudget ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Hits budget goal!</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-3.5 h-3.5 text-amber-600" />
                    <span className="text-amber-700">Almost there</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Suggestions List Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-zinc-900">
                Recommended Actions ({suggestions.length})
              </h3>
              <p className="text-xs text-zinc-500">
                Essential must-haves are protected. Deselect any swap you want to keep.
              </p>
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <button
                id="select-all-optimizer-btn"
                type="button"
                onClick={selectAll}
                className="text-emerald-700 hover:text-emerald-800 font-semibold px-2 py-1 rounded-md hover:bg-emerald-50 transition-colors"
              >
                Select All
              </button>
              <span className="text-zinc-300">|</span>
              <button
                id="deselect-all-optimizer-btn"
                type="button"
                onClick={deselectAll}
                className="text-zinc-600 hover:text-zinc-800 font-medium px-2 py-1 rounded-md hover:bg-zinc-100 transition-colors"
              >
                Deselect All
              </button>
            </div>
          </div>

          {suggestions.length === 0 ? (
            <div className="text-center py-12 bg-zinc-50 rounded-xl border border-zinc-200/80">
              <ShieldCheck className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
              <h4 className="text-base font-bold text-zinc-800">Your Cart is Already Optimized!</h4>
              <p className="text-xs text-zinc-500 max-w-md mx-auto mt-1">
                Your shopping list is already utilizing CymbalMart store brands and aligned portion sizes.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {suggestions.map((sug) => (
                <div
                  key={sug.id}
                  id={`suggestion-card-${sug.id}`}
                  onClick={() => toggleSuggestion(sug.id)}
                  className={`cursor-pointer rounded-xl p-4 border transition-all duration-150 ${
                    sug.selected
                      ? 'bg-emerald-50/40 border-emerald-300 ring-1 ring-emerald-500/20'
                      : 'bg-white border-zinc-200 hover:border-zinc-300 opacity-75'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        id={`checkbox-${sug.id}`}
                        checked={sug.selected}
                        onChange={() => toggleSuggestion(sug.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1 h-4 w-4 rounded-md border-zinc-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        aria-label={`Toggle ${sug.recommendedChange}`}
                      />
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                              sug.type === 'swap_store_brand'
                                ? 'bg-teal-100 text-teal-800'
                                : sug.type === 'reduce_qty'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {sug.type === 'swap_store_brand'
                              ? 'Store Brand Swap'
                              : sug.type === 'reduce_qty'
                              ? 'Portion Right-Sizing'
                              : 'Optional Trim'}
                          </span>
                          <span className="font-semibold text-sm text-zinc-900">
                            {sug.recommendedChange}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2 text-xs text-zinc-500 mt-1">
                          <span className="line-through">{sug.currentProduct}</span>
                          <ArrowRight className="w-3 h-3 text-zinc-400" />
                          <span className="text-zinc-700 font-medium">
                            {sug.type === 'remove_optional'
                              ? 'Owned in Pantry ($0)'
                              : sug.recommendedChange}
                          </span>
                        </div>

                        <p className="text-xs text-zinc-600 mt-1.5 leading-relaxed">
                          {sug.shortReason}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-sm font-bold text-emerald-700 block">
                        Save {formatCurrency(sug.estimatedSavings)}
                      </span>
                      <span className="text-xs text-zinc-400">
                        {formatCurrency(sug.currentCost)} → {formatCurrency(sug.newCost)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-zinc-50 border-t border-zinc-200 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-zinc-500">
            {selectedSuggestions.length} actions selected · Estimated savings:{' '}
            <strong className="text-emerald-700 font-bold">
              {formatCurrency(totalProjectedSavings)}
            </strong>
          </div>
          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <button
              id="cancel-optimizer-btn"
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-zinc-300 bg-white text-zinc-700 text-sm font-semibold hover:bg-zinc-100 transition-colors"
            >
              Cancel
            </button>
            <button
              id="apply-optimizer-btn"
              type="button"
              onClick={handleApply}
              disabled={selectedSuggestions.length === 0}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-emerald-700 text-white text-sm font-bold shadow-sm hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
            >
              <Check className="w-4 h-4" />
              <span>Apply {selectedSuggestions.length} Selected Changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
