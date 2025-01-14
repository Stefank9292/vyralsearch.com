import { TikTokSearchHeader } from "./TikTokSearchHeader";
import { TikTokSearchBar } from "./TikTokSearchBar";
import { TikTokSearchSettings, DateRangeOption, LocationOption } from "./TikTokSearchSettings";
import { TikTokSearchResults } from "./TikTokSearchResults";
import { TikTokRecentSearches } from "./TikTokRecentSearches";
import { useState } from "react";
import { fetchTikTokPosts } from "@/utils/tiktok/services/tiktokService";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export const TikTokSearchContainer = () => {
  const [username, setUsername] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [numberOfVideos, setNumberOfVideos] = useState(5);
  const [dateRange, setDateRange] = useState<DateRangeOption>("DEFAULT");
  const [location, setLocation] = useState<LocationOption>("US");
  const { toast } = useToast();

  // Get current user session with proper caching
  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
  });

  // TikTok search query with persistence
  const { 
    data: searchResults = [], 
    isLoading,
    refetch: performSearch
  } = useQuery({
    queryKey: ['tiktok-search', username, numberOfVideos, dateRange, location],
    queryFn: async () => {
      if (!username.trim()) return [];
      
      console.log('Searching with params:', { username, numberOfVideos, dateRange, location });
      const results = await fetchTikTokPosts(username, numberOfVideos, dateRange, location);

      // Save search to history if user is logged in
      if (session?.user?.id) {
        const { error } = await supabase
          .from('tiktok_search_history')
          .insert({
            user_id: session.user.id,
            search_query: username.replace('@', ''),
            search_type: 'user_search',
            location
          });

        if (error) {
          console.error('Error saving search history:', error);
        }
      }

      return results;
    },
    enabled: false, // Don't run automatically
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    cacheTime: 1000 * 60 * 30, // Keep in cache for 30 minutes
    retry: 2,
    meta: {
      onError: (error: Error) => {
        console.error('Search error:', error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to fetch TikTok data",
          variant: "destructive",
        });
      }
    }
  });

  const handleSearch = async () => {
    if (!username.trim()) {
      toast({
        title: "Error",
        description: "Please enter a TikTok username or URL",
        variant: "destructive",
      });
      return;
    }

    try {
      const results = await performSearch();
      if (results.data && results.data.length > 0) {
        toast({
          description: `Found ${results.data.length} videos for @${username.replace('@', '')}`,
        });
      }
    } catch (error) {
      // Error handling is done in the query's meta.onError
    }
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-[calc(100vh-theme(spacing.20))] md:min-h-[calc(100vh-theme(spacing.32))] 
                    px-4 sm:px-6 py-8 sm:py-12 space-y-8 sm:space-y-10 animate-in fade-in duration-500 w-full">
      <div className="space-y-6 sm:space-y-8 w-full max-w-lg">
        <TikTokSearchHeader />
      </div>

      <div className="w-full max-w-lg space-y-6 animate-in fade-in duration-500 delay-150">
        <TikTokSearchBar
          username={username}
          onUsernameChange={setUsername}
          isLoading={isLoading}
          onSearch={handleSearch}
        />
        
        <TikTokSearchSettings 
          isSettingsOpen={isSettingsOpen}
          setIsSettingsOpen={setIsSettingsOpen}
          numberOfVideos={numberOfVideos}
          setNumberOfVideos={setNumberOfVideos}
          dateRange={dateRange}
          setDateRange={setDateRange}
          location={location}
          setLocation={setLocation}
          disabled={isLoading}
        />

        <TikTokRecentSearches onSelect={setUsername} />
      </div>

      <div className="w-full animate-in fade-in duration-500 delay-300">
        <TikTokSearchResults searchResults={searchResults} />
      </div>
    </div>
  );
};