import { Calendar as CalendarIcon, Trash2, Pencil } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import type { Bin, Collection } from "@shared/schema";
import { BinForm } from "./bin-form";
import { useState } from "react";

interface CalendarViewProps {
  bins: Bin[];
  collections: Collection[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onDeleteBin: (id: number) => void;
}

export function CalendarView({
  bins,
  collections,
  selectedDate,
  onDateSelect,
  onDeleteBin,
}: CalendarViewProps) {
  const [editingBin, setEditingBin] = useState<Bin | null>(null);

  // Helper function to get next collection date for a bin
  const getNextCollectionDate = (bin: Bin) => {
    const today = new Date();
    const dates = bin.collectionDay.split(',').map(d => new Date(d));
    return dates.find(d => d > today) || dates[0] || new Date(9999, 11, 31); // Far future date if no collections
  };

  // Sort bins by next collection date
  const sortedBins = [...bins].sort((a, b) => {
    const nextA = getNextCollectionDate(a).getTime();
    const nextB = getNextCollectionDate(b).getTime();
    return nextA - nextB;
  });

  // Organize collections by date for the calendar display
  const collectionsByDate = collections.reduce((acc, collection) => {
    const date = new Date(collection.collectionDate).toDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(collection);
    return acc;
  }, {} as Record<string, Collection[]>);

  return (
    <div className="grid grid-cols-[300px_1fr] gap-8">
      <div className="space-y-4">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => date && onDateSelect(date)}
          className="rounded-md border"
        />

        <div className="space-y-2">
          <h3 className="font-medium">Your Bins</h3>
          {sortedBins.map((bin) => {
            const nextCollection = getNextCollectionDate(bin);
            return (
              <div
                key={bin.id}
                className="flex items-center justify-between p-3 rounded-md border"
                style={{ backgroundColor: bin.color + "20" }}
              >
                <div className="flex-1">
                  <p className="font-medium">{bin.binType}</p>
                  <p className="text-sm text-muted-foreground">
                    Next collection: {nextCollection.toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingBin(bin)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <BinForm editBin={bin} />
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDeleteBin(bin.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="border rounded-md p-6">
        <div className="grid grid-cols-7 gap-px bg-muted">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="px-2 py-3 text-center font-medium">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-px bg-muted">
          {Array.from({ length: 35 }).map((_, i) => {
            const date = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), i + 1);
            const dateStr = date.toDateString();

            // Get all bins that have a collection on this date
            const binsForDate = bins.filter(bin => 
              bin.collectionDay.split(',').some(d => 
                new Date(d).toDateString() === dateStr
              )
            );

            return (
              <div
                key={i}
                className={`min-h-[120px] bg-background p-2 ${
                  date.getMonth() !== selectedDate.getMonth() ? "text-muted-foreground" : ""
                }`}
              >
                <div className="font-medium mb-1">{date.getDate()}</div>
                <div className="space-y-1">
                  {binsForDate.map((bin) => (
                    <div
                      key={bin.id}
                      className="text-xs p-1 rounded flex items-center gap-1"
                      style={{ backgroundColor: bin.color + "40" }}
                    >
                      <span 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: bin.color }}
                      />
                      {bin.binType}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}