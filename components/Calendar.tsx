'use client';

import { useState, useEffect } from 'react';
import { CalendarEvent } from '../lib/api';

interface CalendarProps {
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  className?: string;
}

export default function Calendar({ events, onEventClick, className = '' }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');

  // Get current month and year
  const currentMonth = currentDate.toLocaleString('default', { month: 'long' });
  const currentYear = currentDate.getFullYear();

  // Generate calendar days for current month
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Get day of week for first day (0 = Sunday, 1 = Monday, etc.)
    const firstDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty days for previous month
    for (let i = 0; i < firstDayOfWeek; i++) {
      const date = new Date(year, month, -i);
      days.unshift({
        date,
        isCurrentMonth: false,
        isToday: false,
        events: [],
      });
    }
    
    // Add current month days
    const today = new Date();
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const dayEvents = events.filter(event => {
        const eventDate = new Date(event.date || event.start_date || '');
        return (
          eventDate.getDate() === date.getDate() &&
          eventDate.getMonth() === date.getMonth() &&
          eventDate.getFullYear() === date.getFullYear()
        );
      });
      
      days.push({
        date,
        isCurrentMonth: true,
        isToday: 
          date.getDate() === today.getDate() &&
          date.getMonth() === today.getMonth() &&
          date.getFullYear() === today.getFullYear(),
        events: dayEvents,
      });
    }
    
    // Fill remaining slots to complete 6 weeks (42 days total)
    const totalSlots = 42;
    const remainingSlots = totalSlots - days.length;
    
    for (let i = 1; i <= remainingSlots; i++) {
      const date = new Date(year, month + 1, i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        events: [],
      });
    }
    
    return days;
  };

  const calendarDays = getDaysInMonth();

  // Filter events for upcoming list
  const upcomingEvents = events
    .filter(event => {
      const eventDate = new Date(event.date || event.start_date || '');
      return eventDate >= new Date();
    })
    .sort((a, b) => {
      const dateA = new Date(a.date || a.start_date || '');
      const dateB = new Date(b.date || b.start_date || '');
      return dateA.getTime() - dateB.getTime();
    })
    .slice(0, 5);

  // Navigate to previous/next month
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  // Get event type color
  const getEventColor = (type: string) => {
    switch (type) {
      case 'meeting': return 'bg-blue-500';
      case 'event': return 'bg-purple-500';
      case 'issue': return 'bg-red-500';
      default: return 'bg-[#00d084]';
    }
  };

  // Format date for display
  const formatEventDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Format time for display
  const formatEventTime = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className={`bg-[#2a2a2a] rounded-xl ${className}`}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar View - 2/3 width */}
        <div className="lg:col-span-2 bg-[#1e1e1e] border border-[#3a3a3a] rounded-xl p-6">
          {/* Calendar Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">{currentMonth} {currentYear}</h2>
              <p className="text-[#808080] text-sm">Manage your schedule and events</p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg overflow-hidden">
                {['Month', 'Week', 'Day'].map((view) => (
                  <button
                    key={view}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      viewMode === view.toLowerCase() 
                        ? 'bg-[#00d084] text-white' 
                        : 'text-[#808080] hover:text-white'
                    }`}
                    onClick={() => setViewMode(view.toLowerCase() as any)}
                  >
                    {view}
                  </button>
                ))}
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-2 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg hover:bg-[#3a3a3a] transition-colors"
                >
                  ←
                </button>
                <button
                  onClick={() => setCurrentDate(new Date())}
                  className="px-4 py-2 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg hover:bg-[#3a3a3a] transition-colors text-sm"
                >
                  Today
                </button>
                <button
                  onClick={() => navigateMonth('next')}
                  className="p-2 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg hover:bg-[#3a3a3a] transition-colors"
                >
                  →
                </button>
              </div>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center py-2 text-sm font-semibold text-[#808080]">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => (
              <div
                key={index}
                className={`min-h-24 p-2 border border-[#3a3a3a] rounded-lg transition-all ${
                  !day.isCurrentMonth ? 'opacity-40' : ''
                } ${
                  day.isToday 
                    ? 'bg-[#00d084]/10 border-[#00d084]' 
                    : 'hover:bg-[#2a2a2a] hover:border-[#00d084]'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`text-sm font-medium ${
                    day.isToday ? 'text-[#00d084] font-bold' : 'text-white'
                  }`}>
                    {day.date.getDate()}
                  </span>
                  {day.isToday && (
                    <span className="text-xs px-2 py-0.5 bg-[#00d084] text-white rounded-full">
                      Today
                    </span>
                  )}
                </div>
                
                {/* Events for this day */}
                <div className="space-y-1">
                  {day.events.slice(0, 2).map((event, eventIndex) => (
                    <div
                      key={eventIndex}
                      className={`text-xs px-2 py-1 rounded ${getEventColor(event.type)} text-white truncate cursor-pointer hover:opacity-90 transition-opacity`}
                      onClick={() => onEventClick?.(event)}
                      title={event.title}
                    >
                      {event.title}
                    </div>
                  ))}
                  {day.events.length > 2 && (
                    <div className="text-xs text-[#808080] px-2">
                      +{day.events.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Events Sidebar - 1/3 width */}
        <div className="bg-[#1e1e1e] border border-[#3a3a3a] rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white">Upcoming Events</h3>
            <span className="text-sm text-[#808080]">
              {upcomingEvents.length} {upcomingEvents.length === 1 ? 'event' : 'events'}
            </span>
          </div>

          {upcomingEvents.length > 0 ? (
            <div className="space-y-4">
              {upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className={`p-4 rounded-lg border-l-4 ${
                    event.type === 'meeting' ? 'border-blue-500' :
                    event.type === 'event' ? 'border-purple-500' :
                    'border-red-500'
                  } bg-[#2a2a2a] hover:bg-[#3a3a3a] transition-colors cursor-pointer`}
                  onClick={() => onEventClick?.(event)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-white mb-1">{event.title}</h4>
                      <p className="text-xs text-[#808080] line-clamp-2">
                        {event.description || 'No description'}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      event.type === 'meeting' ? 'bg-blue-500/20 text-blue-300' :
                      event.type === 'event' ? 'bg-purple-500/20 text-purple-300' :
                      'bg-red-500/20 text-red-300'
                    }`}>
                      {event.type}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-[#808080] mt-3">
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{formatEventDate(event.date || event.start_date)}</span>
                    </div>
                    
                    {event.location && (
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{event.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#2a2a2a] flex items-center justify-center">
                <svg className="w-8 h-8 text-[#808080]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-[#808080]">No upcoming events</p>
              <p className="text-sm text-[#666] mt-1">Events you're invited to will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}