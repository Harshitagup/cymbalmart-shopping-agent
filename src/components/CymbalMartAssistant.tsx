import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Store,
  Clock,
  Truck,
  ShieldCheck,
  Snowflake,
  BadgePercent,
  MapPin,
  CheckCircle2,
  Plus,
  Trash2,
  Maximize2,
  Minimize2,
  Loader2,
  Bot,
  User,
  HelpCircle,
  ShoppingBag,
  ExternalLink,
} from 'lucide-react';
import { PartyPlan, ShoppingItem, ChatMessage } from '../types';
import { formatCurrency } from '../utils/calculator';

interface CymbalMartAssistantProps {
  isOpen: boolean;
  onToggle: () => void;
  currentPlan: PartyPlan | null;
  onUpdatePlanItems?: (newItems: ShoppingItem[]) => void;
  onAddItemToPlan?: (item: ShoppingItem) => void;
  onNavigateToStep?: (step: 'define' | 'review' | 'refine_checkout') => void;
}

const CATEGORY_TOPIC_PILLS = [
  { id: 'hours', label: '🕒 Store Hours & Bay Info', prompt: 'What are the CymbalMart store hours, pharmacy hours, and curbside pickup bay times?' },
  { id: 'pickup', label: '🚗 Free Curbside Pickup & 2-Hr Delivery', prompt: 'How does CymbalMart Curbside Pickup and 2-Hour Express Delivery work?' },
  { id: 'returns', label: '🛡️ 90-Day Returns & Freshness Guarantee', prompt: 'What is the CymbalMart 100% Freshness Guarantee and return policy?' },
  { id: 'ice_drinks', label: '🧊 Ice & Drink Calculator', prompt: 'How much ice and how many drinks do I need for my event?' },
  { id: 'store_brands', label: '🏷️ Cymbal Choice 30% Savings', prompt: 'How much can I save by switching to Cymbal Choice and Cymbal Organic store brands?' },
  { id: 'aisles', label: '📍 CymbalMart Aisle Directory', prompt: 'Can you give me a directory of which items are in each CymbalMart aisle?' },
  { id: 'dietary', label: '🌱 Vegan & Gluten-Free Party Snacks', prompt: 'What are the top gluten-free, nut-free, and vegan snacks available at CymbalMart?' },
];

