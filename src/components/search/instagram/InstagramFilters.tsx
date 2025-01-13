import { FilterInput } from "../FilterInput";
import { FilterState } from "@/utils/filterResults";
import { Eye, Play, Heart, MessageCircle, TrendingUp, Calendar } from "lucide-react";

interface InstagramFiltersProps {
  filters: FilterState;
  onFilterChange: (key: keyof FilterState, value: string) => void;
}

export const InstagramFilters = ({ filters, onFilterChange }: InstagramFiltersProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
      <FilterInput
        icon={Eye}
        label="Min. Views"
        value={filters.minViews}
        onChange={(value) => onFilterChange('minViews', value)}
        placeholder="e.g., 1.000"
        type="number"
      />
      <FilterInput
        icon={Play}
        label="Min. Plays"
        value={filters.minPlays}
        onChange={(value) => onFilterChange('minPlays', value)}
        placeholder="e.g., 1.000"
        type="number"
      />
      <FilterInput
        icon={Heart}
        label="Min. Likes"
        value={filters.minLikes}
        onChange={(value) => onFilterChange('minLikes', value)}
        placeholder="e.g., 1.000"
        type="number"
      />
      <FilterInput
        icon={MessageCircle}
        label="Min. Comments"
        value={filters.minComments}
        onChange={(value) => onFilterChange('minComments', value)}
        placeholder="e.g., 100"
        type="number"
      />
      <FilterInput
        icon={TrendingUp}
        label="Min. Engagement"
        value={filters.minEngagement}
        onChange={(value) => onFilterChange('minEngagement', value)}
        placeholder="e.g., 5.5"
        type="number"
        step="0.1"
      />
      <FilterInput
        icon={Calendar}
        label="Posts Newer Than"
        value={filters.postsNewerThan}
        onChange={(value) => onFilterChange('postsNewerThan', value)}
        isDatePicker={true}
      />
    </div>
  );
};