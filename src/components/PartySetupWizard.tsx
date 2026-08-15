import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Users,
  Clock,
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
  Globe,
  HelpCircle,
  Leaf,
  Drumstick,
} from 'lucide-react';
import { PartyFormInput, MealType, VenueType } from '../types';
import { DIETARY_OPTIONS, PartyPreset, getPresetsForCountry } from '../data/presets';
import { SUPPORTED_COUNTRIES, CountryConfig, getCountryConfig, detectUserCountry } from '../data/countries';
import { formatCurrency } from '../utils/calculator';
import { CountrySelectorModal } from './CountrySelectorModal';

interface PartySetupWizardProps {
  onGeneratePlan: (form: PartyFormInput) => Promise<void>;
  isLoading: boolean;
  onClose?: () => void;
  initialValues?: PartyFormInput | null;
  currentCountryCode?: string;
  onCountryChange?: (country: CountryConfig) => void;
}

const getDefaultFormForCountry = (country: CountryConfig): PartyFormInput => {
  const presets = getPresetsForCountry(country.code);
  if (presets.length > 0) {
    return { ...presets[0].config };
  }

  return {
    title: `${country.name} Celebration`,
    theme: 'Warm Festive Gathering',
    eventType: country.popularOccasions[0] || 'Celebration',
    countryCode: country.code,
    currencyCode: country.currencyCode,
    guestBreakdown: { adults: 14, teens: 4, kids: 6 },
    guestDietaryBreakdown: { pureVeg: 12, nonVeg: 12, vegan: 0, jain: 0 },
    durationHours: 4,
    mealType: 'full_meal',
    venue: 'indoor_home',
    dietaryRestrictions: ['Vegetarian Option'],
    customDietaryNotes: '',
    targetBudget: country.defaultBudget,
    preferredStores: [country.defaultStores[0]?.name || 'CymbalMart Supercenter'],
    customNotes: '',
    fulfillmentPreference: 'express_delivery',
    metricUnits: country.metricUnits,
    regionalPreference: country.code === 'IN' ? 'all_indian' : undefined,
  };
};

