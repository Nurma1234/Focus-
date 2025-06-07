import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Rocket } from "lucide-react";

export default function StartPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-black to-gray-900">
      <div className="text-center text-white mb-12">
        <div className="mb-6">
          <Rocket className="w-24 h-24 mx-auto mb-4 opacity-90" />
        </div>
        <h1 className="text-4xl font-bold mb-4">ProductivityPal</h1>
        <p className="text-lg opacity-90 max-w-sm mx-auto">
          Умный помощник для создания привычек, контроля времени и достижения целей
        </p>
      </div>
      
      <Button 
        onClick={() => setLocation("/dashboard")}
        className="bg-brand-green text-white px-12 py-4 rounded-full text-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 hover:bg-brand-green-light"
      >
        <Rocket className="w-6 h-6 mr-3" />
        Начать
      </Button>
      
      <div className="mt-12 text-center text-white opacity-75">
        <p className="text-sm">Версия 1.0 • Создано для продуктивности</p>
      </div>
    </div>
  );
}
