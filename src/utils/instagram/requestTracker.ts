import { supabase } from "@/integrations/supabase/client";

export async function trackInstagramRequest(userId: string) {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  await supabase
    .from('user_requests')
    .insert({
      user_id: userId,
      request_type: 'instagram_search',
      period_start: startOfDay.toISOString(),
      period_end: endOfDay.toISOString()
    });
}

export async function checkRequestLimit(userId: string): Promise<boolean> {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const { count } = await supabase
    .from('user_requests')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('request_type', 'instagram_search')
    .gte('created_at', startOfDay.toISOString())
    .lt('created_at', endOfDay.toISOString());

  // Get user's subscription tier
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return false;

  const { data: subscriptionStatus } = await supabase.functions.invoke('check-subscription', {
    headers: {
      Authorization: `Bearer ${session.access_token}`
    }
  });

  // Define limits based on subscription tier
  let dailyLimit = 3; // Free tier
  if (subscriptionStatus?.priceId === "price_1QdtwnGX13ZRG2XihcM36r3W" || 
      subscriptionStatus?.priceId === "price_1Qdtx2GX13ZRG2XieXrqPxAV") {
    dailyLimit = 25; // Pro tier
  } else if (subscriptionStatus?.priceId === "price_1Qdty5GX13ZRG2XiFxadAKJW" || 
             subscriptionStatus?.priceId === "price_1QdtyHGX13ZRG2Xib8px0lu0") {
    dailyLimit = Infinity; // Steroids tier
  }

  return (count || 0) < dailyLimit;
}