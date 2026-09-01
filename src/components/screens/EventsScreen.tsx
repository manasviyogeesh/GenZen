import React, { useState, useEffect } from 'react';
import { CampusEvent, ScreenType } from '../../types';
import { eventsService } from '../../services/eventsService';

interface EventsScreenProps {
  onNavigate: (screen: ScreenType) => void;
  onOpenCreateModal: () => void;
  onEventCreated?: () => void;
}

export const EventsScreen: React.FC<EventsScreenProps> = ({
  onNavigate,
  onOpenCreateModal,
  onEventCreated
}) => {
  // Current date state
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1); // 1-based month

  // Events and filtering state
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('All');
  const [registeredEventIds, setRegisteredEventIds] = useState<string[]>([]);
  const [registeredNotice, setRegisteredNotice] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CampusEvent | null>(null);

  // Fetch events when month/year changes - always from API
  useEffect(() => {
    let active = true;
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const fetchedEvents = await eventsService.getEventsByMonth(currentYear, currentMonth, true);
        if (active) {
          setEvents(fetchedEvents);
        }
      } catch (error) {
        console.error('Failed to fetch events:', error);
        if (active) {
          setEvents([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchEvents();

    return () => {
      active = false;
    };
  }, [currentYear, currentMonth]);

  // Generate calendar days for the current month
  const generateCalendarDays = () => {
    const firstDay = new Date(currentYear, currentMonth - 1, 1);
    const lastDay = new Date(currentYear, currentMonth, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.

    const days: Array<{ day: number | null }> = [];

    // Add empty cells for days before the 1st (Monday start)
    const mondayStart = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
    for (let i = 0; i < mondayStart; i++) {
      days.push({ day: null });
    }

    // Add actual days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({ day });
    }

    // Pad to complete the grid (42 cells = 6 rows)
    while (days.length < 42) {
      days.push({ day: null });
    }

    return days;
  };

  const calendarDays = generateCalendarDays();

  // Month names
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Navigation functions
  const goToPreviousMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
    setSelectedDay(null);
  };

  const goToNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
    setSelectedDay(null);
  };

  const goToToday = () => {
    const todayDate = new Date();
    setCurrentYear(todayDate.getFullYear());
    setCurrentMonth(todayDate.getMonth() + 1);
    setSelectedDay(todayDate.getDate());
  };

  const getEventForDay = (day: number) => {
    return events.find((e) => e.day === day && e.month === currentMonth && e.year === currentYear);
  };

  const filteredEvents = events.filter((e) => {
    const matchesCategory = activeCategoryFilter === 'All' || e.category === activeCategoryFilter;
    const matchesMonth = e.month === currentMonth && e.year === currentYear;
    const matchesDay = selectedDay === null || e.day === selectedDay;
    return matchesCategory && matchesMonth && matchesDay;
  });

  // Count events per day for current month only
  const getEventCountForDay = (day: number) => {
    return events.filter((e) => e.day === day && e.month === currentMonth && e.year === currentYear).length;
  };

  const toggleRegister = (eventId: string, title: string) => {
    if (registeredEventIds.includes(eventId)) {
      setRegisteredEventIds(registeredEventIds.filter(id => id !== eventId));
      setRegisteredNotice(`Cancelled RSVP for "${title}"`);
    } else {
      setRegisteredEventIds([...registeredEventIds, eventId]);
      setRegisteredNotice(`🎉 Successfully RSVP'd for "${title}"! Added to your schedule.`);
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
            {['All', 'Workshop', 'Hackathon', 'Networking'].map((cat) => (
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
              <h2 className="font-headline text-3xl font-bold text-white">
                {monthNames[currentMonth - 1]} {currentYear}
              </h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={goToToday}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-[#f0a878] hover:bg-white/5 transition-colors border border-[#f0a878]/30"
                >
                  Today
                </button>
                <div className="flex items-center gap-1">
                  <button
                    onClick={goToPreviousMonth}
                    className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 text-white/60 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                  </button>
                  <button
                    onClick={goToNextMonth}
                    className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 text-white/60 transition-colors"
                  >
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
                <span>Filtering by {monthNames[currentMonth - 1]} {selectedDay}, {currentYear}</span>
                <button
                  onClick={() => setSelectedDay(null)}
                  className="text-[#f0a878] hover:underline font-semibold"
                >
                  Show all {monthNames[currentMonth - 1]} events
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Events This Month List (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h3 className="font-headline text-2xl font-bold text-white">Events this {monthNames[currentMonth - 1]}</h3>
            <span className="text-xs text-white/50">{filteredEvents.length} events</span>
          </div>

          <div className="space-y-4 max-h-[640px] overflow-y-auto custom-scrollbar pr-1">
            {loading ? (
              <div className="glass-card rounded-2xl p-8 text-center text-white/50 text-sm">
                Loading events...
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="glass-card rounded-2xl p-8 text-center text-white/50 text-sm">
                No events found for this filter.
              </div>
            ) : (
              filteredEvents.map((evt) => {
                const isRegistered = registeredEventIds.includes(evt.id);
                return (
                  <div
                    key={evt.id}
                    onClick={() => setSelectedEvent(evt)}
                    className="glass-card rounded-2xl border border-white/10 overflow-hidden hover:border-[#c2652a]/40 transition-all p-4 flex gap-4 group cursor-pointer"
                  >
                    {/* Date Block */}
                    <div className="w-16 h-16 rounded-xl bg-white/5 flex-shrink-0 flex flex-col items-center justify-center border border-white/10 group-hover:border-[#c2652a]/30 transition-colors">
                      <span className="text-[11px] text-white/50 font-bold uppercase">{monthNames[currentMonth - 1].slice(0, 3)}</span>
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
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${evt.categoryColor}`}
                        >
                          {evt.category}
                        </span>

                        <button
                          onClick={() => toggleRegister(evt.id, evt.title)}
                          className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                            isRegistered
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-white/5 hover:bg-white/15 text-white'
                          }`}
                        >
                          {isRegistered ? 'Going ✓' : 'RSVP'}
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

      {/* Popup overlay */}
      {selectedEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6 animate-in fade-in"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="glass-card rounded-3xl p-6 md:p-8 max-w-lg w-full border border-white/10 shadow-2xl animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <span className={`text-[10px] font-bold uppercase tracking-wider border px-2 py-0.5 rounded ${selectedEvent.categoryColor}`}>{selectedEvent.category}</span>
                <h4 className="font-headline text-2xl font-bold text-white mt-2 leading-tight">{selectedEvent.title}</h4>
              </div>
              <button onClick={() => setSelectedEvent(null)} className="text-white/60 hover:text-white shrink-0" aria-label="Close"><span className="material-symbols-outlined text-xl">close</span></button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm mb-4">
              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <p className="text-white/40 text-xs uppercase font-bold">Date</p>
                <p className="text-white font-semibold">{monthNames[selectedEvent.month - 1]} {selectedEvent.day}, {selectedEvent.year}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <p className="text-white/40 text-xs uppercase font-bold">Time</p>
                <p className="text-white font-semibold">{selectedEvent.time}</p>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <p className="text-white/40 text-xs uppercase font-bold">Location</p>
                <p className="text-white font-semibold">{selectedEvent.location || 'TBD'}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <p className="text-white/40 text-xs uppercase font-bold">Description</p>
                <p className="text-white/80 leading-relaxed">{selectedEvent.description || 'No description provided.'}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <p className="text-white/40 text-xs uppercase font-bold">Attendees</p>
                <p className="text-white font-semibold">{selectedEvent.attendeesCount || 0} registered</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
