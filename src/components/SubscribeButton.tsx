import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { CancelSubscriptionButton } from "./CancelSubscriptionButton";
import { PlanButtonText } from "./subscription/PlanButtonText";
import { useSubscriptionAction } from "@/hooks/useSubscriptionAction";

interface SubscribeButtonProps {
  planId: string;
  planName: string;
  isPopular?: boolean;
  isAnnual: boolean;
}

export const SubscribeButton = ({ planId, planName, isPopular, isAnnual }: SubscribeButtonProps) => {
  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
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

  const { loading, handleSubscriptionAction } = useSubscriptionAction(session);

  const getButtonText = () => {
    if (!subscriptionStatus?.subscribed && planId !== 'free') {
      return `Upgrade to ${planName}`;
    }

    if (planId === 'free') {
      if (!subscriptionStatus?.subscribed) {
        return "Current Plan";
      }
      return "Downgrade to Free";
    }

    const isCurrentPlan = subscriptionStatus?.priceId === planId;
    if (isCurrentPlan) {
      return "Current Plan";
    }

    const isMonthlyToAnnualUpgrade = isAnnual && 
      ((subscriptionStatus?.priceId === "price_1QdtwnGX13ZRG2XihcM36r3W" && planId === "price_1Qdtx2GX13ZRG2XieXrqPxAV") || 
       (subscriptionStatus?.priceId === "price_1Qdty5GX13ZRG2XiFxadAKJW" && planId === "price_1QdtyHGX13ZRG2Xib8px0lu0"));

    if (isMonthlyToAnnualUpgrade) {
      return "Save 20% now by upgrading to annual";
    }

    if (subscriptionStatus?.priceId === "price_1Qdty5GX13ZRG2XiFxadAKJW" && planId === "price_1QdtwnGX13ZRG2XihcM36r3W") {
      return "Downgrade to Creator Pro";
    }

    return `Upgrade to ${planName}`;
  };

  const isCurrentPlan = 
    (planId === 'free' && !subscriptionStatus?.subscribed) || 
    (subscriptionStatus?.subscribed && subscriptionStatus.priceId === planId);

  const getButtonStyle = () => {
    if (isCurrentPlan) {
      return "bg-secondary hover:bg-secondary/80";
    }
    return isPopular ? "bg-[#D946EF] hover:bg-[#D946EF]/90 text-white" : "bg-zinc-900 hover:bg-zinc-900/90 text-white";
  };

  if (isCurrentPlan && subscriptionStatus?.subscribed && planId !== 'free') {
    return (
      <CancelSubscriptionButton 
        isCanceled={subscriptionStatus?.canceled}
        className="w-full"
      >
        Cancel Subscription
      </CancelSubscriptionButton>
    );
  }

  const handleClick = () => handleSubscriptionAction(planId, planName, subscriptionStatus);

  return (
    <Button 
      onClick={handleClick} 
      disabled={loading || (isCurrentPlan && planId === 'free')}
      className={`w-full text-[11px] h-8 ${getButtonStyle()}`}
      variant={isCurrentPlan ? "secondary" : "default"}
    >
      <PlanButtonText 
        text={loading ? "Loading..." : getButtonText()}
        isUpgrade={!isCurrentPlan && planId !== 'free'}
      />
    </Button>
  );
};