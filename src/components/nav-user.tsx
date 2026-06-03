"use client"

import { useState, useEffect } from "react"
import {
  ChevronsUpDown,
  LogOut,
  Trash,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import ProfileDialog from "./ProfileDialog"
import { API_BASE_URL } from "@/lib/api"

interface NavUserProps {
  onTrashClick: () => void
  onLogout: () => void
}

interface UserData {
  first_name: string
  last_name: string
  email: string
  avatar_url?: string
  photo?: string
}

export function NavUser({ onTrashClick, onLogout }: NavUserProps) {
  const { isMobile } = useSidebar()
  const [showProfile, setShowProfile] = useState(false)
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
  const [user, setUser] = useState<UserData | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleLogoutClick = () => {
    setShowLogoutDialog(true)
  }

  const handleConfirmLogout = () => {
    setShowLogoutDialog(false)
    onLogout()
  }

  const handleProfileUpdated = () => {
    // Force re-render by updating refresh key
    setRefreshKey(prev => prev + 1)
    // Refresh user data from localStorage
    const userStr = localStorage.getItem("user")
    if (userStr) {
      const userData = JSON.parse(userStr)
      setUser(userData)
      console.log('Profile updated, new user data:', userData)
    }
  }

  useEffect(() => {
    const userStr = localStorage.getItem("user")
    if (userStr) {
      setUser(JSON.parse(userStr))
    }
  }, [showProfile, refreshKey]) // Refresh when profile dialog closes or when refresh key changes

  const getInitials = () => {
    if (!user) return "AU"
    const first = user.first_name?.charAt(0)?.toUpperCase() || ""
    const last = user.last_name?.charAt(0)?.toUpperCase() || ""
    return first + last || "AU"
  }

  const displayName = user ? `${user.first_name} ${user.last_name}` : "Admin User"
  const displayEmail = user?.email || "admin@menro.com"

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage
                    src={user?.avatar_url || (user?.photo ? `${API_BASE_URL.replace('/api', '')}/${user.photo}` : undefined)}
                    alt={displayName}
                  />
                  <AvatarFallback className="rounded-lg bg-primary text-primary-foreground font-semibold">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{displayName}</span>
                  <span className="truncate text-xs">{displayEmail}</span>
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuLabel 
                className="p-0 font-normal cursor-pointer hover:bg-muted/50" 
                onClick={() => setShowProfile(true)}
              >
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage
                      src={user?.avatar_url || (user?.photo ? `${API_BASE_URL.replace('/api', '')}/${user.photo}` : undefined)}
                      alt={displayName}
                    />
                    <AvatarFallback className="rounded-lg bg-primary text-primary-foreground font-semibold">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold text-black">{displayName}</span>
                    <span className="truncate text-xs text-black/70">{displayEmail}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={onTrashClick}>
                  <Trash />
                  Trash
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogoutClick}>
                <LogOut />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <ProfileDialog open={showProfile} onOpenChange={setShowProfile} onProfileUpdated={handleProfileUpdated} />

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ color: 'black' }}>Are you sure you want to logout?</AlertDialogTitle>
            <AlertDialogDescription>
              You will be redirected to the login page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowLogoutDialog(false)} className="border border-gray-200">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmLogout} className="bg-red-500 hover:bg-red-600 text-white">
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
