import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Printer,
  Download,
  Share2,
  FileText,
  Table,
  Sparkles,
} from 'lucide-react';
import { PartyPlan } from '../types';
import { generateTextShoppingList, generateCsvShoppingList } from '../utils/calculator';

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
  const [activeTab, setActiveTab] = useState<'text' | 'csv'>('text');

  if (!isOpen) return null;

  const textList = generateTextShoppingList(plan);
  const csvList = generateCsvShoppingList(plan);

  const handleCopy = () => {
    const content = activeTab === 'text' ? textList : csvList;
    navigator.clipboard.writeText(content);
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

  const handleDownloadCsv = () => {
    const element = document.createElement('a');
    const file = new Blob([csvList], { type: 'text/csv;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `${plan.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_shopping_list.csv`;
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
    <div
      id="export-modal-overlay"
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
    >
      <div className="bg-white rounded-2xl p-6 max-w-3xl w-full border border-zinc-200 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 id="export-modal-title" className="font-bold text-base text-zinc-900">
                Export & Share CymbalMart Plan
              </h3>
              <p className="text-xs text-zinc-500">
                Share formatted shopping checklist, run of show, and CSV with co-hosts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 p-1 rounded-lg transition-colors cursor-pointer"
            aria-label="Close Export Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Buttons Row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          <button
            onClick={handleCopy}
            className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
              copied
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-zinc-900 text-white hover:bg-zinc-800'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy to Clipboard'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="p-2.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-800 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-zinc-500" />
            <span>Print Sheet</span>
          </button>

          <button
            onClick={handleDownloadCsv}
            className="p-2.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-800 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Table className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleDownloadText}
            className="p-2.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-800 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            <span>Download .TXT</span>
          </button>

          <button
            onClick={handleDownloadJson}
            className="p-2.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-800 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-purple-600" />
            <span>Save JSON</span>
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center space-x-2 border-b border-zinc-100 pb-2 text-xs">
          <button
            onClick={() => setActiveTab('text')}
            className={`px-3 py-1 rounded-lg font-semibold transition-all ${
              activeTab === 'text'
                ? 'bg-zinc-900 text-white'
                : 'text-zinc-600 hover:bg-zinc-100'
            }`}
          >
            Formatted Summary & Shopping Checklist
          </button>
          <button
            onClick={() => setActiveTab('csv')}
            className={`px-3 py-1 rounded-lg font-semibold transition-all ${
              activeTab === 'csv'
                ? 'bg-zinc-900 text-white'
                : 'text-zinc-600 hover:bg-zinc-100'
            }`}
          >
            Spreadsheet CSV Preview
          </button>
        </div>

        {/* Text/CSV Preview Box */}
        <div className="flex-1 min-h-0 bg-zinc-50 p-4 rounded-xl border border-zinc-200 overflow-y-auto font-mono text-xs text-zinc-800 leading-relaxed whitespace-pre-wrap">
          {activeTab === 'text' ? textList : csvList}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
