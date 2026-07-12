import React, { useState, useMemo } from "react"
import { useSearchParams } from "react-router-dom"
import {
  Bell,
  CheckCheck,
  AlertTriangle,
  ClipboardCheck,
  Calendar,
  Package,
  RefreshCw,
  Wrench,
  Inbox,
  AlertCircle
} from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Pagination from "@/components/Pagination"
import {
  useNotificationsQuery,
  useNotificationsUnreadCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation
} from "../hooks/useNotifications"

export default function NotificationsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = parseInt(searchParams.get("page") || "1", 10)
  const activeTab = searchParams.get("tab") || "all"

  // Map tabs to comma-separated backend types
  const typeFilter = useMemo(() => {
    if (activeTab === "alerts") return "alert,audit"
    if (activeTab === "approvals") return "approval"
    if (activeTab === "bookings") return "booking"
    return "" // all
  }, [activeTab])

  // Queries
  const { data: notificationsData, isLoading, isError, error } = useNotificationsQuery({
    page,
    limit: 15,
    type: typeFilter
  })
  
  const { data: unreadData } = useNotificationsUnreadCountQuery()
  const unreadCount = unreadData?.data?.count || 0

  // Mutations
  const markReadMutation = useMarkNotificationReadMutation()
  const markAllReadMutation = useMarkAllNotificationsReadMutation()

  const notificationsList = notificationsData?.data?.notifications || []
  const pagination = notificationsData?.data?.pagination || { page: 1, totalPages: 1, total: 0 }

  const handleTabChange = (tab) => {
    setSearchParams({ tab, page: "1" })
  }

  const handlePageChange = (newPage) => {
    setSearchParams((prev) => {
      prev.set("page", String(newPage))
      return prev
    })
  }

  const handleMarkRead = (id, isRead) => {
    if (!isRead) {
      markReadMutation.mutate(id)
    }
  }

  const handleMarkAllRead = () => {
    if (unreadCount > 0) {
      markAllReadMutation.mutate()
    }
  }

  const getRelativeTime = (dateStr) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays === 1) return "Yesterday"
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const getNotificationIcon = (type) => {
    const icons = {
      alert: <AlertTriangle className="h-5 w-5 text-rose-500" />,
      audit: <ClipboardCheck className="h-5 w-5 text-amber-500" />,
      approval: <CheckCheck className="h-5 w-5 text-emerald-500" />,
      booking: <Calendar className="h-5 w-5 text-blue-500" />,
      allocation: <Package className="h-5 w-5 text-indigo-500" />,
      transfer: <RefreshCw className="h-5 w-5 text-purple-500" />,
      maintenance: <Wrench className="h-5 w-5 text-orange-500" />
    }
    return icons[type] || <Bell className="h-5 w-5 text-muted-foreground" />
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4 sm:p-6 animate-fade-in text-xs sm:text-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
            Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="font-extrabold text-[10px] h-5 rounded-full px-2">
                {unreadCount} unread
              </Badge>
            )}
          </h2>
          <p className="text-xs text-muted-foreground">
            Stay updated with your asset allocations, maintenance requests, and bookings.
          </p>
        </div>
        
        {unreadCount > 0 && (
          <Button
            onClick={handleMarkAllRead}
            disabled={markAllReadMutation.isPending}
            variant="outline"
            className="cursor-pointer gap-2 h-9 rounded-xl font-bold self-start sm:self-auto text-xs"
          >
            <CheckCheck className="h-4 w-4" /> Mark all as read
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Card className="border border-border/50 shadow-xs">
        <CardContent className="p-4 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex gap-2 flex-wrap bg-muted/20 p-1.5 rounded-xl border border-border/10">
            {[
              { key: "all", label: "All" },
              { key: "alerts", label: "Alerts" },
              { key: "approvals", label: "Approvals" },
              { key: "bookings", label: "Bookings" }
            ].map((tab) => (
              <Button
                key={tab.key}
                variant={activeTab === tab.key ? "default" : "ghost"}
                onClick={() => handleTabChange(tab.key)}
                className="rounded-lg font-bold text-xs h-8 px-4 cursor-pointer"
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* List Container */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground">Retrieving notifications...</p>
        </div>
      ) : isError ? (
        <div className="text-center py-20 text-destructive space-y-4">
          <AlertCircle className="h-10 w-10 mx-auto" />
          <h3 className="font-bold text-foreground">Error loading notifications</h3>
          <p className="text-xs text-muted-foreground">{error?.message || "An error occurred."}</p>
        </div>
      ) : notificationsList.length === 0 ? (
        <Card className="border border-dashed border-border/40 p-16 text-center">
          <Inbox className="h-12 w-12 text-muted-foreground/60 mx-auto mb-3" />
          <h3 className="font-bold text-foreground mb-1">All Caught Up!</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
            There are no notifications logged under this category.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="bg-card border rounded-2xl overflow-hidden shadow-xs divide-y divide-border/30">
            {notificationsList.map((notif) => (
              <div
                key={notif._id}
                onClick={() => handleMarkRead(notif._id, notif.isRead)}
                className={`p-4 flex gap-4 transition-all duration-200 cursor-pointer ${
                  notif.isRead
                    ? "hover:bg-muted/10 opacity-75"
                    : "bg-primary/5 hover:bg-primary/10"
                }`}
              >
                {/* Visual indicator icon */}
                <div className="shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-background border border-border/30 shadow-2xs">
                  {getNotificationIcon(notif.type)}
                </div>

                {/* Message body */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className={`text-xs font-extrabold truncate ${
                      notif.isRead ? "text-foreground/80" : "text-foreground"
                    }`}>
                      {notif.title}
                    </h4>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {getRelativeTime(notif.createdAt)}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-xs leading-relaxed break-words">
                    {notif.message}
                  </p>
                </div>

                {/* Unread circle badge */}
                {!notif.isRead && (
                  <div className="shrink-0 flex items-center justify-center self-center pr-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            limit={15}
            onPageChange={handlePageChange}
            label="notifications"
          />
        </div>
      )}
    </div>
  )
}
