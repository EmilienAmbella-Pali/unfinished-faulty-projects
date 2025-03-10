import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertBinSchema, type InsertBin, type Bin } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Form, FormField, FormItem, FormLabel, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { z } from "zod";

const BIN_TYPES = {
  Residential: [
    "General Waste",
    "Garden Waste",
    "Paper & Cardboard",
    "Glass & Plastic"
  ],
  Commercial: [
    "Medical Waste (Orange Bin)",
    "Battery & Small Electrical Waste",
    "Textiles & Clothing",
    "Nappy/Incontinence Waste",
    "Large Mixed Recycling (Clear Bin)",
    "Large Commercial Waste (Red Bin)"
  ]
} as const;

const BIN_COLORS = {
  Residential: [
    { name: "Black", value: "#000000" },
    { name: "Grey", value: "#808080" },
    { name: "Blue", value: "#0000FF" },
    { name: "Brown", value: "#8B4513" },
    { name: "Green", value: "#00FF00" },
    { name: "Purple", value: "#800080" },
    { name: "Yellow", value: "#FFFF00" }
  ],
  Commercial: [
    { name: "Black", value: "#000000" },
    { name: "Grey", value: "#808080" },
    { name: "Blue", value: "#0000FF" },
    { name: "Brown", value: "#8B4513" },
    { name: "Green", value: "#00FF00" },
    { name: "Orange", value: "#FFA500" },
    { name: "Red", value: "#FF0000" },
    { name: "Purple", value: "#800080" }
  ]
} as const;

const NOTIFICATION_INTERVALS = Array.from({ length: 12 }, (_, i) => i + 1);

interface BinFormProps {
  editBin?: Bin;
}

export function BinForm({ editBin }: BinFormProps) {
  const { toast } = useToast();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const form = useForm<InsertBin>({
    resolver: zodResolver(insertBinSchema),
    defaultValues: editBin ?? {
      category: "Residential",
      notificationType: "Email",
      notificationTime: "18:00",
      notificationInterval: 6,
    },
  });

  const showPhoneField = form.watch("notificationType") === "SMS";
  const category = form.watch("category");

  const createBinMutation = useMutation({
    mutationFn: async (data: InsertBin) => {
      const res = await apiRequest(
        editBin ? "PATCH" : "POST",
        editBin ? `/api/bins/${editBin.id}` : "/api/bins",
        data
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bins'] });
      toast({
        title: "Success",
        description: `Bin ${editBin ? 'updated' : 'added'} successfully`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => createBinMutation.mutate(data))} className="space-y-6">
        <DialogHeader>
          <DialogTitle>{editBin ? 'Edit' : 'Add New'} Bin</DialogTitle>
        </DialogHeader>

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Residential" id="residential" />
                  <label htmlFor="residential">Residential</label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Commercial" id="commercial" />
                  <label htmlFor="commercial">Commercial</label>
                </div>
              </RadioGroup>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="binType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bin Type</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="Select bin type" />
                </SelectTrigger>
                <SelectContent>
                  {BIN_TYPES[category as keyof typeof BIN_TYPES].map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Color</FormLabel>
              <div className="grid grid-cols-4 gap-2">
                {BIN_COLORS[category as keyof typeof BIN_COLORS].map(({ name, value }) => (
                  <Button
                    key={value}
                    type="button"
                    variant="outline"
                    className="h-12 relative"
                    style={{ backgroundColor: value }}
                    onClick={() => field.onChange(value)}
                  >
                    {field.value === value && (
                      <Check className="h-6 w-6 text-white absolute inset-0 m-auto" />
                    )}
                  </Button>
                ))}
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="collectionDay"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Collection Schedule</FormLabel>
              <Button 
                type="button"
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setIsCalendarOpen(true)}
              >
                {field.value || "Select collection dates"}
              </Button>
              <Dialog open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Select Collection Dates</DialogTitle>
                  </DialogHeader>
                  <Calendar
                    mode="multiple"
                    selected={field.value?.split(',').map(d => new Date(d)) ?? []}
                    onSelect={(dates) => {
                      field.onChange(dates?.map(d => d.toISOString()).join(',') ?? '');
                      setIsCalendarOpen(false);
                    }}
                    className="rounded-md border"
                  />
                </DialogContent>
              </Dialog>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notificationType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notification Preference</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Email">Email</SelectItem>
                  <SelectItem value="SMS">SMS</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        {showPhoneField && (
          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <Input type="tel" {...field} value={field.value ?? ''} />
                <FormDescription>
                  Required for SMS notifications
                </FormDescription>
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="notificationTime"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notification Time (Day Before)</FormLabel>
              <Input type="time" {...field} />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notificationInterval"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hours Between Notifications</FormLabel>
              <Select 
                onValueChange={(value) => field.onChange(parseInt(value))} 
                value={field.value?.toString() ?? '6'}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NOTIFICATION_INTERVALS.map((hours) => (
                    <SelectItem key={hours} value={hours.toString()}>
                      {hours} hours
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                You'll receive two notifications with this interval between them
              </FormDescription>
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          className="w-full"
          disabled={createBinMutation.isPending}
        >
          {createBinMutation.isPending 
            ? (editBin ? "Updating bin..." : "Adding bin...") 
            : (editBin ? "Update Bin" : "Add Bin")
          }
        </Button>
      </form>
    </Form>
  );
}