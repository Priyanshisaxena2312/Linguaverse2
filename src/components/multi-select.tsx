
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "./ui/scroll-area";

export type OptionType = {
  label: string;
  value: string;
};

interface MultiSelectProps {
  options: OptionType[];
  selected: string[];
  onChange: React.Dispatch<React.SetStateAction<string[]>>;
  className?: string;
}

function MultiSelect({
  options,
  selected,
  onChange,
  className,
  ...props
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const filteredOptions = options.filter(option => 
    option.label.toLowerCase().includes(search.toLowerCase())
  );
  
  const handleSelectAll = () => {
    onChange(options.map(option => option.value));
  };
  
  const handleDeselectAll = () => {
    onChange([]);
  };

  return (
    <Popover open={open} onOpenChange={setOpen} {...props}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", selected.length > 1 ? "h-auto" : "h-10")}
          onClick={() => setOpen(!open)}
        >
          <div className="flex gap-1 flex-wrap">
            {selected.length > 0 ? `${selected.length} selected` : "Select students..."}
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <div className="p-2 border-b">
           <Input 
             placeholder="Search students..."
             value={search}
             onChange={(e) => setSearch(e.target.value)}
           />
        </div>
        <div className="p-2 border-b flex justify-between">
            <Button variant="link" size="sm" className="p-0 h-auto" onClick={handleSelectAll}>Select All</Button>
            <Button variant="link" size="sm" className="p-0 h-auto" onClick={handleDeselectAll}>Deselect All</Button>
        </div>
        <ScrollArea className="max-h-60">
            <div className="p-2">
                {filteredOptions.length > 0 ? filteredOptions.map((option) => (
                    <div
                        key={option.value}
                        className="flex items-center gap-2 p-2 rounded-md hover:bg-accent cursor-pointer"
                        onClick={() => {
                            onChange(
                                selected.includes(option.value)
                                ? selected.filter((item) => item !== option.value)
                                : [...selected, option.value]
                            );
                        }}
                    >
                        <Checkbox
                            checked={selected.includes(option.value)}
                            className="h-4 w-4 pointer-events-none"
                        />
                        <span className="text-sm">{option.label}</span>
                    </div>
                )) : (
                    <p className="text-center text-sm text-muted-foreground p-4">No students found.</p>
                )}
            </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

export { MultiSelect };
