import type {
  ScheduleEvent,
  GetEventsQuery,
  ScheduleStats,
} from '@/types/schedule';
import { API_URL, getAuthHeader } from '@/lib/config';

export const userScheduleApi = {
  async getEvents(query?: GetEventsQuery): Promise<ScheduleEvent[]> {
    const params = new URLSearchParams();
    if (query?.from) params.append('from', query.from);
    if (query?.to) params.append('to', query.to);

    const response = await fetch(
      `${API_URL}/user/me/schedule/events?${params}`,
      { headers: getAuthHeader() }
    );

    if (!response.ok) throw new Error('Failed to fetch events');
    return response.json();
  },

  async getStats(weekStart?: string): Promise<ScheduleStats> {
    const params = new URLSearchParams();
    if (weekStart) params.append('weekStart', weekStart);

    const response = await fetch(
      `${API_URL}/user/me/schedule/stats?${params}`,
      { headers: getAuthHeader() }
    );

    if (!response.ok) throw new Error('Failed to fetch stats');
    return response.json();
  },
};
