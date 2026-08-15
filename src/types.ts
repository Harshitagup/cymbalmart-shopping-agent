export interface GuestBreakdown {
  adults: number;
  kids: number;
  teens: number;
}

export type MealType = 'full_meal' | 'heavy_appetizers' | 'snacks_desserts' | 'drinks_only' | 'brunch';
export type VenueType = 'indoor_home' | 'backyard_outdoor' | 'rented_venue' | 'park_picnic';

export interface PartyFormInput {
  title: string;
  theme: string;
  eventType: string;
  guestBreakdown: GuestBreakdown;
  durationHours: number;
  mealType: MealType;
  venue: VenueType;
  dietaryRestrictions: string[];
  customDietaryNotes?: string;
  targetBudget: number;
  preferredStores: string[];
  customNotes?: string;
  fulfillmentPreference?: 'curbside_pickup' | 'express_delivery' | 'in_store_walk';
}

export type ItemCategory = 
  | 'food_mains'
  | 'food_sides_snacks'
  | 'desserts'
  | 'drinks_cocktails'
  | 'drinks_non_alcoholic'
  | 'ice_chill'
  | 'tableware_disposables'
  | 'decor_ambiance'
  | 'entertainment_games'
  | 'essentials_emergency';

export interface ShoppingItem {
  id: string;
  name: string;
  category: ItemCategory;
  quantity: number;
  unit: string;
  estimatedPrice: number;
  targetStore?: string;
  aisle?: string;
  brandType?: 'cymbal_brand' | 'national_brand' | 'cymbal_organic';
  cymbalBrandSwap?: {
    brandName: string;
    price: number;
    savings: number;
  };
  notes?: string;
  isAlreadyOwned?: boolean; // in pantry / already have at home
  isPurchased?: boolean; // checked off while shopping
  alternativeOrBulkTip?: string;
  priority: 'must_have' | 'nice_to_have' | 'optional';
}

export interface PrepTask {
  id: string;
  timeline: '3_days_before' | '1_day_before' | 'day_of_morning' | '1_hour_before' | 'during_party';
  task: string;
  category: string;
  isCompleted?: boolean;
}

export interface PartyPlan {
  id: string;
  createdAt: string;
  title: string;
  theme: string;
  eventType: string;
  guestCount: number;
  guestBreakdown: GuestBreakdown;
  durationHours: number;
  mealType: MealType;
  venue: VenueType;
  targetBudget: number;
  dietaryRestrictions: string[];
  themeDescription: string;
  signatureDrinkName?: string;
  signatureDrinkRecipe?: string;
  playlistVibe?: string;
  items: ShoppingItem[];
  prepTimeline: PrepTask[];
  aiTips: string[];
  cateringRuleSummary: {
    drinksPerPerson: number;
    servingsPerPerson: number;
    iceLbsTotal: number;
    tablewareBufferPercent: number;
  };
  storeLocation?: string;
  fulfillmentType?: 'curbside_pickup' | 'express_delivery' | 'in_store_walk';
  isOrderPlaced?: boolean;
  orderConfirmation?: {
    orderId: string;
    pickupOrDeliveryTime: string;
    storeName: string;
    totalPaid: number;
    memberSavings: number;
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  appliedActions?: string[];
  suggestedPrompts?: string[];
  suggestedItems?: ShoppingItem[];
  intentCategory?: 'store_policy' | 'catering_math' | 'product_search' | 'savings_deal' | 'general' | 'cart_update';
}

export type CUJStep = 'define' | 'review' | 'refine_checkout';
