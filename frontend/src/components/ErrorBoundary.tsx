import { Component, type ErrorInfo, type ReactNode } from 'react';
import { BugIcon, HomeIcon, RotateCcwIcon } from 'lucide-react';
import { EmptyState } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  /** Changing this key clears the error (e.g. the current route) */
  resetKey?: string;
  fullPage?: boolean;
}

interface State {
  error: Error | null;
}

/** Catches render errors so one broken screen does not blank the whole app. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ClinicFlow] UI error:', error, info.componentStack);
  }

  componentDidUpdate(prev: Props) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null });
  }

  render() {
    if (!this.state.error) return this.props.children;

    const content = (
      <Card role="alert">
        <EmptyState
          tone="danger"
          icon={BugIcon}
          title="This screen failed to load"
          description={
            <>
              An unexpected error occurred while displaying this page. Your data is safe.
              {import.meta.env.DEV && <span className="mt-2 block font-mono text-xs text-destructive">{this.state.error.message}</span>}
            </>
          }
          action={
            <Button variant="outline" onClick={() => this.setState({ error: null })}>
              <RotateCcwIcon /> Try again
            </Button>
          }
          secondaryAction={
            <Button variant="ghost" onClick={() => window.location.assign('/')}>
              <HomeIcon /> Go to dashboard
            </Button>
          }
        />
      </Card>
    );

    return this.props.fullPage ? <div className="mx-auto flex min-h-screen max-w-xl items-center px-4">{content}</div> : content;
  }
}
