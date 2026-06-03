import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Building2, Heart, Users, CheckCircle, ChevronLeft, ChevronRight, RotateCcw, Trash, AlertCircle, CheckSquare, Square, Search } from "lucide-react"
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { organizationService, coupleService, monitoringStaffService } from "@/lib/services"
import { toast } from 'sonner'

interface TrashPageProps {
  onBack: () => void
}

interface TrashedOrganization {
  id: string
  name: string
  presidentName: string
  presidentEmail: string
  code: string
  deletedAt: string
  autoDeleteAt: string
}

interface TrashedCouple {
  id: string
  or_number: string
  first_name: string
  middle_name: string | null
  last_name: string
  email: string
  contact_number: string | null
  address: string | null
  deletedAt: string
}

interface TrashedStaff {
  id: string
  first_name: string
  middle_name: string | null
  last_name: string
  email: string
  contact_number: string
  address: string
  deleted_at: string
}

export default function TrashPage({ onBack }: TrashPageProps) {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('organization')
  const [searchTerm, setSearchTerm] = useState('')
  const [coupleSearchTerm, setCoupleSearchTerm] = useState('')
  const [staffSearchTerm, setStaffSearchTerm] = useState('')
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [selectedCoupleItems, setSelectedCoupleItems] = useState<string[]>([])
  const [selectedStaffItems, setSelectedStaffItems] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [coupleCurrentPage, setCoupleCurrentPage] = useState(1)
  const [staffCurrentPage, setStaffCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState('10')
  const [coupleItemsPerPage, setCoupleItemsPerPage] = useState('10')
  const [staffItemsPerPage, setStaffItemsPerPage] = useState('10')

  // Fetch trashed organizations
  const { data: trashedOrganizations = [] } = useQuery({
    queryKey: ['organizations-trashed'],
    queryFn: async () => {
      const response = await organizationService.trashed()
      return response.data?.data || []
    },
    staleTime: 5 * 60 * 1000,
  })

  // Fetch trashed couples (users with role='couple' that are soft deleted)
  const { data: trashedCouples = [] } = useQuery({
    queryKey: ['couples-trashed'],
    queryFn: async () => {
      const response = await coupleService.trashed()
      return response.data || []
    },
    staleTime: 5 * 60 * 1000,
  })

  // Restore mutation
  const restoreMutation = useMutation({
    mutationFn: (id: string) => organizationService.restore(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] })
      queryClient.invalidateQueries({ queryKey: ['organizations-trashed'] })
      setSelectedItems([])
    },
  })

  // Permanent delete mutation
  const forceDeleteMutation = useMutation({
    mutationFn: (id: string) => organizationService.forceDelete(Number(id)),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['organizations-trashed'] })
      setSelectedItems(prev => prev.filter(item => item !== id))
    },
  })

  // Bulk restore mutation
  const bulkRestoreMutation = useMutation({
    mutationFn: (ids: string[]) => organizationService.bulkRestore(ids.map(Number)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] })
      queryClient.invalidateQueries({ queryKey: ['organizations-trashed'] })
      setSelectedItems([])
    },
  })

  // Bulk force delete mutation
  const bulkForceDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => organizationService.bulkForceDelete(ids.map(Number)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations-trashed'] })
      setSelectedItems([])
    },
  })

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const filteredOrganizations = trashedOrganizations.filter((org: TrashedOrganization) => {
    const matchesSearch = org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.presidentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.presidentEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.code.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const startIndex = (currentPage - 1) * parseInt(itemsPerPage)
  const endIndex = startIndex + parseInt(itemsPerPage)
  const currentOrganizations = filteredOrganizations.slice(startIndex, endIndex)
  const totalPages = Math.ceil(filteredOrganizations.length / parseInt(itemsPerPage))

  const allSelected = filteredOrganizations.length > 0 && selectedItems.length === filteredOrganizations.length
  const someSelected = selectedItems.length > 0 && selectedItems.length < filteredOrganizations.length

  const handleSelectAll = () => {
    if (selectedItems.length === filteredOrganizations.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(filteredOrganizations.map((org: TrashedOrganization) => org.id))
    }
  }

  const handleSelectItem = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  const handleRestore = (id: string) => {
    restoreMutation.mutate(id)
  }

  const handleForceDelete = (id: string) => {
    if (confirm('Are you sure you want to permanently delete this organization? This action cannot be undone.')) {
      forceDeleteMutation.mutate(id)
    }
  }

  const handleBulkRestore = () => {
    if (selectedItems.length === 0) return
    if (confirm(`Restore ${selectedItems.length} organization(s)?`)) {
      bulkRestoreMutation.mutate(selectedItems)
    }
  }

  const handleBulkForceDelete = () => {
    if (selectedItems.length === 0) return
    if (confirm(`Permanently delete ${selectedItems.length} organization(s)? This action cannot be undone.`)) {
      bulkForceDeleteMutation.mutate(selectedItems)
    }
  }

  // Couple restore mutation
  const coupleRestoreMutation = useMutation({
    mutationFn: (id: string) => coupleService.restoreUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['couples-trashed'] })
      toast.success('User restored successfully!', {
        position: 'top-center',
        style: { background: '#22c55e', color: 'white', border: 'none' },
      })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to restore user', {
        position: 'top-center',
      })
    },
  })

  // Couple force delete mutation
  const coupleForceDeleteMutation = useMutation({
    mutationFn: (id: string) => coupleService.forceDeleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['couples-trashed'] })
      toast.success('User permanently deleted!', {
        position: 'top-center',
        style: { background: '#22c55e', color: 'white', border: 'none' },
      })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete user', {
        position: 'top-center',
      })
    },
  })

  // Fetch trashed monitoring staff
  const { data: trashedStaff = [] } = useQuery({
    queryKey: ['monitoring-staff-trashed'],
    queryFn: async () => {
      const response = await monitoringStaffService.trashed()
      return response.data || []
    },
    staleTime: 5 * 60 * 1000,
  })

  // Staff restore mutation
  const staffRestoreMutation = useMutation({
    mutationFn: (id: string) => coupleService.restoreUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitoring-staff'] })
      queryClient.invalidateQueries({ queryKey: ['monitoring-staff-trashed'] })
      toast.success('Staff restored successfully!', {
        position: 'top-center',
        style: { background: '#22c55e', color: 'white', border: 'none' },
      })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to restore staff', {
        position: 'top-center',
      })
    },
  })

  // Staff force delete mutation
  const staffForceDeleteMutation = useMutation({
    mutationFn: (id: string) => coupleService.forceDeleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitoring-staff-trashed'] })
      toast.success('Staff permanently deleted!', {
        position: 'top-center',
        style: { background: '#22c55e', color: 'white', border: 'none' },
      })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete staff', {
        position: 'top-center',
      })
    },
  })

  // Couple restore and force delete handlers
  const handleRestoreCouple = (id: string) => {
    coupleRestoreMutation.mutate(id)
  }

  const handleForceDeleteCouple = (id: string) => {
    if (confirm('Are you sure you want to permanently delete this user? This action cannot be undone.')) {
      coupleForceDeleteMutation.mutate(id)
    }
  }

  // Staff handlers
  const handleRestoreStaff = (id: string) => {
    staffRestoreMutation.mutate(id)
  }

  const handleForceDeleteStaff = (id: string) => {
    if (confirm('Are you sure you want to permanently delete this staff member? This action cannot be undone.')) {
      staffForceDeleteMutation.mutate(id)
    }
  }

  const filteredStaff = trashedStaff.filter((staff: any) => {
    const searchLower = staffSearchTerm.toLowerCase()
    const fullName = `${staff.first_name || ''} ${staff.middle_name || ''} ${staff.last_name || ''}`.toLowerCase()
    return fullName.includes(searchLower) ||
      (staff.email || '').toLowerCase().includes(searchLower) ||
      (staff.contact_number || '').toLowerCase().includes(searchLower) ||
      (staff.address || '').toLowerCase().includes(searchLower)
  })

  const staffStartIndex = (staffCurrentPage - 1) * parseInt(staffItemsPerPage)
  const staffEndIndex = staffStartIndex + parseInt(staffItemsPerPage)
  const currentStaff = filteredStaff.slice(staffStartIndex, staffEndIndex)
  const staffTotalPages = Math.ceil(filteredStaff.length / parseInt(staffItemsPerPage))
  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <header className="flex h-16 shrink-0 items-center gap-2 px-4 bg-white shadow-sm border-b border-gray-200 w-full">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="-ml-1 h-9 w-9 hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2 font-semibold">
          <span className="capitalize">Trash</span>
        </div>
      </header>
      <div className="h-px bg-gray-200 dark:bg-gray-700 w-full" />
      
      <div className="flex-1 p-4 min-h-0">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-full">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="organization" className="gap-2">
                <Building2 className="h-4 w-4" />
                Organization ({trashedOrganizations.length})
              </TabsTrigger>
              <TabsTrigger value="couple" className="gap-2">
                <Heart className="h-4 w-4" />
                Couple
              </TabsTrigger>
              <TabsTrigger value="monitoring" className="gap-2">
                <Users className="h-4 w-4" />
                Monitoring Staff ({trashedStaff.length})
              </TabsTrigger>
              <TabsTrigger value="approval" className="gap-2">
                <CheckCircle className="h-4 w-4" />
                Approvals
              </TabsTrigger>
            </TabsList>
            <TabsContent value="organization" className="flex-1 flex flex-col min-h-0">
              {trashedOrganizations.length === 0 ? (
                <div className="text-center h-full flex flex-col items-center justify-center">
                  <div className="flex justify-center mb-6">
                    <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center">
                      <Building2 className="h-10 w-10 text-gray-400" />
                    </div>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">No deleted organizations</h2>
                  <p className="text-gray-500 max-w-md mx-auto">
                    Deleted organizations will appear here and stay for 30 days before being permanently removed.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col h-full gap-4">
                  {/* Search and Bulk Actions */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <input
                        type="text"
                        placeholder="Search trashed organizations..."
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value)
                          setCurrentPage(1)
                        }}
                        className="w-full pl-10 pr-4 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <AlertCircle className="h-4 w-4" />
                      Items auto-delete after 30 days
                    </div>
                  </div>

                  {selectedItems.length > 0 && (
                    <div className="flex items-center gap-2 bg-muted p-2 rounded-md">
                      <span className="text-sm text-muted-foreground">{selectedItems.length} selected</span>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-2 ml-auto"
                        onClick={handleBulkRestore}
                        disabled={bulkRestoreMutation.isPending}
                      >
                        <RotateCcw className="h-4 w-4" />
                        Restore
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        className="gap-2"
                        onClick={handleBulkForceDelete}
                        disabled={bulkForceDeleteMutation.isPending}
                      >
                        <Trash className="h-4 w-4" />
                        Delete Permanently
                      </Button>
                    </div>
                  )}

                  {/* Table */}
                  <div className="flex-1 overflow-auto border border-gray-200 rounded-md">
                    <table className="w-full">
                      <thead className="bg-muted sticky top-0">
                        <tr>
                          <th className="text-left p-3 text-sm font-medium text-muted-foreground w-10">
                            <button 
                              onClick={handleSelectAll}
                              className="p-1 hover:bg-muted rounded"
                            >
                              {allSelected ? (
                                <CheckSquare className="h-4 w-4" />
                              ) : someSelected ? (
                                <div className="h-4 w-4 border-2 border-primary rounded-sm bg-primary/20" />
                              ) : (
                                <Square className="h-4 w-4" />
                              )}
                            </button>
                          </th>
                          <th className="text-left p-3 text-sm font-medium text-muted-foreground">Organization Name</th>
                          <th className="text-left p-3 text-sm font-medium text-muted-foreground">President Name</th>
                          <th className="text-left p-3 text-sm font-medium text-muted-foreground">President Email</th>
                          <th className="text-left p-3 text-sm font-medium text-muted-foreground">Organization Code</th>
                          <th className="text-left p-3 text-sm font-medium text-muted-foreground">Deleted Date</th>
                          <th className="text-left p-3 text-sm font-medium text-muted-foreground">Auto Delete On</th>
                          <th className="text-left p-3 text-sm font-medium text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredOrganizations.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="p-8 text-center text-gray-500">
                              No results found for your search.
                            </td>
                          </tr>
                        ) : (
                          currentOrganizations.map((org: TrashedOrganization) => (
                            <tr key={org.id} className="border-t hover:bg-muted/50">
                              <td className="p-3">
                                <button 
                                  onClick={() => handleSelectItem(org.id)}
                                  className="p-1 hover:bg-muted rounded"
                                >
                                  {selectedItems.includes(org.id) ? (
                                    <CheckSquare className="h-4 w-4" />
                                  ) : (
                                    <Square className="h-4 w-4" />
                                  )}
                                </button>
                              </td>
                              <td className="p-3 text-sm font-medium">{org.name}</td>
                              <td className="p-3 text-sm text-muted-foreground">{org.presidentName}</td>
                              <td className="p-3 text-sm text-muted-foreground">{org.presidentEmail}</td>
                              <td className="p-3 text-sm text-muted-foreground">{org.code}</td>
                              <td className="p-3 text-sm text-muted-foreground">{formatDate(org.deletedAt)}</td>
                              <td className="p-3 text-sm text-red-500">{formatDate(org.autoDeleteAt)}</td>
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <button 
                                    className="p-1.5 hover:bg-muted rounded" 
                                    title="Restore"
                                    onClick={() => handleRestore(org.id)}
                                    disabled={restoreMutation.isPending}
                                  >
                                    <RotateCcw className="h-4 w-4 text-green-500" />
                                  </button>
                                  <button 
                                    className="p-1.5 hover:bg-muted rounded" 
                                    title="Delete Permanently"
                                    onClick={() => handleForceDelete(org.id)}
                                    disabled={forceDeleteMutation.isPending}
                                  >
                                    <Trash className="h-4 w-4 text-red-500" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {filteredOrganizations.length > 0 && (
                    <div className="flex items-center justify-between pt-4 border-t">
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
                          Showing {startIndex + 1} to {Math.min(endIndex, filteredOrganizations.length)} of {filteredOrganizations.length} items
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
                  )}
                </div>
              )}
            </TabsContent>
            <TabsContent value="couple" className="flex-1 flex flex-col min-h-0">
              {trashedCouples.length === 0 ? (
                <div className="text-center h-full flex flex-col items-center justify-center">
                  <div className="flex justify-center mb-6">
                    <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center">
                      <Heart className="h-10 w-10 text-gray-400" />
                    </div>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">No deleted couples</h2>
                  <p className="text-gray-500 max-w-md mx-auto">
                    Deleted couples will appear here and stay for 30 days before being permanently removed.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col h-full gap-4">
                  {/* Search */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <input
                        type="text"
                        placeholder="Search trashed couples..."
                        value={coupleSearchTerm}
                        onChange={(e) => {
                          setCoupleSearchTerm(e.target.value)
                          setCoupleCurrentPage(1)
                        }}
                        className="w-full pl-10 pr-4 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <AlertCircle className="h-4 w-4" />
                      Items auto-delete after 30 days
                    </div>
                  </div>

                  {/* Table */}
                  <div className="flex-1 overflow-auto border border-gray-200 rounded-md">
                    <table className="w-full">
                      <thead className="bg-muted sticky top-0">
                        <tr>
                          <th className="text-left p-3 text-sm font-medium text-muted-foreground">OR Number</th>
                          <th className="text-left p-3 text-sm font-medium text-muted-foreground">Name</th>
                          <th className="text-left p-3 text-sm font-medium text-muted-foreground">Email</th>
                          <th className="text-left p-3 text-sm font-medium text-muted-foreground">Contact</th>
                          <th className="text-left p-3 text-sm font-medium text-muted-foreground">Address</th>
                          <th className="text-left p-3 text-sm font-medium text-muted-foreground">Deleted Date</th>
                          <th className="text-left p-3 text-sm font-medium text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {trashedCouples
                          .filter((couple: TrashedCouple) => {
                            const searchLower = coupleSearchTerm.toLowerCase()
                            return (
                              String(couple.or_number || '').toLowerCase().includes(searchLower) ||
                              couple.first_name.toLowerCase().includes(searchLower) ||
                              couple.last_name.toLowerCase().includes(searchLower) ||
                              couple.email.toLowerCase().includes(searchLower)
                            )
                          })
                          .slice(
                            (coupleCurrentPage - 1) * parseInt(coupleItemsPerPage),
                            coupleCurrentPage * parseInt(coupleItemsPerPage)
                          )
                          .map((couple: TrashedCouple) => (
                            <tr key={couple.id} className="border-t hover:bg-muted/50">
                              <td className="p-3 text-sm font-medium">{couple.or_number}</td>
                              <td className="p-3 text-sm font-medium">
                                {couple.first_name} {couple.middle_name ? couple.middle_name + ' ' : ''}{couple.last_name}
                              </td>
                              <td className="p-3 text-sm text-muted-foreground">{couple.email}</td>
                              <td className="p-3 text-sm text-muted-foreground">{couple.contact_number || '-'}</td>
                              <td className="p-3 text-sm text-muted-foreground">{couple.address || '-'}</td>
                              <td className="p-3 text-sm text-muted-foreground">{formatDate(couple.deletedAt)}</td>
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <button 
                                    className="p-1.5 hover:bg-muted rounded" 
                                    title="Restore"
                                    onClick={() => handleRestoreCouple(couple.id)}
                                  >
                                    <RotateCcw className="h-4 w-4 text-green-500" />
                                  </button>
                                  <button 
                                    className="p-1.5 hover:bg-muted rounded" 
                                    title="Delete Permanently"
                                    onClick={() => handleForceDeleteCouple(couple.id)}
                                  >
                                    <Trash className="h-4 w-4 text-red-500" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {trashedCouples.length > 0 && (
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <label className="text-sm text-muted-foreground">Rows per page</label>
                          <Select
                            value={coupleItemsPerPage}
                            onValueChange={(value) => {
                              setCoupleItemsPerPage(value)
                              setCoupleCurrentPage(1)
                            }}
                          >
                            <SelectTrigger className="w-20">
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
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setCoupleCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={coupleCurrentPage === 1}
                          className="p-2 rounded-md border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setCoupleCurrentPage(prev => Math.min(prev + 1, Math.ceil(trashedCouples.length / parseInt(coupleItemsPerPage))))}
                          disabled={coupleCurrentPage === Math.ceil(trashedCouples.length / parseInt(coupleItemsPerPage))}
                          className="p-2 rounded-md border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
            <TabsContent value="monitoring" className="flex-1 flex flex-col min-h-0">
              {trashedStaff.length === 0 ? (
                <div className="text-center h-full flex flex-col items-center justify-center">
                  <div className="flex justify-center mb-6">
                    <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center">
                      <Users className="h-10 w-10 text-gray-400" />
                    </div>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">No deleted monitoring staff</h2>
                  <p className="text-gray-500 max-w-md mx-auto">
                    Deleted monitoring staff will appear here and stay for 30 days before being permanently removed.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col h-full gap-4">
                  {/* Search */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <input
                        type="text"
                        placeholder="Search trashed staff..."
                        value={staffSearchTerm}
                        onChange={(e) => {
                          setStaffSearchTerm(e.target.value)
                          setStaffCurrentPage(1)
                        }}
                        className="w-full pl-10 pr-4 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <AlertCircle className="h-4 w-4" />
                      Items auto-delete after 30 days
                    </div>
                  </div>

                  {/* Table */}
                  <div className="flex-1 overflow-auto border border-gray-200 rounded-md">
                    <table className="w-full">
                      <thead className="bg-muted sticky top-0">
                        <tr>
                          <th className="text-left p-3 text-sm font-medium text-muted-foreground">Name</th>
                          <th className="text-left p-3 text-sm font-medium text-muted-foreground">Email</th>
                          <th className="text-left p-3 text-sm font-medium text-muted-foreground">Contact</th>
                          <th className="text-left p-3 text-sm font-medium text-muted-foreground">Address</th>
                          <th className="text-left p-3 text-sm font-medium text-muted-foreground">Deleted Date</th>
                          <th className="text-left p-3 text-sm font-medium text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentStaff.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-gray-500">
                              No results found for your search.
                            </td>
                          </tr>
                        ) : (
                          currentStaff.map((staff: any) => (
                            <tr key={staff.id} className="border-t hover:bg-muted/50">
                              <td className="p-3 text-sm font-medium">
                                {staff.first_name} {staff.middle_name ? staff.middle_name + ' ' : ''}{staff.last_name}
                              </td>
                              <td className="p-3 text-sm text-muted-foreground">{staff.email}</td>
                              <td className="p-3 text-sm text-muted-foreground">{staff.contact_number || '-'}</td>
                              <td className="p-3 text-sm text-muted-foreground">{staff.address || '-'}</td>
                              <td className="p-3 text-sm text-muted-foreground">{formatDate(staff.deletedAt)}</td>
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <button
                                    className="p-1.5 hover:bg-muted rounded"
                                    title="Restore"
                                    onClick={() => handleRestoreStaff(staff.id)}
                                  >
                                    <RotateCcw className="h-4 w-4 text-green-500" />
                                  </button>
                                  <button
                                    className="p-1.5 hover:bg-muted rounded"
                                    title="Delete Permanently"
                                    onClick={() => handleForceDeleteStaff(staff.id)}
                                  >
                                    <Trash className="h-4 w-4 text-red-500" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {filteredStaff.length > 0 && (
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <label className="text-sm text-muted-foreground">Rows per page</label>
                          <Select
                            value={staffItemsPerPage}
                            onValueChange={(value) => {
                              setStaffItemsPerPage(value)
                              setStaffCurrentPage(1)
                            }}
                          >
                            <SelectTrigger className="w-20">
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
                          Showing {filteredStaff.length > 0 ? staffStartIndex + 1 : 0} to {Math.min(staffEndIndex, filteredStaff.length)} of {filteredStaff.length} staff
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setStaffCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={staffCurrentPage === 1}
                          className="p-2 rounded-md border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setStaffCurrentPage(prev => Math.min(prev + 1, staffTotalPages))}
                          disabled={staffCurrentPage === staffTotalPages || staffTotalPages === 0}
                          className="p-2 rounded-md border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
            <TabsContent value="approval" className="flex-1">
              <div className="text-center h-full flex flex-col items-center justify-center">
                <div className="flex justify-center mb-6">
                  <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center">
                    <CheckCircle className="h-10 w-10 text-gray-400" />
                  </div>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">No deleted approvals</h2>
                <p className="text-gray-500 max-w-md mx-auto">
                  Deleted approvals will appear here and stay for 30 days before being permanently removed.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
