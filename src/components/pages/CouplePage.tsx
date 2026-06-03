import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, ChevronLeft, ChevronRight, Plus, Download, Edit, Trash2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { coupleService } from "@/lib/services"
import CreateCoupleDialog from "@/components/CreateCoupleDialog"
import EditCoupleDialog from "@/components/EditCoupleDialog"

interface Couple {
  id: string
  or_number: string
  contact_number: string | null
  address: string | null
  users?: Array<{
    id: string
    first_name: string
    middle_name: string | null
    last_name: string
    email: string
    contact_number: string | null
    address: string | null
  }>
}

export default function CouplePage() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState('10')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingCouple, setEditingCouple] = useState<Couple | null>(null)

  const { data: couples = [] } = useQuery({
    queryKey: ['couples'],
    queryFn: async () => {
      const response = await coupleService.index()
      return response.data?.data || []
    },
  })
  const filteredCouples = couples.filter((couple: Couple) => {
    const user1 = couple.users?.[0]
    const user2 = couple.users?.[1]
    const name = user1 ? `${user1.first_name} ${user1.last_name}` : ''
    const name2 = user2 ? `${user2.first_name} ${user2.last_name}` : ''
    const email = user1?.email || ''
    const email2 = user2?.email || ''
    const searchLower = searchTerm.toLowerCase()
    
    const matchesSearch = 
      String(couple.or_number || '').toLowerCase().includes(searchLower) ||
      name.toLowerCase().includes(searchLower) ||
      name2.toLowerCase().includes(searchLower) ||
      email.toLowerCase().includes(searchLower) ||
      email2.toLowerCase().includes(searchLower) ||
      (couple.address || '').toLowerCase().includes(searchLower)
    return matchesSearch
  })

  const totalPages = Math.ceil(filteredCouples.length / parseInt(itemsPerPage))
  const startIndex = (currentPage - 1) * parseInt(itemsPerPage)
  const endIndex = startIndex + parseInt(itemsPerPage)
  const currentCouples = filteredCouples.slice(startIndex, endIndex)

  // Delete mutation (soft delete individual user)
  const deleteMutation = useMutation({
    mutationFn: (userId: string) => coupleService.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['couples'] })
      toast.success('User moved to trash successfully!', {
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

  const handleDelete = (userId: string, userName: string) => {
    if (confirm(`Are you sure you want to move "${userName}" to trash?`)) {
      deleteMutation.mutate(userId)
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
                  placeholder="Search couples..."
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
                <Button className="gap-2" onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4" />
                  Add Couple
                </Button>
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
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Contact Number</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Address</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentCouples.map((couple: Couple) => {
                    // Create a row for each user in the couple
                    return couple.users?.map((user) => (
                      <tr key={user.id} className="border-t hover:bg-muted/50">
                        <td className="p-3 text-sm font-medium">{couple.or_number}</td>
                        <td className="p-3 text-sm font-medium">
                          {user.first_name} {user.middle_name ? user.middle_name + ' ' : ''}{user.last_name}
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">{user.email}</td>
                        <td className="p-3 text-sm text-muted-foreground">{user.contact_number || '-'}</td>
                        <td className="p-3 text-sm text-muted-foreground">{user.address || '-'}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            <button 
                              className="p-1.5 hover:bg-muted rounded" 
                              title="Edit"
                              onClick={() => setEditingCouple(couple)}
                            >
                              <Edit className="h-4 w-4 text-blue-500" />
                            </button>
                            <button 
                              className="p-1.5 hover:bg-muted rounded" 
                              title="Delete"
                              onClick={() => handleDelete(user.id, `${user.first_name} ${user.last_name}`)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  })}
                  {currentCouples.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        No couples found
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
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredCouples.length)} of {filteredCouples.length} couples
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

      <CreateCoupleDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />
      <EditCoupleDialog 
        couple={editingCouple} 
        open={!!editingCouple} 
        onOpenChange={(open) => !open && setEditingCouple(null)} 
      />
    </div>
  )
}
