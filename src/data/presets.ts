import { PartyFormInput } from '../types';

export interface PartyPreset {
  id: string;
  name: string;
  tagline: string;
  badge: string;
  icon: string;
  config: PartyFormInput;
}

export const CYMBALMART_STORES = [
  { id: 'store-1042', name: 'CymbalMart Supercenter #1042 - Sunnyvale (El Camino Real)', distance: '1.2 miles away' },
  { id: 'store-1088', name: 'CymbalMart Fresh Market #1088 - Mountain View (Castro St)', distance: '3.4 miles away' },
  { id: 'store-1015', name: 'CymbalMart Hypermarket #1015 - San Jose (North 1st)', distance: '5.8 miles away' },
  { id: 'store-1099', name: 'CymbalMart Express Depot #1099 - Palo Alto (University Ave)', distance: '6.1 miles away' },
];

export const PARTY_PRESETS: PartyPreset[] = [
  {
    id: 'cymbal-backyard-bbq',
    name: 'Cymbal Fresh Summer Cookout',
    tagline: 'Cymbal Choice Angus beef & veggie burgers, farm-stand corn, craft brews & lawn games',
    badge: 'Cymbal Favorite',
    icon: 'Flame',
    config: {
      title: 'Summer Backyard Cookout',
      theme: 'Classic Americana BBQ',
      eventType: 'Cookout / BBQ',
      guestBreakdown: { adults: 14, teens: 4, kids: 6 },
      durationHours: 4,
      mealType: 'full_meal',
      venue: 'backyard_outdoor',
      dietaryRestrictions: ['Vegetarian Option', 'Gluten-Free Option'],
      customDietaryNotes: '4 vegetarian guests (Cymbal Plant-Based patties & grilled veggies)',
      targetBudget: 280,
      preferredStores: ['CymbalMart Supercenter'],
      customNotes: 'Outdoor gathering: need plenty of party ice, cooler bags, citronella torches, and paper tableware.',
      fulfillmentPreference: 'curbside_pickup',
    },
  },
  {
    id: 'cymbal-taco-fiesta',
    name: 'Cymbal Cantina Street Taco Bar',
    tagline: 'Carnitas, fajita veggies, 4-salsa tasting bar & sparkling citrus margarita mocktails',
    badge: 'Crowd Pleaser',
    icon: 'Utensils',
    config: {
      title: 'Cinco Cantina Taco Bar',
      theme: 'Festive Mexican Cantina',
      eventType: 'Casual Fiesta',
      guestBreakdown: { adults: 16, teens: 2, kids: 2 },
      durationHours: 3.5,
      mealType: 'full_meal',
      venue: 'indoor_home',
      dietaryRestrictions: ['Gluten-Free Option', 'Vegan / Vegetarian'],
      customDietaryNotes: 'Corn tortillas (GF), Cymbal Organic black beans & fajita peppers for vegans',
      targetBudget: 220,
      preferredStores: ['CymbalMart Supercenter'],
      customNotes: 'Keep tortillas warm in slow cooker, 4-variety salsa bar with Cymbal Tortilla Crisps.',
      fulfillmentPreference: 'express_delivery',
    },
  },
  {
    id: 'cymbal-gourmet-charcuterie',
    name: 'Cymbal Gourmet Charcuterie & Wine Soirée',
    tagline: 'Artisanal imported cheeses, cured prosciutto, rustic baguettes & chilled vineyard wines',
    badge: 'Host Choice',
    icon: 'Wine',
    config: {
      title: 'Tuscan Wine & Grazing Evening',
      theme: 'Rustic Italian Vineyard',
      eventType: 'Dinner & Cocktail Party',
      guestBreakdown: { adults: 12, teens: 0, kids: 0 },
      durationHours: 3,
      mealType: 'heavy_appetizers',
      venue: 'indoor_home',
      dietaryRestrictions: ['Vegetarian Option', 'Gluten-Free Crackers'],
      customDietaryNotes: 'Artisan cheese board with separate GF crackers and vegan hummus dip',
      targetBudget: 250,
      preferredStores: ['CymbalMart Supercenter'],
      customNotes: 'Candles, linen napkins, wine pairing labels, and fresh floral centerpiece.',
      fulfillmentPreference: 'curbside_pickup',
    },
  },
  {
    id: 'cymbal-kids-birthday',
    name: 'Cymbal Hero Kids Birthday Carnival',
    tagline: 'Mini bakery cupcakes, superhero punch, allergy-friendly snacks & festive party decor',
    badge: 'Kids Hit',
    icon: 'Sparkles',
    config: {
      title: 'Superhero Epic Birthday Blast',
      theme: 'Marvel Superhero Adventure',
      eventType: 'Kids Birthday',
      guestBreakdown: { adults: 8, teens: 2, kids: 12 },
      durationHours: 2.5,
      mealType: 'snacks_desserts',
      venue: 'indoor_home',
      dietaryRestrictions: ['Nut-Free', 'Dairy-Free Option'],
      customDietaryNotes: '100% peanut-safe snacks, 100% juice boxes, mini cupcakes from Cymbal Bakery',
      targetBudget: 175,
      preferredStores: ['CymbalMart Supercenter'],
      customNotes: 'Superhero paper plates, balloon garland, bubble wands, and signature red punch.',
      fulfillmentPreference: 'curbside_pickup',
    },
  },
  {
    id: 'cymbal-game-day-tailgate',
    name: 'Cymbal Game Day Tailgate & Wings',
    tagline: 'Crispy wings, loaded queso dip, craft soda 24-packs & game day cups',
    badge: 'Game Day',
    icon: 'Tv',
    config: {
      title: 'Championship Game Watch Party',
      theme: 'Stadium Tailgate & Snacks',
      eventType: 'Sports Watch Party',
      guestBreakdown: { adults: 14, teens: 2, kids: 0 },
      durationHours: 4,
      mealType: 'heavy_appetizers',
      venue: 'indoor_home',
      dietaryRestrictions: ['Vegetarian Option'],
      customDietaryNotes: 'Cheese dip, soft pretzels, wings with Buffalo and Honey BBQ sauces',
      targetBudget: 190,
      preferredStores: ['CymbalMart Supercenter'],
      customNotes: 'Finger foods that are easy to eat on the couch, 24-can beverage cooler with plenty of ice.',
      fulfillmentPreference: 'express_delivery',
    },
  },
  {
    id: 'cymbal-budget-pizza-trivia',
    name: 'Cymbal Value Pizza & Trivia Night',
    tagline: 'Maximum fun, minimum spend: Cymbal Bakery take-n-bake pizzas, popcorn & trivia prizes',
    badge: 'Budget Value',
    icon: 'Coins',
    config: {
      title: 'Trivia & Pizza Throwdown',
      theme: 'Retro Pub Quiz & Board Games',
      eventType: 'Game Night / Casual',
      guestBreakdown: { adults: 12, teens: 0, kids: 0 },
      durationHours: 3,
      mealType: 'full_meal',
      venue: 'indoor_home',
      dietaryRestrictions: ['Vegetarian Option'],
      customDietaryNotes: 'Cheese and Veggie pizza options, popcorn and soda bar',
      targetBudget: 110,
      preferredStores: ['CymbalMart Supercenter'],
      customNotes: 'Cymbal Take & Bake XXL pizzas + popcorn bowl + trivia winner prizes.',
      fulfillmentPreference: 'curbside_pickup',
    },
  },
];

