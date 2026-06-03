import api from './api';

// Auth Services
export const authService = {
  login: (email: string, password: string) =>
    api.post('/login', { email, password }),
  
  register: (data: any) =>
    api.post('/register', data),
  
  logout: () =>
    api.post('/logout'),
  
  forgotPassword: (email: string) =>
    api.post('/forgot-password', { email }),
  
  resetPassword: (data: any) =>
    api.post('/reset-password', data),
  
  validateCode: (code: string) =>
    api.post('/validate-code', { code }),
  
  getUser: () =>
    api.get('/user'),
  
  getOrganizationByCode: (code: string) =>
    api.get(`/organizations/by-code/${code}`),
};

// Profile Services
export const profileService = {
  getProfile: () =>
    api.get('/user/profile'),
  
  updateProfile: (data: any) =>
    api.put('/user/profile', data),
  
  updatePhoto: (formData: FormData) =>
    api.post('/user/profile/photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
};

// Organization Services
export const organizationService = {
  index: () =>
    api.get('/organizations'),
  
  store: (data: any) =>
    api.post('/organizations', data),
  
  show: (id: number) =>
    api.get(`/organizations/${id}`),
  
  update: (id: number, data: any) =>
    api.put(`/organizations/${id}`, data),
  
  destroy: (id: number) =>
    api.delete(`/organizations/${id}`),
  
  getUsers: (id: number) =>
    api.get(`/organizations/${id}/users`),
  
  // Trash related methods
  trashed: () =>
    api.get('/organizations/trashed'),
  
  restore: (id: number) =>
    api.post(`/organizations/${id}/restore`),
  
  forceDelete: (id: number) =>
    api.delete(`/organizations/${id}/force`),
  
  bulkRestore: (ids: number[]) =>
    api.post('/organizations/bulk-restore', { ids }),
  
  bulkForceDelete: (ids: number[]) =>
    api.post('/organizations/bulk-force-delete', { ids }),
};

// Couple Services
export const coupleService = {
  index: () =>
    api.get('/couples'),
  
  store: (data: any) =>
    api.post('/couples', data),
  
  show: (orNumber: string) =>
    api.get(`/couples/${orNumber}`),
  
  update: (orNumber: string, data: any) =>
    api.put(`/couples/${orNumber}`, data),
  
  destroy: (orNumber: string) =>
    api.delete(`/couples/${orNumber}`),
  
  getUsers: (orNumber: string) =>
    api.get(`/couples/${orNumber}/users`),
  
  // Individual user operations
  deleteUser: (userId: string) =>
    api.delete(`/users/${userId}`),
  
  restoreUser: (userId: string) =>
    api.post(`/users/${userId}/restore`),
  
  forceDeleteUser: (userId: string) =>
    api.delete(`/users/${userId}/force`),
  
  // Get trashed couple users
  trashed: () =>
    api.get('/users/trashed?role=couple'),
};

// Tree Planter Services
export const treePlanterService = {
  index: () =>
    api.get('/tree-planters'),
  
  store: (data: any) =>
    api.post('/tree-planters', data),
  
  show: (id: number) =>
    api.get(`/tree-planters/${id}`),
  
  update: (id: number, data: any) =>
    api.put(`/tree-planters/${id}`, data),
  
  destroy: (id: number) =>
    api.delete(`/tree-planters/${id}`),
};

// Planting Activity Services
export const plantingActivityService = {
  index: () =>
    api.get('/planting-activities'),
  
  store: (data: any) =>
    api.post('/planting-activities', data),
  
  show: (id: number) =>
    api.get(`/planting-activities/${id}`),
  
  update: (id: number, data: any) =>
    api.put(`/planting-activities/${id}`, data),
  
  destroy: (id: number) =>
    api.delete(`/planting-activities/${id}`),
};

// Tree Services
export const treeService = {
  index: () =>
    api.get('/trees'),
  
  store: (data: any) =>
    api.post('/trees', data),
  
  myTrees: () =>
    api.get('/trees/my-trees'),
  
  byActivity: (activityId: number) =>
    api.get(`/trees/by-activity/${activityId}`),
  
  show: (id: number) =>
    api.get(`/trees/${id}`),
  
  sync: (data: any) =>
    api.post('/trees/sync', data),
};

// Monitoring Staff Services
export const monitoringStaffService = {
  index: () =>
    api.get('/monitoring-staff'),

  store: (data: any) =>
    api.post('/monitoring-staff', data),

  update: (id: string, data: any) =>
    api.put(`/monitoring-staff/${id}`, data),

  trashed: () =>
    api.get('/users/trashed?role=monitoring%20staff'),
};

// Monitoring Services
export const monitoringService = {
  assignments: () =>
    api.get('/monitoring/assignments'),
  
  getTreesForMonitoring: () =>
    api.get('/monitoring/trees-for-monitoring'),
  
  store: (data: any) =>
    api.post('/monitoring', data),
  
  history: () =>
    api.get('/monitoring/history'),
  
  sync: (data: any) =>
    api.post('/monitoring/sync', data),
};

// Attendance Services
export const attendanceService = {
  index: () =>
    api.get('/attendance'),
  
  store: (data: any) =>
    api.post('/attendance', data),
  
  summary: () =>
    api.get('/attendance/summary'),
  
  show: (id: number) =>
    api.get(`/attendance/${id}`),
  
  update: (id: number, data: any) =>
    api.put(`/attendance/${id}`, data),
  
  destroy: (id: number) =>
    api.delete(`/attendance/${id}`),
};

// Dashboard Services
export const dashboardService = {
  calendarEvents: () =>
    api.get('/calendar-events'),
  
  getUserOrganizations: (userId: number) =>
    api.get(`/user/${userId}/organizations`),
};
