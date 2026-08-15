import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Check,
  X,
  ArrowRight,
  AlertTriangle,
  Sparkles,
  HelpCircle,
  Plus,
} from 'lucide-react';
import { ShoppingItem, PartyPlan, DietaryConflict } from '../types';
import { detectDietaryConflicts, formatCurrency } from '../utils/calculator';
import { DIETARY_OPTIONS } from '../data/presets';

interface DietaryIntelligenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: PartyPlan;
  onUpdatePlanDietary: (newDietary: string[], updatedItems: ShoppingItem[]) => void;
}

export function DietaryIntelligenceModal({
  isOpen,
  onClose,
  plan,
  onUpdatePlanDietary,
}: DietaryIntelligenceModalProps) {
  const [selectedDietary, setSelectedDietary] = useState<string[]>(
    plan.dietaryRestrictions || []
  );
  const [conflicts, setConflicts] = useState<DietaryConflict[]>([]);
  const [resolvedConflicts, setResolvedConflicts] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isOpen && plan) {
      setSelectedDietary(plan.dietaryRestrictions || []);
      const detected = detectDietaryConflicts(plan.items, plan.dietaryRestrictions || []);
      setConflicts(detected);
      // default select all detected conflict replacements
      const initial: Record<string, boolean> = {};
      detected.forEach((c) => {
        initial[c.id] = true;
      });
      setResolvedConflicts(initial);
    }
  }, [isOpen, plan]);

  // Recalculate conflicts when dietary checkboxes change
  const handleToggleDietaryTag = (tag: string) => {
    const nextTags = selectedDietary.includes(tag)
      ? selectedDietary.filter((t) => t !== tag)
      : [...selectedDietary, tag];

    setSelectedDietary(nextTags);
    const detected = detectDietaryConflicts(plan.items, nextTags);
    setConflicts(detected);

    const updatedMap: Record<string, boolean> = {};
    detected.forEach((c) => {
      updatedMap[c.id] = true;
    });
    setResolvedConflicts(updatedMap);
  };

  if (!isOpen) return null;

  const toggleConflictSelection = (id: string) => {
    setResolvedConflicts((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const selectedCount = Object.values(resolvedConflicts).filter(Boolean).length;

  const handleApply = () => {
    let nextItems = [...plan.items];

    conflicts.forEach((conflict) => {
      if (resolvedConflicts[conflict.id]) {
        const idx = nextItems.findIndex((i) => i.id === conflict.itemId);
        if (idx !== -1) {
          const replacement = conflict.suggestedReplacement;
          nextItems[idx] = {
            ...nextItems[idx],
            name: replacement.name,
            estimatedPrice: replacement.estimatedPrice,
            unit: replacement.unit || nextItems[idx].unit,
            category: replacement.category || nextItems[idx].category,
            aisle: replacement.aisle || nextItems[idx].aisle,
            brandType: replacement.brandType || 'cymbal_brand',
            notes: `${nextItems[idx].notes ? nextItems[idx].notes + ' · ' : ''}(Allergy safe: ${replacement.reason})`,
            hasConflict: false,
            conflictReason: undefined,
          };
        }
      }
    });

    onUpdatePlanDietary(selectedDietary, nextItems);
    onClose();
  };

  return (
    <div
      id="dietary-intelligence-modal-overlay"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dietary-modal-title"
    >
      <div
        id="dietary-intelligence-modal-container"
        className="relative bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-zinc-200 overflow-hidden"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-teal-900 via-emerald-950 to-zinc-900 text-white p-5 sm:p-6 flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 id="dietary-modal-title" className="text-xl font-bold tracking-tight">
                  Dietary & Allergy Intelligence
                </h2>
                <span className="bg-teal-500/30 text-teal-200 text-xs px-2.5 py-0.5 rounded-full font-medium border border-teal-400/30">
                  Zero Silent Replacements
                </span>
              </div>
              <p className="text-zinc-300 text-xs sm:text-sm mt-0.5">
                Protect your guests with verified allergy-safe CymbalMart alternatives
              </p>
            </div>
          </div>
          <button
            id="close-dietary-modal-btn"
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Close Dietary Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dietary Tag Toggles */}
        <div className="bg-zinc-50 border-b border-zinc-200 p-4 sm:p-5">
          <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider block mb-2">
            Active Dietary Guidelines for this Event:
          </label>
          <div className="flex flex-wrap gap-2">
            {DIETARY_OPTIONS.map((tag) => {
              const isSelected = selectedDietary.includes(tag);
              return (
                <button
                  key={tag}
                  id={`dietary-tag-btn-${tag.replace(/\s+/g, '-').toLowerCase()}`}
                  type="button"
                  onClick={() => handleToggleDietaryTag(tag)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center space-x-1.5 ${
                    isSelected
                      ? 'bg-teal-700 text-white border-teal-800 shadow-xs'
                      : 'bg-white text-zinc-700 border-zinc-300 hover:border-zinc-400 hover:bg-zinc-100'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5" />}
                  <span>{tag}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Conflicts List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-900 flex items-center space-x-2">
              <span>Detected Allergen / Dietary Incompatibilities ({conflicts.length})</span>
            </h3>
            {conflicts.length > 0 && (
              <span className="text-xs text-amber-700 font-semibold bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                Requires User Confirmation
              </span>
            )}
          </div>

          {conflicts.length === 0 ? (
            <div className="text-center py-12 bg-emerald-50/50 rounded-xl border border-emerald-200/80 p-6">
              <Check className="w-12 h-12 text-emerald-600 mx-auto mb-2 bg-emerald-100 p-2 rounded-full" />
              <h4 className="text-base font-bold text-emerald-950">100% Dietary Aligned!</h4>
              <p className="text-xs text-emerald-700 max-w-md mx-auto mt-1">
                All items on your shopping list are fully compatible with your selected dietary preferences ({selectedDietary.length > 0 ? selectedDietary.join(', ') : 'Standard'}).
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {conflicts.map((conflict) => {
                const isSelected = resolvedConflicts[conflict.id];
                return (
                  <div
                    key={conflict.id}
                    id={`conflict-card-${conflict.id}`}
                    onClick={() => toggleConflictSelection(conflict.id)}
                    className={`cursor-pointer rounded-xl p-4 border transition-all ${
                      isSelected
                        ? 'bg-teal-50/40 border-teal-300 ring-1 ring-teal-500/20'
                        : 'bg-white border-zinc-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          id={`conflict-checkbox-${conflict.id}`}
                          checked={isSelected}
                          onChange={() => toggleConflictSelection(conflict.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-1 h-4 w-4 rounded-md border-zinc-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                          aria-label={`Replace ${conflict.itemName}`}
                        />
                        <div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="bg-rose-100 text-rose-800 text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center space-x-1">
                              <AlertTriangle className="w-3 h-3" />
                              <span>{conflict.dietaryType} Conflict</span>
                            </span>
                            <span className="font-semibold text-sm text-zinc-900">
                              {conflict.itemName}
                            </span>
                          </div>

                          <p className="text-xs text-rose-700 font-medium mt-1">
                            {conflict.conflictReason}
                          </p>

                          <div className="mt-2.5 p-2.5 bg-white rounded-lg border border-teal-200/80 flex items-start space-x-2">
                            <ArrowRight className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                            <div className="text-xs">
                              <span className="font-bold text-teal-900 block">
                                Recommended Safe Replacement: {conflict.suggestedReplacement.name}
                              </span>
                              <span className="text-zinc-600 mt-0.5 block">
                                {conflict.suggestedReplacement.reason} ·{' '}
                                <strong className="text-zinc-900">
                                  {formatCurrency(conflict.suggestedReplacement.estimatedPrice)}
                                </strong>{' '}
                                ({conflict.suggestedReplacement.aisle})
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-zinc-50 border-t border-zinc-200 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-zinc-500">
            {selectedCount} of {conflicts.length} safe replacements will be applied.
          </p>
          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <button
              id="cancel-dietary-btn"
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-zinc-300 bg-white text-zinc-700 text-sm font-semibold hover:bg-zinc-100 transition-colors"
            >
              Cancel
            </button>
            <button
              id="apply-dietary-btn"
              type="button"
              onClick={handleApply}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-teal-700 text-white text-sm font-bold shadow-sm hover:bg-teal-800 transition-all flex items-center justify-center space-x-2"
            >
              <Check className="w-4 h-4" />
              <span>Confirm & Apply Replacements</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
