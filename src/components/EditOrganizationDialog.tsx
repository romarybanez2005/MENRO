import { useState, useEffect } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
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

interface Organization {
  id: string
  name: string
  presidentName: string
  presidentEmail: string
  code: string
}

interface EditOrganizationDialogProps {
  organization: Organization | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function EditOrganizationDialog({
  organization,
  open,
  onOpenChange,
}: EditOrganizationDialogProps) {
  const queryClient = useQueryClient()
  const [orgName, setOrgName] = useState("")
  const [presidentFirstName, setPresidentFirstName] = useState("")
  const [presidentMiddleName, setPresidentMiddleName] = useState("")
  const [presidentLastName, setPresidentLastName] = useState("")
  const [presidentEmail, setPresidentEmail] = useState("")
  const [error, setError] = useState("")

  // Parse president name when organization changes
  useEffect(() => {
    if (organization) {
      setOrgName(organization.name)
      setPresidentEmail(organization.presidentEmail)
      
      // Parse president name (format: "First Middle Last" or "First Last")
      const nameParts = organization.presidentName.split(" ")
      if (nameParts.length >= 2) {
        setPresidentFirstName(nameParts[0])
        setPresidentLastName(nameParts[nameParts.length - 1])
        
        // Check if there's a middle name
        if (nameParts.length >= 3) {
          setPresidentMiddleName(nameParts.slice(1, -1).join(" "))
        } else {
          setPresidentMiddleName("")
        }
      } else {
        setPresidentFirstName(organization.presidentName)
        setPresidentMiddleName("")
        setPresidentLastName("")
      }
    }
  }, [organization])

  const updateMutation = useMutation({
    mutationFn: (data: any) => organizationService.update(Number(organization?.id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] })
      setError("")
      onOpenChange(false)
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || "Failed to update organization. Please try again.")
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

    updateMutation.mutate({
      org_name: orgName,
      president_first_name: presidentFirstName,
      president_middle_name: presidentMiddleName,
      president_last_name: presidentLastName,
      president_email: presidentEmail,
    })
  }

  const handleCancel = () => {
    setError("")
    onOpenChange(false)
  }

  if (!organization) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Organization</DialogTitle>
          <DialogDescription>
            Update the organization details below.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="editOrgName">Organization Name</Label>
            <Input
              id="editOrgName"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="Enter organization name"
              disabled={updateMutation.isPending}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="editFirstName">First Name</Label>
              <Input
                id="editFirstName"
                value={presidentFirstName}
                onChange={(e) => setPresidentFirstName(e.target.value)}
                placeholder="First name"
                disabled={updateMutation.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editMiddleName">Middle Name</Label>
              <Input
                id="editMiddleName"
                value={presidentMiddleName}
                onChange={(e) => setPresidentMiddleName(e.target.value)}
                placeholder="Optional"
                disabled={updateMutation.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editLastName">Last Name</Label>
              <Input
                id="editLastName"
                value={presidentLastName}
                onChange={(e) => setPresidentLastName(e.target.value)}
                placeholder="Last name"
                disabled={updateMutation.isPending}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="editEmail">President Email</Label>
            <Input
              id="editEmail"
              type="email"
              value={presidentEmail}
              onChange={(e) => setPresidentEmail(e.target.value)}
              placeholder="president@example.com"
              disabled={updateMutation.isPending}
            />
          </div>
          <div className="space-y-2">
            <Label>Organization Code</Label>
            <div className="p-2 bg-muted rounded-md text-sm font-mono text-muted-foreground">
              {organization.code}
            </div>
          </div>
          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={updateMutation.isPending}
            >
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
