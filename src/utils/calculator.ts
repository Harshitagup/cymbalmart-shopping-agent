import {
  PartyPlan,
  ShoppingItem,
  GuestBreakdown,
  ServingMode,
  BudgetOptimizationSuggestion,
  DietaryConflict,
  MissingEssentialItem,
  PartyIdeaSuggestion,
  ItemCategory,
} from '../types';
import { getCountryConfig, SUPPORTED_COUNTRIES } from '../data/countries';

export interface BudgetMetrics {
  totalEstimatedCost: number; // excluding already owned
  purchasedCost: number;
  inCartCost: number;
  remainingCost: number;
  alreadyOwnedSavings: number;
  cymbalBrandSavings: number;
  costPerGuest: number;
  isOverBudget: boolean;
  variance: number; // positive = under budget, negative = over budget
  totalItemsCount: number;
  toBuyItemsCount: number;
  inCartItemsCount: number;
  itemsInCartCount: number;
  purchasedItemsCount: number;
  pantryItemsCount: number;
  progressPercent: number;
  shoppingProgressPercentage: number;
  categoryBreakdown: Record<string, number>;
}

export function calculateBudgetMetrics(items: ShoppingItem[], targetBudget: number, guestCount: number): BudgetMetrics {
  let totalEstimatedCost = 0;
  let purchasedCost = 0;
  let inCartCost = 0;
  let alreadyOwnedSavings = 0;
  let cymbalBrandSavings = 0;
  let toBuyItemsCount = 0;
  let inCartItemsCount = 0;
  let purchasedItemsCount = 0;
  let pantryItemsCount = 0;
  const categoryBreakdown: Record<string, number> = {};

  items.forEach((item) => {
    const qty = Number(item.quantity) || 1;
    const price = Number(item.estimatedPrice) || 0;
    const itemTotal = qty * price;

    if (item.cymbalBrandSwap?.savings) {
      cymbalBrandSavings += item.cymbalBrandSwap.savings * qty;
    } else if (item.brandType === 'cymbal_brand' || item.brandType === 'cymbal_organic') {
      cymbalBrandSavings += (item.estimatedPrice * 0.25) * qty;
    }

    const isPantry = item.isAlreadyOwned || item.shoppingStatus === 'already_have';
    const isBought = item.isPurchased || item.shoppingStatus === 'purchased';
    const isInCart = item.isInCart || item.shoppingStatus === 'in_cart';

    if (isPantry) {
      alreadyOwnedSavings += itemTotal;
      pantryItemsCount++;
    } else {
      totalEstimatedCost += itemTotal;
      categoryBreakdown[item.category] = (categoryBreakdown[item.category] || 0) + itemTotal;

      if (isBought) {
        purchasedCost += itemTotal;
        purchasedItemsCount++;
      } else if (isInCart) {
        inCartCost += itemTotal;
        inCartItemsCount++;
      } else {
        toBuyItemsCount++;
      }
    }
  });

  const remainingCost = Math.max(0, totalEstimatedCost - purchasedCost);
  const totalNeedShopping = items.length - pantryItemsCount;
  const progressPercent = totalNeedShopping > 0
    ? Math.round(((purchasedItemsCount + inCartItemsCount * 0.5) / totalNeedShopping) * 100)
    : 100;

  const validGuestCount = Math.max(1, Number(guestCount) || 1);
  const costPerGuest = totalEstimatedCost / validGuestCount;
  const variance = targetBudget - totalEstimatedCost;
  const isOverBudget = totalEstimatedCost > targetBudget;

  return {
    totalEstimatedCost: Math.round(totalEstimatedCost * 100) / 100,
    purchasedCost: Math.round(purchasedCost * 100) / 100,
    inCartCost: Math.round(inCartCost * 100) / 100,
    remainingCost: Math.round(remainingCost * 100) / 100,
    alreadyOwnedSavings: Math.round(alreadyOwnedSavings * 100) / 100,
    cymbalBrandSavings: Math.round(cymbalBrandSavings * 100) / 100,
    costPerGuest: Math.round(costPerGuest * 100) / 100,
    isOverBudget,
    variance: Math.round(variance * 100) / 100,
    totalItemsCount: items.length,
    toBuyItemsCount,
    inCartItemsCount,
    itemsInCartCount: inCartItemsCount,
    purchasedItemsCount,
    pantryItemsCount,
    progressPercent: Math.min(100, Math.max(0, progressPercent)),
    shoppingProgressPercentage: Math.min(100, Math.max(0, progressPercent)),
    categoryBreakdown,
  };
}

let defaultCountryCode: string = 'IN';

export function setDefaultCountryCode(code: string) {
  defaultCountryCode = code;
}

