import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Session } from "@supabase/supabase-js";
import { useEffect } from "react";

export const useUsageStats = (session: Session | null) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: requestStats, refetch: refetchRequestStats } = useQuery({
    queryKey: ['request-stats', session?.user?.id],
    queryFn: async () => {
      if (!session?.user.id) return null;
      
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const { count, error } = await supabase
        .from('user_requests')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id)
        .eq('request_type', 'instagram_search')
        .gte('created_at', startOfMonth.toISOString())
        .lt('created_at', endOfMonth.toISOString());

      if (error) {
        console.error('Error fetching request stats:', error);
        toast({
          title: "Error",
          description: "Failed to fetch usage statistics",
          variant: "destructive",
        });
        return 0;
      }

      return count || 0;
    },
    enabled: !!session?.user.id,
    staleTime: 0,
    gcTime: 0,
  });

  const { data: subscriptionStatus } = useQuery({
    queryKey: ['subscription-status', session?.access_token],
    queryFn: async () => {
      if (!session?.access_token) return null;
      try {
        console.log('Checking subscription status...');
        const { data, error } = await supabase.functions.invoke('check-subscription', {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        });
        if (error) {
          console.error('Subscription check error:', error);
          throw error;
        }
        console.log('Subscription status received:', data);
        return data;
      } catch (error) {
        console.error('Failed to check subscription:', error);
        return null;
      }
    },
    enabled: !!session?.access_token,
    retry: 3,
    retryDelay: 1000,
  });

  // Set up real-time subscription for user_requests
  useEffect(() => {
    if (!session?.user?.id) return;

    console.log('Setting up real-time subscription for user_requests');

    const channel = supabase
      .channel('user-requests-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_requests',
          filter: `user_id=eq.${session.user.id}`
        },
        (payload) => {
          console.log('Received real-time update:', payload);
          queryClient.invalidateQueries({ 
            queryKey: ['request-stats', session.user.id]
          });
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id, queryClient]);

  // Check and reset monthly usage
  useEffect(() => {
    const checkAndResetMonthlyUsage = async () => {
      if (!session?.user.id || !subscriptionStatus) return;

      const now = new Date();
      const lastResetDate = new Date(now);
      lastResetDate.setDate(lastResetDate.getDate() - 30);

      const { data: requests, error } = await supabase
        .from('user_requests')
        .select('last_reset_at')
        .eq('user_id', session.user.id)
        .eq('request_type', 'instagram_search')
        .order('last_reset_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error checking last reset date:', error);
        return;
      }

      const shouldReset = !requests?.[0]?.last_reset_at || 
                        new Date(requests[0].last_reset_at) < lastResetDate;

      if (shouldReset) {
        const { error: resetError } = await supabase
          .from('user_requests')
          .update({ last_reset_at: now.toISOString() })
          .eq('user_id', session.user.id)
          .eq('request_type', 'instagram_search')
          .lt('created_at', lastResetDate.toISOString());

        if (resetError) {
          console.error('Error resetting usage:', resetError);
          return;
        }

        await refetchRequestStats();
        
        toast({
          title: "Monthly Usage Reset",
          description: "Your search usage has been reset for the new billing period.",
        });
      }
    };

    checkAndResetMonthlyUsage();
  }, [session?.user.id, subscriptionStatus, refetchRequestStats, toast]);

  const isSteroidsUser = subscriptionStatus?.priceId === "price_1Qdt4NGX13ZRG2XiMWXryAm9" || 
                        subscriptionStatus?.priceId === "price_1Qdt5HGX13ZRG2XiUW80k3Fk";
  const isProUser = subscriptionStatus?.priceId === "price_1QfKMGGX13ZRG2XiFyskXyJo" || 
                    subscriptionStatus?.priceId === "price_1QfKMYGX13ZRG2XioPYKCe7h";
  
  const maxRequests = isSteroidsUser ? Infinity : isProUser ? 25 : 3; // Pro users get 25 searches
  const usedRequests = requestStats || 0;
  const remainingRequests = isSteroidsUser ? Infinity : Math.max(0, maxRequests - usedRequests);
  const usagePercentage = isSteroidsUser ? 0 : ((usedRequests / maxRequests) * 100);
  const hasReachedLimit = isSteroidsUser ? false : usedRequests >= maxRequests;

  const getPlanName = () => {
    if (subscriptionStatus?.priceId === "price_1QfKMGGX13ZRG2XiFyskXyJo" || 
        subscriptionStatus?.priceId === "price_1QfKMYGX13ZRG2XioPYKCe7h") {
      return 'Creator Pro';
    }
    if (subscriptionStatus?.priceId === "price_1Qdt4NGX13ZRG2XiMWXryAm9" || 
        subscriptionStatus?.priceId === "price_1Qdt5HGX13ZRG2XiUW80k3Fk") {
      return 'Creator on Steroids';
    }
    return 'Free Plan';
  };

  return {
    isSteroidsUser,
    isProUser,
    maxRequests,
    usedRequests,
    remainingRequests,
    usagePercentage,
    hasReachedLimit,
    getPlanName,
    subscriptionStatus,
  };
};