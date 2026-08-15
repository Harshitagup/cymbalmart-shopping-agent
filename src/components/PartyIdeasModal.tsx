import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Check,
  X,
  Plus,
  Music,
  Gamepad2,
  Utensils,
  Wine,
  Cake,
  Palette,
  PackageCheck,
  TrendingUp,
  Flame,
} from 'lucide-react';
import { ShoppingItem, PartyPlan, PartyIdeaSuggestion } from '../types';
import { generatePartyIdeas, formatCurrency } from '../utils/calculator';

interface PartyIdeasModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: PartyPlan;
  onAddIdeaItem: (item: ShoppingItem) => void;
}

export function PartyIdeasModal({
  isOpen,
  onClose,
  plan,
  onAddIdeaItem,
}: PartyIdeasModalProps) {
  const [ideas, setIdeas] = useState<PartyIdeaSuggestion[]>([]);
  const [addedMap, setAddedMap] = useState<Record<string, boolean>>({});
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  useEffect(() => {
    if (isOpen && plan) {
      const generated = generatePartyIdeas(plan);
      setIdeas(generated);
    }
  }, [isOpen, plan]);

  if (!isOpen) return null;

  const handleAddItem = (idea: PartyIdeaSuggestion) => {
    if (!idea.suggestedItem) return;

    const newItem: ShoppingItem = {
      id: `idea-item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: idea.suggestedItem.name || idea.title,
      category: idea.suggestedItem.category || 'decor_ambiance',
      quantity: idea.suggestedItem.quantity || 1,
      unit: idea.suggestedItem.unit || 'pack',
      estimatedPrice: idea.suggestedItem.estimatedPrice || idea.estimatedCost,
      aisle: idea.suggestedItem.aisle || 'Seasonal / Party',
      brandType: idea.suggestedItem.brandType || 'cymbal_brand',
      notes: idea.description,
      priority: idea.priorityGroup === 'must_have' ? 'must_have' : 'nice_to_have',
      isAlreadyOwned: false,
      isPurchased: false,
      shoppingStatus: 'to_buy',
    };

    onAddIdeaItem(newItem);
    setAddedMap((prev) => ({ ...prev, [idea.id]: true }));
  };

  const filteredIdeas = selectedFilter === 'all'
    ? ideas
    : ideas.filter((i) => i.priorityGroup === selectedFilter);

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'decorations':
        return <Palette className="w-4 h-4 text-rose-600" />;
      case 'food':
        return <Utensils className="w-4 h-4 text-amber-600" />;
      case 'drinks':
        return <Wine className="w-4 h-4 text-purple-600" />;
      case 'desserts':
        return <Cake className="w-4 h-4 text-pink-600" />;
      case 'games':
      case 'entertainment':
        return <Gamepad2 className="w-4 h-4 text-indigo-600" />;
      case 'music_playlist':
        return <Music className="w-4 h-4 text-teal-600" />;
      default:
        return <Sparkles className="w-4 h-4 text-emerald-600" />;
    }
  };

  return (
    <div
      id="party-ideas-modal-overlay"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ideas-modal-title"
    >
      <div
        id="party-ideas-modal-container"
        className="relative bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-zinc-200 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-950 to-zinc-900 text-white p-5 sm:p-6 flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 id="ideas-modal-title" className="text-xl font-bold tracking-tight">
                  AI Party Inspiration & Upgrades
                </h2>
                <span className="bg-purple-500/30 text-purple-200 text-xs px-2.5 py-0.5 rounded-full font-medium border border-purple-400/30">
                  Custom Curated
                </span>
              </div>
              <p className="text-zinc-300 text-xs sm:text-sm mt-0.5">
                Personalized theme decor, crowd-pleaser games, and signature drink ideas for{' '}
                <strong>{plan.title}</strong>
              </p>
            </div>
          </div>
          <button
            id="close-party-ideas-modal-btn"
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Close Ideas Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="bg-zinc-50 border-b border-zinc-200 p-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Filter:
            </span>
            <button
              id="filter-all-ideas-btn"
              type="button"
              onClick={() => setSelectedFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                selectedFilter === 'all'
                  ? 'bg-zinc-900 text-white'
                  : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-100'
              }`}
            >
              All Ideas ({ideas.length})
            </button>
            <button
              id="filter-musthave-ideas-btn"
              type="button"
              onClick={() => setSelectedFilter('must_have')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                selectedFilter === 'must_have'
                  ? 'bg-purple-800 text-white'
                  : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-100'
              }`}
            >
              Must Haves
            </button>
            <button
              id="filter-recommended-ideas-btn"
              type="button"
              onClick={() => setSelectedFilter('recommended')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                selectedFilter === 'recommended'
                  ? 'bg-indigo-800 text-white'
                  : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-100'
              }`}
            >
              Recommended
            </button>
            <button
              id="filter-nicetohave-ideas-btn"
              type="button"
              onClick={() => setSelectedFilter('nice_to_have')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                selectedFilter === 'nice_to_have'
                  ? 'bg-teal-800 text-white'
                  : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-100'
              }`}
            >
              Nice to Have
            </button>
          </div>
        </div>

        {/* List of Ideas */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {filteredIdeas.map((idea) => {
            const isAdded = addedMap[idea.id];
            return (
              <div
                key={idea.id}
                id={`idea-card-${idea.id}`}
                className="bg-white rounded-xl p-4 border border-zinc-200 shadow-xs hover:border-purple-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="p-1.5 rounded-lg bg-zinc-100 border border-zinc-200/80">
                      {getCategoryIcon(idea.category)}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        idea.priorityGroup === 'must_have'
                          ? 'bg-rose-100 text-rose-800'
                          : idea.priorityGroup === 'recommended'
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'bg-teal-100 text-teal-800'
                      }`}
                    >
                      {idea.priorityGroup.replace('_', ' ')}
                    </span>
                    <h4 className="font-bold text-sm text-zinc-900">{idea.title}</h4>
                  </div>
                  <p className="text-xs text-zinc-600 leading-relaxed pl-7">
                    {idea.description}
                  </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end space-x-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-100 pl-7 sm:pl-0">
                  <div className="text-right">
                    <span className="text-sm font-bold text-zinc-900 block">
                      {idea.estimatedCost > 0 ? formatCurrency(idea.estimatedCost) : 'Free ($0)'}
                    </span>
                    {idea.budgetImpactPercent > 0 && (
                      <span className="text-[10px] text-zinc-400 font-medium">
                        +{idea.budgetImpactPercent}% budget impact
                      </span>
                    )}
                  </div>

                  {idea.suggestedItem ? (
                    <button
                      id={`add-idea-btn-${idea.id}`}
                      type="button"
                      onClick={() => handleAddItem(idea)}
                      disabled={isAdded}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-xs ${
                        isAdded
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-default'
                          : 'bg-purple-700 text-white hover:bg-purple-800 active:scale-95'
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Added to Cart</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add to List</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <span className="text-xs text-zinc-400 italic">Streaming / DIY Idea</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="bg-zinc-50 border-t border-zinc-200 p-4 sm:p-5 flex items-center justify-between">
          <p className="text-xs text-zinc-500">
            Items added will be organized directly into their respective CymbalMart store aisles.
          </p>
          <button
            id="done-party-ideas-btn"
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
