import { useLocation } from "wouter";
import { Home, CalendarCheck, Smartphone, Timer } from "lucide-react";

export default function BottomNav() {
  const [location, setLocation] = useLocation();

  // Only show navigation on main app pages, not on start page
  if (location === "/") {
    return null;
  }

  const navItems = [
    {
      icon: Home,
      label: "Главная",
      path: "/dashboard",
    },
    {
      icon: CalendarCheck,
      label: "Привычки",
      path: "/habits",
    },
    {
      icon: Smartphone,
      label: "Лимиты",
      path: "/app-limits",
    },
    {
      icon: Timer,
      label: "Таймер",
      path: "/study-timer",
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="grid grid-cols-4 h-16">
        {navItems.map((item) => {
          const isActive = location === item.path;
          
          return (
            <button
              key={item.path}
              onClick={() => setLocation(item.path)}
              className={`flex flex-col items-center justify-center transition-colors ${
                isActive 
                  ? "text-brand-green" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <item.icon className="w-5 h-5 mb-1" />
              <span className="text-xs">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
