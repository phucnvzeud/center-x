import axios from 'axios';

// Determine the base URL based on environment
const baseURL = process.env.NODE_ENV === 'production' 
  ? '/api' // In production, the API is served from the same domain
  : '/api'; // In development, we use the proxy setting in package.json

// Create an axios instance with the base API URL
const api = axios.create({
  baseURL
});

// Teachers API
export const teachersAPI = {
  getAll: () => api.get('/teachers'),
  getById: (id) => api.get(`/teachers/${id}`),
  create: (data) => api.post('/teachers', data),
  update: (id, data) => api.put(`/teachers/${id}`, data),
  remove: (id) => api.delete(`/teachers/${id}`),
  getCourses: (id) => api.get(`/teachers/${id}/courses`),
  getKindergartenClasses: (id) => api.get(`/teachers/${id}/kindergarten-classes`)
};

// Students API
export const studentsAPI = {
  getAll: () => api.get('/students'),
  getById: (id) => api.get(`/students/${id}`),
  create: (data) => api.post('/students', data),
  update: (id, data) => api.put(`/students/${id}`, data),
  remove: (id) => api.delete(`/students/${id}`),
  getEnrollments: (id) => api.get(`/students/${id}/enrollments`),
  enroll: (id, data) => api.post(`/students/${id}/enroll`, data),
  withdraw: (id, data) => api.post(`/students/${id}/withdraw`, data)
};

// Courses API
export const coursesAPI = {
  getAll: () => api.get('/courses'),
  getById: (id) => api.get(`/courses/${id}`),
  create: (data) => api.post('/courses', data),
  update: (id, data) => api.put(`/courses/${id}`, data),
  remove: (id) => api.delete(`/courses/${id}`),
  getSessions: (id) => api.get(`/courses/${id}/sessions`),
  updateSession: (id, sessionIndex, data) => api.put(`/courses/${id}/sessions/${sessionIndex}`, data),
  updateSessionAttendance: (sessionId, studentId, status) => api.put(`/courses/sessions/${sessionId}/attendance`, { studentId, status }),
  getEnrollments: (id) => {
    console.log(`🔍 Getting enrollments for course ${id}`);
    return api.get(`/courses/${id}/enrollments`);
  },
  getProgress: (id) => api.get(`/courses/${id}/progress`)
};

// Branches API
export const branchesAPI = {
  getAll: () => api.get('/branches'),
  getById: (id) => api.get(`/branches/${id}`),
  create: (data) => api.post('/branches', data),
  update: (id, data) => api.put(`/branches/${id}`, data),
  remove: (id) => api.delete(`/branches/${id}`)
};

// Regions API for Kindergarten system
export const regionsAPI = {
  getAll: () => api.get('/regions'),
  getById: (id) => api.get(`/regions/${id}`),
  create: (data) => api.post('/regions', data),
  update: (id, data) => api.put(`/regions/${id}`, data),
  remove: (id) => api.delete(`/regions/${id}`),
  getSchools: (id) => api.get(`/regions/${id}/schools`)
};

// Schools API for Kindergarten system
export const schoolsAPI = {
  getAll: (regionId) => api.get(regionId ? `/schools?region=${regionId}` : '/schools'),
  getById: (id) => api.get(`/schools/${id}`),
  create: (data) => api.post('/schools', data),
  update: (id, data) => api.put(`/schools/${id}`, data),
  remove: (id) => api.delete(`/schools/${id}`),
  getClasses: (id, status) => api.get(status ? `/schools/${id}/classes?status=${status}` : `/schools/${id}/classes`)
};

// Kindergarten Classes API
export const kindergartenClassesAPI = {
  getAll: (filters = {}) => {
    let url = '/kindergarten-classes';
    const params = new URLSearchParams();
    
    if (filters.school) params.append('school', filters.school);
    if (filters.status) params.append('status', filters.status);
    if (filters.teacherName) params.append('teacherName', filters.teacherName);
    if (filters.teacher) params.append('teacher', filters.teacher);
    
    const queryString = params.toString();
    if (queryString) url += `?${queryString}`;
    
    return api.get(url);
  },
  getById: (id) => api.get(`/kindergarten-classes/${id}`),
  create: (data) => api.post('/kindergarten-classes', data),
  update: (id, data) => api.put(`/kindergarten-classes/${id}`, data),
  remove: (id) => api.delete(`/kindergarten-classes/${id}`),
  updateSession: (id, sessionIndex, data) => api.put(`/kindergarten-classes/${id}/sessions/${sessionIndex}`, data),
  getSessions: (id) => api.get(`/kindergarten-classes/${id}/sessions`),
  getSessionStats: (id) => api.get(`/kindergarten-classes/${id}/sessions/stats`),
  getStats: () => api.get('/kindergarten-classes/stats/overview'),
  addCustomSession: (id, data) => api.post(`/kindergarten-classes/${id}/sessions/custom`, data)
};

// Holidays API for global holiday management
export const holidaysAPI = {
  getAll: () => api.get('/holidays'),
  getById: (id) => api.get(`/holidays/${id}`),
  create: (data) => api.post('/holidays', data),
  update: (id, data) => api.put(`/holidays/${id}`, data),
  remove: (id) => api.delete(`/holidays/${id}`),
  applyToAllClasses: () => api.post('/holidays/apply-all'),
  checkDateRange: (startDate, endDate) => api.post('/holidays/check-dates', { startDate, endDate })
};

// Health check API
export const healthAPI = {
  check: () => api.get('/health')
};

export default {
  teachers: teachersAPI,
  students: studentsAPI,
  courses: coursesAPI,
  branches: branchesAPI,
  regions: regionsAPI,
  schools: schoolsAPI,
  kindergartenClasses: kindergartenClassesAPI,
  holidays: holidaysAPI,
  health: healthAPI
}; 