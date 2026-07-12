import React, { useState, useEffect, useMemo } from "react"
import { useSearchParams } from "react-router-dom"
import {
  History,
  RefreshCw,
  AlertTriangle,
  User,
  Info,
  Calendar,
  Layers,
  ArrowRightLeft,
  Settings,
  HelpCircle
} from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useActivityLogsQuery } from "../hooks/useActivityLogs"
import Pagination from "@/components/Pagination"

export default function ActivityLogsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = parseInt(searchParams.get("page") || "1", 10)
  const actionFilter = searchParams.get("action") || ""
  const entityFilter = searchParams.get("entityType") || ""

  // Build params
  const logParams = useMemo(() => {
    const params = { page, limit: 10 }
    if (actionFilter) params.action = actionFilter
    if (entityFilter) params.entityType = entityFilter
    return params
  }, [page, actionFilter, entityFilter])

  // Query real logs
  const { data: logsData, isLoading, isError, error, refetch } = useActivityLogsQuery(logParams)
  const auditLogs = logsData?.data?.auditLogs || []
  const pagination = logsData?.data?.pagination || { page: 1, totalPages: 1, total: 0 }

  // Sync parameters
  useEffect(() => {
    const nextParams = {}
    if (page > 1) nextParams.page = String(page)
    if (actionFilter) nextParams.action = actionFilter
    if (entityFilter) nextParams.entityType = entityFilter
    setSearchParams(nextParams)
  }, [page, actionFilter, entityFilter])

  const handlePageChange = (newPage) => {
    setSearchParams((prev) => {
      prev.set("page", String(newPage))
      return prev
    })
  }

  const handleFilterChange = (key, value) => {
    setSearchParams((prev) => {
      prev.set("page", "1")
      if (value) {
        prev.set(key, value)
      } else {
        prev.delete(key)
      }
      return prev
    })
  }

  const getLogBadge = (action) => {
    // Coloring logic based on action classifications
    if (action.startsWith("asset_allocated") || action.startsWith("asset_transferred")) {
      return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-200/35 font-bold text-[9px]">Custody</Badge>
    }
    if (action.startsWith("asset_returned") || action.startsWith("asset_created")) {
      return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-200/35 font-bold text-[9px]">Inventory</Badge>
    }
    if (action.startsWith("maintenance")) {
      return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-200/35 font-bold text-[9px]">Maintenance</Badge>
    }
    if (action.startsWith("resource")) {
      return <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-200/35 font-bold text-[9px]">Booking</Badge>
    }
    if (action.startsWith("asset_audit")) {
      return <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-200/35 font-bold text-[9px]">Reconciliation</Badge>
    }
    return <Badge variant="outline" className="bg-neutral-500/10 text-neutral-600 border-neutral-200/35 font-bold text-[9px]">Log</Badge>
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 animate-fade-in text-xs sm:text-sm">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
          <History className="h-6 w-6 text-primary" />
          System Activity Logs
        </h2>
        <p className="text-xs text-muted-foreground font-medium">
          Review immutable, system-wide audit logs showing employee transactions, device registration, and operational changes.
        </p>
      </div>

      {/* Filter panel */}
      <Card className="border border-border/50 shadow-xs">
        <div className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="flex-1 flex gap-2 flex-wrap">
            <select
              value={actionFilter}
              onChange={(e) => handleFilterChange("action", e.target.value)}
              className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs select-none shadow-2xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">All Action Types</option>
              <option value="asset_created">Asset Registered</option>
              <option value="asset_updated">Asset Updated</option>
              <option value="asset_retired">Asset Retired</option>
              <option value="asset_allocated">Asset Allocated</option>
              <option value="asset_returned">Asset Returned</option>
              <option value="asset_transferred">Asset Transferred</option>
              <option value="maintenance_requested">Maintenance Requested</option>
              <option value="maintenance_approved">Maintenance Approved</option>
              <option value="maintenance_rejected">Maintenance Rejected</option>
              <option value="maintenance_resolved">Maintenance Resolved</option>
              <option value="resource_created">Resource Created</option>
              <option value="resource_booked">Resource Booked</option>
              <option value="resource_booking_cancelled">Booking Cancelled</option>
              <option value="resource_booking_completed">Booking Completed</option>
              <option value="asset_audit_created">Audit Cycle Created</option>
              <option value="asset_audit_started">Audit Cycle Started</option>
              <option value="asset_audit_completed">Audit Cycle Completed</option>
            </select>

            <select
              value={entityFilter}
              onChange={(e) => handleFilterChange("entityType", e.target.value)}
              className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-xs select-none shadow-2xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">All Entity Modules</option>
              <option value="Asset">Asset catalog</option>
              <option value="Allocation">Allocations</option>
              <option value="Maintenance">Maintenance tickets</option>
              <option value="Resource">Shared resources</option>
              <option value="ResourceBooking">Resource bookings</option>
              <option value="AssetAudit">Physical audits</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Logs Table */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground">Retrieving immutable audit logs feed...</p>
        </div>
      ) : isError ? (
        <div className="text-center py-20 text-destructive space-y-4">
          <AlertTriangle className="h-10 w-10 mx-auto" />
          <h3 className="font-bold text-foreground">Failed to load activity logs</h3>
          <p className="text-xs text-muted-foreground">{error?.message || "An error occurred."}</p>
          <Button onClick={() => refetch()} variant="outline" size="sm">Retry</Button>
        </div>
      ) : auditLogs.length === 0 ? (
        <Card className="border border-dashed border-border/40 p-12 text-center">
          <History className="h-12 w-12 text-muted-foreground/60 mx-auto mb-3" />
          <h3 className="font-bold text-foreground mb-1">No Activity Logs</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
            There are no registered system actions matching the selected filter query.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="bg-card border rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b bg-muted/20 text-muted-foreground font-extrabold">
                    <th className="p-4 pl-6">Actor</th>
                    <th className="p-4">Action Details</th>
                    <th className="p-4">Module</th>
                    <th className="p-4">Category</th>
                    <th className="p-4 pr-6">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log._id} className="border-b last:border-0 hover:bg-muted/10 transition-colors">
                      <td className="p-4 pl-6">
                        <div className="font-bold text-foreground">{log.actor?.name || "System"}</div>
                        {log.actor?.employeeId && (
                          <div className="text-[10px] text-muted-foreground font-mono">ID: {log.actor.employeeId}</div>
                        )}
                      </td>
                      <td className="p-4 font-medium text-muted-foreground leading-relaxed">
                        {log.description}
                      </td>
                      <td className="p-4 font-semibold text-foreground">{log.entityType}</td>
                      <td className="p-4">{getLogBadge(log.activityType)}</td>
                      <td className="p-4 pr-6 text-muted-foreground font-medium">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            limit={10}
            onPageChange={handlePageChange}
            label="activities"
          />
        </div>
      )}
    </div>
  )
}
