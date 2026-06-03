import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  TreePine, 
  Users, 
  Building2, 
  Sprout, 
  ArrowUpRight, 
  ArrowDownRight,
  CalendarDays,
  Download,
  RefreshCw,
  Filter,
  ChevronDown
} from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Area, AreaChart, Pie, PieChart, Cell, Legend } from "recharts"
import { useState } from "react"
import barangayData from "@/data/barangay.json"

// --- Barangay Data ---
const barangays = barangayData.features.map((feature: any) => ({
  name: feature.properties.name,
  value: Math.floor(Math.random() * 100) + 50, // Mock data for demonstration
}))

// Generate blue color gradient from light to dark
const generateBlueColors = (count: number) => {
  const colors = []
  for (let i = 0; i < count; i++) {
    const lightness = 90 - (i * (60 / count)) // From 90% (light) to 30% (dark)
    colors.push(`hsl(217, 91%, ${lightness}%)`)
  }
  return colors
}

const pieChartData = barangays.map((barangay, index) => ({
  name: barangay.name.charAt(0).toUpperCase() + barangay.name.slice(1),
  value: barangay.value,
  fill: generateBlueColors(barangays.length)[index]
}))

const pieChartConfig = {
  value: {
    label: "Trees",
  },
}

// --- Stat Cards Data ---
const stats = [
  {
    title: "Trees Planted",
    value: "1,248",
    change: "+18.2%",
    trend: "up",
    icon: TreePine,
    color: "from-emerald-500 to-teal-600",
    bgLight: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    title: "Total Users",
    value: "342",
    change: "+8.4%",
    trend: "up",
    icon: Users,
    color: "from-blue-500 to-indigo-600",
    bgLight: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    title: "Organizations",
    value: "56",
    change: "+12.1%",
    trend: "up",
    icon: Building2,
    color: "from-amber-500 to-orange-600",
    bgLight: "bg-amber-50",
    iconColor: "text-amber-600",
  },
  {
    title: "Survival Rate",
    value: "91%",
    change: "+3.2%",
    trend: "up",
    icon: Sprout,
    color: "from-green-500 to-emerald-600",
    bgLight: "bg-green-50",
    iconColor: "text-green-600",
  },
]

// --- Monthly Tree Planting Data ---
const monthlyData = [
  { month: "Jan", planted: 85, target: 100 },
  { month: "Feb", planted: 120, target: 110 },
  { month: "Mar", planted: 180, target: 150 },
  { month: "Apr", planted: 145, target: 160 },
  { month: "May", planted: 210, target: 190 },
  { month: "Jun", planted: 248, target: 220 },
  { month: "Jul", planted: 195, target: 210 },
  { month: "Aug", planted: 275, target: 250 },
]

const barChartConfig = {
  planted: {
    label: "Trees Planted",
    color: "hsl(145 63% 42%)",
  },
  target: {
    label: "Target",
    color: "hsl(210 40% 90%)",
  },
}

// --- Survival Rate Trend ---
const survivalData = [
  { month: "Jan", rate: 78 },
  { month: "Feb", rate: 81 },
  { month: "Mar", rate: 79 },
  { month: "Apr", rate: 84 },
  { month: "May", rate: 87 },
  { month: "Jun", rate: 89 },
  { month: "Jul", rate: 86 },
  { month: "Aug", rate: 91 },
]

const areaChartConfig = {
  rate: {
    label: "Survival Rate (%)",
    color: "hsl(210 100% 56%)",
  },
}

// --- Recent Activity ---
const recentActivity = [
  { id: 1, action: "New organization registered", entity: "Green Earth Org", time: "2 hours ago", type: "organization" },
  { id: 2, action: "Tree planting completed", entity: "Barangay Luna", time: "5 hours ago", type: "planting" },
  { id: 3, action: "Couple account created", entity: "Juan & Maria Reyes", time: "1 day ago", type: "couple" },
  { id: 4, action: "Monitoring report submitted", entity: "Staff: Elena Cruz", time: "1 day ago", type: "monitoring" },
  { id: 5, action: "Organization approved", entity: "Tree Lovers Inc.", time: "2 days ago", type: "approval" },
  { id: 6, action: "New member joined", entity: "Green Earth Org", time: "3 days ago", type: "organization" },
]

