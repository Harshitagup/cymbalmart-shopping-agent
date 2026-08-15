import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy initialize GenAI client
let aiClient: GoogleGenAI | null = null;
function getAi(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// API Health
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    brand: 'CymbalMart Party Planner Shopping Agent',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// Endpoint: Generate Full Party Plan & Shopping List for CymbalMart
app.post('/api/party/plan', async (req, res) => {
  try {
    const input = req.body;
    const ai = getAi();

    const totalGuests =
      (Number(input.guestBreakdown?.adults) || 0) +
      (Number(input.guestBreakdown?.kids) || 0) +
      (Number(input.guestBreakdown?.teens) || 0) || 12;

    const duration = Number(input.durationHours) || 3;
    const budget = Number(input.targetBudget) || 250;
    const theme = input.theme || 'Casual Celebration';
    const eventType = input.eventType || 'Birthday Party';
    const mealType = input.mealType || 'heavy_appetizers';
    const venue = input.venue || 'indoor_home';
    const dietary = Array.isArray(input.dietaryRestrictions) && input.dietaryRestrictions.length > 0
      ? input.dietaryRestrictions.join(', ')
      : 'None';
    const customNotes = input.customNotes || '';
    const storeLocation = input.preferredStores?.[0] || 'CymbalMart Supercenter #1042 - Sunnyvale';

    // Standard catering golden rule calculations
    const iceLbs = Math.max(10, Math.round(totalGuests * (venue === 'backyard_outdoor' ? 2 : 1.5)));
    const drinksPerPerson = Math.round(duration * 1.25);
    const totalDrinks = totalGuests * drinksPerPerson;
    const servingsPerPerson = mealType === 'full_meal' ? 1.5 : mealType === 'heavy_appetizers' ? 6 : 3;

    if (!ai) {
      // Return smart calculated fallback plan with CymbalMart products
      return res.json(createAlgorithmicPlan(input, totalGuests, duration, budget, iceLbs, drinksPerPerson, servingsPerPerson));
    }

    const prompt = `You are the official CymbalMart AI Party Planner & Catering Shopping Expert.
Your goal is to convert the busy host's event intent into a curated, budget-conscious CymbalMart grocery and party shopping list.

EVENT DETAILS:
- Event Type: ${eventType}
- Theme & Vibe: ${theme}
- Total Guests: ${totalGuests} (Adults: ${input.guestBreakdown?.adults || totalGuests}, Teens: ${input.guestBreakdown?.teens || 0}, Kids: ${input.guestBreakdown?.kids || 0})
- Duration: ${duration} hours
- Venue: ${venue}
- Meal Type: ${mealType}
- Dietary Restrictions: ${dietary}
- Custom Dietary/Host Notes: ${input.customDietaryNotes || 'None'}
- Target Budget: $${budget} USD
- Store: ${storeLocation}
- Specific Host Requirements: ${customNotes}

CATERING GOLDEN RULES & CYMBALMART MAPPING:
1. Drinks: ~${drinksPerPerson} drinks per person for ${duration} hrs (total ~${totalDrinks} drinks, mix of mocktails/soda/seltzer/beer/wine).
2. Ice: ~${iceLbs} lbs minimum for chilling and drink serving (Freezer / Ice Depot).
3. Food: Ensure accurate portioning for ${totalGuests} guests with ${mealType}. Strictly account for dietary restrictions (${dietary}).
4. Tableware: 1.2x to 1.5x guest count buffer for plates, napkins, cutlery, and cups (Aisle 11).
5. CymbalMart Brands: Offer mix of national brands and "Cymbal Choice" / "Cymbal Great Value" / "Cymbal Organic" store brand alternatives that save 20-30%.
6. Target Budget: Sum of estimated prices for must_have + nice_to_have items MUST align closely with $${budget} (staying within +/- 10% of budget).
7. Aisles: Assign realistic CymbalMart aisles (e.g., Aisle 1 Produce, Aisle 3 Bakery & Deli, Aisle 5 Pantry, Aisle 8 Beverages, Aisle 11 Tableware & Party, Meat Counter, Ice Depot).

Return strict JSON with this schema:
{
  "themeDescription": "Vibrant 2-sentence summary of the party vibe and setup aesthetic",
  "signatureDrinkName": "Catchy signature drink or mocktail tailored to theme",
  "signatureDrinkRecipe": "Short recipe instructions (ingredients + mix steps)",
  "playlistVibe": "e.g. Upbeat 90s Throwbacks, Tropical Chill House, Indie Pop",
  "aiTips": ["3-4 pro host tips for seamless execution, savings, or prep"],
  "items": [
    {
      "name": "Item name with pack size (e.g. Cymbal Choice Beef Burger Patties 12-ct)",
      "category": "one of: food_mains | food_sides_snacks | desserts | drinks_cocktails | drinks_non_alcoholic | ice_chill | tableware_disposables | decor_ambiance | entertainment_games | essentials_emergency",
      "quantity": 1,
      "unit": "e.g. 24-can pack, 5 lb bag, 50-count, bottles, kit",
      "estimatedPrice": 12.50,
      "aisle": "e.g. Aisle 3 (Bakery), Aisle 1 (Produce), Aisle 8 (Beverages), Aisle 11 (Party Supplies)",
      "brandType": "cymbal_brand | national_brand | cymbal_organic",
      "notes": "Purpose, portioning explanation or dietary tag (e.g., GF/Vegan)",
      "alternativeOrBulkTip": "Smart budget tip or store brand swap",
      "priority": "must_have | nice_to_have | optional"
    }
  ],
  "prepTimeline": [
    {
      "timeline": "3_days_before | 1_day_before | day_of_morning | 1_hour_before | during_party",
      "task": "Actionable prep milestone task",
      "category": "Shopping | Prep | Decor | Ambiance | Host"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            themeDescription: { type: Type.STRING },
            signatureDrinkName: { type: Type.STRING },
            signatureDrinkRecipe: { type: Type.STRING },
            playlistVibe: { type: Type.STRING },
            aiTips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  category: { type: Type.STRING },
                  quantity: { type: Type.NUMBER },
                  unit: { type: Type.STRING },
                  estimatedPrice: { type: Type.NUMBER },
                  aisle: { type: Type.STRING },
                  brandType: { type: Type.STRING },
                  notes: { type: Type.STRING },
                  alternativeOrBulkTip: { type: Type.STRING },
                  priority: { type: Type.STRING },
                },
                required: ['name', 'category', 'quantity', 'unit', 'estimatedPrice', 'priority'],
              },
            },
            prepTimeline: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  timeline: { type: Type.STRING },
                  task: { type: Type.STRING },
                  category: { type: Type.STRING },
                },
                required: ['timeline', 'task', 'category'],
              },
            },
          },
          required: ['themeDescription', 'items', 'prepTimeline'],
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');

    const planId = 'cymbal-party-' + Date.now();
    const finalPlan = {
      id: planId,
      createdAt: new Date().toISOString(),
      title: input.title || `${theme} ${eventType}`,
      theme,
      eventType,
      guestCount: totalGuests,
      guestBreakdown: input.guestBreakdown || { adults: totalGuests, kids: 0, teens: 0 },
      durationHours: duration,
      mealType,
      venue,
      targetBudget: budget,
      dietaryRestrictions: input.dietaryRestrictions || [],
      themeDescription: parsed.themeDescription || `A curated CymbalMart party plan for ${totalGuests} guests.`,
      signatureDrinkName: parsed.signatureDrinkName || 'Cymbal Citrus Sparkler',
      signatureDrinkRecipe: parsed.signatureDrinkRecipe || 'Mix fresh citrus juices, sparkling cider, and mint over crushed ice.',
      playlistVibe: parsed.playlistVibe || 'Uptown Soul & Feel-Good Pop',
      storeLocation,
      fulfillmentType: input.fulfillmentPreference || 'curbside_pickup',
      aiTips: parsed.aiTips || [
        'Place order 24 hours in advance for priority CymbalMart Curbside loading.',
        'Chill drinks 4 hours before guests arrive.',
        'Set up a separate trash & recycling station near the drink table.',
      ],
      items: (parsed.items || []).map((item: any, idx: number) => {
        const isCymbalBrand = item.brandType === 'cymbal_brand' || item.name.toLowerCase().includes('cymbal');
        return {
          id: `item-${planId}-${idx}`,
          name: item.name,
          category: sanitizeCategory(item.category),
          quantity: Number(item.quantity) || 1,
          unit: item.unit || 'pack',
          estimatedPrice: Number(item.estimatedPrice) || 5,
          targetStore: 'CymbalMart',
          aisle: item.aisle || getDefaultAisle(item.category),
          brandType: isCymbalBrand ? 'cymbal_brand' : 'national_brand',
          cymbalBrandSwap: !isCymbalBrand ? {
            brandName: `Cymbal Choice ${item.name.replace(/^(Brand|Kraft|Tostitos|Lipton|Coca-Cola)/i, '').trim()}`,
            price: Math.max(1.5, Math.round((Number(item.estimatedPrice) || 5) * 0.75 * 100) / 100),
            savings: Math.round((Number(item.estimatedPrice) || 5) * 0.25 * 100) / 100,
          } : undefined,
          notes: item.notes || '',
          alternativeOrBulkTip: item.alternativeOrBulkTip || '',
          priority: item.priority === 'nice_to_have' || item.priority === 'optional' ? item.priority : 'must_have',
          isAlreadyOwned: false,
          isPurchased: false,
        };
      }),
      prepTimeline: (parsed.prepTimeline || []).map((t: any, idx: number) => ({
        id: `task-${planId}-${idx}`,
        timeline: t.timeline || '1_day_before',
        task: t.task,
        category: t.category || 'Prep',
        isCompleted: false,
      })),
      cateringRuleSummary: {
        drinksPerPerson,
        servingsPerPerson,
        iceLbsTotal: iceLbs,
        tablewareBufferPercent: 25,
      },
    };

    res.json(finalPlan);
  } catch (error: any) {
    console.error('Error generating CymbalMart party plan:', error);
    const input = req.body;
    const totalGuests = (Number(input.guestBreakdown?.adults) || 0) + (Number(input.guestBreakdown?.kids) || 0) + (Number(input.guestBreakdown?.teens) || 0) || 12;
    const duration = Number(input.durationHours) || 3;
    const budget = Number(input.targetBudget) || 250;
    res.json(createAlgorithmicPlan(input, totalGuests, duration, budget, 20, 4, 4));
  }
});

// Endpoint: Dedicated CymbalMart Assistant Customer Chatbot
app.post('/api/assistant/chat', async (req, res) => {
  try {
    const { message, chatHistory = [], currentPlan } = req.body;
    const ai = getAi();

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'A valid message string is required.' });
    }

    if (!ai) {
      // Return smart algorithmic response based on CymbalMart store knowledge
      const fallback = createAssistantFallbackResponse(message, currentPlan);
      return res.json(fallback);
    }

    const planContext = currentPlan
      ? `
CURRENT CUSTOMER EVENT & CART CONTEXT:
- Active Event: ${currentPlan.title} (${currentPlan.eventType || 'Event'})
- Theme: ${currentPlan.theme || 'Party'}
- Guests: ${currentPlan.guestCount || 12}
- Target Budget: $${currentPlan.targetBudget || 250}
- Current Cart Items (${currentPlan.items?.length || 0} items):
${JSON.stringify((currentPlan.items || []).slice(0, 20).map((i: any) => ({
  id: i.id,
  name: i.name,
  category: i.category,
  price: i.estimatedPrice,
  quantity: i.quantity,
  aisle: i.aisle,
  brandType: i.brandType,
  isAlreadyOwned: i.isAlreadyOwned,
})))}`
      : 'No active party plan loaded yet.';

    const systemPrompt = `You are "CymbalMart Assistant", the friendly, knowledgeable, and customer-first AI chatbot for CymbalMart Supercenters and CymbalMart.com.

CYMBALMART STORE & POLICY KNOWLEDGE BASE:
- Store Hours: Everyday 6:00 AM - 11:00 PM. Pharmacy: 8:00 AM - 8:00 PM Mon-Fri, 9:00 AM - 6:00 PM Sat-Sun.
- Curbside Pickup: Free on orders $35+ (otherwise $4.99). Ready within 2 hours or scheduled at pickup bays 1-10.
- Express Delivery: 2-hour chilled refrigerated delivery straight to customer venue/doorstep ($4.99 flat or FREE with Cymbal Club+).
- Return Policy: 90-day hassle-free returns with receipt or digital order ID. 100% Freshness Guarantee on all Produce, Bakery, Meat, and Seafood (free instant refund/replacement).
- Price Match Guarantee: CymbalMart will match any local competitor's verified advertised retail price on identical brand items.
- Store Brands (20-30% savings): "Cymbal Choice" (top-tier quality value), "Cymbal Great Value" (bulk pantry essentials), "Cymbal Organic" (USDA Certified Organic).
- Cymbal Club: Free loyalty membership with 5% cashback on store brands and weekly personalized digital coupons.
- Aisle Layout Guide:
  * Aisle 1: Fresh Produce & Floral
  * Aisle 2: Dairy, Milk, Eggs & Cheese
  * Aisle 3: Artisan Bakery & Fresh Deli
  * Aisle 4: Breakfast, Cereal & Coffee
  * Aisle 5: Pantry, Chips, Crackers & Dips
  * Aisle 6: Canned Goods, Soups & Condiments
  * Aisle 7: Cleaning Essentials & Paper Goods
  * Aisle 8: Beverages, Mixers & Craft Spirits
  * Aisle 9: Seltzers, Sodas & Juices
  * Aisle 10: Frozen Entrees & Ice Cream
  * Aisle 11: Tableware, Cups, Plates & Party Supplies
  * Aisle 12: Seasonal Decor & Party Balloons
  * Aisle 13: Personal Care, First Aid & Sunscreen
  * Aisle 14: Games, Electronics & Batteries
  * Meat & Seafood Counter: Fresh butcher cuts & burger patties
  * Ice Depot / Freezer Cooler: 10 lb and 20 lb cocktail/party ice bags

CATERING GOLDEN RULES:
- Ice: 1.5 lbs per guest indoors, 2.0 lbs per guest outdoors/summer.
- Drinks: 1.25 drinks per person per hour of event.
- Food: 3-5 appetizer bites/person for casual cocktail events; 1.5 servings for full meal.
- Tableware: 1.3x guest count buffer for extra plates and napkins.

${planContext}

RECENT CHAT HISTORY:
${JSON.stringify(chatHistory.slice(-4))}

CUSTOMER QUERY: "${message}"

INSTRUCTIONS:
1. Speak in a warm, helpful, polished customer service voice as "CymbalMart Assistant".
2. Address the customer's question directly with clear facts, prices, aisle numbers, and practical tips.
3. If the user asks to modify or optimize their active shopping list (e.g. cut costs, make gluten-free, swap to store brands, add ice or drinks), return the updated items list and a summary of applied actions.
4. If the user asks for new item recommendations (e.g. recommend mocktails or dips), you can include "suggestedItems" that they can 1-click add to cart.
5. Provide 2-3 short, relevant "suggestedPrompts" the customer might want to click next.

Return strictly JSON format with this schema:
{
  "reply": "Helpful, clear markdown response from CymbalMart Assistant",
  "intentCategory": "store_policy | catering_math | product_search | savings_deal | general | cart_update",
  "appliedActions": ["Action 1 taken (if cart modified)"],
  "suggestedPrompts": ["Next prompt suggestion 1", "Next prompt suggestion 2"],
  "updatedItems": [ /* if cart was updated, array of ShoppingItems matching existing schema */ ],
  "suggestedItems": [
    {
      "name": "Item name with size",
      "category": "food_sides_snacks",
      "quantity": 1,
      "unit": "pack",
      "estimatedPrice": 4.99,
      "aisle": "Aisle 5",
      "brandType": "cymbal_brand",
      "notes": "Description",
      "priority": "nice_to_have"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: systemPrompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');

    // Attach stable IDs if new items or updated items are returned
    let updatedItems = parsed.updatedItems;
    if (updatedItems && Array.isArray(updatedItems)) {
      updatedItems = updatedItems.map((item: any, idx: number) => ({
        ...item,
        id: item.id || `item-chat-${Date.now()}-${idx}`,
        category: sanitizeCategory(item.category),
        estimatedPrice: Number(item.estimatedPrice) || 4.99,
        quantity: Number(item.quantity) || 1,
      }));
    }

    let suggestedItems = parsed.suggestedItems;
    if (suggestedItems && Array.isArray(suggestedItems)) {
      suggestedItems = suggestedItems.map((item: any, idx: number) => ({
        ...item,
        id: `sug-${Date.now()}-${idx}`,
        category: sanitizeCategory(item.category),
        estimatedPrice: Number(item.estimatedPrice) || 4.99,
        quantity: Number(item.quantity) || 1,
        isAlreadyOwned: false,
        isPurchased: false,
      }));
    }

    res.json({
      reply: parsed.reply || "I'm here to help with all your CymbalMart shopping, catering formulas, and store inquiries!",
      intentCategory: parsed.intentCategory || 'general',
      appliedActions: parsed.appliedActions || [],
      suggestedPrompts: parsed.suggestedPrompts || [
        'How much ice and drinks do I need for my event?',
        'Where are party supplies located in store?',
        'What is CymbalMart curbside pickup policy?'
      ],
      updatedItems: updatedItems || (currentPlan ? currentPlan.items : undefined),
      suggestedItems: suggestedItems || [],
    });
  } catch (error: any) {
    console.error('Error in CymbalMart Assistant chat:', error);
    const fallback = createAssistantFallbackResponse(req.body.message, req.body.currentPlan);
    res.json(fallback);
  }
});

// Helper for Assistant Fallback
function createAssistantFallbackResponse(message: string, currentPlan?: any) {
  const query = (message || '').toLowerCase();
  
  if (query.includes('hour') || query.includes('open') || query.includes('close') || query.includes('time')) {
    return {
      reply: `**CymbalMart Supercenter Operating Hours:**\n\n• **Main Store:** Mon–Sun: 6:00 AM – 11:00 PM\n• **Curbside Pickup Bay:** 7:00 AM – 9:00 PM daily\n• **Pharmacy:** Mon–Fri: 8:00 AM – 8:00 PM | Sat–Sun: 9:00 AM – 6:00 PM\n• **Bakery & Deli Counters:** 7:00 AM – 8:00 PM`,
      intentCategory: 'store_policy',
      suggestedPrompts: [
        'How does Curbside Pickup work?',
        'What is your return policy?',
        'Find items by aisle in CymbalMart'
      ]
    };
  }

  if (query.includes('pickup') || query.includes('curbside') || query.includes('delivery')) {
    return {
      reply: `**CymbalMart Pickup & Express Delivery Policies:**\n\n• **Curbside Pickup:** **FREE** on all orders over $35 ($4.99 for smaller orders). Pull into Bays 1–10 and check in on your phone—our team loads your trunk in under 5 minutes.\n• **Express 2-Hr Delivery:** Refrigerated door-to-door delivery within 2 hours ($4.99 flat or **FREE** for Cymbal Club members).\n• **Order Deadline:** Schedule anytime up to 1 hour before your desired time slot.`,
      intentCategory: 'store_policy',
      suggestedPrompts: [
        'What are the store hours?',
        'How does the 100% Freshness Guarantee work?',
        'Help me cut costs on my cart'
      ]
    };
  }

  if (query.includes('return') || query.includes('refund') || query.includes('price match') || query.includes('policy')) {
    return {
      reply: `**CymbalMart Customer Care Guarantees:**\n\n• **90-Day Returns:** Full refund with paper receipt or digital order QR code.\n• **100% Freshness Guarantee:** If any produce, meat, or bakery item doesn't meet your highest standards, bring it back or tap "Request Refund" in the app for an instant 100% money-back credit.\n• **Price Match Guarantee:** We happily match any local competitor's current advertised price on identical brand items at the register or online checkout!`,
      intentCategory: 'store_policy',
      suggestedPrompts: [
        'Tell me about Cymbal Choice store brands',
        'How much ice do I need for my guests?',
        'Where are party supplies located?'
      ]
    };
  }

  if (query.includes('ice') || query.includes('drink') || query.includes('portion') || query.includes('math') || query.includes('catering')) {
    const guests = currentPlan?.guestCount || 15;
    const duration = currentPlan?.durationHours || 3;
    const iceLbs = Math.round(guests * 1.5);
    const drinks = Math.round(guests * duration * 1.25);
    return {
      reply: `**CymbalMart Catering Portions Formula for ${guests} Guests (${duration} Hours):**\n\n• **Ice (Freezer Depot):** **~${iceLbs} lbs** (1.5 lbs/guest for indoor chilling and cocktail service; 2 lbs/guest for outdoor backyards).\n• **Beverages (Aisle 8 & 9):** **~${drinks} total drinks** (~1.25 drinks per person per hour; recommended 50% sparkling waters/sodas, 30% beer/wine/mocktails, 20% juices).\n• **Appetizers & Mains:** 4–6 bites per guest for heavy apps, or 1.5 burger sliders/guest.\n• **Tableware (Aisle 11):** ${Math.ceil(guests * 1.3)} plates and cups (1.3× buffer).`,
      intentCategory: 'catering_math',
      suggestedPrompts: [
        'Swap items to Cymbal Choice brand to save money',
        'Recommend gluten-free party snacks',
        'What are curbside pickup hours?'
      ]
    };
  }

  if (query.includes('gluten') || query.includes('vegan') || query.includes('allergy') || query.includes('dietary')) {
    return {
      reply: `**CymbalMart Dietary & Allergen Recommendations:**\n\n• **Gluten-Free Snacks:** *Cymbal Choice Organic Corn Tortilla Chips* (Aisle 5), *Cymbal Fresh Artisan Guacamole & Salsa* (Aisle 1), *Gluten-Free Cracker Assortment* (Aisle 5).\n• **Vegan & Dairy-Free:** *Cymbal Organic Hummus & Veggie Platter* (Aisle 1), *Oat Milk Dairy-Free Dips* (Aisle 2), *Plant-Based Slider Patties* (Meat Counter / Vegan Section).\n• **Nut-Free Guarantee:** Check our green "Cymbal Safe Snack" certified badges on Aisle 5 snack packs.`,
      intentCategory: 'product_search',
      suggestedPrompts: [
        'Calculate drinks and ice for my party',
        'How do I get free Curbside Pickup?',
        'Swap to Cymbal Choice Store Brands'
      ]
    };
  }

  return {
    reply: `Hello! I'm **CymbalMart Assistant**, your dedicated retail & party shopping helper. I can assist you with:\n\n• **Store Policies & Hours:** Curbside pickup rules, 2-hr delivery, 90-day returns & price matching.\n• **Aisle Guide:** Finding any grocery, beverage, ice, or party supply in CymbalMart Supercenter.\n• **Catering Math:** Calculating exact ice, drink counts, appetizer portions, and tableware buffers.\n• **Budget Optimization:** Finding 20–30% savings with *Cymbal Choice* store brand alternatives.\n• **Shopping Cart Updates:** Directly adjusting or trimming items in your active party list.\n\nHow can I help make your CymbalMart experience seamless today?`,
    intentCategory: 'general',
    suggestedPrompts: [
      'What are your store & pickup hours?',
      'How much ice and drinks do I need?',
      'How does CymbalMart 100% Freshness Guarantee work?',
      'Find items by CymbalMart aisle'
    ]
  };
}

// Endpoint: AI Copilot Chat & Constraint Adjustment for CymbalMart
app.post('/api/party/chat', async (req, res) => {
  try {
    const { message, currentPlan, chatHistory } = req.body;
    const ai = getAi();

    if (!ai) {
      return res.json({
        reply: `I received your request: "${message}". In demo mode, your list is ready! Add your Gemini API key to unlock dynamic constraint balancing.`,
        updatedItems: currentPlan.items,
      });
    }

    const prompt = `You are the official CymbalMart AI Party Planner Shopping Assistant.
The busy host is requesting modifications, constraint adjustments, or budget optimizations for their party plan.

CURRENT EVENT CONTEXT:
- Title: ${currentPlan.title} (${currentPlan.theme})
- Guests: ${currentPlan.guestCount}
- Target Budget: $${currentPlan.targetBudget}
- Current Cart Total: $${currentPlan.items.reduce((acc: number, i: any) => acc + (i.isAlreadyOwned ? 0 : i.estimatedPrice * (i.quantity || 1)), 0).toFixed(2)}
- Dietary: ${currentPlan.dietaryRestrictions?.join(', ') || 'None'}
- Store: ${currentPlan.storeLocation || 'CymbalMart Supercenter'}

CURRENT SHOPPING ITEMS JSON:
${JSON.stringify(currentPlan.items.map((i: any) => ({
  id: i.id,
  name: i.name,
  category: i.category,
  quantity: i.quantity,
  unit: i.unit,
  estimatedPrice: i.estimatedPrice,
  aisle: i.aisle,
  priority: i.priority,
  brandType: i.brandType,
  isAlreadyOwned: i.isAlreadyOwned,
})))}

USER REQUEST: "${message}"

INSTRUCTIONS:
1. Provide a concise, friendly CymbalMart assistant response with specific advice and savings metrics.
2. If the user asks to adjust constraints (e.g. cut budget by $X, make items vegan/gluten-free, add items for more guests, swap to CymbalMart store brands, add ice/drinks), return the full modified item list with appropriate aisles and quantities.
3. Keep item IDs intact for existing items so React keys remain stable.
4. Align the total estimated cost strictly with the user's budget constraint.

Return strictly JSON format:
{
  "reply": "Friendly response highlighting changes made and host tips",
  "appliedActions": ["Summary of adjustment 1", "Summary of adjustment 2"],
  "updatedItems": [
    {
      "id": "item-id",
      "name": "Item name",
      "category": "food_mains | food_sides_snacks | desserts | drinks_cocktails | drinks_non_alcoholic | ice_chill | tableware_disposables | decor_ambiance | entertainment_games | essentials_emergency",
      "quantity": 1,
      "unit": "unit",
      "estimatedPrice": 10.0,
      "aisle": "Aisle info",
      "brandType": "cymbal_brand | national_brand | cymbal_organic",
      "priority": "must_have | nice_to_have | optional",
      "isAlreadyOwned": false,
      "isPurchased": false,
      "notes": "Notes"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    res.json({
      reply: parsed.reply || "I've reviewed your event specifications and aligned the CymbalMart shopping cart!",
      appliedActions: parsed.appliedActions || [],
      updatedItems: parsed.updatedItems && Array.isArray(parsed.updatedItems) ? parsed.updatedItems : currentPlan.items,
    });
  } catch (error: any) {
    console.error('Error handling CymbalMart party chat:', error);
    res.status(500).json({ error: error.message || 'Failed to process party chat' });
  }
});

// Helper: Sanitize Category
function sanitizeCategory(cat: string): string {
  const allowed = [
    'food_mains',
    'food_sides_snacks',
    'desserts',
    'drinks_cocktails',
    'drinks_non_alcoholic',
    'ice_chill',
    'tableware_disposables',
    'decor_ambiance',
    'entertainment_games',
    'essentials_emergency',
  ];
  return allowed.includes(cat) ? cat : 'food_sides_snacks';
}

function getDefaultAisle(cat: string): string {
  const map: Record<string, string> = {
    food_mains: 'Meat Counter / Deli',
    food_sides_snacks: 'Aisle 1 & 5 (Produce & Snacks)',
    desserts: 'Aisle 3 (Cymbal Bakery)',
    drinks_cocktails: 'Aisle 8 (Beverages & Mixers)',
    drinks_non_alcoholic: 'Aisle 9 (Seltzers & Sodas)',
    ice_chill: 'Freezer / Party Ice Depot',
    tableware_disposables: 'Aisle 11 (Party Supplies)',
    decor_ambiance: 'Aisle 12 (Seasonal & Decor)',
    entertainment_games: 'Aisle 14 (Games & Toys)',
    essentials_emergency: 'Aisle 7 (Household Essentials)',
  };
  return map[cat] || 'Aisle 5';
}

// Algorithmic Fallback Plan Generator for CymbalMart
function createAlgorithmicPlan(
  input: any,
  totalGuests: number,
  duration: number,
  budget: number,
  iceLbs: number,
  drinksPerPerson: number,
  servingsPerPerson: number
) {
  const planId = 'cymbal-party-' + Date.now();
  const theme = input.theme || 'Summer Celebration';
  const eventType = input.eventType || 'Party';
  const storeLocation = input.preferredStores?.[0] || 'CymbalMart Supercenter #1042 - Sunnyvale';

  const items = [
    {
      id: `item-${planId}-1`,
      name: 'Cymbal Choice Angus Beef & Plant-Based Sliders',
      category: 'food_mains',
      quantity: Math.ceil(totalGuests * 1.5),
      unit: 'servings',
      estimatedPrice: 3.75,
      targetStore: 'CymbalMart',
      aisle: 'Meat Counter / Deli',
      brandType: 'cymbal_brand',
      notes: `Main savory course portioned for ${totalGuests} guests over ${duration} hrs`,
      alternativeOrBulkTip: 'Cymbal Choice 16-pack slider bundle saves $6.00',
      priority: 'must_have',
      isAlreadyOwned: false,
      isPurchased: false,
    },
    {
      id: `item-${planId}-2`,
      name: 'Cymbal Fresh Artisan Dip & Tortilla Chips Platter',
      category: 'food_sides_snacks',
      quantity: Math.max(2, Math.ceil(totalGuests / 8)),
      unit: 'large party tubs',
      estimatedPrice: 11.50,
      targetStore: 'CymbalMart',
      aisle: 'Aisle 5 (Snacks & Dips)',
      brandType: 'cymbal_brand',
      notes: 'Fresh guacamole, roasted salsa & organic tortilla chips',
      alternativeOrBulkTip: 'Buy Cymbal Great Value 32oz tortilla chips',
      priority: 'must_have',
      isAlreadyOwned: false,
      isPurchased: false,
    },
    {
      id: `item-${planId}-3`,
      name: 'Cymbal Organic Veggie & Hummus Grazing Board',
      category: 'food_sides_snacks',
      quantity: Math.max(1, Math.ceil(totalGuests / 12)),
      unit: 'party platter',
      estimatedPrice: 14.50,
      targetStore: 'CymbalMart',
      aisle: 'Aisle 1 (Produce)',
      brandType: 'cymbal_organic',
      notes: 'Gluten-free & vegetarian friendly fresh snack board',
      alternativeOrBulkTip: 'DIY cutting whole carrots, cucumbers, and peppers saves 45%',
      priority: 'must_have',
      isAlreadyOwned: false,
      isPurchased: false,
    },
    {
      id: `item-${planId}-4`,
      name: 'Cymbal Bakery Celebration Cupcakes (24-ct)',
      category: 'desserts',
      quantity: Math.ceil(totalGuests / 16),
      unit: '24-count pack',
      estimatedPrice: 18.99,
      targetStore: 'CymbalMart',
      aisle: 'Aisle 3 (Bakery)',
      brandType: 'cymbal_brand',
      notes: 'Freshly baked vanilla & chocolate celebration cupcakes',
      alternativeOrBulkTip: 'Cymbal Bakery daily special package discount',
      priority: 'must_have',
      isAlreadyOwned: false,
      isPurchased: false,
    },
    {
      id: `item-${planId}-5`,
      name: 'Cymbal Choice Sparkling Water Variety (24-Pack)',
      category: 'drinks_non_alcoholic',
      quantity: Math.max(1, Math.ceil((totalGuests * 1.5) / 24)),
      unit: '24-can case',
      estimatedPrice: 8.99,
      targetStore: 'CymbalMart',
      aisle: 'Aisle 9 (Beverages)',
      brandType: 'cymbal_brand',
      notes: 'Lime, Grapefruit, and Berry zero-sugar sparkling seltzers',
      alternativeOrBulkTip: 'Cymbal Club member bundle saves $2.50 per case',
      priority: 'must_have',
      isAlreadyOwned: false,
      isPurchased: false,
    },
    {
      id: `item-${planId}-6`,
      name: 'Cymbal Signature Citrus Punch Mix & Garnishes',
      category: 'drinks_cocktails',
      quantity: 2,
      unit: 'bottles + fruit kit',
      estimatedPrice: 16.50,
      targetStore: 'CymbalMart',
      aisle: 'Aisle 8 (Mixers & Spirits)',
      brandType: 'cymbal_brand',
      notes: 'Batch punch mix: fruit juice, ginger ale, and fresh orange slices',
      alternativeOrBulkTip: 'Batch punch in a drink dispenser rather than single drinks',
      priority: 'nice_to_have',
      isAlreadyOwned: false,
      isPurchased: false,
    },
    {
      id: `item-${planId}-7`,
      name: 'Cymbal Cold Party Ice Bags (10 lb)',
      category: 'ice_chill',
      quantity: Math.max(2, Math.ceil(iceLbs / 10)),
      unit: '10 lb bags',
      estimatedPrice: 2.99,
      targetStore: 'CymbalMart',
      aisle: 'Freezer / Ice Depot',
      brandType: 'cymbal_brand',
      notes: `Calculated formula: ${iceLbs} lbs needed for drinks and coolers`,
      alternativeOrBulkTip: 'Pickup ice at checkout register ice locker',
      priority: 'must_have',
      isAlreadyOwned: false,
      isPurchased: false,
    },
    {
      id: `item-${planId}-8`,
      name: 'Cymbal Eco Compostable Plates & Cutlery Kit (50-ct)',
      category: 'tableware_disposables',
      quantity: 1,
      unit: '50-count pack',
      estimatedPrice: 12.50,
      targetStore: 'CymbalMart',
      aisle: 'Aisle 11 (Party Supplies)',
      brandType: 'cymbal_brand',
      notes: 'Eco-friendly sugarcane plates and bamboo napkins (1.3x guest buffer)',
      alternativeOrBulkTip: 'Cymbal Eco Party Bulk 100-pack saves 30%',
      priority: 'must_have',
      isAlreadyOwned: false,
      isPurchased: false,
    },
    {
      id: `item-${planId}-9`,
      name: 'Cymbal Celebration Balloon Garland & Banner Set',
      category: 'decor_ambiance',
      quantity: 1,
      unit: 'decor kit',
      estimatedPrice: 15.99,
      targetStore: 'CymbalMart',
      aisle: 'Aisle 12 (Seasonal Decor)',
      brandType: 'cymbal_brand',
      notes: `Coordinates with ${theme} theme aesthetic`,
      alternativeOrBulkTip: 'Reusable party bunting and LED string lights',
      priority: 'nice_to_have',
      isAlreadyOwned: false,
      isPurchased: false,
    },
    {
      id: `item-${planId}-10`,
      name: 'Cymbal Clean Heavy-Duty Drawstring Trash Bags',
      category: 'essentials_emergency',
      quantity: 1,
      unit: 'box (15 count)',
      estimatedPrice: 5.99,
      targetStore: 'CymbalMart',
      aisle: 'Aisle 7 (Household Cleaning)',
      brandType: 'cymbal_brand',
      notes: 'Quick cleanup and recycling station bags',
      alternativeOrBulkTip: 'Check home pantry first to mark as already owned ($0)',
      priority: 'must_have',
      isAlreadyOwned: false,
      isPurchased: false,
    }
  ];

  return {
    id: planId,
    createdAt: new Date().toISOString(),
    title: input.title || `${theme} ${eventType}`,
    theme,
    eventType,
    guestCount: totalGuests,
    guestBreakdown: input.guestBreakdown || { adults: totalGuests, kids: 0, teens: 0 },
    durationHours: duration,
    mealType: input.mealType || 'heavy_appetizers',
    venue: input.venue || 'indoor_home',
    targetBudget: budget,
    dietaryRestrictions: input.dietaryRestrictions || [],
    themeDescription: `A curated CymbalMart ${theme} celebration designed for ${totalGuests} guests with generous catering portions.`,
    signatureDrinkName: `${theme} Cymbal Sunset Punch`,
    signatureDrinkRecipe: 'Combine cranberry juice, ginger beer, fresh lime juice, and orange wheels over crushed ice.',
    playlistVibe: 'Uptown Soul & Feel-Good Pop',
    storeLocation,
    fulfillmentType: input.fulfillmentPreference || 'curbside_pickup',
    aiTips: [
      'Reserve your CymbalMart Curbside Pickup slot 24 hours prior to skip in-store lines.',
      'Pre-chill canned drinks in a cooler with ice and water 3 hours before guests arrive.',
      'Place napkins and cutlery at the end of the food table, not the start, to avoid spills.'
    ],
    items,
    prepTimeline: [
      { id: `task-1`, timeline: '3_days_before', task: 'Review CymbalMart order and confirm tableware and decor items.', category: 'Shopping', isCompleted: false },
      { id: `task-2`, timeline: '1_day_before', task: 'Pick up or receive CymbalMart order; chill drinks in fridge and prep dips.', category: 'Prep', isCompleted: false },
      { id: `task-3`, timeline: 'day_of_morning', task: 'Pick up fresh ice bags and bakery items from CymbalMart.', category: 'Shopping', isCompleted: false },
      { id: `task-4`, timeline: '1_hour_before', task: 'Set playlist, fill drink dispensers with ice, and light ambiance candles.', category: 'Ambiance', isCompleted: false },
      { id: `task-5`, timeline: 'during_party', task: 'Empty recycling bin halfway through and refresh signature punch bowl.', category: 'Host', isCompleted: false },
    ],
    cateringRuleSummary: {
      drinksPerPerson,
      servingsPerPerson,
      iceLbsTotal: iceLbs,
      tablewareBufferPercent: 25,
    }
  };
}

// Start Server with Vite Middleware
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CymbalMart Party Planner Shopping Agent running on http://localhost:${PORT}`);
  });
}

startServer();
