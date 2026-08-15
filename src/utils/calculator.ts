import { PartyPlan, ShoppingItem } from '../types';

export interface BudgetMetrics {
  totalEstimatedCost: number; // excluding already owned
  purchasedCost: number;
  remainingCost: number;
  alreadyOwnedSavings: number;
  cymbalBrandSavings: number;
  costPerGuest: number;
  isOverBudget: boolean;
  variance: number; // positive = under budget, negative = over budget
  totalItemsCount: number;
  purchasedItemsCount: number;
  pantryItemsCount: number;
  categoryBreakdown: Record<string, number>;
}

export function calculateBudgetMetrics(items: ShoppingItem[], targetBudget: number, guestCount: number): BudgetMetrics {
  let totalEstimatedCost = 0;
  let purchasedCost = 0;
  let alreadyOwnedSavings = 0;
  let cymbalBrandSavings = 0;
  let purchasedItemsCount = 0;
  let pantryItemsCount = 0;
  const categoryBreakdown: Record<string, number> = {};

  items.forEach((item) => {
    const qty = Number(item.quantity) || 1;
    const price = Number(item.estimatedPrice) || 0;
    const itemTotal = qty * price;

    if (item.cymbalBrandSwap?.savings) {
      cymbalBrandSavings += item.cymbalBrandSwap.savings * qty;
    } else if (item.brandType === 'cymbal_brand') {
      cymbalBrandSavings += (item.estimatedPrice * 0.25) * qty;
    }

    if (item.isAlreadyOwned) {
      alreadyOwnedSavings += itemTotal;
      pantryItemsCount++;
    } else {
      totalEstimatedCost += itemTotal;
      categoryBreakdown[item.category] = (categoryBreakdown[item.category] || 0) + itemTotal;

      if (item.isPurchased) {
        purchasedCost += itemTotal;
        purchasedItemsCount++;
      }
    }
  });

  const remainingCost = Math.max(0, totalEstimatedCost - purchasedCost);
  const costPerGuest = guestCount > 0 ? totalEstimatedCost / guestCount : 0;
  const variance = targetBudget - totalEstimatedCost;
  const isOverBudget = totalEstimatedCost > targetBudget;

  return {
    totalEstimatedCost: Math.round(totalEstimatedCost * 100) / 100,
    purchasedCost: Math.round(purchasedCost * 100) / 100,
    remainingCost: Math.round(remainingCost * 100) / 100,
    alreadyOwnedSavings: Math.round(alreadyOwnedSavings * 100) / 100,
    cymbalBrandSavings: Math.round(cymbalBrandSavings * 100) / 100,
    costPerGuest: Math.round(costPerGuest * 100) / 100,
    isOverBudget,
    variance: Math.round(variance * 100) / 100,
    totalItemsCount: items.length,
    purchasedItemsCount,
    pantryItemsCount,
    categoryBreakdown,
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Generate formatted checklist text for clipboard / SMS / Notes
export function generateTextShoppingList(plan: PartyPlan): string {
  const metrics = calculateBudgetMetrics(plan.items, plan.targetBudget, plan.guestCount);
  
  let text = `🛒 CYMBALMART PARTY SHOPPING CHECKLIST\n`;
  text += `Event: ${plan.title.toUpperCase()}\n`;
  text += `Theme: ${plan.theme} | Guests: ${plan.guestCount} | Duration: ${plan.durationHours} hrs\n`;
  text += `Target Budget: ${formatCurrency(plan.targetBudget)} | Cart Total: ${formatCurrency(metrics.totalEstimatedCost)} (${formatCurrency(metrics.costPerGuest)}/guest)\n`;
  if (plan.storeLocation) {
    text += `Store: ${plan.storeLocation}\n`;
  }
  if (plan.signatureDrinkName) {
    text += `🍹 Signature Drink: ${plan.signatureDrinkName}\n`;
  }
  text += `\n═══════════════════════════════════════════\n\n`;

  // Group by category
  const categories = Array.from(new Set(plan.items.map((i) => i.category)));

  categories.forEach((cat) => {
    const catItems = plan.items.filter((i) => i.category === cat);
    if (catItems.length === 0) return;

    text += `📍 ${cat.replace(/_/g, ' ').toUpperCase()}:\n`;
    catItems.forEach((item) => {
      const checkMark = item.isPurchased ? '[x]' : item.isAlreadyOwned ? '[Pantry]' : '[ ]';
      const aisleTag = item.aisle ? ` [${item.aisle}]` : '';
      const priceTag = item.isAlreadyOwned ? ' ($0 - Owned in Pantry)' : ` (~${formatCurrency(item.estimatedPrice * item.quantity)})`;
      text += `  ${checkMark} ${item.quantity}x ${item.name} (${item.unit})${priceTag}${aisleTag}\n`;
      if (item.notes) {
        text += `      Note: ${item.notes}\n`;
      }
    });
    text += `\n`;
  });

  text += `═══════════════════════════════════════════\n`;
  text += `⏰ RUN-OF-SHOW PREP TIMELINE:\n`;
  plan.prepTimeline.forEach((t) => {
    const timelineLabel = t.timeline.replace(/_/g, ' ');
    text += `• [${timelineLabel}] ${t.task}\n`;
  });

  return text;
}
