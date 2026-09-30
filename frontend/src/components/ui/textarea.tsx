import * as React from 'react';
import { cn } from '@/lib/utils';

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<'textarea'>>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      'flex min-h-20 w-full rounded-md border border-input bg-card px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground resize-none',
      'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20',
      'aria-invalid:border-destructive aria-invalid:ring-destructive/15',
      className,
    )}
    {...props}
  />
));
Textarea.displayName = 'Textarea';

export { Textarea };
