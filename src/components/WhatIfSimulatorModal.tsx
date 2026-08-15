import React, { useState, useMemo } from 'react';
import {
  SlidersHorizontal,
  X,
  Check,
  RotateCcw,
  Users,
  Clock,
  DollarSign,
  Leaf,
  Scale,
  Sparkles,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { PartyPlan, GuestBreakdown, ServingMode, ShoppingItem } from '../types';
import {
  calculateBudgetMetrics,
  recalculateQuantitiesForGuests,
  calculateWasteMetrics,
  formatCurrency,
} from '../utils/calculator';

interface WhatIfSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: PartyPlan;
  onApplyScenario: (updatedPlan: PartyPlan) => void;
}

export function WhatIfSimulatorModal({
  isOpen,
  onClose,
  plan,
  onApplyScenario,
}: WhatIfSimulatorModalProps) {
  // Scenario state defaults to current plan
  const [scenarioBudget, setScenarioBudget] = useState<number>(plan.targetBudget || 250);
  const [scenarioBreakdown, setScenarioBreakdown] = useState<GuestBreakdown>({
    adults: plan.guestBreakdown?.adults || 12,
    teens: plan.guestBreakdown?.teens || 0,
    kids: plan.guestBreakdown?.kids || 0,
  });
  const [scenarioDuration, setScenarioDuration] = useState<number>(plan.durationHours || 3);
  const [scenarioServingMode, setScenarioServingMode] = useState<ServingMode>(
    plan.servingMode || 'standard'
  );

  // Reset to original plan
  const resetToCurrent = () => {
    setScenarioBudget(plan.targetBudget);
    setScenarioBreakdown({ ...plan.guestBreakdown });
    setScenarioDuration(plan.durationHours);
    setScenarioServingMode(plan.servingMode || 'standard');
  };

  const totalScenarioGuests = Math.max(
    1,
    (scenarioBreakdown.adults || 0) + (scenarioBreakdown.teens || 0) + (scenarioBreakdown.kids || 0)
  );

  // Compute proposed items and metrics
  const proposedCalculation = useMemo(() => {
    const recalc = recalculateQuantitiesForGuests(
      plan.items,
      plan.guestBreakdown,
      scenarioBreakdown,
      scenarioDuration,
      scenarioServingMode,
      plan.venue
    );

    const proposedMetrics = calculateBudgetMetrics(
      recalc.updatedItems,
      scenarioBudget,
      totalScenarioGuests
    );

    const proposedWaste = calculateWasteMetrics(
      recalc.updatedItems,
      totalScenarioGuests,
      scenarioDuration,
      scenarioServingMode
    );

    return {
      items: recalc.updatedItems,
      metrics: proposedMetrics,
      waste: proposedWaste,
      catering: recalc.cateringRuleSummary,
    };
  }, [
    plan.items,
    plan.guestBreakdown,
    plan.venue,
    scenarioBreakdown,
    scenarioDuration,
    scenarioServingMode,
    scenarioBudget,
    totalScenarioGuests,
  ]);

  const currentMetrics = useMemo(() => {
    return calculateBudgetMetrics(plan.items, plan.targetBudget, plan.guestCount);
  }, [plan.items, plan.targetBudget, plan.guestCount]);

  const currentWaste = useMemo(() => {
    return calculateWasteMetrics(
      plan.items,
      plan.guestCount,
      plan.durationHours,
      plan.servingMode || 'standard'
    );
  }, [plan.items, plan.guestCount, plan.durationHours, plan.servingMode]);

  if (!isOpen) return null;

  const costDifference = proposedCalculation.metrics.totalEstimatedCost - currentMetrics.totalEstimatedCost;
  const isCostHigher = costDifference > 0;

  const handleApply = () => {
    const updatedPlan: PartyPlan = {
      ...plan,
      targetBudget: scenarioBudget,
      guestCount: totalScenarioGuests,
      guestBreakdown: scenarioBreakdown,
      durationHours: scenarioDuration,
      servingMode: scenarioServingMode,
      items: proposedCalculation.items,
      cateringRuleSummary: proposedCalculation.catering,
    };

    onApplyScenario(updatedPlan);
    onClose();
  };

  return (
    <div
      id="whatif-simulator-modal-overlay"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="whatif-title"
    >
      <div
        id="whatif-simulator-container"
        className="relative bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-zinc-200 overflow-hidden"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-zinc-900 text-white p-5 sm:p-6 flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 id="whatif-title" className="text-xl font-bold tracking-tight">
                  Budget & Guest "What If?" Simulator
                </h2>
                <span className="bg-blue-500/30 text-blue-200 text-xs px-2.5 py-0.5 rounded-full font-medium border border-blue-400/30">
                  Scenario Sandbox
                </span>
              </div>
              <p className="text-zinc-300 text-xs sm:text-sm mt-0.5">
                Simulate different guest headcounts, serving modes, and budget targets in real time
              </p>
            </div>
          </div>
          <button
            id="close-whatif-modal-btn"
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Close Simulator"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Controls & Side-by-Side Comparison */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Top Interactive Controls */}
          <div className="bg-zinc-50 rounded-2xl p-4 sm:p-5 border border-zinc-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-900 flex items-center space-x-2">
                <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
                <span>Adjust Simulation Variables</span>
              </h3>
              <button
                id="reset-scenario-btn"
                type="button"
                onClick={resetToCurrent}
                className="text-xs font-semibold text-zinc-600 hover:text-indigo-700 flex items-center space-x-1 hover:bg-zinc-200/60 px-2 py-1 rounded-md transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Current Plan</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Target Budget Slider */}
              <div className="bg-white p-3.5 rounded-xl border border-zinc-200 shadow-xs">
                <label className="text-xs font-semibold text-zinc-700 flex items-center justify-between">
                  <span>Target Budget</span>
                  <span className="font-bold text-emerald-700 text-sm">
                    {formatCurrency(scenarioBudget)}
                  </span>
                </label>
                <input
                  id="scenario-budget-slider"
                  type="range"
                  min="50"
                  max="1000"
                  step="10"
                  value={scenarioBudget}
                  onChange={(e) => setScenarioBudget(Number(e.target.value))}
                  className="w-full mt-2 accent-emerald-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-zinc-400 mt-1">
                  <span>$50</span>
                  <span>$500</span>
                  <span>$1,000</span>
                </div>
              </div>

              {/* Guest Mix (Adults / Teens / Kids) */}
              <div className="bg-white p-3.5 rounded-xl border border-zinc-200 shadow-xs">
                <label className="text-xs font-semibold text-zinc-700 flex items-center justify-between">
                  <span>Guest Headcount</span>
                  <span className="font-bold text-indigo-700 text-sm">
                    {totalScenarioGuests} Guests
                  </span>
                </label>
                <div className="grid grid-cols-3 gap-1.5 mt-2">
                  <div>
                    <span className="text-[10px] text-zinc-500 font-medium block">Adults</span>
                    <input
                      id="scenario-adults-input"
                      type="number"
                      min="0"
                      max="100"
                      value={scenarioBreakdown.adults}
                      onChange={(e) =>
                        setScenarioBreakdown({
                          ...scenarioBreakdown,
                          adults: Math.max(0, parseInt(e.target.value) || 0),
                        })
                      }
                      className="w-full border border-zinc-200 rounded-lg text-center text-xs py-1 font-semibold focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 font-medium block">Teens</span>
                    <input
                      id="scenario-teens-input"
                      type="number"
                      min="0"
                      max="100"
                      value={scenarioBreakdown.teens}
                      onChange={(e) =>
                        setScenarioBreakdown({
                          ...scenarioBreakdown,
                          teens: Math.max(0, parseInt(e.target.value) || 0),
                        })
                      }
                      className="w-full border border-zinc-200 rounded-lg text-center text-xs py-1 font-semibold focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 font-medium block">Kids</span>
                    <input
                      id="scenario-kids-input"
                      type="number"
                      min="0"
                      max="100"
                      value={scenarioBreakdown.kids}
                      onChange={(e) =>
                        setScenarioBreakdown({
                          ...scenarioBreakdown,
                          kids: Math.max(0, parseInt(e.target.value) || 0),
                        })
                      }
                      className="w-full border border-zinc-200 rounded-lg text-center text-xs py-1 font-semibold focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Event Duration Slider */}
              <div className="bg-white p-3.5 rounded-xl border border-zinc-200 shadow-xs">
                <label className="text-xs font-semibold text-zinc-700 flex items-center justify-between">
                  <span>Duration</span>
                  <span className="font-bold text-zinc-900 text-sm">
                    {scenarioDuration} Hours
                  </span>
                </label>
                <input
                  id="scenario-duration-slider"
                  type="range"
                  min="1"
                  max="8"
                  step="0.5"
                  value={scenarioDuration}
                  onChange={(e) => setScenarioDuration(Number(e.target.value))}
                  className="w-full mt-2 accent-indigo-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-zinc-400 mt-1">
                  <span>1 hr</span>
                  <span>4 hrs</span>
                  <span>8 hrs</span>
                </div>
              </div>

              {/* Serving Mode Selector */}
              <div className="bg-white p-3.5 rounded-xl border border-zinc-200 shadow-xs">
                <label className="text-xs font-semibold text-zinc-700 block mb-1.5">
                  Serving & Waste Mode
                </label>
                <div className="grid grid-cols-3 gap-1">
                  <button
                    id="mode-low-waste-btn"
                    type="button"
                    onClick={() => setScenarioServingMode('low_waste')}
                    className={`py-1 px-1.5 rounded-lg text-[11px] font-semibold border transition-all text-center ${
                      scenarioServingMode === 'low_waste'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300 ring-1 ring-emerald-400'
                        : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100'
                    }`}
                  >
                    Low Waste
                  </button>
                  <button
                    id="mode-standard-btn"
                    type="button"
                    onClick={() => setScenarioServingMode('standard')}
                    className={`py-1 px-1.5 rounded-lg text-[11px] font-semibold border transition-all text-center ${
                      scenarioServingMode === 'standard'
                        ? 'bg-indigo-100 text-indigo-800 border-indigo-300 ring-1 ring-indigo-400'
                        : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100'
                    }`}
                  >
                    Standard
                  </button>
                  <button
                    id="mode-generous-btn"
                    type="button"
                    onClick={() => setScenarioServingMode('generous')}
                    className={`py-1 px-1.5 rounded-lg text-[11px] font-semibold border transition-all text-center ${
                      scenarioServingMode === 'generous'
                        ? 'bg-purple-100 text-purple-800 border-purple-300 ring-1 ring-purple-400'
                        : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100'
                    }`}
                  >
                    Generous
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Comparison Cards: Current vs Proposed */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Current Plan Card */}
            <div className="bg-white rounded-2xl p-5 border border-zinc-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-zinc-400"></span>
                  <h4 className="font-bold text-zinc-800 text-sm">Current Active Plan</h4>
                </div>
                <span className="text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-md font-medium">
                  {plan.guestCount} Guests
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Estimated Total Spend:</span>
                  <span className="font-bold text-zinc-900 text-sm">
                    {formatCurrency(currentMetrics.totalEstimatedCost)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Target Budget:</span>
                  <span className="font-semibold text-zinc-700">
                    {formatCurrency(plan.targetBudget)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Cost Per Guest:</span>
                  <span className="font-semibold text-zinc-700">
                    {formatCurrency(currentMetrics.costPerGuest)} / guest
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Serving Strategy:</span>
                  <span className="font-semibold text-zinc-700 capitalize">
                    {(plan.servingMode || 'standard').replace('_', ' ')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Estimated Leftovers:</span>
                  <span className="font-medium text-zinc-600">
                    {currentWaste.leftoversPercentRange}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Party Ice Required:</span>
                  <span className="font-semibold text-zinc-700">
                    {plan.cateringRuleSummary?.iceLbsTotal || 15} lbs
                  </span>
                </div>
              </div>
            </div>

            {/* Proposed Scenario Card */}
            <div className="bg-gradient-to-br from-indigo-50/50 via-white to-blue-50/50 rounded-2xl p-5 border-2 border-indigo-300 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-indigo-100">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse"></span>
                  <h4 className="font-bold text-indigo-950 text-sm">Simulated Scenario</h4>
                </div>
                <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md font-bold">
                  {totalScenarioGuests} Guests
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-600">Simulated Spend:</span>
                  <div className="text-right">
                    <span className="font-bold text-indigo-900 text-sm">
                      {formatCurrency(proposedCalculation.metrics.totalEstimatedCost)}
                    </span>
                    <span
                      className={`block text-[11px] font-semibold ${
                        isCostHigher ? 'text-amber-600' : 'text-emerald-600'
                      }`}
                    >
                      {isCostHigher
                        ? `+${formatCurrency(costDifference)} (+${Math.round(
                            (costDifference / (currentMetrics.totalEstimatedCost || 1)) * 100
                          )}%)`
                        : `${formatCurrency(costDifference)} (${Math.round(
                            (costDifference / (currentMetrics.totalEstimatedCost || 1)) * 100
                          )}%)`}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-600">Target Budget:</span>
                  <span className="font-semibold text-indigo-900">
                    {formatCurrency(scenarioBudget)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-600">Cost Per Guest:</span>
                  <span className="font-semibold text-indigo-900">
                    {formatCurrency(proposedCalculation.metrics.costPerGuest)} / guest
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-600">Serving Strategy:</span>
                  <span className="font-semibold text-indigo-900 capitalize">
                    {scenarioServingMode.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-600">Estimated Leftovers:</span>
                  <span className="font-semibold text-emerald-700">
                    {proposedCalculation.waste.leftoversPercentRange}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-600">Party Ice Required:</span>
                  <span className="font-semibold text-indigo-900">
                    {proposedCalculation.catering.iceLbsTotal} lbs
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Waste Control Explanation Notice */}
          <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200 text-xs text-blue-900 flex items-start space-x-2.5">
            <Leaf className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold">Waste & Portion Control Note:</strong>{' '}
              {proposedCalculation.waste.portionsDescription} (Estimated{' '}
              {proposedCalculation.waste.estimatedPortionsTotal} total servings across appetizers, mains, and sides).
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-zinc-50 border-t border-zinc-200 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-zinc-500">
            Clicking <strong>Apply Scenario</strong> will update your active shopping quantities and budget targets.
          </p>
          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <button
              id="keep-current-scenario-btn"
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-zinc-300 bg-white text-zinc-700 text-sm font-semibold hover:bg-zinc-100 transition-colors"
            >
              Keep Current Plan
            </button>
            <button
              id="apply-scenario-btn"
              type="button"
              onClick={handleApply}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-indigo-700 text-white text-sm font-bold shadow-sm hover:bg-indigo-800 transition-all flex items-center justify-center space-x-2"
            >
              <Check className="w-4 h-4" />
              <span>Apply Scenario to Cart</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
