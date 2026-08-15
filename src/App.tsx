import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { CUJStepper } from './components/CUJStepper';
import { PartySetupWizard } from './components/PartySetupWizard';
import { PartyOverviewCard } from './components/PartyOverviewCard';
import { ShoppingListDashboard } from './components/ShoppingListDashboard';
import { RefineAndCheckoutView } from './components/RefineAndCheckoutView';
import { OrderConfirmationModal } from './components/OrderConfirmationModal';
import { AddItemModal } from './components/AddItemModal';
import { ExportModal } from './components/ExportModal';
import { SavedPlansModal } from './components/SavedPlansModal';
import { CymbalMartAssistant } from './components/CymbalMartAssistant';
import { CountrySelectorModal } from './components/CountrySelectorModal';
import { CountryChangeConfirmModal } from './components/CountryChangeConfirmModal';
import { PartyPlan, PartyFormInput, ShoppingItem, PrepTask, ChatMessage, CUJStep } from './types';
import { calculateBudgetMetrics, convertPlanPricesToCountry } from './utils/calculator';
import { PARTY_PRESETS, getPresetsForCountry } from './data/presets';
import { SUPPORTED_COUNTRIES, CountryConfig, getCountryConfig, detectUserCountry } from './data/countries';
import confetti from 'canvas-confetti';

const STORAGE_KEY_CURRENT = 'cymbalmart_active_party_plan_v3';
const STORAGE_KEY_SAVED = 'cymbalmart_saved_party_plans_v3';
const STORAGE_KEY_COUNTRY = 'cymbalmart_country_preference_v3';

