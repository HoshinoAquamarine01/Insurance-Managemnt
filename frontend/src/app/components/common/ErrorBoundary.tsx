import { ReactNode } from "react";
import React from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "../ui/button";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface ErrorState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary">
            <div className="max-w-md w-full mx-4 p-6 bg-card rounded-lg border border-border shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h2 className="font-semibold">Đã xảy ra lỗi</h2>
                  <p className="text-sm text-muted-foreground">
                    Vui lòng thử lại hoặc liên hệ hỗ trợ
                  </p>
                </div>
              </div>

              {process.env.NODE_ENV === "development" && (
                <div className="mb-4 p-3 bg-muted rounded text-xs text-muted-foreground overflow-auto max-h-32 font-mono">
                  {this.state.error?.message}
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={this.reset} className="flex-1">
                  Thử lại
                </Button>
                <Button
                  variant="outline"
                  onClick={() => (window.location.href = "/")}
                  className="flex-1"
                >
                  Về trang chủ
                </Button>
              </div>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

export { ErrorBoundary };
