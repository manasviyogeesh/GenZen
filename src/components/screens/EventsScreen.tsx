import React, { useState } from 'react';
import { CampusEvent, ScreenType } from '../../types';

interface EventsScreenProps {
  events: CampusEvent[];
  onNavigate: (screen: ScreenType) => void;
  onOpenCreateModal: () => void;
  onToggleRsvp?: (eventId: string, title: string, registered: boolean) => Promise<void>;
  searchQuery?: string;
}

export const EventsScreen: React.FC<EventsScreenProps> = ({
  events,
  onNavigate,
  onOpenCreateModal,
  onToggleRsvp,
  searchQuery = ''
}) => {
  const [selectedDay, setSelectedDay] = useState<number | null>(2);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('All');
  const [registeredEventIds, setRegisteredEventIds] = useState<string[]>(['evt-2']);
  const [registeredNotice, setRegisteredNotice] = useState<string | null>(null);
  const [isRsvpPending, setIsRsvpPending] = useState<string | null>(null);

  // Month days structure for October (Starts on Sunday = Day 1)
  // Mon: - , Tue: - , Wed: - , Thu: - , Fri: - , Sat: - , Sun: 1
  const calendarDays = [
    { day: null }, { day: null }, { day: null }, { day: null }, { day: null }, { day: null }, { day: 1 },
    { day: 2 }, { day: 3 }, { day: 4 }, { day: 5 }, { day: 6 }, { day: 7 }, { day: 8 },
    { day: 9 }, { day: 10 }, { day: 11 }, { day: 12 }, { day: 13 }, { day: 14 }, { day: 15 },
    { day: 16 }, { day: 17 }, { day: 18 }, { day: 19 }, { day: 20 }, { day: 21 }, { day: 22 },
    { day: 23 }, { day: 24 }, { day: 25 }, { day: 26 }, { day: 27 }, { day: 28 }, { day: 29 },
    { day: 30 }, { day: 31 }, { day: null }, { day: null }, { day: null }, { day: null }, { day: null }
  ];

  const getEventForDay = (day: number) => {
    return events.find((e) => e.day === day);
  };

  const filteredEvents = events.filter((e) => {
    const matchesCategory = activeCategoryFilter === 'All' || e.category === activeCategoryFilter;
    const matchesSearch = !searchQuery.trim() || `${e.title} ${e.category} ${e.location ?? ''}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDay = selectedDay === null || e.day === selectedDay;
    return matchesCategory && matchesSearch && (selectedDay === null ? true : matchesDay);
  });

  const toggleRegister = async (eventId: string, title: string) => {
    const registered = registeredEventIds.includes(eventId);
    setIsRsvpPending(eventId);
    try {
      if (onToggleRsvp) await onToggleRsvp(eventId, title, registered);
      if (registered) {
        setRegisteredEventIds((ids) => ids.filter(id => id !== eventId));
        setRegisteredNotice(`Cancelled RSVP for "${title}"`);
      } else {
        setRegisteredEventIds((ids) => [...ids, eventId]);
        setRegisteredNotice(`🎉 Successfully RSVP'd for "${title}"! Added to your schedule.`);
      }
    } catch (error) {
      setRegisteredNotice(error instanceof Error ? error.message : 'Unable to update RSVP.');
    } finally {
      setIsRsvpPending(null);
    }
    setTimeout(() => setRegisteredNotice(null), 3000);
  };

  return (
    <div className="flex-1 min-h-screen p-6 md:p-10 lg:p-12 max-w-7xl mx-auto space-y-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <span className="font-label text-xs tracking-widest uppercase text-[#f0a878] font-bold mb-2 block">
            Campus Events
          </span>
          <h1 className="font-headline text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-2 tracking-tight">
            What's happening?
          </h1>
          <p className="font-body text-white/60 text-lg max-w-xl">
            Find events, hackathons and opportunities across campus.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {['All', 'Workshop', 'Hackathon', 'Networking', 'Club Event', 'Career'].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeCategoryFilter === cat
                    ? 'bg-[#c2652a] text-white shadow-sm'
                    : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <button
            onClick={onOpenCreateModal}
            className="px-5 py-2.5 rounded-xl bg-[#c2652a] hover:bg-[#b05721] text-white transition-all shadow-md flex items-center gap-2 text-sm font-semibold shrink-0 active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Create Event
          </button>
        </div>
      </div>

      {registeredNotice && (
        <div className="px-4 py-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 rounded-xl text-sm flex items-center gap-2 animate-in fade-in">
          <span className="material-symbols-outlined text-emerald-400 text-lg">check_circle</span>
          <span>{registeredNotice}</span>
        </div>
      )}

      {/* Bento Grid: 8 Cols Calendar + 4 Cols Event List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Calendar View (8 cols) */}
        <div className="lg:col-span-8">
          <div className="glass-card rounded-3xl p-6 md:p-8 flex flex-col border border-white/10">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-headline text-3xl font-bold text-white">October 2023</h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedDay(2)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-[#f0a878] hover:bg-white/5 transition-colors border border-[#f0a878]/30"
                >
                  Today
                </button>
                <div className="flex items-center gap-1">
                  <button onClick={() => { setSelectedDay(null); setActiveCategoryFilter('All'); }} aria-label="Previous month" className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 text-white/60 transition-colors">
                    <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                  </button>
                  <button onClick={() => { setSelectedDay(null); setActiveCategoryFilter('All'); }} aria-label="Next month" className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 text-white/60 transition-colors">
                    <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-2 mb-3 text-center">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                <div key={day} className="text-xs font-bold uppercase tracking-wider text-white/40">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Dates Grid */}
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((cell, idx) => {
                if (cell.day === null) {
                  return <div key={idx} className="min-h-[76px] p-2 rounded-2xl border border-transparent"></div>;
                }

                const dayEvent = getEventForDay(cell.day);
                const isSelected = selectedDay === cell.day;

                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedDay(isSelected ? null : cell.day)}
                    className={`min-h-[76px] p-2.5 rounded-2xl transition-all cursor-pointer relative flex flex-col justify-between ${
                      isSelected
                        ? 'border-2 border-[#c2652a] bg-[#c2652a]/20 shadow-lg'
                        : 'border border-white/10 hover:border-white/30 bg-white/[0.02] hover:bg-white/[0.05]'
                    }`}
                  >
                    <span
                      className={`text-sm font-body ${
                        isSelected ? 'font-bold text-[#fbe8d8]' : 'text-white/70'
                      }`}
                    >
                      {cell.day}
                    </span>

                    {dayEvent && (
                      <div className="flex items-center gap-1 mt-auto">
                        <span
                          className="w-2 h-2 rounded-full shrink-0 shadow-sm"
                          style={{ backgroundColor: dayEvent.dotColor }}
                        ></span>
                        <span className="text-[10px] text-white/80 font-medium truncate hidden sm:inline">
                          {dayEvent.category}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {selectedDay !== null && (
              <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-white/60">
                <span>Filtering by October {selectedDay}, 2023</span>
                <button
                  onClick={() => setSelectedDay(null)}
                  className="text-[#f0a878] hover:underline font-semibold"
                >
                  Show all October events
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Events This October List (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h3 className="font-headline text-2xl font-bold text-white">Events this October</h3>
            <span className="text-xs text-white/50">{filteredEvents.length} events</span>
          </div>

          <div className="space-y-4 max-h-[640px] overflow-y-auto custom-scrollbar pr-1">
            {filteredEvents.length === 0 ? (
              <div className="glass-card rounded-2xl p-8 text-center text-white/50 text-sm">
                No events found for this filter.
              </div>
            ) : (
              filteredEvents.map((evt) => {
                const isRegistered = registeredEventIds.includes(evt.id);
                return (
                  <div
                    key={evt.id}
                    className="glass-card rounded-2xl border border-white/10 overflow-hidden hover:border-[#c2652a]/40 transition-all p-4 flex gap-4 group"
                  >
                    {/* Date Block */}
                    <div className="w-16 h-16 rounded-xl bg-white/5 flex-shrink-0 flex flex-col items-center justify-center border border-white/10 group-hover:border-[#c2652a]/30 transition-colors">
                      <span className="text-[11px] text-white/50 font-bold uppercase">Oct</span>
                      <span className="font-headline text-2xl font-bold leading-none" style={{ color: evt.dotColor }}>
                        {evt.day}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <h4 className="font-headline font-bold text-lg text-white leading-snug mb-1 group-hover:text-[#f0a878] transition-colors">
                          {evt.title}
                        </h4>
                        <p className="text-xs text-white/60 flex items-center gap-1.5 mb-2">
                          <span className="material-symbols-outlined text-[14px]">schedule</span>
                          <span>{evt.time}</span>
                        </p>
                        {evt.location && <p className="text-xs text-white/45 flex items-center gap-1.5 mb-2"><span className="material-symbols-outlined text-[14px]">location_on</span><span className="truncate">{evt.location}</span></p>}
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${evt.categoryColor}`}
                        >
                          {evt.category}
                        </span>

                        <button
                          onClick={() => void toggleRegister(evt.id, evt.title)}
                          disabled={isRsvpPending === evt.id}
                          className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                            isRegistered
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-white/5 hover:bg-white/15 text-white'
                          }`}
                        >
                          {isRsvpPending === evt.id ? 'Saving…' : isRegistered ? 'Going ✓' : 'RSVP'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
