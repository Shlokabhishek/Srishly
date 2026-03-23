import * as React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class RouteErrorBoundary extends React.Component<
  { children: React.ReactNode; resetKey?: string },
  { hasError: boolean }
> {
  public constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  public static getDerivedStateFromError() {
    return { hasError: true };
  }

  public componentDidUpdate(previousProps: { resetKey?: string }) {
    if (this.state.hasError && this.props.resetKey !== previousProps.resetKey) {
      this.setState({ hasError: false });
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto flex min-h-[60vh] w-full max-w-3xl items-center justify-center px-4 py-24">
          <div className="w-full rounded-[2rem] border border-amber-400/20 bg-slate-900/80 p-10 text-center shadow-2xl shadow-black/40">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 text-amber-300">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <h1 className="mb-3 text-3xl font-semibold text-white">Something went wrong</h1>
            <p className="mx-auto mb-8 max-w-xl text-sm leading-7 text-slate-300">
              The page hit an unexpected error. Refresh to retry. If the problem continues, review the latest route changes
              before deploying.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-400"
            >
              <RefreshCw className="h-4 w-4" />
              Reload app
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
