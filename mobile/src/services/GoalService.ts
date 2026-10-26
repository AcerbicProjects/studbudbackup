import apiClient from './apiClient';

export interface StudyGoal {
  _id: string;
  date: string; // local calendar date, YYYY-MM-DD
  text: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export const GoalService = {
  async list(from: string, to: string): Promise<StudyGoal[]> {
    const response = await apiClient.get<StudyGoal[]>('/goals', { params: { from, to } });
    return response.data;
  },

  async create(date: string, text: string): Promise<StudyGoal> {
    const response = await apiClient.post<StudyGoal>('/goals', { date, text });
    return response.data;
  },

  async update(id: string, params: { text?: string; completed?: boolean }): Promise<StudyGoal> {
    const response = await apiClient.patch<StudyGoal>(`/goals/${id}`, params);
    return response.data;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/goals/${id}`);
  },
};

export default GoalService;
