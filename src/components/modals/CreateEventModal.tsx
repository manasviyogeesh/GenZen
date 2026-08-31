import React, { useState } from 'react';
import { CampusEvent } from '../../types';
import { eventsService } from '../../services/eventsService';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddEvent: (event: CampusEvent) => void;
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({
  isOpen,
  onClose,
  onAddEvent
}) => {
  const [title, setTitle] = useState('');
  const [day, setDay] = useState(15);
  const [month, setMonth] = useState(9); // September
  const [year, setYear] = useState(2026);
  const [time, setTime] = useState('16:00 - 18:00');
  const [startTime, setStartTime] = useState('16:00');
  const [endTime, setEndTime] = useState('18:00');
  const [category, setCategory] = useState<'Workshop' | 'Networking' | 'Club Event' | 'Hackathon' | 'Career'>('Workshop');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Format date as YYYY-MM-DD
      const eventDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      // Create event via API
      const newEvent = await eventsService.createEvent({
        title: title.trim(),
        description: description.trim() || undefined,
        event_date: eventDate,
        start_time: startTime || undefined,
        end_time: endTime || undefined,
        category,
        location: location.trim() || undefined,
        created_by: 'current_user', // TODO: Replace with actual user ID from auth
      });

      // Call parent callback with new event
      onAddEvent(newEvent);

      // Reset form and close
      setTitle('');
      setDay(15);
      setMonth(9);
      setYear(2026);
      setTime('16:00 - 18:00');
      setStartTime('16:00');
      setEndTime('18:00');
      setCategory('Workshop');
      setLocation('');
      setDescription('');
      onClose();
    } catch (err) {
      console.error('Failed to create event:', err);
      setError(err instanceof Error ? err.message : 'Failed to create event. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update time display when start/end times change
  const handleStartTimeChange = (value: string) => {
    setStartTime(value);
    setTime(`${value} - ${endTime}`);
  };

  const handleEndTimeChange = (value: string) => {
    setEndTime(value);
    setTime(`${startTime} - ${value}`);
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
            disabled={isSubmitting}
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {error && (
          <div className="px-4 py-3 bg-red-500/20 border border-red-500/40 text-red-200 rounded-xl text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-1">
                Day
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={day}
                onChange={(e) => setDay(Math.max(1, Math.min(31, Number(e.target.value))))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#c2652a]"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-1">
                Month
              </label>
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#c2652a]"
                disabled={isSubmitting}
              >
                <option value="1" className="bg-[#16151b]">Jan</option>
                <option value="2" className="bg-[#16151b]">Feb</option>
                <option value="3" className="bg-[#16151b]">Mar</option>
                <option value="4" className="bg-[#16151b]">Apr</option>
                <option value="5" className="bg-[#16151b]">May</option>
                <option value="6" className="bg-[#16151b]">Jun</option>
                <option value="7" className="bg-[#16151b]">Jul</option>
                <option value="8" className="bg-[#16151b]">Aug</option>
                <option value="9" className="bg-[#16151b]">Sep</option>
                <option value="10" className="bg-[#16151b]">Oct</option>
                <option value="11" className="bg-[#16151b]">Nov</option>
                <option value="12" className="bg-[#16151b]">Dec</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-1">
                Year
              </label>
              <input
                type="number"
                min="2026"
                max="2030"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#c2652a]"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-1">
                Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => handleStartTimeChange(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#c2652a]"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-1">
                End Time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => handleEndTimeChange(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#c2652a]"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#c2652a]"
                disabled={isSubmitting}
              >
                <option value="Workshop" className="bg-[#16151b]">Workshop</option>
                <option value="Hackathon" className="bg-[#16151b]">Hackathon</option>
                <option value="Networking" className="bg-[#16151b]">Networking</option>
                <option value="Club Event" className="bg-[#16151b]">Club Event</option>
                <option value="Career" className="bg-[#16151b]">Career</option>
              </select>
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
                disabled={isSubmitting}
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
              disabled={isSubmitting}
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-white/70 hover:text-white"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-[#c2652a] hover:bg-[#b05721] text-white rounded-xl text-sm font-bold shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Publish Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