export const DIETARY_OPTIONS = [
  'Vegetarian',
  'Vegan',
  'Gluten-Free',
  'Nut-Free (Allergy Safe)',
  'Dairy-Free',
  'Halal',
  'Kosher',
  'Alcohol-Free / Mocktail Focus',
  'Low-Sugar / Keto',
];

export const STORE_OPTIONS = [
  { id: 'CymbalMart Supercenter', name: 'CymbalMart Supercenter (All Aisles)', color: 'bg-emerald-50 text-emerald-800 border-emerald-300' },
  { id: 'CymbalMart Fresh', name: 'CymbalMart Fresh (Produce, Bakery & Deli)', color: 'bg-teal-50 text-teal-800 border-teal-300' },
  { id: 'CymbalMart Beverage Depot', name: 'CymbalMart Beverage & Spirits Depot', color: 'bg-purple-50 text-purple-800 border-purple-300' },
];

export const CATEGORY_METADATA: Record<string, { label: string; aisle: string; icon: string; color: string }> = {
  food_mains: { label: 'Mains & Meat Counter', aisle: 'Meat Counter / Deli', icon: 'Utensils', color: 'text-amber-800 bg-amber-50 border-amber-200' },
  food_sides_snacks: { label: 'Produce, Sides & Grazing', aisle: 'Aisle 1 & 5', icon: 'Salad', color: 'text-emerald-800 bg-emerald-50 border-emerald-200' },
  desserts: { label: 'Cymbal Bakery & Sweets', aisle: 'Aisle 3 (Bakery)', icon: 'Cake', color: 'text-pink-800 bg-pink-50 border-pink-200' },
  drinks_cocktails: { label: 'Cocktails & Mixers', aisle: 'Aisle 8 (Beverages)', icon: 'Wine', color: 'text-purple-800 bg-purple-50 border-purple-200' },
  drinks_non_alcoholic: { label: 'Seltzers & Sodas', aisle: 'Aisle 9 (Drinks)', icon: 'CupSoda', color: 'text-sky-800 bg-sky-50 border-sky-200' },
  ice_chill: { label: 'Party Ice & Coolers', aisle: 'Freezer / Ice Depot', icon: 'Snowflake', color: 'text-cyan-800 bg-cyan-50 border-cyan-200' },
  tableware_disposables: { label: 'Tableware & Disposables', aisle: 'Aisle 11 (Party)', icon: 'PackageCheck', color: 'text-indigo-800 bg-indigo-50 border-indigo-200' },
  decor_ambiance: { label: 'Party Decor & Lights', aisle: 'Aisle 12 (Seasonal)', icon: 'Sparkles', color: 'text-rose-800 bg-rose-50 border-rose-200' },
  entertainment_games: { label: 'Games & Activities', aisle: 'Aisle 14 (Toys & Games)', icon: 'Gamepad2', color: 'text-violet-800 bg-violet-50 border-violet-200' },
  essentials_emergency: { label: 'Cleanup & Host Essentials', aisle: 'Aisle 7 (Household)', icon: 'ShieldAlert', color: 'text-zinc-800 bg-zinc-100 border-zinc-200' },
};
