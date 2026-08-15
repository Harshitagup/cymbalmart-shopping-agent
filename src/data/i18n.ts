export type SupportedLanguage = 'en' | 'hi';

export interface TranslationDict {
  appTitle: string;
  appSubtitle: string;
  defineTab: string;
  reviewTab: string;
  checkoutTab: string;
  targetBudget: string;
  totalGuests: string;
  adults: string;
  teens: string;
  kids: string;
  duration: string;
  venue: string;
  mealType: string;
  dietaryRestrictions: string;
  cymbalChoiceStore: string;
  generatePartyPlan: string;
  generatingPlan: string;
  inCart: string;
  toBuy: string;
  purchased: string;
  alreadyHavePantry: string;
  iHaveThis: string;
  estimatedLocalPrice: string;
  priceDisclaimer: string;
  applyBrandSwap: string;
  cymbalBrandSavings: string;
  costPerGuest: string;
  smartBudgetOptimizer: string;
  partyIdeas: string;
  missingEssentials: string;
  whatIfSimulator: string;
  dietaryIntelligence: string;
  orderCurbside: string;
  orderDelivery: string;
  orderInStore: string;
  placeOrder: string;
  savedPlans: string;
  exportPlan: string;
  changeCountry: string;
  country: string;
  currency: string;
  language: string;
  curatedPresets: string;
  selectLocation: string;
  prepTimeline: string;
  hostTips: string;
  aisle: string;
  quickMarkCart: string;
  quickMarkPantry: string;
  vegetarianCount: string;
  nonVegCount: string;
  regionalCuisine: string;
  diwaliFestival: string;
  holiFestival: string;
  birthdayParty: string;
  houseParty: string;
}

