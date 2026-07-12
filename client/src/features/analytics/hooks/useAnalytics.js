import { useQuery } from "@tanstack/react-query"
import { analyticsApi } from "../api/analyticsApi"

export const ANALYTICS_KEYS = {
  all: ["analytics"],
  detail: (params) => [...ANALYTICS_KEYS.all, params],
}

export function useAnalyticsQuery(params) {
  return useQuery({
    queryKey: ANALYTICS_KEYS.detail(params),
    queryFn: () => analyticsApi.getAnalytics(params),
    staleTime: 30000, // Analytics are computed heavy, set appropriate stale time
  })
}
