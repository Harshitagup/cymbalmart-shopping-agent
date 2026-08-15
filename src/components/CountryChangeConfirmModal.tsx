import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Globe,
  ArrowRight,
  RefreshCw,
  Sparkles,
  AlertCircle,
  X,
  CheckCircle2,
} from 'lucide-react';
import { PartyPlan } from '../types';
import { CountryConfig, getCountryConfig } from '../data/countries';
import { formatCurrency } from '../utils/calculator';

interface CountryChangeConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetCountry: CountryConfig;
  currentPlan: PartyPlan;
  onConfirmConvert: (targetCountry: CountryConfig) => void;
  onStartNewPlanForCountry: (targetCountry: CountryConfig) => void;
}

export const CountryChangeConfirmModal: React.FC<CountryChangeConfirmModalProps> = ({
  isOpen,
  onClose,
  targetCountry,
  currentPlan,
  onConfirmConvert,
  onStartNewPlanForCountry,
}) => {
  if (!isOpen) return null;

  const currentCountry = getCountryConfig(currentPlan.countryCode || 'IN');

  return (
    <div
      id="country-change-modal-overlay"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div
        id="country-change-modal-container"
        className="relative bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-zinc-200 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white p-5 flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Switch Country & Currency</h3>
              <p className="text-emerald-200 text-xs mt-0.5">
                Adapting CymbalMart shopping experience
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Comparison Flow */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-50 border border-zinc-200">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">{currentCountry.flag}</span>
              <div>
                <span className="text-xs font-bold text-zinc-900 block">{currentCountry.name}</span>
                <span className="text-[11px] text-zinc-500">{currentCountry.currencyCode} ({currentCountry.currencySymbol})</span>
              </div>
            </div>

            <div className="p-2 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">
              <ArrowRight className="w-4 h-4" />
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-2xl">{targetCountry.flag}</span>
              <div>
                <span className="text-xs font-bold text-zinc-900 block">{targetCountry.name}</span>
                <span className="text-[11px] text-zinc-500">{targetCountry.currencyCode} ({targetCountry.currencySymbol})</span>
              </div>
            </div>
          </div>

          {/* Explanation Notes */}
          <div className="space-y-2 text-xs text-zinc-600">
            <div className="flex items-start space-x-2 p-3 rounded-lg bg-emerald-50/70 border border-emerald-100 text-emerald-950">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Realistic Local Pricing:</strong> Item costs and your budget target will be automatically scaled to realistic local market rates in <strong>{targetCountry.currencyCode} ({targetCountry.currencySymbol})</strong>.
              </span>
            </div>
            <div className="flex items-start space-x-2 p-3 rounded-lg bg-zinc-50 border border-zinc-200 text-zinc-700">
              <CheckCircle2 className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
              <span>
                <strong>Unit System:</strong> Pack sizes and quantities will adapt to {targetCountry.metricUnits ? 'Metric (kg, L, g)' : 'Imperial (lbs, oz, gal)'}.
              </span>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-2.5 pt-2">
            <button
              type="button"
              id="btn-confirm-convert-plan"
              onClick={() => onConfirmConvert(targetCountry)}
              className="w-full p-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-xs transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Convert Current Shopping List to {targetCountry.currencyCode}</span>
            </button>

            <button
              type="button"
              id="btn-confirm-new-country-plan"
              onClick={() => onStartNewPlanForCountry(targetCountry)}
              className="w-full p-3 rounded-xl border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-800 font-semibold text-xs sm:text-sm flex items-center justify-center space-x-2 transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Generate Fresh {targetCountry.name} Preset Plan</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-zinc-50 border-t border-zinc-200 px-5 py-3 text-right">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-zinc-600 hover:text-zinc-900 px-3 py-1.5 rounded-lg hover:bg-zinc-100 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
