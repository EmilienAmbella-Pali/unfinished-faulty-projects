import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { BinForm } from "@/components/bin-form";
import { CalendarView } from "@/components/calendar-view";
import { Loader2, Plus, LogOut } from "lucide-react";
import type { Bin, Collection } from "@shared/schema";

export default function HomePage() {
  const { user, logoutMutation } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());

  const { data: bins, isLoading: binsLoading } = useQuery<Bin[]>({
    queryKey: ['/api/bins'],
  });

  const { data: collections } = useQuery<Collection[]>({
    queryKey: ['/api/collections'],
    enabled: !!bins?.length,
  });

  const deleteBinMutation = useMutation({
    mutationFn: async (binId: number) => {
      await apiRequest('DELETE', `/api/bins/${binId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bins'] });
    },
  });

  if (binsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">SmartBin</h1>
          <div className="flex items-center gap-4">
            <span>Welcome, {user?.username}</span>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Bin
                </Button>
              </DialogTrigger>
              <DialogContent>
                <BinForm />
              </DialogContent>
            </Dialog>
            <Button 
              variant="outline"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <CalendarView
          bins={bins || []}
          collections={collections || []}
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
          onDeleteBin={(id) => deleteBinMutation.mutate(id)}
        />
      </main>
    </div>
  );
}
