import React from 'react';
import {
  Sparkles,
  ShoppingBag,
  Calendar,
  BookOpen,
  PlusCircle,
  Printer,
  CheckCircle2,
  DollarSign,
  Store,
} from 'lucide-react';
import { PartyPlan, CUJStep } from '../types';
import { formatCurrency } from '../utils/calculator';

interface NavbarProps {
  currentPlan: PartyPlan | null;
  savedPlansCount: number;
  onOpenNewWizard: () => void;
  onOpenSavedPlans: () => void;
  onOpenExport: () => void;
  onToggleAssistant: () => void;
  currentStep: CUJStep;
  onSelectStep: (step: CUJStep) => void;
  totalCost: number;
  targetBudget: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPlan,
  savedPlansCount,
  onOpenNewWizard,
  onOpenSavedPlans,
  onOpenExport,
  onToggleAssistant,
  currentStep,
  onSelectStep,
  totalCost,
  targetBudget,
}) => {
  const isOver = totalCost > targetBudget;

  return (
    <header id="main-navbar" className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-zinc-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onSelectStep('define')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-indigo-700 flex items-center justify-center text-white shadow-xs">
              <ShoppingBag className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-zinc-900 text-base sm:text-lg tracking-tight">CymbalMart</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                  Party Planner Agent
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 hidden sm:block">AI event catering & budget-conscious lists</p>
            </div>
          </div>

          {/* Center Navigation: 3 CUJ Tasks */}
          {currentPlan && (
            <nav className="hidden md:flex items-center p-1 bg-zinc-100 rounded-xl border border-zinc-200 text-xs">
              <button
                id="nav-tab-define"
                onClick={() => onSelectStep('define')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  currentStep === 'define'
                    ? 'bg-white text-zinc-900 shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                <span>1. Define Event</span>
              </button>

              <button
                id="nav-tab-review"
                onClick={() => onSelectStep('review')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  currentStep === 'review'
                    ? 'bg-white text-zinc-900 shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                <span>2. Review List</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-200 text-zinc-800">
                  {currentPlan.items.length}
                </span>
              </button>

              <button
                id="nav-tab-refine"
                onClick={() => onSelectStep('refine_checkout')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  currentStep === 'refine_checkout'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>3. Refine & Checkout</span>
              </button>
            </nav>
          )}

          {/* Right Action Buttons */}
          <div className="flex items-center space-x-2">
            {currentPlan && (
              <div className="hidden lg:flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-zinc-50 border border-zinc-200 text-xs">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-zinc-500 font-medium">Cart:</span>
                <span className={`font-bold ${isOver ? 'text-amber-700' : 'text-emerald-700'}`}>
                  {formatCurrency(totalCost)}
                </span>
              </div>
            )}

            {currentPlan && (
              <button
                id="btn-export-list"
                onClick={onOpenExport}
                className="hidden sm:inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                title="Export or Print Shopping List"
              >
                <Printer className="w-3.5 h-3.5 text-zinc-500" />
                <span>Export / Print</span>
              </button>
            )}

            {/* CymbalMart Assistant Button */}
            <button
              id="btn-navbar-assistant"
              onClick={onToggleAssistant}
              className="inline-flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold transition-all cursor-pointer shadow-2xs group"
              title="Open CymbalMart Customer Assistant"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 group-hover:rotate-12 transition-transform" />
              <span className="hidden sm:inline">Assistant</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </button>

            <button
              id="btn-saved-plans"
              onClick={onOpenSavedPlans}
              className="inline-flex items-center space-x-1 px-2.5 sm:px-3 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-zinc-500" />
              <span className="hidden sm:inline">Saved</span>
              <span className="px-1.5 py-0.2 rounded-full bg-zinc-100 text-zinc-700 text-[10px]">
                {savedPlansCount}
              </span>
            </button>

            <button
              id="btn-new-plan"
              onClick={onOpenNewWizard}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              <PlusCircle className="w-3.5 h-3.5 text-amber-300" />
              <span>New Event</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        {currentPlan && (
          <div className="md:hidden flex items-center justify-around py-2 border-t border-zinc-100 text-xs font-bold overflow-x-auto">
            <button
              onClick={() => onSelectStep('define')}
              className={`px-3 py-1 rounded-md whitespace-nowrap ${
                currentStep === 'define' ? 'bg-zinc-900 text-white' : 'text-zinc-600'
              }`}
            >
              1. Define Event
            </button>
            <button
              onClick={() => onSelectStep('review')}
              className={`px-3 py-1 rounded-md whitespace-nowrap ${
                currentStep === 'review' ? 'bg-zinc-900 text-white' : 'text-zinc-600'
              }`}
            >
              2. Review List ({currentPlan.items.length})
            </button>
            <button
              onClick={() => onSelectStep('refine_checkout')}
              className={`px-3 py-1 rounded-md whitespace-nowrap ${
                currentStep === 'refine_checkout' ? 'bg-emerald-700 text-white' : 'text-emerald-700'
              }`}
            >
              3. Refine & Checkout ✨
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
