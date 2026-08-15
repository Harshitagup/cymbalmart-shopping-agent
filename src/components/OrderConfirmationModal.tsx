import React, { useState } from 'react';
import {
  CheckCircle2,
  X,
  Printer,
  Copy,
  Check,
  Calendar,
  ShoppingBag,
  Truck,
  Navigation,
  QrCode,
  Share2,
  Sparkles,
} from 'lucide-react';
import { PartyPlan, ShoppingItem } from '../types';
import { calculateBudgetMetrics, formatCurrency, generateTextShoppingList } from '../utils/calculator';

interface OrderConfirmationModalProps {
  plan: PartyPlan;
  items: ShoppingItem[];
  fulfillmentType: 'curbside_pickup' | 'express_delivery' | 'in_store_walk';
  storeLocation: string;
  onClose: () => void;
  onNewParty: () => void;
}

export const OrderConfirmationModal: React.FC<OrderConfirmationModalProps> = ({
  plan,
  items,
  fulfillmentType,
  storeLocation,
  onClose,
  onNewParty,
}) => {
  const [copied, setCopied] = useState(false);
  const metrics = calculateBudgetMetrics(items, plan.targetBudget, plan.guestCount);
  const orderNumber = `CYM-${Math.floor(100000 + Math.random() * 900000)}-EVT`;

  const handleCopyText = () => {
    const text = generateTextShoppingList(plan);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-zinc-200 relative animate-in fade-in zoom-in-95 duration-200 my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Success Icon & Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-800 flex items-center justify-center mx-auto mb-3 shadow-xs">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            CymbalMart Order Confirmed
          </span>
          <h2 className="text-2xl font-extrabold text-zinc-900 tracking-tight mt-1">
            Party Plan Finalized!
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            Order #{orderNumber} has been scheduled at {storeLocation}.
          </p>
        </div>

        {/* Digital Pickup Pass / Barcode Box */}
        <div className="bg-zinc-900 text-white p-4 rounded-2xl mb-5 space-y-3">
          <div className="flex items-center justify-between text-xs border-b border-zinc-800 pb-2">
            <span className="text-zinc-400">Fulfillment Mode:</span>
            <span className="font-bold text-amber-300">
              {fulfillmentType === 'curbside_pickup'
                ? 'Curbside Pickup (Bay 4)'
                : fulfillmentType === 'express_delivery'
                ? 'Express 2-Hr Delivery'
                : 'In-Store Smart Walkthrough'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase font-bold text-zinc-400">Estimated Ready Time</div>
              <div className="text-sm font-extrabold text-white">Tomorrow at 2:00 PM</div>
              <div className="text-[10px] text-zinc-400 mt-0.5">{items.filter((i) => !i.isAlreadyOwned).length} Items Curated</div>
            </div>

            {/* Visual Barcode / QR Simulation */}
            <div className="bg-white p-2 rounded-xl text-zinc-900 flex flex-col items-center">
              <QrCode className="w-10 h-10" />
              <span className="text-[8px] font-mono font-bold mt-0.5">SCAN AT BAY</span>
            </div>
          </div>
        </div>

        {/* Order Receipt Summary */}
        <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200 text-xs space-y-2 mb-6">
          <div className="flex justify-between text-zinc-600">
            <span>Event:</span>
            <span className="font-bold text-zinc-900">{plan.title} ({plan.guestCount} Guests)</span>
          </div>
          <div className="flex justify-between text-zinc-600">
            <span>Target Budget:</span>
            <span className="font-semibold text-zinc-900">{formatCurrency(plan.targetBudget)}</span>
          </div>
          <div className="flex justify-between text-zinc-600">
            <span>Items Subtotal:</span>
            <span className="font-semibold text-zinc-900">{formatCurrency(metrics.totalEstimatedCost)}</span>
          </div>
          {metrics.cymbalBrandSavings > 0 && (
            <div className="flex justify-between text-emerald-800 font-bold">
              <span>Cymbal Club Savings:</span>
              <span>-{formatCurrency(metrics.cymbalBrandSavings)}</span>
            </div>
          )}
          <div className="pt-2 border-t border-zinc-200 flex justify-between items-baseline">
            <span className="font-bold text-zinc-900 text-sm">Total Paid:</span>
            <span className="font-extrabold text-base text-zinc-900">
              {formatCurrency(metrics.totalEstimatedCost * 1.0725)}
            </span>
          </div>
        </div>

        {/* Share & Export Actions */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            onClick={handleCopyText}
            className="p-2.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-800 text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-zinc-500" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy SMS List'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="p-2.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-800 text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-zinc-500" />
            <span>Print Store Sheet</span>
          </button>
        </div>

        {/* Finish / Plan Another Party Button */}
        <button
          onClick={onNewParty}
          className="w-full py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs transition-colors cursor-pointer"
        >
          Plan Another Event
        </button>
      </div>
    </div>
  );
};
