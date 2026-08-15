import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Loader2,
  Bot,
  User,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  ArrowRight,
} from 'lucide-react';
import { PartyPlan, ChatMessage, ShoppingItem } from '../types';

interface AICopilotChatProps {
  plan: PartyPlan;
  onUpdatePlanItems: (newItems: ShoppingItem[]) => void;
  externalPrompt?: string | null;
  onClearExternalPrompt?: () => void;
}

const QUICK_PROMPTS = [
  'Cut our shopping budget by $40 without losing main courses',
  'Make all appetizers 100% Gluten-Free & Vegan',
  'Add 3 fun DIY party icebreaker games with required supplies',
  'Suggest Costco bulk alternatives for our drinks and snacks',
  'Create a kid-friendly signature mocktail recipe & add ingredients',
  'Recalculate for 6 additional adult guests arriving late',
];

export const AICopilotChat: React.FC<AICopilotChatProps> = ({
  plan,
  onUpdatePlanItems,
  externalPrompt,
  onClearExternalPrompt,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      role: 'assistant',
      content: `Hello! I'm your AI Party Planning & Shopping Assistant. I can optimize your shopping list, suggest store brand substitutions, recalculate portions, or adjust for dietary preferences in real-time. How can I help?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Handle external prompts (e.g. from Budget Optimizer clicks)
  useEffect(() => {
    if (externalPrompt) {
      handleSendMessage(externalPrompt);
      if (onClearExternalPrompt) onClearExternalPrompt();
    }
  }, [externalPrompt]);

  const handleSendMessage = async (textToSend?: string) => {
    const message = textToSend || inputMessage.trim();
    if (!message || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/party/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          currentPlan: plan,
          chatHistory: messages.slice(-6),
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await res.json();

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: data.reply || 'I updated your party plan accordingly!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        appliedActions: data.appliedActions || [],
      };

      setMessages((prev) => [...prev, botMsg]);

      // If backend returned updated items, update plan in state
      if (data.updatedItems && Array.isArray(data.updatedItems) && data.updatedItems.length > 0) {
        onUpdatePlanItems(data.updatedItems);
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `I couldn't complete that update right now. Please try again!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="ai-copilot-chat" className="bg-white rounded-2xl border border-zinc-200 shadow-2xs overflow-hidden flex flex-col h-[640px]">
      {/* Header */}
      <div className="p-4 border-b border-zinc-200 bg-gradient-to-r from-rose-50 to-amber-50 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-white shadow-2xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-xs text-zinc-900">Gemini Party Co-Pilot</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <span className="text-[11px] text-zinc-500">Live shopping list adjustments & recipe suggestions</span>
          </div>
        </div>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50/40">
        {messages.map((msg) => {
          const isBot = msg.role === 'assistant';
          return (
            <div
              key={msg.id}
              className={`flex items-start space-x-2.5 ${isBot ? '' : 'flex-row-reverse space-x-reverse'}`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 ${
                  isBot ? 'bg-rose-100 text-rose-700' : 'bg-zinc-900 text-white'
                }`}
              >
                {isBot ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
              </div>

              <div className={`max-w-[85%] sm:max-w-[75%] space-y-1.5`}>
                <div
                  className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                    isBot
                      ? 'bg-white border border-zinc-200 text-zinc-800 shadow-2xs'
                      : 'bg-zinc-900 text-white shadow-2xs'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>

                  {/* Applied Actions Banner */}
                  {msg.appliedActions && msg.appliedActions.length > 0 && (
                    <div className="mt-2.5 pt-2.5 border-t border-zinc-100 space-y-1">
                      <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>List Automatically Updated:</span>
                      </div>
                      <ul className="text-[11px] text-zinc-600 space-y-0.5 pl-4 list-disc">
                        {msg.appliedActions.map((act, i) => (
                          <li key={i}>{act}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className={`text-[10px] text-zinc-400 px-1 ${isBot ? 'text-left' : 'text-right'}`}>
                  {msg.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start space-x-2.5">
            <div className="w-7 h-7 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-xs shrink-0">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="bg-white border border-zinc-200 p-3.5 rounded-2xl text-xs flex items-center space-x-2 shadow-2xs text-zinc-600">
              <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
              <span>Analyzing catering portions and optimizing shopping list...</span>
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Suggested Prompt Chips */}
      <div className="p-2.5 border-t border-zinc-100 bg-white overflow-x-auto flex space-x-1.5 scrollbar-none">
        {QUICK_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSendMessage(prompt)}
            disabled={isLoading}
            className="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[11px] font-medium whitespace-nowrap transition-colors flex items-center space-x-1 shrink-0"
          >
            <Lightbulb className="w-3 h-3 text-amber-500" />
            <span>{prompt}</span>
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3 border-t border-zinc-200 bg-white flex items-center space-x-2"
      >
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Ask AI to swap ingredients, cut budget, or add items..."
          disabled={isLoading}
          className="flex-1 px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white text-xs font-medium text-zinc-900 transition-colors"
        />
        <button
          type="submit"
          disabled={!inputMessage.trim() || isLoading}
          className="px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 text-white text-xs font-bold transition-all flex items-center space-x-1 shadow-2xs cursor-pointer"
        >
          <span>Send</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
