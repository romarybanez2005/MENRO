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
import { coupleService } from "@/lib/services"

interface User {
  id: string
  first_name: string
  middle_name: string | null
  last_name: string
  email: string
  contact_number: string | null
  address: string | null
}

interface Couple {
  id: string
  or_number: string
  contact_number: string | null
  address: string | null
  users?: User[]
}

interface EditCoupleDialogProps {
  couple: Couple | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function EditCoupleDialog({
  couple,
  open,
  onOpenChange,
}: EditCoupleDialogProps) {
  const queryClient = useQueryClient()
  const [error, setError] = useState("")

  const [orNumber, setOrNumber] = useState("")
  const [person1, setPerson1] = useState({
    id: "",
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    contactNumber: "",
    address: "",
  })
  const [person2, setPerson2] = useState({
    id: "",
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    contactNumber: "",
    address: "",
  })

  // Populate form when couple changes
  useEffect(() => {
    if (couple && couple.users) {
      setOrNumber(couple.or_number)
      const user1 = couple.users[0]
      const user2 = couple.users[1]
      
      if (user1) {
        setPerson1({
          id: user1.id,
          firstName: user1.first_name,
          middleName: user1.middle_name || "",
          lastName: user1.last_name,
          email: user1.email,
          contactNumber: user1.contact_number || "",
          address: user1.address || "",
        })
      }
      
      if (user2) {
        setPerson2({
          id: user2.id,
          firstName: user2.first_name,
          middleName: user2.middle_name || "",
          lastName: user2.last_name,
          email: user2.email,
          contactNumber: user2.contact_number || "",
          address: user2.address || "",
        })
      }
    }
  }, [couple])

  const updateMutation = useMutation({
    mutationFn: ({ orNumber, data }: { orNumber: string; data: any }) =>
      coupleService.update(orNumber, data),
    onSuccess: async () => {
      toast.success("Couple updated successfully!", {
        position: "top-center",
        style: { background: "#22c55e", color: "white", border: "none" },
      })
      onOpenChange(false)
      await queryClient.invalidateQueries({ queryKey: ["couples"] })
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || "Failed to update couple. Please try again.")
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!orNumber.trim()) {
      setError("OR Number is required")
      return
    }

    updateMutation.mutate({
      orNumber: couple?.or_number || "",
      data: {
        or_number: orNumber,
        contact_number: person1.contactNumber,
        address: person1.address,
      },
    })
  }

  const handleCancel = () => {
    setError("")
    onOpenChange(false)
  }

  const updatePerson1 = (field: string, value: string) => {
    setPerson1((prev) => ({ ...prev, [field]: value }))
  }

  const updatePerson2 = (field: string, value: string) => {
    setPerson2((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle style={{ color: '#000000'}}>Edit Couple</DialogTitle>
          <DialogDescription>
            Update the couple information. Changes will apply to both accounts.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          {/* Shared OR Number */}
          <div className="space-y-2">
            <Label htmlFor="orNumber" className="text-base font-semibold">OR Number (Shared)</Label>
            <Input
              id="orNumber"
              value={orNumber}
              onChange={(e) => setOrNumber(e.target.value)}
              placeholder="Enter OR number"
              disabled={updateMutation.isPending}
            />
          </div>

          {/* Person 1 Section */}
          <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <h3 className="font-semibold text-blue-800">Person 1</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="p1FirstName">First Name</Label>
                <Input
                  id="p1FirstName"
                  value={person1.firstName}
                  onChange={(e) => updatePerson1("firstName", e.target.value)}
                  placeholder="First name"
                  disabled={true}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p1MiddleName">Middle Name</Label>
                <Input
                  id="p1MiddleName"
                  value={person1.middleName}
                  onChange={(e) => updatePerson1("middleName", e.target.value)}
                  placeholder="Optional"
                  disabled={true}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p1LastName">Last Name</Label>
                <Input
                  id="p1LastName"
                  value={person1.lastName}
                  onChange={(e) => updatePerson1("lastName", e.target.value)}
                  placeholder="Last name"
                  disabled={true}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="p1Email">Email</Label>
              <Input
                id="p1Email"
                type="email"
                value={person1.email}
                placeholder="person1@example.com"
                disabled={true}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="p1Contact">Contact Number</Label>
                <Input
                  id="p1Contact"
                  value={person1.contactNumber}
                  onChange={(e) => updatePerson1("contactNumber", e.target.value)}
                  placeholder="+63..."
                  disabled={updateMutation.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p1Address">Address</Label>
                <Input
                  id="p1Address"
                  value={person1.address}
                  onChange={(e) => updatePerson1("address", e.target.value)}
                  placeholder="Enter address"
                  disabled={updateMutation.isPending}
                />
              </div>
            </div>
          </div>

          {/* Person 2 Section */}
          <div className="space-y-4 p-4 bg-pink-50 rounded-lg border border-pink-100">
            <h3 className="font-semibold text-pink-800">Person 2</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="p2FirstName">First Name</Label>
                <Input
                  id="p2FirstName"
                  value={person2.firstName}
                  onChange={(e) => updatePerson2("firstName", e.target.value)}
                  placeholder="First name"
                  disabled={true}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p2MiddleName">Middle Name</Label>
                <Input
                  id="p2MiddleName"
                  value={person2.middleName}
                  onChange={(e) => updatePerson2("middleName", e.target.value)}
                  placeholder="Optional"
                  disabled={true}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p2LastName">Last Name</Label>
                <Input
                  id="p2LastName"
                  value={person2.lastName}
                  onChange={(e) => updatePerson2("lastName", e.target.value)}
                  placeholder="Last name"
                  disabled={true}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="p2Email">Email</Label>
              <Input
                id="p2Email"
                type="email"
                value={person2.email}
                placeholder="person2@example.com"
                disabled={true}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="p2Contact">Contact Number</Label>
                <Input
                  id="p2Contact"
                  value={person2.contactNumber}
                  onChange={(e) => updatePerson2("contactNumber", e.target.value)}
                  placeholder="+63..."
                  disabled={updateMutation.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p2Address">Address</Label>
                <Input
                  id="p2Address"
                  value={person2.address}
                  onChange={(e) => updatePerson2("address", e.target.value)}
                  placeholder="Enter address"
                  disabled={updateMutation.isPending}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={updateMutation.isPending}
              className="border border-gray-200"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Updating..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
