import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, WandSparkles, Bell, Info, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Habit } from "@shared/schema";

const scheduleFormSchema = z.object({
  workSchedule: z.string().min(1, "Расскажите о своем рабочем/учебном графике"),
  extraActivities: z.string().optional(),
  goals: z.string().min(1, "Укажите ваши цели и интересы"),
});

type ScheduleFormData = z.infer<typeof scheduleFormSchema>;

interface GeneratedScheduleItem {
  title: string;
  schedule: string;
  color: string;
}

export default function HabitsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [generatedSchedule, setGeneratedSchedule] = useState<GeneratedScheduleItem[]>([]);
  const [showSchedule, setShowSchedule] = useState(false);

  const { data: habits, isLoading } = useQuery<Habit[]>({
    queryKey: ["/api/habits"],
  });

  const form = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      workSchedule: "",
      extraActivities: "",
      goals: "",
    },
  });

  const generateScheduleMutation = useMutation({
    mutationFn: async (data: ScheduleFormData) => {
      const response = await apiRequest("POST", "/api/habits/generate-schedule", data);
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedSchedule(data.schedule);
      setShowSchedule(true);
      toast({
        title: "Расписание создано!",
        description: "Ваше персональное расписание готово",
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось создать расписание",
        variant: "destructive",
      });
    },
  });

  const saveHabitsMutation = useMutation({
    mutationFn: async () => {
      const promises = generatedSchedule.map(item =>
        apiRequest("POST", "/api/habits", {
          title: item.title,
          description: "",
          schedule: JSON.stringify({
            type: "text",
            value: item.schedule,
            color: item.color
          }),
          reminderMinutes: 20,
          isActive: true,
        })
      );
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      toast({
        title: "Привычки сохранены!",
        description: "Расписание добавлено в ваши привычки",
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить привычки",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ScheduleFormData) => {
    generateScheduleMutation.mutate(data);
  };

  // Weekly schedule component
  const WeeklySchedule = ({ habits }: { habits: Habit[] }) => {
    const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    const timeSlots = [
      '6:00', '7:00', '8:00', '9:00', '10:00', '11:00', '12:00',
      '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'
    ];

    const getHabitForTimeSlot = (day: string, time: string) => {
      return habits.find(habit => {
        try {
          const scheduleData = JSON.parse(habit.schedule);
          const schedule = scheduleData.value || habit.schedule;
          return schedule.toLowerCase().includes(day.toLowerCase()) && 
                 schedule.includes(time.split(':')[0]);
        } catch {
          return false;
        }
      });
    };

    return (
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="flex items-center mb-4">
            <Calendar className="w-5 h-5 text-brand-green mr-2" />
            <h3 className="font-semibold text-foreground">Недельное расписание</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr>
                  <th className="text-left p-2 text-muted-foreground text-sm font-medium">Время</th>
                  {days.map(day => (
                    <th key={day} className="text-center p-2 text-muted-foreground text-sm font-medium w-20">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map(time => (
                  <tr key={time} className="border-t border-border">
                    <td className="p-2 text-sm text-muted-foreground font-medium">{time}</td>
                    {days.map(day => {
                      const habit = getHabitForTimeSlot(day, time);
                      return (
                        <td key={`${day}-${time}`} className="p-1">
                          {habit ? (
                            <div 
                              className="text-xs p-2 rounded text-center text-white font-medium"
                              style={{ 
                                backgroundColor: JSON.parse(habit.schedule).color || '#10B981'
                              }}
                              title={habit.title}
                            >
                              {habit.title.length > 8 ? habit.title.substring(0, 8) + '...' : habit.title}
                            </div>
                          ) : (
                            <div className="h-8"></div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    );
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
          <h2 className="text-xl font-bold text-foreground">Управление привычками</h2>
        </div>
      </div>

      <div className="p-4">
        {/* Weekly Schedule Table */}
        {habits && habits.length > 0 && (
          <div className="mb-6">
            <WeeklySchedule habits={habits} />
          </div>
        )}

        {/* Existing Habits List */}
        {habits && habits.length > 0 && (
          <Card className="mb-6 bg-card border-border">
            <CardContent className="p-6">
              <h3 className="font-semibold text-foreground mb-4">Ваши привычки</h3>
              <div className="space-y-3">
                {habits.map((habit) => {
                  let scheduleData;
                  try {
                    scheduleData = JSON.parse(habit.schedule);
                  } catch {
                    scheduleData = { value: habit.schedule, color: "#10B981" };
                  }
                  
                  return (
                    <div key={habit.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-3"
                          style={{ backgroundColor: scheduleData.color || "#10B981" }}
                        ></div>
                        <div>
                          <div className="font-medium text-foreground">{habit.title}</div>
                          <div className="text-sm text-muted-foreground">{scheduleData.value}</div>
                        </div>
                      </div>
                      <Bell className="w-4 h-4 text-muted-foreground" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Schedule Input Form */}
        <Card className="mb-6 bg-card border-border">
          <CardContent className="p-6">
            <h3 className="font-semibold text-foreground mb-4">Расскажите о своих делах</h3>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="workSchedule" className="text-foreground">Учеба/Работа</Label>
                <Input
                  id="workSchedule"
                  placeholder="Например: школа с 8 до 14, пн-пт"
                  className="bg-input border-border text-foreground"
                  {...form.register("workSchedule")}
                />
                {form.formState.errors.workSchedule && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.workSchedule.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="extraActivities" className="text-foreground">Дополнительные занятия</Label>
                <Input
                  id="extraActivities"
                  placeholder="Например: допы в пн, ср, пт с 16 до 18"
                  className="bg-input border-border text-foreground"
                  {...form.register("extraActivities")}
                />
              </div>

              <div>
                <Label htmlFor="goals" className="text-foreground">Цели и хобби</Label>
                <Textarea
                  id="goals"
                  placeholder="Например: хочу ходить в зал, читать книги, изучать английский"
                  rows={3}
                  className="bg-input border-border text-foreground"
                  {...form.register("goals")}
                />
                {form.formState.errors.goals && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.goals.message}
                  </p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full bg-brand-green hover:bg-brand-green-dark text-white"
                disabled={generateScheduleMutation.isPending}
              >
                <WandSparkles className="w-4 h-4 mr-2" />
                {generateScheduleMutation.isPending ? "Создаём..." : "Создать расписание"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Generated Schedule */}
        {showSchedule && generatedSchedule.length > 0 && (
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <h3 className="font-semibold text-foreground mb-4">Ваше персональное расписание</h3>
              <div className="space-y-4 mb-6">
                {generatedSchedule.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-3"
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <div>
                        <div className="font-medium text-foreground">{item.title}</div>
                        <div className="text-sm text-muted-foreground">{item.schedule}</div>
                      </div>
                    </div>
                    <Bell className="w-4 h-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
              
              <div className="p-4 bg-brand-green/10 rounded-lg mb-4">
                <div className="flex items-center">
                  <Info className="w-4 h-4 text-brand-green mr-2" />
                  <span className="text-sm text-brand-green font-medium">
                    Напоминания будут приходить за 20 минут до каждого события
                  </span>
                </div>
              </div>

              <Button 
                onClick={() => saveHabitsMutation.mutate()}
                className="w-full bg-brand-green hover:bg-brand-green-dark text-white"
                disabled={saveHabitsMutation.isPending}
              >
                {saveHabitsMutation.isPending ? "Сохраняем..." : "Сохранить расписание"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
