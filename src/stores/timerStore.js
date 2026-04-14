import { create } from 'zustand';
import api from '../services/api';

export const useTimerStore = create((set, get) => ({
  activeTimer: null, // { patientId, patientName, startTime }
  isRunning: false,
  elapsedSeconds: 0,
  tickInterval: null,

  startTimer: async (patientId, patientName) => {
    try {
      const response = await api.post('/time/start', { patientId });
      const startTime = new Date(response.data.started_at);
      
      const initialElapsed = Math.floor((new Date() - startTime) / 1000);
      
      const interval = setInterval(() => {
        set((state) => ({ 
          elapsedSeconds: Math.floor((new Date() - startTime) / 1000) 
        }));
      }, 1000);

      set({ 
        activeTimer: { patientId, patientName, startTime },
        isRunning: true,
        elapsedSeconds: initialElapsed > 0 ? initialElapsed : 0,
        tickInterval: interval
      });
    } catch (error) {
      console.error('Failed to start timer:', error);
      throw error;
    }
  },

  syncTimer: async () => {
    // Check if there is an active timer on the server (could be implemented later if needed)
    // For now, we assume frontend state is primary for the session
  },

  stopTimer: () => {
    const { tickInterval } = get();
    if (tickInterval) clearInterval(tickInterval);
    set({ 
      activeTimer: null, 
      isRunning: false, 
      elapsedSeconds: 0, 
      tickInterval: null 
    });
  }
}));
