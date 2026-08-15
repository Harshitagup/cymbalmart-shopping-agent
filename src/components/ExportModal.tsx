import React, { useState } from 'react';
import { X, Copy, Check, Printer, Download, Share2, FileText } from 'lucide-react';
import { PartyPlan } from '../types';
import { generateTextShoppingList } from '../utils/calculator';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: PartyPlan;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  plan,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const textList = generateTextShoppingList(plan);

  const handleCopy = () => {
    navigator.clipboard.writeText(textList);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadText = () => {
    const element = document.createElement('a');
    const file = new Blob([textList], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `${plan.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_shopping_list.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleDownloadJson = () => {
    const element = document.createElement('a');
    const file = new Blob([JSON.stringify(plan, null, 2)], { type: 'application/json' });
    element.href = URL.createObjectURL(file);
    element.download = `${plan.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_party_plan.json`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-2xl w-full border border-zinc-200 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-rose-100 text-rose-700">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-zinc-900">Export & Print Shopping Checklist</h3>
              <p className="text-[11px] text-zinc-500">Ready to text to co-hosts or take to the store</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            onClick={handleCopy}
            className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
              copied
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-zinc-900 text-white hover:bg-zinc-800'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Formatted List'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="p-2.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-800 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-zinc-500" />
            <span>Print List</span>
          </button>

          <button
            onClick={handleDownloadText}
            className="p-2.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-800 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-zinc-500" />
            <span>Download .TXT</span>
          </button>

          <button
            onClick={handleDownloadJson}
            className="p-2.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-800 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-zinc-500" />
            <span>Save JSON</span>
          </button>
        </div>

        {/* Text Preview Box */}
        <div className="flex-1 min-h-0 bg-zinc-50 p-4 rounded-xl border border-zinc-200 overflow-y-auto font-mono text-xs text-zinc-800 leading-relaxed whitespace-pre-wrap">
          {textList}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
