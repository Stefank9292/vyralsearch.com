import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { BulkSearch } from "./BulkSearch";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePlaceholderAnimation } from "./PlaceholderAnimation";
import { BulkSearchButton } from "./BulkSearchButton";

interface SearchBarProps {
  username: string;
  onUsernameChange: (value: string) => void;
  onSearch: () => void;
  onBulkSearch?: (urls: string[], numberOfVideos: number, selectedDate: Date | undefined) => Promise<any>;
  isLoading?: boolean;
  hasReachedLimit?: boolean;
}

const normalizeInstagramUsername = (input: string): string => {
  // Remove any trailing slashes and trim whitespace
  const cleanInput = input.trim().replace(/\/$/, '');
  
  // If it's a full URL, extract just the username
  if (cleanInput.startsWith('https://www.instagram.com/')) {
    return cleanInput.replace('https://www.instagram.com/', '').split('/')[0];
  }
  
  // If it starts with @, remove it
  if (cleanInput.startsWith('@')) {
    return cleanInput.slice(1);
  }
  
  return cleanInput;
};

export const SearchBar = ({ 
  username, 
  onUsernameChange, 
  onSearch,
  onBulkSearch,
  isLoading,
  hasReachedLimit = false
}: SearchBarProps) => {
  const [isBulkSearchOpen, setIsBulkSearchOpen] = useState(false);
  const placeholder = usePlaceholderAnimation();
  const queryClient = useQueryClient();

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
      if (!session?.access_token) return null;
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      if (error) throw error;
      return data;
    },
    enabled: !!session?.access_token,
  });

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading && username.trim() && !hasReachedLimit) {
      e.preventDefault();
      onSearch();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const normalizedUsername = normalizeInstagramUsername(e.target.value);
    onUsernameChange(normalizedUsername);
  };

  const isBulkSearchEnabled = subscriptionStatus?.priceId && (
    subscriptionStatus.priceId === "price_1Qdt4NGX13ZRG2XiMWXryAm9" || // Creator on Steroids Monthly
    subscriptionStatus.priceId === "price_1Qdt5HGX13ZRG2XiUW80k3Fk" || // Creator on Steroids Annual
    subscriptionStatus.priceId === "price_1QfKMGGX13ZRG2XiFyskXyJo" || // Creator Pro Monthly
    subscriptionStatus.priceId === "price_1QfKMYGX13ZRG2XioPYKCe7h"    // Creator Pro Annual
  );

  return (
    <>
      <div className="relative w-full">
        <Input
          type="text"
          placeholder={placeholder}
          className="pl-12 h-12 text-[13px] rounded-xl border border-gray-200/80 dark:border-gray-800/80 
                   focus:border-[#D946EF] shadow-sm hover:shadow-md transition-all duration-300 ease-spring
                   placeholder:text-gray-400 dark:placeholder:text-gray-600 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm"
          value={username}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={isLoading || hasReachedLimit}
        />
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <BulkSearchButton 
          isEnabled={isBulkSearchEnabled}
          isLoading={isLoading}
          hasReachedLimit={hasReachedLimit}
          onClick={() => setIsBulkSearchOpen(true)}
        />
      </div>

      {isBulkSearchEnabled && (
        <BulkSearch
          isOpen={isBulkSearchOpen}
          onClose={() => setIsBulkSearchOpen(false)}
          onSearch={onBulkSearch || (() => Promise.resolve())}
          isLoading={isLoading}
          hasReachedLimit={hasReachedLimit}
        />
      )}
    </>
  );
};