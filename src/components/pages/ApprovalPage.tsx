import { useState } from 'react'
import { Search, ChevronLeft, ChevronRight, MoreHorizontal, Check, X } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Approval {
  id: string
  type: string
  name: string
  email: string
  barangay: string
  status: 'Pending' | 'Approved' | 'Rejected'
  submittedDate: string
}

const mockApprovals: Approval[] = [
  {
    id: '1',
    type: 'Organization',
    name: 'Green Earth Foundation',
    email: 'contact@greenearth.org',
    barangay: 'Barangay 1',
    status: 'Pending',
    submittedDate: '2024-05-01'
  },
  {
    id: '2',
    type: 'Couple',
    name: 'Juan & Maria Cruz',
    email: 'juan.maria.cruz@gmail.com',
    barangay: 'Barangay 2',
    status: 'Pending',
    submittedDate: '2024-05-02'
  },
  {
    id: '3',
    type: 'Staff',
    name: 'Pedro Reyes',
    email: 'pedro.reyes@menro.ph',
    barangay: 'Barangay 3',
    status: 'Approved',
    submittedDate: '2024-04-28'
  },
  {
    id: '4',
    type: 'Organization',
    name: 'Nature First NGO',
    email: 'help@naturefirst.ngo',
    barangay: 'Barangay 4',
    status: 'Pending',
    submittedDate: '2024-05-03'
  },
  {
    id: '5',
    type: 'Couple',
    name: 'Carlos & Luz Mendoza',
    email: 'carlos.luz.mendoza@gmail.com',
    barangay: 'Barangay 5',
    status: 'Rejected',
    submittedDate: '2024-04-25'
  },
  {
    id: '6',
    type: 'Staff',
    name: 'Ana Garcia',
    email: 'ana.garcia@menro.ph',
    barangay: 'Barangay 6',
    status: 'Pending',
    submittedDate: '2024-05-04'
  },
  {
    id: '7',
    type: 'Organization',
    name: 'Reforestation Partners',
    email: 'partners@reforest.org',
    barangay: 'Barangay 7',
    status: 'Approved',
    submittedDate: '2024-04-20'
  },
  {
    id: '8',
    type: 'Couple',
    name: 'Miguel & Sofia Torres',
    email: 'miguel.sofia.torres@gmail.com',
    barangay: 'Barangay 8',
    status: 'Pending',
    submittedDate: '2024-05-05'
  },
  {
    id: '9',
    type: 'Staff',
    name: 'Ricardo Flores',
    email: 'ricardo.flores@menro.ph',
    barangay: 'Barangay 9',
    status: 'Pending',
    submittedDate: '2024-05-06'
  },
  {
    id: '10',
    type: 'Organization',
    name: 'Climate Action Group',
    email: 'action@climate.org',
    barangay: 'Barangay 10',
    status: 'Pending',
    submittedDate: '2024-05-07'
  },
]

export default function ApprovalPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState('10')
  const [statusFilter, setStatusFilter] = useState('All')

  const filteredApprovals = mockApprovals.filter(approval => {
    const matchesSearch = approval.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      approval.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      approval.barangay.toLowerCase().includes(searchTerm.toLowerCase()) ||
      approval.type.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'All' || approval.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalPages = Math.ceil(filteredApprovals.length / parseInt(itemsPerPage))
  const startIndex = (currentPage - 1) * parseInt(itemsPerPage)
  const endIndex = startIndex + parseInt(itemsPerPage)
  const currentApprovals = filteredApprovals.slice(startIndex, endIndex)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'bg-green-100 text-green-800'
      case 'Rejected':
        return 'bg-red-100 text-red-800'
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
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
                  placeholder="Search approvals..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="w-1/2 pl-10 pr-4 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={statusFilter}
                  onValueChange={(value) => {
                    setStatusFilter(value)
                    setCurrentPage(1)
                  }}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent align="start">
                    <SelectGroup>
                      <SelectItem value="All">All Status</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Approved">Approved</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto border border-gray-200 rounded-md">
              <table className="w-full">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Type</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Name</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Email</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Barangay</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Submitted Date</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentApprovals.map((approval) => (
                    <tr key={approval.id} className="border-t hover:bg-muted/50">
                      <td className="p-3 text-sm font-medium">{approval.type}</td>
                      <td className="p-3 text-sm font-medium">{approval.name}</td>
                      <td className="p-3 text-sm text-muted-foreground">{approval.email}</td>
                      <td className="p-3 text-sm text-muted-foreground">{approval.barangay}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(approval.status)}`}>
                          {approval.status}
                        </span>
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">{approval.submittedDate}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          {approval.status === 'Pending' && (
                            <>
                              <button className="p-1 hover:bg-green-100 rounded text-green-600">
                                <Check className="h-4 w-4" />
                              </button>
                              <button className="p-1 hover:bg-red-100 rounded text-red-600">
                                <X className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          <button className="p-1 hover:bg-muted rounded">
                            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {currentApprovals.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted-foreground">
                        No approvals found
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
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredApprovals.length)} of {filteredApprovals.length} approvals
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
    </div>
  )
}
