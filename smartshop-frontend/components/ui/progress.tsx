"use client"

import { Progress as ProgressPrimitive } from "@base-ui/react/progress"
import { cn } from "cn"

function Progress({
  className,
  children,
  value,
  marker,
  max = 100,
  ...props
}: ProgressPrimitive.Root.Props & { marker?: React.ReactNode }) {
  const percent = Math.min(100, Math.max(0, ((value ?? 0) / max) * 100))
  return (
    <ProgressPrimitive.Root
      value={value}
      max={max}
      data-slot="progress"
      className={cn("flex flex-wrap gap-3", className)}
      {...props}
    >
      {children}
      <div className="w-full">
        {marker ? (
          <div className="relative mx-4 h-9" aria-hidden="true">
            <span
              data-slot="progress-marker"
              data-complete={percent === 100 || undefined}
              className="absolute top-0 flex size-8 -translate-x-1/2 items-center justify-center rounded-full border bg-background text-foreground shadow-sm transition-[left,background-color,color] duration-500 ease-out data-[complete]:border-primary data-[complete]:bg-primary data-[complete]:text-primary-foreground motion-reduce:transition-none [&_svg]:size-5"
              style={{ left: `${percent}%` }}
            >
              {marker}
            </span>
          </div>
        ) : null}
        <ProgressTrack>
          <ProgressIndicator />
        </ProgressTrack>
      </div>
    </ProgressPrimitive.Root>
  )
}

function ProgressTrack({ className, ...props }: ProgressPrimitive.Track.Props) {
  return (
    <ProgressPrimitive.Track
      className={cn(
        "relative flex h-3 w-full items-center overflow-x-hidden rounded-4xl bg-muted",
        className
      )}
      data-slot="progress-track"
      {...props}
    />
  )
}

function ProgressIndicator({
  className,
  ...props
}: ProgressPrimitive.Indicator.Props) {
  return (
    <ProgressPrimitive.Indicator
      data-slot="progress-indicator"
      className={cn(
        "h-full bg-primary transition-[width,transform] duration-500 ease-out motion-reduce:transition-none",
        className
      )}
      {...props}
    />
  )
}

function ProgressLabel({ className, ...props }: ProgressPrimitive.Label.Props) {
  return (
    <ProgressPrimitive.Label
      className={cn("text-sm font-medium", className)}
      data-slot="progress-label"
      {...props}
    />
  )
}

function ProgressValue({ className, ...props }: ProgressPrimitive.Value.Props) {
  return (
    <ProgressPrimitive.Value
      className={cn(
        "ml-auto text-sm text-muted-foreground tabular-nums",
        className
      )}
      data-slot="progress-value"
      {...props}
    />
  )
}

export {
  Progress,
  ProgressTrack,
  ProgressIndicator,
  ProgressLabel,
  ProgressValue,
}
