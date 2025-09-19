
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, MapPin, Users, Plus, Search, Filter } from 'lucide-react';
import { EventCard } from '@/components/events/EventCard';
import { EventDetailsModal } from '@/components/events/EventDetailsModal';
import { useOptimizedEvents } from '@/hooks/useOptimizedEvents';
import { Event } from '@/services/eventService';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';
import { CreateEventModal } from '@/components/events/CreateEventModal';

export const EventCalendar = () => {
  const [view, setView] = useState<'month' | 'week' | 'list'>('month');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');
  const [showUpcomingOnly, setShowUpcomingOnly] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEventDetails, setShowEventDetails] = useState(false);

  const filters = {
    upcoming: showUpcomingOnly,
    // Add more filters as needed
  };

  const { events, loading, refresh } = useOptimizedEvents(filters);

  const filteredEvents = events.filter(event => {
    const matchesSearch = !searchQuery || 
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = eventTypeFilter === 'all' || event.event_type === eventTypeFilter;
    
    return matchesSearch && matchesType;
  });

  const eventsByDate = filteredEvents.reduce((acc, event) => {
    const dateKey = format(new Date(event.start_time), 'yyyy-MM-dd');
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(event);
    return acc;
  }, {} as Record<string, typeof events>);

  const handleEventClick = (event: Event) => {
    setSelectedEventId(event.id);
    setShowEventDetails(true);
  };

  const handleEventCreated = () => {
    setShowCreateModal(false);
    refresh();
  };

  const handleEventUpdated = () => {
    refresh();
  };

  const handleEventDeleted = () => {
    setShowEventDetails(false);
    setSelectedEventId(null);
    refresh();
  };

  const renderCalendarGrid = () => {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Add days from previous month to fill the first week
    const firstDayOfWeek = monthStart.getDay();
    const prevMonthDays = [];
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const day = new Date(monthStart);
      day.setDate(day.getDate() - i - 1);
      prevMonthDays.push(day);
    }

    // Add days from next month to fill the last week
    const lastDayOfWeek = monthEnd.getDay();
    const nextMonthDays = [];
    for (let i = 1; i <= 6 - lastDayOfWeek; i++) {
      const day = new Date(monthEnd);
      day.setDate(day.getDate() + i);
      nextMonthDays.push(day);
    }

    const allDays = [...prevMonthDays, ...calendarDays, ...nextMonthDays];

    return (
      <div className="grid grid-cols-7 gap-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground border-b">
            {day}
          </div>
        ))}
        
        {allDays.map((day, index) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayEvents = eventsByDate[dateKey] || [];
          const isCurrentMonth = isSameMonth(day, selectedDate);
          const isDayToday = isToday(day);
          
          return (
            <div 
              key={index} 
              className={`min-h-24 p-1 border border-border ${
                isCurrentMonth ? 'bg-card' : 'bg-muted/50'
              } ${isDayToday ? 'bg-primary/10 border-primary/50' : ''}`}
            >
              <div className={`text-sm mb-1 ${
                isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'
              } ${isDayToday ? 'font-bold text-primary' : ''}`}>
                {format(day, 'd')}
              </div>
              <div className="space-y-1">
                {dayEvents.slice(0, 2).map((event) => (
                  <div
                    key={event.id}
                    className="text-xs p-1 bg-primary/20 text-primary rounded truncate cursor-pointer hover:bg-primary/30 transition-colors"
                    onClick={() => handleEventClick(event)}
                    title={event.title}
                  >
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 2 && (
                  <div className="text-xs text-muted-foreground">
                    +{dayEvents.length - 2} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">Event Calendar</h1>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-2">
            <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="study_session">Study</SelectItem>
                <SelectItem value="social">Social</SelectItem>
                <SelectItem value="career">Career</SelectItem>
                <SelectItem value="academic">Academic</SelectItem>
                <SelectItem value="sports">Sports</SelectItem>
                <SelectItem value="workshop">Workshop</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant={showUpcomingOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setShowUpcomingOnly(!showUpcomingOnly)}
            >
              <Filter className="h-4 w-4 mr-1" />
              Upcoming Only
            </Button>
          </div>

          {/* View Toggle */}
          <div className="flex items-center border rounded-lg p-1">
            <Button
              variant={view === 'month' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('month')}
            >
              Month
            </Button>
            <Button
              variant={view === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('list')}
            >
              List
            </Button>
          </div>

          <Button 
            className="bg-primary hover:bg-primary/90"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Event
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Calendar/Events List */}
        <div className="xl:col-span-3">
          {view === 'month' ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{format(selectedDate, 'MMMM yyyy')}</span>
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1))}
                    >
                      &lt;
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedDate(new Date())}
                    >
                      Today
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1))}
                    >
                      &gt;
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderCalendarGrid()}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">
                {searchQuery ? `Search Results (${filteredEvents.length})` : 'Events'}
              </h2>
              {loading ? (
                <div className="grid gap-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-6">
                        <div className="space-y-3">
                          <div className="h-4 bg-muted rounded w-3/4"></div>
                          <div className="h-3 bg-muted rounded w-1/2"></div>
                          <div className="h-3 bg-muted rounded w-2/3"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filteredEvents.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No events found</h3>
                    <p className="text-muted-foreground mb-4">
                      {searchQuery ? 'Try adjusting your search terms' : 'No events match your current filters'}
                    </p>
                    <Button onClick={() => setShowCreateModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Event
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {filteredEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onEventClick={handleEventClick}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Event
              </Button>
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => {
                  setEventTypeFilter('all');
                  setShowUpcomingOnly(false);
                  setSearchQuery('');
                }}
              >
                <Calendar className="h-4 w-4 mr-2" />
                All Events
              </Button>
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => {
                  setEventTypeFilter('all');
                  setShowUpcomingOnly(true);
                  setSearchQuery('');
                }}
              >
                <Users className="h-4 w-4 mr-2" />
                Upcoming Events
              </Button>
            </CardContent>
          </Card>

          {/* Event Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Event Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Study Sessions</span>
                <Badge variant="secondary">
                  {events.filter(e => e.event_type === 'study_session').length}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Social Events</span>
                <Badge variant="secondary">
                  {events.filter(e => e.event_type === 'social').length}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Career Events</span>
                <Badge variant="secondary">
                  {events.filter(e => e.event_type === 'career').length}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Academic</span>
                <Badge variant="secondary">
                  {events.filter(e => e.event_type === 'academic').length}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Events</span>
                <Badge variant="secondary">
                  {events.length}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <CreateEventModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onEventCreated={handleEventCreated}
      />

      <EventDetailsModal
        eventId={selectedEventId}
        open={showEventDetails}
        onClose={() => {
          setShowEventDetails(false);
          setSelectedEventId(null);
        }}
        onEventUpdated={handleEventUpdated}
        onEventDeleted={handleEventDeleted}
      />
    </div>
  );
};
