import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";

export const RequestUsageCounter = () => {
  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  const { data: clickStats } = useQuery({
    queryKey: ['click-stats'],
    queryFn: async () => {
      if (!session?.user.id) return null;
      
      const { data, error } = await supabase
        .from('user_clicks')
        .select('click_count')
        .eq('user_id', session.user.id)
        .gte('period_end', new Date().toISOString())
        .order('period_end', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!session?.user.id,
  });

  const { data: subscriptionStatus } = useQuery({
    queryKey: ['subscription-status'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      });
      if (error) throw error;
      return data;
    },
    enabled: !!session?.access_token,
  });

  const maxClicks = subscriptionStatus?.maxClicks || 3; // Default to free tier
  const usedClicks = clickStats?.click_count || 0;
  const remainingClicks = Math.max(0, maxClicks - usedClicks);
  const usagePercentage = (usedClicks / maxClicks) * 100;

  return (
    <Card className="p-6 space-y-4">
      <h3 className="text-lg font-semibold">Request Usage</h3>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>{usedClicks} used</span>
          <span>{remainingClicks} remaining</span>
        </div>
        <Progress value={usagePercentage} className="h-2" />
        <p className="text-sm text-muted-foreground">
          Total requests: {maxClicks} per period
        </p>
      </div>
    </Card>
  );
};