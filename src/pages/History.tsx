import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SearchResultDetails } from "@/components/history/SearchResultDetails";
import { format } from "date-fns";
import { useSidebar } from "@/components/ui/sidebar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { AlertCircle, InfoIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { InstagramPost } from "@/types/instagram";

interface SearchHistoryItem {
  id: string;
  search_query: string;
  created_at: string;
}

interface SearchResultData {
  id: string;
  search_history_id: string;
  results: InstagramPost[];
  created_at: string;
}

export default function HistoryPage() {
  const [selectedSearchId, setSelectedSearchId] = useState<string>("");
  const { state } = useSidebar();

  // Fetch search history with real-time updates
  const { data: searchHistory = [], isLoading: isHistoryLoading } = useQuery<SearchHistoryItem[]>({
    queryKey: ['search-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('search_history')
        .select('id, search_query, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching search history:', error);
        throw error;
      }

      return data;
    },
    refetchInterval: 5000, // Refetch every 5 seconds to keep history up to date
  });

  // Fetch search results with real-time updates
  const { data: searchResult, isError, isLoading: isResultsLoading } = useQuery<SearchResultData | null>({
    queryKey: ['search-result', selectedSearchId],
    queryFn: async () => {
      if (!selectedSearchId) return null;

      const { data, error } = await supabase
        .from('search_results')
        .select('*')
        .eq('search_history_id', selectedSearchId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching search result:', error);
        throw error;
      }

      if (!data) return null;

      // Transform the results to ensure they match the InstagramPost type
      const transformedResults = {
        ...data,
        results: Array.isArray(data.results) ? data.results.map((post: any) => ({
          ownerUsername: post.ownerUsername || '',
          caption: post.caption || '',
          date: post.date || '',
          playsCount: post.playsCount || 0,
          viewsCount: post.viewsCount || 0,
          likesCount: post.likesCount || 0,
          commentsCount: post.commentsCount || 0,
          duration: post.duration || '',
          engagement: post.engagement || '',
          url: post.url || '',
          videoUrl: post.videoUrl,
          timestamp: post.timestamp || '',
        })) : [],
      };

      return transformedResults;
    },
    enabled: !!selectedSearchId,
    refetchInterval: 5000, // Refetch every 5 seconds to keep results up to date
  });

  return (
    <div className={cn(
      "container mx-auto py-8 space-y-8",
      state === 'collapsed' ? "pl-16" : "pl-6"
    )}>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Search History</h1>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <InfoIcon className="h-5 w-5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Search history is automatically deleted after 7 days</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {isHistoryLoading ? (
          <div className="text-sm text-muted-foreground">Loading search history...</div>
        ) : (
          <Select value={selectedSearchId} onValueChange={setSelectedSearchId}>
            <SelectTrigger className={cn("w-full", !selectedSearchId && "text-muted-foreground")}>
              <SelectValue placeholder="Select a search to view results" />
            </SelectTrigger>
            <SelectContent>
              {searchHistory.map((search) => (
                <SelectItem key={search.id} value={search.id}>
                  <div className="flex justify-between items-center gap-4">
                    <span>@{search.search_query}</span>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(search.created_at), 'MMM d, yyyy')}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load search results. Please try again later.
          </AlertDescription>
        </Alert>
      )}

      {selectedSearchId && !searchResult && !isError && !isResultsLoading && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No results found for this search.
          </AlertDescription>
        </Alert>
      )}

      {isResultsLoading && selectedSearchId && (
        <div className="text-sm text-muted-foreground">Loading search results...</div>
      )}

      {searchResult && searchResult.results && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {searchResult.results.map((result, index) => (
              <SearchResultDetails key={index} result={result} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}