export const CymbalMartAssistant: React.FC<CymbalMartAssistantProps> = ({
  isOpen,
  onToggle,
  currentPlan,
  onUpdatePlanItems,
  onAddItemToPlan,
  onNavigateToStep,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content: `👋 Hello! I'm **CymbalMart Assistant**, your personal customer support and shopping assistant.\n\nI can help you with **store hours & policies**, **curbside pickup & 2-hr delivery**, **catering formulas (ice & drinks)**, **aisle directions**, and **optimizing your shopping cart** with Cymbal Choice store brand savings.\n\nHow can I help you today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedPrompts: [
        'What are your store & pickup hours?',
        'How much ice and drinks do I need for my party?',
        'How does the 100% Freshness Guarantee work?',
        'Show me CymbalMart aisle directory'
      ]
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [addedItemIds, setAddedItemIds] = useState<Record<string, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setHasUnread(false);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText.trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          chatHistory: messages.slice(-5),
          currentPlan,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to reach CymbalMart Assistant');
      }

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.reply || "I've processed your request. Is there anything else you need help with at CymbalMart?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        appliedActions: data.appliedActions || [],
        suggestedPrompts: data.suggestedPrompts || [],
        suggestedItems: data.suggestedItems || [],
        intentCategory: data.intentCategory,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // If cart items were updated directly
      if (data.updatedItems && Array.isArray(data.updatedItems) && onUpdatePlanItems) {
        onUpdatePlanItems(data.updatedItems);
      }

      if (!isOpen) {
        setHasUnread(true);
      }
    } catch (err: any) {
      console.error('CymbalMart Assistant Error:', err);
      const fallbackMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `I'm currently assisting multiple customers! You can also check out our store policies, hours (6 AM - 11 PM daily), free curbside pickup on $35+, or ask me to recalculate party ice and beverages.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedPrompts: [
          'What are your store hours?',
          'How does Curbside Pickup work?',
          'Calculate ice for my party'
        ]
      };
      setMessages((prev) => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSuggestedItem = (item: ShoppingItem) => {
    if (onAddItemToPlan) {
      onAddItemToPlan(item);
      setAddedItemIds((prev) => ({ ...prev, [item.id]: true }));
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: `Chat history refreshed! How can I assist you with your CymbalMart order, store visit, or party planning today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedPrompts: [
          'What are your store hours?',
          'Calculate ice for my guests',
          'Curbside pickup instructions',
          'Aisle directory'
        ]
      },
    ]);
  };

  // Render markdown with bullet points and bolding cleanly
  const renderMessageContent = (content: string) => {
    return (
      <div className="space-y-1.5 leading-relaxed text-xs">
        {content.split('\n\n').map((paragraph, pIdx) => {
          if (paragraph.startsWith('• ') || paragraph.startsWith('* ') || paragraph.includes('\n• ')) {
            const lines = paragraph.split('\n');
            return (
              <ul key={pIdx} className="space-y-1 pl-1">
                {lines.map((line, lIdx) => {
                  const cleaned = line.replace(/^[•*]\s*/, '').trim();
                  if (!cleaned) return null;
                  return (
                    <li key={lIdx} className="flex items-start space-x-1.5">
                      <span className="text-emerald-700 font-bold mt-0.5">•</span>
                      <span dangerouslySetInnerHTML={{ __html: formatBoldMarkdown(cleaned) }} />
                    </li>
                  );
                })}
              </ul>
            );
          }
          return (
            <p
              key={pIdx}
              dangerouslySetInnerHTML={{ __html: formatBoldMarkdown(paragraph) }}
            />
          );
        })}
      </div>
    );
  };

  function formatBoldMarkdown(text: string): string {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-zinc-900">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic text-zinc-800">$1</em>');
  }

  return (
    <>
      {/* Floating Launcher Trigger Pill (when closed or docked) */}
      <div
        id="cymbalmart-chatbot-launcher"
        className={`fixed bottom-5 right-5 z-40 flex items-center ${isOpen ? 'hidden' : 'block'}`}
      >
        <button
          type="button"
          onClick={onToggle}
          className="group relative flex items-center space-x-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-emerald-700 via-teal-700 to-zinc-900 text-white shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer border border-emerald-500/30"
          title="Chat with CymbalMart Assistant"
        >
          {/* Pulsing online badge */}
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-amber-300">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-zinc-900 animate-pulse" />
          </div>

          <div className="text-left pr-1">
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-xs tracking-tight">CymbalMart Assistant</span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-400 text-zinc-950">AI</span>
            </div>
            <p className="text-[10px] text-zinc-300">Store info, catering & shopping help</p>
          </div>

          {hasUnread && (
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white animate-ping" />
          )}
        </button>
      </div>

      {/* Floating / Docked Chatbot Window */}
      {isOpen && (
        <div
          id="cymbalmart-assistant-window"
          className={`fixed z-50 transition-all duration-300 flex flex-col bg-white border border-zinc-200 shadow-2xl overflow-hidden ${
            isExpanded
              ? 'inset-4 sm:inset-10 rounded-3xl'
              : 'bottom-4 right-4 sm:bottom-6 sm:right-6 w-[94vw] sm:w-[440px] h-[600px] max-h-[85vh] rounded-3xl'
          }`}
        >
          {/* Header */}
          <div className="p-3.5 sm:p-4 bg-gradient-to-r from-zinc-950 via-zinc-900 to-emerald-950 text-white flex items-center justify-between border-b border-zinc-800 shrink-0">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-xs">
                <Store className="w-4 h-4 text-amber-200" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <h3 className="font-extrabold text-xs sm:text-sm tracking-tight text-white">
                    CymbalMart Assistant
                  </h3>
                  <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1 animate-pulse" />
                    Online
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400">Customer Support & Party Planning Agent</p>
              </div>
            </div>

            {/* Header Action Controls */}
            <div className="flex items-center space-x-1 text-zinc-400">
              <button
                type="button"
                onClick={handleClearHistory}
                className="p-1.5 rounded-lg hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Clear chat history"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 rounded-lg hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer hidden sm:block"
                title={isExpanded ? 'Restore size' : 'Expand window'}
              >
                {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                onClick={onToggle}
                className="p-1.5 rounded-lg hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Close Assistant"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Topic Chips Scrollable Row */}
          <div className="bg-zinc-50 border-b border-zinc-200 px-3 py-2 overflow-x-auto flex space-x-1.5 scrollbar-none shrink-0 text-xs">
            {CATEGORY_TOPIC_PILLS.map((pill) => (
              <button
                key={pill.id}
                type="button"
                onClick={() => handleSendMessage(pill.prompt)}
                disabled={isLoading}
                className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-50 text-zinc-700 hover:text-emerald-950 border border-zinc-200 hover:border-emerald-300 text-[11px] font-medium transition-colors cursor-pointer shadow-2xs shrink-0 disabled:opacity-50"
              >
                {pill.label}
              </button>
            ))}
          </div>

          {/* Conversation Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-zinc-50/50">
            {messages.map((msg) => {
              const isAssistant = msg.role === 'assistant';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isAssistant ? 'items-start' : 'items-end'}`}
                >
                  <div
                    className={`flex items-start space-x-2 max-w-[90%] sm:max-w-[85%] ${
                      isAssistant ? '' : 'flex-row-reverse space-x-reverse'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] shrink-0 mt-0.5 ${
                        isAssistant
                          ? 'bg-emerald-700 text-white shadow-2xs'
                          : 'bg-zinc-900 text-white shadow-2xs'
                      }`}
                    >
                      {isAssistant ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                    </div>

                    <div
                      className={`p-3.5 rounded-2xl ${
                        isAssistant
                          ? 'bg-white border border-zinc-200 text-zinc-800 rounded-tl-xs shadow-2xs'
                          : 'bg-emerald-700 text-white rounded-tr-xs shadow-2xs'
                      }`}
                    >
                      {isAssistant ? (
                        renderMessageContent(msg.content)
                      ) : (
                        <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      )}

                      {/* Applied Cart Actions Pill */}
                      {msg.appliedActions && msg.appliedActions.length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-zinc-100 text-[11px] space-y-1">
                          <div className="flex items-center space-x-1 font-bold text-emerald-800">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Cart Updated:</span>
                          </div>
                          <ul className="text-zinc-600 pl-3.5 list-disc space-y-0.5">
                            {msg.appliedActions.map((action, i) => (
                              <li key={i}>{action}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Suggested Items for Cart */}
                      {msg.suggestedItems && msg.suggestedItems.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-zinc-100 space-y-2">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 block">
                            Recommended CymbalMart Items:
                          </span>
                          <div className="space-y-1.5">
                            {msg.suggestedItems.map((item) => {
                              const isAdded = Boolean(addedItemIds[item.id]);
                              return (
                                <div
                                  key={item.id}
                                  className="p-2 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-between gap-2 text-xs"
                                >
                                  <div className="min-w-0 flex-1">
                                    <span className="font-bold text-zinc-900 block truncate">{item.name}</span>
                                    <div className="flex items-center space-x-1.5 text-[10px] text-zinc-500">
                                      <span>{formatCurrency(item.estimatedPrice)}</span>
                                      <span>•</span>
                                      <span className="text-emerald-700 font-medium">{item.aisle}</span>
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleAddSuggestedItem(item)}
                                    disabled={isAdded}
                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center space-x-1 transition-all cursor-pointer ${
                                      isAdded
                                        ? 'bg-emerald-100 text-emerald-800 cursor-default'
                                        : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                                    }`}
                                  >
                                    {isAdded ? (
                                      <>
                                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                        <span>Added</span>
                                      </>
                                    ) : (
                                      <>
                                        <Plus className="w-3 h-3" />
                                        <span>Add to List</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <span className="text-[9px] text-zinc-400 mt-1 px-8">{msg.timestamp}</span>

                  {/* Clickable Follow-Up Prompts */}
                  {isAssistant && msg.suggestedPrompts && msg.suggestedPrompts.length > 0 && (
                    <div className="mt-1.5 pl-8 flex flex-wrap gap-1">
                      {msg.suggestedPrompts.map((p, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleSendMessage(p)}
                          disabled={isLoading}
                          className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-white hover:bg-emerald-50 text-zinc-700 hover:text-emerald-950 border border-zinc-200 hover:border-emerald-300 transition-colors text-left cursor-pointer shadow-2xs disabled:opacity-50"
                        >
                          💬 {p}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-start space-x-2">
                <div className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="p-3 bg-white border border-zinc-200 rounded-2xl rounded-tl-xs shadow-2xs flex items-center space-x-2 text-xs text-zinc-600">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                  <span>CymbalMart Assistant is researching store inventory & formulas...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Active Context Banner */}
          {currentPlan && (
            <div className="px-3 py-1.5 bg-emerald-50/70 border-t border-emerald-200/50 flex items-center justify-between text-[11px] text-emerald-950 shrink-0">
              <span className="truncate">
                Event: <strong>{currentPlan.title}</strong> ({currentPlan.guestCount} guests · ${currentPlan.targetBudget} budget)
              </span>
              {onNavigateToStep && (
                <button
                  type="button"
                  onClick={() => onNavigateToStep('review')}
                  className="text-[10px] font-bold text-emerald-800 hover:underline shrink-0 ml-2 cursor-pointer"
                >
                  View Cart ({currentPlan.items.length}) →
                </button>
              )}
            </div>
          )}

          {/* Chat Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-white border-t border-zinc-200 flex items-center space-x-2 shrink-0"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask about store hours, catering ice math, aisle search, returns..."
              disabled={isLoading}
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white text-xs font-medium text-zinc-900 focus:border-emerald-600 transition-colors"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="p-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white transition-colors flex items-center justify-center cursor-pointer shadow-xs"
              title="Send to CymbalMart Assistant"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
