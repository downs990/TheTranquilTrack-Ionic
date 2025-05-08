import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import { cn } from "../../lib/utils";

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-12 w-24 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 bg-[#1a1a1a]",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none relative block h-10 w-[60px] rounded-full bg-[#9CA3AF] shadow-lg ring-0 transition-all data-[state=checked]:bg-[#E6FE58] flex items-center justify-center",
        "translate-x-1 data-[state=checked]:translate-x-[34px]"
      )}
    >
      <span className={cn(
        "text-sm font-semibold",
        "data-[state=checked]:text-black data-[state=unchecked]:text-[#4B5563]"
      )} data-state={props.checked ? "checked" : "unchecked"}>
        START
      </span>
    </SwitchPrimitives.Thumb>
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };