import { useState } from "react";
import { Search, List } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BulkSearch } from "./BulkSearch";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SearchBarProps {
  username: string;
  onUsernameChange: (value: string) => void;
  onSearch: () => void;
  onBulkSearch?: (urls: string[], numberOfVideos: number, selectedDate: Date | undefined) => Promise<any>;
  isLoading?: boolean;
}

export const SearchBar = ({ 
  username, 
  onUsernameChange, 
  onSearch,
  onBulkSearch,
  isLoading 
}: SearchBarProps) => {
  const [isBulkSearchOpen, setIsBulkSearchOpen] = useState(false);

  const { data: subscriptionStatus } = useQuery({
    queryKey: ['subscription-status'],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) return null;

      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.session.access_token}`
        }
      });
      if (error) throw error;
      return data;
    },
  });

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading) {
      e.preventDefault();
      onSearch();
    }
  };

  const isBulkSearchEnabled = subscriptionStatus?.priceId && 
    (subscriptionStatus.priceId === "price_1QdBd2DoPDXfOSZFnG8aWuIq" || 
     subscriptionStatus.priceId === "price_1QdC54DoPDXfOSZFXHBO4yB3");

  return (
    <>
      <div className="relative w-full">
        <Input
          type="text"
          placeholder="Enter Instagram username or profile URL"
          className="pl-12 pr-32 h-14 text-base md:text-lg rounded-xl border-2 border-gray-200 dark:border-gray-700 focus:border-primary"
          value={username}
          onChange={(e) => onUsernameChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
        />
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        {isBulkSearchEnabled && (
          <Button
            variant="ghost"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
            onClick={() => setIsBulkSearchOpen(true)}
            disabled={isLoading}
          >
            <List className="w-4 h-4" />
            <span className="hidden md:inline">Bulk Search</span>
          </Button>
        )}
      </div>

      {isBulkSearchEnabled && (
        <BulkSearch
          isOpen={isBulkSearchOpen}
          onClose={() => setIsBulkSearchOpen(false)}
          onSearch={onBulkSearch || (() => Promise.resolve())}
          isLoading={isLoading}
        />
      )}
    </>
  );
};