export function formatCurrency(
  amount: number,
  countryCode?: string,
  currencyCode?: string
): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  const code = countryCode || defaultCountryCode || 'IN';
  const cfg = getCountryConfig(code);
  const cur = currencyCode || cfg.currencyCode;

  try {
    if (cur === 'INR' || code === 'IN') {
      // Indian numbering system formatting
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(safeAmount);
    }

    if (cur === 'JPY' || code === 'JP') {
      return new Intl.NumberFormat('ja-JP', {
        style: 'currency',
        currency: 'JPY',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(safeAmount);
    }

    if (cur === 'AED' || code === 'AE') {
      return `AED ${new Intl.NumberFormat('en-AE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(safeAmount)}`;
    }

    const localeToUse = cfg.locale || 'en-US';
    return new Intl.NumberFormat(localeToUse, {
      style: 'currency',
      currency: cur,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(safeAmount);
  } catch {
    return `${cfg.currencySymbol}${safeAmount.toFixed(2)}`;
  }
}

/**
 * Intelligent Plan Adaptation across Countries
 * Converts prices realistically based on local purchasing standards, adapts units,
 * changes currency and assigns a local CymbalMart store.
 */
export function convertPlanPricesToCountry(
  plan: PartyPlan,
  targetCountryCode: string
): PartyPlan {
  const sourceCode = plan.countryCode || 'US';
  const sourceConfig = getCountryConfig(sourceCode);
  const targetConfig = getCountryConfig(targetCountryCode);

  if (sourceConfig.code === targetConfig.code) {
    return plan;
  }

  // Price ratio factor for basket conversion
  const scaleRatio = targetConfig.priceRatioToUsd / (sourceConfig.priceRatioToUsd || 1.0);

  const convertedTargetBudget = Math.round(plan.targetBudget * scaleRatio);

  const convertedItems: ShoppingItem[] = plan.items.map((item) => {
    let unitPrice = item.estimatedPrice * scaleRatio;

    // Clean rounding based on currency type
    if (targetConfig.currencyCode === 'INR') {
      unitPrice = Math.max(20, Math.round(unitPrice / 10) * 10);
    } else if (targetConfig.currencyCode === 'JPY') {
      unitPrice = Math.max(100, Math.round(unitPrice / 50) * 50);
    } else {
      unitPrice = Math.max(0.99, Math.round(unitPrice * 100) / 100);
    }

    let unit = item.unit;
    // Adapt units between metric and imperial
    if (targetConfig.metricUnits && !sourceConfig.metricUnits) {
      unit = unit.replace(/lbs?/i, 'kg').replace(/oz/i, 'g').replace(/gal(lon)?/i, 'L');
    } else if (!targetConfig.metricUnits && sourceConfig.metricUnits) {
      unit = unit.replace(/kg/i, 'lb').replace(/\bg\b/i, 'oz').replace(/\bL\b/i, 'gal');
    }

    const cymbalBrandSwap = item.cymbalBrandSwap
      ? {
          brandName: item.cymbalBrandSwap.brandName,
          price: Math.round(unitPrice * 0.75 * 100) / 100,
          savings: Math.round(unitPrice * 0.25 * 100) / 100,
        }
      : undefined;

    return {
      ...item,
      estimatedPrice: unitPrice,
      unit,
      pricingType: 'converted_estimate',
      cymbalBrandSwap,
    };
  });

  const defaultStore = targetConfig.defaultStores[0]?.name || `CymbalMart Supercenter (${targetConfig.name})`;

  return {
    ...plan,
    countryCode: targetConfig.code,
    currencyCode: targetConfig.currencyCode,
    currencySymbol: targetConfig.currencySymbol,
    metricUnits: targetConfig.metricUnits,
    targetBudget: convertedTargetBudget,
    storeLocation: defaultStore,
    items: convertedItems,
  };
}

// -------------------------------------------------------------
// 2. DYNAMIC GUEST COUNT RECALCULATION & PORTION MATH
// -------------------------------------------------------------
export interface GuestRecalcResult {
  updatedItems: ShoppingItem[];
  oldTotalGuests: number;
  newTotalGuests: number;
  explanation: string;
  cateringRuleSummary: {
    drinksPerPerson: number;
    servingsPerPerson: number;
    iceLbsTotal: number;
    tablewareBufferPercent: number;
  };
}

export function recalculateQuantitiesForGuests(
  items: ShoppingItem[],
  oldBreakdown: GuestBreakdown,
  newBreakdown: GuestBreakdown,
  durationHours: number = 3,
  servingMode: ServingMode = 'standard',
  venue: string = 'indoor_home'
): GuestRecalcResult {
  const safeAdultsOld = Math.max(0, Number(oldBreakdown.adults) || 0);
  const safeTeensOld = Math.max(0, Number(oldBreakdown.teens) || 0);
  const safeKidsOld = Math.max(0, Number(oldBreakdown.kids) || 0);
  const oldTotal = Math.max(1, safeAdultsOld + safeTeensOld + safeKidsOld);

  const safeAdultsNew = Math.max(0, Number(newBreakdown.adults) || 0);
  const safeTeensNew = Math.max(0, Number(newBreakdown.teens) || 0);
  const safeKidsNew = Math.max(0, Number(newBreakdown.kids) || 0);
  const newTotal = Math.max(1, safeAdultsNew + safeTeensNew + safeKidsNew);

  // Serving Mode Multipliers
  const modeMultiplier = servingMode === 'low_waste' ? 0.9 : servingMode === 'generous' ? 1.25 : 1.0;

  // Weighted Appetite Factors:
  // Adults = 1.0, Teens = 1.25 (hearty appetites), Kids = 0.6 (smaller portions)
  const oldFoodWeight = Math.max(1, safeAdultsOld * 1.0 + safeTeensOld * 1.25 + safeKidsOld * 0.6);
  const newFoodWeight = Math.max(1, safeAdultsNew * 1.0 + safeTeensNew * 1.25 + safeKidsNew * 0.6);
  const foodScaleFactor = (newFoodWeight / oldFoodWeight) * modeMultiplier;

  // Drink Weight:
  // Adults = 1.0 (cocktails, beers, seltzers), Teens = 1.2 (sodas, juices), Kids = 0.8 (juice boxes)
  const oldDrinkWeight = Math.max(1, safeAdultsOld * 1.0 + safeTeensOld * 1.2 + safeKidsOld * 0.8);
  const newDrinkWeight = Math.max(1, safeAdultsNew * 1.0 + safeTeensNew * 1.2 + safeKidsNew * 0.8);
  const drinkScaleFactor = (newDrinkWeight / oldDrinkWeight) * modeMultiplier;

  // Headcount scale for tableware, ice, cleanup
  const headcountScale = (newTotal / oldTotal) * modeMultiplier;

  const updatedItems = items.map((item) => {
    const currentQty = Number(item.quantity) || 1;
    let factor = 1.0;

    switch (item.category) {
      case 'food_mains':
      case 'food_sides_snacks':
      case 'desserts':
        factor = foodScaleFactor;
        break;
      case 'drinks_cocktails':
        // Alcoholic or mocktail craft drinks scale mainly with adults + teens
        const adultTeenScale = (Math.max(1, safeAdultsNew + safeTeensNew) / Math.max(1, safeAdultsOld + safeTeensOld)) * modeMultiplier;
        factor = adultTeenScale;
        break;
      case 'drinks_non_alcoholic':
      case 'ice_chill':
        factor = drinkScaleFactor;
        break;
      case 'tableware_disposables':
      case 'essentials_emergency':
        factor = headcountScale;
        break;
      case 'decor_ambiance':
      case 'entertainment_games':
        // Decor & games do not strictly scale linearly with guest count (unless it's game packs)
        factor = 1.0;
        break;
      default:
        factor = headcountScale;
        break;
    }

    const calculatedQty = Math.max(1, Math.round(currentQty * factor));
    return {
      ...item,
      quantity: calculatedQty,
    };
  });

  const drinksPerPerson = Math.round(durationHours * (servingMode === 'generous' ? 1.5 : 1.25));
  const iceLbsTotal = Math.max(10, Math.round(newTotal * (venue === 'backyard_outdoor' ? 2.0 : 1.5) * modeMultiplier));

  return {
    updatedItems,
    oldTotalGuests: oldTotal,
    newTotalGuests: newTotal,
    explanation: `Quantities recalculated for ${newTotal} guests (${safeAdultsNew} Adults, ${safeTeensNew} Teens, ${safeKidsNew} Kids) in ${servingMode.replace('_', ' ')} mode.`,
    cateringRuleSummary: {
      drinksPerPerson,
      servingsPerPerson: servingMode === 'generous' ? 7 : servingMode === 'low_waste' ? 4 : 5,
      iceLbsTotal,
      tablewareBufferPercent: 25,
    },
  };
}

// -------------------------------------------------------------
// 1. SMART BUDGET OPTIMIZER SUGGESTIONS
// -------------------------------------------------------------
export function generateBudgetOptimizerSuggestions(
  items: ShoppingItem[],
  targetBudget: number
): BudgetOptimizationSuggestion[] {
  const suggestions: BudgetOptimizationSuggestion[] = [];
  const currentTotal = items.reduce((sum, item) => sum + (item.isAlreadyOwned ? 0 : item.estimatedPrice * (item.quantity || 1)), 0);
  const overage = Math.max(0, currentTotal - targetBudget);

  items.forEach((item) => {
    if (item.isAlreadyOwned) return;
    const qty = Number(item.quantity) || 1;
    const cost = item.estimatedPrice * qty;

    // 1. Store brand swap (e.g., Cymbal Choice 25-35% savings)
    if (item.cymbalBrandSwap && item.brandType !== 'cymbal_brand') {
      const newUnitCost = item.cymbalBrandSwap.price;
      const newCost = newUnitCost * qty;
      const savings = Math.max(0.5, cost - newCost);

      suggestions.push({
        id: `swap-store-${item.id}`,
        itemId: item.id,
        type: 'swap_store_brand',
        currentProduct: `${qty}x ${item.name}`,
        recommendedChange: `Swap to ${item.cymbalBrandSwap.brandName}`,
        currentCost: cost,
        newCost,
        estimatedSavings: savings,
        shortReason: 'Cymbal Choice private label offers identical culinary quality at 25-30% lower cost.',
        selected: true,
        appliedPayload: {
          name: item.cymbalBrandSwap.brandName,
          estimatedPrice: newUnitCost,
          brandType: 'cymbal_brand',
          notes: `${item.notes ? item.notes + ' · ' : ''}(Swapped to Cymbal Choice store brand)`,
        },
      });
    } else if (item.brandType === 'national_brand' && !item.name.toLowerCase().includes('cymbal')) {
      const newUnitCost = Math.round(item.estimatedPrice * 0.72 * 100) / 100;
      const newCost = newUnitCost * qty;
      const savings = cost - newCost;

      if (savings >= 1.0) {
        suggestions.push({
          id: `swap-generic-${item.id}`,
          itemId: item.id,
          type: 'swap_store_brand',
          currentProduct: `${qty}x ${item.name}`,
          recommendedChange: `Swap to Cymbal Choice ${item.name.replace(/^(Brand|Kraft|Tostitos|Lipton|Coca-Cola)/i, '').trim()}`,
          currentCost: cost,
          newCost,
          estimatedSavings: savings,
          shortReason: 'Switch to Cymbal Choice store value line to immediately cut ingredient spend.',
          selected: true,
          appliedPayload: {
            name: `Cymbal Choice ${item.name.replace(/^(Brand|Kraft|Tostitos|Lipton|Coca-Cola)/i, '').trim()}`,
            estimatedPrice: newUnitCost,
            brandType: 'cymbal_brand',
            notes: `${item.notes ? item.notes + ' · ' : ''}(Swapped to Cymbal Choice store brand)`,
          },
        });
      }
    }

    // 2. Quantity reductions on high-volume non-essentials
    if (qty > 1 && item.priority !== 'must_have' && (item.category === 'food_sides_snacks' || item.category === 'desserts' || item.category === 'drinks_non_alcoholic')) {
      const reducedQty = Math.max(1, qty - 1);
      const newCost = item.estimatedPrice * reducedQty;
      const savings = cost - newCost;

      suggestions.push({
        id: `reduce-qty-${item.id}`,
        itemId: item.id,
        type: 'reduce_qty',
        currentProduct: `${qty}x ${item.name}`,
        recommendedChange: `Reduce from ${qty} to ${reducedQty} packs`,
        currentCost: cost,
        newCost,
        estimatedSavings: savings,
        shortReason: 'Trimming buffer slightly on secondary snacks prevents surplus food waste while hitting budget.',
        selected: overage > 20,
        appliedPayload: {
          quantity: reducedQty,
          notes: `${item.notes ? item.notes + ' · ' : ''}(Portion optimized for budget)`,
        },
      });
    }

    // 3. Removal / Pantry marking of optional / nice-to-have items (never must-have)
    if (item.priority === 'optional' && (item.category === 'decor_ambiance' || item.category === 'entertainment_games' || item.category === 'food_sides_snacks')) {
      suggestions.push({
        id: `remove-opt-${item.id}`,
        itemId: item.id,
        type: 'remove_optional',
        currentProduct: `${qty}x ${item.name}`,
        recommendedChange: `Mark as already owned at home / DIY pantry`,
        currentCost: cost,
        newCost: 0,
        estimatedSavings: cost,
        shortReason: 'Non-essential optional item can be sourced from home or skipped to protect the core food budget.',
        selected: overage > 40,
        appliedPayload: {
          isAlreadyOwned: true,
          notes: 'Marked as owned at home to balance event budget',
        },
      });
    }
  });

  // Sort by highest savings first
  return suggestions.sort((a, b) => b.estimatedSavings - a.estimatedSavings);
}

// -------------------------------------------------------------
// 3. DIETARY PREFERENCE & ALLERGY INTELLIGENCE
// -------------------------------------------------------------
export function detectDietaryConflicts(
  items: ShoppingItem[],
  dietaryRestrictions: string[]
): DietaryConflict[] {
  const conflicts: DietaryConflict[] = [];
  if (!dietaryRestrictions || dietaryRestrictions.length === 0) return conflicts;

  const isVegetarian = dietaryRestrictions.some((d) => d.toLowerCase().includes('vegetarian'));
  const isVegan = dietaryRestrictions.some((d) => d.toLowerCase().includes('vegan'));
  const isGlutenFree = dietaryRestrictions.some((d) => d.toLowerCase().includes('gluten'));
  const isNutFree = dietaryRestrictions.some((d) => d.toLowerCase().includes('nut'));
  const isDairyFree = dietaryRestrictions.some((d) => d.toLowerCase().includes('dairy'));
  const isHalal = dietaryRestrictions.some((d) => d.toLowerCase().includes('halal'));
  const isKosher = dietaryRestrictions.some((d) => d.toLowerCase().includes('kosher'));
  const isAlcoholFree = dietaryRestrictions.some((d) => d.toLowerCase().includes('alcohol') || d.toLowerCase().includes('mocktail'));
  const isKeto = dietaryRestrictions.some((d) => d.toLowerCase().includes('keto') || d.toLowerCase().includes('low-sugar'));

  items.forEach((item) => {
    const nameLower = item.name.toLowerCase();
    const notesLower = (item.notes || '').toLowerCase();

    // Already marked as vegan/GF in notes
    if (notesLower.includes('plant-based') || notesLower.includes('vegan') || notesLower.includes('gluten-free')) {
      return;
    }

    // 1. Meat vs Vegetarian / Vegan / Halal / Kosher
    const isMeat = /beef|pork|bacon|chicken|prosciutto|turkey|steak|sausage|carnitas|pepperoni|burger patties/i.test(nameLower);
    const isPork = /pork|bacon|prosciutto|ham|pepperoni|sausage/i.test(nameLower);

    if ((isVegetarian || isVegan) && isMeat) {
      conflicts.push({
        id: `conflict-veg-${item.id}`,
        itemId: item.id,
        itemName: item.name,
        dietaryType: isVegan ? 'Vegan' : 'Vegetarian',
        conflictReason: `Contains animal meat (${item.name}), which is incompatible with vegetarian/vegan guests.`,
        suggestedReplacement: {
          name: isVegan ? 'Cymbal Plant-Based Protein Patties (4-ct)' : 'Cymbal Choice Portobello & Black Bean Burgers (6-ct)',
          estimatedPrice: 7.99,
          unit: 'pack',
          category: 'food_mains',
          aisle: 'Aisle 10 (Plant-Based Frozen)',
          brandType: 'cymbal_brand',
          reason: '100% plant-based certified burgers that grill wonderfully alongside regular burgers.',
        },
      });
    } else if (isHalal && isPork) {
      conflicts.push({
        id: `conflict-halal-${item.id}`,
        itemId: item.id,
        itemName: item.name,
        dietaryType: 'Halal',
        conflictReason: `Contains pork products (${item.name}), which violates Halal dietary guidelines.`,
        suggestedReplacement: {
          name: 'Cymbal Choice Halal Certified Beef/Chicken Strips',
          estimatedPrice: 8.49,
          unit: 'pack',
          category: 'food_mains',
          aisle: 'Meat Counter (Halal Section)',
          brandType: 'cymbal_brand',
          reason: 'Certified Halal beef & poultry prepared under strict supervision.',
        },
      });
    } else if (isKosher && isPork) {
      conflicts.push({
        id: `conflict-kosher-${item.id}`,
        itemId: item.id,
        itemName: item.name,
        dietaryType: 'Kosher',
        conflictReason: `Contains non-kosher pork products (${item.name}).`,
        suggestedReplacement: {
          name: 'Cymbal Choice Kosher Beef Franks & Patties',
          estimatedPrice: 7.99,
          unit: 'pack',
          category: 'food_mains',
          aisle: 'Deli / Kosher Counter',
          brandType: 'cymbal_brand',
          reason: 'Rabbinical OU-certified kosher beef cuts.',
        },
      });
    }

    // 2. Gluten
    const isGluten = /wheat|brioche|buns|bread|baguette|pasta|flour tortillas|cookies|cupcakes|pretzels/i.test(nameLower) && !/gluten-free|gf/i.test(nameLower);
    if (isGlutenFree && isGluten) {
      conflicts.push({
        id: `conflict-gf-${item.id}`,
        itemId: item.id,
        itemName: item.name,
        dietaryType: 'Gluten-Free',
        conflictReason: `Contains conventional wheat flour/gluten (${item.name}).`,
        suggestedReplacement: {
          name: nameLower.includes('bun')
            ? 'Cymbal Organic Gluten-Free Artisan Buns (4-ct)'
            : nameLower.includes('tortilla')
            ? 'Cymbal Choice Yellow Corn Tortillas (GF Certified 30-ct)'
            : 'Cymbal Choice Gluten-Free Rice & Seed Crackers (10 oz)',
          estimatedPrice: 4.99,
          unit: 'pack',
          category: item.category,
          aisle: 'Aisle 5 (Gluten-Free Section)',
          brandType: 'cymbal_organic',
          reason: 'Certified Celiac-safe gluten-free baked alternative.',
        },
      });
    }

    // 3. Nuts
    const isNut = /peanut|almond|cashew|walnut|pecan|pistachio|trail mix|nutella/i.test(nameLower) && !/nut-free|seed/i.test(nameLower);
    if (isNutFree && isNut) {
      conflicts.push({
        id: `conflict-nut-${item.id}`,
        itemId: item.id,
        itemName: item.name,
        dietaryType: 'Nut-Free',
        conflictReason: `High-risk tree nut or peanut allergen present (${item.name}).`,
        suggestedReplacement: {
          name: 'Cymbal Choice Roasted Sunflower Seed Butter & Pretzels (Nut-Free Facility)',
          estimatedPrice: 4.29,
          unit: 'pack',
          category: item.category,
          aisle: 'Aisle 5 (Pantry)',
          brandType: 'cymbal_brand',
          reason: 'Produced in a dedicated 100% peanut and tree-nut free facility.',
        },
      });
    }

    // 4. Dairy
    const isDairy = /cheese|milk|butter|heavy cream|ice cream|queso|sour cream|yogurt/i.test(nameLower) && !/dairy-free|vegan|plant/i.test(nameLower);
    if ((isDairyFree || isVegan) && isDairy) {
      conflicts.push({
        id: `conflict-dairy-${item.id}`,
        itemId: item.id,
        itemName: item.name,
        dietaryType: isDairyFree ? 'Dairy-Free' : 'Vegan',
        conflictReason: `Contains dairy milk/cheese products (${item.name}).`,
        suggestedReplacement: {
          name: nameLower.includes('cheese') || nameLower.includes('queso')
            ? 'Cymbal Plant-Based Cheddar Slices & Dip (Dairy-Free)'
            : 'Cymbal Organic Oat Milk & Coconut Cream',
          estimatedPrice: 4.49,
          unit: 'pack',
          category: item.category,
          aisle: 'Aisle 2 (Dairy Alternative Cooler)',
          brandType: 'cymbal_organic',
          reason: 'Made with organic oat & coconut base, 100% lactose-free.',
        },
      });
    }

    // 5. Alcohol
    const isAlcohol = /beer|wine|vodka|prosecco|tequila|rum|champagne|whiskey|gin|cocktail/i.test(nameLower) && !/non-alcoholic|mocktail|sparkling cider|zero-proof/i.test(nameLower);
    if (isAlcoholFree && isAlcohol) {
      conflicts.push({
        id: `conflict-alc-${item.id}`,
        itemId: item.id,
        itemName: item.name,
        dietaryType: 'Alcohol-Free',
        conflictReason: `Contains alcoholic beverage (${item.name}) when an alcohol-free mocktail experience was requested.`,
        suggestedReplacement: {
          name: 'Cymbal Choice Sparkling Botanical Cider & Craft Zero-Proof Spritz 6-pack',
          estimatedPrice: 7.99,
          unit: '6-pack',
          category: 'drinks_non_alcoholic',
          aisle: 'Aisle 8 (Zero-Proof Beverages)',
          brandType: 'cymbal_brand',
          reason: 'Award-winning zero-proof sparkling beverage that feels upscale for all ages.',
        },
      });
    }

    // 6. Keto / Low-Sugar
    const isHighSugar = /soda|regular cola|sugar cake|candy|juice cocktail/i.test(nameLower) && !/zero sugar|diet|sugar-free|keto/i.test(nameLower);
    if (isKeto && isHighSugar) {
      conflicts.push({
        id: `conflict-keto-${item.id}`,
        itemId: item.id,
        itemName: item.name,
        dietaryType: 'Low-Sugar / Keto',
        conflictReason: `High refined sugars in (${item.name}), incompatible with low-carb/keto preferences.`,
        suggestedReplacement: {
          name: 'Cymbal Choice Zero-Sugar Flavored Seltzer Water 12-pack (0g Carb)',
          estimatedPrice: 4.29,
          unit: '12-pack',
          category: 'drinks_non_alcoholic',
          aisle: 'Aisle 9 (Seltzers & Water)',
          brandType: 'cymbal_brand',
          reason: 'Crisp refreshing 0 calorie, 0 sugar seltzer with natural fruit essences.',
        },
      });
    }
  });

  return conflicts;
}

// -------------------------------------------------------------
// 5. SMART LEFTOVER & WASTE CONTROL ESTIMATOR
// -------------------------------------------------------------
export interface WasteMetrics {
  servingMode: ServingMode;
  portionsDescription: string;
  leftoversEstimate: string;
  leftoversPercentRange: string;
  wasteWarningLevel?: 'good' | 'moderate' | 'excessive';
  warningMessage?: string;
  estimatedPortionsTotal: number;
}

export function calculateWasteMetrics(
  items: ShoppingItem[],
  guestCount: number,
  durationHours: number,
  servingMode: ServingMode = 'standard'
): WasteMetrics {
  const safeGuests = Math.max(1, Number(guestCount) || 1);
  let totalFoodUnits = 0;
  let totalDrinkUnits = 0;

  items.forEach((item) => {
    if (item.isAlreadyOwned) return;
    const qty = item.quantity || 1;
    if (item.category === 'food_mains' || item.category === 'food_sides_snacks') {
      totalFoodUnits += qty;
    } else if (item.category === 'drinks_cocktails' || item.category === 'drinks_non_alcoholic') {
      totalDrinkUnits += qty;
    }
  });

  const estimatedPortionsTotal = Math.round(totalFoodUnits * 4.5);
  const portionsPerGuest = Math.round((estimatedPortionsTotal / safeGuests) * 10) / 10;

  let leftoversEstimate = '10–15% (Ideal buffer for second helpings)';
  let leftoversPercentRange = '10-15%';
  let portionsDescription = 'Balanced portions designed for comfortable satisfaction with light next-day leftovers.';

  if (servingMode === 'low_waste') {
    leftoversEstimate = '0–5% (Near-zero food waste, exact headcount portioning)';
    leftoversPercentRange = '0-5%';
    portionsDescription = 'Lean, sustainable portioning minimizing cleanup and perishable surplus.';
  } else if (servingMode === 'generous') {
    leftoversEstimate = '25%+ (Hearty spread, abundant seconds & take-home doggy bags)';
    leftoversPercentRange = '25%+';
    portionsDescription = 'Abundant banquet portions ensuring no guest ever leaves hungry with generous take-home boxes.';
  }

  let wasteWarningLevel: 'good' | 'moderate' | 'excessive' = 'good';
  let warningMessage: string | undefined;

  if (portionsPerGuest > 4.5 && durationHours <= 3) {
    wasteWarningLevel = 'excessive';
    warningMessage = `High quantity warning: You have ~${portionsPerGuest} main/side servings per guest for a ${durationHours}-hour event. Consider switching to "Low Waste" mode to save budget.`;
  } else if (portionsPerGuest > 3.5) {
    wasteWarningLevel = 'moderate';
    warningMessage = `Generous portioning detected: ~${portionsPerGuest} servings per guest. Great if you plan to send leftovers home with guests.`;
  }

  return {
    servingMode,
    portionsDescription,
    leftoversEstimate,
    leftoversPercentRange,
    wasteWarningLevel,
    warningMessage,
    estimatedPortionsTotal,
  };
}

// -------------------------------------------------------------
// 8. AI MISSING ESSENTIALS CHECK
// -------------------------------------------------------------
export function checkMissingEssentials(
  plan: PartyPlan,
  items: ShoppingItem[] = plan.items
): MissingEssentialItem[] {
  const missing: MissingEssentialItem[] = [];
  const allNames = items.map((i) => i.name.toLowerCase()).join(' ');
  const allCategories = new Set(items.map((i) => i.category));

  const hasCake = /cake|cupcake|birthday dessert/i.test(allNames);
  const hasCandles = /candle|lighter|matches/i.test(allNames);
  if (hasCake && !hasCandles) {
    missing.push({
      id: 'missing-candles',
      name: 'Cymbal Celebration Birthday Candles (24-ct) & Utility Lighter',
      category: 'essentials_emergency',
      estimatedPrice: 3.49,
      unit: 'pack',
      aisle: 'Aisle 11 (Party Supplies)',
      reason: 'Birthday cake is in your cart, but no birthday candles or lighter are listed.',
      triggerReason: 'Birthday Cake Detected without Candles',
      priority: 'must_have',
    });
  }

  const hasDrinks = allCategories.has('drinks_cocktails') || allCategories.has('drinks_non_alcoholic') || /soda|beer|cider|juice|wine/i.test(allNames);
  const hasCups = /cup|tumbler|glassware/i.test(allNames);
  if (hasDrinks && !hasCups) {
    missing.push({
      id: 'missing-cups',
      name: 'Cymbal Choice Recyclable Party Cups 16 oz (50-count)',
      category: 'tableware_disposables',
      estimatedPrice: 4.99,
      unit: '50-pack',
      aisle: 'Aisle 11 (Tableware)',
      reason: 'You have beverages and drinks planned, but no disposable/recyclable cups.',
      triggerReason: 'Beverages in Cart without Cups',
      priority: 'must_have',
    });
  }

  const isOutdoor = plan.venue === 'backyard_outdoor' || plan.venue === 'park_picnic' || /bbq|cookout|outdoor|picnic|tailgate/i.test(plan.theme + ' ' + plan.eventType);
  const hasIce = /ice bag|party ice|chilled cooler/i.test(allNames) || allCategories.has('ice_chill');
  if (isOutdoor && !hasIce) {
    missing.push({
      id: 'missing-ice',
      name: 'Cymbal Depot Pure Crystal Party Ice Bags (20 lbs)',
      category: 'ice_chill',
      estimatedPrice: 5.99,
      unit: '20 lb bag',
      aisle: 'Freezer / Ice Depot',
      reason: 'Outdoor venues require active ice to chill coolers and cocktail dispensers.',
      triggerReason: 'Outdoor Venue without Ice Bags',
      priority: 'must_have',
    });
  }

  const hasFood = allCategories.has('food_mains') || allCategories.has('food_sides_snacks') || /burger|taco|pizza|appetizer/i.test(allNames);
  const hasPlates = /plate|platter|bowl/i.test(allNames);
  if (hasFood && !hasPlates) {
    missing.push({
      id: 'missing-plates',
      name: 'Cymbal Choice Compostable Heavy-Duty Dinner Plates (40-ct)',
      category: 'tableware_disposables',
      estimatedPrice: 5.49,
      unit: '40-pack',
      aisle: 'Aisle 11 (Tableware)',
      reason: 'Dinner mains and snacks require sturdy plates for guests to serve themselves.',
      triggerReason: 'Food in Cart without Plates',
      priority: 'must_have',
    });
  }

  const hasNapkins = /napkin|paper towel/i.test(allNames);
  if (hasFood && !hasNapkins) {
    missing.push({
      id: 'missing-napkins',
      name: 'Cymbal Choice 2-Ply Party Napkins (150-ct)',
      category: 'tableware_disposables',
      estimatedPrice: 3.29,
      unit: '150-pack',
      aisle: 'Aisle 11 (Tableware)',
      reason: 'Finger foods, appetizers, and BBQ meals need generous napkins for guests.',
      triggerReason: 'Food in Cart without Napkins',
      priority: 'must_have',
    });
  }

  const hasCutlery = /fork|spoon|knife|cutlery/i.test(allNames);
  if (hasFood && !hasCutlery && plan.mealType !== 'snacks_desserts') {
    missing.push({
      id: 'missing-cutlery',
      name: 'Cymbal Choice Assorted Heavy-Duty Cutlery Pack (48-ct Forks/Knives/Spoons)',
      category: 'tableware_disposables',
      estimatedPrice: 3.99,
      unit: '48-pack',
      aisle: 'Aisle 11 (Tableware)',
      reason: 'Main courses and side salads require forks, knives, and serving utensils.',
      triggerReason: 'Meal planned without Utensils',
      priority: 'must_have',
    });
  }

  const hasGrill = /burger|hot dog|skewer|bbq|grill/i.test(allNames);
  const hasCharcoalOrFuel = /charcoal|propane|lighter fluid|grill tongs/i.test(allNames);
  if (hasGrill && !hasCharcoalOrFuel && isOutdoor) {
    missing.push({
      id: 'missing-charcoal',
      name: 'Cymbal Choice All-Natural Hardwood Briquettes Charcoal (16 lbs)',
      category: 'essentials_emergency',
      estimatedPrice: 9.99,
      unit: '16 lb bag',
      aisle: 'Aisle 14 / Outdoor Living',
      reason: 'BBQ burger grilling planned, but charcoal fuel or grilling tongs are missing.',
      triggerReason: 'Grilling Food without Charcoal/Fuel',
      priority: 'nice_to_have',
    });
  }

  const hasTrashBags = /trash bag|garbage|cleanup|disinfecting wipes/i.test(allNames);
  if (!hasTrashBags) {
    missing.push({
      id: 'missing-trash-bags',
      name: 'Cymbal Choice Heavy-Duty Drawstring Outdoor Trash Bags (30-gallon, 25-ct)',
      category: 'essentials_emergency',
      estimatedPrice: 6.99,
      unit: '25-pack',
      aisle: 'Aisle 7 (Cleaning & Household)',
      reason: 'Essential for fast, painless post-event host cleanup and waste stations.',
      triggerReason: 'Cleanup Trash Bags Missing',
      priority: 'must_have',
    });
  }

  return missing;
}

// -------------------------------------------------------------
// 4. AI PARTY IDEAS GENERATOR
// -------------------------------------------------------------
export function generatePartyIdeas(plan: PartyPlan): PartyIdeaSuggestion[] {
  const isKids = (plan.guestBreakdown?.kids || 0) > (plan.guestBreakdown?.adults || 0);
  const isOutdoor = plan.venue === 'backyard_outdoor' || plan.venue === 'park_picnic';

  const suggestions: PartyIdeaSuggestion[] = [
    {
      id: 'idea-drink-punch',
      title: `${plan.theme} Batch Mocktail / Punch Bowl`,
      category: 'drinks',
      priorityGroup: 'must_have',
      description: `Craft an eye-catching self-serve drink dispenser featuring ${plan.signatureDrinkName || 'Signature Sparkler'} with sliced citrus wheels and fresh mint.`,
      estimatedCost: 14.50,
      budgetImpactPercent: Math.round((14.5 / plan.targetBudget) * 100),
      suggestedItem: {
        name: `Cymbal Batch Mixers & Fresh Fruit Garnish for ${plan.signatureDrinkName || 'Punch'}`,
        category: 'drinks_non_alcoholic',
        estimatedPrice: 14.50,
        quantity: 1,
        unit: 'kit',
        aisle: 'Aisle 8 & Produce',
        brandType: 'cymbal_brand',
        priority: 'must_have',
      },
    },
    {
      id: 'idea-custom-lighting',
      title: 'Warm Fairy String Lights & Citronella Torches',
      category: 'decorations',
      priorityGroup: 'recommended',
      description: isOutdoor
        ? 'Hang warm bistro string lights and place dual-action citronella candles to create cozy ambiance and deter insects.'
        : 'Warm battery LED tea lights & thematic table runner for soft, inviting evening lighting.',
      estimatedCost: 12.99,
      budgetImpactPercent: Math.round((12.99 / plan.targetBudget) * 100),
      suggestedItem: {
        name: isOutdoor ? 'Cymbal Outdoor Citronella & String Light Duo Pack' : 'Cymbal Warm LED Centerpiece Fairy Light Set',
        category: 'decor_ambiance',
        estimatedPrice: 12.99,
        quantity: 1,
        unit: 'set',
        aisle: 'Aisle 12 (Seasonal & Decor)',
        brandType: 'cymbal_brand',
        priority: 'nice_to_have',
      },
    },
    {
      id: 'idea-interactive-games',
      title: isKids ? 'Balloon Animals, Bubble Wands & Trivia Quest' : isOutdoor ? 'Cornhole & Giant Wooden Tumble Tower' : 'Pop Culture Trivia & Card Games',
      category: 'games',
      priorityGroup: 'recommended',
      description: isKids
        ? 'Keep children energized and laughing with colorful bubble wands, temporary tattoo packs, and prize games.'
        : 'Casual lawn and table games encourage guests to mingle and break the ice effortlessly.',
      estimatedCost: 16.99,
      budgetImpactPercent: Math.round((16.99 / plan.targetBudget) * 100),
      suggestedItem: {
        name: isKids ? 'Cymbal Kids Party Mega Fun Game & Bubble Kit' : 'Cymbal Lawn & Table Party Game Set',
        category: 'entertainment_games',
        estimatedPrice: 16.99,
        quantity: 1,
        unit: 'set',
        aisle: 'Aisle 14 (Toys & Games)',
        brandType: 'cymbal_brand',
        priority: 'optional',
      },
    },
    {
      id: 'idea-diy-dessert-bar',
      title: 'DIY S\'mores Bar or Artisan Bakery Cookie Tray',
      category: 'desserts',
      priorityGroup: 'must_have',
      description: 'An interactive dessert station lets guests customize their treats with chocolate drizzle, sprinkles, and toasted marshmallows.',
      estimatedCost: 11.49,
      budgetImpactPercent: Math.round((11.49 / plan.targetBudget) * 100),
      suggestedItem: {
        name: 'Cymbal Bakery Gourmet Cookie Platter (18-ct Assorted)',
        category: 'desserts',
        estimatedPrice: 11.49,
        quantity: 1,
        unit: 'platter',
        aisle: 'Aisle 3 (Bakery)',
        brandType: 'cymbal_brand',
        priority: 'must_have',
      },
    },
    {
      id: 'idea-soundtrack-ambiance',
      title: `Curated Playlist: ${plan.playlistVibe || 'Upbeat Soul & Indie Chill'}`,
      category: 'music_playlist',
      priorityGroup: 'nice_to_have',
      description: 'Stream a handpicked upbeat Spotify/Apple Music soundtrack perfectly timed to transition from cocktail mingling to dinner.',
      estimatedCost: 0.00,
      budgetImpactPercent: 0,
    },
    {
      id: 'idea-appetizer-upgrade',
      title: 'Gourmet Artisanal Dip & Warm Pretzel Bites Platter',
      category: 'food',
      priorityGroup: 'recommended',
      description: 'Elevate grazing with warm Cymbal Bakery soft pretzel nuggets and warm beer cheese dip.',
      estimatedCost: 9.99,
      budgetImpactPercent: Math.round((9.99 / plan.targetBudget) * 100),
      suggestedItem: {
        name: 'Cymbal Bakery Soft Pretzel Bites & Warm Queso Dip Kit',
        category: 'food_sides_snacks',
        estimatedPrice: 9.99,
        quantity: 1,
        unit: 'pack',
        aisle: 'Aisle 3 (Bakery)',
        brandType: 'cymbal_brand',
        priority: 'nice_to_have',
      },
    },
    {
      id: 'idea-host-cleanup-station',
      title: 'Pre-Packaged Take-Home Guest Boxes',
      category: 'optional_upgrades',
      priorityGroup: 'nice_to_have',
      description: 'Delight guests by providing cute takeout containers so they can take leftover BBQ, desserts, and snacks home.',
      estimatedCost: 5.99,
      budgetImpactPercent: Math.round((5.99 / plan.targetBudget) * 100),
      suggestedItem: {
        name: 'Cymbal Choice Eco Takeout Boxes with Lids (12-ct)',
        category: 'tableware_disposables',
        estimatedPrice: 5.99,
        quantity: 1,
        unit: '12-pack',
        aisle: 'Aisle 11 (Party Supplies)',
        brandType: 'cymbal_brand',
        priority: 'optional',
      },
    },
  ];

  return suggestions;
}

// -------------------------------------------------------------
// 10. EXPORT FORMATTERS (TEXT, CSV, MARKDOWN)
// -------------------------------------------------------------
export function generateTextShoppingList(plan: PartyPlan): string {
  const metrics = calculateBudgetMetrics(plan.items, plan.targetBudget, plan.guestCount);
  const country = plan.countryCode || 'IN';
  const currency = plan.currencyCode || 'INR';
  
  let text = `🛒 CYMBALMART PARTY SHOPPING CHECKLIST\n`;
  text += `═══════════════════════════════════════════════════════\n`;
  text += `Event: ${plan.title.toUpperCase()}\n`;
  text += `Theme: ${plan.theme} | Event Type: ${plan.eventType}\n`;
  text += `Region / Country: ${country} (${currency})\n`;
  text += `Date: ${plan.eventDate || 'Scheduled Soon'} | Duration: ${plan.durationHours} Hours\n`;
  text += `Guests: ${plan.guestCount} Total (${plan.guestBreakdown.adults} Adults · ${plan.guestBreakdown.teens} Teens · ${plan.guestBreakdown.kids} Kids)\n`;
  if (plan.guestDietaryBreakdown) {
    text += `Dietary Split: ${plan.guestDietaryBreakdown.pureVeg || 0} Veg · ${plan.guestDietaryBreakdown.nonVeg || 0} Non-Veg · ${plan.guestDietaryBreakdown.vegan || 0} Vegan\n`;
  }
  text += `Serving Mode: ${(plan.servingMode || 'standard').replace('_', ' ').toUpperCase()}\n`;
  text += `Target Budget: ${formatCurrency(plan.targetBudget, country, currency)} | Estimated Spend: ${formatCurrency(metrics.totalEstimatedCost, country, currency)} (${formatCurrency(metrics.costPerGuest, country, currency)}/guest)\n`;
  if (plan.storeLocation) {
    text += `Store Pickup/Delivery: ${plan.storeLocation}\n`;
  }
  if (plan.signatureDrinkName) {
    text += `🍹 Signature Drink: ${plan.signatureDrinkName}\n`;
  }
  if (plan.dietaryRestrictions && plan.dietaryRestrictions.length > 0) {
    text += `🌱 Dietary Requirements: ${plan.dietaryRestrictions.join(', ')}\n`;
  }
  text += `═══════════════════════════════════════════════════════\n\n`;

  // Group by aisle or category
  const aisles = Array.from(new Set(plan.items.map((i) => i.aisle || 'General Aisles')));

  aisles.forEach((aisle) => {
    const aisleItems = plan.items.filter((i) => (i.aisle || 'General Aisles') === aisle);
    if (aisleItems.length === 0) return;

    text += `📍 ${aisle.toUpperCase()}:\n`;
    aisleItems.forEach((item) => {
      const checkMark = item.isPurchased ? '[X]' : item.isAlreadyOwned ? '[PANTRY $0]' : item.isInCart ? '[IN CART]' : '[ ]';
      const priceTag = item.isAlreadyOwned ? ' ($0 - In Pantry)' : ` (~${formatCurrency(item.estimatedPrice * item.quantity, country, currency)})`;
      const brandTag = item.brandType === 'cymbal_brand' ? ' [Cymbal Choice]' : '';
      text += `  ${checkMark} ${item.quantity}x ${item.name} (${item.unit})${priceTag}${brandTag}\n`;
      if (item.notes) {
        text += `      Note: ${item.notes}\n`;
      }
    });
    text += `\n`;
  });

  text += `═══════════════════════════════════════════════════════\n`;
  text += `⏰ RUN-OF-SHOW PREPARATION TIMELINE:\n`;
  plan.prepTimeline.forEach((t) => {
    const timelineLabel = t.timeline.replace(/_/g, ' ').toUpperCase();
    const mark = t.isCompleted ? '✓' : '•';
    text += `${mark} [${timelineLabel}] ${t.task} (${t.category})\n`;
  });

  text += `\n💡 CYMBALMART HOST TIPS:\n`;
  plan.aiTips.forEach((tip, idx) => {
    text += `  ${idx + 1}. ${tip}\n`;
  });

  return text;
}

export function generateCsvShoppingList(plan: PartyPlan): string {
  const headers = ['Aisle', 'Category', 'Item Name', 'Quantity', 'Unit', 'Unit Price', 'Total Cost', 'Brand Type', 'Status', 'Notes'];
  const rows = plan.items.map((item) => {
    const status = item.isPurchased ? 'Purchased' : item.isAlreadyOwned ? 'Already Owned (Pantry)' : item.isInCart ? 'In Cart' : 'To Buy';
    const totalCost = item.isAlreadyOwned ? 0 : item.estimatedPrice * (item.quantity || 1);
    return [
      `"${item.aisle || 'Aisle'}"`,
      `"${item.category}"`,
      `"${item.name.replace(/"/g, '""')}"`,
      item.quantity || 1,
      `"${item.unit || 'ea'}"`,
      item.estimatedPrice.toFixed(2),
      totalCost.toFixed(2),
      `"${item.brandType || 'national_brand'}"`,
      `"${status}"`,
      `"${(item.notes || '').replace(/"/g, '""')}"`,
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

