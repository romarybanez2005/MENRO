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
import { organizationService } from "@/lib/services"
import { Eye, EyeOff } from "lucide-react"

interface CreateOrganizationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function CreateOrganizationDialog({
  open,
  onOpenChange,
}: CreateOrganizationDialogProps) {
  const queryClient = useQueryClient()
  const [orgName, setOrgName] = useState("")
  const [presidentFirstName, setPresidentFirstName] = useState("")
  const [presidentMiddleName, setPresidentMiddleName] = useState("")
  const [presidentLastName, setPresidentLastName] = useState("")
  const [presidentEmail, setPresidentEmail] = useState("")
  const [presidentPassword, setPresidentPassword] = useState("")
  const [presidentContactNumber, setPresidentContactNumber] = useState("")
  const [presidentAddress, setPresidentAddress] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")

  const createMutation = useMutation({
    mutationFn: organizationService.store,
    onSuccess: (response) => {
      console.log('Success response:', response)
      // Invalidate and refetch organizations
      queryClient.invalidateQueries({ queryKey: ["organizations"] })
      // Reset form
      setOrgName("")
      setPresidentFirstName("")
      setPresidentMiddleName("")
      setPresidentLastName("")
      setPresidentEmail("")
      setPresidentPassword("")
      setPresidentContactNumber("")
      setPresidentAddress("")
      setError("")
      // Close dialog
      onOpenChange(false)
      // Show success toast at top center with green background
      toast.success("Organization created successfully! An email with the organization code has been sent to the president.", {
        position: "top-center",
        style: { background: "#22c55e", color: "white", border: "none" },
      })
    },
    onError: (err: any) => {
      console.error('Error response:', err)
      console.error('Error response data:', err.response?.data)
      console.error('Error response status:', err.response?.status)
      if (err.response?.data?.errors) {
        // Handle validation errors
        const errors = err.response.data.errors
        const firstError = Object.values(errors)[0]
        setError(Array.isArray(firstError) ? firstError[0] : firstError)
      } else {
        setError(err.response?.data?.message || "Failed to create organization. Please try again.")
      }
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!orgName.trim()) {
      setError("Organization name is required")
      return
    }
    if (!presidentFirstName.trim()) {
      setError("President first name is required")
      return
    }
    if (!presidentLastName.trim()) {
      setError("President last name is required")
      return
    }
    if (!presidentEmail.trim()) {
      setError("President email is required")
      return
    }
    if (!presidentPassword.trim()) {
      setError("President password is required")
      return
    }
    if (!presidentContactNumber.trim()) {
      setError("President contact number is required")
      return
    }
    if (!presidentAddress.trim()) {
      setError("President address is required")
      return
    }

    createMutation.mutate({
      name: orgName,
      president_first_name: presidentFirstName,
      president_middle_name: presidentMiddleName,
      president_last_name: presidentLastName,
      president_email: presidentEmail,
      president_password: presidentPassword,
      president_contact_number: presidentContactNumber,
      president_address: presidentAddress,
    })
  }

  const handleCancel = () => {
    setOrgName("")
    setPresidentFirstName("")
    setPresidentMiddleName("")
    setPresidentLastName("")
    setPresidentEmail("")
    setPresidentPassword("")
    setPresidentContactNumber("")
    setPresidentAddress("")
    setError("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle style={{ color: '#000000'}}>Create Organization</DialogTitle>
          <DialogDescription>
            Enter the organization details below. An email with the organization code will be sent to the president.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="orgName">Organization Name</Label>
            <Input
              id="orgName"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="Enter organization name"
              disabled={createMutation.isPending}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={presidentFirstName}
                onChange={(e) => setPresidentFirstName(e.target.value)}
                placeholder="First name"
                disabled={createMutation.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="middleName">Middle Name</Label>
              <Input
                id="middleName"
                value={presidentMiddleName}
                onChange={(e) => setPresidentMiddleName(e.target.value)}
                placeholder="Optional"
                disabled={createMutation.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={presidentLastName}
                onChange={(e) => setPresidentLastName(e.target.value)}
                placeholder="Last name"
                disabled={createMutation.isPending}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">President Email</Label>
            <Input
              id="email"
              type="email"
              value={presidentEmail}
              onChange={(e) => setPresidentEmail(e.target.value)}
              placeholder="president@example.com"
              disabled={createMutation.isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">President Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={presidentPassword}
                onChange={(e) => setPresidentPassword(e.target.value)}
                placeholder="Enter password"
                disabled={createMutation.isPending}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={createMutation.isPending}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactNumber">Contact Number</Label>
            <Input
              id="contactNumber"
              type="text"
              value={presidentContactNumber}
              onChange={(e) => setPresidentContactNumber(e.target.value)}
              placeholder="09123456789"
              disabled={createMutation.isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={presidentAddress}
              onChange={(e) => setPresidentAddress(e.target.value)}
              placeholder="Enter address"
              disabled={createMutation.isPending}
            />
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
              {createMutation.isPending ? "Creating..." : "Create Organization"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
