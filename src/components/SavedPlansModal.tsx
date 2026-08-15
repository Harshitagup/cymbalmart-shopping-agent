import React from 'react';
import { X, BookOpen, Trash2, Calendar, Users, DollarSign, ArrowRight, Copy } from 'lucide-react';
import { PartyPlan } from '../types';
import { formatCurrency, calculateBudgetMetrics } from '../utils/calculator';

interface SavedPlansModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedPlans: PartyPlan[];
  onSelectPlan: (plan: PartyPlan) => void;
  onDeletePlan: (id: string) => void;
  onDuplicatePlan: (plan: PartyPlan) => void;
}

export const SavedPlansModal: React.FC<SavedPlansModalProps> = ({
  isOpen,
  onClose,
  savedPlans,
  onSelectPlan,
  onDeletePlan,
  onDuplicatePlan,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-2xl w-full border border-zinc-200 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-zinc-100 text-zinc-900">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-zinc-900">Saved Party Plans ({savedPlans.length})</h3>
              <p className="text-[11px] text-zinc-500">Switch between parties or load past events</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* List of Plans */}
        <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1">
          {savedPlans.length === 0 ? (
            <div className="p-10 text-center text-zinc-500 space-y-2">
              <BookOpen className="w-8 h-8 text-zinc-300 mx-auto" />
              <p className="text-xs font-semibold text-zinc-700">No saved party plans yet</p>
              <p className="text-[11px] text-zinc-400">
                Any party you generate is automatically saved here for future reference.
              </p>
            </div>
          ) : (
            savedPlans.map((plan) => {
              const metrics = calculateBudgetMetrics(plan.items, plan.targetBudget, plan.guestCount);
              const dateStr = new Date(plan.createdAt).toLocaleDateString([], {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });

              return (
                <div
                  key={plan.id}
                  className="bg-zinc-50 hover:bg-zinc-100/80 p-4 rounded-xl border border-zinc-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-200">
                        {plan.eventType}
                      </span>
                      <span className="text-[10px] text-zinc-400">{dateStr}</span>
                    </div>

                    <h4 className="font-bold text-sm text-zinc-900 line-clamp-1">{plan.title}</h4>
                    <p className="text-xs text-zinc-500 line-clamp-1">Theme: {plan.theme}</p>

                    <div className="flex items-center space-x-3 text-[11px] text-zinc-600 mt-2 font-medium">
                      <span className="flex items-center space-x-1">
                        <Users className="w-3 h-3 text-zinc-400" />
                        <span>{plan.guestCount} Guests</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <DollarSign className="w-3 h-3 text-emerald-600" />
                        <span>{formatCurrency(metrics.totalEstimatedCost)} / {formatCurrency(plan.targetBudget)}</span>
                      </span>
                      <span>{plan.items.length} Items</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5 shrink-0">
                    <button
                      onClick={() => onDuplicatePlan(plan)}
                      className="p-2 rounded-lg text-zinc-500 hover:text-zinc-800 hover:bg-white border border-transparent hover:border-zinc-200 transition-colors"
                      title="Duplicate party plan"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onDeletePlan(plan.id)}
                      className="p-2 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete plan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        onSelectPlan(plan);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold flex items-center space-x-1 shadow-2xs"
                    >
                      <span>Load</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-zinc-100">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
