export interface CountryConfig {
  code: string; // ISO 3166-1 alpha-2, e.g. 'IN', 'US', 'GB'
  name: string;
  nativeName: string;
  flag: string; // Emoji flag
  currencyCode: string; // 'INR', 'USD', 'GBP', 'EUR', 'JPY', 'AED', 'CAD', 'AUD', 'SGD'
  currencySymbol: string; // '₹', '$', '£', '€', '¥', 'AED'
  locale: string; // 'en-IN', 'en-US', 'en-GB', 'ja-JP', 'de-DE'
  numberFormatLocale: string;
  defaultBudget: number; // In local currency
  budgetStep: number;
  budgetPresets: number[];
  metricUnits: boolean; // true for kg/g/L/mL, false for lbs/oz/gal
  defaultStores: { id: string; name: string; distance: string; city: string }[];
  popularOccasions: string[];
  regionalFoodOptions?: { id: string; label: string; description: string }[];
  priceRatioToUsd: number; // Approximate purchasing power / local party price ratio for reasonable estimate scaling
}

export const SUPPORTED_COUNTRIES: CountryConfig[] = [
  {
    code: 'IN',
    name: 'India',
    nativeName: 'भारत',
    flag: '🇮🇳',
    currencyCode: 'INR',
    currencySymbol: '₹',
    locale: 'en-IN',
    numberFormatLocale: 'en-IN',
    defaultBudget: 12000,
    budgetStep: 500,
    budgetPresets: [5000, 8000, 12000, 20000, 35000],
    metricUnits: true,
    priceRatioToUsd: 50, // Typical local basket in INR for party goods
    popularOccasions: [
      'Birthday Celebration',
      'Diwali Party',
      'Holi Milan & Snacks',
      'Housewarming / Griha Pravesh',
      'Wedding Function / Sangeet',
      'Anniversary Dinner',
      'Bollywood House Party',
      'Chai & Tiffin Gathering',
      'Office / Team Party',
      'Kids Birthday Extravaganza',
    ],
    regionalFoodOptions: [
      { id: 'all_indian', label: 'All Indian / Popular Mix', description: 'Crowd-favorite samosas, biryani, paneer, and chaat' },
      { id: 'north_indian', label: 'North Indian', description: 'Paneer butter masala, dal makhani, butter naan, gulab jamun' },
      { id: 'south_indian', label: 'South Indian', description: 'Mini idlis, medu vada, dosa station, filter coffee, payasam' },
      { id: 'rajasthani', label: 'Rajasthani', description: 'Dal baati churma, gatte ki sabzi, ghevar, kachoris' },
      { id: 'gujarati', label: 'Gujarati', description: 'Dhokla, khandvi, thepla, undhiyu, shrikhand, fafda' },
      { id: 'punjabi', label: 'Punjabi', description: 'Chole bhature, tandoori paneer, sarson saag, lassi' },
      { id: 'maharashtrian', label: 'Maharashtrian', description: 'Pav bhaji, misal pav, batata vada, puran poli' },
      { id: 'bengali', label: 'Bengali', description: 'Kolkata veg/chicken biryani, radhabhallavi, rasgulla, sandesh' },
      { id: 'indo_chinese', label: 'Indo-Chinese & Street Food', description: 'Veg hakka noodles, chilli paneer, manchurian, spring rolls' },
      { id: 'contemporary_fusion', label: 'Contemporary / Western Fusion', description: 'Indian sliders, paneer pizza, gourmet mocktails' },
    ],
    defaultStores: [
      { id: 'store-in-blr', name: 'CymbalMart Hypermarket - Bengaluru (Indiranagar / 100ft Rd)', distance: '1.8 km away', city: 'Bengaluru' },
      { id: 'store-in-mum', name: 'CymbalMart Supercenter - Mumbai (BKC / Bandra Kurla Complex)', distance: '2.5 km away', city: 'Mumbai' },
      { id: 'store-in-del', name: 'CymbalMart Fresh & Pantry - Delhi NCR (Gurugram CyberHub)', distance: '3.1 km away', city: 'Delhi NCR' },
      { id: 'store-in-hyd', name: 'CymbalMart Express - Hyderabad (Hitec City / Madhapur)', distance: '2.2 km away', city: 'Hyderabad' },
      { id: 'store-in-pune', name: 'CymbalMart Supercenter - Pune (Koregaon Park)', distance: '4.0 km away', city: 'Pune' },
      { id: 'store-in-che', name: 'CymbalMart Fresh - Chennai (Anna Nagar)', distance: '3.5 km away', city: 'Chennai' },
    ],
  },
  {
    code: 'US',
    name: 'United States',
    nativeName: 'United States',
    flag: '🇺🇸',
    currencyCode: 'USD',
    currencySymbol: '$',
    locale: 'en-US',
    numberFormatLocale: 'en-US',
    defaultBudget: 250,
    budgetStep: 10,
    budgetPresets: [150, 250, 350, 500, 750],
    metricUnits: false,
    priceRatioToUsd: 1.0,
    popularOccasions: [
      'Backyard BBQ & Cookout',
      'Birthday Party',
      'Game Day Tailgate',
      'Cocktail & Grazing Soirée',
      'Kids Carnival Birthday',
      'House Party & Trivia',
      'Holiday Dinner Party',
      'Graduation Celebration',
    ],
    defaultStores: [
      { id: 'store-us-1042', name: 'CymbalMart Supercenter #1042 - Sunnyvale (El Camino Real)', distance: '1.2 miles away', city: 'Sunnyvale, CA' },
      { id: 'store-us-1088', name: 'CymbalMart Fresh Market #1088 - Mountain View (Castro St)', distance: '3.4 miles away', city: 'Mountain View, CA' },
      { id: 'store-us-1015', name: 'CymbalMart Hypermarket #1015 - San Jose (North 1st)', distance: '5.8 miles away', city: 'San Jose, CA' },
      { id: 'store-us-1099', name: 'CymbalMart Express Depot #1099 - Palo Alto (University Ave)', distance: '6.1 miles away', city: 'Palo Alto, CA' },
    ],
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    nativeName: 'United Kingdom',
    flag: '🇬🇧',
    currencyCode: 'GBP',
    currencySymbol: '£',
    locale: 'en-GB',
    numberFormatLocale: 'en-GB',
    defaultBudget: 200,
    budgetStep: 10,
    budgetPresets: [120, 200, 300, 450, 600],
    metricUnits: true,
    priceRatioToUsd: 0.8,
    popularOccasions: [
      'Afternoon Tea Gathering',
      'British Pub & Games Night',
      'Sunday Roast Feast',
      'Birthday Celebration',
      'Garden Summer Party',
      'Dinner Party & Wine',
      'Housewarming Party',
    ],
    defaultStores: [
      { id: 'store-uk-lon', name: 'CymbalMart Supercenter - London (King’s Cross)', distance: '1.5 miles away', city: 'London' },
      { id: 'store-uk-man', name: 'CymbalMart Fresh & Bakery - Manchester (Deansgate)', distance: '2.8 miles away', city: 'Manchester' },
      { id: 'store-uk-edi', name: 'CymbalMart Express - Edinburgh (Princes St)', distance: '3.2 miles away', city: 'Edinburgh' },
    ],
  },
  {
    code: 'CA',
    name: 'Canada',
    nativeName: 'Canada',
    flag: '🇨🇦',
    currencyCode: 'CAD',
    currencySymbol: 'CA$',
    locale: 'en-CA',
    numberFormatLocale: 'en-CA',
    defaultBudget: 320,
    budgetStep: 10,
    budgetPresets: [180, 300, 450, 600, 850],
    metricUnits: true,
    priceRatioToUsd: 1.35,
    popularOccasions: [
      'Backyard BBQ & Patio Party',
      'Birthday Bash',
      'Hockey Game Watch Party',
      'Cottage Weekend Gathering',
      'Brunch & Mimosa Soirée',
      'Dinner & Board Games',
    ],
    defaultStores: [
      { id: 'store-ca-tor', name: 'CymbalMart Supercentre - Toronto (Downtown / Yonge St)', distance: '2.1 km away', city: 'Toronto' },
      { id: 'store-ca-van', name: 'CymbalMart Fresh - Vancouver (Robson St)', distance: '3.0 km away', city: 'Vancouver' },
      { id: 'store-ca-mtl', name: 'CymbalMart Hypermarket - Montreal (Centre-Ville)', distance: '2.7 km away', city: 'Montreal' },
    ],
  },
  {
    code: 'AU',
    name: 'Australia',
    nativeName: 'Australia',
    flag: '🇦🇺',
    currencyCode: 'AUD',
    currencySymbol: 'A$',
    locale: 'en-AU',
    numberFormatLocale: 'en-AU',
    defaultBudget: 350,
    budgetStep: 10,
    budgetPresets: [200, 350, 500, 700, 950],
    metricUnits: true,
    priceRatioToUsd: 1.5,
    popularOccasions: [
      'Aussie Backyard Barbie (BBQ)',
      'Beach & Park Picnic',
      'Birthday Celebration',
      'AFL / Footy Watch Gathering',
      'Summer Sundowner & Drinks',
      'Family Long Lunch',
    ],
    defaultStores: [
      { id: 'store-au-syd', name: 'CymbalMart Supercentre - Sydney (George St)', distance: '1.9 km away', city: 'Sydney' },
      { id: 'store-au-mel', name: 'CymbalMart Fresh & Deli - Melbourne (Southbank)', distance: '2.4 km away', city: 'Melbourne' },
      { id: 'store-au-bri', name: 'CymbalMart Hypermarket - Brisbane (Fortitude Valley)', distance: '3.6 km away', city: 'Brisbane' },
    ],
  },
  {
    code: 'AE',
    name: 'United Arab Emirates',
    nativeName: 'الإمارات',
    flag: '🇦🇪',
    currencyCode: 'AED',
    currencySymbol: 'AED',
    locale: 'en-AE',
    numberFormatLocale: 'en-AE',
    defaultBudget: 900,
    budgetStep: 50,
    budgetPresets: [500, 900, 1500, 2200, 3500],
    metricUnits: true,
    priceRatioToUsd: 3.67,
    popularOccasions: [
      'Grand Family Mezze & Grill',
      'Ramadan Iftar / Eid Feast',
      'Desert Safari & BBQ Gathering',
      'Birthday Celebration',
      'Rooftop Mocktail & Dinner Soirée',
      'Office Celebration',
    ],
    defaultStores: [
      { id: 'store-ae-dxb', name: 'CymbalMart Hypermarket - Dubai (Marina Mall / JBR)', distance: '2.1 km away', city: 'Dubai' },
      { id: 'store-ae-dxb2', name: 'CymbalMart Supercenter - Dubai (Downtown / Business Bay)', distance: '3.4 km away', city: 'Dubai' },
      { id: 'store-ae-auh', name: 'CymbalMart Fresh - Abu Dhabi (Corniche / Al Zahiyah)', distance: '2.8 km away', city: 'Abu Dhabi' },
    ],
  },
  {
    code: 'SG',
    name: 'Singapore',
    nativeName: 'Singapore',
    flag: '🇸🇬',
    currencyCode: 'SGD',
    currencySymbol: 'S$',
    locale: 'en-SG',
    numberFormatLocale: 'en-SG',
    defaultBudget: 340,
    budgetStep: 10,
    budgetPresets: [180, 340, 500, 700, 1000],
    metricUnits: true,
    priceRatioToUsd: 1.34,
    popularOccasions: [
      'Hawker-Style Party & Satay Feast',
      'Condo BBQ & Pool Party',
      'Birthday Bash',
      'Steamboat / Hotpot Gathering',
      'High Tea & Bites Soirée',
      'Festive Celebration',
    ],
    defaultStores: [
      { id: 'store-sg-orchard', name: 'CymbalMart Supercenter - Singapore (Orchard Gateway)', distance: '1.2 km away', city: 'Singapore' },
      { id: 'store-sg-jurong', name: 'CymbalMart Hypermarket - Singapore (Jurong East)', distance: '4.5 km away', city: 'Singapore' },
      { id: 'store-sg-tampines', name: 'CymbalMart Fresh - Singapore (Tampines Hub)', distance: '5.1 km away', city: 'Singapore' },
    ],
  },
  {
    code: 'JP',
    name: 'Japan',
    nativeName: '日本',
    flag: '🇯🇵',
    currencyCode: 'JPY',
    currencySymbol: '¥',
    locale: 'ja-JP',
    numberFormatLocale: 'ja-JP',
    defaultBudget: 35000,
    budgetStep: 1000,
    budgetPresets: [15000, 25000, 35000, 55000, 80000],
    metricUnits: true,
    priceRatioToUsd: 150,
    popularOccasions: [
      'Izakaya Night & Yakitori Party',
      'Takoyaki & Gyoza Home Party',
      'Hanami / Park Picnic',
      'Birthday Celebration (お誕生日会)',
      'Nabe Hot Pot Winter Gathering',
      'Team & Year-End Party (忘年会)',
    ],
    defaultStores: [
      { id: 'store-jp-shibuya', name: 'CymbalMart Hypermarket - Tokyo (Shibuya Dogenzaka)', distance: '1.1 km away', city: 'Tokyo' },
      { id: 'store-jp-shinjuku', name: 'CymbalMart Fresh - Tokyo (Shinjuku East)', distance: '2.3 km away', city: 'Tokyo' },
      { id: 'store-jp-osaka', name: 'CymbalMart Supercenter - Osaka (Umeda / Namba)', distance: '3.0 km away', city: 'Osaka' },
    ],
  },
  {
    code: 'DE',
    name: 'Germany',
    nativeName: 'Deutschland',
    flag: '🇩🇪',
    currencyCode: 'EUR',
    currencySymbol: '€',
    locale: 'de-DE',
    numberFormatLocale: 'de-DE',
    defaultBudget: 220,
    budgetStep: 10,
    budgetPresets: [120, 220, 320, 480, 650],
    metricUnits: true,
    priceRatioToUsd: 0.92,
    popularOccasions: [
      'Gartenparty & Grillabend (BBQ)',
      'Geburtstagsfeier (Birthday)',
      'Kaffee & Kuchen Nachmittag',
      'Spieleabend & Fingerfood',
      'Feierabend & Biergarten Gathering',
    ],
    defaultStores: [
      { id: 'store-de-ber', name: 'CymbalMart Supercenter - Berlin (Mitte / Alexanderplatz)', distance: '2.0 km away', city: 'Berlin' },
      { id: 'store-de-mun', name: 'CymbalMart Fresh & Bio - München (Marienplatz)', distance: '2.5 km away', city: 'München' },
      { id: 'store-de-fra', name: 'CymbalMart Hypermarket - Frankfurt (Innenstadt)', distance: '3.1 km away', city: 'Frankfurt' },
    ],
  },
  {
    code: 'FR',
    name: 'France',
    nativeName: 'France',
    flag: '🇫🇷',
    currencyCode: 'EUR',
    currencySymbol: '€',
    locale: 'fr-FR',
    numberFormatLocale: 'fr-FR',
    defaultBudget: 240,
    budgetStep: 10,
    budgetPresets: [130, 240, 350, 500, 700],
    metricUnits: true,
    priceRatioToUsd: 0.92,
    popularOccasions: [
      'Apéro Dînatoire & Planches',
      'Fête d’Anniversaire',
      'Repas de Famille Gourmand',
      'Soirée Fromages & Vin',
      'Brunch du Dimanche',
    ],
    defaultStores: [
      { id: 'store-fr-par', name: 'CymbalMart Gourmet & Hyper - Paris (Châtelet / Rivoli)', distance: '1.8 km away', city: 'Paris' },
      { id: 'store-fr-lyo', name: 'CymbalMart Fresh - Lyon (Bellecour)', distance: '2.6 km away', city: 'Lyon' },
      { id: 'store-fr-mar', name: 'CymbalMart Supercenter - Marseille (Vieux-Port)', distance: '3.4 km away', city: 'Marseille' },
    ],
  },
];

