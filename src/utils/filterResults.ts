import { InstagramPost } from "@/types/instagram";
import { parse, isAfter } from "date-fns";

export interface FilterState {
  postsNewerThan: string;
  minViews: string;
  minPlays: string;
  minLikes: string;
  minComments: string;
  minEngagement: string;
}

const parseGermanNumber = (value: string): number => {
  if (!value) return 0;
  // Remove thousand separators (dots) and convert to number
  const normalizedValue = value.replace(/\./g, '');
  return parseInt(normalizedValue, 10);
};

export const filterResults = (posts: InstagramPost[], filters: FilterState) => {
  return posts.filter(post => {
    // Filter by date
    if (filters.postsNewerThan) {
      try {
        const filterDate = parse(filters.postsNewerThan, 'dd.MM.yyyy', new Date());
        const postDate = new Date(post.timestamp || post.date);
        
        if (!isAfter(postDate, filterDate)) {
          return false;
        }
      } catch (error) {
        console.error('Error parsing date:', error);
      }
    }

    // Filter by minimum views
    if (filters.minViews) {
      const minViews = parseGermanNumber(filters.minViews);
      if (post.viewsCount < minViews) {
        return false;
      }
    }

    // Filter by minimum plays
    if (filters.minPlays) {
      const minPlays = parseGermanNumber(filters.minPlays);
      if (post.playsCount < minPlays) {
        return false;
      }
    }

    // Filter by minimum likes
    if (filters.minLikes) {
      const minLikes = parseGermanNumber(filters.minLikes);
      if (post.likesCount < minLikes) {
        return false;
      }
    }

    // Filter by minimum comments
    if (filters.minComments) {
      const minComments = parseGermanNumber(filters.minComments);
      if (post.commentsCount < minComments) {
        return false;
      }
    }

    // Filter by minimum engagement
    if (filters.minEngagement) {
      const minEngagement = parseGermanNumber(filters.minEngagement);
      const engagement = ((post.likesCount + post.commentsCount) / post.viewsCount) * 100;
      if (engagement < minEngagement) {
        return false;
      }
    }

    return true;
  });
};