import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { 
  CalendarCheck, 
  Smartphone, 
  BookOpen, 
  Timer,
  Rocket,
  Settings
} from "lucide-react";

export default function DashboardPage() {
  const [, setLocation] = useLocation();

  const { data: timerStats } = useQuery({
    queryKey: ["/api/timer-stats/today"],
  });

  const features = [
    {
      title: "Привычки",
      description: "Планирование и напоминания",
      icon: CalendarCheck,
      color: "bg-brand-green/10 text-brand-green",
      path: "/habits"
    },
    {
      title: "Лимиты",
      description: "Контроль приложений",
      icon: Smartphone,
      color: "bg-blue-50 text-blue-500",
      path: "/app-limits"
    },
    {
      title: "Дневник",
      description: "Мысли и рефлексия",
      icon: BookOpen,
      color: "bg-purple-50 text-purple-500",
      path: "/feedback"
    },
    {
      title: "Помодоро",
      description: "25 мин фокуса",
      icon: Timer,
      color: "bg-orange-50 text-orange-500",
      path: "/study-timer"
    }
  ];

  const currentTime = new Date().toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="min-h-screen pb-20 bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Rocket className="text-brand-green text-xl mr-3" />
              <h1 className="text-xl font-bold text-foreground">ProductivityPal</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-muted-foreground">
                {currentTime}
              </div>
              <button className="text-muted-foreground hover:text-foreground">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <div className="p-4">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">Добро пожаловать!</h2>
          <p className="text-muted-foreground">Выберите раздел для работы с вашими целями</p>
        </div>

        {/* Main Features - Vertical Layout */}
        <div className="space-y-4 mb-6">
          {features.map((feature) => (
            <Card 
              key={feature.title}
              className="cursor-pointer hover:shadow-md transition-shadow bg-card border-border"
              onClick={() => setLocation(feature.path)}
            >
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className={`w-12 h-12 ${feature.color} rounded-xl flex items-center justify-center mr-4`}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Stats */}
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <h3 className="font-semibold text-foreground mb-4">Сегодня</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-brand-green">
                  {(timerStats as any)?.sessions || 0}
                </div>
                <div className="text-xs text-muted-foreground">Помодоро</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-500">
                  {timerStats ? `${Math.floor((timerStats as any).focusMinutes / 60)}:${((timerStats as any).focusMinutes % 60).toString().padStart(2, '0')}` : '0:00'}
                </div>
                <div className="text-xs text-muted-foreground">Фокус</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-500">
                  {(timerStats as any)?.breakMinutes || 0}м
                </div>
                <div className="text-xs text-muted-foreground">Отдыха</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
