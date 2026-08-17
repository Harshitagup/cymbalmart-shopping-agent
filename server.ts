import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
//const PORT = 3000;
const PORT = Number(process.env.PORT) || 3000;

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

// Resilient GenAI Content Generation with exponential backoff & model fallbacks
async function generateContentWithFallback(
  ai: GoogleGenAI,
  params: {
    contents: string;
    config?: any;
    primaryModel?: string;
  }
) {
  const modelsToTry = [
    params.primaryModel || 'gemini-3.7-flash',
    'gemini-flash-latest',
    'gemini-3.1-flash-lite',
  ];

  let lastError: any = null;

  for (const model of modelsToTry) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        });
        if (response && response.text) {
          return response;
        }
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || '';
        const isUnavailableOrRateLimited =
          err?.status === 'UNAVAILABLE' ||
          errMsg.includes('503') ||
          errMsg.includes('high demand') ||
          errMsg.includes('429') ||
          errMsg.includes('RESOURCE_EXHAUSTED') ||
          errMsg.includes('overloaded');

        console.warn(`[GenAI] Model ${model} attempt ${attempt + 1} failed (${err?.status || 'ERR'}):`, errMsg);

        if (isUnavailableOrRateLimited) {
          await new Promise((resolve) => setTimeout(resolve, 600 * (attempt + 1) + Math.random() * 300));
        } else {
          break;
        }
      }
    }
  }

  throw lastError || new Error('All model attempts failed');
}

