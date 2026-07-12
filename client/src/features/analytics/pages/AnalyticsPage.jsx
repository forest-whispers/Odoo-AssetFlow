import React, { useState, useMemo } from "react"
import { useSearchParams } from "react-router-dom"
import { useSelector } from "react-redux"
import {
  TrendingUp,
  RefreshCw,
  AlertTriangle,
  Building,
  Wrench,
  BookOpen,
  Calendar,
  Layers,
  ArrowUpRight,
  TrendingDown,
  Info
} from "lucide-react"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from "recharts"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useAnalyticsQuery } from "../hooks/useAnalytics"
import { Badge } from "@/components/ui/badge"

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"]

export default function AnalyticsPage() {
  const { user } = useSelector((state) => state.auth)
  const [searchParams, setSearchParams] = useSearchParams()
  const range = searchParams.get("range") || "30d"

  const handleRangeChange = (newRange) => {
    setSearchParams({ range: newRange })
  }

  // Fetch real analytics data
  const { data: analyticsData, isLoading, isError, error, refetch } = useAnalyticsQuery({ range })
  const data = analyticsData?.data || {}

  const kpis = data.kpis || {
    totalAssets: 0,
    availableAssets: 0,
    allocatedAssets: 0,
    underMaintenance: 0,
    utilizationRate: 0,
  }

  // Process data for charts
  const statusDistribution = useMemo(() => {
    return [
      { name: "Available", value: kpis.availableAssets, color: "#10b981" },
      { name: "Allocated", value: kpis.allocatedAssets, color: "#3b82f6" },
      { name: "Maintenance", value: kpis.underMaintenance, color: "#f59e0b" },
    ].filter(item => item.value > 0)
  }, [kpis])

  const utilizationByDepartment = data.utilizationByDepartment || []
  const maintenanceTrend = data.maintenanceTrend || []
  const mostUsedResources = data.mostUsedResources || []
  const idleAssets = data.idleAssets || []
  const assetsNearingRetirement = data.assetsNearingRetirement || []

  // Safe checks for empty datasets
  const hasStatusData = statusDistribution.length > 0
  const hasDeptData = utilizationByDepartment.length > 0
  const hasTrendData = maintenanceTrend.length > 0
  const hasResourceData = mostUsedResources.length > 0

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 animate-fade-in text-xs sm:text-sm">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">Reports & Analytics</h2>
          <p className="text-xs text-muted-foreground font-medium">
            Perform enterprise operations audit, analyze asset utilization rates, and review lifecycle maintenance trends.
          </p>
        </div>

        {/* Date Range Selector */}
        <div className="flex bg-muted/60 p-1 rounded-xl border self-start sm:self-auto">
          {["7d", "30d", "90d"].map((r) => (
            <button
              key={r}
              onClick={() => handleRangeChange(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                range === r
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r === "7d" ? "Last Week" : r === "30d" ? "Last Month" : "Last Quarter"}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-40 gap-4">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground">Calculating statistics and compiling metrics...</p>
        </div>
      ) : isError ? (
        <div className="text-center py-20 text-destructive space-y-4">
          <AlertTriangle className="h-10 w-10 mx-auto" />
          <h3 className="font-bold text-foreground">Failed to compile reports</h3>
          <p className="text-xs text-muted-foreground">{error?.message || "An error occurred."}</p>
          <button onClick={() => refetch()} className="px-4 py-2 border rounded-xl hover:bg-muted text-xs cursor-pointer font-bold">
            Retry Computation
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* KPI Summary Rows */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="border border-border/40 shadow-2xs">
              <CardContent className="p-5 space-y-2">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Total Assets</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-foreground">{kpis.totalAssets}</span>
                </div>
                <div className="text-[9px] text-muted-foreground">Active in catalog</div>
              </CardContent>
            </Card>

            <Card className="border border-border/40 shadow-2xs">
              <CardContent className="p-5 space-y-2">
                <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider block">Available</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-emerald-600">{kpis.availableAssets}</span>
                </div>
                <div className="text-[9px] text-muted-foreground">Ready for allocation</div>
              </CardContent>
            </Card>

            <Card className="border border-border/40 shadow-2xs">
              <CardContent className="p-5 space-y-2">
                <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider block">Allocated</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-blue-600">{kpis.allocatedAssets}</span>
                </div>
                <div className="text-[9px] text-muted-foreground">In active deployment</div>
              </CardContent>
            </Card>

            <Card className="border border-border/40 shadow-2xs">
              <CardContent className="p-5 space-y-2">
                <span className="text-[10px] uppercase font-bold text-amber-600 tracking-wider block">Maintenance</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-amber-600">{kpis.underMaintenance}</span>
                </div>
                <div className="text-[9px] text-muted-foreground">In repair / troubleshooting</div>
              </CardContent>
            </Card>

            <Card className="border border-border/40 shadow-2xs col-span-2 md:col-span-1">
              <CardContent className="p-5 space-y-2">
                <span className="text-[10px] uppercase font-bold text-primary tracking-wider block">Utilization Rate</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-primary">{kpis.utilizationRate}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1 overflow-hidden mt-1.5">
                  <div className="bg-primary h-full" style={{ width: `${kpis.utilizationRate}%` }} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Visualizations Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Status Distribution Donut */}
            <Card className="border border-border/40 shadow-xs">
              <CardHeader className="p-5 pb-0 border-b border-border/10 bg-muted/5">
                <CardTitle className="text-sm font-extrabold text-foreground">Asset Status Distribution</CardTitle>
                <CardDescription className="text-[10px]">Logical status metrics of inventory pool</CardDescription>
              </CardHeader>
              <CardContent className="p-5 flex flex-col sm:flex-row items-center justify-around min-h-[220px]">
                {hasStatusData ? (
                  <>
                    <div className="w-[180px] h-[180px] relative shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={statusDistribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={80}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {statusDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-[9px] uppercase font-bold text-muted-foreground">Utilized</span>
                        <span className="text-lg font-black text-foreground">{kpis.utilizationRate}%</span>
                      </div>
                    </div>
                    <div className="space-y-2 mt-4 sm:mt-0 text-xs">
                      {statusDistribution.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-md shrink-0" style={{ backgroundColor: item.color }} />
                          <span className="text-muted-foreground font-medium">{item.name}:</span>
                          <span className="font-bold text-foreground">{item.value} ({Math.round((item.value / kpis.totalAssets) * 100)}%)</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center text-muted-foreground py-10 text-xs">No active asset catalog.</div>
                )}
              </CardContent>
            </Card>

            {/* Chart 2: Department-wise Asset Count */}
            <Card className="border border-border/40 shadow-xs">
              <CardHeader className="p-5 pb-0 border-b border-border/10 bg-muted/5">
                <CardTitle className="text-sm font-extrabold text-foreground">Department Custody Allocations</CardTitle>
                <CardDescription className="text-[10px]">Distribution of active assets across departments</CardDescription>
              </CardHeader>
              <CardContent className="p-5 min-h-[220px]">
                {hasDeptData ? (
                  <div className="w-full h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={utilizationByDepartment} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb30" />
                        <XAxis dataKey="departmentName" stroke="#888888" fontSize={9} tickLine={false} axisLine={false} />
                        <YAxis stroke="#888888" fontSize={9} tickLine={false} axisLine={false} />
                        <Tooltip
                          contentStyle={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "10px", fontSize: "10px" }}
                        />
                        <Bar dataKey="allocatedAssets" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={30} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-muted-foreground text-xs gap-1">
                    <Building className="h-8 w-8 opacity-40" />
                    <span>No active allocations across units.</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Chart 3: Maintenance Trend */}
            <Card className="border border-border/40 shadow-xs">
              <CardHeader className="p-5 pb-0 border-b border-border/10 bg-muted/5">
                <CardTitle className="text-sm font-extrabold text-foreground">Maintenance Requests Trend</CardTitle>
                <CardDescription className="text-[10px]">Volume of filed tickets over the selected period</CardDescription>
              </CardHeader>
              <CardContent className="p-5 min-h-[220px]">
                {hasTrendData ? (
                  <div className="w-full h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={maintenanceTrend} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorMaintenance" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb30" />
                        <XAxis dataKey="_id" stroke="#888888" fontSize={9} tickLine={false} axisLine={false} />
                        <YAxis stroke="#888888" fontSize={9} tickLine={false} axisLine={false} />
                        <Tooltip
                          contentStyle={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "10px", fontSize: "10px" }}
                        />
                        <Area type="monotone" dataKey="maintenanceRequests" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorMaintenance)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-muted-foreground text-xs gap-1">
                    <Wrench className="h-8 w-8 opacity-40" />
                    <span>No maintenance requests filed during this range.</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Chart 4: Shared Resource Booking Count */}
            <Card className="border border-border/40 shadow-xs">
              <CardHeader className="p-5 pb-0 border-b border-border/10 bg-muted/5">
                <CardTitle className="text-sm font-extrabold text-foreground">Top Shared Resources Usage</CardTitle>
                <CardDescription className="text-[10px]">Booking count statistics of meeting rooms and items</CardDescription>
              </CardHeader>
              <CardContent className="p-5 min-h-[220px]">
                {hasResourceData ? (
                  <div className="w-full h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={mostUsedResources} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb30" />
                        <XAxis type="number" stroke="#888888" fontSize={9} tickLine={false} axisLine={false} />
                        <YAxis dataKey="name" type="category" stroke="#888888" fontSize={9} width={80} tickLine={false} axisLine={false} />
                        <Tooltip
                          contentStyle={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "10px", fontSize: "10px" }}
                        />
                        <Bar dataKey="bookingCount" fill="#10b981" radius={[0, 4, 4, 0]} maxBarSize={15} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-muted-foreground text-xs gap-1">
                    <BookOpen className="h-8 w-8 opacity-40" />
                    <span>No resource booking history registered.</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Operational Risk Tables (Idle & Retirement) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Idle Assets List */}
            <Card className="border border-border/40 shadow-xs">
              <CardHeader className="p-5 pb-3 border-b border-border/10 bg-muted/5 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-extrabold text-foreground">Idle Asset Risks (30+ Days)</CardTitle>
                  <CardDescription className="text-[10px]">Available assets without allocations or allocations prior to threshold</CardDescription>
                </div>
                <Badge variant="secondary" className="text-[9px] rounded-md font-mono">Top {idleAssets.length}</Badge>
              </CardHeader>
              <CardContent className="p-0">
                {idleAssets.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground text-xs">No idle assets detected. All stock is active.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b bg-muted/15 text-muted-foreground font-extrabold text-[10px] uppercase">
                          <th className="p-3 pl-5">Asset</th>
                          <th className="p-3">Location</th>
                          <th className="p-3">Last Active Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {idleAssets.map((asset) => (
                          <tr key={asset._id} className="border-b last:border-0 hover:bg-muted/10">
                            <td className="p-3 pl-5">
                              <span className="font-semibold text-foreground">{asset.name}</span>
                              <span className="text-[9px] font-mono text-muted-foreground block">{asset.assetTag}</span>
                            </td>
                            <td className="p-3 text-muted-foreground">{asset.location || "Central Store"}</td>
                            <td className="p-3 text-foreground font-medium">
                              {asset.lastAllocation 
                                ? new Date(asset.lastAllocation).toLocaleDateString()
                                : "Never Allocated"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Assets Nearing Retirement List */}
            <Card className="border border-border/40 shadow-xs">
              <CardHeader className="p-5 pb-3 border-b border-border/10 bg-muted/5 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-extrabold text-foreground">Assets Nearing Retirement</CardTitle>
                  <CardDescription className="text-[10px]">Assets exceeding lifecycle lifecycle guidelines (exceeding 4 years)</CardDescription>
                </div>
                <Badge variant="secondary" className="text-[9px] rounded-md font-mono">Top {assetsNearingRetirement.length}</Badge>
              </CardHeader>
              <CardContent className="p-0">
                {assetsNearingRetirement.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground text-xs">No assets are nearing retirement.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b bg-muted/15 text-muted-foreground font-extrabold text-[10px] uppercase">
                          <th className="p-3 pl-5">Asset</th>
                          <th className="p-3">Condition</th>
                          <th className="p-3">Purchase Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assetsNearingRetirement.map((asset) => (
                          <tr key={asset._id} className="border-b last:border-0 hover:bg-muted/10">
                            <td className="p-3 pl-5">
                              <span className="font-semibold text-foreground">{asset.name}</span>
                              <span className="text-[9px] font-mono text-muted-foreground block">{asset.assetTag}</span>
                            </td>
                            <td className="p-3 capitalize font-semibold">
                              <span className={
                                asset.condition === "excellent" ? "text-emerald-600" :
                                asset.condition === "good" ? "text-blue-600" :
                                asset.condition === "fair" ? "text-amber-600" : "text-rose-600"
                              }>
                                {asset.condition}
                              </span>
                            </td>
                            <td className="p-3 text-muted-foreground">
                              {asset.purchaseDate 
                                ? new Date(asset.purchaseDate).toLocaleDateString()
                                : "N/A"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
