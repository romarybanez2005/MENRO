import { useState } from "react"
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
import { Eye, EyeOff } from "lucide-react"

interface CreateCoupleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function CreateCoupleDialog({
  open,
  onOpenChange,
}: CreateCoupleDialogProps) {
  const queryClient = useQueryClient()
  const [error, setError] = useState("")

  // Shared OR Number
  const [orNumber, setOrNumber] = useState("")

  // Person 1
  const [person1, setPerson1] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    password: "",
    contactNumber: "",
    address: "",
  })

  // Person 2
  const [person2, setPerson2] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    password: "",
    contactNumber: "",
    address: "",
  })

  const createMutation = useMutation({
    mutationFn: coupleService.store,
    onSuccess: async () => {
      // Show success toast first
      toast.success("Couple created successfully! Login credentials have been sent to both email addresses.", {
        position: "top-center",
        style: { background: "#22c55e", color: "white", border: "none" },
      })
      
      // Close dialog
      onOpenChange(false)
      
      // Reset form
      setOrNumber("")
      setPerson1({
        firstName: "",
        middleName: "",
        lastName: "",
        email: "",
        password: "",
        contactNumber: "",
        address: "",
      })
      setPerson2({
        firstName: "",
        middleName: "",
        lastName: "",
        email: "",
        password: "",
        contactNumber: "",
        address: "",
      })
      setError("")
      
      // Invalidate queries to refresh the list
      await queryClient.invalidateQueries({ queryKey: ["couples"] })
    },
    onError: (err: any) => {
      console.error('Full error response:', err.response?.data)
      if (err.response?.data?.errors) {
        const errors = err.response.data.errors
        const messages = Object.values(errors).flat().filter(Boolean)
        setError(messages.join('. '))
      } else if (err.response?.data?.message) {
        setError(err.response.data.message)
      } else {
        setError("Failed to create couple. Please try again.")
      }
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validation
    if (!orNumber.trim()) {
      setError("OR Number is required")
      return
    }
    if (!person1.firstName.trim() || !person1.lastName.trim()) {
      setError("Person 1 first and last name are required")
      return
    }
    if (!person1.email.trim()) {
      setError("Person 1 email is required")
      return
    }
    if (!person1.password.trim()) {
      setError("Person 1 password is required")
      return
    }
    if (person1.password.length < 8) {
      setError("Person 1 password must be at least 8 characters")
      return
    }
    if (!person2.firstName.trim() || !person2.lastName.trim()) {
      setError("Person 2 first and last name are required")
      return
    }
    if (!person2.email.trim()) {
      setError("Person 2 email is required")
      return
    }
    if (!person2.password.trim()) {
      setError("Person 2 password is required")
      return
    }
    if (person2.password.length < 8) {
      setError("Person 2 password must be at least 8 characters")
      return
    }

    createMutation.mutate({
      or_number: orNumber,
      husband_first_name: person1.firstName,
      husband_middle_name: person1.middleName,
      husband_last_name: person1.lastName,
      husband_email: person1.email,
      husband_password: person1.password,
      husband_contact_number: person1.contactNumber,
      husband_address: person1.address,
      wife_first_name: person2.firstName,
      wife_middle_name: person2.middleName,
      wife_last_name: person2.lastName,
      wife_email: person2.email,
      wife_password: person2.password,
      wife_contact_number: person2.contactNumber,
      wife_address: person2.address,
    })
  }

  const handleCancel = () => {
    setOrNumber("")
    setPerson1({
      firstName: "",
      middleName: "",
      lastName: "",
      email: "",
      password: "",
      contactNumber: "",
      address: "",
    })
    setPerson2({
      firstName: "",
      middleName: "",
      lastName: "",
      email: "",
      password: "",
      contactNumber: "",
      address: "",
    })
    setError("")
    onOpenChange(false)
  }

  const updatePerson1 = (field: string, value: string) => {
    setPerson1(prev => ({ ...prev, [field]: value }))
  }

  const updatePerson2 = (field: string, value: string) => {
    setPerson2(prev => ({ ...prev, [field]: value }))
  }

  const [showPassword1, setShowPassword1] = useState(false)
  const [showPassword2, setShowPassword2] = useState(false)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle style={{ color: '#000000'}}>Create Couple Account</DialogTitle>
          <DialogDescription>
            Enter the details for both persons. They will share the same OR number and receive login credentials via email.
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
              disabled={createMutation.isPending}
            />
          </div>

          {/* Person 1 Section */}
          <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <h3 className="font-semibold text-blue-800">Person 1</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="p1FirstName">First Name *</Label>
                <Input
                  id="p1FirstName"
                  value={person1.firstName}
                  onChange={(e) => updatePerson1("firstName", e.target.value)}
                  placeholder="First name"
                  disabled={createMutation.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p1MiddleName">Middle Name</Label>
                <Input
                  id="p1MiddleName"
                  value={person1.middleName}
                  onChange={(e) => updatePerson1("middleName", e.target.value)}
                  placeholder="Optional"
                  disabled={createMutation.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p1LastName">Last Name *</Label>
                <Input
                  id="p1LastName"
                  value={person1.lastName}
                  onChange={(e) => updatePerson1("lastName", e.target.value)}
                  placeholder="Last name"
                  disabled={createMutation.isPending}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="p1Email">Email *</Label>
              <Input
                id="p1Email"
                type="email"
                value={person1.email}
                onChange={(e) => updatePerson1("email", e.target.value)}
                placeholder="person1@example.com"
                disabled={createMutation.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p1Password">Password *</Label>
              <div className="relative">
                <Input
                  id="p1Password"
                  type={showPassword1 ? "text" : "password"}
                  value={person1.password}
                  onChange={(e) => updatePerson1("password", e.target.value)}
                  placeholder="Min 8 characters"
                  disabled={createMutation.isPending}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword1(!showPassword1)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword1 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="p1Contact">Contact Number</Label>
                <Input
                  id="p1Contact"
                  value={person1.contactNumber}
                  onChange={(e) => updatePerson1("contactNumber", e.target.value)}
                  placeholder="+63..."
                  disabled={createMutation.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p1Address">Address</Label>
                <Input
                  id="p1Address"
                  value={person1.address}
                  onChange={(e) => updatePerson1("address", e.target.value)}
                  placeholder="Enter address"
                  disabled={createMutation.isPending}
                />
              </div>
            </div>
          </div>

          {/* Person 2 Section */}
          <div className="space-y-4 p-4 bg-pink-50 rounded-lg border border-pink-100">
            <h3 className="font-semibold text-pink-800">Person 2</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="p2FirstName">First Name *</Label>
                <Input
                  id="p2FirstName"
                  value={person2.firstName}
                  onChange={(e) => updatePerson2("firstName", e.target.value)}
                  placeholder="First name"
                  disabled={createMutation.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p2MiddleName">Middle Name</Label>
                <Input
                  id="p2MiddleName"
                  value={person2.middleName}
                  onChange={(e) => updatePerson2("middleName", e.target.value)}
                  placeholder="Optional"
                  disabled={createMutation.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p2LastName">Last Name *</Label>
                <Input
                  id="p2LastName"
                  value={person2.lastName}
                  onChange={(e) => updatePerson2("lastName", e.target.value)}
                  placeholder="Last name"
                  disabled={createMutation.isPending}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="p2Email">Email *</Label>
              <Input
                id="p2Email"
                type="email"
                value={person2.email}
                onChange={(e) => updatePerson2("email", e.target.value)}
                placeholder="person2@example.com"
                disabled={createMutation.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p2Password">Password *</Label>
              <div className="relative">
                <Input
                  id="p2Password"
                  type={showPassword2 ? "text" : "password"}
                  value={person2.password}
                  onChange={(e) => updatePerson2("password", e.target.value)}
                  placeholder="Min 8 characters"
                  disabled={createMutation.isPending}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword2(!showPassword2)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword2 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="p2Contact">Contact Number</Label>
                <Input
                  id="p2Contact"
                  value={person2.contactNumber}
                  onChange={(e) => updatePerson2("contactNumber", e.target.value)}
                  placeholder="+63..."
                  disabled={createMutation.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p2Address">Address</Label>
                <Input
                  id="p2Address"
                  value={person2.address}
                  onChange={(e) => updatePerson2("address", e.target.value)}
                  placeholder="Enter address"
                  disabled={createMutation.isPending}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={createMutation.isPending}
              className="border border-gray-200"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Couple"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