export const PartySetupWizard: React.FC<PartySetupWizardProps> = ({
  onGeneratePlan,
  isLoading,
  onClose,
  initialValues,
  currentCountryCode,
  onCountryChange,
}) => {
  const defaultCountry = currentCountryCode
    ? getCountryConfig(currentCountryCode)
    : detectUserCountry();

  const [activeCountry, setActiveCountry] = useState<CountryConfig>(
    initialValues?.countryCode
      ? getCountryConfig(initialValues.countryCode)
      : defaultCountry
  );

  const [formData, setFormData] = useState<PartyFormInput>(() => {
    if (initialValues) return initialValues;
    return getDefaultFormForCountry(defaultCountry);
  });

  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(() => {
    const presets = getPresetsForCountry(activeCountry.code);
    return presets[0]?.id || null;
  });

  const [isCountryModalOpen, setIsCountryModalOpen] = useState(false);

  // Country presets
  const availablePresets = getPresetsForCountry(activeCountry.code);

  const handleSelectCountry = (country: CountryConfig) => {
    setActiveCountry(country);
    if (onCountryChange) {
      onCountryChange(country);
    }
    const newForm = getDefaultFormForCountry(country);
    setFormData(newForm);
    const presets = getPresetsForCountry(country.code);
    setSelectedPresetId(presets[0]?.id || null);
  };

  const handleApplyPreset = (preset: PartyPreset) => {
    setSelectedPresetId(preset.id);
    setFormData({ ...preset.config });
  };

  const totalGuests =
    (Number(formData.guestBreakdown.adults) || 0) +
    (Number(formData.guestBreakdown.teens) || 0) +
    (Number(formData.guestBreakdown.kids) || 0);

  // Live catering formula estimates
  const estimatedDrinks = Math.round(totalGuests * formData.durationHours * 1.25);
  const estimatedIceAmount = activeCountry.metricUnits
    ? `${Math.max(5, Math.round(totalGuests * (formData.venue === 'backyard_outdoor' ? 1.0 : 0.75)))} kg`
    : `${Math.max(10, Math.round(totalGuests * (formData.venue === 'backyard_outdoor' ? 2 : 1.5)))} lbs`;
  const costPerGuest = totalGuests > 0 ? formData.targetBudget / totalGuests : 0;

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
    await onGeneratePlan({
      ...formData,
      countryCode: activeCountry.code,
      currencyCode: activeCountry.currencyCode,
      metricUnits: activeCountry.metricUnits,
    });
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
      case 'Utensils':
        return <Utensils className="w-4 h-4 text-orange-500" />;
      default:
        return <Sparkles className="w-4 h-4 text-amber-500" />;
    }
  };

  const dietaryBreakdown = formData.guestDietaryBreakdown || {
    pureVeg: Math.round(totalGuests * 0.6),
    nonVeg: Math.round(totalGuests * 0.4),
    vegan: 0,
    jain: 0,
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
          Convert your party intent, guest count, dietary preferences, and budget into a curated, aisle-organized CymbalMart grocery & supply list.
        </p>

        {/* Prominent Country / Region Selector Banner */}
        <div className="mt-4 inline-flex items-center space-x-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-2xl bg-white border border-zinc-200/90 shadow-2xs">
          <span className="text-xs font-semibold text-zinc-500 flex items-center space-x-1 pl-1">
            <Globe className="w-3.5 h-3.5 text-emerald-600" />
            <span>Country / Market:</span>
          </span>
          <button
            type="button"
            id="wizard-country-selector-btn"
            onClick={() => setIsCountryModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 text-emerald-950 font-bold text-xs transition-colors cursor-pointer"
          >
            <span className="text-base">{activeCountry.flag}</span>
            <span>{activeCountry.name}</span>
            <span className="text-emerald-700 font-semibold">({activeCountry.currencyCode} {activeCountry.currencySymbol})</span>
            <span className="text-[10px] text-zinc-500 bg-white px-1.5 py-0.5 rounded-md border border-emerald-200/60 ml-1">
              Change
            </span>
          </button>
        </div>
      </div>

      {/* 1-Click Curated CymbalMart Event Bundles for Country */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2.5">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Curated {activeCountry.name} Event Presets (1-Click Load)</span>
          </label>
          <span className="text-[11px] text-zinc-500">
            {availablePresets.length} curated templates
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {availablePresets.map((preset) => {
            const isSelected = selectedPresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                id={`preset-btn-${preset.id}`}
                onClick={() => handleApplyPreset(preset)}
                className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all relative cursor-pointer ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-50/70 shadow-2xs ring-2 ring-emerald-500/20'
                    : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <div className="p-1 rounded-lg bg-zinc-100">{getPresetIcon(preset.icon)}</div>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700">
                    {preset.badge}
                  </span>
                </div>
                <div className="font-bold text-xs text-zinc-900 line-clamp-1">{preset.name}</div>
                <div className="text-[11px] text-zinc-600 line-clamp-2 mt-0.5 leading-tight">{preset.tagline}</div>
                <div className="mt-2 text-[10px] font-semibold text-emerald-800">
                  Target: {activeCountry.currencySymbol}{preset.config.targetBudget.toLocaleString()} · ~{preset.config.guestBreakdown.adults + preset.config.guestBreakdown.teens + preset.config.guestBreakdown.kids} guests
                </div>
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
              placeholder={`e.g. ${activeCountry.popularOccasions[0] || 'Birthday Party'}`}
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
              placeholder={activeCountry.code === 'IN' ? 'e.g. Royal Diwali Milan, Bollywood Beats, Street Food Carnival' : 'e.g. Classic Cookout, Cantina Taco Bar, Retro 80s'}
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 text-xs sm:text-sm font-semibold text-zinc-900 transition-colors"
            />
          </div>
        </div>

        {/* Regional Cuisine Selection (If India or regional options exist) */}
        {activeCountry.regionalFoodOptions && activeCountry.regionalFoodOptions.length > 0 && (
          <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200">
            <label className="block text-xs font-bold text-amber-950 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <Utensils className="w-3.5 h-3.5 text-amber-600" />
                <span>Regional Culinary Palette / Menu Style</span>
              </span>
              <span className="text-[11px] font-normal text-amber-800">
                AI customizes authentic dishes & spice blends
              </span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {activeCountry.regionalFoodOptions.map((opt) => {
                const isSelected = formData.regionalPreference === opt.id || (!formData.regionalPreference && opt.id === 'all_indian');
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, regionalPreference: opt.id })}
                    className={`p-2.5 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'border-amber-500 bg-white font-bold text-amber-950 shadow-2xs ring-2 ring-amber-400/30'
                        : 'border-amber-200/80 bg-amber-50/50 hover:bg-white text-zinc-700'
                    }`}
                  >
                    <div className="font-semibold text-xs">{opt.label}</div>
                    <div className="text-[10px] text-zinc-500 mt-0.5 line-clamp-1">{opt.description}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

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
                <span className="text-[10px] text-zinc-500">Full portions & beverage servings</span>
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
                <span className="text-[10px] text-zinc-500">Hearty snacks, chai & mocktails</span>
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
                <span className="text-[10px] text-zinc-500">Juice tetra packs & mini snacks</span>
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

          {/* Vegetarian / Non-Veg Split Slider or Inputs */}
          <div className="mt-4 pt-3 border-t border-zinc-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-zinc-700 uppercase tracking-wider flex items-center space-x-1.5">
                <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                <span>Vegetarian / Non-Vegetarian Split</span>
              </span>
              <span className="text-[11px] font-semibold text-emerald-800">
                {dietaryBreakdown.pureVeg || 0} Pure Veg · {dietaryBreakdown.nonVeg || 0} Non-Veg
                {dietaryBreakdown.jain ? ` · ${dietaryBreakdown.jain} Jain` : ''}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-emerald-950 block">Pure Veg</span>
                  <span className="text-[10px] text-emerald-700">Paneer & Veg mains</span>
                </div>
                <input
                  type="number"
                  min="0"
                  max={totalGuests}
                  value={dietaryBreakdown.pureVeg || 0}
                  onChange={(e) => {
                    const val = Number(e.target.value) || 0;
                    setFormData({
                      ...formData,
                      guestDietaryBreakdown: {
                        ...dietaryBreakdown,
                        pureVeg: val,
                        nonVeg: Math.max(0, totalGuests - val),
                      },
                    });
                  }}
                  className="w-12 px-2 py-1 rounded-md bg-white border border-emerald-300 text-center font-bold text-xs text-zinc-900"
                />
              </div>

              <div className="bg-amber-50/70 p-2.5 rounded-lg border border-amber-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-amber-950 block">Non-Veg</span>
                  <span className="text-[10px] text-amber-700">Chicken/Mutton/Fish</span>
                </div>
                <input
                  type="number"
                  min="0"
                  max={totalGuests}
                  value={dietaryBreakdown.nonVeg || 0}
                  onChange={(e) => {
                    const val = Number(e.target.value) || 0;
                    setFormData({
                      ...formData,
                      guestDietaryBreakdown: {
                        ...dietaryBreakdown,
                        nonVeg: val,
                        pureVeg: Math.max(0, totalGuests - val),
                      },
                    });
                  }}
                  className="w-12 px-2 py-1 rounded-md bg-white border border-amber-300 text-center font-bold text-xs text-zinc-900"
                />
              </div>

              <div className="bg-purple-50/70 p-2.5 rounded-lg border border-purple-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-purple-950 block">Jain Veg</span>
                  <span className="text-[10px] text-purple-700">No root veg/onion</span>
                </div>
                <input
                  type="number"
                  min="0"
                  max={totalGuests}
                  value={dietaryBreakdown.jain || 0}
                  onChange={(e) => {
                    const val = Number(e.target.value) || 0;
                    setFormData({
                      ...formData,
                      guestDietaryBreakdown: {
                        ...dietaryBreakdown,
                        jain: val,
                      },
                    });
                  }}
                  className="w-12 px-2 py-1 rounded-md bg-white border border-purple-300 text-center font-bold text-xs text-zinc-900"
                />
              </div>

              <div className="bg-sky-50/70 p-2.5 rounded-lg border border-sky-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-sky-950 block">Vegan</span>
                  <span className="text-[10px] text-sky-700">Dairy & egg-free</span>
                </div>
                <input
                  type="number"
                  min="0"
                  max={totalGuests}
                  value={dietaryBreakdown.vegan || 0}
                  onChange={(e) => {
                    const val = Number(e.target.value) || 0;
                    setFormData({
                      ...formData,
                      guestDietaryBreakdown: {
                        ...dietaryBreakdown,
                        vegan: val,
                      },
                    });
                  }}
                  className="w-12 px-2 py-1 rounded-md bg-white border border-sky-300 text-center font-bold text-xs text-zinc-900"
                />
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
              <option value="full_meal">Full Meal / Hot Buffet (Main + 2 Sides + Dessert)</option>
              <option value="heavy_appetizers">Heavy Appetizers, Chaat & Grazing Platters</option>
              <option value="snacks_desserts">Light Snacks, Chai & Mithai/Desserts</option>
              <option value="brunch">Brunch Spread (Tiffin, Pastries & Fruit)</option>
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
              <option value="backyard_outdoor">Backyard / Patio / Terrace (+Extra Ice & Torches)</option>
              <option value="rented_venue">Rented Event Hall / Club House / Banquet</option>
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
                <Coins className="w-3.5 h-3.5 text-emerald-600" />
                <span>Target Budget ({activeCountry.currencyCode} {activeCountry.currencySymbol})</span>
              </span>
              <span className="text-xs text-zinc-500 font-semibold">
                ~{formatCurrency(costPerGuest, activeCountry.currencyCode)} / guest
              </span>
            </label>
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400 font-bold">
                  {activeCountry.currencySymbol}
                </span>
                <input
                  type="number"
                  id="input-target-budget"
                  min={activeCountry.budgetStep}
                  max={activeCountry.defaultBudget * 10}
                  step={activeCountry.budgetStep}
                  value={formData.targetBudget}
                  onChange={(e) => setFormData({ ...formData, targetBudget: Number(e.target.value) || 0 })}
                  className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:border-emerald-600 text-sm font-bold text-zinc-900"
                />
              </div>
              <div className="flex space-x-1 overflow-x-auto">
                {activeCountry.budgetPresets.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setFormData({ ...formData, targetBudget: b })}
                    className={`px-2 py-2 rounded-lg text-xs font-medium border whitespace-nowrap cursor-pointer ${
                      formData.targetBudget === b
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold'
                        : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100'
                    }`}
                  >
                    {activeCountry.currencySymbol}{b.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* CymbalMart Store Location */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5 flex items-center space-x-1">
              <Store className="w-3.5 h-3.5 text-emerald-600" />
              <span>Select {activeCountry.name} CymbalMart Hub</span>
            </label>
            <select
              value={formData.preferredStores[0] || activeCountry.defaultStores[0]?.name}
              onChange={(e) => setFormData({ ...formData, preferredStores: [e.target.value] })}
              className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white text-xs font-medium text-zinc-900"
            >
              {activeCountry.defaultStores.map((s) => (
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
                id: 'express_delivery',
                title: 'CymbalMart 2-Hr Delivery',
                desc: 'Delivered directly to venue/home',
                icon: Truck,
              },
              {
                id: 'curbside_pickup',
                title: 'Free Curbside Pickup',
                desc: 'Ready in 2 hours, trunk loading',
                icon: ShoppingBag,
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
            placeholder="Specific dietary notes (e.g. 4 pure vegetarians, separate sweets counter, peanut allergy warning)..."
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
            placeholder="e.g. Need authentic masala chai ingredients, areca nut eco-plates, extra party ice, and festive diya lights..."
            className="w-full px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white text-xs text-zinc-800"
          />
        </div>

        {/* Live Catering Estimation Preview Box */}
        <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <Info className="w-4 h-4 text-emerald-700 shrink-0" />
            <span className="font-semibold text-emerald-900">
              Catering Golden Rule Estimates ({activeCountry.name} Market):
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-emerald-800 text-[11px] font-medium">
            <span>🥤 <strong>~{estimatedDrinks}</strong> Total Drinks</span>
            <span>🧊 <strong>~{estimatedIceAmount}</strong> Party Ice</span>
            <span>🍽️ <strong>1.3x</strong> Tableware Buffer</span>
            <span>💵 <strong>{formatCurrency(costPerGuest, activeCountry.currencyCode)}</strong>/Guest</span>
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
                <span>Generating Curated {activeCountry.name} Shopping List & Portions...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-amber-300" />
                <span>Generate Curated {activeCountry.name} Shopping List</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Country Selector Modal */}
      <CountrySelectorModal
        isOpen={isCountryModalOpen}
        onClose={() => setIsCountryModalOpen(false)}
        selectedCountryCode={activeCountry.code}
        onSelectCountry={handleSelectCountry}
      />
    </div>
  );
};
