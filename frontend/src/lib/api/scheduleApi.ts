import type {
  ScheduleEvent,
  CreateScheduleEventRequest,
  RescheduleEventRequest,
  GetEventsQuery,
  ScheduleStats,
  StartCallResponse,
} from '@/types/schedule';
import { API_URL, getAuthHeader } from '@/lib/config';

export const scheduleApi = {
  async getEvents(query?: GetEventsQuery): Promise<ScheduleEvent[]> {
    const params = new URLSearchParams();
    if (query?.from) params.append('from', query.from);
    if (query?.to) params.append('to', query.to);

    const response = await fetch(
      `${API_URL}/trainer/me/schedule/events?${params}`,
      {
        headers: getAuthHeader(),
      }
    );

    if (!response.ok) throw new Error('Failed to fetch events');
    return response.json();
  },

  async getEvent(id: string): Promise<ScheduleEvent> {
    const response = await fetch(
      `${API_URL}/trainer/me/schedule/events/${id}`,
      {
        headers: getAuthHeader(),
      }
    );

    if (!response.ok) throw new Error('Failed to fetch event');
    return response.json();
  },

  async createEvent(
    data: CreateScheduleEventRequest
  ): Promise<ScheduleEvent> {
    const response = await fetch(`${API_URL}/trainer/me/schedule/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create event');
    }
    return response.json();
  },

  async rescheduleEvent(
    id: string,
    data: RescheduleEventRequest
  ): Promise<ScheduleEvent> {
    const response = await fetch(
      `${API_URL}/trainer/me/schedule/events/${id}/reschedule`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to reschedule event');
    }
    return response.json();
  },

  async updateEvent(
    id: string,
    data: CreateScheduleEventRequest
  ): Promise<ScheduleEvent> {
    const response = await fetch(
      `${API_URL}/trainer/me/schedule/events/${id}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update event');
    }
    return response.json();
  },

  async cancelEvent(id: string): Promise<void> {
    const response = await fetch(
      `${API_URL}/trainer/me/schedule/events/${id}`,
      {
        method: 'DELETE',
        headers: getAuthHeader(),
      }
    );

    if (!response.ok) throw new Error('Failed to cancel event');
  },

  async startCall(id: string): Promise<StartCallResponse> {
    const response = await fetch(
      `${API_URL}/trainer/me/schedule/events/${id}/start-call`,
      {
        method: 'POST',
        headers: getAuthHeader(),
      }
    );

    if (!response.ok) throw new Error('Failed to start call');
    return response.json();
  },

  async getStats(weekStart?: string): Promise<ScheduleStats> {
    const params = new URLSearchParams();
    if (weekStart) params.append('weekStart', weekStart);

    const response = await fetch(
      `${API_URL}/trainer/me/schedule/stats?${params}`,
      {
        headers: getAuthHeader(),
      }
    );

    if (!response.ok) throw new Error('Failed to fetch stats');
    return response.json();
  },
};
