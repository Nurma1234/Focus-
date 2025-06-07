import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import StartPage from "@/pages/start";
import DashboardPage from "@/pages/dashboard";
import HabitsPage from "@/pages/habits";
import AppLimitsPage from "@/pages/app-limits";
import FeedbackPage from "@/pages/feedback";
import StudyTimerPage from "@/pages/study-timer";
import BottomNav from "@/components/bottom-nav";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={StartPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/habits" component={HabitsPage} />
      <Route path="/app-limits" component={AppLimitsPage} />
      <Route path="/feedback" component={FeedbackPage} />
      <Route path="/study-timer" component={StudyTimerPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background text-foreground">
          <Router />
          <BottomNav />
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
