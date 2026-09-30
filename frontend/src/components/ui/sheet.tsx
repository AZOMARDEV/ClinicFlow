import * as React from 'react';
import * as SheetPrimitive from '@radix-ui/react-dialog';
import { XIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Right-hand side panel (Radix Dialog underneath: focus trap, Esc to close, aria-modal). */
const Sheet = SheetPrimitive.Root;
const SheetClose = SheetPrimitive.Close;

const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content> & { size?: 'default' | 'lg' }
>(({ className, children, size = 'default', ...props }, ref) => (
  <SheetPrimitive.Portal>
    <SheetPrimitive.Overlay className="fixed inset-0 z-50 bg-[rgba(28,27,25,0.38)] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
    <SheetPrimitive.Content
      ref={ref}
      className={cn(
        'fixed inset-y-0 right-0 z-50 flex h-full w-full flex-col bg-card shadow-[-16px_0_48px_rgba(28,27,25,0.18)] outline-none sm:border-l',
        size === 'lg' ? 'sm:max-w-[560px]' : 'sm:max-w-[460px]',
        'data-[state=open]:animate-in data-[state=open]:slide-in-from-right data-[state=open]:duration-300',
        'data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=closed]:duration-200',
        className,
      )}
      {...props}
    >
      {children}
      <SheetPrimitive.Close className="absolute top-4.5 right-4 inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none cursor-pointer">
        <XIcon className="size-4.5" />
        <span className="sr-only">Close</span>
      </SheetPrimitive.Close>
    </SheetPrimitive.Content>
  </SheetPrimitive.Portal>
));
SheetContent.displayName = SheetPrimitive.Content.displayName;

function SheetHeader({ className, icon, tone = 'default', children, ...props }: React.ComponentProps<'div'> & { icon?: React.ReactNode; tone?: 'default' | 'destructive' }) {
  return (
    <div className={cn('flex items-start gap-3.5 border-b border-row-border px-6 pt-5 pb-4.5 pr-16', className)} {...props}>
      {icon && (
        <span
          className={cn(
            'mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-xl [&_svg]:size-5',
            tone === 'destructive' ? 'bg-red-50 text-destructive' : 'bg-secondary text-secondary-foreground',
          )}
          aria-hidden
        >
          {icon}
        </span>
      )}
      <div className="flex min-w-0 flex-col gap-1">{children}</div>
    </div>
  );
}

function SheetBody({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-6 py-5', className)} {...props} />;
}

function SheetFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('flex flex-col gap-3 border-t border-row-border bg-card px-6 py-4', className)} {...props} />;
}

function SheetSection({ title, description, className, children }: { title: string; description?: string; className?: string; children: React.ReactNode }) {
  return (
    <section className={cn('flex flex-col gap-3.5', className)}>
      <div className="flex flex-col gap-0.5">
        <h3 className="text-xs font-semibold tracking-[0.06em] text-muted-foreground uppercase">{title}</h3>
        {description && <p className="text-[13px] text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  );
}

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => <SheetPrimitive.Title ref={ref} className={cn('text-lg leading-tight font-semibold', className)} {...props} />);
SheetTitle.displayName = SheetPrimitive.Title.displayName;

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
));
SheetDescription.displayName = SheetPrimitive.Description.displayName;

export { Sheet, SheetClose, SheetContent, SheetHeader, SheetBody, SheetFooter, SheetSection, SheetTitle, SheetDescription };
