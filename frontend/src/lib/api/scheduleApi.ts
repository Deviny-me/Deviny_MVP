import type {
  ScheduleEvent,
  CreateScheduleEventRequest,
  RescheduleEventRequest,
  GetEventsQuery,
  ScheduleStats,
  StartCallResponse,
} from '@/types/schedule';

const API_URL = 'http://localhost:5000/api';

export const scheduleApi = {
  async getEvents(query?: GetEventsQuery): Promise<ScheduleEvent[]> {
    const token = localStorage.getItem('accessToken');
    const params = new URLSearchParams();
    if (query?.from) params.append('from', query.from);
    if (query?.to) params.append('to', query.to);

    const response = await fetch(
      `${API_URL}/trainer/me/schedule/events?${params}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) throw new Error('Failed to fetch events');
    return response.json();
  },

  async getEvent(id: string): Promise<ScheduleEvent> {
    const token = localStorage.getItem('accessToken');

    const response = await fetch(
      `${API_URL}/trainer/me/schedule/events/${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) throw new Error('Failed to fetch event');
    return response.json();
  },

  async createEvent(
    data: CreateScheduleEventRequest
  ): Promise<ScheduleEvent> {
    const token = localStorage.getItem('accessToken');

    const response = await fetch(`${API_URL}/trainer/me/schedule/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
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
    const token = localStorage.getItem('accessToken');

    const response = await fetch(
      `${API_URL}/trainer/me/schedule/events/${id}/reschedule`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
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
    const token = localStorage.getItem('accessToken');

    const response = await fetch(
      `${API_URL}/trainer/me/schedule/events/${id}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
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
    const token = localStorage.getItem('accessToken');

    const response = await fetch(
      `${API_URL}/trainer/me/schedule/events/${id}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) throw new Error('Failed to cancel event');
  },

  async startCall(id: string): Promise<StartCallResponse> {
    const token = localStorage.getItem('accessToken');

    const response = await fetch(
      `${API_URL}/trainer/me/schedule/events/${id}/start-call`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) throw new Error('Failed to start call');
    return response.json();
  },

  async getStats(weekStart?: string): Promise<ScheduleStats> {
    const token = localStorage.getItem('accessToken');
    const params = new URLSearchParams();
    if (weekStart) params.append('weekStart', weekStart);

    const response = await fetch(
      `${API_URL}/trainer/me/schedule/stats?${params}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) throw new Error('Failed to fetch stats');
    return response.json();
  },
};
