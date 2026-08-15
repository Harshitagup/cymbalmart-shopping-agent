import React, { useState } from 'react';
import {
  Sparkles,
  Users,
  Clock,
  DollarSign,
  Utensils,
  Store,
  MapPin,
  Check,
  Flame,
  Gamepad2,
  Wine,
  Coins,
  ChevronRight,
  Loader2,
  Info,
  Truck,
  ShoppingBag,
  Navigation,
  Tv,
} from 'lucide-react';
import { PartyFormInput, MealType, VenueType } from '../types';
import { PARTY_PRESETS, DIETARY_OPTIONS, CYMBALMART_STORES, PartyPreset } from '../data/presets';
import { formatCurrency } from '../utils/calculator';

interface PartySetupWizardProps {
  onGeneratePlan: (form: PartyFormInput) => Promise<void>;
  isLoading: boolean;
  onClose?: () => void;
  initialValues?: PartyFormInput | null;
}

const DEFAULT_FORM: PartyFormInput = {
  title: 'Summer Backyard Cookout',
  theme: 'Classic Americana BBQ',
  eventType: 'Cookout / BBQ',
  guestBreakdown: { adults: 14, teens: 4, kids: 6 },
  durationHours: 4,
  mealType: 'full_meal',
  venue: 'backyard_outdoor',
  dietaryRestrictions: ['Vegetarian Option', 'Gluten-Free Option'],
  customDietaryNotes: '4 vegetarian guests (need veggie patties & grilled corn)',
  targetBudget: 280,
  preferredStores: ['CymbalMart Supercenter #1042 - Sunnyvale (El Camino Real)'],
  customNotes: 'Outdoor backyard event: need party ice bags, cooler essentials, disposable cutlery, and bug spray.',
  fulfillmentPreference: 'curbside_pickup',
};