/**
 * Intelligent Country Detection based on Intl TimeZone / Navigators
 */
export function detectUserCountry(): CountryConfig {
  if (typeof window === 'undefined') {
    return SUPPORTED_COUNTRIES[0]; // Default India/Global
  }

  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const langs = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || ''])
      .map((l) => l.toUpperCase());
    
    // Check timezone keywords
    if (/kolkata|calcutta|india|delhi|mumbai|bangalore|hyderabad|chennai/i.test(tz)) {
      return SUPPORTED_COUNTRIES.find((c) => c.code === 'IN') || SUPPORTED_COUNTRIES[0];
    }
    if (/london|belfast|scotland/i.test(tz)) {
      return SUPPORTED_COUNTRIES.find((c) => c.code === 'GB') || SUPPORTED_COUNTRIES[1];
    }
    if (/tokyo|osaka|sapporo/i.test(tz)) {
      return SUPPORTED_COUNTRIES.find((c) => c.code === 'JP') || SUPPORTED_COUNTRIES[1];
    }
    if (/dubai|abu_dhabi/i.test(tz)) {
      return SUPPORTED_COUNTRIES.find((c) => c.code === 'AE') || SUPPORTED_COUNTRIES[1];
    }
    if (/singapore/i.test(tz)) {
      return SUPPORTED_COUNTRIES.find((c) => c.code === 'SG') || SUPPORTED_COUNTRIES[1];
    }
    if (/sydney|melbourne|brisbane|perth|adelaide/i.test(tz)) {
      return SUPPORTED_COUNTRIES.find((c) => c.code === 'AU') || SUPPORTED_COUNTRIES[1];
    }
    if (/toronto|vancouver|montreal|edmonton|calgary/i.test(tz)) {
      return SUPPORTED_COUNTRIES.find((c) => c.code === 'CA') || SUPPORTED_COUNTRIES[1];
    }
    if (/berlin|frankfurt|munich/i.test(tz)) {
      return SUPPORTED_COUNTRIES.find((c) => c.code === 'DE') || SUPPORTED_COUNTRIES[1];
    }
    if (/paris|lyon|marseille/i.test(tz)) {
      return SUPPORTED_COUNTRIES.find((c) => c.code === 'FR') || SUPPORTED_COUNTRIES[1];
    }
    if (/new_york|los_angeles|chicago|denver|phoenix/i.test(tz)) {
      return SUPPORTED_COUNTRIES.find((c) => c.code === 'US') || SUPPORTED_COUNTRIES[1];
    }

    // Check language codes
    const hasIndiaLang = langs.some((l) => l.includes('IN') || l.startsWith('HI') || l.startsWith('TA') || l.startsWith('TE') || l.startsWith('GU') || l.startsWith('MR') || l.startsWith('BN'));
    if (hasIndiaLang) {
      return SUPPORTED_COUNTRIES.find((c) => c.code === 'IN') || SUPPORTED_COUNTRIES[0];
    }

    const hasUk = langs.some((l) => l.includes('GB'));
    if (hasUk) return SUPPORTED_COUNTRIES.find((c) => c.code === 'GB')!;

    const hasJapan = langs.some((l) => l.includes('JP') || l.startsWith('JA'));
    if (hasJapan) return SUPPORTED_COUNTRIES.find((c) => c.code === 'JP')!;
  } catch (e) {
    console.warn('Country auto-detection fallback:', e);
  }

  // Default to India (as requested prominently) or fallback to US
  return SUPPORTED_COUNTRIES[0];
}

export function getCountryConfig(code?: string): CountryConfig {
  if (!code) return SUPPORTED_COUNTRIES[0];
  const found = SUPPORTED_COUNTRIES.find((c) => c.code.toUpperCase() === code.toUpperCase());
  return found || SUPPORTED_COUNTRIES[0];
}
