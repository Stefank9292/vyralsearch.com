import { Navigate, useLocation } from "react-router-dom";
import { useSessionValidation } from "@/hooks/useSessionValidation";
import { LoadingState } from "@/components/auth/LoadingState";
import { ErrorState } from "@/components/auth/ErrorState";
import { UndefinedSessionState } from "@/components/auth/UndefinedSessionState";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const { session, isLoading, error } = useSessionValidation();

  const { data: subscriptionStatus, isLoading: isLoadingSubscription } = useQuery({
    queryKey: ['subscription-status', session?.access_token],
    queryFn: async () => {
      if (!session?.access_token) return null;
      
      try {
        const { data, error } = await supabase.functions.invoke('check-subscription', {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        });
        
        if (error) {
          console.error('Subscription check error:', error);
          // If we get an auth error, we'll return the free tier values
          if (error.message.includes('Invalid user session')) {
            return {
              subscribed: false,
              priceId: null,
              canceled: false,
              maxClicks: 3
            };
          }
          throw error;
        }

        console.log('Subscription check response:', data);
        return data;
      } catch (error) {
        console.error('Error checking subscription:', error);
        throw error;
      }
    },
    enabled: !!session?.access_token,
    retry: false,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  if (isLoading || isLoadingSubscription) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={() => window.location.reload()} />;
  }

  if (session === undefined) {
    return <UndefinedSessionState onRefresh={() => window.location.reload()} />;
  }

  if (!session) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If on subscribe page, allow access regardless of subscription status
  if (location.pathname === '/subscribe') {
    return <>{children}</>;
  }

  // If no subscription and not on subscribe page, redirect to subscribe
  if (!subscriptionStatus?.subscribed) {
    return <Navigate to="/subscribe" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};