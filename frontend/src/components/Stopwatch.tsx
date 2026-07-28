import { useState, useEffect } from 'react';
import { Play, Square, Timer, Save } from 'lucide-react';
import { useTimerStore } from '../store/useTimerStore';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

interface StopwatchProps {
    workOrderId: string;
}

export const Stopwatch = ({ workOrderId }: StopwatchProps) => {
    const { activeWorkOrderId, startTime, isRunning, startTimer, stopTimer, resetTimer } = useTimerStore();
    const [elapsed, setElapsed] = useState(0);
    const queryClient = useQueryClient();

    const isCurrentOrder = activeWorkOrderId === workOrderId;

    useEffect(() => {
        let interval: any;
        if (isRunning && isCurrentOrder && startTime) {
            interval = setInterval(() => {
                setElapsed(Math.floor((Date.now() - startTime) / 1000));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isRunning, isCurrentOrder, startTime]);

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const logTimeMutation = useMutation({
        mutationFn: async () => {
            const hours = elapsed / 3600;
            return api.post(`/work-orders/${workOrderId}/time`, {
                hoursLogged: hours,
                startTime: new Date(startTime!).toISOString(),
                endTime: new Date().toISOString(),
                description: "Mobile stopwatch entry"
            });
        },
        onSuccess: () => {
            resetTimer();
            queryClient.invalidateQueries({ queryKey: ['work-order', workOrderId] });
        }
    });

    return (
        <div className="glass-card p-6 border-primary/20 bg-primary/5">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Timer className="w-5 h-5 text-primary" />
                    <h3 className="font-bold uppercase tracking-widest text-[10px]">Work Timer</h3>
                </div>
                {isCurrentOrder && isRunning && (
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-green-500 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        RECORDING
                    </span>
                )}
            </div>

            <div className="text-4xl font-mono font-bold tracking-tighter mb-6 text-center">
                {isCurrentOrder ? formatTime(elapsed) : "00:00:00"}
            </div>

            <div className="flex gap-3">
                {!isRunning || !isCurrentOrder ? (
                    <button
                        onClick={() => startTimer(workOrderId)}
                        className="flex-1 bg-primary text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:brightness-110 transition-all active:scale-95 shadow-lg shadow-primary/20"
                    >
                        <Play className="w-4 h-4 fill-current" />
                        START WORK
                    </button>
                ) : (
                    <>
                        <button
                            onClick={stopTimer}
                            className="flex-1 bg-amber-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:brightness-110 transition-all active:scale-95"
                        >
                            <Square className="w-4 h-4 fill-current" />
                            PAUSE
                        </button>
                        <button
                            onClick={() => logTimeMutation.mutate()}
                            disabled={logTimeMutation.isPending}
                            className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:brightness-110 transition-all disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            {logTimeMutation.isPending ? 'LOGGING...' : 'SYNC LOG'}
                        </button>
                    </>
                )}
            </div>

            {isCurrentOrder && !isRunning && elapsed > 0 && (
                <p className="text-[10px] text-center text-muted-foreground mt-4 italic">
                    Timer paused at {formatTime(elapsed)}. Re-start or Sync to log to backend.
                </p>
            )}
        </div>
    );
};
