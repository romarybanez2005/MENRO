import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Search, ChevronLeft, ChevronRight, Plus, Trash2, Pencil } from 'lucide-react'
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { monitoringStaffService } from "@/lib/services"
import CreateMonitoringStaffDialog from "@/components/CreateMonitoringStaffDialog"
import EditMonitoringStaffDialog from "@/components/EditMonitoringStaffDialog"

interface Staff {
  id: string
  first_name: string
  middle_name: string | null
  last_name: string
  email: string
  contact_number: string
  address: string
}

export default function MonitoringStaffPage() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState('10')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null)

  // Fetch monitoring staff from API
  const { data: staffData = [], isLoading } = useQuery({
    queryKey: ['monitoring-staff'],
    queryFn: async () => {
      const response = await monitoringStaffService.index()
      return response.data?.data || []
    },
    staleTime: 5 * 60 * 1000,
  })

  const getFullName = (staff: Staff) => {
    return `${staff.first_name}${staff.middle_name ? ' ' + staff.middle_name : ''} ${staff.last_name}`
  }

  const filteredStaff = staffData.filter((staff: Staff) => {
    const fullName = getFullName(staff).toLowerCase()
    const search = searchTerm.toLowerCase()
    return fullName.includes(search) ||
      staff.email.toLowerCase().includes(search) ||
      staff.contact_number.toLowerCase().includes(search) ||
      staff.address.toLowerCase().includes(search)
  })

  const totalPages = Math.max(1, Math.ceil(filteredStaff.length / parseInt(itemsPerPage)))
  const startIndex = (currentPage - 1) * parseInt(itemsPerPage)
  const endIndex = startIndex + parseInt(itemsPerPage)
  const currentStaff = filteredStaff.slice(startIndex, endIndex)

  const handleDelete = (staff: Staff) => {
    if (confirm(`Are you sure you want to delete ${getFullName(staff)}?`)) {
      // Use the existing users delete endpoint via api
      import('@/lib/api').then(({ default: api }) => {
        api.delete(`/users/${staff.id}`).then(() => {
          queryClient.invalidateQueries({ queryKey: ['monitoring-staff'] })
          toast.success('Staff member deleted successfully!', {
            position: 'top-center',
            style: { background: '#22c55e', color: 'white', border: 'none' },
          })
        }).catch((err: any) => {
          toast.error(err?.response?.data?.message || 'Failed to delete staff member', {
            position: 'top-center',
          })
        })
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-card shadow-sm">
        <div className="p-6">
          <div className="flex flex-col h-[calc(100vh-9rem)]">
            {/* Search Bar */}
            <div className="mb-4 flex items-center justify-between gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search by name, email, contact, or address..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="w-1/2 pl-10 pr-4 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button className="gap-2" onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Add Staff Member
                </Button>
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto border border-gray-200 rounded-md">
              <table className="w-full">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Name</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Email</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Contact Number</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Address</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground w-[80px]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-muted-foreground">
                        Loading...
                      </td>
                    </tr>
                  ) : currentStaff.length > 0 ? (
                    currentStaff.map((staff: Staff) => (
                      <tr key={staff.id} className="border-t hover:bg-muted/50">
                        <td className="p-3 text-sm font-medium">{getFullName(staff)}</td>
                        <td className="p-3 text-sm text-muted-foreground">{staff.email}</td>
                        <td className="p-3 text-sm text-muted-foreground">{staff.contact_number}</td>
                        <td className="p-3 text-sm text-muted-foreground">{staff.address}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setEditingStaff(staff)
                                setEditDialogOpen(true)
                              }}
                              className="p-1.5 hover:bg-blue-50 rounded text-blue-500 transition-colors"
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(staff)}
                              className="p-1.5 hover:bg-red-50 rounded text-red-500 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-muted-foreground">
                        No staff found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label htmlFor="select-rows-per-page" className="text-sm text-muted-foreground">
                    Rows per page
                  </label>
                  <Select
                    value={itemsPerPage}
                    onValueChange={(value) => {
                      setItemsPerPage(value)
                      setCurrentPage(1)
                    }}
                  >
                    <SelectTrigger className="w-20" id="select-rows-per-page">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent align="start">
                      <SelectGroup>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                <div className="text-sm text-muted-foreground">
                  Showing {filteredStaff.length > 0 ? startIndex + 1 : 0} to {Math.min(endIndex, filteredStaff.length)} of {filteredStaff.length} staff
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-md border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="p-2 rounded-md border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CreateMonitoringStaffDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      <EditMonitoringStaffDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        staff={editingStaff}
      />
    </div>
  )
}
