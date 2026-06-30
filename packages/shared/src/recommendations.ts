// V2/V3 extension point. Smart recommendations / AI concierge are OUT OF SCOPE
// for MVP (see build spec). We define the interface and a no-op implementation
// so call sites exist and can be swapped for a real provider later.

import type { Business, UUID } from './types';

export interface RecommendationContext {
  userId: UUID;
  lat?: number;
  lng?: number;
  recentCategoryIds?: string[];
}

export interface RecommendationService {
  recommendBusinesses(ctx: RecommendationContext, limit: number): Promise<Business[]>;
}

/** Default no-op. Returns nothing until a real ranking model is wired in. */
export const noopRecommendationService: RecommendationService = {
  async recommendBusinesses() {
    return [];
  },
};
