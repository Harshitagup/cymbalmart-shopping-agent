export interface GuestBreakdown {
  adults: number;
  kids: number;
  teens: number;
}

export type MealType = 'full_meal' | 'heavy_appetizers' | 'snacks_desserts' | 'drinks_only' | 'brunch';
export type VenueType = 'indoor_home' | 'backyard_outdoor' | 'rented_venue' | 'park_picnic';
export type ServingMode = 'low_waste' | 'standard' | 'generous';

export interface GuestDietaryBreakdown {
  pureVeg?: number;
  nonVeg?: number;
  vegan?: number;
  jain?: number;
  glutenFree?: number;
  halal?: number;
  other?: number;
}

export interface PartyFormInput {
  title: string;
  theme: string;
  eventType: string;
  countryCode?: string; // e.g. 'IN', 'US', 'GB'
  currencyCode?: string; // e.g. 'INR', 'USD', 'GBP'
  regionalPreference?: string; // e.g. 'north_indian', 'south_indian', 'rajasthani', etc.
  guestBreakdown: GuestBreakdown;
  guestDietaryBreakdown?: GuestDietaryBreakdown;
  durationHours: number;
  mealType: MealType;
  venue: VenueType;
  dietaryRestrictions: string[];
  customDietaryNotes?: string;
  targetBudget: number;
  preferredStores: string[];
  customNotes?: string;
  fulfillmentPreference?: 'curbside_pickup' | 'express_delivery' | 'in_store_walk';
  eventDate?: string;
  servingMode?: ServingMode;
  metricUnits?: boolean;
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

export type ItemShoppingStatus = 'to_buy' | 'in_cart' | 'purchased' | 'already_have' | 'already_owned';

export interface ShoppingItem {
  id: string;
  name: string;
  category: ItemCategory;
  quantity: number;
  unit: string;
  estimatedPrice: number;
  pricingType?: 'live_store' | 'estimated_local' | 'converted_estimate';
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
  isInCart?: boolean; // currently placed in shopping cart
  isPurchased?: boolean; // checked off / paid for
  shoppingStatus?: ItemShoppingStatus;
  alternativeOrBulkTip?: string;
  priority: 'must_have' | 'nice_to_have' | 'optional';
  dietaryTags?: string[];
  hasConflict?: boolean;
  conflictReason?: string;
}

export type TimelineMilestone =
  | '1_week_before'
  | '3_days_before'
  | '1_day_before'
  | 'day_of_morning'
  | '1_hour_before'
  | 'during_party'
  | 'after_party'
  | 'after_event';

export interface PrepTask {
  id: string;
  timeline: TimelineMilestone;
  task: string;
  category: string;
  isCompleted?: boolean;
}

export interface BudgetOptimizationSuggestion {
  id: string;
  itemId: string;
  type: 'swap_store_brand' | 'reduce_qty' | 'remove_optional' | 'cheaper_substitute';
  currentProduct: string;
  recommendedChange: string;
  currentCost: number;
  newCost: number;
  estimatedSavings: number;
  shortReason: string;
  selected: boolean;
  appliedPayload?: {
    name?: string;
    estimatedPrice?: number;
    quantity?: number;
    brandType?: 'cymbal_brand' | 'national_brand' | 'cymbal_organic';
    isAlreadyOwned?: boolean;
    notes?: string;
  };
}

export interface DietaryConflict {
  id: string;
  itemId: string;
  itemName: string;
  dietaryType: string;
  conflictReason: string;
  suggestedReplacement: {
    name: string;
    estimatedPrice: number;
    unit: string;
    category: ItemCategory;
    aisle?: string;
    brandType?: 'cymbal_brand' | 'national_brand' | 'cymbal_organic';
    reason: string;
  };
}

export interface PartyIdeaSuggestion {
  id: string;
  title: string;
  category: 'decorations' | 'food' | 'drinks' | 'desserts' | 'entertainment' | 'games' | 'music_playlist' | 'party_supplies' | 'optional_upgrades';
  priorityGroup: 'must_have' | 'recommended' | 'nice_to_have';
  description: string;
  estimatedCost: number;
  budgetImpactPercent: number;
  suggestedItem?: Partial<ShoppingItem>;
}

export interface MissingEssentialItem {
  id: string;
  name: string;
  category: ItemCategory;
  estimatedPrice: number;
  unit: string;
  aisle: string;
  reason: string;
  triggerReason: string;
  priority: 'must_have' | 'nice_to_have' | 'optional';
}

export interface PartyPlan {
  id: string;
  createdAt: string;
  eventDate?: string;
  title: string;
  theme: string;
  eventType: string;
  countryCode?: string; // e.g. 'IN', 'US', 'GB'
  currencyCode?: string; // e.g. 'INR', 'USD', 'GBP'
  currencySymbol?: string; // e.g. '₹', '$', '£'
  regionalPreference?: string;
  guestCount: number;
  guestBreakdown: GuestBreakdown;
  guestDietaryBreakdown?: GuestDietaryBreakdown;
  durationHours: number;
  mealType: MealType;
  venue: VenueType;
  targetBudget: number;
  servingMode?: ServingMode;
  metricUnits?: boolean;
  status?: 'in_planning' | 'shopping' | 'ready' | 'finalized';
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

