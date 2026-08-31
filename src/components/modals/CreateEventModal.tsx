import React, { useState } from 'react';
import { CampusEvent } from '../../types';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddEvent: (event: CampusEvent) => void | Promise<void>;
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({
  isOpen,
  onClose,
  onAddEvent
}) => {
  const [title, setTitle] = useState('');
  const [day, setDay] = useState(15);
  const [time, setTime] = useState('16:00 - 18:00');
  const [category, setCategory] = useState<'Workshop' | 'Networking' | 'Club Event' | 'Hackathon' | 'Career'>('Workshop');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsSubmitting(true);
    setSubmitError(null);

    const categoryColorMap: Record<string, { bg: string; dot: string }> = {
      Workshop: { bg: 'bg-[#c2652a]/20 text-[#f0a878] border-[#c2652a]/30', dot: '#f0a878' },
      Networking: { bg: 'bg-pink-500/20 text-pink-300 border-pink-500/30', dot: '#ec4899' },
      'Club Event': { bg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30', dot: '#06b6d4' },
      Hackathon: { bg: 'bg-amber-500/20 text-amber-300 border-amber-500/30', dot: '#f59e0b' },
      Career: { bg: 'bg-purple-500/20 text-purple-300 border-purple-500/30', dot: '#8b5cf6' }
    };

    const config = categoryColorMap[category] || categoryColorMap.Workshop;

    const newEvt: CampusEvent = {
      id: `evt-${Date.now()}`,
      day: Number(day),
      title: title.trim(),
      time,
      category,
      categoryColor: config.bg,
      dotColor: config.dot,
      location: location.trim() || 'Campus Center',
      description: description.trim() || undefined,
      attendeesCount: 1
    };

    try {
      await onAddEvent(newEvt);
      setTitle('');
      setLocation('');
      setDescription('');
      onClose();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Unable to publish event.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#16151b] border border-white/15 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center pb-3 border-b border-white/10">
          <div>
            <h3 className="font-headline text-2xl font-bold text-white">Create Campus Event</h3>
            <p className="text-xs text-white/50">Publish to the campus-wide calendar & pulse feed</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {submitError && <p role="alert" className="text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">{submitError}</p>}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-1">
              Event Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. AI & Robotics Lightning Talks"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-[#c2652a]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-1">
                Day of October
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={day}
                onChange={(e) => setDay(Math.max(1, Math.min(31, Number(e.target.value))))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#c2652a]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#c2652a]"
              >
                <option value="Workshop" className="bg-[#16151b]">Workshop</option>
                <option value="Hackathon" className="bg-[#16151b]">Hackathon</option>
                <option value="Networking" className="bg-[#16151b]">Networking</option>
                <option value="Club Event" className="bg-[#16151b]">Club Event</option>
                <option value="Career" className="bg-[#16151b]">Career</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-1">
                Time Window
              </label>
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="15:00 - 17:30"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#c2652a]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-1">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="CS Seminar Hall"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#c2652a]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-1">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide agenda or requirements..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-[#c2652a] resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-semibold text-white/70 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-[#c2652a] hover:bg-[#b05721] text-white rounded-xl text-sm font-bold shadow-md active:scale-95"
            >
              {isSubmitting ? 'Publishing…' : 'Publish Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
