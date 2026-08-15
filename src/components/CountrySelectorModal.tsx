import React, { useState } from 'react';
import {
  Globe,
  Search,
  Check,
  X,
  Sparkles,
  MapPin,
  Coins,
} from 'lucide-react';
import { SUPPORTED_COUNTRIES, CountryConfig } from '../data/countries';

interface CountrySelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCountryCode: string;
  onSelectCountry: (country: CountryConfig) => void;
}

export const CountrySelectorModal: React.FC<CountrySelectorModalProps> = ({
  isOpen,
  onClose,
  selectedCountryCode,
  onSelectCountry,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredCountries = SUPPORTED_COUNTRIES.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.nativeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.currencyCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      id="country-selector-modal-overlay"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div
        id="country-selector-modal-container"
        className="relative bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-zinc-200 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Select Country & Market</h2>
              <p className="text-emerald-200 text-xs mt-0.5">
                Adapts CymbalMart aisles, currency, unit sizing & local culinary options
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-zinc-200 bg-zinc-50">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="country-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search country, currency, or market (e.g., India, INR, US, UK, Japan)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 bg-white focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 text-xs sm:text-sm text-zinc-900"
            />
          </div>
        </div>

        {/* Country Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredCountries.map((country) => {
              const isSelected = country.code.toUpperCase() === selectedCountryCode.toUpperCase();
              return (
                <button
                  key={country.code}
                  type="button"
                  id={`country-opt-${country.code.toLowerCase()}`}
                  onClick={() => {
                    onSelectCountry(country);
                    onClose();
                  }}
                  className={`flex items-start justify-between p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20 shadow-2xs'
                      : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-2xl shrink-0 select-none mt-0.5">{country.flag}</span>
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs sm:text-sm font-bold text-zinc-900">
                          {country.name}
                        </span>
                        {country.nativeName !== country.name && (
                          <span className="text-[11px] text-zinc-400">
                            ({country.nativeName})
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700">
                          {country.currencyCode} ({country.currencySymbol})
                        </span>
                        <span className="text-[10px] text-zinc-500">
                          {country.metricUnits ? 'Metric (kg/L)' : 'Imperial (lbs/oz)'}
                        </span>
                      </div>

                      <div className="text-[10px] text-zinc-500 mt-1 line-clamp-1">
                        {country.defaultStores[0]?.name.replace('CymbalMart ', '')}
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-zinc-50 border-t border-zinc-200 p-4 flex items-center justify-between text-xs text-zinc-500">
          <span>{filteredCountries.length} countries available</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-zinc-200 hover:bg-zinc-300 text-zinc-800 font-semibold cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
