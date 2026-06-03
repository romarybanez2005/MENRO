import { Edit, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function CoupleCertificatePage() {
  const handleEdit = () => {
    window.open('/cert-couple.docx', '_blank')
  }

  const handlePrint = () => {
    window.open('/cert-couple.pdf', '_blank')
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex gap-2 mb-4">
        <Button onClick={handleEdit} className="gap-2">
          <Edit className="h-4 w-4" />
          Edit
        </Button>
        <Button onClick={handlePrint} variant="outline" className="gap-2">
          <Printer className="h-4 w-4" />
          Print
        </Button>
      </div>
      <div className="flex-1 rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
        <iframe
          src="/cert-couple.pdf"
          className="w-full h-full"
          title="Couple Certificate"
          frameBorder="0"
        />
      </div>
    </div>
  )
}
