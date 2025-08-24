import React from "react";
import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuantitySelectorProps {
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  quantity,
  onIncrease,
  onDecrease,
  min = 0,
  max = 99,
  disabled = false,
  size = "md",
  className
}) => {
  const sizeClasses = {
    sm: "h-6 w-6 text-xs",
    md: "h-8 w-8 text-sm",
    lg: "h-10 w-10 text-base"
  };

  const textSizeClasses = {
    sm: "text-xs min-w-[2rem]",
    md: "text-sm min-w-[2.5rem]",
    lg: "text-base min-w-[3rem]"
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Button
        variant="outline"
        size="icon"
        className={cn(sizeClasses[size], "rounded-full")}
        onClick={onDecrease}
        disabled={disabled || quantity <= min}
        aria-label="Decrease quantity"
      >
        <Minus className="h-3 w-3" />
      </Button>
      
      <span className={cn(
        "text-center font-medium select-none",
        textSizeClasses[size]
      )}>
        {quantity}
      </span>
      
      <Button
        variant="outline"
        size="icon"
        className={cn(sizeClasses[size], "rounded-full")}
        onClick={onIncrease}
        disabled={disabled || quantity >= max}
        aria-label="Increase quantity"
      >
        <Plus className="h-3 w-3" />
      </Button>
    </div>
  );
};