export default function DashboardPage() {
  const [dateFilterOpen, setDateFilterOpen] = useState(false)
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [survivalFilterOpen, setSurvivalFilterOpen] = useState(false)
  const [survivalDate, setSurvivalDate] = useState<Date | undefined>(new Date())
  const [barangayFilterOpen, setBarangayFilterOpen] = useState(false)
  const [selectedBarangay, setSelectedBarangay] = useState<string>("All Barangays")
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false)
  const [newEvent, setNewEvent] = useState({
    organization: '',
    barangay: '',
    treeSpecies: '',
    scheduledDate: new Date(),
    scheduledTime: '09:00',
  })

  return (
    <div className="space-y-8 font-sans">
      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          const TrendIcon = stat.trend === "up" ? ArrowUpRight : ArrowDownRight
          return (
            <Card key={stat.title} className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-200">
              <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${stat.color}`} />
              <Icon className={`absolute right-[-20px] bottom-[-20px] h-40 w-40 ${stat.iconColor} opacity-10 rotate-12`} />
              <CardHeader className="pb-1.5">
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-2xl ${stat.bgLight} shadow-sm`}>
                    <Icon className={`h-5 w-5 ${stat.iconColor}`} />
                  </div>
                  <Badge variant="secondary" className="gap-1.5 text-xs font-semibold px-2.5 py-1">
                    <TrendIcon className="h-3.5 w-3.5" />
                    {stat.change}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold tracking-tight pb-2.5">{stat.value}</div>
                <p className="text-sm text-muted-foreground mt-1 font-medium pt-1.5">{stat.title}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Bar Chart - Monthly Planting */}
        <Card className="lg:col-span-2 border border-border shadow-lg">
          <CardHeader className="pb-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg font-semibold">Monthly Tree Planting</CardTitle>
                <CardDescription className="mt-1">
                  Comparison of trees planted vs target
                </CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-xs">
                  <div className="h-3 w-3 rounded-sm bg-emerald-500" />
                  <span className="text-muted-foreground font-medium">Planted</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="h-3 w-3 rounded-sm bg-slate-300" />
                  <span className="text-muted-foreground font-medium">Target</span>
                </div>
                <Popover open={dateFilterOpen} onOpenChange={setDateFilterOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 h-8 px-3 text-xs font-medium">
                      <Filter className="h-3.5 w-3.5" />
                      Filter
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(selectedDate) => {
                        setDate(selectedDate)
                        setDateFilterOpen(false)
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4 pr-6">
            <ChartContainer config={barChartConfig} className="aspect-auto h-[300px] w-full">
              <BarChart data={monthlyData} margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} horizontal={true} strokeDasharray="4 4" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={12}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12, fontWeight: 500 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={12}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12, fontWeight: 500 }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="planted" fill="var(--color-planted)" radius={[6, 6, 0, 0]} barSize={32} opacity={1} />
                <Bar dataKey="target" fill="var(--color-target)" radius={[6, 6, 0, 0]} barSize={32} opacity={1} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Barangays */}
        <Card className="border border-border shadow-lg">
          <CardHeader className="pb-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg font-semibold">Barangays</CardTitle>
                <CardDescription className="mt-1">
                  Tree distribution by location
                </CardDescription>
              </div>
              <Popover open={barangayFilterOpen} onOpenChange={setBarangayFilterOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 h-8 px-3 text-xs font-medium">
                    <Filter className="h-3.5 w-3.5" />
                    {selectedBarangay}
                    <ChevronDown className="h-3.5 w-3.5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <div className="max-h-60 overflow-y-auto">
                    <div
                      className="px-3 py-2 hover:bg-slate-100 cursor-pointer text-sm"
                      onClick={() => {
                        setSelectedBarangay("All Barangays")
                        setBarangayFilterOpen(false)
                      }}
                    >
                      All Barangays
                    </div>
                    {barangays.map((barangay) => (
                      <div
                        key={barangay.name}
                        className="px-3 py-2 hover:bg-slate-100 cursor-pointer text-sm capitalize"
                        onClick={() => {
                          setSelectedBarangay(barangay.name.charAt(0).toUpperCase() + barangay.name.slice(1))
                          setBarangayFilterOpen(false)
                        }}
                      >
                        {barangay.name.charAt(0).toUpperCase() + barangay.name.slice(1)}
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </CardHeader>
          <CardContent className="pt-4 pb-4 pr-6">
            <ChartContainer config={pieChartConfig} className="aspect-auto h-[300px] w-full">
              <PieChart>
                <Pie
                  data={pieChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="40%"
                  outerRadius={90}
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Legend 
                  layout="horizontal" 
                  verticalAlign="bottom" 
                  align="center"
                  wrapperStyle={{ fontSize: '10px' }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <Card className="lg:col-span-1 border border-border shadow-lg">
          <CardHeader className="pb-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
                <CardDescription className="mt-1">
                  Latest updates from your program
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs font-medium px-3 py-1">Last 7 days</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              {recentActivity.slice(0, 4).map((activity, index) => {
                const isLast = index === 3
                return (
                  <div
                    key={activity.id}
                    className={`group hover:bg-slate-50 rounded-lg transition-colors ${!isLast ? "pb-3" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                          {activity.action}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">{activity.entity}</p>
                      </div>
                      <div className="text-xs text-muted-foreground whitespace-nowrap font-medium">
                        {activity.time}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Area Chart - Survival Rate */}
        <Card className="lg:col-span-2 border border-border shadow-lg">
          <CardHeader className="pb-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg font-semibold">Survival Rate</CardTitle>
                <CardDescription className="mt-1">
                  Tree health over time
                </CardDescription>
              </div>
              <Popover open={survivalFilterOpen} onOpenChange={setSurvivalFilterOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 h-8 px-3 text-xs font-medium">
                    <Filter className="h-3.5 w-3.5" />
                    Filter
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={survivalDate}
                    onSelect={(selectedDate) => {
                      setSurvivalDate(selectedDate)
                      setSurvivalFilterOpen(false)
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </CardHeader>
          <CardContent className="pt-4 pb-4 pr-6">
            <ChartContainer config={areaChartConfig} className="aspect-auto h-[300px] w-full">
              <AreaChart data={survivalData} margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="rateFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(210 100% 56%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(210 100% 56%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="4 4" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={12}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11, fontWeight: 500 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={12}
                  domain={[60, 100]}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11, fontWeight: 500 }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="rate"
                  stroke="hsl(210 100% 56%)"
                  strokeWidth={2.5}
                  fill="url(#rateFill)"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
