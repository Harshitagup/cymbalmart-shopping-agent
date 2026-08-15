import React from 'react';
import { Calendar, ShoppingBag, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { CUJStep } from '../types';

interface CUJStepperProps {
  currentStep: CUJStep;
  onSelectStep: (step: CUJStep) => void;
  hasPlan: boolean;
  totalCost: number;
  targetBudget: number;
}

export const CUJStepper: React.FC<CUJStepperProps> = ({
  currentStep,
  onSelectStep,
  hasPlan,
  totalCost,
  targetBudget,
}) => {
  const steps: { key: CUJStep; number: string; title: string; subtitle: string; icon: React.ComponentType<{ className?: string }> }[] = [
    {
      key: 'define',
      number: '1',
      title: 'Define Event',
      subtitle: 'Type, theme, budget & guests',
      icon: Calendar,
    },
    {
      key: 'review',
      number: '2',
      title: 'Review List',
      subtitle: 'Aisles & budget alignment',
      icon: ShoppingBag,
    },
    {
      key: 'refine_checkout',
      number: '3',
      title: 'Refine & Checkout',
      subtitle: 'AI adjustments & 1-click cart',
      icon: Sparkles,
    },
  ];

  const getStepIndex = (s: CUJStep) => (s === 'define' ? 0 : s === 'review' ? 1 : 2);
  const currentIdx = getStepIndex(currentStep);

  return (
    <div id="cuj-stepper" className="bg-white rounded-2xl border border-zinc-200 shadow-2xs p-3 sm:p-4 mb-6">
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {steps.map((step, idx) => {
          const isActive = currentStep === step.key;
          const isPassed = currentIdx > idx && hasPlan;
          const Icon = step.icon;

          return (
            <React.Fragment key={step.key}>
              <button
                type="button"
                onClick={() => {
                  if (step.key === 'define' || hasPlan) {
                    onSelectStep(step.key);
                  }
                }}
                disabled={step.key !== 'define' && !hasPlan}
                className={`flex items-center space-x-3 text-left p-2.5 sm:p-3 rounded-xl transition-all flex-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                  isActive
                    ? 'bg-zinc-900 text-white shadow-xs'
                    : isPassed
                    ? 'bg-emerald-50/70 border border-emerald-200 text-emerald-900 hover:bg-emerald-100/60'
                    : 'bg-zinc-50 border border-zinc-200/80 text-zinc-700 hover:bg-zinc-100'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-transform ${
                    isActive
                      ? 'bg-gradient-to-tr from-amber-400 to-rose-500 text-white shadow-2xs'
                      : isPassed
                      ? 'bg-emerald-600 text-white'
                      : 'bg-zinc-200 text-zinc-700'
                  }`}
                >
                  {isPassed ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[10px] uppercase font-bold tracking-wider opacity-70">
                      Task {step.number}
                    </span>
                    {step.key === 'review' && hasPlan && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                          totalCost <= targetBudget
                            ? 'bg-emerald-200/80 text-emerald-900'
                            : 'bg-amber-200/80 text-amber-900'
                        }`}
                      >
                        {totalCost <= targetBudget ? 'On Budget' : 'Over Budget'}
                      </span>
                    )}
                  </div>
                  <div className="font-bold text-xs sm:text-sm truncate">{step.title}</div>
                  <div className="text-[11px] opacity-75 truncate">{step.subtitle}</div>
                </div>
              </button>

              {idx < steps.length - 1 && (
                <div className="hidden md:flex items-center text-zinc-300">
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
