import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { NavMain } from '@/components/nav-main'
import { NavUser } from '@/components/nav-user'
import LoadingScreen from './LoadingScreen'
import { LayoutDashboard, Map, Building2, Heart, Users, CheckCircle, FileText, Calendar } from 'lucide-react'
import DashboardPage from './pages/DashboardPage'
import GISMapPage from './pages/GISMapPage.tsx'
import OrganizationPage from './pages/OrganizationPage.tsx'
import CouplePage from './pages/CouplePage.tsx'
import MonitoringStaffPage from './pages/MonitoringStaffPage.tsx'
import ApprovalPage from './pages/ApprovalPage.tsx'
import ReportsPage from './pages/ReportsPage.tsx'
import CalendarPage from './pages/CalendarPage.tsx'
import TrashPage from './pages/TrashPage.tsx'
import OrganizationCertificatePage from './pages/OrganizationCertificatePage.tsx'
import CoupleCertificatePage from './pages/CoupleCertificatePage.tsx'
import { useDashboardStore } from '@/store/dashboardStore'

type Module = 'dashboard' | 'calendar' | 'gis-map' | 'organization' | 'couple' | 'monitoring-staff' | 'approval' | 'reports' | 'monitoring-history' | 'organization-certificate' | 'couple-certificate'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { activeModule, showTrash, setActiveModule, setShowTrash, markModuleAsLoaded, isModuleLoaded } = useDashboardStore()
  const [isLoading, setIsLoading] = useState(true)
  const [isTrashLoading, setIsTrashLoading] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  useEffect(() => {
    // Only show loading if module hasn't been loaded before
    if (!isModuleLoaded(activeModule)) {
      setIsLoading(true)
      const timer = setTimeout(() => {
        setIsLoading(false)
        markModuleAsLoaded(activeModule)
      }, 500)
      return () => clearTimeout(timer)
    } else {
      setIsLoading(false)
    }
  }, [activeModule, isModuleLoaded, markModuleAsLoaded])

  useEffect(() => {
    if (showTrash) {
      setIsTrashLoading(true)
      const timer = setTimeout(() => {
        setIsTrashLoading(false)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [showTrash])

  const modules = [
    { title: 'Dashboard', url: '#', icon: <LayoutDashboard />, isActive: activeModule === 'dashboard', onClick: () => handleModuleClick('Dashboard') },
    { title: 'Calendar', url: '#', icon: <Calendar />, isActive: activeModule === 'calendar', onClick: () => handleModuleClick('Calendar') },
    { title: 'GIS Map', url: '#', icon: <Map />, isActive: activeModule === 'gis-map', onClick: () => handleModuleClick('GIS Map') },
    { title: 'Organization', url: '#', icon: <Building2 />, isActive: activeModule === 'organization', onClick: () => handleModuleClick('Organization') },
    { title: 'Couple', url: '#', icon: <Heart />, isActive: activeModule === 'couple', onClick: () => handleModuleClick('Couple') },
    { title: 'Monitoring Staff', url: '#', icon: <Users />, isActive: activeModule === 'monitoring-staff', onClick: () => handleModuleClick('Monitoring Staff') },
    { title: 'Approval', url: '#', icon: <CheckCircle />, isActive: activeModule === 'approval', onClick: () => handleModuleClick('Approval') },
    {
      title: 'Reports',
      url: '#',
      icon: <FileText />,
      isActive: activeModule === 'reports' || activeModule === 'monitoring-history' || activeModule === 'organization-certificate' || activeModule === 'couple-certificate',
      items: [
        { title: 'Monitoring History', url: '#', onClick: () => handleModuleClick('Monitoring History') },
        { title: 'Organization Certificate', url: '#', onClick: () => handleModuleClick('Organization Certificate') },
        { title: 'Couple Certificate', url: '#', onClick: () => handleModuleClick('Couple Certificate') },
      ],
    },
  ]

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <DashboardPage />
      case 'calendar':
        return <CalendarPage />
      case 'gis-map':
        return <GISMapPage />
      case 'organization':
        return <OrganizationPage />
      case 'couple':
        return <CouplePage />
      case 'monitoring-staff':
        return <MonitoringStaffPage />
      case 'approval':
        return <ApprovalPage />
      case 'reports':
      case 'monitoring-history':
        return <ReportsPage />
      case 'organization-certificate':
        return <OrganizationCertificatePage />
      case 'couple-certificate':
        return <CoupleCertificatePage />
      default:
        return <DashboardPage />
    }
  }

  const handleModuleClick = (title: string) => {
    const moduleMap: { [key: string]: Module } = {
      'Dashboard': 'dashboard',
      'Calendar': 'calendar',
      'GIS Map': 'gis-map',
      'Organization': 'organization',
      'Couple': 'couple',
      'Monitoring Staff': 'monitoring-staff',
      'Approval': 'approval',
      'Reports': 'reports',
      'Monitoring History': 'monitoring-history',
      'Organization Certificate': 'organization-certificate',
      'Couple Certificate': 'couple-certificate',
    }
    setActiveModule(moduleMap[title] || 'dashboard')
  }

  return (
    <TooltipProvider>
      {isTrashLoading && <LoadingScreen fullScreen />}
      {showTrash ? (
        <TrashPage onBack={() => setShowTrash(false)} />
      ) : (
        <SidebarProvider>
          <Sidebar collapsible="icon" className="shadow-lg">
            <SidebarHeader>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton size="lg" asChild>
                    <a href="#">
                      <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground overflow-hidden">
                        <img src="/src/assets/menro-logo.png" alt="Menro Logo" className="w-full h-full object-cover" />
                      </div>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">Menro Admin</span>
                        <span className="truncate text-xs">Dashboard</span>
                      </div>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarHeader>
            
            
            <SidebarContent>
              <NavMain items={modules.map(m => ({ ...m, onClick: () => handleModuleClick(m.title) }))} />
            </SidebarContent>

            <SidebarFooter  className="border-t border-gray-200">
              <NavUser 
                onTrashClick={() => setShowTrash(true)}
                onLogout={handleLogout}
              />
            </SidebarFooter>
            <SidebarRail />
          </Sidebar>
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <div className="flex items-center gap-2 font-semibold">
                <span className="capitalize">{activeModule.replace('-', ' ')}</span>
              </div>
            </header>
            <div className="h-px bg-gray-200 dark:bg-gray-700" />
            <div className="flex flex-1 flex-col gap-4 p-4">
              {isLoading ? <LoadingScreen /> : renderModule()}
            </div>
          </SidebarInset>
        </SidebarProvider>
      )}
    </TooltipProvider>
  )
}