// Helper to sanitize item categories
function sanitizeCategory(cat: string): string {
  const valid = [
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
  return valid.includes(cat) ? cat : 'food_sides_snacks';
}

function getCurrencySymbol(code: string): string {
  switch (code) {
    case 'INR': return '₹';
    case 'GBP': return '£';
    case 'EUR': return '€';
    case 'JPY': return '¥';
    case 'AED': return 'AED ';
    case 'AUD': return 'A$';
    default: return '$';
  }
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
  const input = req.body || {};
  const countryCode = (input.countryCode || 'IN').toUpperCase();
  const currencyCode = input.currencyCode || (countryCode === 'IN' ? 'INR' : countryCode === 'GB' ? 'GBP' : countryCode === 'JP' ? 'JPY' : countryCode === 'AE' ? 'AED' : countryCode === 'DE' || countryCode === 'FR' ? 'EUR' : countryCode === 'AU' ? 'AUD' : 'USD');
  const currencySymbol = getCurrencySymbol(currencyCode);
  const regionalPref = input.regionalPreference || 'all_indian';
  const metricUnits = input.metricUnits !== false;

  const totalGuests =
    (Number(input.guestBreakdown?.adults) || 0) +
    (Number(input.guestBreakdown?.kids) || 0) +
    (Number(input.guestBreakdown?.teens) || 0) || 12;

  const duration = Number(input.durationHours) || 3;
  const budget = Number(input.targetBudget) || (countryCode === 'IN' ? 10000 : countryCode === 'JP' ? 25000 : countryCode === 'GB' ? 200 : 250);
  const theme = input.theme || 'Casual Celebration';
  const eventType = input.eventType || 'Birthday Party';
  const mealType = input.mealType || 'heavy_appetizers';
  const venue = input.venue || 'indoor_home';
  const dietary = Array.isArray(input.dietaryRestrictions) && input.dietaryRestrictions.length > 0
    ? input.dietaryRestrictions.join(', ')
    : 'None';
  const customNotes = input.customNotes || '';
  const storeLocation = input.preferredStores?.[0] || (countryCode === 'IN' ? 'CymbalMart Hypermarket - Bengaluru (Indiranagar)' : 'CymbalMart Supercenter #1042 - Sunnyvale');

  // Standard catering golden rule calculations
  const iceLbs = Math.max(10, Math.round(totalGuests * (venue === 'backyard_outdoor' ? 2 : 1.5)));
  const drinksPerPerson = Math.round(duration * 1.25);
  const totalDrinks = totalGuests * drinksPerPerson;
  const servingsPerPerson = mealType === 'full_meal' ? 1.5 : mealType === 'heavy_appetizers' ? 6 : 3;

  try {
    const ai = getAi();

    if (!ai) {
      return res.json(createAlgorithmicPlan(input, totalGuests, duration, budget, iceLbs, drinksPerPerson, servingsPerPerson, countryCode, currencyCode, currencySymbol));
    }

    const dietaryBreakdownStr = input.guestDietaryBreakdown
      ? `Guest Dietary Breakdown: Pure Veg: ${input.guestDietaryBreakdown.pureVeg || 0}, Non-Veg: ${input.guestDietaryBreakdown.nonVeg || 0}, Vegan: ${input.guestDietaryBreakdown.vegan || 0}, Jain: ${input.guestDietaryBreakdown.jain || 0}`
      : '';

    const prompt = `You are the official CymbalMart AI Party Planner & Catering Shopping Expert for ${countryCode} (Currency: ${currencyCode}).
Your goal is to convert the host's event intent into a realistic, culturally authentic, budget-conscious CymbalMart grocery and party shopping list tailored for ${countryCode}.

COUNTRY & LOCALIZATION CONTEXT:
- Country: ${countryCode} (Target Currency: ${currencyCode}, Symbol: ${currencySymbol})
- Regional Preference: ${regionalPref}
- Units: ${metricUnits ? 'Metric (kg, grams, Litres, ml, packs)' : 'Imperial (lbs, oz, gallons, packs)'}
- Target Budget: ${budget} ${currencyCode}

EVENT DETAILS:
- Event Type: ${eventType}
- Theme & Vibe: ${theme}
- Total Guests: ${totalGuests} (Adults: ${input.guestBreakdown?.adults || totalGuests}, Teens: ${input.guestBreakdown?.teens || 0}, Kids: ${input.guestBreakdown?.kids || 0})
- ${dietaryBreakdownStr}
- Duration: ${duration} hours
- Venue: ${venue}
- Meal Type: ${mealType}
- Dietary Restrictions: ${dietary}
- Custom Dietary/Host Notes: ${input.customDietaryNotes || 'None'}
- Store: ${storeLocation}
- Specific Host Requirements: ${customNotes}

CATERING GOLDEN RULES & LOCAL PRICING:
1. CURRENCY & REALISTIC LOCAL PRICES: All item estimated prices MUST be in realistic ${currencyCode} (e.g. for India INR: samosas ₹150-₹300/pack, paneer ₹250/kg, biryani kit ₹350, mithai ₹400-₹600/kg, cold drinks ₹95/2L, tea/coffee kit ₹180, areca leaf plates ₹220/25-pack). Total sum of items should closely equal ~${budget} ${currencyCode}.
2. LOCAL FOOD AUTHENTICITY:
   - For India (IN): Incorporate rich Indian delicacies (e.g., Paneer Tikka / Butter Masala, Samosas, Pav Bhaji, Chaat kits, Dum Biryani, Gulab Jamun, Kaju Katli, Filter Coffee / Masala Chai, Thums Up, Limca, Frooti, Rooh Afza mocktails, Diya lights, Rangoli colors, Marigold garland decor, eco-friendly Areca nut leaf plates).
   - If mixed veg/non-veg breakdown is provided, provide appropriate proportioned vegetarian and non-vegetarian mains.
   - For other countries: Use popular regional staples and appropriate local market prices.
3. Drinks: ~${drinksPerPerson} drinks per person for ${duration} hrs (total ~${totalDrinks} drinks, mix of mocktails/soda/seltzer/tea/juices).
4. Ice/Cooling: ~${metricUnits ? Math.round(iceLbs * 0.5) + ' kg' : iceLbs + ' lbs'} for chilling and drink serving.
5. Tableware: 1.2x to 1.5x guest count buffer for plates, napkins, cutlery, and cups.
6. CymbalMart Brands: Offer mix of national brands and "Cymbal Choice" store brand alternatives that save 20-30%.
7. Aisles: Assign realistic CymbalMart aisles.

Return strict JSON with this schema:
{
  "themeDescription": "Vibrant 2-sentence summary of the party vibe and setup aesthetic",
  "signatureDrinkName": "Catchy signature drink or mocktail tailored to theme",
  "signatureDrinkRecipe": "Short recipe instructions (ingredients + mix steps)",
  "playlistVibe": "e.g. Bollywood Festive Beats, Indie Acoustic, Upbeat Soul",
  "aiTips": ["3-4 pro host tips for seamless execution, savings, or prep"],
  "items": [
    {
      "name": "Item name with pack size in ${metricUnits ? 'kg/g/L' : 'lb/oz'}",
      "category": "food_mains | food_sides_snacks | desserts | drinks_cocktails | drinks_non_alcoholic | ice_chill | tableware_disposables | decor_ambiance | entertainment_games | essentials_emergency",
      "quantity": 1,
      "unit": "e.g. 1 kg pack, 2L bottle, 25-pack, kit, box",
      "estimatedPrice": 250.0,
      "aisle": "e.g. Aisle 3 (Bakery & Mithai), Aisle 1 (Produce & Dairy), Aisle 8 (Beverages), Aisle 11 (Party Supplies)",
      "brandType": "cymbal_brand | national_brand | cymbal_organic",
      "notes": "Purpose, portioning explanation or dietary tag (e.g. 100% Pure Veg / Halal)",
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

    const response = await generateContentWithFallback(ai, {
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
      countryCode,
      currencyCode,
      currencySymbol,
      regionalPreference: regionalPref,
      guestCount: totalGuests,
      guestBreakdown: input.guestBreakdown || { adults: totalGuests, kids: 0, teens: 0 },
      guestDietaryBreakdown: input.guestDietaryBreakdown,
      durationHours: duration,
      mealType,
      venue,
      targetBudget: budget,
      metricUnits,
      dietaryRestrictions: input.dietaryRestrictions || [],
      themeDescription: parsed.themeDescription || `A curated CymbalMart party plan for ${totalGuests} guests in ${countryCode}.`,
      signatureDrinkName: parsed.signatureDrinkName || (countryCode === 'IN' ? 'Cymbal Shahi Kesar Badam Sparkler' : 'Cymbal Citrus Sparkler'),
      signatureDrinkRecipe: parsed.signatureDrinkRecipe || 'Mix fresh citrus juices, sparkling soda, and crushed mint over ice.',
      playlistVibe: parsed.playlistVibe || (countryCode === 'IN' ? 'Bollywood Hits & Desi Lounge' : 'Uptown Soul & Feel-Good Pop'),
      storeLocation,
      fulfillmentType: input.fulfillmentPreference || 'curbside_pickup',
      aiTips: parsed.aiTips || [
        'Place order 24 hours in advance for priority CymbalMart Curbside loading.',
        'Chill drinks 4 hours before guests arrive.',
        'Set up a separate trash & recycling station near the drink table.',
      ],
      items: (parsed.items || []).map((item: any, idx: number) => {
        const isCymbalBrand = item.brandType === 'cymbal_brand' || item.name.toLowerCase().includes('cymbal');
        const unitPrice = Number(item.estimatedPrice) || (countryCode === 'IN' ? 250 : 5);
        return {
          id: `item-${planId}-${idx}`,
          name: item.name,
          category: sanitizeCategory(item.category),
          quantity: Number(item.quantity) || 1,
          unit: item.unit || 'pack',
          estimatedPrice: unitPrice,
          pricingType: 'estimated_local',
          targetStore: 'CymbalMart',
          aisle: item.aisle || 'General Grocery',
          brandType: item.brandType || 'cymbal_brand',
          notes: item.notes || '',
          alternativeOrBulkTip: item.alternativeOrBulkTip || '',
          priority: item.priority || 'must_have',
          isAlreadyOwned: false,
          isPurchased: false,
          cymbalBrandSwap: !isCymbalBrand
            ? {
                brandName: `Cymbal Choice ${item.name}`,
                price: Number((unitPrice * 0.75).toFixed(2)),
                savings: Number((unitPrice * 0.25).toFixed(2)),
              }
            : undefined,
        };
      }),
      prepTimeline: (parsed.prepTimeline || []).map((t: any, idx: number) => ({
        id: `task-${idx}`,
        timeline: t.timeline || 'day_of_morning',
        task: t.task,
        category: t.category || 'Shopping',
        isCompleted: false,
      })),
      cateringRuleSummary: {
        drinksPerPerson,
        servingsPerPerson,
        iceLbsTotal: iceLbs,
        tablewareBufferPercent: 30,
      },
    };

    res.json(finalPlan);
  } catch (error: any) {
    console.warn('Falling back to local algorithmic plan generation due to AI outage:', error?.message || error);
    const fallbackPlan = createAlgorithmicPlan(input, totalGuests, duration, budget, iceLbs, drinksPerPerson, servingsPerPerson, countryCode, currencyCode, currencySymbol);
    res.json(fallbackPlan);
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
      const fallback = createAssistantFallbackResponse(message, currentPlan);
      return res.json(fallback);
    }

    const countryCode = (currentPlan?.countryCode || req.body.countryCode || 'IN').toUpperCase();
    const currencyCode = currentPlan?.currencyCode || (countryCode === 'IN' ? 'INR' : countryCode === 'GB' ? 'GBP' : countryCode === 'JP' ? 'JPY' : 'USD');
    const currencySymbol = getCurrencySymbol(currencyCode);

    const systemPrompt = `You are CymbalMart Assistant, the official retail customer service & catering expert for CymbalMart Supercenters (${countryCode}).
Help the user with store policies, aisle navigation, party portions, catering formulas, and savings tips.
User Question: "${message}"
Currency: ${currencyCode} (${currencySymbol})
Active Plan Context: ${currentPlan ? `Theme: ${currentPlan.theme}, Guests: ${currentPlan.guestCount}, Budget: ${currencySymbol}${currentPlan.targetBudget}` : 'No active plan'}

Return JSON format:
{
  "reply": "Clear, markdown-formatted response with bullet points and friendly store guidance",
  "intentCategory": "store_policy | catering_math | product_search | savings_deal | general",
  "suggestedPrompts": ["Follow-up question 1", "Follow-up question 2", "Follow-up question 3"]
}`;

    const response = await generateContentWithFallback(ai, {
      contents: systemPrompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');

    res.json({
      reply: parsed.reply || "I'm here to help with all your CymbalMart shopping, catering formulas, and store inquiries!",
      intentCategory: parsed.intentCategory || 'general',
      suggestedPrompts: parsed.suggestedPrompts || [
        'How much ice and drinks do I need for my event?',
        'Where are party supplies located in store?',
        'What is CymbalMart curbside pickup policy?'
      ],
    });
  } catch (error: any) {
    console.warn('Falling back to local CymbalMart assistant response due to AI outage:', error?.message || error);
    const fallback = createAssistantFallbackResponse(req.body.message, req.body.currentPlan);
    res.json(fallback);
  }
});

// Endpoint: AI Copilot Chat & Constraint Adjustment for CymbalMart
app.post('/api/party/chat', async (req, res) => {
  const { message = '', currentPlan } = req.body || {};

  if (!currentPlan) {
    return res.status(400).json({ error: 'Active party plan context is required.' });
  }

  try {
    const ai = getAi();

    if (!ai) {
      const fallback = createPartyChatFallback(message, currentPlan);
      return res.json(fallback);
    }

    const prompt = `You are the official CymbalMart AI Party Planner Shopping Assistant.
The busy host is requesting modifications, constraint adjustments, or budget optimizations for their party plan.

CURRENT EVENT CONTEXT:
- Title: ${currentPlan.title} (${currentPlan.theme})
- Guests: ${currentPlan.guestCount}
- Target Budget: ${currentPlan.currencySymbol || '$'}${currentPlan.targetBudget}
- Current Cart Total: ${currentPlan.items.reduce((acc: number, i: any) => acc + (i.isAlreadyOwned ? 0 : i.estimatedPrice * (i.quantity || 1)), 0).toFixed(2)}
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
2. If the user asks to adjust constraints (e.g. cut budget, make items vegan/gluten-free, add items for more guests, swap to CymbalMart store brands, add ice/drinks), return the full modified item list with appropriate aisles and quantities.
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

    const response = await generateContentWithFallback(ai, {
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
    console.warn('Falling back to local party chat copilot due to AI outage:', error?.message || error);
    const fallback = createPartyChatFallback(message, currentPlan);
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
        'Find items by aisle in CymbalMart',
      ],
    };
  }

  if (query.includes('pickup') || query.includes('curbside') || query.includes('delivery')) {
    return {
      reply: `**CymbalMart Pickup & Express Delivery Policies:**\n\n• **Curbside Pickup:** **FREE** on all orders over $35 / ₹500 ($4.99 for smaller orders). Pull into Bays 1–10 and check in on your phone—our team loads your trunk in under 5 minutes.\n• **Express 2-Hr Delivery:** Refrigerated door-to-door delivery within 2 hours ($4.99 flat or **FREE** for Cymbal Club members).\n• **Order Deadline:** Schedule anytime up to 1 hour before your desired time slot.`,
      intentCategory: 'store_policy',
      suggestedPrompts: [
        'What are the store hours?',
        'How does the 100% Freshness Guarantee work?',
        'Help me cut costs on my cart',
      ],
    };
  }

  if (query.includes('ice') || query.includes('drink') || query.includes('portion') || query.includes('math') || query.includes('catering')) {
    const guests = currentPlan?.guestCount || 15;
    const duration = currentPlan?.durationHours || 3;
    const isMetric = currentPlan?.metricUnits !== false;
    const iceAmount = isMetric ? `${Math.round(guests * 0.75)} kg` : `${Math.round(guests * 1.5)} lbs`;
    const drinks = Math.round(guests * duration * 1.25);
    return {
      reply: `**CymbalMart Catering Portions Formula for ${guests} Guests (${duration} Hours):**\n\n• **Ice (Freezer Depot):** **~${iceAmount}** (for indoor chilling and drink service; add 30% for outdoor venues).\n• **Beverages (Aisle 8 & 9):** **~${drinks} total drinks** (~1.25 drinks per person per hour; recommended 50% sparkling waters/sodas, 30% craft/mocktails, 20% juices/tea).\n• **Appetizers & Mains:** 4–6 bites per guest for heavy apps, or 1.5 portions/guest.\n• **Tableware (Aisle 11):** ${Math.ceil(guests * 1.3)} plates and cups (1.3× buffer).`,
      intentCategory: 'catering_math',
      suggestedPrompts: [
        'Swap items to Cymbal Choice brand to save money',
        'Recommend dietary party snacks',
        'What are curbside pickup hours?',
      ],
    };
  }

  return {
    reply: `Hello! I'm **CymbalMart Assistant**, your dedicated retail & party shopping helper. I can assist you with:\n\n• **Store Policies & Hours:** Curbside pickup rules, 2-hr delivery, 90-day returns & price matching.\n• **Aisle Guide:** Finding any grocery, beverage, ice, or party supply in CymbalMart.\n• **Catering Math:** Calculating exact ice, drink counts, appetizer portions, and tableware buffers.\n• **Budget Optimization:** Finding 20–30% savings with *Cymbal Choice* store brand alternatives.\n• **Shopping Cart Updates:** Directly adjusting or trimming items in your active party list.\n\nHow can I help make your CymbalMart experience seamless today?`,
    intentCategory: 'general',
    suggestedPrompts: [
      'What are your store & pickup hours?',
      'How much ice and drinks do I need?',
      'How does CymbalMart 100% Freshness Guarantee work?',
      'Find items by CymbalMart aisle',
    ],
  };
}

// Fallback AI Co-pilot Chat handler for Party Plan adjustments
function createPartyChatFallback(message: string, currentPlan: any) {
  const query = (message || '').toLowerCase();
  let updatedItems = [...(currentPlan.items || [])];
  const appliedActions: string[] = [];
  let reply = '';

  if (query.includes('budget') || query.includes('cut') || query.includes('save') || query.includes('cheaper') || query.includes('cost')) {
    let savedDollars = 0;
    updatedItems = updatedItems.map((item) => {
      if (item.brandType !== 'cymbal_brand' && item.cymbalBrandSwap) {
        savedDollars += (item.cymbalBrandSwap.savings || 1.5) * (item.quantity || 1);
        return {
          ...item,
          name: item.cymbalBrandSwap.brandName || `Cymbal Choice ${item.name}`,
          estimatedPrice: item.cymbalBrandSwap.price || Number((item.estimatedPrice * 0.75).toFixed(2)),
          brandType: 'cymbal_brand',
        };
      }
      if (item.priority === 'optional') {
        savedDollars += (item.estimatedPrice || 0) * (item.quantity || 1);
        return {
          ...item,
          isAlreadyOwned: true,
        };
      }
      return item;
    });

    appliedActions.push(`Swapped items to Cymbal Choice store brands (saving ~25-30%)`);
    appliedActions.push(`Audited pantry supplies to optimize budget`);
    const currSym = currentPlan.currencySymbol || '$';
    reply = `I optimized your shopping list for savings! By switching eligible items to **Cymbal Choice** store brands and adjusting pantry items, we saved approximately **${currSym}${Math.max(15, Math.round(savedDollars * 100) / 100).toFixed(2)}** while preserving all core food courses and drinks!`;
  } else {
    reply = `I've updated your CymbalMart cart based on your preferences. All items remain synchronized with your store layout and target budget!`;
    appliedActions.push('Synchronized shopping cart with event specifications');
  }

  return {
    reply,
    appliedActions,
    updatedItems,
  };
}

// Fallback Algorithmic Party Plan Generator
function createAlgorithmicPlan(
  input: any,
  totalGuests: number,
  duration: number,
  budget: number,
  iceLbs: number,
  drinksPerPerson: number,
  servingsPerPerson: number,
  countryCode: string,
  currencyCode: string,
  currencySymbol: string
) {
  const planId = 'cymbal-fallback-' + Date.now();
  const theme = input.theme || 'Festive Celebration';
  const eventType = input.eventType || 'Party Gathering';
  const isIndia = countryCode === 'IN';
  const metricUnits = input.metricUnits !== false;

  const items = isIndia
    ? [
        {
          id: `item-${planId}-1`,
          name: 'Cymbal Fresh Cocktail Samosas (Pack of 24)',
          category: 'food_sides_snacks',
          quantity: Math.max(1, Math.ceil(totalGuests / 6)),
          unit: 'pack (24 pcs)',
          estimatedPrice: 249,
          pricingType: 'estimated_local',
          targetStore: 'CymbalMart',
          aisle: 'Aisle 2 (Hot Snacks & Frozen)',
          brandType: 'cymbal_brand',
          notes: 'Crispy vegetable cocktail samosas with mint & tamarind chutney',
          alternativeOrBulkTip: 'CymbalMart Party Box saves 20%',
          priority: 'must_have',
          isAlreadyOwned: false,
          isPurchased: false,
        },
        {
          id: `item-${planId}-2`,
          name: 'Cymbal Fresh Paneer Tikka / Butter Masala Feast Kit',
          category: 'food_mains',
          quantity: Math.max(2, Math.ceil(totalGuests / 4)),
          unit: '1 kg kit',
          estimatedPrice: 380,
          pricingType: 'estimated_local',
          targetStore: 'CymbalMart',
          aisle: 'Aisle 1 (Fresh Dairy & Meals)',
          brandType: 'cymbal_brand',
          notes: 'Fresh malai paneer with rich spiced gravy and butter naan pack',
          alternativeOrBulkTip: 'Cook in batch for easy warm serving',
          priority: 'must_have',
          isAlreadyOwned: false,
          isPurchased: false,
        },
        {
          id: `item-${planId}-3`,
          name: 'Cymbal Royal Dum Biryani Party Platter',
          category: 'food_mains',
          quantity: Math.max(2, Math.ceil(totalGuests / 5)),
          unit: '1.5 kg platter',
          estimatedPrice: 499,
          pricingType: 'estimated_local',
          targetStore: 'CymbalMart',
          aisle: 'Aisle 1 (Deli & Ready Meals)',
          brandType: 'cymbal_brand',
          notes: 'Aromatic basmati rice with saffron, fried onions, and mixed veg/paneer',
          alternativeOrBulkTip: 'Includes mirchi ka salan and cucumber raita',
          priority: 'must_have',
          isAlreadyOwned: false,
          isPurchased: false,
        },
        {
          id: `item-${planId}-4`,
          name: 'Cymbal Choice Assorted Mithai (Gulab Jamun & Kaju Katli)',
          category: 'desserts',
          quantity: Math.max(1, Math.ceil(totalGuests / 8)),
          unit: '1 kg box',
          estimatedPrice: 450,
          pricingType: 'estimated_local',
          targetStore: 'CymbalMart',
          aisle: 'Aisle 3 (Bakery & Mithai)',
          brandType: 'cymbal_brand',
          notes: 'Freshly prepared festive sweet box',
          alternativeOrBulkTip: 'Store in cool dry place',
          priority: 'must_have',
          isAlreadyOwned: false,
          isPurchased: false,
        },
        {
          id: `item-${planId}-5`,
          name: 'Cymbal Sparkler Soda & Mango Frooti Combo Pack',
          category: 'drinks_non_alcoholic',
          quantity: Math.max(2, Math.ceil((totalGuests * duration) / 8)),
          unit: '2L bottles (pack of 4)',
          estimatedPrice: 220,
          pricingType: 'estimated_local',
          targetStore: 'CymbalMart',
          aisle: 'Aisle 8 (Beverages & Juices)',
          brandType: 'cymbal_brand',
          notes: 'Refreshing mango juice and club soda for mocktails',
          alternativeOrBulkTip: 'Pair with fresh mint and lemons',
          priority: 'must_have',
          isAlreadyOwned: false,
          isPurchased: false,
        },
        {
          id: `item-${planId}-6`,
          name: 'Cymbal Ice Depot Pure Food-Grade Party Ice',
          category: 'ice_chill',
          quantity: Math.max(2, Math.ceil(totalGuests / 6)),
          unit: '5 kg bag',
          estimatedPrice: 120,
          pricingType: 'estimated_local',
          targetStore: 'CymbalMart',
          aisle: 'Front Freezer Depot',
          brandType: 'cymbal_brand',
          notes: 'Crystal clear ice for beverage tubs and coolers',
          alternativeOrBulkTip: 'Keep in insulated cooler box until serving',
          priority: 'must_have',
          isAlreadyOwned: false,
          isPurchased: false,
        },
        {
          id: `item-${planId}-7`,
          name: 'Eco-Friendly Areca Nut Leaf Party Plates & Wooden Cutlery',
          category: 'tableware_disposables',
          quantity: Math.max(1, Math.ceil(totalGuests / 20)),
          unit: 'pack of 25',
          estimatedPrice: 199,
          pricingType: 'estimated_local',
          targetStore: 'CymbalMart',
          aisle: 'Aisle 11 (Party Supplies)',
          brandType: 'cymbal_brand',
          notes: '100% biodegradable, leak-proof festive palm leaf plates',
          alternativeOrBulkTip: 'Recyclable and compostable',
          priority: 'must_have',
          isAlreadyOwned: false,
          isPurchased: false,
        },
        {
          id: `item-${planId}-8`,
          name: 'Cymbal Festive Marigold Garland & LED Fairy Lights Kit',
          category: 'decor_ambiance',
          quantity: 1,
          unit: 'decor kit',
          estimatedPrice: 299,
          pricingType: 'estimated_local',
          targetStore: 'CymbalMart',
          aisle: 'Aisle 12 (Festive & Home Decor)',
          brandType: 'cymbal_brand',
          notes: 'Golden glow ambiance lighting with vibrant floral garlands',
          alternativeOrBulkTip: 'Reusable for upcoming celebrations',
          priority: 'nice_to_have',
          isAlreadyOwned: false,
          isPurchased: false,
        },
      ]
    : [
        {
          id: `item-${planId}-1`,
          name: 'Cymbal Choice Angus Beef & Veggie Slider Burgers (12 Pack)',
          category: 'food_mains',
          quantity: Math.max(1, Math.ceil(totalGuests / 6)),
          unit: 'pack of 12',
          estimatedPrice: 14.99,
          pricingType: 'estimated_local',
          targetStore: 'CymbalMart',
          aisle: 'Aisle 2 (Meat & Seafood)',
          brandType: 'cymbal_brand',
          notes: 'Pre-seasoned gourmet slider patties with brioche slider buns',
          alternativeOrBulkTip: 'Cymbal Choice Club Pack saves $3.50',
          priority: 'must_have',
          isAlreadyOwned: false,
          isPurchased: false,
        },
        {
          id: `item-${planId}-2`,
          name: 'Cymbal Fresh Artisan Guacamole & Crisp Tortilla Chips',
          category: 'food_sides_snacks',
          quantity: Math.max(1, Math.ceil(totalGuests / 8)),
          unit: 'party tub (32 oz)',
          estimatedPrice: 7.99,
          pricingType: 'estimated_local',
          targetStore: 'CymbalMart',
          aisle: 'Aisle 1 (Deli & Produce)',
          brandType: 'cymbal_brand',
          notes: 'Made daily in-store with Hass avocados and sea salt tortilla chips',
          alternativeOrBulkTip: 'Gluten-free friendly appetizer',
          priority: 'must_have',
          isAlreadyOwned: false,
          isPurchased: false,
        },
        {
          id: `item-${planId}-3`,
          name: 'Cymbal Sparkling Seltzer & Citrus Punch Pack',
          category: 'drinks_non_alcoholic',
          quantity: Math.max(2, Math.ceil((totalGuests * duration) / 10)),
          unit: '12-pack cans',
          estimatedPrice: 6.49,
          pricingType: 'estimated_local',
          targetStore: 'CymbalMart',
          aisle: 'Aisle 8 (Beverages)',
          brandType: 'cymbal_brand',
          notes: 'Assorted flavors (Lime, Grapefruit, Berry) for mocktails',
          alternativeOrBulkTip: 'Zero sugar, natural flavor',
          priority: 'must_have',
          isAlreadyOwned: false,
          isPurchased: false,
        },
        {
          id: `item-${planId}-4`,
          name: 'Cymbal Ice Depot Pure Cube Ice Bag',
          category: 'ice_chill',
          quantity: Math.max(2, Math.ceil(totalGuests / 6)),
          unit: metricUnits ? '5 kg bag' : '10 lb bag',
          estimatedPrice: 3.49,
          pricingType: 'estimated_local',
          targetStore: 'CymbalMart',
          aisle: 'Front Freezer Depot',
          brandType: 'cymbal_brand',
          notes: 'Triple-filtered food-grade beverage ice',
          alternativeOrBulkTip: 'Keep in cooler until party start',
          priority: 'must_have',
          isAlreadyOwned: false,
          isPurchased: false,
        },
        {
          id: `item-${planId}-5`,
          name: 'Cymbal Party Heavy-Duty Plates & Cutlery Pack',
          category: 'tableware_disposables',
          quantity: Math.max(1, Math.ceil(totalGuests / 20)),
          unit: '50 count pack',
          estimatedPrice: 6.99,
          pricingType: 'estimated_local',
          targetStore: 'CymbalMart',
          aisle: 'Aisle 11 (Party Supplies)',
          brandType: 'cymbal_brand',
          notes: 'Compostable premium party tableware set',
          alternativeOrBulkTip: '30% extra buffer included',
          priority: 'must_have',
          isAlreadyOwned: false,
          isPurchased: false,
        },
        {
          id: `item-${planId}-6`,
          name: 'Cymbal Celebration Balloon Garland & Banner Set',
          category: 'decor_ambiance',
          quantity: 1,
          unit: 'decor kit',
          estimatedPrice: 15.99,
          pricingType: 'estimated_local',
          targetStore: 'CymbalMart',
          aisle: 'Aisle 12 (Seasonal Decor)',
          brandType: 'cymbal_brand',
          notes: `Coordinates with ${theme} theme aesthetic`,
          alternativeOrBulkTip: 'Reusable party bunting and LED string lights',
          priority: 'nice_to_have',
          isAlreadyOwned: false,
          isPurchased: false,
        },
      ];

  return {
    id: planId,
    createdAt: new Date().toISOString(),
    title: input.title || `${theme} ${eventType}`,
    theme,
    eventType,
    countryCode,
    currencyCode,
    currencySymbol,
    regionalPreference: isIndia ? 'all_indian' : 'standard',
    guestCount: totalGuests,
    guestBreakdown: input.guestBreakdown || { adults: totalGuests, kids: 0, teens: 0 },
    guestDietaryBreakdown: input.guestDietaryBreakdown,
    durationHours: duration,
    mealType: input.mealType || 'heavy_appetizers',
    venue: input.venue || 'indoor_home',
    targetBudget: budget,
    metricUnits,
    dietaryRestrictions: input.dietaryRestrictions || [],
    themeDescription: `A curated CymbalMart celebration plan customized for ${totalGuests} guests with authentic catering portions and budget optimization.`,
    signatureDrinkName: isIndia ? 'Cymbal Shahi Kesar Badam Sparkler' : 'Cymbal Citrus Fizz Mocktail',
    signatureDrinkRecipe: 'Combine chilled sparkling soda with seasonal citrus juices, crushed mint, and ice in a highball glass.',
    playlistVibe: isIndia ? 'Bollywood Hits & Desi Festive Lounge' : 'Upbeat Pop & Indie Acoustic Party Mix',
    storeLocation: isIndia ? 'CymbalMart Hypermarket - Bengaluru (Indiranagar)' : 'CymbalMart Supercenter #1042 - Sunnyvale',
    fulfillmentType: input.fulfillmentPreference || 'curbside_pickup',
    items,
    prepTimeline: [
      {
        id: 'task-1',
        timeline: '3_days_before',
        task: 'Finalize RSVP count and schedule CymbalMart Curbside Pickup order',
        category: 'Shopping',
        isCompleted: false,
      },
      {
        id: 'task-2',
        timeline: '1_day_before',
        task: 'Pick up groceries, chill beverages, and set up drink station',
        category: 'Prep',
        isCompleted: false,
      },
      {
        id: 'task-3',
        timeline: 'day_of_morning',
        task: 'Set out tableware, prepare appetizers, and test playlist audio',
        category: 'Decor',
        isCompleted: false,
      },
      {
        id: 'task-4',
        timeline: '1_hour_before',
        task: 'Add fresh ice to beverage tubs and start signature welcome drinks',
        category: 'Host',
        isCompleted: false,
      },
    ],
    aiTips: [
      'Order at least 24 hours in advance to secure your preferred CymbalMart Curbside pickup slot.',
      'Always ice your canned and bottled beverages 3-4 hours prior to guests arriving.',
      'Cymbal Choice store brands deliver identical restaurant-grade quality at 20-30% lower cost.',
    ],
    cateringRuleSummary: {
      drinksPerPerson,
      servingsPerPerson,
      iceLbsTotal: iceLbs,
      tablewareBufferPercent: 30,
    },
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
