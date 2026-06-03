import { useState, useRef, useEffect } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Camera, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { profileService } from "@/lib/services"
import { API_BASE_URL } from "@/lib/api"

interface ProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onProfileUpdated?: () => void
}

interface UserProfile {
  id: string
  first_name: string
  middle_name: string | null
  last_name: string
  email: string
  contact_number: string | null
  address: string | null
  photo: string | null
}

export default function ProfileDialog({ open, onOpenChange, onProfileUpdated }: ProfileDialogProps) {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  
  const [formData, setFormData] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    email: "",
    contact_number: "",
    address: "",
  })

  // Fetch profile data
  const { data: profile, isLoading } = useQuery({
    queryKey: ["user-profile"],
    queryFn: async () => {
      const response = await profileService.getProfile()
      return response.data?.data?.user as UserProfile
    },
    enabled: open,
  })

  // Update form when profile data loads
  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || "",
        middle_name: profile.middle_name || "",
        last_name: profile.last_name || "",
        email: profile.email || "",
        contact_number: profile.contact_number || "",
        address: profile.address || "",
      })
      setAvatarPreview(profile?.photo ? `${API_BASE_URL.replace('/api', '')}/${profile.photo}` : null)
    }
  }, [profile])

  // Update profile mutation
  const updateMutation = useMutation({
    mutationFn: (data: typeof formData) => profileService.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-profile"] })
      // Update localStorage user data
      const userStr = localStorage.getItem("user")
      if (userStr) {
        const user = JSON.parse(userStr)
        user.first_name = formData.first_name
        user.last_name = formData.last_name
        user.email = formData.email
        localStorage.setItem("user", JSON.stringify(user))
        console.log('ProfileDialog: Updated localStorage with new data:', user)
      }
      toast.success("Profile updated successfully")
      setIsEditing(false)
      console.log('ProfileDialog: Calling onProfileUpdated callback')
      onProfileUpdated?.()
    },
    onError: () => {
      toast.error("Failed to update profile. Please try again.")
    },
  })

  // Upload photo mutation
  const uploadPhotoMutation = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData()
      formData.append("photo", file)
      return profileService.updatePhoto(formData)
    },
    onSuccess: (response) => {
      console.log('Photo upload response:', response)
      queryClient.invalidateQueries({ queryKey: ["user-profile"] })
      // Update localStorage with new photo path
      const userStr = localStorage.getItem("user")
      if (userStr && response.data?.data?.photo) {
        const user = JSON.parse(userStr)
        user.photo = response.data.data.photo
        localStorage.setItem("user", JSON.stringify(user))
        console.log('Updated localStorage with photo path:', user.photo)
        // Update avatar preview immediately
        setAvatarPreview(`${API_BASE_URL.replace('/api', '')}/${response.data.data.photo}`)
      }
      toast.success("Profile photo updated successfully")
      onProfileUpdated?.()
    },
    onError: () => {
      toast.error("Failed to update profile photo. Please try again.")
    },
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Store file for later upload on save
      setSelectedFile(file)
      // Preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Upload photo first if a new file was selected
    if (selectedFile) {
      await uploadPhotoMutation.mutateAsync(selectedFile)
      setSelectedFile(null)
    }
    
    // Then update profile
    updateMutation.mutate(formData)
  }

  const getInitials = (firstName: string, lastName: string) => {
    const first = firstName?.charAt(0)?.toUpperCase() || ""
    const last = lastName?.charAt(0)?.toUpperCase() || ""
    return first + last || "AU"
  }

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle style={{ color: '#000000' }}>Loading Profile</DialogTitle>
            <DialogDescription>Please wait while we load your profile information.</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="border-b border-gray-200">
          <DialogTitle style={{ color: '#000000'}}>Profile</DialogTitle>
          <DialogDescription>Update your profile information and photo.</DialogDescription>
        </DialogHeader>

        {/* Avatar Section */}
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="relative">
            <div className="h-24 w-24 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold overflow-hidden">
              {avatarPreview || profile?.photo ? (
                <img 
                  src={avatarPreview || (profile?.photo ? `${API_BASE_URL.replace('/api', '')}/${profile.photo}` : '')} 
                  alt="Profile" 
                  className="h-full w-full object-cover"
                />
              ) : (
                getInitials(profile?.first_name || "", profile?.last_name || "")
              )}
            </div>
            {isEditing && (
              <>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-2 bg-muted rounded-full hover:bg-muted/80 transition-colors"
                  disabled={uploadPhotoMutation.isPending || updateMutation.isPending}
                >
                  {uploadPhotoMutation.isPending || updateMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {profile?.first_name} {profile?.last_name}
          </p>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                disabled={!isEditing || updateMutation.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                disabled={!isEditing || updateMutation.isPending}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="middle_name">Middle Name</Label>
            <Input
              id="middle_name"
              value={formData.middle_name}
              onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })}
              disabled={!isEditing || updateMutation.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={!isEditing || updateMutation.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_number">Contact Number</Label>
            <Input
              id="contact_number"
              value={formData.contact_number}
              onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
              disabled={!isEditing || updateMutation.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              disabled={!isEditing || updateMutation.isPending}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            {isEditing ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  disabled={updateMutation.isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save Changes
                </Button>
              </>
            ) : (
              <Button type="button" onClick={() => setIsEditing(true)}>
                Edit Profile
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