export default function App() {
  const [selectedCountry, setSelectedCountry] = useState<CountryConfig>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_COUNTRY);
      if (stored) {
        return getCountryConfig(stored);
      }
    } catch (e) {
      console.warn('Could not read stored country:', e);
    }
    return detectUserCountry();
  });

  const [currentPlan, setCurrentPlan] = useState<PartyPlan | null>(null);
  const [savedPlans, setSavedPlans] = useState<PartyPlan[]>([]);
  const [cujStep, setCujStep] = useState<CUJStep>('review');
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isCountryModalOpen, setIsCountryModalOpen] = useState(false);
  const [isCountryConfirmOpen, setIsCountryConfirmOpen] = useState(false);
  const [pendingTargetCountry, setPendingTargetCountry] = useState<CountryConfig | null>(null);

  const [orderFulfillment, setOrderFulfillment] = useState<{
    fulfillmentType: 'curbside_pickup' | 'express_delivery' | 'in_store_walk';
    storeLocation: string;
  }>({
    fulfillmentType: 'express_delivery',
    storeLocation: 'CymbalMart Hypermarket - Bengaluru',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  // Initialize from LocalStorage or generate initial localized CymbalMart plan
  useEffect(() => {
    try {
      const storedCurrent = localStorage.getItem(STORAGE_KEY_CURRENT);
      const storedSaved = localStorage.getItem(STORAGE_KEY_SAVED);

      if (storedSaved) {
        setSavedPlans(JSON.parse(storedSaved));
      }

      if (storedCurrent) {
        const plan: PartyPlan = JSON.parse(storedCurrent);
        setCurrentPlan(plan);
        if (plan.countryCode) {
          setSelectedCountry(getCountryConfig(plan.countryCode));
        }
        setCujStep('review');
      } else {
        generateInitialPlan(selectedCountry);
      }
    } catch (e) {
      console.error('Error loading stored plan:', e);
      generateInitialPlan(selectedCountry);
    }
  }, []);

  const updateCurrentPlan = (updatedPlan: PartyPlan) => {
    setCurrentPlan(updatedPlan);
    localStorage.setItem(STORAGE_KEY_CURRENT, JSON.stringify(updatedPlan));

    setSavedPlans((prev) => {
      const idx = prev.findIndex((p) => p.id === updatedPlan.id);
      let nextList = [...prev];
      if (idx >= 0) {
        nextList[idx] = updatedPlan;
      } else {
        nextList = [updatedPlan, ...prev];
      }
      localStorage.setItem(STORAGE_KEY_SAVED, JSON.stringify(nextList));
      return nextList;
    });
  };

  const generateInitialPlan = async (country: CountryConfig) => {
    setIsLoading(true);
    try {
      const countryPresets = getPresetsForCountry(country.code);
      const preset = countryPresets[0]?.config || PARTY_PRESETS[0].config;
      const res = await fetch('/api/party/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preset),
      });

      if (res.ok) {
        const plan = await res.json();
        updateCurrentPlan(plan);
        setCujStep('review');
      }
    } catch (err) {
      console.error('Failed to generate initial plan:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateNewPlan = async (formData: PartyFormInput) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/party/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        throw new Error('Failed to generate party plan');
      }

      const plan: PartyPlan = await res.json();
      updateCurrentPlan(plan);
      setSelectedCountry(getCountryConfig(plan.countryCode || formData.countryCode || 'IN'));
      localStorage.setItem(STORAGE_KEY_COUNTRY, plan.countryCode || 'IN');
      setCujStep('review');
      setChatHistory([]);

      confetti({
        particleCount: 70,
        spread: 65,
        origin: { y: 0.6 },
      });
    } catch (error) {
      console.error('Error generating party plan:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Country change initiation
  const handleSelectCountryFromModal = (country: CountryConfig) => {
    if (currentPlan && currentPlan.items.length > 0 && currentPlan.countryCode !== country.code) {
      setPendingTargetCountry(country);
      setIsCountryConfirmOpen(true);
    } else {
      setSelectedCountry(country);
      localStorage.setItem(STORAGE_KEY_COUNTRY, country.code);
      if (!currentPlan) {
        generateInitialPlan(country);
      }
    }
  };

  // Country change confirm: Convert current plan prices & units
  const handleConfirmCountryConversion = (targetCountry: CountryConfig) => {
    if (!currentPlan) return;
    const convertedPlan = convertPlanPricesToCountry(currentPlan, targetCountry.code);
    setSelectedCountry(targetCountry);
    localStorage.setItem(STORAGE_KEY_COUNTRY, targetCountry.code);
    updateCurrentPlan(convertedPlan);
    setIsCountryConfirmOpen(false);
    setPendingTargetCountry(null);
  };

  // Country change confirm: Generate fresh plan for target country
  const handleStartNewPlanForCountry = async (targetCountry: CountryConfig) => {
    setSelectedCountry(targetCountry);
    localStorage.setItem(STORAGE_KEY_COUNTRY, targetCountry.code);
    setIsCountryConfirmOpen(false);
    setPendingTargetCountry(null);
    await generateInitialPlan(targetCountry);
  };

  // Chat message sending to Gemini
  const handleSendMessage = async (text: string) => {
    if (!currentPlan) return;
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatHistory((prev) => [...prev, userMsg]);
    setIsChatLoading(true);

    try {
      const res = await fetch('/api/party/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          currentPlan,
          chatHistory,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to communicate with AI Assistant');
      }

      const data = await res.json();

      const assistantMsg: ChatMessage = {
        id: `msg-ai-${Date.now()}`,
        role: 'assistant',
        content: data.reply || 'Your party plan constraints have been aligned!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        appliedActions: data.appliedActions || [],
      };

      setChatHistory((prev) => [...prev, assistantMsg]);

      if (data.updatedItems && Array.isArray(data.updatedItems)) {
        updateCurrentPlan({
          ...currentPlan,
          items: data.updatedItems,
        });
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      const errMsg: ChatMessage = {
        id: `msg-err-${Date.now()}`,
        role: 'system',
        content: `Error: ${err.message || 'Could not connect to Gemini API'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChatHistory((prev) => [...prev, errMsg]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Update Shopping Items
  const handleUpdateItems = (newItems: ShoppingItem[]) => {
    if (!currentPlan) return;
    updateCurrentPlan({
      ...currentPlan,
      items: newItems,
    });
  };

  // Add Item
  const handleAddItem = (item: ShoppingItem) => {
    if (!currentPlan) return;
    updateCurrentPlan({
      ...currentPlan,
      items: [item, ...currentPlan.items],
    });
  };

  // Update Timeline
  const handleUpdateTimelineTask = (taskId: string, isCompleted: boolean) => {
    if (!currentPlan) return;
    const updated = currentPlan.prepTimeline.map((t) => (t.id === taskId ? { ...t, isCompleted } : t));
    updateCurrentPlan({
      ...currentPlan,
      prepTimeline: updated,
    });
  };

  // Finalize Order
  const handleFinalizeOrder = (
    fulfillmentType: 'curbside_pickup' | 'express_delivery' | 'in_store_walk',
    storeLocation: string
  ) => {
    setOrderFulfillment({ fulfillmentType, storeLocation });
    setIsOrderModalOpen(true);

    confetti({
      particleCount: 100,
      spread: 75,
      origin: { y: 0.5 },
    });
  };

  // Delete Plan
  const handleDeletePlan = (id: string) => {
    const nextSaved = savedPlans.filter((p) => p.id !== id);
    setSavedPlans(nextSaved);
    localStorage.setItem(STORAGE_KEY_SAVED, JSON.stringify(nextSaved));

    if (currentPlan?.id === id) {
      if (nextSaved.length > 0) {
        updateCurrentPlan(nextSaved[0]);
      } else {
        generateInitialPlan(selectedCountry);
      }
    }
  };

  // Duplicate Plan
  const handleDuplicatePlan = (plan: PartyPlan) => {
    const dupPlan: PartyPlan = {
      ...plan,
      id: `cymbal-party-${Date.now()}`,
      title: `${plan.title} (Copy)`,
      createdAt: new Date().toISOString(),
    };
    updateCurrentPlan(dupPlan);
    setIsSavedModalOpen(false);
    setCujStep('review');
  };

  const metrics = currentPlan
    ? calculateBudgetMetrics(currentPlan.items, currentPlan.targetBudget, currentPlan.guestCount)
    : { totalEstimatedCost: 0, purchasedCost: 0 };

  return (
    <div className="min-h-screen bg-zinc-50/80 text-zinc-900 flex flex-col font-sans selection:bg-emerald-600 selection:text-white">
      {/* Global Navbar */}
      <Navbar
        currentPlan={currentPlan}
        savedPlansCount={savedPlans.length}
        onOpenNewWizard={() => setCujStep('define')}
        onOpenSavedPlans={() => setIsSavedModalOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        currentStep={cujStep}
        onSelectStep={(step) => setCujStep(step)}
        totalCost={metrics.totalEstimatedCost}
        targetBudget={currentPlan?.targetBudget || selectedCountry.defaultBudget}
        countryCode={currentPlan?.countryCode || selectedCountry.code}
        onOpenCountryModal={() => setIsCountryModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5">
        {/* CUJ Stepper Bar */}
        <CUJStepper
          currentStep={cujStep}
          onSelectStep={(step) => setCujStep(step)}
          hasPlan={Boolean(currentPlan)}
          totalCost={metrics.totalEstimatedCost}
          targetBudget={currentPlan?.targetBudget || selectedCountry.defaultBudget}
        />

        {/* View Routing Based on CUJ Step */}
        {cujStep === 'define' || !currentPlan ? (
          <PartySetupWizard
            onGeneratePlan={handleGenerateNewPlan}
            isLoading={isLoading}
            currentCountryCode={selectedCountry.code}
            onCountryChange={(country) => {
              setSelectedCountry(country);
              localStorage.setItem(STORAGE_KEY_COUNTRY, country.code);
            }}
            initialValues={
              currentPlan
                ? {
                    title: currentPlan.title,
                    theme: currentPlan.theme,
                    eventType: currentPlan.eventType,
                    countryCode: currentPlan.countryCode || selectedCountry.code,
                    currencyCode: currentPlan.currencyCode || selectedCountry.currencyCode,
                    regionalPreference: currentPlan.regionalPreference,
                    guestBreakdown: currentPlan.guestBreakdown,
                    guestDietaryBreakdown: currentPlan.guestDietaryBreakdown,
                    durationHours: currentPlan.durationHours,
                    mealType: currentPlan.mealType,
                    venue: currentPlan.venue,
                    dietaryRestrictions: currentPlan.dietaryRestrictions,
                    customDietaryNotes: currentPlan.customDietaryNotes,
                    targetBudget: currentPlan.targetBudget,
                    preferredStores: [currentPlan.storeLocation || selectedCountry.defaultStores[0]?.name || 'CymbalMart Supercenter'],
                    fulfillmentPreference: currentPlan.fulfillmentType || 'curbside_pickup',
                    metricUnits: currentPlan.metricUnits ?? selectedCountry.metricUnits,
                  }
                : null
            }
          />
        ) : cujStep === 'review' ? (
          <div className="space-y-5">
            {/* Overview Card */}
            <PartyOverviewCard
              plan={currentPlan}
              onEditSpecs={() => setCujStep('define')}
              totalCost={metrics.totalEstimatedCost}
            />

            {/* Shopping List Dashboard (Task 2: Review & Align with budget) */}
            <ShoppingListDashboard
              plan={currentPlan}
              items={currentPlan.items}
              onUpdateItems={handleUpdateItems}
              onOpenAddItem={() => setIsAddItemOpen(true)}
              onProceedToRefine={() => setCujStep('refine_checkout')}
            />
          </div>
        ) : (
          /* Task 3: Refine & Checkout View */
          <RefineAndCheckoutView
            plan={currentPlan}
            items={currentPlan.items}
            chatHistory={chatHistory}
            isChatLoading={isChatLoading}
            onSendMessage={handleSendMessage}
            onUpdateItems={handleUpdateItems}
            onUpdateTimelineTask={handleUpdateTimelineTask}
            onFinalizeOrder={handleFinalizeOrder}
            onBackToReviewList={() => setCujStep('review')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white py-5 mt-10 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-zinc-800">CymbalMart Smart Shopping Agent</span>
            <span>·</span>
            <span>Global Market Localization ({selectedCountry.flag} {selectedCountry.name})</span>
            <span>·</span>
            <span>Powered by Google Gemini AI</span>
          </div>
          <span className="text-zinc-400">
            Catering portion formulas · Store brand savings swaps · 1-click pickup & delivery
          </span>
        </div>
      </footer>

      {/* Modals */}
      <AddItemModal
        isOpen={isAddItemOpen}
        onClose={() => setIsAddItemOpen(false)}
        onAddItem={handleAddItem}
      />

      {currentPlan && (
        <ExportModal
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          plan={currentPlan}
        />
      )}

      <SavedPlansModal
        isOpen={isSavedModalOpen}
        onClose={() => setIsSavedModalOpen(false)}
        savedPlans={savedPlans}
        onSelectPlan={(plan) => {
          updateCurrentPlan(plan);
          if (plan.countryCode) {
            setSelectedCountry(getCountryConfig(plan.countryCode));
          }
          setCujStep('review');
        }}
        onDeletePlan={handleDeletePlan}
        onDuplicatePlan={handleDuplicatePlan}
      />

      {currentPlan && isOrderModalOpen && (
        <OrderConfirmationModal
          plan={currentPlan}
          items={currentPlan.items}
          fulfillmentType={orderFulfillment.fulfillmentType}
          storeLocation={orderFulfillment.storeLocation}
          onClose={() => setIsOrderModalOpen(false)}
          onNewParty={() => {
            setIsOrderModalOpen(false);
            setCujStep('define');
          }}
        />
      )}

      {/* Country Selector Modal */}
      <CountrySelectorModal
        isOpen={isCountryModalOpen}
        onClose={() => setIsCountryModalOpen(false)}
        selectedCountryCode={currentPlan?.countryCode || selectedCountry.code}
        onSelectCountry={handleSelectCountryFromModal}
      />

      {/* Country Change Confirmation Modal */}
      {currentPlan && pendingTargetCountry && (
        <CountryChangeConfirmModal
          isOpen={isCountryConfirmOpen}
          onClose={() => {
            setIsCountryConfirmOpen(false);
            setPendingTargetCountry(null);
          }}
          targetCountry={pendingTargetCountry}
          currentPlan={currentPlan}
          onConfirmConvert={handleConfirmCountryConversion}
          onStartNewPlanForCountry={handleStartNewPlanForCountry}
        />
      )}

      {/* CymbalMart Assistant Customer Chatbot */}
      <CymbalMartAssistant
        isOpen={isAssistantOpen}
        onToggle={() => setIsAssistantOpen((prev) => !prev)}
        currentPlan={currentPlan}
        onUpdatePlanItems={handleUpdateItems}
        onAddItemToPlan={handleAddItem}
        onNavigateToStep={(step) => setCujStep(step)}
      />
    </div>
  );
}
