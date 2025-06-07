import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, Brain, Coffee, Play, Pause, RotateCcw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

type TimerMode = 'focus' | 'break';

interface TimerState {
  timeLeft: number;
  isRunning: boolean;
  mode: TimerMode;
}

export default function StudyTimerPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const [timer, setTimer] = useState<TimerState>({
    timeLeft: 1500, // 25 minutes
    isRunning: false,
    mode: 'focus'
  });

  const [settings, setSettings] = useState({
    focusTime: 1500, // 25 minutes
    breakTime: 300,  // 5 minutes
    soundEnabled: true
  });

  const { data: timerStats } = useQuery({
    queryKey: ["/api/timer-stats/today"],
  });

  const saveSessionMutation = useMutation({
    mutationFn: async (sessionData: { type: TimerMode; duration: number; completed: boolean }) => {
      const response = await apiRequest("POST", "/api/timer-sessions", sessionData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/timer-stats/today"] });
    },
  });

  useEffect(() => {
    if (timer.isRunning && timer.timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimer(prev => {
          if (prev.timeLeft <= 1) {
            // Timer finished
            const duration = timer.mode === 'focus' ? settings.focusTime : settings.breakTime;
            saveSessionMutation.mutate({
              type: timer.mode,
              duration,
              completed: true
            });

            // Show notification
            if (settings.soundEnabled) {
              // In a real app, this would play a sound
              toast({
                title: timer.mode === 'focus' ? "Время отдыха!" : "Время сосредоточиться!",
                description: timer.mode === 'focus' ? "Сделайте перерыв" : "Время для фокусировки",
              });
            }

            // Auto-switch modes
            const newMode: TimerMode = timer.mode === 'focus' ? 'break' : 'focus';
            const newTime = newMode === 'focus' ? settings.focusTime : settings.breakTime;
            
            return {
              timeLeft: newTime,
              isRunning: false,
              mode: newMode
            };
          }
          return { ...prev, timeLeft: prev.timeLeft - 1 };
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timer.isRunning, timer.timeLeft, timer.mode, settings, saveSessionMutation, toast]);

  const toggleTimer = () => {
    if (timer.isRunning) {
      // Pause - save partial session
      const duration = (timer.mode === 'focus' ? settings.focusTime : settings.breakTime) - timer.timeLeft;
      if (duration > 30) { // Only save if timer ran for more than 30 seconds
        saveSessionMutation.mutate({
          type: timer.mode,
          duration,
          completed: false
        });
      }
    }
    
    setTimer(prev => ({ ...prev, isRunning: !prev.isRunning }));
  };

  const resetTimer = () => {
    setTimer(prev => ({
      ...prev,
      timeLeft: prev.mode === 'focus' ? settings.focusTime : settings.breakTime,
      isRunning: false
    }));
  };

  const setTimerMode = (mode: TimerMode) => {
    setTimer({
      timeLeft: mode === 'focus' ? settings.focusTime : settings.breakTime,
      isRunning: false,
      mode
    });
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    const totalTime = timer.mode === 'focus' ? settings.focusTime : settings.breakTime;
    return ((totalTime - timer.timeLeft) / totalTime) * 100;
  };

  const updateSettings = (key: string, value: number | boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    
    // Update current timer if not running
    if (!timer.isRunning) {
      if (key === 'focusTime' && timer.mode === 'focus') {
        setTimer(prev => ({ ...prev, timeLeft: value as number }));
      } else if (key === 'breakTime' && timer.mode === 'break') {
        setTimer(prev => ({ ...prev, timeLeft: value as number }));
      }
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-40">
        <div className="px-4 py-4 flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/dashboard")}
            className="mr-4 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-xl font-bold text-foreground">Помодоро таймер</h2>
        </div>
      </div>

      <div className="p-4 text-center">
        {/* Timer Display */}
        <Card className="mb-8 bg-card border-border">
          <CardContent className="p-8">
            {/* Mode Toggle */}
            <div className="mb-6">
              <div className="inline-flex bg-muted rounded-full p-1 mb-6">
                <Button
                  variant={timer.mode === 'focus' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setTimerMode('focus')}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                    timer.mode === 'focus' 
                      ? 'bg-brand-green text-white hover:bg-brand-green-dark' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Brain className="w-4 h-4 mr-2" />
                  Фокус
                </Button>
                <Button
                  variant={timer.mode === 'break' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setTimerMode('break')}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                    timer.mode === 'break' 
                      ? 'bg-blue-500 text-white hover:bg-blue-600' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Coffee className="w-4 h-4 mr-2" />
                  Отдых
                </Button>
              </div>
            </div>

            {/* Timer Display */}
            <div className="mb-8">
              <div className="text-6xl font-bold text-foreground mb-2">
                {formatTime(timer.timeLeft)}
              </div>
              <div className="text-muted-foreground">
                {timer.mode === 'focus' ? 'Время для концентрации' : 'Время для отдыха'}
              </div>
            </div>

            {/* Timer Controls */}
            <div className="flex justify-center space-x-4 mb-6">
              <Button
                onClick={toggleTimer}
                size="lg"
                className={`w-20 h-20 rounded-full text-2xl shadow-lg ${
                  timer.mode === 'focus' 
                    ? 'bg-brand-green hover:bg-brand-green-dark' 
                    : 'bg-blue-500 hover:bg-blue-600'
                } text-white`}
              >
                {timer.isRunning ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
              </Button>
              <Button
                onClick={resetTimer}
                variant="outline"
                size="lg"
                className="w-16 h-16 rounded-full text-xl"
              >
                <RotateCcw className="w-6 h-6" />
              </Button>
            </div>

            {/* Progress Ring */}
            <div className="relative w-64 h-64 mx-auto">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background circle */}
                <circle 
                  cx="50" 
                  cy="50" 
                  r="45" 
                  stroke="#E5E7EB" 
                  strokeWidth="8" 
                  fill="none"
                />
                {/* Progress circle */}
                <circle 
                  cx="50" 
                  cy="50" 
                  r="45" 
                  stroke={timer.mode === 'focus' ? "#10B981" : "#3B82F6"}
                  strokeWidth="8" 
                  fill="none" 
                  strokeLinecap="round" 
                  strokeDasharray="283" 
                  strokeDashoffset={283 - (getProgress() / 100) * 283}
                  className="transition-all duration-1000 ease-linear"
                />
              </svg>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <Card className="mb-6 bg-card border-border">
          <CardContent className="p-6">
            <h3 className="font-semibold text-foreground mb-4">Статистика сегодня</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-brand-green">
                  {(timerStats as any)?.sessions || 0}
                </div>
                <div className="text-sm text-muted-foreground">Помодоро</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-500">
                  {timerStats ? `${Math.floor((timerStats as any).focusMinutes / 60)}:${((timerStats as any).focusMinutes % 60).toString().padStart(2, '0')}` : '0:00'}
                </div>
                <div className="text-sm text-muted-foreground">Фокус</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-500">
                  {(timerStats as any)?.breakMinutes || 0}м
                </div>
                <div className="text-sm text-muted-foreground">Отдыха</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <h3 className="font-semibold text-foreground mb-4">Настройки</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-foreground">Время фокуса</span>
                <Select
                  value={settings.focusTime.toString()}
                  onValueChange={(value) => updateSettings('focusTime', parseInt(value))}
                >
                  <SelectTrigger className="w-[120px] bg-input border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="1500">25 мин</SelectItem>
                    <SelectItem value="1800">30 мин</SelectItem>
                    <SelectItem value="2700">45 мин</SelectItem>
                    <SelectItem value="3000">50 мин</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-foreground">Время отдыха</span>
                <Select
                  value={settings.breakTime.toString()}
                  onValueChange={(value) => updateSettings('breakTime', parseInt(value))}
                >
                  <SelectTrigger className="w-[120px] bg-input border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="300">5 мин</SelectItem>
                    <SelectItem value="600">10 мин</SelectItem>
                    <SelectItem value="900">15 мин</SelectItem>
                    <SelectItem value="1200">20 мин</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-foreground">Звуковые уведомления</span>
                <Switch
                  checked={settings.soundEnabled}
                  onCheckedChange={(checked) => updateSettings('soundEnabled', checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
