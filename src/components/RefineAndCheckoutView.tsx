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
  const [selectedFulfillment, setSelectedFulfillment] = useState<'curbside_pickup' | 'express_delivery' | 'in_store_walk'>(
    plan.fulfillmentType || 'curbside_pickup'
  );
  const [selectedStore, setSelectedStore] = useState<string>(
    plan.storeLocation || CYMBALMART_STORES[0].name
  );
  const [timeSlot, setTimeSlot] = useState<string>('Tomorrow, 2:00 PM - 3:00 PM');

  const metrics = calculateBudgetMetrics(items, plan.targetBudget, plan.guestCount);
  const isOverBudget = metrics.isOverBudget;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;
    const text = chatInput.trim();
    setChatInput('');
    await onSendMessage(text);
  };

  const quickRefinePrompts = [
    'Cut $25 from non-essential items to align with my budget',
    'Make all appetizers 100% Gluten-Free and Nut-Free',
    'Add 4 more adult guests and increase craft drinks and ice',
    'Swap all national brands to Cymbal Choice Store Brands',
    'Add ingredients for signature mocktail punch',
  ];

  return (
    <div id="refine-checkout-view" className="space-y-6">
      {/* Top CUJ Banner */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Task 3: Refine & Finalize Checkout
              </span>
              <span className="text-xs text-zinc-500 font-semibold">
                Event: {plan.title}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-900 tracking-tight mt-1">
              Refine Constraints & Finalize CymbalMart Order
            </h2>
          </div>

          <button
            type="button"
            onClick={onBackToReviewList}
            className="text-xs font-semibold text-zinc-600 hover:text-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-200 hover:bg-zinc-50 transition-colors cursor-pointer self-start sm:self-center"
          >
            ← Back to Review List
          </button>
        </div>
      </div>

      {/* 2-Column Layout: Left (AI Co-Pilot & Constraints), Right (Run-of-Show & Fulfillment Checkout) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: AI Constraint Refiner */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-2xs">
                  <Sparkles className="w-4 h-4 text-amber-200" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-zinc-900 flex items-center space-x-1.5">
                    <span>CymbalMart Assistant</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                      Co-Pilot
                    </span>
                  </h3>
                  <p className="text-[11px] text-zinc-500">
                    Ask to adjust dietary constraints, trim budget, swap to store brands, or recalculate portions
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Prompt Chips */}
            <div className="mb-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-1.5">
                Quick Constraint Adjustments:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {quickRefinePrompts.map((promptText, idx) => (
                  <button
                    key={idx}
                    type="button"
                    disabled={isChatLoading}
                    onClick={() => onSendMessage(promptText)}
                    className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-zinc-50 hover:bg-emerald-50 border border-zinc-200 hover:border-emerald-300 text-zinc-700 hover:text-emerald-900 transition-all text-left cursor-pointer disabled:opacity-50"
                  >
                    ✨ {promptText}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Conversation Thread */}
            <div className="h-64 overflow-y-auto space-y-3 p-3 bg-zinc-50 rounded-xl border border-zinc-200/80 mb-3 text-xs">
              {chatHistory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-zinc-400 p-4">
                  <Sparkles className="w-8 h-8 text-emerald-400 mb-2" />
                  <p className="font-semibold text-zinc-700">Need last-minute adjustments?</p>
                  <p className="text-[11px] text-zinc-500 max-w-xs mt-0.5">
                    "Cut $20 from snacks", "Swap cheese to vegan alternatives", or "Recalculate drinks for 20 guests".
                  </p>
                </div>
              ) : (
                chatHistory.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] p-3 rounded-2xl leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-emerald-700 text-white rounded-br-xs'
                          : 'bg-white border border-zinc-200 text-zinc-800 rounded-bl-xs shadow-2xs'
                      }`}
                    >
                      <p>{msg.content}</p>
                      {msg.appliedActions && msg.appliedActions.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-emerald-100 text-[10px] space-y-1">
                          <span className="font-bold text-emerald-800 block">Actions Applied:</span>
                          {msg.appliedActions.map((act, i) => (
                            <div key={i} className="flex items-center space-x-1 text-emerald-700">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>{act}</span>
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
                <span>Pickup / Delivery Store</span>
              </label>
              <select
                value={selectedStore}
                onChange={(e) => setSelectedStore(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50 text-xs font-medium text-zinc-900"
              >
                {CYMBALMART_STORES.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
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
                  badge: '$4.99 or Free with Club',
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
                <span className="font-semibold text-zinc-900">{formatCurrency(metrics.totalEstimatedCost)}</span>
              </div>

              {metrics.cymbalBrandSavings > 0 && (
                <div className="flex justify-between text-emerald-800 font-medium">
                  <span>Cymbal Choice Brand Savings</span>
                  <span>-{formatCurrency(metrics.cymbalBrandSavings)}</span>
                </div>
              )}

              {metrics.alreadyOwnedSavings > 0 && (
                <div className="flex justify-between text-amber-800 font-medium">
                  <span>Home Pantry Savings</span>
                  <span>-${formatCurrency(metrics.alreadyOwnedSavings)}</span>
                </div>
              )}

              <div className="flex justify-between text-zinc-600">
                <span>Estimated Local Tax (7.25%)</span>
                <span>{formatCurrency(metrics.totalEstimatedCost * 0.0725)}</span>
              </div>

              <div className="pt-2 border-t border-zinc-200 flex justify-between items-baseline">
                <div>
                  <span className="font-extrabold text-zinc-900 text-sm block">Final Cart Total</span>
                  <span className="text-[10px] text-zinc-500">
                    Target Budget: {formatCurrency(plan.targetBudget)}
                  </span>
                </div>
                <span className="font-extrabold text-lg text-zinc-900">
                  {formatCurrency(metrics.totalEstimatedCost * 1.0725)}
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
