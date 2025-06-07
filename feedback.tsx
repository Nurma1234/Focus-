import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Calendar, Plus, MoreHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { JournalEntry } from "@shared/schema";

const entryFormSchema = z.object({
  content: z.string().min(1, "Напишите что-нибудь").max(1000, "Слишком длинная запись"),
});

type EntryFormData = z.infer<typeof entryFormSchema>;

export default function FeedbackPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const { data: entries, isLoading } = useQuery<JournalEntry[]>({
    queryKey: ["/api/journal-entries"],
  });

  const form = useForm<EntryFormData>({
    resolver: zodResolver(entryFormSchema),
    defaultValues: {
      content: "",
    },
  });

  const addEntryMutation = useMutation({
    mutationFn: async (data: EntryFormData) => {
      const response = await apiRequest("POST", "/api/journal-entries", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journal-entries"] });
      form.reset();
      toast({
        title: "Запись добавлена!",
        description: "Ваша мысль сохранена в дневнике",
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось добавить запись",
        variant: "destructive",
      });
    },
  });

  const deleteEntryMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/journal-entries/${id}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journal-entries"] });
      toast({
        title: "Запись удалена",
        description: "Запись была удалена из дневника",
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить запись",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EntryFormData) => {
    addEntryMutation.mutate(data);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getMonthName = (date: Date) => {
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long'
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
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
          <h2 className="text-xl font-bold text-foreground">Дневник мыслей</h2>
        </div>
      </div>

      <div className="p-4">
        {/* New Entry Form */}
        <Card className="mb-6 bg-card border-border">
          <CardContent className="p-6">
            <h3 className="font-semibold text-foreground mb-4">Новая запись</h3>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="mb-4">
                <Textarea
                  placeholder="Что у вас на уме? Поделитесь своими мыслями, целями или переживаниями..."
                  rows={4}
                  className="resize-none bg-input border-border text-foreground"
                  {...form.register("content")}
                />
                {form.formState.errors.content && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.content.message}
                  </p>
                )}
              </div>
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {getCurrentDate()}
                </div>
                <Button 
                  type="submit" 
                  className="bg-brand-green hover:bg-brand-green-dark text-white"
                  disabled={addEntryMutation.isPending}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {addEntryMutation.isPending ? "Добавляем..." : "Добавить"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Entries List */}
        <div className="space-y-4 mb-8">
          {isLoading ? (
            <Card className="bg-card border-border">
              <CardContent className="p-6 text-center text-muted-foreground">
                Загружаем записи...
              </CardContent>
            </Card>
          ) : entries && entries.length > 0 ? (
            entries.map((entry) => (
              <Card key={entry.id} className="bg-card border-border">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <div className="text-sm text-muted-foreground flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {formatDate(entry.createdAt!)}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => deleteEntryMutation.mutate(entry.id)}
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-foreground leading-relaxed">{entry.content}</p>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="bg-card border-border">
              <CardContent className="p-6 text-center text-muted-foreground">
                <div className="mb-4">
                  <Calendar className="w-12 h-12 mx-auto text-muted" />
                </div>
                <p>У вас пока нет записей в дневнике</p>
                <p className="text-sm">Создайте первую запись выше</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Month Navigation */}
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigateMonth('prev')}
                className="text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="font-semibold text-foreground">
                {getMonthName(currentMonth)}
              </span>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigateMonth('next')}
                className="text-muted-foreground hover:text-foreground"
                disabled={currentMonth.getTime() >= new Date().getTime()}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
