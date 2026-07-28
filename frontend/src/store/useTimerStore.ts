import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TimerState {
    activeWorkOrderId: string | null;
    startTime: number | null; // Timestamp
    isRunning: boolean;

    // Actions
    startTimer: (workOrderId: string) => void;
    stopTimer: () => void;
    resetTimer: () => void;
}

export const useTimerStore = create<TimerState>()(
    persist(
        (set) => ({
            activeWorkOrderId: null,
            startTime: null,
            isRunning: false,

            startTimer: (workOrderId: string) => set({
                activeWorkOrderId: workOrderId,
                startTime: Date.now(),
                isRunning: true
            }),

            stopTimer: () => set({ isRunning: false }),

            resetTimer: () => set({
                activeWorkOrderId: null,
                startTime: null,
                isRunning: false
            }),
        }),
        {
            name: 'elite-timer-storage', // saves to localStorage so page refresh doesn't kill the timer
        }
    )
);
