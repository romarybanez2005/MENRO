import { create } from 'zustand'

type Module = 'dashboard' | 'calendar' | 'gis-map' | 'organization' | 'couple' | 'monitoring-staff' | 'approval' | 'reports' | 'monitoring-history' | 'organization-certificate' | 'couple-certificate'

interface DashboardState {
  activeModule: Module
  showTrash: boolean
  loadedModules: Set<Module>
  setActiveModule: (module: Module) => void
  setShowTrash: (show: boolean) => void
  markModuleAsLoaded: (module: Module) => void
  isModuleLoaded: (module: Module) => boolean
  reset: () => void
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  activeModule: 'dashboard',
  showTrash: false,
  loadedModules: new Set<Module>(),
  
  setActiveModule: (module) => set({ activeModule: module }),
  
  setShowTrash: (show) => set({ showTrash: show }),
  
  markModuleAsLoaded: (module) => set((state) => {
    const newLoadedModules = new Set(state.loadedModules)
    newLoadedModules.add(module)
    return { loadedModules: newLoadedModules }
  }),
  
  isModuleLoaded: (module) => get().loadedModules.has(module),
  
  reset: () => set({
    activeModule: 'dashboard',
    showTrash: false,
    loadedModules: new Set<Module>()
  })
}))
