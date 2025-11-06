import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { User } from '../../lib/auth';
import { Calendar, Clock, MapPin, Users } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  event_time: string;
  location: string;
  created_by: string;
  created_at: string;
}

interface RSVP {
  id: string;
  event_id: string;
  user_id: string;
  status: 'going' | 'maybe' | 'not_going';
}

interface EventsProps {
  currentUser: User;
}

export function Events({ currentUser }: EventsProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [rsvps, setRsvps] = useState<Record<string, RSVP>>({});
  const [attendeeCounts, setAttendeeCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  async function loadEvents() {
    setLoading(true);
    try {
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: true });

      if (eventsError) throw eventsError;
      setEvents(eventsData || []);

      const { data: userRsvps } = await supabase
        .from('event_rsvps')
        .select('*')
        .eq('user_id', currentUser.id);

      const rsvpMap: Record<string, RSVP> = {};
      (userRsvps || []).forEach(rsvp => {
        rsvpMap[rsvp.event_id] = rsvp;
      });
      setRsvps(rsvpMap);

      const counts: Record<string, number> = {};
      for (const event of eventsData || []) {
        const { count } = await supabase
          .from('event_rsvps')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', event.id)
          .eq('status', 'going');

        counts[event.id] = count || 0;
      }
      setAttendeeCounts(counts);
    } catch (error) {
      console.error('Error loading events:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleRSVP(eventId: string, status: 'going' | 'maybe' | 'not_going') {
    try {
      const existingRsvp = rsvps[eventId];

      if (existingRsvp) {
        if (existingRsvp.status === status) {
          await supabase.from('event_rsvps').delete().eq('id', existingRsvp.id);
          const newRsvps = { ...rsvps };
          delete newRsvps[eventId];
          setRsvps(newRsvps);
        } else {
          await supabase
            .from('event_rsvps')
            .update({ status })
            .eq('id', existingRsvp.id);
          setRsvps({ ...rsvps, [eventId]: { ...existingRsvp, status } });
        }
      } else {
        const { data } = await supabase
          .from('event_rsvps')
          .insert({
            event_id: eventId,
            user_id: currentUser.id,
            status,
          })
          .select()
          .single();

        if (data) {
          setRsvps({ ...rsvps, [eventId]: data });
        }
      }

      loadEvents();
    } catch (error) {
      console.error('Error updating RSVP:', error);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Upcoming Events</h2>
        <p className="text-gray-600">Join community events and connect with other members</p>
      </div>

      {events.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <div className="text-6xl mb-4">📅</div>
          <h3 className="text-xl font-semibold mb-2">No upcoming events</h3>
          <p className="text-gray-600">Stay tuned for community events!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => {
            const userRsvp = rsvps[event.id];
            const attendeeCount = attendeeCounts[event.id] || 0;

            return (
              <div key={event.id} className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{event.title}</h3>
                <p className="text-gray-700 mb-4">{event.description}</p>

                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  <div className="flex items-center gap-3 text-gray-600">
                    <Calendar size={20} className="text-yellow-600" />
                    <div>
                      <p className="text-sm font-medium">Date</p>
                      <p className="text-sm">
                        {new Date(event.event_date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-gray-600">
                    <Clock size={20} className="text-yellow-600" />
                    <div>
                      <p className="text-sm font-medium">Time</p>
                      <p className="text-sm">{event.event_time}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-gray-600">
                    <MapPin size={20} className="text-yellow-600" />
                    <div>
                      <p className="text-sm font-medium">Location</p>
                      <p className="text-sm">{event.location}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 mb-4 pb-4 border-b">
                  <Users size={20} className="text-gray-400" />
                  <span className="text-gray-600">
                    {attendeeCount} {attendeeCount === 1 ? 'person' : 'people'} going
                  </span>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => handleRSVP(event.id, 'going')}
                    className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                      userRsvp?.status === 'going'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Going
                  </button>
                  <button
                    onClick={() => handleRSVP(event.id, 'maybe')}
                    className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                      userRsvp?.status === 'maybe'
                        ? 'bg-yellow-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Maybe
                  </button>
                  <button
                    onClick={() => handleRSVP(event.id, 'not_going')}
                    className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                      userRsvp?.status === 'not_going'
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Can't Go
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
