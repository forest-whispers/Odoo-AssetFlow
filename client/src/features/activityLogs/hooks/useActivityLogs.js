import { useQuery } from "@tanstack/react-query"
import { activityLogsApi } from "../api/activityLogsApi"

export const LOG_KEYS = {
  all: ["activityLogs"],
  list: (params) => [...LOG_KEYS.all, params],
}

export function useActivityLogsQuery(params) {
  return useQuery({
    queryKey: LOG_KEYS.list(params),
    queryFn: () => activityLogsApi.getActivityLogs(params),
    staleTime: 10000,
  })
}
