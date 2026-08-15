import React, { useState } from 'react';
import {
  Sparkles,
  ShoppingBag,
  Truck,
  Navigation,
  Clock,
  CheckCircle2,
  Calendar,
  DollarSign,
  ShieldCheck,
  Send,
  Loader2,
  Tag,
  Store,
  ChevronRight,
  TrendingDown,
} from 'lucide-react';
import { PartyPlan, ShoppingItem, ChatMessage } from '../types';
import { calculateBudgetMetrics, formatCurrency } from '../utils/calculator';
import { CYMBALMART_STORES } from '../data/presets';
import { getCountryConfig } from '../data/countries';

interface RefineAndCheckoutViewProps {
  plan: PartyPlan;
  items: ShoppingItem[];
  chatHistory: ChatMessage[];
  isChatLoading: boolean;
  onSendMessage: (text: string) => Promise<void>;
  onUpdateItems: (updated: ShoppingItem[]) => void;
  onUpdateTimelineTask: (taskId: string, isCompleted: boolean) => void;
  onFinalizeOrder: (fulfillmentType: 'curbside_pickup' | 'express_delivery' | 'in_store_walk', storeLocation: string) => void;
  onBackToReviewList: () => void;
}

export const RefineAndCheckoutView: React.FC<RefineAndCheckoutViewProps> = ({
  plan,
  items,
  chatHistory,
  isChatLoading,
  onSendMessage,
  onUpdateItems,
  onUpdateTimelineTask,
  onFinalizeOrder,
  onBackToReviewList,
}) => {
  const [chatInput, setChatInput] = useState('');
  const countryConfig = getCountryConfig(plan.countryCode || 'IN');
  const availableStores = countryConfig.defaultStores.length > 0 ? countryConfig.defaultStores : CYMBALMART_STORES;

  const [selectedFulfillment, setSelectedFulfillment] = useState<'curbside_pickup' | 'express_delivery' | 'in_store_walk'>(
    plan.fulfillmentType || 'curbside_pickup'
  );
  const [selectedStore, setSelectedStore] = useState<string>(
    plan.storeLocation || availableStores[0]?.name || 'CymbalMart Superstore'
  );
  const [timeSlot, setTimeSlot] = useState<string>('Tomorrow, 2:00 PM - 3:00 PM');

  const metrics = calculateBudgetMetrics(items, plan.targetBudget, plan.guestCount);
  const isOverBudget = metrics.isOverBudget;
  const currencyCode = plan.currencyCode || countryConfig.currencyCode;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;
    const text = chatInput.trim();
    setChatInput('');
    await onSendMessage(text);
  };

  return (
    <div id="refine-and-checkout-view" className="space-y-5">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Task 3: Refine & Checkout
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
              {countryConfig.flag} {countryConfig.name} Market
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-900 tracking-tight">
            AI Assistant Refinements & 1-Click Order
          </h2>
          <p className="text-xs sm:text-sm text-zinc-600 mt-0.5">
            Chat with Gemini to fine-tune substitutions, review host prep timeline, and place your order.
          </p>
        </div>

        <button
          type="button"
          onClick={onBackToReviewList}
          className="inline-flex items-center space-x-1 px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold transition-colors cursor-pointer self-start sm:self-auto"
        >
          <span>← Back to Shopping List</span>
        </button>
      </div>

      {/* Main Grid: Left = Chat & Logistics; Right = Cart & Checkout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Interactive Chat & Logistics Timeline */}
        <div className="lg:col-span-7 space-y-4">
          {/* AI Refinement Chat Console */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-xs flex flex-col h-[480px]">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-800 font-bold text-xs">
                  <Sparkles className="w-4 h-4 text-emerald-700" />
                </div>
                <div>
                  <h3 className="font-bold text-xs sm:text-sm text-zinc-900">
                    CymbalMart AI Shopping Refinement Assistant
                  </h3>
                  <p className="text-[10px] text-zinc-500">
                    Ask to cut budget by {countryConfig.currencySymbol}500, substitute items, or adjust for {countryConfig.name} tastes
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Active</span>
              </div>
            </div>

            {/* Quick Prompt Chips */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 mb-2 scrollbar-none">
              {[
                `Cut budget by ${countryConfig.currencySymbol}${countryConfig.budgetStep}`,
                'Swap national brands to Cymbal Choice',
                'Ensure enough pure vegetarian mains',
                'Add extra party ice & chilled drinks',
                'Suggest kid-friendly snacks',
              ].map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => onSendMessage(prompt)}
                  disabled={isChatLoading}
                  className="px-2.5 py-1 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[11px] font-medium whitespace-nowrap border border-zinc-200 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-3">
              {chatHistory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4 text-zinc-400">
                  <Sparkles className="w-8 h-8 text-zinc-300 mb-2" />
                  <p className="text-xs font-semibold text-zinc-700">Need adjustments to your plan?</p>
                  <p className="text-[11px] text-zinc-500 max-w-xs mt-1">
                    Try asking: "Swap all sodas for healthy juices", "Trim budget under {countryConfig.currencySymbol}{plan.targetBudget}", or "Add gluten-free dessert".
                  </p>
                </div>
              ) : (
                chatHistory.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-zinc-900 text-white rounded-br-xs'
                          : msg.role === 'system'
                          ? 'bg-rose-50 text-rose-800 border border-rose-200'
                          : 'bg-zinc-100 text-zinc-800 rounded-bl-xs'
                      }`}
                    >
                      <p>{msg.content}</p>

                      {msg.appliedActions && msg.appliedActions.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-zinc-200/80 space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                            ✓ Cart Actions Applied by Gemini:
                          </span>
                          {msg.appliedActions.map((act, i) => (
                            <div key={i} className="text-[11px] text-zinc-700 flex items-center space-x-1">
                              <span>•</span>
                              <span>{act.description}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="text-[9px] text-zinc-400 mt-0.5 px-1">{msg.timestamp}</span>
                  </div>
                ))
              )}

              {isChatLoading && (
                <div className="flex items-center space-x-2 text-xs text-zinc-500 p-2">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                  <span>Gemini is optimizing your CymbalMart cart & portions...</span>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSend} className="flex items-center space-x-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask Gemini to adjust items, budget, or dietary needs..."
                disabled={isChatLoading}
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white text-xs font-medium text-zinc-900 focus:border-emerald-600 transition-colors"
              />
              <button
                type="submit"
                disabled={isChatLoading || !chatInput.trim()}
                className="p-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Host Prep Run-of-Show Card */}
          <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
            <div className="flex items-center space-x-2 mb-3">
              <Calendar className="w-4 h-4 text-emerald-700" />
              <h3 className="font-bold text-sm text-zinc-900">
                Host Run-of-Show Logistics Timeline
              </h3>
            </div>

            <div className="space-y-2">
              {plan.prepTimeline.map((task) => (
                <div
                  key={task.id}
                  onClick={() => onUpdateTimelineTask(task.id, !task.isCompleted)}
                  className={`flex items-start space-x-2.5 p-2.5 rounded-xl border transition-all cursor-pointer ${
                    task.isCompleted ? 'bg-zinc-50 border-zinc-200 opacity-60' : 'bg-white border-zinc-200 hover:border-zinc-300'
                  }`}
                >
                  <button
                    type="button"
                    className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center ${
                      task.isCompleted ? 'bg-emerald-600 text-white' : 'border border-zinc-300 bg-white text-transparent'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
                      {task.timeline.replace(/_/g, ' ')}
                    </span>
                    <span className={`text-xs font-medium ${task.isCompleted ? 'line-through text-zinc-400' : 'text-zinc-800'}`}>
                      {task.task}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: CymbalMart Fulfillment & 1-Click Order Checkout */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
            <h3 className="font-extrabold text-sm text-zinc-900 uppercase tracking-wider mb-3">
              CymbalMart Fulfillment & Checkout
            </h3>

            {/* Store Location */}
            <div className="mb-4">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1 flex items-center space-x-1">
                <Store className="w-3 h-3 text-emerald-600" />
                <span>Pickup / Delivery Store ({countryConfig.name})</span>
              </label>
              <select
                value={selectedStore}
                onChange={(e) => setSelectedStore(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50 text-xs font-medium text-zinc-900"
              >
                {availableStores.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name} ({s.distance})
                  </option>
                ))}
              </select>
            </div>

            {/* Fulfillment Options */}
            <div className="space-y-2 mb-4">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                Choose Fulfillment Method
              </label>

              {[
                {
                  id: 'curbside_pickup',
                  title: 'Free Curbside Pickup',
                  badge: 'Free',
                  desc: 'Loaded into your trunk at CymbalMart Bay 4',
                  icon: ShoppingBag,
                },
                {
                  id: 'express_delivery',
                  title: 'CymbalMart Express 2-Hr Delivery',
                  badge: 'Express',
                  desc: 'Direct refrigerated delivery to venue',
                  icon: Truck,
                },
                {
                  id: 'in_store_walk',
                  title: 'In-Store Smart Aisle Walk',
                  badge: 'Self Pick',
                  desc: 'Aisle-by-aisle route for fast 15-min trip',
                  icon: Navigation,
                },
              ].map((opt) => {
                const isSelected = selectedFulfillment === opt.id;
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedFulfillment(opt.id as any)}
                    className={`w-full p-3 rounded-xl border text-left flex items-start space-x-2.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20'
                        : 'border-zinc-200 bg-white hover:bg-zinc-50'
                    }`}
                  >
                    <div
                      className={`p-1.5 rounded-lg shrink-0 ${
                        isSelected ? 'bg-emerald-700 text-white' : 'bg-zinc-100 text-zinc-600'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-900">{opt.title}</span>
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-1.5 py-0.2 rounded">
                          {opt.badge}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-500 mt-0.5">{opt.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Time Slot */}
            <div className="mb-4">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1 flex items-center space-x-1">
                <Clock className="w-3 h-3 text-emerald-600" />
                <span>Selected Time Slot</span>
              </label>
              <select
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50 text-xs font-semibold text-zinc-900"
              >
                <option value="Today, 4:00 PM - 5:00 PM (Express)">Today, 4:00 PM - 5:00 PM (Express)</option>
                <option value="Tomorrow, 10:00 AM - 11:00 AM">Tomorrow, 10:00 AM - 11:00 AM</option>
                <option value="Tomorrow, 2:00 PM - 3:00 PM">Tomorrow, 2:00 PM - 3:00 PM</option>
                <option value="Saturday Morning (Party Day), 9:00 AM">Saturday Morning (Party Day), 9:00 AM</option>
              </select>
            </div>

            {/* Itemized Cost Summary */}
            <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-200 space-y-2 text-xs mb-4">
              <div className="flex justify-between text-zinc-600">
                <span>Cart Subtotal ({metrics.totalItemsCount - metrics.pantryItemsCount} items)</span>
                <span className="font-semibold text-zinc-900">{formatCurrency(metrics.totalEstimatedCost, currencyCode)}</span>
              </div>

              {metrics.cymbalBrandSavings > 0 && (
                <div className="flex justify-between text-emerald-800 font-medium">
                  <span>Cymbal Choice Brand Savings</span>
                  <span>-{formatCurrency(metrics.cymbalBrandSavings, currencyCode)}</span>
                </div>
              )}

              {metrics.alreadyOwnedSavings > 0 && (
                <div className="flex justify-between text-amber-800 font-medium">
                  <span>Home Pantry Savings</span>
                  <span>-{formatCurrency(metrics.alreadyOwnedSavings, currencyCode)}</span>
                </div>
              )}

              <div className="flex justify-between text-zinc-600">
                <span>Estimated Local Tax (5%)</span>
                <span>{formatCurrency(metrics.totalEstimatedCost * 0.05, currencyCode)}</span>
              </div>

              <div className="pt-2 border-t border-zinc-200 flex justify-between items-baseline">
                <div>
                  <span className="font-extrabold text-zinc-900 text-sm block">Final Cart Total</span>
                  <span className="text-[10px] text-zinc-500">
                    Target Budget: {formatCurrency(plan.targetBudget, currencyCode)}
                  </span>
                </div>
                <span className="font-extrabold text-lg text-zinc-900">
                  {formatCurrency(metrics.totalEstimatedCost * 1.05, currencyCode)}
                </span>
              </div>
            </div>

            {/* 1-Click Finalize Order Button */}
            <button
              type="button"
              id="btn-finalize-order"
              onClick={() => onFinalizeOrder(selectedFulfillment, selectedStore)}
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-sm shadow-sm flex items-center justify-center space-x-2 transition-all transform active:scale-[0.99] cursor-pointer"
            >
              <ShieldCheck className="w-5 h-5 text-amber-300" />
              <span>Finalize & Place CymbalMart Order</span>
            </button>

            <div className="mt-2 text-center text-[10px] text-zinc-400">
              🔒 Powered by CymbalMart 1-Click Express Checkout • Free cancellations up to 1 hr before
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
