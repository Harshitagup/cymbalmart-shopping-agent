import React from 'react';
import {
  DollarSign,
  TrendingDown,
  TrendingUp,
  PieChart,
  Home,
  Users,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';
import { PartyPlan, ShoppingItem } from '../types';
import { calculateBudgetMetrics, formatCurrency } from '../utils/calculator';
import { CATEGORY_METADATA } from '../data/presets';

interface BudgetAnalyticsProps {
  plan: PartyPlan;
  onAskCopilot: (prompt: string) => void;
  onTrimOptionalItems: () => void;
}

export const BudgetAnalytics: React.FC<BudgetAnalyticsProps> = ({
  plan,
  onAskCopilot,
  onTrimOptionalItems,
}) => {
  const metrics = calculateBudgetMetrics(plan.items, plan.targetBudget, plan.guestCount);
  const budgetRatio = Math.min(100, Math.round((metrics.totalEstimatedCost / plan.targetBudget) * 100));

  const sortedCategories = Object.entries(metrics.categoryBreakdown)
    .sort(([, a], [, b]) => b - a)
    .filter(([, amount]) => amount > 0);

  return (
    <div id="budget-analytics" className="space-y-6">
      {/* Top 4 Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Estimated Shopping Cost */}
        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-2xs">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Estimated Total</span>
            <DollarSign className="w-4 h-4 text-zinc-700" />
          </div>
          <div className="text-2xl font-extrabold text-zinc-900 tracking-tight">
            {formatCurrency(metrics.totalEstimatedCost)}
          </div>
          <div className="text-xs text-zinc-500 mt-1">
            Target Budget: {formatCurrency(plan.targetBudget)}
          </div>
        </div>

        {/* Cost Per Guest */}
        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-2xs">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Cost Per Guest</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-extrabold text-zinc-900 tracking-tight">
            {formatCurrency(metrics.costPerGuest)}
          </div>
          <div className="text-xs text-zinc-500 mt-1">
            Across {plan.guestCount} total attendees
          </div>
        </div>

        {/* Pantry Savings */}
        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-2xs">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Pantry Savings</span>
            <Home className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 tracking-tight">
            {formatCurrency(metrics.alreadyOwnedSavings)}
          </div>
          <div className="text-xs text-zinc-500 mt-1">
            {metrics.pantryItemsCount} items checked from home
          </div>
        </div>

        {/* Budget Status / Variance */}
        <div
          className={`p-5 rounded-2xl border shadow-2xs ${
            metrics.isOverBudget
              ? 'bg-amber-50/50 border-amber-200 text-amber-900'
              : 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              {metrics.isOverBudget ? 'Over Budget' : 'Under Budget'}
            </span>
            {metrics.isOverBudget ? (
              <TrendingUp className="w-4 h-4 text-amber-600" />
            ) : (
              <TrendingDown className="w-4 h-4 text-emerald-600" />
            )}
          </div>
          <div className="text-2xl font-extrabold tracking-tight">
            {formatCurrency(Math.abs(metrics.variance))}
          </div>
          <div className="text-xs mt-1 opacity-80">
            {metrics.isOverBudget
              ? `${Math.round(((metrics.totalEstimatedCost - plan.targetBudget) / plan.targetBudget) * 100)}% over plan limit`
              : `${Math.round((metrics.variance / plan.targetBudget) * 100)}% cushion remaining`}
          </div>
        </div>
      </div>

      {/* Budget Meter Bar */}
      <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 flex items-center space-x-2">
              <PieChart className="w-4 h-4 text-rose-500" />
              <span>Target Budget Utilization</span>
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              {formatCurrency(metrics.totalEstimatedCost)} utilized of {formatCurrency(plan.targetBudget)} allocated
            </p>
          </div>
          <span className="text-sm font-bold text-zinc-900">{budgetRatio}%</span>
        </div>

        <div className="w-full h-3 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200/60 flex">
          <div
            className={`h-full transition-all duration-300 rounded-full ${
              metrics.isOverBudget
                ? 'bg-amber-500'
                : budgetRatio > 85
                ? 'bg-emerald-500'
                : 'bg-indigo-500'
            }`}
            style={{ width: `${Math.min(100, budgetRatio)}%` }}
          />
        </div>

        {metrics.isOverBudget && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3 text-xs text-amber-900">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Your estimated total exceeds your target budget by {formatCurrency(Math.abs(metrics.variance))}.
              </span>
            </div>
            <button
              onClick={() => onAskCopilot(`Help me reduce the total budget by $${Math.ceil(Math.abs(metrics.variance))}. Recommend items to trim or bulk store swaps.`)}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold whitespace-nowrap shadow-xs"
            >
              Ask AI to Optimize
            </button>
          </div>
        )}
      </div>

      {/* Category Spend Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-zinc-900 flex items-center space-x-2">
            <span>Spend Breakdown by Category</span>
          </h3>

          <div className="space-y-3">
            {sortedCategories.map(([catKey, amount]) => {
              const meta = CATEGORY_METADATA[catKey] || { label: catKey, color: 'text-zinc-700 bg-zinc-100 border-zinc-200' };
              const percentOfTotal = metrics.totalEstimatedCost > 0
                ? Math.round((amount / metrics.totalEstimatedCost) * 100)
                : 0;

              return (
                <div key={catKey} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-zinc-700">{meta.label}</span>
                    <span className="text-zinc-900">
                      {formatCurrency(amount)} ({percentOfTotal}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-rose-500 rounded-full transition-all"
                      style={{ width: `${percentOfTotal}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Smart Optimizer Suggestions */}
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-2xs space-y-4">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-rose-100 text-rose-700">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900">1-Click AI Budget Optimizers</h3>
              <p className="text-xs text-zinc-500">Instant adjustments powered by Gemini</p>
            </div>
          </div>

          <div className="space-y-2.5">
            <button
              onClick={() => onAskCopilot("Find 3-5 store brand or bulk substitutions to lower our overall cost without sacrificing quality.")}
              className="w-full p-3 rounded-xl border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 text-left transition-all flex items-center justify-between group"
            >
              <div>
                <div className="font-semibold text-xs text-zinc-900">Swap to Store Brand & Wholesale</div>
                <div className="text-[11px] text-zinc-500">Calculate Costco or private label bulk savings</div>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-800 transition-colors" />
            </button>

            <button
              onClick={onTrimOptionalItems}
              className="w-full p-3 rounded-xl border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 text-left transition-all flex items-center justify-between group"
            >
              <div>
                <div className="font-semibold text-xs text-zinc-900">Trim Non-Essential Items</div>
                <div className="text-[11px] text-zinc-500">Remove or mark nice-to-have items to save budget immediately</div>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-800 transition-colors" />
            </button>

            <button
              onClick={() => onAskCopilot("Provide a DIY batch recipe to replace expensive pre-packaged drinks or appetizer platters.")}
              className="w-full p-3 rounded-xl border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 text-left transition-all flex items-center justify-between group"
            >
              <div>
                <div className="font-semibold text-xs text-zinc-900">Batch Cooking / DIY Punch Savings</div>
                <div className="text-[11px] text-zinc-500">Replace individual canned items with punch bowl recipes</div>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-800 transition-colors" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
