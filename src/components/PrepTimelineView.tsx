import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  Sparkles,
  AlertCircle,
  Tag,
} from 'lucide-react';
import { PrepTask } from '../types';

interface PrepTimelineViewProps {
  timeline: PrepTask[];
  onUpdateTimeline: (updated: PrepTask[]) => void;
}

const TIMELINE_SECTIONS: { key: PrepTask['timeline']; label: string; sub: string; badge: string; color: string }[] = [
  { key: '3_days_before', label: '3 Days Before', sub: 'Non-perishables, dry goods, tableware & decor', badge: 'Early Prep', color: 'border-blue-200 bg-blue-50/30' },
  { key: '1_day_before', label: '1 Day Before', sub: 'Chill drinks, marinate meats, prep dips & sound system', badge: 'Pre-Chill & Prep', color: 'border-indigo-200 bg-indigo-50/30' },
  { key: 'day_of_morning', label: 'Morning of Event', sub: 'Pick up fresh ice, bakery items & slice cocktail garnishes', badge: 'Day-Of Run', color: 'border-amber-200 bg-amber-50/30' },
  { key: '1_hour_before', label: '1 Hour Before (Final Touch)', sub: 'Light candles, start music playlist, ice drink dispensers & warm food', badge: 'Host Mode', color: 'border-rose-200 bg-rose-50/30' },
  { key: 'during_party', label: 'During the Party', sub: 'Trash checks, punch bowl top-up, enjoy hosting!', badge: 'Live Event', color: 'border-emerald-200 bg-emerald-50/30' },
];

export const PrepTimelineView: React.FC<PrepTimelineViewProps> = ({
  timeline,
  onUpdateTimeline,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskSection, setNewTaskSection] = useState<PrepTask['timeline']>('1_day_before');
  const [newTaskCategory, setNewTaskCategory] = useState('Prep');

  const completedCount = timeline.filter((t) => t.isCompleted).length;
  const totalCount = timeline.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleToggleTask = (id: string) => {
    const updated = timeline.map((task) => {
      if (task.id === id) {
        return { ...task, isCompleted: !task.isCompleted };
      }
      return task;
    });
    onUpdateTimeline(updated);
  };

  const handleDeleteTask = (id: string) => {
    const updated = timeline.filter((t) => t.id !== id);
    onUpdateTimeline(updated);
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;

    const newTask: PrepTask = {
      id: `task-${Date.now()}`,
      timeline: newTaskSection,
      task: newTaskText.trim(),
      category: newTaskCategory,
      isCompleted: false,
    };

    onUpdateTimeline([...timeline, newTask]);
    setNewTaskText('');
    setShowAddModal(false);
  };

  return (
    <div id="prep-timeline-view" className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <h2 className="text-base font-bold text-zinc-900">Host Prep Schedule & Run of Show</h2>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Stay calm and organized with timed milestones so you never rush when guests arrive.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="text-right">
              <span className="text-xs font-bold text-zinc-900 block">
                {completedCount} of {totalCount} Tasks Done
              </span>
              <span className="text-[10px] text-zinc-500">{progressPercent}% Completed</span>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold shadow-2xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Task</span>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-600 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Timeline Milestone Sections */}
      <div className="space-y-4">
        {TIMELINE_SECTIONS.map((section) => {
          const sectionTasks = timeline.filter((t) => t.timeline === section.key);
          if (sectionTasks.length === 0) return null;

          return (
            <div
              key={section.key}
              className={`rounded-2xl border ${section.color} p-4 sm:p-5 transition-all bg-white`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-zinc-600" />
                  <div>
                    <span className="font-bold text-sm text-zinc-900 block">{section.label}</span>
                    <span className="text-[11px] text-zinc-500">{section.sub}</span>
                  </div>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white border border-zinc-200 text-zinc-700">
                  {sectionTasks.filter((t) => t.isCompleted).length}/{sectionTasks.length} Done
                </span>
              </div>

              <div className="space-y-2 mt-2">
                {sectionTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`flex items-start justify-between p-3 rounded-xl border transition-all ${
                      task.isCompleted
                        ? 'bg-zinc-50/80 border-zinc-200 opacity-60'
                        : 'bg-white border-zinc-200 hover:border-zinc-300 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start space-x-3 flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => handleToggleTask(task.id)}
                        className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center transition-colors shrink-0 ${
                          task.isCompleted
                            ? 'bg-indigo-600 text-white'
                            : 'border border-zinc-300 hover:border-zinc-400 bg-white text-transparent'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>

                      <div className="min-w-0 flex-1">
                        <span
                          className={`text-xs font-semibold text-zinc-900 block ${
                            task.isCompleted ? 'line-through text-zinc-500' : ''
                          }`}
                        >
                          {task.task}
                        </span>
                        {task.category && (
                          <span className="text-[10px] text-zinc-500 font-medium mt-0.5 inline-block">
                            Category: {task.category}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteTask(task.id)}
                      className="text-zinc-400 hover:text-rose-600 p-1 rounded-lg transition-colors ml-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-zinc-200 shadow-xl space-y-4">
            <h3 className="font-bold text-sm text-zinc-900">Add Prep Task to Schedule</h3>

            <form onSubmit={handleAddTask} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                  Task Description
                </label>
                <input
                  type="text"
                  required
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  placeholder="e.g. Put beverages in cooler with ice water..."
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs font-medium text-zinc-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                    Timeline Milestone
                  </label>
                  <select
                    value={newTaskSection}
                    onChange={(e) => setNewTaskSection(e.target.value as PrepTask['timeline'])}
                    className="w-full px-2.5 py-2 rounded-xl border border-zinc-200 text-xs"
                  >
                    <option value="3_days_before">3 Days Before</option>
                    <option value="1_day_before">1 Day Before</option>
                    <option value="day_of_morning">Morning Of</option>
                    <option value="1_hour_before">1 Hour Before</option>
                    <option value="during_party">During Party</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={newTaskCategory}
                    onChange={(e) => setNewTaskCategory(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-zinc-200 text-xs"
                  >
                    <option value="Prep">Food / Drink Prep</option>
                    <option value="Shopping">Shopping & Pickup</option>
                    <option value="Decor">Decor & Setup</option>
                    <option value="Ambiance">Ambiance & Music</option>
                    <option value="Host">Host Logistics</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-2 rounded-xl border border-zinc-200 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