export const TRANSLATIONS: Record<SupportedLanguage, TranslationDict> = {
  en: {
    appTitle: 'CymbalMart Party Planner Shopping Agent',
    appSubtitle: 'Country-aware AI grocery & party supply shopping assistant for any occasion, budget, and guest count.',
    defineTab: '1. Event Setup',
    reviewTab: '2. Review & Optimize List',
    checkoutTab: '3. Order & Finalize',
    targetBudget: 'Target Budget',
    totalGuests: 'Total Guests',
    adults: 'Adults',
    teens: 'Teens',
    kids: 'Kids',
    duration: 'Duration',
    venue: 'Venue Setting',
    mealType: 'Meal / Food Style',
    dietaryRestrictions: 'Dietary & Allergies',
    cymbalChoiceStore: 'Cymbal Choice Store Brand',
    generatePartyPlan: 'Generate AI Party Plan',
    generatingPlan: 'Crafting Localized Party Plan...',
    inCart: 'In Cart',
    toBuy: 'To Buy',
    purchased: 'Purchased',
    alreadyHavePantry: 'In Pantry ($0)',
    iHaveThis: 'I Have This',
    estimatedLocalPrice: 'Estimated Local Price',
    priceDisclaimer: 'Realistic local market pricing estimates for selected country. Not a live checkout price guarantee.',
    applyBrandSwap: 'Apply Cymbal Swap',
    cymbalBrandSavings: 'Cymbal Choice Savings',
    costPerGuest: 'Per Guest',
    smartBudgetOptimizer: 'Smart Budget Optimizer',
    partyIdeas: 'Party Ideas & Add-ons',
    missingEssentials: 'Missing Essentials Check',
    whatIfSimulator: 'What-If Simulator',
    dietaryIntelligence: 'Dietary Intelligence',
    orderCurbside: 'Curbside Pickup',
    orderDelivery: 'Express 2-Hr Delivery',
    orderInStore: 'In-Store Aisle Walk',
    placeOrder: 'Place CymbalMart Order',
    savedPlans: 'Saved Events',
    exportPlan: 'Share & Export',
    changeCountry: 'Change Region / Country',
    country: 'Country / Region',
    currency: 'Local Currency',
    language: 'Language',
    curatedPresets: 'Curated Event Bundles (1-Click)',
    selectLocation: 'Select CymbalMart Location',
    prepTimeline: 'Run-of-Show Prep Timeline',
    hostTips: 'CymbalMart Host Tips',
    aisle: 'Aisle',
    quickMarkCart: 'Swipe Right for Cart',
    quickMarkPantry: 'Swipe Left for Pantry',
    vegetarianCount: 'Vegetarian Guests',
    nonVegCount: 'Non-Vegetarian Guests',
    regionalCuisine: 'Regional Food Preference',
    diwaliFestival: 'Diwali Festive Milan',
    holiFestival: 'Holi Celebration & Snacks',
    birthdayParty: 'Birthday Celebration',
    houseParty: 'House Party & Gathering',
  },
  hi: {
    appTitle: 'सिंबल मार्ट (CymbalMart) पार्टी प्लानर शॉपिंग एजेंट',
    appSubtitle: 'किसी भी उत्सव, बजट और मेहमानों की संख्या के लिए देश-अनुकूलित किराना व पार्टी सामान सहायक।',
    defineTab: '1. ईवेंट सेटअप',
    reviewTab: '2. लिस्ट समीक्षा व बचत',
    checkoutTab: '3. ऑर्डर व समापन',
    targetBudget: 'लक्षित बजट',
    totalGuests: 'कुल मेहमान',
    adults: 'वयस्क',
    teens: 'किशोर',
    kids: 'बच्चे',
    duration: 'अवधि (घंटे)',
    venue: 'स्थान / वेन्यू',
    mealType: 'भोजन व खान-पान शैली',
    dietaryRestrictions: 'खान-पान व एलर्जी प्रतिबंध',
    cymbalChoiceStore: 'सिंबल चॉइस स्टोर ब्रांड',
    generatePartyPlan: 'पार्टी प्लान बनाएं',
    generatingPlan: 'स्थानीय पार्टी प्लान तैयार हो रहा है...',
    inCart: 'कार्ट में',
    toBuy: 'खरीदना बाकी',
    purchased: 'खरीदा गया',
    alreadyHavePantry: 'घर पर मौजूद (₹0)',
    iHaveThis: 'मेरे पास है',
    estimatedLocalPrice: 'अनुमानित स्थानीय मूल्य',
    priceDisclaimer: 'चयनित देश के अनुसार यथार्थवादी स्थानीय बाजार मूल्य अनुमान।',
    applyBrandSwap: 'सिंबल चॉइस बदलें',
    cymbalBrandSavings: 'सिंबल चॉइस बचत',
    costPerGuest: 'प्रति मेहमान',
    smartBudgetOptimizer: 'स्मार्ट बजट ऑप्टिमाइज़र',
    partyIdeas: 'पार्टी आइडियाज व सुझाव',
    missingEssentials: 'आवश्यक सामान चेक',
    whatIfSimulator: 'व्हाट-इफ सिमुलेटर',
    dietaryIntelligence: 'डाइट इंटेलिजेंस',
    orderCurbside: 'स्टोर पिकअप (Curbside)',
    orderDelivery: 'एक्सप्रेस होम डिलीवरी',
    orderInStore: 'स्टोर खरीदारी सूची',
    placeOrder: 'सिंबल मार्ट ऑर्डर बुक करें',
    savedPlans: 'सहेजे गए ईवेंट',
    exportPlan: 'शेयर व एक्सपोर्ट',
    changeCountry: 'देश / क्षेत्र बदलें',
    country: 'देश / क्षेत्र',
    currency: 'स्थानीय मुद्रा',
    language: 'भाषा',
    curatedPresets: 'तैयार पार्टी पैकेज (1-क्लिक)',
    selectLocation: 'सिंबल मार्ट स्टोर चुनें',
    prepTimeline: 'तैयारी की समय-सीमा (Timeline)',
    hostTips: 'सिंबल मार्ट होस्ट टिप्स',
    aisle: 'दुकान गलियारा',
    quickMarkCart: 'दाएं स्वाइप: कार्ट में डालें',
    quickMarkPantry: 'बाएं स्वाइप: घर पर मौजूद',
    vegetarianCount: 'शाकाहारी मेहमान (Veg)',
    nonVegCount: 'मांसाहारी मेहमान (Non-Veg)',
    regionalCuisine: 'क्षेत्रीय खान-पान पसंद',
    diwaliFestival: 'दिवाली उत्सव मिलन',
    holiFestival: 'होली मिलन व नाश्ता',
    birthdayParty: 'जन्मदिन समारोह',
    houseParty: 'हाउस पार्टी व मिलन',
  },
};

export function getTranslation(lang: SupportedLanguage = 'en'): TranslationDict {
  return TRANSLATIONS[lang] || TRANSLATIONS.en;
}
