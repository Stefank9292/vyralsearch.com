import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AppSidebar } from "@/components/AppSidebar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Auth from "@/pages/Auth";
import Index from "@/pages/Index";
import SearchHistory from "@/pages/SearchHistory";
import Subscribe from "@/pages/Subscribe";
import Success from "@/pages/Success";
import FAQ from "@/pages/FAQ";
import HelpCenter from "@/pages/HelpCenter";
import ConfirmEmail from "@/pages/ConfirmEmail";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SidebarProvider } from "@/components/ui/sidebar";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <Router>
          <SidebarProvider>
            <div className="flex min-h-screen w-full">
              <AppSidebar />
              <main className="flex-1">
                <Routes>
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/confirm-email" element={<ConfirmEmail />} />
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <Index />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/history"
                    element={
                      <ProtectedRoute>
                        <SearchHistory />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/subscribe"
                    element={
                      <ProtectedRoute>
                        <Subscribe />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/success"
                    element={
                      <ProtectedRoute>
                        <Success />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/faq"
                    element={
                      <ProtectedRoute>
                        <FAQ />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/help"
                    element={
                      <ProtectedRoute>
                        <HelpCenter />
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </main>
            </div>
            <Toaster />
          </SidebarProvider>
        </Router>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;