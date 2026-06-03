import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Search, ChevronLeft, ChevronRight, Plus, Download, Edit, Trash2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { organizationService } from "@/lib/services"
import CreateOrganizationDialog from "@/components/CreateOrganizationDialog"
import EditOrganizationDialog from "@/components/EditOrganizationDialog"

interface Organization {
  id: string
  name: string
  presidentName: string
  presidentEmail: string
  code: string
}

export default function OrganizationPage() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState('10')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null)

  // Fetch active organizations
  const { data: organizations = [] } = useQuery({
    queryKey: ['organizations'],
    queryFn: async () => {
      try {
        const response = await organizationService.index()
        const rawData = response.data?.data || []
        // Map backend fields to frontend interface
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
    staleTime: 0, // Always refetch to ensure fresh data
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnMount: true, // Refetch when component mounts
    retry: 3, // Retry failed requests 3 times
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  })

  // Delete mutation (soft delete)
  const deleteMutation = useMutation({
    mutationFn: (id: string) => organizationService.destroy(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] })
      queryClient.invalidateQueries({ queryKey: ['organizations-trashed'] })
      toast.success('Organization moved to trash successfully!', {
        position: 'top-center',
        style: { background: '#22c55e', color: 'white', border: 'none' },
      })
    },
  })

  const handleEdit = (org: Organization) => {
    setEditingOrg(org)
    setEditDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to move this organization to trash?')) {
      deleteMutation.mutate(id)
    }
  }

  const filteredOrganizations = organizations.filter((org: Organization) => {
    const matchesSearch = (org.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (org.presidentName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (org.presidentEmail || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (org.code || '').toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const totalPages = Math.ceil(filteredOrganizations.length / parseInt(itemsPerPage))
  const startIndex = (currentPage - 1) * parseInt(itemsPerPage)
  const endIndex = startIndex + parseInt(itemsPerPage)
  const currentOrganizations = filteredOrganizations.slice(startIndex, endIndex)

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
                  placeholder="Search organizations..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="w-1/2 pl-10 pr-4 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" className="gap-2 border border-input">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
                <Button className="gap-2" onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Create Organization
                </Button>
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto border border-gray-200 rounded-md">
              <table className="w-full">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Organization Name</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">President Name</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">President Email</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Organization Code</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentOrganizations.map((org: Organization) => (
                    <tr key={org.id} className="border-t hover:bg-muted/50">
                      <td className="p-3 text-sm font-medium">{org.name}</td>
                      <td className="p-3 text-sm text-muted-foreground">{org.presidentName}</td>
                      <td className="p-3 text-sm text-muted-foreground">{org.presidentEmail}</td>
                      <td className="p-3 text-sm text-muted-foreground">{org.code}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <button 
                            className="p-1.5 hover:bg-muted rounded" 
                            title="Edit"
                            onClick={() => handleEdit(org)}
                          >
                            <Edit className="h-4 w-4 text-muted-foreground" />
                          </button>
                          <button 
                            className="p-1.5 hover:bg-muted rounded" 
                            title="Delete"
                            onClick={() => handleDelete(org.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {currentOrganizations.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-muted-foreground">
                        No organizations found
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
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredOrganizations.length)} of {filteredOrganizations.length} organizations
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
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-md border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CreateOrganizationDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      <EditOrganizationDialog
        organization={editingOrg}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />
    </div>
  )
}