export const PartySetupWizard: React.FC<PartySetupWizardProps> = ({
  onGeneratePlan,
  isLoading,
  onClose,
  initialValues,
}) => {
  const [formData, setFormData] = useState<PartyFormInput>(initialValues || DEFAULT_FORM);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>('cymbal-backyard-bbq');

  const totalGuests =
    (Number(formData.guestBreakdown.adults) || 0) +
    (Number(formData.guestBreakdown.teens) || 0) +
    (Number(formData.guestBreakdown.kids) || 0);

  // Live catering formula estimates
  const estimatedDrinks = Math.round(totalGuests * formData.durationHours * 1.25);
  const estimatedIceLbs = Math.max(10, Math.round(totalGuests * (formData.venue === 'backyard_outdoor' ? 2 : 1.5)));
  const costPerGuest = totalGuests > 0 ? formData.targetBudget / totalGuests : 0;

  const handleApplyPreset = (preset: PartyPreset) => {
    setSelectedPresetId(preset.id);
    setFormData({ ...preset.config });
  };

  const handleDietaryToggle = (item: string) => {
    const exists = formData.dietaryRestrictions.includes(item);
    if (exists) {
      setFormData({
        ...formData,
        dietaryRestrictions: formData.dietaryRestrictions.filter((d) => d !== item),
      });
    } else {
      setFormData({
        ...formData,
        dietaryRestrictions: [...formData.dietaryRestrictions, item],
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onGeneratePlan(formData);
  };

  const getPresetIcon = (iconName: string) => {
    switch (iconName) {
      case 'Flame':
        return <Flame className="w-4 h-4 text-amber-500" />;
      case 'Gamepad2':
        return <Gamepad2 className="w-4 h-4 text-indigo-500" />;
      case 'Wine':
        return <Wine className="w-4 h-4 text-rose-500" />;
      case 'Coins':
        return <Coins className="w-4 h-4 text-emerald-500" />;
      case 'Tv':
        return <Tv className="w-4 h-4 text-blue-500" />;
      default:
        return <Sparkles className="w-4 h-4 text-amber-500" />;
    }
  };

  return (
    <div id="party-setup-wizard" className="max-w-4xl mx-auto py-4 px-3 sm:px-6">
      {/* Step Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Task 1 of 3: Define Event Specifications</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
          CymbalMart AI Event Shopping Planner
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-zinc-600 max-w-xl mx-auto">
          Convert your party intent, guest count, and budget into a curated, aisle-organized CymbalMart grocery & supply list.
        </p>
      </div>

      {/* 1-Click Curated CymbalMart Event Bundles */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2.5">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Curated CymbalMart Event Presets (1-Click Load)</span>
          </label>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {PARTY_PRESETS.map((preset) => {
            const isSelected = selectedPresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                id={`preset-btn-${preset.id}`}
                onClick={() => handleApplyPreset(preset)}
                className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all relative cursor-pointer ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-50/70 shadow-2xs ring-2 ring-emerald-500/20'
                    : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <div className="p-1 rounded-lg bg-zinc-100">{getPresetIcon(preset.icon)}</div>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-zinc-100 text-zinc-600">
                    {preset.badge}
                  </span>
                </div>
                <div className="font-bold text-xs text-zinc-900 line-clamp-1">{preset.name}</div>
                <div className="text-[10px] text-zinc-500 line-clamp-2 mt-0.5 leading-tight">{preset.tagline}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Configuration Form */}
      <form onSubmit={handleSubmit} className="space-y-5 bg-white p-5 sm:p-7 rounded-2xl border border-zinc-200 shadow-xs">
        {/* Section 1: Title & Theme */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
              Party Title / Occasion
            </label>
            <input
              type="text"
              id="input-party-title"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Maya's 30th Birthday Fiesta"
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 text-xs sm:text-sm font-semibold text-zinc-900 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
              Theme or Aesthetic
            </label>
            <input
              type="text"
              id="input-party-theme"
              required
              value={formData.theme}
              onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
              placeholder="e.g. Classic Americana BBQ, Coastal Cantina, Retro 80s"
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 text-xs sm:text-sm font-semibold text-zinc-900 transition-colors"
            />
          </div>
        </div>

        {/* Section 2: Guest Count & Demographic Breakdown */}
        <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-zinc-800 uppercase tracking-wider">
                Guest Count Breakdown
              </span>
            </div>
            <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-zinc-900 text-white text-xs font-bold">
              <span>Total: {totalGuests} Guests</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Adults */}
            <div className="bg-white p-3 rounded-lg border border-zinc-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-zinc-800 block">Adults (21+)</span>
                <span className="text-[10px] text-zinc-500">Full meals & cocktail portions</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  id="btn-dec-adults"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      guestBreakdown: {
                        ...formData.guestBreakdown,
                        adults: Math.max(1, formData.guestBreakdown.adults - 1),
                      },
                    })
                  }
                  className="w-7 h-7 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 flex items-center justify-center font-bold text-zinc-700 cursor-pointer"
                >
                  -
                </button>
                <span className="font-bold text-sm text-zinc-900 w-6 text-center">
                  {formData.guestBreakdown.adults}
                </span>
                <button
                  type="button"
                  id="btn-inc-adults"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      guestBreakdown: {
                        ...formData.guestBreakdown,
                        adults: formData.guestBreakdown.adults + 1,
                      },
                    })
                  }
                  className="w-7 h-7 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 flex items-center justify-center font-bold text-zinc-700 cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            {/* Teens */}
            <div className="bg-white p-3 rounded-lg border border-zinc-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-zinc-800 block">Teens (13-20)</span>
                <span className="text-[10px] text-zinc-500">Hearty snacks & seltzers</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  id="btn-dec-teens"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      guestBreakdown: {
                        ...formData.guestBreakdown,
                        teens: Math.max(0, formData.guestBreakdown.teens - 1),
                      },
                    })
                  }
                  className="w-7 h-7 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 flex items-center justify-center font-bold text-zinc-700 cursor-pointer"
                >
                  -
                </button>
                <span className="font-bold text-sm text-zinc-900 w-6 text-center">
                  {formData.guestBreakdown.teens}
                </span>
                <button
                  type="button"
                  id="btn-inc-teens"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      guestBreakdown: {
                        ...formData.guestBreakdown,
                        teens: formData.guestBreakdown.teens + 1,
                      },
                    })
                  }
                  className="w-7 h-7 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 flex items-center justify-center font-bold text-zinc-700 cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            {/* Kids */}
            <div className="bg-white p-3 rounded-lg border border-zinc-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-zinc-800 block">Kids (12 & under)</span>
                <span className="text-[10px] text-zinc-500">Juice boxes & mini portions</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  id="btn-dec-kids"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      guestBreakdown: {
                        ...formData.guestBreakdown,
                        kids: Math.max(0, formData.guestBreakdown.kids - 1),
                      },
                    })
                  }
                  className="w-7 h-7 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 flex items-center justify-center font-bold text-zinc-700 cursor-pointer"
                >
                  -
                </button>
                <span className="font-bold text-sm text-zinc-900 w-6 text-center">
                  {formData.guestBreakdown.kids}
                </span>
                <button
                  type="button"
                  id="btn-inc-kids"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      guestBreakdown: {
                        ...formData.guestBreakdown,
                        kids: formData.guestBreakdown.kids + 1,
                      },
                    })
                  }
                  className="w-7 h-7 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 flex items-center justify-center font-bold text-zinc-700 cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Duration, Meal Style, Venue */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Duration */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5 flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-zinc-500" />
              <span>Event Duration</span>
            </label>
            <div className="flex items-center space-x-2 bg-zinc-50 p-2 rounded-xl border border-zinc-200">
              <input
                type="range"
                min="1"
                max="8"
                step="0.5"
                value={formData.durationHours}
                onChange={(e) => setFormData({ ...formData, durationHours: parseFloat(e.target.value) })}
                className="w-full accent-emerald-600"
              />
              <span className="text-xs font-bold text-zinc-900 whitespace-nowrap px-2 py-1 rounded-md bg-white border border-zinc-200">
                {formData.durationHours} hrs
              </span>
            </div>
            <p className="text-[10px] text-zinc-500 mt-1">Catering rule: ~1.25 drinks/hr per guest</p>
          </div>

          {/* Meal Style */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5 flex items-center space-x-1">
              <Utensils className="w-3.5 h-3.5 text-zinc-500" />
              <span>Meal / Food Style</span>
            </label>
            <select
              id="select-meal-type"
              value={formData.mealType}
              onChange={(e) => setFormData({ ...formData, mealType: e.target.value as MealType })}
              className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white text-xs font-semibold text-zinc-900"
            >
              <option value="full_meal">Full Meal / Hot Buffet (Main + 2 Sides)</option>
              <option value="heavy_appetizers">Heavy Appetizers & Grazing Platters</option>
              <option value="snacks_desserts">Light Snacks, Finger Foods & Desserts</option>
              <option value="brunch">Brunch Spread (Bagels, Pastries & Fruit)</option>
              <option value="drinks_only">Beverages & Light Bites Only</option>
            </select>
          </div>

          {/* Venue Setting */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5 flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5 text-zinc-500" />
              <span>Venue Setting</span>
            </label>
            <select
              id="select-venue"
              value={formData.venue}
              onChange={(e) => setFormData({ ...formData, venue: e.target.value as VenueType })}
              className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white text-xs font-semibold text-zinc-900"
            >
              <option value="indoor_home">Indoor Home / Apartment</option>
              <option value="backyard_outdoor">Backyard / Patio (+Extra Ice & Torches)</option>
              <option value="rented_venue">Rented Event Hall / Club House</option>
              <option value="park_picnic">Public Park / Picnic Shelter</option>
            </select>
          </div>
        </div>

        {/* Section 4: Target Budget & CymbalMart Store */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Target Budget */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span className="flex items-center space-x-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                <span>Target Budget ($ USD)</span>
              </span>
              <span className="text-xs text-zinc-500 font-semibold">
                ~{formatCurrency(costPerGuest)} / guest
              </span>
            </label>
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400 font-bold">$</span>
                <input
                  type="number"
                  id="input-target-budget"
                  min="30"
                  max="5000"
                  step="10"
                  value={formData.targetBudget}
                  onChange={(e) => setFormData({ ...formData, targetBudget: Number(e.target.value) || 0 })}
                  className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:border-emerald-600 text-sm font-bold text-zinc-900"
                />
              </div>
              <div className="flex space-x-1">
                {[175, 250, 350, 500].map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setFormData({ ...formData, targetBudget: b })}
                    className={`px-2.5 py-2 rounded-lg text-xs font-medium border cursor-pointer ${
                      formData.targetBudget === b
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold'
                        : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100'
                    }`}
                  >
                    ${b}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* CymbalMart Store Location */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5 flex items-center space-x-1">
              <Store className="w-3.5 h-3.5 text-emerald-600" />
              <span>Select CymbalMart Location</span>
            </label>
            <select
              value={formData.preferredStores[0] || CYMBALMART_STORES[0].name}
              onChange={(e) => setFormData({ ...formData, preferredStores: [e.target.value] })}
              className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white text-xs font-medium text-zinc-900"
            >
              {CYMBALMART_STORES.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name} ({s.distance})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Section 5: Fulfillment Preference */}
        <div>
          <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
            Preferred Fulfillment Method
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {[
              {
                id: 'curbside_pickup',
                title: 'Free Curbside Pickup',
                desc: 'Ready in 2 hours, trunk loading',
                icon: ShoppingBag,
              },
              {
                id: 'express_delivery',
                title: 'CymbalMart 2-Hr Delivery',
                desc: 'Delivered directly to venue/home',
                icon: Truck,
              },
              {
                id: 'in_store_walk',
                title: 'In-Store Walkthrough',
                desc: 'Organized sequentially by Aisle',
                icon: Navigation,
              },
            ].map((f) => {
              const isSelected = formData.fulfillmentPreference === f.id;
              const Icon = f.icon;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, fulfillmentPreference: f.id as any })}
                  className={`p-3 rounded-xl border text-left flex items-start space-x-2.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                      : 'border-zinc-200 bg-white hover:bg-zinc-50'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? 'bg-emerald-600 text-white' : 'bg-zinc-100 text-zinc-600'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-zinc-900">{f.title}</div>
                    <div className="text-[10px] text-zinc-500 mt-0.5">{f.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 6: Dietary Preferences & Allergies */}
        <div>
          <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
            Special Requests & Dietary Accommodations
          </label>
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {DIETARY_OPTIONS.map((item) => {
              const isSelected = formData.dietaryRestrictions.includes(item);
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => handleDietaryToggle(item)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-all flex items-center space-x-1 cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                      : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 text-emerald-700" />}
                  <span>{item}</span>
                </button>
              );
            })}
          </div>

          <input
            type="text"
            value={formData.customDietaryNotes || ''}
            onChange={(e) => setFormData({ ...formData, customDietaryNotes: e.target.value })}
            placeholder="Specific dietary notes (e.g. 1 guest has peanut allergy, need GF buns for 2 guests)..."
            className="w-full px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white text-xs text-zinc-800"
          />
        </div>

        {/* Section 7: Specific Host Notes */}
        <div>
          <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
            Special Host Requests & Venue Constraints
          </label>
          <textarea
            rows={2}
            value={formData.customNotes || ''}
            onChange={(e) => setFormData({ ...formData, customNotes: e.target.value })}
            placeholder="e.g. We need a signature punch mocktail recipe, extra lawn torches for outdoors, and eco-friendly sugarcane plates..."
            className="w-full px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white text-xs text-zinc-800"
          />
        </div>

        {/* Live Catering Estimation Preview Box */}
        <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <Info className="w-4 h-4 text-emerald-700 shrink-0" />
            <span className="font-semibold text-emerald-900">
              Catering Golden Rule Estimates:
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-emerald-800 text-[11px] font-medium">
            <span>🥤 <strong>~{estimatedDrinks}</strong> Total Drinks</span>
            <span>🧊 <strong>~{estimatedIceLbs} lbs</strong> Party Ice</span>
            <span>🍽️ <strong>1.3x</strong> Tableware Buffer</span>
            <span>💵 <strong>{formatCurrency(costPerGuest)}</strong>/Guest</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            type="submit"
            id="btn-generate-party-plan"
            disabled={isLoading}
            className="w-full py-3.5 px-6 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-sm flex items-center justify-center space-x-2 transition-all transform active:scale-[0.99] disabled:opacity-75 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Generating Curated CymbalMart Shopping List & Portions...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-amber-300" />
                <span>Generate Curated CymbalMart Shopping List</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
