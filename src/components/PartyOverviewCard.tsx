import React, { useState } from 'react';
import {
  Sparkles,
  Users,
  Clock,
  Wine,
  Music,
  Snowflake,
  ShieldCheck,
  Edit3,
  GlassWater,
  PartyPopper,
  Info,
  ChevronDown,
  ChevronUp,
  Store,
  SlidersHorizontal,
  ShieldAlert,
  Leaf,
  Plus,
  Minus,
  Check,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PartyPlan, GuestBreakdown, ServingMode } from '../types';
import {
  formatCurrency,
  recalculateQuantitiesForGuests,
  calculateWasteMetrics,
} from '../utils/calculator';

interface PartyOverviewCardProps {
  plan: PartyPlan;
  onEditSpecs: () => void;
  totalCost: number;
  onUpdatePlan?: (updatedPlan: PartyPlan) => void;
  onOpenOptimizer?: () => void;
  onOpenWhatIf?: () => void;
  onOpenDietary?: () => void;
  onOpenIdeas?: () => void;
}

export const PartyOverviewCard: React.FC<PartyOverviewCardProps> = ({
  plan,
  onEditSpecs,
  totalCost,
  onUpdatePlan,
  onOpenOptimizer,
  onOpenWhatIf,
  onOpenDietary,
  onOpenIdeas,
}) => {
  const [showRecipe, setShowRecipe] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [showQuickGuestEditor, setShowQuickGuestEditor] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerConfetti = () => {
    confetti({
      particleCount: 75,
      spread: 60,
      origin: { y: 0.6 },
    });
  };

  const isUnderBudget = totalCost <= plan.targetBudget;
  const budgetDiff = Math.abs(plan.targetBudget - totalCost);

  const handleAdjustGuest = (type: keyof GuestBreakdown, delta: number) => {
    if (!onUpdatePlan) return;
    const currentBreakdown = plan.guestBreakdown || { adults: 12, teens: 0, kids: 0 };
    const nextVal = Math.max(0, (currentBreakdown[type] || 0) + delta);
    const nextBreakdown = { ...currentBreakdown, [type]: nextVal };

    const recalc = recalculateQuantitiesForGuests(
      plan.items,
      plan.guestBreakdown,
      nextBreakdown,
      plan.durationHours,
      plan.servingMode || 'standard',
      plan.venue
    );

    const updatedPlan: PartyPlan = {
      ...plan,
      guestCount: recalc.newTotalGuests,
      guestBreakdown: nextBreakdown,
      items: recalc.updatedItems,
      cateringRuleSummary: recalc.cateringRuleSummary,
    };

    onUpdatePlan(updatedPlan);
    setToastMessage(recalc.explanation);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleServingModeChange = (mode: ServingMode) => {
    if (!onUpdatePlan || mode === plan.servingMode) return;

    const recalc = recalculateQuantitiesForGuests(
      plan.items,
      plan.guestBreakdown,
      plan.guestBreakdown,
      plan.durationHours,
      mode,
      plan.venue
    );

    const updatedPlan: PartyPlan = {
      ...plan,
      servingMode: mode,
      items: recalc.updatedItems,
      cateringRuleSummary: recalc.cateringRuleSummary,
    };

    onUpdatePlan(updatedPlan);
    setToastMessage(`Switched to ${mode.replace('_', ' ')} serving mode. Quantities updated.`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const wasteInfo = calculateWasteMetrics(
    plan.items,
    plan.guestCount,
    plan.durationHours,
    plan.servingMode || 'standard'
  );

  return (
    <div
      id="party-overview-card"
      className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden mb-5"
    >
      {/* Toast Banner if guests recalculated */}
      {toastMessage && (
        <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between animate-in slide-in-from-top duration-200">
          <div className="flex items-center space-x-2">
            <Check className="w-3.5 h-3.5" />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-white/80 hover:text-white"
          >
            ×
          </button>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-emerald-950 text-white p-5 sm:p-6 relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                {plan.eventType}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold">
                Theme: {plan.theme}
              </span>
              {plan.servingMode && (
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-semibold capitalize flex items-center space-x-1">
                  <Leaf className="w-3 h-3 text-blue-400" />
                  <span>{plan.servingMode.replace('_', ' ')} Mode</span>
                </span>
              )}
              {plan.storeLocation && (
                <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 text-[11px] flex items-center space-x-1">
                  <Store className="w-3 h-3 text-emerald-400" />
                  <span>{plan.storeLocation}</span>
                </span>
              )}
              {plan.dietaryRestrictions && plan.dietaryRestrictions.length > 0 && (
                <button
                  type="button"
                  onClick={onOpenDietary}
                  className="px-2 py-0.5 rounded-full bg-teal-900/60 hover:bg-teal-800 text-teal-300 border border-teal-700/60 text-[11px] font-medium transition-colors flex items-center space-x-1"
                  title="Review Dietary Preferences & Allergy Intelligence"
                >
                  <ShieldAlert className="w-3 h-3 text-teal-400" />
                  <span>{plan.dietaryRestrictions.join(', ')}</span>
                </button>
              )}
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {plan.title}
            </h2>
            <p className="text-xs sm:text-sm text-zinc-300 mt-1 max-w-2xl leading-relaxed">
              {plan.themeDescription}
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
            {onOpenIdeas && (
              <button
                onClick={onOpenIdeas}
                id="btn-ai-ideas"
                className="px-3 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 text-xs font-bold border border-purple-400/30 transition-colors flex items-center space-x-1.5 cursor-pointer backdrop-blur-xs"
                title="Explore AI Party Ideas & Decorations"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-300" />
                <span>Party Ideas</span>
              </button>
            )}

            {onOpenWhatIf && (
              <button
                onClick={onOpenWhatIf}
                id="btn-whatif-simulator"
                className="px-3 py-2 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 text-xs font-bold border border-blue-400/30 transition-colors flex items-center space-x-1.5 cursor-pointer backdrop-blur-xs"
                title="Open What-If Scenario Simulator"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-blue-300" />
                <span>What If?</span>
              </button>
            )}

            <button
              onClick={triggerConfetti}
              id="btn-party-popper"
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/10 transition-colors flex items-center space-x-1.5 backdrop-blur-xs cursor-pointer"
              title="Celebrate party readiness!"
            >
              <PartyPopper className="w-3.5 h-3.5 text-amber-300" />
              <span>Celebrate!</span>
            </button>

            <button
              onClick={onEditSpecs}
              id="btn-edit-specs"
              className="px-3.5 py-2 rounded-xl bg-white text-zinc-900 hover:bg-zinc-100 text-xs font-bold transition-colors flex items-center space-x-1.5 shadow-xs cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-emerald-700" />
              <span>Edit Specs</span>
            </button>
          </div>
        </div>

        {/* Quick Stat Pill Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5 pt-4 border-t border-zinc-800/80">
          {/* Guest Count with Quick Stepper Toggle */}
          <div className="bg-zinc-900/80 backdrop-blur-xs p-2.5 rounded-xl border border-zinc-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-zinc-400 flex items-center space-x-1">
                  <Users className="w-3 h-3 text-emerald-400" />
                  <span>Guest Roster</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowQuickGuestEditor(!showQuickGuestEditor)}
                  className="text-[10px] text-emerald-400 hover:text-emerald-300 font-semibold"
                >
                  {showQuickGuestEditor ? 'Done' : 'Adjust ±'}
                </button>
              </div>
              <span className="text-base font-bold text-white mt-0.5 block">
                {plan.guestCount} Guests
              </span>
              <span className="text-[10px] text-zinc-400 block">
                {plan.guestBreakdown.adults}A · {plan.guestBreakdown.teens}T · {plan.guestBreakdown.kids}K
              </span>
            </div>

            {showQuickGuestEditor && (
              <div className="mt-2 pt-2 border-t border-zinc-800 space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Adults ({plan.guestBreakdown.adults})</span>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleAdjustGuest('adults', -1)}
                      className="w-5 h-5 bg-zinc-800 text-zinc-200 rounded flex items-center justify-center hover:bg-zinc-700 font-bold"
                    >
                      -
                    </button>
                    <button
                      onClick={() => handleAdjustGuest('adults', 1)}
                      className="w-5 h-5 bg-zinc-800 text-zinc-200 rounded flex items-center justify-center hover:bg-zinc-700 font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Teens ({plan.guestBreakdown.teens})</span>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleAdjustGuest('teens', -1)}
                      className="w-5 h-5 bg-zinc-800 text-zinc-200 rounded flex items-center justify-center hover:bg-zinc-700 font-bold"
                    >
                      -
                    </button>
                    <button
                      onClick={() => handleAdjustGuest('teens', 1)}
                      className="w-5 h-5 bg-zinc-800 text-zinc-200 rounded flex items-center justify-center hover:bg-zinc-700 font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Kids ({plan.guestBreakdown.kids})</span>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleAdjustGuest('kids', -1)}
                      className="w-5 h-5 bg-zinc-800 text-zinc-200 rounded flex items-center justify-center hover:bg-zinc-700 font-bold"
                    >
                      -
                    </button>
                    <button
                      onClick={() => handleAdjustGuest('kids', 1)}
                      className="w-5 h-5 bg-zinc-800 text-zinc-200 rounded flex items-center justify-center hover:bg-zinc-700 font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-zinc-900/80 backdrop-blur-xs p-2.5 rounded-xl border border-zinc-800">
            <span className="text-[11px] text-zinc-400 block flex items-center space-x-1">
              <Clock className="w-3 h-3 text-amber-400" />
              <span>Party Duration</span>
            </span>
            <span className="text-base font-bold text-white mt-0.5 block">
              {plan.durationHours} Hours
            </span>
            <span className="text-[10px] text-zinc-400">
              Venue: {plan.venue.replace(/_/g, ' ')}
            </span>
          </div>

          <div className="bg-zinc-900/80 backdrop-blur-xs p-2.5 rounded-xl border border-zinc-800">
            <span className="text-[11px] text-zinc-400 block flex items-center space-x-1">
              <Snowflake className="w-3 h-3 text-cyan-400" />
              <span>Ice & Drink Math</span>
            </span>
            <span className="text-base font-bold text-white mt-0.5 block">
              {plan.cateringRuleSummary?.iceLbsTotal || 15} lbs Ice
            </span>
            <span className="text-[10px] text-zinc-400">
              ~{plan.cateringRuleSummary?.drinksPerPerson || 4} drinks/guest (~
              {(plan.guestCount || 12) * (plan.cateringRuleSummary?.drinksPerPerson || 4)} total)
            </span>
          </div>

          <div className="bg-zinc-900/80 backdrop-blur-xs p-2.5 rounded-xl border border-zinc-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-zinc-400 block flex items-center space-x-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>Budget Alignment</span>
              </span>
              {onOpenOptimizer && !isUnderBudget && (
                <button
                  type="button"
                  onClick={onOpenOptimizer}
                  className="text-[10px] text-amber-300 hover:underline font-bold"
                >
                  Optimize
                </button>
              )}
            </div>
            <span
              className={`text-base font-bold mt-0.5 block ${
                isUnderBudget ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {formatCurrency(totalCost)} / {formatCurrency(plan.targetBudget)}
            </span>
            <span className="text-[10px] text-zinc-400">
              {isUnderBudget
                ? `${formatCurrency(budgetDiff)} buffer left`
                : `${formatCurrency(budgetDiff)} over target`}
            </span>
          </div>
        </div>
      </div>

      {/* Serving Strategy & Signature Drink Ribbon */}
      <div className="p-3.5 bg-zinc-50 border-t border-zinc-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
        {/* Serving Mode Switcher */}
        <div className="flex items-center space-x-2">
          <span className="font-bold text-zinc-700 flex items-center space-x-1">
            <Leaf className="w-3.5 h-3.5 text-emerald-600" />
            <span>Serving Strategy:</span>
          </span>
          <div className="inline-flex rounded-lg border border-zinc-200 bg-white p-0.5">
            <button
              onClick={() => handleServingModeChange('low_waste')}
              className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all ${
                plan.servingMode === 'low_waste'
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
              title="Lean, exact portions (0-5% surplus)"
            >
              Low Waste
            </button>
            <button
              onClick={() => handleServingModeChange('standard')}
              className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all ${
                !plan.servingMode || plan.servingMode === 'standard'
                  ? 'bg-indigo-700 text-white shadow-2xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
              title="Balanced portions (10-15% surplus)"
            >
              Standard
            </button>
            <button
              onClick={() => handleServingModeChange('generous')}
              className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all ${
                plan.servingMode === 'generous'
                  ? 'bg-purple-700 text-white shadow-2xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
              title="Generous portions & take-home doggy bags (25%+ surplus)"
            >
              Generous
            </button>
          </div>
          <span className="text-[11px] text-zinc-500 hidden lg:inline">
            ({wasteInfo.leftoversPercentRange} leftovers)
          </span>
        </div>

        {/* Signature drink teaser */}
        <div className="flex items-center space-x-2 text-zinc-800">
          <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
            <GlassWater className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-zinc-900 block">
              Signature Drink: {plan.signatureDrinkName || 'Cymbal Punch'}
            </span>
            <button
              onClick={() => setShowRecipe(!showRecipe)}
              className="text-[11px] text-emerald-800 font-semibold hover:underline flex items-center space-x-0.5 cursor-pointer"
            >
              <span>{showRecipe ? 'Hide Recipe' : 'View Batch Recipe & Ingredients'}</span>
              {showRecipe ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* Playlist recommendation */}
        {plan.playlistVibe && (
          <div className="flex items-center space-x-2 text-zinc-700">
            <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
              <Music className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold text-zinc-900 block">Playlist Vibe</span>
              <span className="text-[11px] text-zinc-600">{plan.playlistVibe}</span>
            </div>
          </div>
        )}

        {/* AI Tips Button */}
        {plan.aiTips && plan.aiTips.length > 0 && (
          <button
            onClick={() => setShowTips(!showTips)}
            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-100 transition-colors text-xs font-semibold cursor-pointer"
          >
            <Info className="w-3.5 h-3.5 text-amber-500" />
            <span>Host Tips ({plan.aiTips.length})</span>
            {showTips ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        )}
      </div>

      {/* Expandable Signature Recipe */}
      {showRecipe && plan.signatureDrinkRecipe && (
        <div className="p-4 bg-emerald-50/50 border-t border-emerald-200/60 text-xs">
          <div className="flex items-start space-x-2">
            <GlassWater className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
            <div>
              <div className="font-bold text-emerald-950 mb-1">
                🍹 Batch Recipe: {plan.signatureDrinkName}
              </div>
              <p className="text-emerald-900 leading-relaxed">{plan.signatureDrinkRecipe}</p>
              <p className="text-[11px] text-emerald-700 mt-1 font-medium italic">
                *All necessary ingredients for this drink have been automatically added to your CymbalMart cart below.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Expandable Host Tips */}
      {showTips && plan.aiTips && (
        <div className="p-4 bg-amber-50/40 border-t border-amber-200/60 text-xs">
          <div className="font-bold text-amber-950 mb-2 flex items-center space-x-1.5">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>CymbalMart Host Execution Tips</span>
          </div>
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-amber-900">
            {plan.aiTips.map((tip, idx) => (
              <li
                key={idx}
                className="bg-white/80 p-2.5 rounded-lg border border-amber-200/60 leading-normal"
              >
                <span className="font-bold text-amber-700 mr-1">#{idx + 1}</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
