import { useState } from 'react'
import { Search, ChevronLeft, ChevronRight, MoreHorizontal, Download } from 'lucide-react'
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface MonitoringHistory {
  id: string
  coupleName: string
  barangay: string
  staffName: string
  monitoringDate: string
  findings: string
  status: 'Approved'
}

const mockMonitoringHistory: MonitoringHistory[] = [
  {
    id: '1',
    coupleName: 'Juan & Maria Cruz',
    barangay: 'Barangay 1',
    staffName: 'Pedro Reyes',
    monitoringDate: '2024-04-15',
    findings: 'Regular checkup completed. No issues found.',
    status: 'Approved'
  },
  {
    id: '2',
    coupleName: 'Pedro & Ana Reyes',
    barangay: 'Barangay 2',
    staffName: 'Juan dela Cruz',
    monitoringDate: '2024-04-18',
    findings: 'Follow-up visit. Family planning discussed.',
    status: 'Approved'
  },
  {
    id: '3',
    coupleName: 'Carlos & Luz Mendoza',
    barangay: 'Barangay 3',
    staffName: 'Maria Santos',
    monitoringDate: '2024-04-20',
    findings: 'Health assessment completed. All good.',
    status: 'Approved'
  },
  {
    id: '4',
    coupleName: 'Ricardo & Elena Flores',
    barangay: 'Barangay 4',
    staffName: 'Ana Garcia',
    monitoringDate: '2024-04-22',
    findings: 'Educational session on family planning.',
    status: 'Approved'
  },
  {
    id: '5',
    coupleName: 'Miguel & Sofia Torres',
    barangay: 'Barangay 5',
    staffName: 'Luz Bautista',
    monitoringDate: '2024-04-25',
    findings: 'Regular monitoring. No concerns.',
    status: 'Approved'
  },
  {
    id: '6',
    coupleName: 'Antonio & Carmen Villanueva',
    barangay: 'Barangay 6',
    staffName: 'Ricardo Flores',
    monitoringDate: '2024-04-27',
    findings: 'Counseling session completed.',
    status: 'Approved'
  },
  {
    id: '7',
    coupleName: 'Jose & Teresa Santos',
    barangay: 'Barangay 7',
    staffName: 'Elena Rivera',
    monitoringDate: '2024-04-28',
    findings: 'Health checkup. Excellent condition.',
    status: 'Approved'
  },
  {
    id: '8',
    coupleName: 'Francisco & Rosa Delgado',
    barangay: 'Barangay 8',
    staffName: 'Miguel Torres',
    monitoringDate: '2024-04-30',
    findings: 'Routine monitoring. All clear.',
    status: 'Approved'
  },
  {
    id: '9',
    coupleName: 'Luis & Patricia Romero',
    barangay: 'Barangay 9',
    staffName: 'Sofia Ramirez',
    monitoringDate: '2024-05-02',
    findings: 'Family planning consultation.',
    status: 'Approved'
  },
  {
    id: '10',
    coupleName: 'Roberto & Isabella Herrera',
    barangay: 'Barangay 10',
    staffName: 'Carlos Mendoza',
    monitoringDate: '2024-05-05',
    findings: 'Regular checkup completed successfully.',
    status: 'Approved'
  },
]

export default function ReportsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState('10')

  const filteredHistory = mockMonitoringHistory.filter(history => {
    return history.coupleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      history.barangay.toLowerCase().includes(searchTerm.toLowerCase()) ||
      history.staffName.toLowerCase().includes(searchTerm.toLowerCase())
  })

  const totalPages = Math.ceil(filteredHistory.length / parseInt(itemsPerPage))
  const startIndex = (currentPage - 1) * parseInt(itemsPerPage)
  const endIndex = startIndex + parseInt(itemsPerPage)
  const currentHistory = filteredHistory.slice(startIndex, endIndex)

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-card shadow-sm">
        <div className="p-6">
          <div className="flex flex-col h-[calc(100vh-9rem)]">
            {/* Header */}
            <div className="mb-4 flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search monitoring history..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <Button variant="outline" size="sm" className="gap-2 border border-input">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto border border-gray-200 rounded-md">
              <table className="w-full">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Couple Name</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Barangay</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Staff Name</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Monitoring Date</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Findings</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentHistory.map((history) => (
                    <tr key={history.id} className="border-t hover:bg-muted/50">
                      <td className="p-3 text-sm font-medium">{history.coupleName}</td>
                      <td className="p-3 text-sm text-muted-foreground">{history.barangay}</td>
                      <td className="p-3 text-sm text-muted-foreground">{history.staffName}</td>
                      <td className="p-3 text-sm text-muted-foreground">{history.monitoringDate}</td>
                      <td className="p-3 text-sm text-muted-foreground max-w-xs truncate">{history.findings}</td>
                      <td className="p-3">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {history.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <button className="p-1 hover:bg-muted rounded">
                          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {currentHistory.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted-foreground">
                        No monitoring history found
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
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredHistory.length)} of {filteredHistory.length} records
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
