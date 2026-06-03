import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import api from "@/lib/api"
import MapDialog from "@/components/MapDialog"
import barangayData from "@/data/barangay.json"

interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  allDay: boolean
  completed?: boolean
  color?: string
  organization?: string
  barangay?: string
  coordinates?: string
  radius?: number
  treeSpecies?: string
  targetTreeCount?: number
  allowedSpecies?: any[]
  eventType?: 'planting' | 'monitoring'
  targetYear?: number
  targetQuarter?: number
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const queryClient = useQueryClient()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isMapDialogOpen, setIsMapDialogOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [isEventDetailOpen, setIsEventDetailOpen] = useState(false)
  const [coordinates, setCoordinates] = useState<string>('')
  const [radius, setRadius] = useState<number>(0)
  const [showOrganizationDropdown, setShowOrganizationDropdown] = useState(false)
  const [startDate, setStartDate] = useState<Date | undefined>(new Date())
  const [startTime, setStartTime] = useState('09:00 AM')
  const [endDate, setEndDate] = useState<Date | undefined>(new Date())
  const [endTime, setEndTime] = useState('10:00 AM')
  const [newEvent, setNewEvent] = useState({
    organization: '',
    barangay: '',
    targetTreeCount: 0,
  })
  const [selectedTreeSpecies, setSelectedTreeSpecies] = useState<string[]>([])
  const [selectedSpecies, setSelectedSpecies] = useState('')
  const [selectedMonitoringStaff, setSelectedMonitoringStaff] = useState<number[]>([])
  const [selectedStaff, setSelectedStaff] = useState('')
  const [isEditMode, setIsEditMode] = useState(false)
  const [assignedMonitoringStaff, setAssignedMonitoringStaff] = useState<any[]>([])

  // Fetch organizations
  const { data: organizations = [] } = useQuery({
    queryKey: ['organizations'],
    queryFn: async () => {
      try {
        const response = await api.get('/organizations')
        const rawData = response.data?.data || []
        // Map backend fields to match frontend interface
        const mappedData = rawData.map((org: any) => ({
          id: String(org.id),
          name: org.org_name || '',
          presidentName: org.president ? `${org.president.first_name || ''} ${org.president.last_name || ''}`.trim() : '',
          presidentEmail: org.president?.email || '',
          code: org.organization_code || '',
        }))
        return mappedData
      } catch (error) {
        console.error('Error fetching organizations:', error)
        return []
      }
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  // Fetch tree species
  const { data: treeSpecies = [] } = useQuery({
    queryKey: ['tree-species'],
    queryFn: async () => {
      try {
        const response = await api.get('/tree-species')
        return response.data?.data || []
      } catch (error) {
        console.error('Error fetching tree species:', error)
        return []
      }
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  })

  // Fetch monitoring staff
  const { data: monitoringStaff = [] } = useQuery({
    queryKey: ['monitoring-staff'],
    queryFn: async () => {
      try {
        const response = await api.get('/monitoring-staff')
        return response.data?.data || []
      } catch (error) {
        console.error('Error fetching monitoring staff:', error)
        return []
      }
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  })

  // Extract barangays from local JSON file
  const barangays = barangayData.features.map((feature: any) => ({
    id: feature.id,
    name: feature.properties.name,
  }))

  // Fetch planting activities as calendar events
  const { data: plantingActivities = [] } = useQuery({
    queryKey: ['planting-activities'],
    queryFn: async () => {
      try {
        const res = await api.get('/planting-activities')
        return res.data?.data || []
      } catch (error) {
        console.error('Error fetching planting activities:', error)
        return []
      }
    },
    enabled: true,
  })

  // Fetch monitoring assignments
  const { data: monitoringAssignments = [] } = useQuery({
    queryKey: ['monitoring-assignments'],
    queryFn: async () => {
      try {
        const res = await api.get('/monitoring-assignments')
        return res.data?.data || []
      } catch (error) {
        console.error('Error fetching monitoring assignments:', error)
        return []
      }
    },
    enabled: true,
  })

  // Helper to build coordinates string from lat/lng
  const buildCoordinates = (lat: number | string | null, lng: number | string | null): string => {
    if (lat == null || lng == null) return ''
    return `${parseFloat(String(lat)).toFixed(6)}, ${parseFloat(String(lng)).toFixed(6)}`
  }

  // Convert planting activities to calendar events
  useEffect(() => {
    try {
      const calendarEvents: CalendarEvent[] = []

      // Add planting activities as blue events
      if (plantingActivities && Array.isArray(plantingActivities) && plantingActivities.length > 0) {
        const plantingEvents = plantingActivities.map((activity: any) => {
          // Handle Laravel datetime format - scheduled_date comes as full datetime
          let startDate: string
          if (activity.scheduled_date) {
            try {
              // Extract just the date part (YYYY-MM-DD) from the datetime string
              const dateOnly = activity.scheduled_date.split('T')[0]
              const timePart = activity.scheduled_time || '09:00:00'
              startDate = `${dateOnly}T${timePart}`

              // Validate the date
              const testDate = new Date(startDate)
              if (isNaN(testDate.getTime())) {
                throw new Error('Invalid date')
              }
              // Convert to ISO format
              startDate = testDate.toISOString()
            } catch (e) {
              console.error('Invalid date for activity:', activity.id, activity.scheduled_date)
              startDate = new Date().toISOString()
            }
          } else {
            startDate = new Date().toISOString()
          }

          // Default end time is 1 hour after start
          let endDate: string
          try {
            const start = new Date(startDate)
            if (isNaN(start.getTime())) {
              throw new Error('Invalid start date')
            }
            endDate = new Date(start.getTime() + 60 * 60 * 1000).toISOString()
          } catch (e) {
            endDate = new Date(new Date().getTime() + 60 * 60 * 1000).toISOString()
          }

          return {
            id: activity.id?.toString() || Date.now().toString(),
            title: activity.barangay?.name || activity.organization?.org_name || 'Planting Activity',
            start: startDate,
            end: endDate,
            allDay: false,
            completed: activity.status === 'completed',
            color: '#3B82F6',
            organization: activity.organization?.org_name || activity.organization?.name || '',
            barangay: activity.barangay?.name || '',
            coordinates: buildCoordinates(activity.center_lat, activity.center_lng),
            radius: activity.radius_meters || undefined,
            treeSpecies: activity.tree_species || '',
            eventType: 'planting' as const,
          }
        })
        calendarEvents.push(...plantingEvents)
      }

      // Add monitoring assignments as yellow events
      if (monitoringAssignments && Array.isArray(monitoringAssignments) && monitoringAssignments.length > 0) {
        const monitoringEvents = monitoringAssignments.map((assignment: any) => {
          let startDate: string
          if (assignment.scheduled_date) {
            try {
              // The scheduled_date from backend is already in ISO format (e.g., 2026-01-15T00:00:00.000000Z)
              // Just use it directly
              startDate = assignment.scheduled_date
              const testDate = new Date(startDate)
              if (isNaN(testDate.getTime())) {
                throw new Error('Invalid date')
              }
            } catch (e) {
              console.error('Invalid date for assignment:', assignment.id, assignment.scheduled_date)
              startDate = new Date().toISOString()
            }
          } else {
            startDate = new Date().toISOString()
          }

          let endDate: string
          try {
            const start = new Date(startDate)
            if (isNaN(start.getTime())) {
              throw new Error('Invalid start date')
            }
            endDate = new Date(start.getTime() + 60 * 60 * 1000).toISOString()
          } catch (e) {
            endDate = new Date(new Date().getTime() + 60 * 60 * 1000).toISOString()
          }

          return {
            id: `monitoring-${assignment.id}`,
            title: `Monitoring - Q${assignment.target_quarter} ${assignment.target_year}`,
            start: startDate,
            end: endDate,
            allDay: false,
            completed: assignment.is_completed,
            color: '#FBBF24',
            eventType: 'monitoring' as const,
            targetYear: assignment.target_year,
            targetQuarter: assignment.target_quarter,
          }
        })
        calendarEvents.push(...monitoringEvents)
      }

      setEvents(calendarEvents)
    } catch (error) {
      console.error('Error converting planting activities to calendar events:', error)
      setEvents([])
    }
  }, [JSON.stringify(plantingActivities), JSON.stringify(monitoringAssignments)])

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      return api.post('/planting-activities', payload)
    },
    onSuccess: () => {
      toast.success('Planting activity created successfully')
      queryClient.invalidateQueries({ queryKey: ['planting-activities'] })
      setIsDialogOpen(false)
      setCoordinates('')
      setRadius(0)
      setNewEvent({
        organization: '',
        barangay: '',
        targetTreeCount: 0,
      })
      setSelectedTreeSpecies([])
      setSelectedSpecies('')
      setStartDate(new Date())
      setStartTime('09:00 AM')
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to create planting activity')
    }
  })

  const assignStaffMutation = useMutation({
    mutationFn: async ({ activityId, staffIds }: { activityId: string, staffIds: number[] }) => {
      return api.post(`/planting-activities/${activityId}/assign-monitoring-staff`, { staff_ids: staffIds })
    },
    onSuccess: () => {
      toast.success('Monitoring staff assigned successfully')
      setSelectedMonitoringStaff([])
      setSelectedStaff('')
      setIsEventDetailOpen(false)
      queryClient.invalidateQueries({ queryKey: ['planting-activities'] })
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to assign monitoring staff')
    }
  })

  const deleteActivityMutation = useMutation({
    mutationFn: async (activityId: string) => {
      return api.delete(`/planting-activities/${activityId}`)
    },
    onSuccess: () => {
      toast.success('Planting activity and its monitoring schedules deleted successfully')
      setIsEventDetailOpen(false)
      queryClient.invalidateQueries({ queryKey: ['planting-activities'] })
      queryClient.invalidateQueries({ queryKey: ['monitoring-assignments'] })
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to delete planting activity')
    }
  })

  const handleAssignMonitoringStaff = () => {
    if (selectedEvent?.id && selectedMonitoringStaff.length > 0) {
      assignStaffMutation.mutate({
        activityId: selectedEvent.id,
        staffIds: selectedMonitoringStaff
      })
    }
  }

  const handleAddEvent = () => {
    if (!startDate) {
      toast.error('Please select a start date')
      return
    }
    if (!endDate) {
      toast.error('Please select an end date')
      return
    }
    if (!coordinates) {
      toast.error('Please select a location on the map')
      return
    }
    if (!newEvent.targetTreeCount || newEvent.targetTreeCount <= 0) {
      toast.error('Please enter a valid target tree count')
      return
    }

    const now = new Date()
    const convertTo24Hour = (time12h: string) => {
      const [time, period] = time12h.split(' ')
      const [hours, minutes] = time.split(':')
      const hour = parseInt(hours, 10)
      const hour24 = period === 'PM' && hour !== 12 ? hour + 12 : period === 'AM' && hour === 12 ? 0 : hour
      return `${hour24.toString().padStart(2, '0')}:${minutes}`
    }

    // Find organization_id from selected name
    const org = organizations?.find((o: any) => o.name === newEvent.organization)
    // Find barangay_id from selected name
    const brgy = barangays?.find((b: any) => b.name === newEvent.barangay)

    if (!org) {
      toast.error('Please select a valid organization from the dropdown')
      return
    }
    if (!brgy) {
      toast.error('Please select a valid barangay from the dropdown')
      return
    }

    // Parse coordinates "lat, lng" to separate values
    let centerLat: number | null = null
    let centerLng: number | null = null
    if (coordinates) {
      const parts = coordinates.split(',').map(s => parseFloat(s.trim()))
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        centerLat = parts[0]
        centerLng = parts[1]
      }
    }

    // Build full start datetime for validation
    const startDateTimeStr = `${format(startDate, 'yyyy-MM-dd')}T${convertTo24Hour(startTime)}`
    const startDateTime = new Date(startDateTimeStr)

    if (startDateTime < now) {
      toast.error('The date or time selected has passed.')
      return
    }

    // Map selected tree species names to IDs
    const selectedSpeciesIds = selectedTreeSpecies
      .map(name => treeSpecies?.find((s: any) => s.common_name === name)?.id)
      .filter((id): id is number => id !== undefined)

    const payload = {
      organization_id: org?.id || null,
      barangay_id: brgy?.id || null,
      target_tree_count: newEvent.targetTreeCount || 0,
      center_lat: centerLat,
      center_lng: centerLng,
      radius_meters: radius || null,
      scheduled_date: format(startDate, 'yyyy-MM-dd'),
      scheduled_time: convertTo24Hour(startTime),
      tree_species: selectedSpeciesIds,
      monitoring_staff_ids: selectedMonitoringStaff,
    }

    createMutation.mutate(payload)
  }

  const isSelectedEventCompleted = selectedEvent?.completed || (selectedEvent?.end ? new Date(selectedEvent.end) < new Date() : false)

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-card shadow-sm p-3 flex-1 min-h-0 calendar-container">
        <style>{`
          .calendar-container .fc .fc-toolbar-title {
            font-size: 2rem;
            font-weight: 800;
            color: #1e293b;
          }
          .calendar-container .fc .fc-toolbar-chunk {
            display: flex;
            align-items: center;
          }
          .calendar-container .fc .fc-button-group {
            display: flex;
            align-items: center;
          }
          .calendar-container .fc .fc-prev-button,
          .calendar-container .fc .fc-next-button {
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            color: #64748b !important;
            padding: 0.25rem !important;
            transition: all 0.2s ease !important;
          }
          .calendar-container .fc .fc-prev-button:hover,
          .calendar-container .fc .fc-next-button:hover {
            background: #f1f5f9 !important;
            color: #334155 !important;
          }
          .calendar-container .fc .fc-addEvent-button {
            background: #3b82f6 !important;
            color: #fff !important;
            border: none !important;
            border-radius: 0.5rem;
            padding: 0.5rem 1rem;
            font-size: 0.875rem;
            font-weight: 500;
            transition: all 0.2s ease !important;
          }
          .calendar-container .fc .fc-addEvent-button:hover {
            background: #2563eb !important;
          }
          .calendar-container .fc-event.completed {
            text-decoration: line-through;
            background-color: #d1fae5 !important;
            border: 1px solid #34d399 !important;
          }
          .calendar-container .fc-event.completed .fc-event-title {
            text-decoration: line-through;
            color: #059669 !important;
          }
          .calendar-container .fc-event.completed .fc-event-time {
            color: #059669 !important;
          }
          .calendar-container .fc-event {
            opacity: 0.95 !important;
            background-color: #dbeafe !important;
            border: 1px solid #60a5fa !important;
            border-radius: 8px !important;
            position: relative !important;
            transition: all 0.2s ease !important;
          }
          .calendar-container .fc-event:hover {
            background-color: #bfdbfe !important;
          }
          .calendar-container .fc-event.completed {
            background-color: #e5e7eb !important;
            border-color: #9ca3af !important;
          }
          .calendar-container .fc-event.completed .fc-event-title {
            color: #6b7280 !important;
          }
          .calendar-container .fc-event.completed .fc-event-time {
            color: #6b7280 !important;
          }
          .calendar-container .fc-event .fc-event-title {
            color: #1d4ed8 !important;
            font-weight: 600;
          }
          .calendar-container .fc-event .fc-event-time {
            color: #1d4ed8 !important;
          }
          .calendar-container .fc .fc-timegrid .fc-now-indicator-line {
            border-top-style: solid !important;
            border-top-width: 2px !important;
            border-top-color: #3b82f6 !important;
          }
          .calendar-container .fc .fc-timegrid .fc-now-indicator-arrow {
            border-top-style: solid !important;
            border-top-color: #3b82f6 !important;
          }
          .calendar-container .fc-daygrid-day.fc-day-today {
            background-color: #eff6ff !important;
          }
          .calendar-container .fc-col-header-cell-cushion {
            color: #475569 !important;
            font-weight: 600 !important;
          }
          .calendar-container .fc-day-number {
            color: #475569 !important;
            font-weight: 500 !important;
          }
          .calendar-container .fc-daygrid-day-number {
            color: #475569 !important;
            font-weight: 500 !important;
          }
          .calendar-container .fc-button-primary {
            background-color: #3b82f6 !important;
            border-color: #3b82f6 !important;
            color: #fff !important;
          }
          .calendar-container .fc-button-primary:hover {
            background-color: #2563eb !important;
            border-color: #2563eb !important;
          }
          .calendar-container .fc-button-active {
            background-color: #3b82f6 !important;
            border-color: #3b82f6 !important;
            color: #fff !important;
          }
        `}</style>
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'dayGridMonth,timeGridWeek,timeGridDay',
            center: 'prev title next',
            right: 'today addEvent'
          }}
          customButtons={{
            addEvent: {
              text: 'Add Event',
              click: () => setIsDialogOpen(true)
            }
          }}
          events={(() => {
            const now = new Date()
            const mappedEvents = events.map(event => {
              const isCompleted = event.completed || new Date(event.end) < now
              if (event.eventType === 'monitoring') {
                return {
                  ...event,
                  backgroundColor: isCompleted ? '#e5e7eb' : '#FBBF24',
                  borderColor: isCompleted ? '#9ca3af' : '#FBBF24',
                  textColor: isCompleted ? '#6b7280' : '#000000',
                  className: isCompleted ? 'completed' : ''
                }
              }
              return {
                ...event,
                backgroundColor: isCompleted ? '#e5e7eb' : '#dbeafe',
                borderColor: isCompleted ? '#9ca3af' : '#60a5fa',
                textColor: isCompleted ? '#6b7280' : '#1e40af',
                className: isCompleted ? 'completed' : ''
              }
            })
            return mappedEvents
          })()}
          editable={false}
          eventClick={async (clickInfo: any) => {
            const event = events.find(e => e.id === clickInfo.event.id)
            if (event) {
              try {
                const response = await api.get(`/planting-activities/${event.id}`)
                const activityData = response.data?.data
                console.log('Activity data:', activityData)
                console.log('Allowed species:', activityData?.allowed_species)

                // Fetch assigned monitoring staff
                let assignedStaff = []
                if (event.eventType === 'planting') {
                  try {
                    const monitoringResponse = await api.get(`/monitoring-assignments?activity_id=${event.id}`)
                    const assignments = monitoringResponse?.data?.data || []
                    // Get unique staff IDs from assignments
                    const staffIds = [...new Set(assignments.map((a: any) => a.staff_id))]
                    // Fetch staff details
                    const staffResponse = await api.get('/monitoring-staff')
                    const allStaff = staffResponse?.data?.data || []
                    assignedStaff = allStaff.filter((s: any) => staffIds.includes(s.id))
                  } catch (error) {
                    console.error('Error fetching assigned monitoring staff:', error)
                  }
                }

                setSelectedEvent({
                  ...event,
                  targetTreeCount: activityData?.target_tree_count,
                  allowedSpecies: activityData?.allowed_species || []
                })
                setAssignedMonitoringStaff(assignedStaff)
                setIsEditMode(false)
                setIsEventDetailOpen(true)
              } catch (error) {
                console.error('Error fetching activity details:', error)
                setSelectedEvent(event)
                setAssignedMonitoringStaff([])
                setIsEditMode(false)
                setIsEventDetailOpen(true)
              }
            }
          }}
          nowIndicator={true}
          height="calc(100vh - 7.5rem)"
        />
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden max-h-[90vh] flex flex-col">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-6 flex-shrink-0">
            <DialogHeader className="mb-0 pb-0 border-0">
              <DialogTitle className="text-2xl font-bold text-white tracking-tight">Add New Event</DialogTitle>
              <DialogDescription className="text-emerald-50 mt-1">
                Create a new planting activity event
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-6 space-y-6 overflow-y-auto flex-1">
            {/* Basic Info Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Basic Information</h3>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="organization" className="text-sm font-medium text-gray-700">Organization <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <div className="flex gap-2">
                      <Input
                        id="organization"
                        placeholder="Type to search organization..."
                        value={newEvent.organization}
                        onChange={(e) => {
                          setNewEvent({ ...newEvent, organization: e.target.value })
                          setShowOrganizationDropdown(true)
                        }}
                        onFocus={() => setShowOrganizationDropdown(true)}
                        className="h-10 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                        required
                      />
                      {newEvent.organization && (
                        <button
                          type="button"
                          onClick={() => {
                            setNewEvent({ ...newEvent, organization: '' })
                            setShowOrganizationDropdown(false)
                          }}
                          className="px-3 h-10 border border-gray-300 rounded-md hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    {showOrganizationDropdown && newEvent.organization && organizations && organizations.filter((org: any) => (org.name || '').toLowerCase().includes(newEvent.organization.toLowerCase())).length > 0 && (
                      <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg mt-1 max-h-60 overflow-y-auto shadow-lg">
                        {organizations.filter((org: any) => (org.name || '').toLowerCase().includes(newEvent.organization.toLowerCase())).map((org: any) => (
                          <div
                            key={org.id}
                            className="px-4 py-2.5 hover:bg-emerald-50 cursor-pointer text-sm text-gray-700 hover:text-emerald-700 transition-colors"
                            onClick={() => {
                              setNewEvent({ ...newEvent, organization: org.name })
                              setShowOrganizationDropdown(false)
                            }}
                          >
                            {org.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="barangay" className="text-sm font-medium text-gray-700">Barangay <span className="text-red-500">*</span></label>
                  <Select
                    value={newEvent.barangay}
                    onValueChange={(value) => setNewEvent({ ...newEvent, barangay: value })}
                  >
                    <SelectTrigger className="w-full border-gray-300 focus:border-emerald-500 focus:ring-emerald-500" style={{height:45}}>
                      <SelectValue placeholder="Select barangay" />
                    </SelectTrigger>
                    <SelectContent className="max-h-40 overflow-y-auto">
                      <SelectGroup>
                        {barangays && barangays.length > 0 ? (
                          barangays.map((b: any) => (
                            <SelectItem key={b.id} value={b.name}>
                              {b.name}
                            </SelectItem>
                          ))
                        ) : null}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Target Tree Count <span className="text-red-500">*</span></label>
                  <Input
                    type="number"
                    placeholder="Enter target number of trees"
                    value={newEvent.targetTreeCount || ''}
                    onChange={(e) => setNewEvent({ ...newEvent, targetTreeCount: parseInt(e.target.value) || 0 })}
                    className="h-10 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                    min="1"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Tree Species</label>
                  <div className="flex gap-2">
                    <Select value={selectedSpecies} onValueChange={setSelectedSpecies}>
                      <SelectTrigger className="flex-1 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500" style={{height:45}}>
                        <SelectValue placeholder="Select tree species" />
                      </SelectTrigger>
                      <SelectContent className="max-h-40 overflow-y-auto">
                        <SelectGroup>
                          {treeSpecies && treeSpecies.length > 0 ? (
                            treeSpecies.map((species: any) => (
                              <SelectItem key={species.id} value={species.common_name} disabled={selectedTreeSpecies.includes(species.common_name)}>
                                {species.common_name}
                              </SelectItem>
                            ))
                          ) : null}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      onClick={() => {
                        if (selectedSpecies && !selectedTreeSpecies.includes(selectedSpecies)) {
                          setSelectedTreeSpecies([...selectedTreeSpecies, selectedSpecies])
                          setSelectedSpecies('')
                        }
                      }}
                      disabled={!selectedSpecies || selectedTreeSpecies.includes(selectedSpecies)}
                      className="h-10 bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      Add
                    </Button>
                  </div>
                  {selectedTreeSpecies.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedTreeSpecies.map((species, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 rounded-md px-2 py-1 text-sm"
                        >
                          {species}
                          <button
                            type="button"
                            onClick={() => setSelectedTreeSpecies(selectedTreeSpecies.filter((_, i) => i !== index))}
                            className="text-emerald-600 hover:text-emerald-800 font-bold"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Location Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Location <span className="text-red-500">*</span></h3>

              <div className="space-y-2">
                <Dialog open={isMapDialogOpen} onOpenChange={(open) => {
                  if (open && !newEvent.barangay) {
                    toast.error('Please select a barangay first')
                    return
                  }
                  setIsMapDialogOpen(open)
                }}>
                  <DialogTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 justify-start text-left font-normal border-gray-300 hover:border-blue-400 hover:text-blue-600 transition-colors w-full"
                      disabled={!newEvent.barangay}
                    >
                      {coordinates ? `Coordinates: ${coordinates}` : 'Click to select location on map'}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl h-[650px] flex flex-col p-0 overflow-hidden">
                    <DialogHeader className="px-6 pt-6 pb-2">
                      <DialogTitle style={{color:'#000000'}}>Select Location</DialogTitle>
                      <DialogDescription>Select the planting location on the map</DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-hidden px-6 pb-6">
                      <MapDialog
                        isOpen={isMapDialogOpen}
                        selectedBarangay={newEvent.barangay}
                        onClose={() => setIsMapDialogOpen(false)}
                        onConfirm={(coords, r) => {
                          setCoordinates(coords)
                          setRadius(r)
                          setIsMapDialogOpen(false)
                        }}
                      />
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Schedule Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Schedule <span className="text-red-500">*</span></h3>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="start" className="text-sm font-medium text-gray-700">Start Date <span className="text-red-500">*</span></label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal h-10 border-gray-300 hover:border-purple-400 transition-colors",
                            !startDate && "text-muted-foreground"
                          )}
                        >
                          {startDate ? format(startDate, "MMM dd, yyyy") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="startTime" className="text-sm font-medium text-gray-700">Start Time <span className="text-red-500">*</span></label>
                    <select
                      id="startTime"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="h-10 px-3 rounded-md border border-gray-300 bg-background focus:border-purple-500 focus:ring-purple-500 w-full"
                    >
                      {Array.from({ length: 12 }, (_, i) => {
                        const hour = i === 0 ? 12 : i
                        return (
                          <option key={hour} value={`${hour.toString().padStart(2, '0')}:00 AM`}>
                            {hour.toString().padStart(2, '0')}:00 AM
                          </option>
                        )
                      })}
                      {Array.from({ length: 12 }, (_, i) => {
                        const hour = i === 0 ? 12 : i
                        return (
                          <option key={hour + 12} value={`${hour.toString().padStart(2, '0')}:00 PM`}>
                            {hour.toString().padStart(2, '0')}:00 PM
                          </option>
                        )
                      })}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="endDate" className="text-sm font-medium text-gray-700">End Date <span className="text-red-500">*</span></label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal h-10 border-gray-300 hover:border-purple-400 transition-colors",
                            !endDate && "text-muted-foreground"
                          )}
                        >
                          {endDate ? format(endDate, "MMM dd, yyyy") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="endTime" className="text-sm font-medium text-gray-700">End Time <span className="text-red-500">*</span></label>
                    <select
                      id="endTime"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="h-10 px-3 rounded-md border border-gray-300 bg-background focus:border-purple-500 focus:ring-purple-500 w-full"
                    >
                      {Array.from({ length: 12 }, (_, i) => {
                        const hour = i === 0 ? 12 : i
                        return (
                          <option key={hour} value={`${hour.toString().padStart(2, '0')}:00 AM`}>
                            {hour.toString().padStart(2, '0')}:00 AM
                          </option>
                        )
                      })}
                      {Array.from({ length: 12 }, (_, i) => {
                        const hour = i === 0 ? 12 : i
                        return (
                          <option key={hour + 12} value={`${hour.toString().padStart(2, '0')}:00 PM`}>
                            {hour.toString().padStart(2, '0')}:00 PM
                          </option>
                        )
                      })}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Monitoring Staff Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Monitoring Staff</h3>
              <div className="space-y-2">
                <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                  <SelectTrigger className="w-full border-gray-300 focus:border-emerald-500 focus:ring-emerald-500" style={{height:45}}>
                    <SelectValue placeholder="Select monitoring staff" />
                  </SelectTrigger>
                  <SelectContent className="max-h-40 overflow-y-auto">
                    <SelectGroup>
                      {monitoringStaff && monitoringStaff.length > 0 ? (
                        monitoringStaff.map((staff: any) => (
                          <SelectItem key={staff.id} value={String(staff.id)} disabled={selectedMonitoringStaff.includes(staff.id)}>
                            {staff.first_name} {staff.last_name}
                          </SelectItem>
                        ))
                      ) : null}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  onClick={() => {
                    if (selectedStaff && !selectedMonitoringStaff.includes(parseInt(selectedStaff))) {
                      setSelectedMonitoringStaff([...selectedMonitoringStaff, parseInt(selectedStaff)])
                      setSelectedStaff('')
                    }
                  }}
                  disabled={!selectedStaff || selectedMonitoringStaff.includes(parseInt(selectedStaff)) || selectedMonitoringStaff.length >= 5}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Add Staff
                </Button>
                {selectedMonitoringStaff.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedMonitoringStaff.map((staffId, index) => {
                      const staff = monitoringStaff?.find((s: any) => s.id === staffId)
                      return (
                        <div
                          key={index}
                          className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 rounded-md px-2 py-1 text-sm"
                        >
                          {staff ? `${staff.first_name} ${staff.last_name}` : `Staff ${staffId}`}
                          <button
                            type="button"
                            onClick={() => setSelectedMonitoringStaff(selectedMonitoringStaff.filter((_, i) => i !== index))}
                            className="text-emerald-600 hover:text-emerald-800 font-bold"
                          >
                            ✕
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
                <p className="text-xs text-gray-500">You can assign up to 5 monitoring staff</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 justify-end px-6 py-4 bg-gray-50 border-t border-gray-200 flex-shrink-0">
            <Button
              onClick={handleAddEvent}
              className="h-10 px-6 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium shadow-md transition-all"
            >
              Add Event
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              className="h-10 px-6 border-gray-300 hover:bg-gray-100 font-medium transition-colors"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Event Detail Dialog */}
      <Dialog open={isEventDetailOpen} onOpenChange={setIsEventDetailOpen}>
        <DialogContent className="sm:max-w-[460px] max-h-[85vh] p-0 overflow-hidden border-0 shadow-xl flex flex-col">
          <DialogHeader className="sr-only">
            <DialogTitle>Event Details</DialogTitle>
            <DialogDescription>View details about the selected planting activity</DialogDescription>
          </DialogHeader>
          {/* Header with colored accent bar */}
          <div className="relative flex-shrink-0">
            <div className={`h-1.5 w-full ${isSelectedEventCompleted ? 'bg-linear-to-r from-emerald-400 to-green-500' : 'bg-linear-to-r from-yellow-400 to-amber-400'}`} />
            <div className="px-6 pt-5 pb-4">
              <h2 className="text-xl font-bold leading-tight" style={{color:"#000000"}}>{selectedEvent?.organization}</h2>
              <div className="mt-2.5 flex items-center gap-2.5">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${isSelectedEventCompleted ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-yellow-50 text-yellow-700 border border-yellow-200'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isSelectedEventCompleted ? 'bg-emerald-500' : 'bg-yellow-500'}`} />
                  {isSelectedEventCompleted ? 'Completed' : 'Pending'}
                </span>
                {selectedEvent?.barangay && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                    {selectedEvent.barangay}
                  </span>
                )}
              </div>
              {selectedEvent?.eventType === 'planting' && (
                <div className="absolute top-13 right-7 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      // Populate the add event dialog with existing data
                      if (selectedEvent) {
                        setNewEvent({
                          organization: selectedEvent.organization || '',
                          barangay: selectedEvent.barangay || '',
                          targetTreeCount: selectedEvent.targetTreeCount || 0,
                        })
                        setStartDate(selectedEvent.start ? new Date(selectedEvent.start) : new Date())
                        setEndDate(selectedEvent.end ? new Date(selectedEvent.end) : new Date())
                        setCoordinates(selectedEvent.coordinates || '')
                        setRadius(selectedEvent.radius || 0)
                        setSelectedTreeSpecies(selectedEvent.treeSpecies ? selectedEvent.treeSpecies.split(', ') : [])
                        setSelectedMonitoringStaff([])
                        setIsEventDetailOpen(false)
                        setIsDialogOpen(true)
                      }
                    }}
                    className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedEvent?.id && window.confirm('Are you sure you want to delete this planting activity and all its monitoring schedules?')) {
                        deleteActivityMutation.mutate(selectedEvent.id)
                      }
                    }}
                    className="p-2 rounded-lg bg-white border border-red-200 hover:bg-red-50 text-red-600 hover:text-red-800 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="px-6 pb-6 space-y-4 overflow-y-auto flex-1">
            {/* Date & Time Card */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Schedule</p>
              </div>
              <div className="flex gap-6">
                <div>
                  <p className="text-[11px] font-semibold text-blue-600 uppercase mb-0.5">Start</p>
                  <p className="text-sm font-semibold text-slate-800">{selectedEvent?.start ? format(new Date(selectedEvent.start), 'PPP') : ''}</p>
                  <p className="text-sm text-slate-500">{selectedEvent?.start ? format(new Date(selectedEvent.start), 'p') : ''}</p>
                </div>
                <div className="w-px bg-slate-200" />
                <div>
                  <p className="text-[11px] font-semibold text-rose-600 uppercase mb-0.5">End</p>
                  <p className="text-sm font-semibold text-slate-800">{selectedEvent?.end ? format(new Date(selectedEvent.end), 'PPP') : ''}</p>
                  <p className="text-sm text-slate-500">{selectedEvent?.end ? format(new Date(selectedEvent.end), 'p') : ''}</p>
                </div>
              </div>
            </div>

            {/* Organization & Barangay */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-indigo-50 rounded-xl p-3.5 border border-indigo-100">
                <div className="flex items-center gap-2 mb-1.5">
                  <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                  <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">Organization</p>
                </div>
                <p className="text-sm font-medium text-slate-800">{selectedEvent?.organization || 'N/A'}</p>
              </div>
              <div className="bg-teal-50 rounded-xl p-3.5 border border-teal-100">
                <div className="flex items-center gap-2 mb-1.5">
                  <svg className="w-4 h-4 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  <p className="text-[11px] font-bold text-teal-600 uppercase tracking-wider">Barangay</p>
                </div>
                <p className="text-sm font-medium text-slate-800">{selectedEvent?.barangay || 'N/A'}</p>
              </div>
            </div>

            {/* Target Tree Count */}
            <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                </div>
                <p className="text-xs font-bold text-purple-700 uppercase tracking-wider">Target Tree Count</p>
              </div>
              <p className="text-2xl font-bold text-slate-800">{selectedEvent?.targetTreeCount || 'N/A'}</p>
            </div>

            {/* Location */}
            {(selectedEvent?.coordinates || selectedEvent?.radius) && (
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 7m0 13V7" /></svg>
                  </div>
                  <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Location</p>
                </div>
                <div className="flex gap-4 items-center">
                  {selectedEvent?.coordinates && (
                    <div className="flex-1">
                      <p className="text-[11px] font-semibold text-amber-600/70 uppercase mb-0.5">Coordinates</p>
                      <p className="text-sm font-mono font-medium text-slate-700 bg-white rounded-md px-2 py-1 border border-amber-100 inline-block">{selectedEvent.coordinates}</p>
                    </div>
                  )}
                  {selectedEvent?.radius && (
                    <div className="shrink-0">
                      <p className="text-[11px] font-semibold text-amber-600/70 uppercase mb-0.5">Radius</p>
                      <p className="text-sm font-semibold text-slate-700">{selectedEvent.radius} m</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tree Species */}
            <div className="bg-green-50 rounded-xl p-4 border border-green-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                </div>
                <p className="text-xs font-bold text-green-700 uppercase tracking-wider">Tree Species</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedEvent?.allowedSpecies && selectedEvent.allowedSpecies.length > 0 ? (
                  selectedEvent.allowedSpecies.map((species: any, i: number) => (
                    <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-white text-green-800 border border-green-200">
                      {species.common_name}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-slate-500">N/A</span>
                )}
              </div>
            </div>

            {/* Assigned Monitoring Staff */}
            {selectedEvent?.eventType === 'planting' && (
              <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                  </div>
                  <p className="text-xs font-bold text-orange-700 uppercase tracking-wider">Assigned Monitoring Staff</p>
                </div>
                {assignedMonitoringStaff.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {assignedMonitoringStaff.map((staff: any, index: number) => (
                      <span key={index} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-white text-orange-800 border border-orange-200">
                        {staff.first_name} {staff.last_name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No monitoring staff assigned</p>
                )}
              </div>
            )}

            {/* Edit Mode - Assign Monitoring Staff */}
            {isEditMode && selectedEvent?.eventType === 'planting' && (
              <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                  </div>
                  <p className="text-xs font-bold text-orange-700 uppercase tracking-wider">Assign Monitoring Staff</p>
                </div>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                      <SelectTrigger className="h-10 flex-1 border-gray-300 focus:border-orange-500 focus:ring-orange-500">
                        <SelectValue placeholder="Select monitoring staff" />
                      </SelectTrigger>
                      <SelectContent className="max-h-40 overflow-y-auto">
                        <SelectGroup>
                          {monitoringStaff && monitoringStaff.length > 0 ? (
                            monitoringStaff.map((staff: any) => (
                              <SelectItem key={staff.id} value={staff.id.toString()} disabled={selectedMonitoringStaff.includes(staff.id) || assignedMonitoringStaff.some((a: any) => a.id === staff.id)}>
                                {staff.first_name} {staff.last_name}
                              </SelectItem>
                            ))
                          ) : null}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      onClick={() => {
                        if (selectedStaff && !selectedMonitoringStaff.includes(parseInt(selectedStaff)) && selectedMonitoringStaff.length < 5) {
                          setSelectedMonitoringStaff([...selectedMonitoringStaff, parseInt(selectedStaff)])
                          setSelectedStaff('')
                        }
                      }}
                      disabled={!selectedStaff || selectedMonitoringStaff.includes(parseInt(selectedStaff)) || selectedMonitoringStaff.length >= 5}
                      className="h-10 bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      Add
                    </Button>
                  </div>
                  {selectedMonitoringStaff.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedMonitoringStaff.map((staffId, index) => {
                        const staff = monitoringStaff.find((s: any) => s.id === staffId)
                        return (
                          <div
                            key={index}
                            className="flex items-center gap-1 bg-orange-50 border border-orange-200 rounded-md px-2 py-1 text-sm"
                          >
                            {staff ? `${staff.first_name} ${staff.last_name}` : 'Unknown'}
                            <button
                              type="button"
                              onClick={() => setSelectedMonitoringStaff(selectedMonitoringStaff.filter((_, i) => i !== index))}
                              className="text-orange-600 hover:text-orange-800 font-bold"
                            >
                              ✕
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                  <Button
                    type="button"
                    onClick={() => handleAssignMonitoringStaff()}
                    disabled={selectedMonitoringStaff.length === 0}
                    className="w-full mt-3 bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    Assign Monitoring Staff
                  </Button>
                </div>
              </div>
            )}

          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
