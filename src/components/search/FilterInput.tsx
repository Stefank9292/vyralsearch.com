import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { useState, useEffect } from "react";

interface FilterInputProps {
  icon: LucideIcon;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  isDatePicker?: boolean;
  helpText?: string;
}

export const FilterInput = ({
  icon: Icon,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  isDatePicker,
  helpText,
}: FilterInputProps) => {
  const [date, setDate] = useState<Date | undefined>();

  useEffect(() => {
    if (value && isDatePicker) {
      try {
        const [day, month, year] = value.split('.');
        const parsedDate = new Date(Number(year), Number(month) - 1, Number(day));
        if (!isNaN(parsedDate.getTime())) {
          setDate(parsedDate);
        }
      } catch (error) {
        console.error('Error parsing date:', error);
      }
    } else if (!value) {
      setDate(undefined);
    }
  }, [value, isDatePicker]);

  const formatNumber = (value: string) => {
    // Remove any non-digit characters
    const digits = value.replace(/\D/g, '');
    
    // Format with dots as thousand separators
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const handleNumericInput = (inputValue: string) => {
    const formattedValue = formatNumber(inputValue);
    onChange(formattedValue);
  };

  const handleResetDate = () => {
    setDate(undefined);
    onChange('');
  };

  const handleDateSelect = (newDate: Date | undefined) => {
    setDate(newDate);
    if (newDate) {
      onChange(format(newDate, "dd.MM.yyyy"));
    }
  };

  if (isDatePicker) {
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Icon className="h-4 w-4" />
          <span>{label}</span>
        </Label>
        <div className="relative">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal h-10",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "dd.MM.yyyy") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={handleDateSelect}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {date && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6"
              onClick={handleResetDate}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Reset date</span>
            </Button>
          )}
        </div>
        {helpText && (
          <p className="text-xs text-muted-foreground">{helpText}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium flex items-center gap-2">
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => {
          if (type === "number") {
            handleNumericInput(e.target.value);
          } else {
            onChange(e.target.value);
          }
        }}
        placeholder={placeholder}
        className="h-10"
      />
      {helpText && (
        <p className="text-xs text-muted-foreground">{helpText}</p>
      )}
    </div>
  );
};