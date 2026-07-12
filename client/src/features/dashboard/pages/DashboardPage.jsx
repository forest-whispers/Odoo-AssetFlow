import { useQuery } from "@tanstack/react-query"
import { useSelector } from "react-redux"
import { dashboardApi } from "../api/dashboardApi"
import {
  Package,
  CheckCircle2,
  UserCheck,
  Wrench,
  AlertTriangle,
  Users,
  Building2,
  Calendar,
  Clock,
  ArrowRight,
  TrendingUp,
  FileText,
  User,
  ShieldAlert,
  Loader2
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

// Reusable Stat Card Component with premium styling
function StatCard({ title, value, description, icon: Icon, trend, variant = "default" }) {
  const variantStyles = {
    default: "border-border/50 bg-card",
    primary: "border-primary/10 bg-primary/5",
    destructive: "border-destructive/10 bg-destructive/5 text-destructive",
    success: "border-emerald-500/10 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400",
    warning: "border-amber-500/10 bg-amber-500/5 text-amber-600 dark:text-amber-400"
  }

  return (
    <Card className={`border shadow-xs transition-all duration-300 hover:shadow-md ${variantStyles[variant]}`}>
      <CardContent className="p-5 flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{title}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight">{value}</span>
            {trend && (
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                <TrendingUp className="h-3 w-3" />
                {trend}
              </span>
            )}
          </div>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        <div className={`p-2.5 rounded-xl ${
          variant === "default" ? "bg-muted/80 text-muted-foreground" : "bg-background shadow-xs"
        }`}>
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const { user } = useSelector((state) => state.auth)
  const currentRole = user?.role || "employee"

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["dashboard", currentRole],
    queryFn: dashboardApi.getDashboardData,
    staleTime: 30000, // 30 seconds cache stability
  })

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-medium">Loading your operations center...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="h-12 w-12 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-bold text-foreground">Failed to load dashboard</h3>
        <p className="text-sm text-muted-foreground max-w-md text-center">
          {error.response?.data?.message || error.message || "An unexpected network error occurred."}
        </p>
        <Button onClick={() => refetch()} variant="outline" size="sm" className="cursor-pointer">
          Try Again
        </Button>
      </div>
    )
  }

  const dashboardData = data?.data || {}
  const stats = dashboardData.stats || {}
  const recentActivity = dashboardData.recentActivity || {}

  // Helper: Format Date
  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A"
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric"
    })
  }

  // Render Admin / Asset Manager Dashboard
  if (currentRole === "admin" || currentRole === "asset_manager") {
    return (
      <div className="space-y-8">
        {/* Welcome Banner */}
        <div>
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl text-foreground">
            Asset Operations Center
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Overview of enterprise physical assets, bookings, and active maintenance workflows.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Active Assets"
            value={stats.totalAssets || 0}
            description={`Retired: ${stats.retiredAssets || 0}`}
            icon={Package}
            variant="primary"
          />
          <StatCard
            title="Available Assets"
            value={stats.availableAssets || 0}
            description="Ready for allocation"
            icon={CheckCircle2}
            variant="success"
          />
          <StatCard
            title="Allocated Assets"
            value={stats.allocatedAssets || 0}
            description={`Active allocations: ${stats.activeAllocations || 0}`}
            icon={UserCheck}
          />
          <StatCard
            title="Under Maintenance"
            value={stats.maintenanceAssets || 0}
            description={`Critical requests: ${stats.criticalMaintenance || 0}`}
            icon={Wrench}
            variant={stats.criticalMaintenance > 0 ? "destructive" : "warning"}
          />
        </div>

        {/* Second Row Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Departments"
            value={stats.totalDepartments || 0}
            description="Active cost centers"
            icon={Building2}
          />
          <StatCard
            title="Total Personnel"
            value={stats.totalEmployees || 0}
            description="Registered employees"
            icon={Users}
          />
          <StatCard
            title="Resources Booked"
            value={stats.upcomingBookings || 0}
            description={`Total resources: ${stats.totalResources || 0}`}
            icon={Calendar}
          />
          <StatCard
            title="Pending Actions"
            value={stats.pendingMaintenance || 0}
            description="Awaiting triage"
            icon={AlertTriangle}
            variant={stats.pendingMaintenance > 0 ? "warning" : "default"}
          />
        </div>

        {/* Recent Activity lists */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Allocations */}
          <Card className="border border-border/50 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between border-b pb-4 mb-4">
              <div>
                <CardTitle className="text-sm font-bold">Recent Allocations</CardTitle>
                <CardDescription className="text-xs">Latest assets assigned to employees</CardDescription>
              </div>
              <Badge variant="outline" className="text-[10px] font-bold">Allocations</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              {!recentActivity.allocations || recentActivity.allocations.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-xs">
                  No recent allocation activity recorded.
                </div>
              ) : (
                recentActivity.allocations.map((alloc) => (
                  <div key={alloc._id} className="flex items-center justify-between text-xs border-b border-border/10 pb-3 last:border-0 last:pb-0">
                    <div className="space-y-1">
                      <p className="font-bold text-foreground">{alloc.asset?.name || "Unknown Asset"}</p>
                      <p className="text-muted-foreground text-[10px] flex items-center gap-1.5">
                        <span>Tag: {alloc.asset?.assetTag || "N/A"}</span>
                        <span>•</span>
                        <span>Assignee: {alloc.employee?.name || "N/A"}</span>
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      <Badge variant={alloc.status === "active" ? "default" : "secondary"} className="text-[9px] uppercase px-1.5 h-4.5 font-bold">
                        {alloc.status}
                      </Badge>
                      <p className="text-[10px] text-muted-foreground">{formatDate(alloc.createdAt)}</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Recent Maintenance */}
          <Card className="border border-border/50 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between border-b pb-4 mb-4">
              <div>
                <CardTitle className="text-sm font-bold">Maintenance Triage</CardTitle>
                <CardDescription className="text-xs">Latest service requests and breakdowns</CardDescription>
              </div>
              <Badge variant="outline" className="text-[10px] font-bold text-destructive border-destructive/20 bg-destructive/5">Maintenance</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              {!recentActivity.maintenance || recentActivity.maintenance.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-xs">
                  No recent maintenance reports.
                </div>
              ) : (
                recentActivity.maintenance.map((maint) => (
                  <div key={maint._id} className="flex items-center justify-between text-xs border-b border-border/10 pb-3 last:border-0 last:pb-0">
                    <div className="space-y-1">
                      <p className="font-bold text-foreground">{maint.asset?.name || "Unknown Asset"}</p>
                      <p className="text-muted-foreground text-[10px] flex items-center gap-1.5">
                        <span>Tag: {maint.asset?.assetTag || "N/A"}</span>
                        <span>•</span>
                        <span className={`font-bold ${
                          maint.priority === "critical" ? "text-destructive" : "text-muted-foreground"
                        }`}>
                          Priority: {maint.priority || "normal"}
                        </span>
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      <Badge variant={maint.status === "pending" ? "destructive" : "secondary"} className="text-[9px] uppercase px-1.5 h-4.5 font-bold">
                        {maint.status}
                      </Badge>
                      <p className="text-[10px] text-muted-foreground">{formatDate(maint.createdAt)}</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Render Department Head Dashboard
  if (currentRole === "department_head") {
    const deptInfo = dashboardData.profile?.department || {}
    return (
      <div className="space-y-8">
        {/* Welcome Banner */}
        <div>
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl text-foreground">
            Department Asset Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Cost Center: <span className="font-bold text-primary">{deptInfo.name || "N/A"} ({deptInfo.code || "N/A"})</span>
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Department Assets"
            value={stats.departmentAssets || 0}
            description="Total assets assigned to dept"
            icon={Package}
            variant="primary"
          />
          <StatCard
            title="Available"
            value={stats.availableAssets || 0}
            description="Ready inside department"
            icon={CheckCircle2}
            variant="success"
          />
          <StatCard
            title="Allocated to Staff"
            value={stats.allocatedAssets || 0}
            description={`Active allocations: ${stats.activeAllocations || 0}`}
            icon={UserCheck}
          />
          <StatCard
            title="Under Repair"
            value={stats.maintenanceAssets || 0}
            description={`Pending repairs: ${stats.pendingMaintenance || 0}`}
            icon={Wrench}
            variant={stats.pendingMaintenance > 0 ? "warning" : "default"}
          />
        </div>

        {/* Team stats card */}
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            title="Department Staff"
            value={stats.departmentEmployees || 0}
            description="Active employees"
            icon={Users}
          />
          <StatCard
            title="Upcoming Bookings"
            value={stats.upcomingBookings || 0}
            description="Resource bookings by staff"
            icon={Calendar}
          />
        </div>

        {/* Department Activity lists */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Department Allocations */}
          <Card className="border border-border/50 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between border-b pb-4 mb-4">
              <div>
                <CardTitle className="text-sm font-bold">Department Allocations</CardTitle>
                <CardDescription className="text-xs">Latest allocations for team members</CardDescription>
              </div>
              <Badge variant="outline" className="text-[10px] font-bold">Team Allocations</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              {!recentActivity.allocations || recentActivity.allocations.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-xs">
                  No active allocations for this department.
                </div>
              ) : (
                recentActivity.allocations.map((alloc) => (
                  <div key={alloc._id} className="flex items-center justify-between text-xs border-b border-border/10 pb-3 last:border-0 last:pb-0">
                    <div className="space-y-1">
                      <p className="font-bold text-foreground">{alloc.asset?.name || "Unknown Asset"}</p>
                      <p className="text-muted-foreground text-[10px] flex items-center gap-1.5">
                        <span>Tag: {alloc.asset?.assetTag || "N/A"}</span>
                        <span>•</span>
                        <span>Employee: {alloc.employee?.name || "N/A"}</span>
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      <Badge variant={alloc.status === "active" ? "default" : "secondary"} className="text-[9px] uppercase px-1.5 h-4.5 font-bold">
                        {alloc.status}
                      </Badge>
                      <p className="text-[10px] text-muted-foreground">{formatDate(alloc.createdAt)}</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Department Maintenance */}
          <Card className="border border-border/50 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between border-b pb-4 mb-4">
              <div>
                <CardTitle className="text-sm font-bold">Department Maintenance</CardTitle>
                <CardDescription className="text-xs">Breakdowns and repair tickets reported on dept assets</CardDescription>
              </div>
              <Badge variant="outline" className="text-[10px] font-bold text-destructive border-destructive/20 bg-destructive/5">Breakdowns</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              {!recentActivity.maintenance || recentActivity.maintenance.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-xs">
                  No active department maintenance tickets.
                </div>
              ) : (
                recentActivity.maintenance.map((maint) => (
                  <div key={maint._id} className="flex items-center justify-between text-xs border-b border-border/10 pb-3 last:border-0 last:pb-0">
                    <div className="space-y-1">
                      <p className="font-bold text-foreground">{maint.asset?.name || "Unknown Asset"}</p>
                      <p className="text-muted-foreground text-[10px] flex items-center gap-1.5">
                        <span>Tag: {maint.asset?.assetTag || "N/A"}</span>
                        <span>•</span>
                        <span>Reported by: {maint.reportedBy?.name || "N/A"}</span>
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      <Badge variant={maint.status === "pending" ? "destructive" : "secondary"} className="text-[9px] uppercase px-1.5 h-4.5 font-bold">
                        {maint.status}
                      </Badge>
                      <p className="text-[10px] text-muted-foreground">{formatDate(maint.createdAt)}</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Render Employee Dashboard (default)
  const employeeInfo = dashboardData.profile || {}
  const nextBooking = dashboardData.nextBooking || null

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div>
        <h1 className="text-2xl font-black tracking-tight sm:text-3xl text-foreground">
          Welcome back, {employeeInfo.name || "User"}
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          {employeeInfo.jobTitle || "Employee"} • Dept: {employeeInfo.department?.name || "Unassigned"}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="My Allocated Assets"
          value={stats.activeAllocations || 0}
          description="Assets currently in my custody"
          icon={Package}
          variant="primary"
        />
        <StatCard
          title="Active Repairs"
          value={stats.inProgressMaintenance || 0}
          description="Assets currently under service"
          icon={Wrench}
          variant="warning"
        />
        <StatCard
          title="Pending Tickets"
          value={stats.pendingMaintenance || 0}
          description="Breakdowns I reported"
          icon={AlertTriangle}
        />
        <StatCard
          title="My Bookings"
          value={stats.upcomingBookings || 0}
          description="Upcoming resource reservations"
          icon={Calendar}
          variant="success"
        />
      </div>

      {/* Main Employee Content Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Next Booking Detail */}
        <Card className="border border-border/50 shadow-xs lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between border-b pb-4 mb-4">
            <div>
              <CardTitle className="text-sm font-bold">Upcoming Reservation</CardTitle>
              <CardDescription className="text-xs">Your next booked space or resource</CardDescription>
            </div>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {!nextBooking ? (
              <div className="text-center py-10 text-muted-foreground text-xs space-y-2">
                <p>No upcoming bookings scheduled.</p>
                <p className="text-[10px]">Reserve conference rooms or tools in the Resource Booking page.</p>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 space-y-3">
                  <div>
                    <span className="text-[10px] uppercase font-black text-muted-foreground tracking-wider block">Resource</span>
                    <span className="font-bold text-foreground text-sm">{nextBooking.resource?.name || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-black text-muted-foreground tracking-wider block">Location</span>
                    <span className="font-bold text-foreground">{nextBooking.resource?.location || "N/A"}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <span className="text-[10px] uppercase font-black text-muted-foreground tracking-wider block">Start</span>
                      <span className="font-bold text-foreground text-[11px]">{new Date(nextBooking.startTime).toLocaleString([], {month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-black text-muted-foreground tracking-wider block">End</span>
                      <span className="font-bold text-foreground text-[11px]">{new Date(nextBooking.endTime).toLocaleString([], {month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge className="font-bold uppercase text-[9px] px-1.5 h-4.5">{nextBooking.status}</Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* My Custody Assets (Recent Allocations) */}
        <Card className="border border-border/50 shadow-xs lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between border-b pb-4 mb-4">
            <div>
              <CardTitle className="text-sm font-bold">My Asset Custody</CardTitle>
              <CardDescription className="text-xs">Assets currently assigned to you</CardDescription>
            </div>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-4">
            {!recentActivity.allocations || recentActivity.allocations.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-xs">
                No active assets allocated.
              </div>
            ) : (
              recentActivity.allocations.map((alloc) => (
                <div key={alloc._id} className="flex items-center justify-between text-xs border-b border-border/10 pb-3 last:border-0 last:pb-0">
                  <div className="space-y-1">
                    <p className="font-bold text-foreground">{alloc.asset?.name || "Unknown Asset"}</p>
                    <p className="text-muted-foreground text-[10px]">Tag: {alloc.asset?.assetTag || "N/A"} • Loc: {alloc.asset?.location || "N/A"}</p>
                  </div>
                  <Badge variant={alloc.status === "active" ? "default" : "secondary"} className="text-[9px] uppercase px-1.5 h-4.5 font-bold">
                    {alloc.status}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Breakdown Reports (Recent Maintenance) */}
        <Card className="border border-border/50 shadow-xs lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between border-b pb-4 mb-4">
            <div>
              <CardTitle className="text-sm font-bold">My Breakdown Reports</CardTitle>
              <CardDescription className="text-xs">Maintenance and repairs you requested</CardDescription>
            </div>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-4">
            {!recentActivity.maintenance || recentActivity.maintenance.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-xs">
                No maintenance tickets reported by you.
              </div>
            ) : (
              recentActivity.maintenance.map((maint) => (
                <div key={maint._id} className="flex items-center justify-between text-xs border-b border-border/10 pb-3 last:border-0 last:pb-0">
                  <div className="space-y-1">
                    <p className="font-bold text-foreground">{maint.asset?.name || "Unknown Asset"}</p>
                    <p className="text-muted-foreground text-[10px]">Tag: {maint.asset?.assetTag || "N/A"} • Code: {maint.maintenanceCode || "N/A"}</p>
                  </div>
                  <Badge variant={maint.status === "pending" ? "destructive" : "secondary"} className="text-[9px] uppercase px-1.5 h-4.5 font-bold">
                    {maint.status}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
