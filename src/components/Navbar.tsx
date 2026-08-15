import React from 'react';
import {
  Sparkles,
  ShoppingBag,
  BookOpen,
  PlusCircle,
  Printer,
  DollarSign,
  Globe,
} from 'lucide-react';
import { PartyPlan, CUJStep } from '../types';
import { formatCurrency } from '../utils/calculator';
import { getCountryConfig } from '../data/countries';

interface NavbarProps {
  currentPlan: PartyPlan | null;
  savedPlansCount: number;
  onOpenNewWizard: () => void;
  onOpenSavedPlans: () => void;
  onOpenExport: () => void;
  currentStep: CUJStep;
  onSelectStep: (step: CUJStep) => void;
  totalCost: number;
  targetBudget: number;
  countryCode?: string;
  onOpenCountryModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPlan,
  savedPlansCount,
  onOpenNewWizard,
  onOpenSavedPlans,
  onOpenExport,
  currentStep,
  onSelectStep,
  totalCost,
  targetBudget,
  countryCode = 'IN',
  onOpenCountryModal,
}) => {
  const isOver = totalCost > targetBudget;
  const activeCountry = getCountryConfig(currentPlan?.countryCode || countryCode);

  return (
    <header id="main-navbar" className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-zinc-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          {/* Logo & Main Brand */}
          <div
            id="nav-brand-logo"
            className="flex items-center space-x-2.5 sm:space-x-3 cursor-pointer shrink-0 group select-none"
            onClick={() => onSelectStep('define')}
            title="CymbalMart Party Planner"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-800 flex items-center justify-center text-white shadow-xs group-hover:scale-102 transition-transform">
              <ShoppingBag className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-amber-300" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <span className="font-extrabold text-zinc-900 text-base sm:text-lg tracking-tight group-hover:text-emerald-800 transition-colors">
                  CymbalMart
                </span>
                <span className="text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                  Party Planner
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 hidden md:block leading-tight">
                AI event catering & budget-conscious lists
              </p>
            </div>
          </div>

          {/* Center Navigation: CUJ Step Tabs */}
          {currentPlan && (
            <nav
              id="nav-cuj-tabs"
              className="hidden lg:flex items-center p-1 bg-zinc-100/90 rounded-xl border border-zinc-200/80 text-xs shadow-2xs"
            >
              <button
                id="nav-tab-define"
                type="button"
                onClick={() => onSelectStep('define')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  currentStep === 'define'
                    ? 'bg-white text-zinc-900 font-semibold shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-white/50'
                }`}
              >
                <span>1. Define Event</span>
              </button>

              <button
                id="nav-tab-review"
                type="button"
                onClick={() => onSelectStep('review')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  currentStep === 'review'
                    ? 'bg-white text-zinc-900 font-semibold shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-white/50'
                }`}
              >
                <span>2. Review List</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-zinc-200 text-zinc-800">
                  {currentPlan.items.length}
                </span>
              </button>

              <button
                id="nav-tab-refine"
                type="button"
                onClick={() => onSelectStep('refine_checkout')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  currentStep === 'refine_checkout'
                    ? 'bg-emerald-700 text-white font-semibold shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-white/50'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>3. Refine & Checkout</span>
              </button>
            </nav>
          )}

          {/* Right Action Controls */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
            {/* Live Cart Metric */}
            {currentPlan && (
              <div
                id="nav-cart-indicator"
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-zinc-50 border border-zinc-200 text-xs select-none"
                title={`Estimated Total: ${formatCurrency(totalCost)} (Budget: ${formatCurrency(targetBudget)})`}
              >
                <DollarSign className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="text-zinc-500 font-medium hidden sm:inline">Cart:</span>
                <span className={`font-bold ${isOver ? 'text-amber-700' : 'text-emerald-700'}`}>
                  {formatCurrency(totalCost)}
                </span>
              </div>
            )}

            {/* Export / Print */}
            {currentPlan && (
              <button
                id="btn-export-list"
                type="button"
                onClick={onOpenExport}
                className="hidden sm:inline-flex items-center space-x-1 px-2.5 sm:px-3 py-1.5 rounded-lg border border-zinc-200/90 bg-white hover:bg-zinc-50 hover:border-zinc-300 text-zinc-700 text-xs font-medium transition-colors cursor-pointer shadow-2xs"
                title="Export or Print Shopping List"
              >
                <Printer className="w-3.5 h-3.5 text-zinc-500" />
                <span className="hidden md:inline">Export / Print</span>
                <span className="md:hidden">Print</span>
              </button>
            )}

            {/* Country / Market Selector */}
            <button
              id="btn-nav-country"
              type="button"
              onClick={onOpenCountryModal}
              className="inline-flex items-center space-x-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg border border-zinc-200/90 bg-white hover:bg-zinc-50 hover:border-zinc-300 text-zinc-700 text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
              title={`Active Market: ${activeCountry.name} (${activeCountry.currencyCode} ${activeCountry.currencySymbol}) - Click to Change`}
            >
              <span className="text-base leading-none">{activeCountry.flag}</span>
              <span className="hidden sm:inline font-bold">{activeCountry.currencyCode}</span>
              <span className="text-zinc-500 font-medium">({activeCountry.currencySymbol})</span>
            </button>

            {/* Saved Plans */}
            <button
              id="btn-saved-plans"
              type="button"
              onClick={onOpenSavedPlans}
              className="inline-flex items-center space-x-1 px-2.5 sm:px-3 py-1.5 rounded-lg border border-zinc-200/90 bg-white hover:bg-zinc-50 hover:border-zinc-300 text-zinc-700 text-xs font-medium transition-colors cursor-pointer shadow-2xs"
              title="View Saved Party Plans"
            >
              <BookOpen className="w-3.5 h-3.5 text-zinc-500" />
              <span className="hidden sm:inline">Saved</span>
              <span className="px-1.5 py-0.2 rounded-full bg-zinc-100 text-zinc-700 text-[10px] font-bold">
                {savedPlansCount}
              </span>
            </button>

            {/* New Event Button */}
            <button
              id="btn-new-plan"
              type="button"
              onClick={onOpenNewWizard}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-950 text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
              title="Create a New Party Plan"
            >
              <PlusCircle className="w-3.5 h-3.5 text-amber-300" />
              <span className="whitespace-nowrap">New Event</span>
            </button>
          </div>
        </div>

        {/* Mobile / Tablet Step Navigation Row */}
        {currentPlan && (
          <div className="lg:hidden flex items-center justify-between py-2 border-t border-zinc-100 text-xs font-medium gap-1 overflow-x-auto">
            <button
              type="button"
              onClick={() => onSelectStep('define')}
              className={`flex-1 px-2.5 py-1.5 rounded-lg text-center whitespace-nowrap transition-colors ${
                currentStep === 'define'
                  ? 'bg-zinc-900 text-white font-semibold shadow-xs'
                  : 'text-zinc-600 hover:bg-zinc-100'
              }`}
            >
              1. Define
            </button>
            <button
              type="button"
              onClick={() => onSelectStep('review')}
              className={`flex-1 px-2.5 py-1.5 rounded-lg text-center whitespace-nowrap transition-colors flex items-center justify-center space-x-1 ${
                currentStep === 'review'
                  ? 'bg-zinc-900 text-white font-semibold shadow-xs'
                  : 'text-zinc-600 hover:bg-zinc-100'
              }`}
            >
              <span>2. Review</span>
              <span className={`text-[10px] px-1 py-0.1 rounded-full ${currentStep === 'review' ? 'bg-zinc-700 text-zinc-100' : 'bg-zinc-200 text-zinc-700'}`}>
                {currentPlan.items.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => onSelectStep('refine_checkout')}
              className={`flex-1 px-2.5 py-1.5 rounded-lg text-center whitespace-nowrap transition-colors flex items-center justify-center space-x-1 ${
                currentStep === 'refine_checkout'
                  ? 'bg-emerald-700 text-white font-semibold shadow-xs'
                  : 'text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>3. Checkout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
