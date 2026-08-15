import React, { useState, useEffect } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  Sparkles,
  AlertCircle,
  Tag,
  Hourglass,
  Check,
  Share2,
} from 'lucide-react';
import { PrepTask } from '../types';

interface PrepTimelineViewProps {
  timeline: PrepTask[];
  onUpdateTimeline: (updated: PrepTask[]) => void;
  eventDate?: string;
  eventTime?: string;
  onUpdateEventDateTime?: (date: string, time: string) => void;
}

const TIMELINE_SECTIONS: {
  key: PrepTask['timeline'];
  label: string;
  sub: string;
  badge: string;
  color: string;
}[] = [
  {
    key: '1_week_before',
    label: '1 Week Before',
    sub: 'Confirm RSVPs, order specialty decor, check pantry staples',
    badge: 'Early Planning',
    color: 'border-purple-200 bg-purple-50/30',
  },
  {
    key: '3_days_before',
    label: '3 Days Before',
    sub: 'Non-perishables, dry goods, tableware & bulk party supplies',
    badge: 'Supply Run',
    color: 'border-blue-200 bg-blue-50/30',
  },
  {
    key: '1_day_before',
    label: '1 Day Before',
    sub: 'Chill drinks, marinate meats, prep batch dips & sound system',
    badge: 'Pre-Chill & Prep',
    color: 'border-indigo-200 bg-indigo-50/30',
  },
  {
    key: 'day_of_morning',
    label: 'Morning of Event',
    sub: 'Pick up fresh ice, bakery goods & slice cocktail garnishes',
    badge: 'Day-Of Run',
    color: 'border-amber-200 bg-amber-50/30',
  },
  {
    key: '1_hour_before',
    label: '1 Hour Before (Final Touch)',
    sub: 'Light candles, start music playlist, fill ice bucket & warm food',
    badge: 'Host Ready',
    color: 'border-rose-200 bg-rose-50/30',
  },
  {
    key: 'during_party',
    label: 'During the Party',
    sub: 'Trash checks, punch bowl top-up, enjoy hosting your guests!',
    badge: 'Live Event',
    color: 'border-emerald-200 bg-emerald-50/30',
  },
  {
    key: 'after_party',
    label: 'After the Party',
    sub: 'Package leftovers in airtight containers, wipe counters, compost recyclables',
    badge: 'Pack Up',
    color: 'border-zinc-200 bg-zinc-50/30',
  },
];

export const PrepTimelineView: React.FC<PrepTimelineViewProps> = ({
  timeline,
  onUpdateTimeline,
  eventDate = new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
  eventTime = '18:00',
  onUpdateEventDateTime,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskSection, setNewTaskSection] = useState<PrepTask['timeline']>('1_day_before');
  const [newTaskCategory, setNewTaskCategory] = useState('Prep');
  const [selectedDate, setSelectedDate] = useState(eventDate);
  const [selectedTime, setSelectedTime] = useState(eventTime);
  const [countdownText, setCountdownText] = useState<string>('');

  useEffect(() => {
    const updateCountdown = () => {
      const target = new Date(`${selectedDate}T${selectedTime}`);
      const now = new Date();
      const diffMs = target.getTime() - now.getTime();

      if (isNaN(diffMs)) {
        setCountdownText('Event scheduled');
        return;
      }

      if (diffMs <= 0) {
        setCountdownText('🎉 Party is in progress or completed!');
        return;
      }

      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setCountdownText(`${days}d ${hours}h ${minutes}m until party start!`);
      } else {
        setCountdownText(`${hours}h ${minutes}m until party start!`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, [selectedDate, selectedTime]);

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

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const d = e.target.value;
    setSelectedDate(d);
    onUpdateEventDateTime?.(d, selectedTime);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = e.target.value;
    setSelectedTime(t);
    onUpdateEventDateTime?.(selectedDate, t);
  };

  return (
    <div id="prep-timeline-view" className="space-y-6">
      {/* Top Header Card with Countdown Timer */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-zinc-200 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-emerald-700" />
              <h2 className="text-base font-bold text-zinc-900">
                Host Prep Schedule & Run of Show Timeline
              </h2>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Stay calm and organized with timed milestones so you never rush when guests arrive.
            </p>
          </div>

          {/* Event Date/Time Picker & Live Countdown */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2 bg-zinc-50 border border-zinc-200 p-2 rounded-xl text-xs">
              <span className="font-semibold text-zinc-600">Event Time:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={handleDateChange}
                className="bg-white border border-zinc-200 rounded-lg px-2 py-1 text-xs font-semibold text-zinc-900"
              />
              <input
                type="time"
                value={selectedTime}
                onChange={handleTimeChange}
                className="bg-white border border-zinc-200 rounded-lg px-2 py-1 text-xs font-semibold text-zinc-900"
              />
            </div>

            <div className="flex items-center space-x-2 bg-emerald-50 border border-emerald-300 px-3 py-2 rounded-xl text-xs font-bold text-emerald-950">
              <Hourglass className="w-4 h-4 text-emerald-700 animate-pulse" />
              <span>{countdownText}</span>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Custom Task</span>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5 pt-2 border-t border-zinc-100">
          <div className="flex justify-between text-xs font-semibold text-zinc-600">
            <span>Milestone Readiness Progress</span>
            <span>
              {completedCount} of {totalCount} Tasks Done ({progressPercent}%)
            </span>
          </div>
          <div className="w-full h-2.5 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200">
            <div
              className="h-full bg-emerald-600 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
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
                        className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center transition-colors shrink-0 cursor-pointer ${
                          task.isCompleted
                            ? 'bg-emerald-600 text-white'
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
                      className="text-zinc-400 hover:text-rose-600 p-1 rounded-lg transition-colors ml-2 cursor-pointer"
                      title="Delete task"
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
                    <option value="1_week_before">1 Week Before</option>
                    <option value="3_days_before">3 Days Before</option>
                    <option value="1_day_before">1 Day Before</option>
                    <option value="day_of_morning">Morning Of</option>
                    <option value="1_hour_before">1 Hour Before</option>
                    <option value="during_party">During Party</option>
                    <option value="after_party">After Party</option>
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
                  className="px-3.5 py-2 rounded-xl border border-zinc-200 text-xs font-medium text-zinc-600 hover:bg-zinc-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold cursor-pointer"
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
