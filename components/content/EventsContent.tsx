// components/content/EventsContent.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/stores/authStore';
import { getEvents, createEvent, updateEvent, deleteEvent, Event } from '../../lib/api';

export default function EventsContent() {
  const { user, token } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    event_name: '',
    event_description: '',
    event_start_date: '',
    event_end_date: '',
    location: '',
  });

  useEffect(() => {
    if (token) {
      loadEvents();
    }
  }, [token]);

  useEffect(() => {
    filterEvents();
  }, [events, searchQuery, statusFilter]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await getEvents(token!);
      setEvents(data);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterEvents = () => {
    let filtered = [...events];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (event) =>
          event.event_name.toLowerCase().includes(query) ||
          event.event_description.toLowerCase().includes(query) ||
          event.location.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((event) => getEventStatus(event) === statusFilter);
    }

    setFilteredEvents(filtered);
  };

  const getEventStatus = (event: Event): string => {
    const now = new Date();
    const start = new Date(event.event_start_date);
    const end = new Date(event.event_end_date);

    if (now < start) return 'upcoming';
    if (now >= start && now <= end) return 'ongoing';
    return 'completed';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      day: date.getDate(),
      month: date.toLocaleString('en', { month: 'short' }).toUpperCase(),
      time: date.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }),
      fullDate: date.toLocaleDateString('en', { year: 'numeric', month: '2-digit', day: '2-digit' }),
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-[rgba(52,152,219,0.2)] text-[#3498db]';
      case 'ongoing': return 'bg-[rgba(0,208,132,0.2)] text-[#00d084]';
      case 'completed': return 'bg-[rgba(128,128,128,0.2)] text-[#808080]';
      default: return 'bg-[rgba(128,128,128,0.2)] text-[#808080]';
    }
  };

  const getDateBadgeColor = (index: number) => {
    const colors = ['#3498db', '#9b59b6', '#e67e22', '#e74c3c', '#00d084'];
    return colors[index % colors.length];
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      await createEvent(token, formData);
      setShowCreateModal(false);
      resetForm();
      loadEvents();
    } catch (error) {
      console.error('Failed to create event:', error);
      alert('Failed to create event. Please try again.');
    }
  };

  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedEvent) return;

    try {
      await updateEvent(token, selectedEvent.id, formData);
      setShowEditModal(false);
      resetForm();
      setSelectedEvent(null);
      loadEvents();
    } catch (error) {
      console.error('Failed to update event:', error);
      alert('Failed to update event. Please try again.');
    }
  };

  const handleDeleteEvent = async (eventId: number) => {
    if (!token) return;

    try {
      await deleteEvent(token, eventId);
      setDeleteConfirmId(null);
      loadEvents();
    } catch (error) {
      console.error('Failed to delete event:', error);
      alert('Failed to delete event. Please try again.');
    }
  };

  const openEditModal = (event: Event) => {
    setSelectedEvent(event);
    setFormData({
      event_name: event.event_name,
      event_description: event.event_description,
      event_start_date: event.event_start_date.slice(0, 16),
      event_end_date: event.event_end_date.slice(0, 16),
      location: event.location,
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      event_name: '',
      event_description: '',
      event_start_date: '',
      event_end_date: '',
      location: '',
    });
  };

  const isAdmin = user?.role === 'admin';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00d084]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Events</h1>
          <p className="text-[#808080]">Manage university club events</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-[#00d084] hover:bg-[#00b874] text-white rounded-lg font-medium transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 5v14m-7-7h14" />
            </svg>
            Create Event
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-[#1e1e1e] border border-[#3a3a3a] rounded-xl p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg text-white placeholder-[#808080] focus:outline-none focus:border-[#00d084]"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg text-white focus:outline-none focus:border-[#00d084]"
          >
            <option value="all">All Status</option>
            <option value="upcoming">Upcoming</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Events Grid */}
      {filteredEvents.length === 0 ? (
        <div className="bg-[#1e1e1e] border border-[#3a3a3a] rounded-xl p-12 text-center">
          <div className="text-[#808080] text-lg mb-2">No events found</div>
          <p className="text-[#606060]">
            {searchQuery || statusFilter !== 'all' 
              ? 'Try adjusting your filters' 
              : isAdmin 
                ? 'Create your first event to get started' 
                : 'Check back later for upcoming events'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event, index) => {
            const startDate = formatDate(event.event_start_date);
            const endDate = formatDate(event.event_end_date);
            const status = getEventStatus(event);

            return (
              <div
                key={event.id}
                className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl p-6 hover:border-[#00d084] transition-all duration-200 hover:-translate-y-1"
              >
                {/* Event Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className="w-16 h-16 rounded-xl flex flex-col items-center justify-center text-white font-bold"
                      style={{ backgroundColor: getDateBadgeColor(index) }}
                    >
                      <div className="text-2xl leading-none">{startDate.day}</div>
                      <div className="text-xs mt-1">{startDate.month}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-white mb-1 truncate">
                        {event.event_name}
                      </h3>
                      <p className="text-sm text-[#808080]">
                        {startDate.time}
                      </p>
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-2 ml-2">
                      <button
                        onClick={() => openEditModal(event)}
                        className="p-2 text-[#808080] hover:text-white hover:bg-[#3a3a3a] rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(event.id)}
                        className="p-2 text-[#808080] hover:text-[#e74c3c] hover:bg-[#3a3a3a] rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>

                {/* Description */}
                <p className="text-[#808080] text-sm mb-4 line-clamp-2">
                  {event.event_description}
                </p>

                {/* Location */}
                <div className="flex items-center gap-2 text-sm text-[#808080] mb-4">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span className="truncate">{event.location}</span>
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center pt-4 border-t border-[#3a3a3a]">
                  <div className="text-xs text-[#808080]">
                    Ends {endDate.time}
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-semibold ${getStatusColor(status)}`}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </span>
                </div>

                {/* Delete Confirmation */}
                {deleteConfirmId === event.id && (
                  <div className="mt-4 p-3 bg-[#1e1e1e] border border-[#e74c3c] rounded-lg">
                    <p className="text-sm text-white mb-3">Delete this event?</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        className="flex-1 px-3 py-1.5 bg-[#e74c3c] hover:bg-[#c0392b] text-white text-sm rounded-lg transition-colors"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="flex-1 px-3 py-1.5 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white text-sm rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e1e1e] border border-[#3a3a3a] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#3a3a3a] flex justify-between items-center">
              <h2 className="text-xl font-semibold text-white">Create New Event</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="text-[#808080] hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreateEvent} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Event Name <span className="text-[#e74c3c]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.event_name}
                  onChange={(e) => setFormData({ ...formData, event_name: e.target.value })}
                  className="w-full px-4 py-2 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg text-white focus:outline-none focus:border-[#00d084]"
                  placeholder="Enter event name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">Description</label>
                <textarea
                  value={formData.event_description}
                  onChange={(e) => setFormData({ ...formData, event_description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg text-white focus:outline-none focus:border-[#00d084] resize-none"
                  placeholder="Enter event description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Start Date & Time <span className="text-[#e74c3c]">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.event_start_date}
                    onChange={(e) => setFormData({ ...formData, event_start_date: e.target.value })}
                    className="w-full px-4 py-2 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg text-white focus:outline-none focus:border-[#00d084]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    End Date & Time <span className="text-[#e74c3c]">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.event_end_date}
                    onChange={(e) => setFormData({ ...formData, event_end_date: e.target.value })}
                    className="w-full px-4 py-2 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg text-white focus:outline-none focus:border-[#00d084]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Location <span className="text-[#e74c3c]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-2 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg text-white focus:outline-none focus:border-[#00d084]"
                  placeholder="Enter event location"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#00d084] hover:bg-[#00b874] text-white rounded-lg font-medium transition-colors"
                >
                  Create Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e1e1e] border border-[#3a3a3a] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#3a3a3a] flex justify-between items-center">
              <h2 className="text-xl font-semibold text-white">Edit Event</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedEvent(null);
                  resetForm();
                }}
                className="text-[#808080] hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleUpdateEvent} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Event Name <span className="text-[#e74c3c]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.event_name}
                  onChange={(e) => setFormData({ ...formData, event_name: e.target.value })}
                  className="w-full px-4 py-2 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg text-white focus:outline-none focus:border-[#00d084]"
                  placeholder="Enter event name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">Description</label>
                <textarea
                  value={formData.event_description}
                  onChange={(e) => setFormData({ ...formData, event_description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg text-white focus:outline-none focus:border-[#00d084] resize-none"
                  placeholder="Enter event description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Start Date & Time <span className="text-[#e74c3c]">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.event_start_date}
                    onChange={(e) => setFormData({ ...formData, event_start_date: e.target.value })}
                    className="w-full px-4 py-2 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg text-white focus:outline-none focus:border-[#00d084]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    End Date & Time <span className="text-[#e74c3c]">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.event_end_date}
                    onChange={(e) => setFormData({ ...formData, event_end_date: e.target.value })}
                    className="w-full px-4 py-2 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg text-white focus:outline-none focus:border-[#00d084]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Location <span className="text-[#e74c3c]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-2 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg text-white focus:outline-none focus:border-[#00d084]"
                  placeholder="Enter event location"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedEvent(null);
                    resetForm();
                  }}
                  className="px-4 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#00d084] hover:bg-[#00b874] text-white rounded-lg font-medium transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}