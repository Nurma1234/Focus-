import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, Settings } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { AppLimit } from "@shared/schema";

const mockApps = [
  { name: "Instagram", icon: "📷", color: "bg-pink-500", used: 150, limit: 60 },
  { name: "TikTok", icon: "🎵", color: "bg-black", used: 45, limit: 60 },
  { name: "Facebook", icon: "👥", color: "bg-blue-500", used: 20, limit: 30 },
  { name: "YouTube", icon: "📺", color: "bg-red-500", used: 90, limit: 120 },
  { name: "Twitter", icon: "🐦", color: "bg-blue-400", used: 35, limit: 45 },
];

export default function AppLimitsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [blockingEnabled, setBlockingEnabled] = useState(false);

  const { data: appLimits, isLoading } = useQuery<AppLimit[]>({
    queryKey: ["/api/app-limits"],
  });

  const updateLimitMutation = useMutation({
    mutationFn: async ({ appName, newLimit }: { appName: string; newLimit: number }) => {
      // Find existing limit or create new one
      const existing = appLimits?.find(limit => limit.appName === appName);
      if (existing) {
        const response = await apiRequest("PUT", `/api/app-limits/${existing.id}`, {
          dailyLimitMinutes: newLimit
        });
        return response.json();
      } else {
        const app = mockApps.find(a => a.name === appName);
        const response = await apiRequest("POST", "/api/app-limits", {
          appName,
          appIcon: app?.icon || "📱",
          dailyLimitMinutes: newLimit,
          usedMinutesToday: app?.used || 0,
        });
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/app-limits"] });
      toast({
        title: "Лимит обновлен",
        description: "Новый лимит времени сохранен",
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить лимит",
        variant: "destructive",
      });
    },
  });

  const getLimitOptions = () => [
    { value: "30", label: "30 мин" },
    { value: "60", label: "1 час" },
    { value: "120", label: "2 часа" },
    { value: "180", label: "3 часа" },
    { value: "0", label: "Без лимита" },
  ];

  const getAppData = (appName: string) => {
    const savedLimit = appLimits?.find(limit => limit.appName === appName);
    const mockData = mockApps.find(app => app.name === appName);
    
    return {
      used: savedLimit?.usedMinutesToday || mockData?.used || 0,
      limit: savedLimit?.dailyLimitMinutes || mockData?.limit || 60,
      icon: savedLimit?.appIcon || mockData?.icon || "📱",
      color: mockData?.color || "bg-gray-500"
    };
  };

  const getStatusColor = (used: number, limit: number) => {
    if (limit === 0) return "text-gray-500";
    if (used > limit) return "text-red-500";
    if (used > limit * 0.8) return "text-orange-500";
    return "text-green-500";
  };

  const getStatusText = (used: number, limit: number) => {
    if (limit === 0) return `${used}мин сегодня (без лимита)`;
    if (used > limit) return `${used}мин сегодня (лимит: ${limit}мин)`;
    return `${used}мин сегодня (лимит: ${limit}мин)`;
  };

  // Calculate overview stats
  const overLimitApps = mockApps.filter(app => {
    const data = getAppData(app.name);
    return data.limit > 0 && data.used > data.limit;
  }).length;

  const withinLimitApps = mockApps.filter(app => {
    const data = getAppData(app.name);
    return data.limit === 0 || data.used <= data.limit;
  }).length;

  const totalOverageTime = mockApps.reduce((total, app) => {
    const data = getAppData(app.name);
    return total + (data.limit > 0 && data.used > data.limit ? (data.used - data.limit) / 60 : 0);
  }, 0);

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
          <h2 className="text-xl font-bold text-foreground">Лимиты приложений</h2>
        </div>
      </div>

      <div className="p-4">
        {/* Usage Overview */}
        <Card className="mb-6 bg-card border-border">
          <CardContent className="p-6">
            <h3 className="font-semibold text-foreground mb-4">Сегодня</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-red-500/10 rounded-lg">
                <div className="text-2xl font-bold text-red-500">
                  {totalOverageTime > 0 ? `${totalOverageTime.toFixed(1)}ч` : overLimitApps}
                </div>
                <div className="text-sm text-red-400">Превышено</div>
              </div>
              <div className="text-center p-4 bg-brand-green/10 rounded-lg">
                <div className="text-2xl font-bold text-brand-green">{withinLimitApps}</div>
                <div className="text-sm text-brand-green">В пределах нормы</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Apps List */}
        <div className="space-y-3 mb-6">
          {mockApps.map((app) => {
            const appData = getAppData(app.name);
            
            return (
              <Card key={app.name} className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <div className={`w-10 h-10 ${appData.color} rounded-xl flex items-center justify-center mr-3 text-white text-lg`}>
                        {appData.icon}
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{app.name}</div>
                        <div className={`text-sm ${getStatusColor(appData.used, appData.limit)}`}>
                          {getStatusText(appData.used, appData.limit)}
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Label className="text-sm text-foreground">Лимит:</Label>
                    <Select
                      value={appData.limit.toString()}
                      onValueChange={(value) => {
                        updateLimitMutation.mutate({
                          appName: app.name,
                          newLimit: parseInt(value)
                        });
                      }}
                    >
                      <SelectTrigger className="w-[140px] bg-input border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        {getLimitOptions().map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Notification Settings */}
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <h3 className="font-semibold text-foreground mb-4">Настройки уведомлений</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-foreground">Напоминать через 15 минут</span>
                <Switch
                  checked={notificationsEnabled}
                  onCheckedChange={setNotificationsEnabled}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-foreground">Блокировать при превышении</span>
                <Switch
                  checked={blockingEnabled}
                  onCheckedChange={setBlockingEnabled}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
