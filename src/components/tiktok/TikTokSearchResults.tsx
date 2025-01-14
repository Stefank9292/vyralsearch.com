import { TikTokTableContent } from "./TikTokTableContent";
import { TikTokFilterHeader } from "./TikTokFilterHeader";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { FilterInput } from "@/components/search/FilterInput";
import { Calendar, User, Hash, Eye, Share2, MessageCircle, Percent } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface TikTokSearchResultsProps {
  searchResults?: any[];
}

export const TikTokSearchResults = ({ searchResults = [] }: TikTokSearchResultsProps) => {
  const { toast } = useToast();
  const [currentPage] = useState(1);
  const [pageSize] = useState(25);
  const isMobile = useIsMobile();
  
  // Filter states
  const [username, setUsername] = useState("");
  const [date, setDate] = useState("");
  const [minLikes, setMinLikes] = useState("");
  const [minViews, setMinViews] = useState("");
  const [minShares, setMinShares] = useState("");
  const [minComments, setMinComments] = useState("");
  const [minEngagement, setMinEngagement] = useState("");
  const [isOpen, setIsOpen] = useState(!isMobile); // Open by default on desktop

  const handleCopyCaption = (caption: string) => {
    navigator.clipboard.writeText(caption);
    toast({
      description: "Caption copied to clipboard",
    });
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('de-DE').replace(/,/g, '.');
  };

  const truncateCaption = (caption: string) => caption;

  // Filter logic
  const filteredResults = searchResults.filter(post => {
    const usernameMatch = username 
      ? post.channel?.username?.toLowerCase().includes(username.toLowerCase()) ||
        post["channel.username"]?.toLowerCase().includes(username.toLowerCase())
      : true;

    const dateMatch = date
      ? post.uploadedAtFormatted?.includes(date)
      : true;

    const likesMatch = minLikes
      ? (post.likes >= parseInt(minLikes) || post["stats.likes"] >= parseInt(minLikes))
      : true;

    const viewsMatch = minViews
      ? (post.views >= parseInt(minViews) || post["stats.views"] >= parseInt(minViews))
      : true;

    const sharesMatch = minShares
      ? (post.shares >= parseInt(minShares) || post["stats.shares"] >= parseInt(minShares))
      : true;

    const commentsMatch = minComments
      ? (post.comments >= parseInt(minComments) || post["stats.comments"] >= parseInt(minComments))
      : true;

    const engagementMatch = minEngagement
      ? (parseFloat(post.engagement) >= parseFloat(minEngagement))
      : true;

    return usernameMatch && dateMatch && likesMatch && viewsMatch && 
           sharesMatch && commentsMatch && engagementMatch;
  });

  const handleReset = () => {
    setUsername("");
    setDate("");
    setMinLikes("");
    setMinViews("");
    setMinShares("");
    setMinComments("");
    setMinEngagement("");
  };

  if (!searchResults.length) {
    return null;
  }

  return (
    <div className="w-full space-y-6">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <TikTokFilterHeader 
          totalResults={searchResults.length}
          filteredResults={filteredResults.length}
          onReset={handleReset}
          currentPosts={filteredResults}
          isMobile={isMobile}
        />
        
        <CollapsibleContent className="space-y-4 px-4 sm:px-6 py-4 bg-card/50 border-x border-b border-border/50">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <FilterInput
              icon={User}
              label="Username"
              value={username}
              onChange={setUsername}
              placeholder="Filter by username..."
            />
            <FilterInput
              icon={Calendar}
              label="Upload Date"
              value={date}
              onChange={setDate}
              placeholder="DD.MM.YYYY"
              isDatePicker
            />
            <FilterInput
              icon={Hash}
              label="Min. Likes"
              value={minLikes}
              onChange={setMinLikes}
              type="number"
              placeholder="Minimum likes..."
            />
            <FilterInput
              icon={Eye}
              label="Min. Views"
              value={minViews}
              onChange={setMinViews}
              type="number"
              placeholder="Minimum views..."
            />
            <FilterInput
              icon={Share2}
              label="Min. Shares"
              value={minShares}
              onChange={setMinShares}
              type="number"
              placeholder="Minimum shares..."
            />
            <FilterInput
              icon={MessageCircle}
              label="Min. Comments"
              value={minComments}
              onChange={setMinComments}
              type="number"
              placeholder="Minimum comments..."
            />
            <FilterInput
              icon={Percent}
              label="Min. Engagement (%)"
              value={minEngagement}
              onChange={setMinEngagement}
              type="number"
              placeholder="Minimum engagement..."
            />
          </div>
        </CollapsibleContent>
      </Collapsible>

      <TikTokTableContent 
        currentPosts={filteredResults}
        handleCopyCaption={handleCopyCaption}
        formatNumber={formatNumber}
        truncateCaption={truncateCaption}
      />
    </div>
  );
};