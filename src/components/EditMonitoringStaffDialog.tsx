import { useState, useEffect } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { monitoringStaffService } from "@/lib/services"

interface Staff {
  id: string
  first_name: string
  middle_name: string | null
  last_name: string
  email: string
  contact_number: string
  address: string
}

interface EditMonitoringStaffDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  staff: Staff | null
}

export default function EditMonitoringStaffDialog({
  open,
  onOpenChange,
  staff,
}: EditMonitoringStaffDialogProps) {
  const queryClient = useQueryClient()
  const [firstName, setFirstName] = useState("")
  const [middleName, setMiddleName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [contactNumber, setContactNumber] = useState("")
  const [address, setAddress] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    if (staff) {
      setFirstName(staff.first_name)
      setMiddleName(staff.middle_name || "")
      setLastName(staff.last_name)
      setEmail(staff.email)
      setContactNumber(staff.contact_number)
      setAddress(staff.address)
      setError("")
    }
  }, [staff])

  const updateMutation = useMutation({
    mutationFn: (data: any) => monitoringStaffService.update(staff!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monitoring-staff"] })
      setError("")
      onOpenChange(false)
      toast.success("Monitoring staff updated successfully!", {
        position: "top-center",
        style: { background: "#22c55e", color: "white", border: "none" },
      })
    },
    onError: (err: any) => {
      if (err.response?.data?.errors) {
        const errors = err.response.data.errors
        const firstError = Object.values(errors)[0]
        setError(Array.isArray(firstError) ? firstError[0] : firstError)
      } else {
        setError(err.response?.data?.message || "Failed to update monitoring staff. Please try again.")
      }
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!firstName.trim()) { setError("First name is required"); return }
    if (!lastName.trim()) { setError("Last name is required"); return }
    if (!email.trim()) { setError("Email is required"); return }
    if (!contactNumber.trim()) { setError("Contact number is required"); return }
    if (!address.trim()) { setError("Address is required"); return }

    updateMutation.mutate({
      first_name: firstName.trim(),
      middle_name: middleName.trim() || null,
      last_name: lastName.trim(),
      email: email.trim(),
      contact_number: contactNumber.trim(),
      address: address.trim(),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Monitoring Staff</DialogTitle>
          <DialogDescription>
            Update the monitoring staff member's information.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="editFirstName">First Name *</Label>
                <Input
                  id="editFirstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Juan"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editMiddleName">Middle Name</Label>
                <Input
                  id="editMiddleName"
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
                  placeholder="M."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editLastName">Last Name *</Label>
                <Input
                  id="editLastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Dela Cruz"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="editEmail">Email *</Label>
              <Input
                id="editEmail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editContactNumber">Contact Number *</Label>
              <Input
                id="editContactNumber"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                placeholder="09123456789"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editAddress">Address *</Label>
              <Input
                id="editAddress"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Barangay, City"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
