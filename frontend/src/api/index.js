import axios from 'axios';
import { getCacheItem, setCacheItem, generateCacheKey, clearCache } from './cache';

// Determine the base URL based on environment
const baseURL = process.env.NODE_ENV === 'production' 
  ? '/api' // In production, the API is served from the same domain
  : '/api'; // In development, we use the proxy setting in package.json

// Create an axios instance with the base API URL
const api = axios.create({
  baseURL
});

/**
 * Cached API request wrapper - caches GET requests
 * @param {Function} apiCall - Original API function
 * @param {Array} args - Arguments to pass to API function
 * @param {string} cacheKeyPrefix - Prefix for cache key
 * @param {number} ttl - Cache TTL in ms
 * @returns {Promise} API response
 */
const cachedRequest = async (apiCall, args = [], cacheKeyPrefix, ttl) => {
  // Only cache GET requests
  if (!apiCall.toString().includes('api.get')) {
    return apiCall(...args);
  }
  
  const cacheKey = generateCacheKey(cacheKeyPrefix, args);
  const cachedValue = getCacheItem(cacheKey);
  
  if (cachedValue) {
    console.log(`🔍 Cache hit for: ${cacheKey}`);
    return { ...cachedValue, _fromCache: true };
  }
  
  console.log(`🔍 Cache miss for: ${cacheKey}`);
  const response = await apiCall(...args);
  setCacheItem(cacheKey, response, ttl);
  return response;
};

// Teachers API
export const teachersAPI = {
  getAll: async () => cachedRequest(api.get, ['/teachers'], 'teachersAPI.getAll', 60000),
  getById: async (id) => cachedRequest(api.get, [`/teachers/${id}`], 'teachersAPI.getById', 60000),
  create: (data) => api.post('/teachers', data),
  update: (id, data) => {
    clearCache(['teachersAPI.getAll', `teachersAPI.getById:["${id}"]`]);
    return api.put(`/teachers/${id}`, data);
  },
  remove: (id) => {
    clearCache(['teachersAPI.getAll', `teachersAPI.getById:["${id}"]`]);
    return api.delete(`/teachers/${id}`);
  },
  getCourses: async (id) => cachedRequest(api.get, [`/teachers/${id}/courses`], 'teachersAPI.getCourses', 60000),
  getKindergartenClasses: async (id) => cachedRequest(api.get, [`/teachers/${id}/kindergarten-classes`], 'teachersAPI.getKindergartenClasses', 60000)
};

// Students API
export const studentsAPI = {
  getAll: async () => cachedRequest(api.get, ['/students'], 'studentsAPI.getAll', 60000),
  getById: async (id) => cachedRequest(api.get, [`/students/${id}`], 'studentsAPI.getById', 60000),
  create: (data) => {
    clearCache(['studentsAPI.getAll']);
    return api.post('/students', data);
  },
  update: (id, data) => {
    clearCache(['studentsAPI.getAll', `studentsAPI.getById:["${id}"]`]);
    return api.put(`/students/${id}`, data);
  },
  remove: (id) => {
    clearCache(['studentsAPI.getAll', `studentsAPI.getById:["${id}"]`]);
    return api.delete(`/students/${id}`);
  },
  getEnrollments: async (id) => cachedRequest(api.get, [`/students/${id}/enrollments`], 'studentsAPI.getEnrollments', 60000),
  enroll: (id, data) => {
    clearCache([`studentsAPI.getEnrollments:["${id}"]`]);
    return api.post(`/students/${id}/enroll`, data);
  },
  withdraw: (id, data) => {
    clearCache([`studentsAPI.getEnrollments:["${id}"]`]);
    return api.post(`/students/${id}/withdraw`, data);
  }
};

// Courses API
export const coursesAPI = {
  getAll: async () => cachedRequest(api.get, ['/courses'], 'coursesAPI.getAll', 60000),
  getById: async (id) => cachedRequest(api.get, [`/courses/${id}`], 'coursesAPI.getById', 60000),
  create: (data) => {
    clearCache(['coursesAPI.getAll']);
    return api.post('/courses', data);
  },
  update: (id, data) => {
    clearCache(['coursesAPI.getAll', `coursesAPI.getById:["${id}"]`]);
    return api.put(`/courses/${id}`, data);
  },
  remove: (id) => {
    clearCache(['coursesAPI.getAll', `coursesAPI.getById:["${id}"]`]);
    return api.delete(`/courses/${id}`);
  },
  getSessions: async (id) => cachedRequest(api.get, [`/courses/${id}/sessions`], 'coursesAPI.getSessions', 60000),
  updateSession: (id, sessionIndex, data) => {
    clearCache([`coursesAPI.getSessions:["${id}"]`]);
    return api.put(`/courses/${id}/sessions/${sessionIndex}`, data);
  },
  updateSessionAttendance: (sessionId, studentId, status) => {
    // Clear potentially affected caches
    clearCache(['coursesAPI.getAll']);
    return api.put(`/courses/sessions/${sessionId}/attendance`, { studentId, status });
  },
  getEnrollments: async (id) => {
    console.log(`🔍 Getting enrollments for course ${id}`);
    return cachedRequest(api.get, [`/courses/${id}/enrollments`], 'coursesAPI.getEnrollments', 60000);
  },
  getProgress: async (id) => cachedRequest(api.get, [`/courses/${id}/progress`], 'coursesAPI.getProgress', 60000)
};

// Function to create cached API methods for an object
const createCachedAPI = (baseObject, cachePrefixName, cacheTTL = 60000) => {
  const cachedAPI = {};
  
  Object.keys(baseObject).forEach(key => {
    const apiMethod = baseObject[key];
    
    // For GET methods, add caching
    if (typeof apiMethod === 'function' && apiMethod.toString().includes('=> api.get')) {
      cachedAPI[key] = async (...args) => cachedRequest(apiMethod, args, `${cachePrefixName}.${key}`, cacheTTL);
    } else {
      cachedAPI[key] = apiMethod;
    }
  });
  
  return cachedAPI;
};

// Branches API
const branchesBaseAPI = {
  getAll: () => api.get('/branches'),
  getById: (id) => api.get(`/branches/${id}`),
  create: (data) => api.post('/branches', data),
  update: (id, data) => api.put(`/branches/${id}`, data),
  remove: (id) => api.delete(`/branches/${id}`)
};
export const branchesAPI = createCachedAPI(branchesBaseAPI, 'branchesAPI');

// Regions API for Kindergarten system
const regionsBaseAPI = {
  getAll: () => api.get('/regions'),
  getById: (id) => api.get(`/regions/${id}`),
  create: (data) => api.post('/regions', data),
  update: (id, data) => api.put(`/regions/${id}`, data),
  remove: (id) => api.delete(`/regions/${id}`),
  getSchools: (id) => api.get(`/regions/${id}/schools`)
};
export const regionsAPI = createCachedAPI(regionsBaseAPI, 'regionsAPI');

// Schools API for Kindergarten system
const schoolsBaseAPI = {
  getAll: (regionId) => api.get(regionId ? `/schools?region=${regionId}` : '/schools'),
  getById: (id) => api.get(`/schools/${id}`),
  create: (data) => api.post('/schools', data),
  update: (id, data) => api.put(`/schools/${id}`, data),
  remove: (id) => api.delete(`/schools/${id}`),
  getClasses: (id, status) => api.get(status ? `/schools/${id}/classes?status=${status}` : `/schools/${id}/classes`)
};
export const schoolsAPI = createCachedAPI(schoolsBaseAPI, 'schoolsAPI');

// Kindergarten Classes API
const kindergartenClassesBaseAPI = {
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
  addCustomSession: (id, data) => api.post(`/kindergarten-classes/${id}/sessions/custom`),
  deleteSession: (classId, sessionIndex) => api.delete(`/kindergarten-classes/${classId}/sessions/${sessionIndex}`)
};
export const kindergartenClassesAPI = createCachedAPI(kindergartenClassesBaseAPI, 'kindergartenClassesAPI');

// Holidays API
const holidaysBaseAPI = {
  getAll: () => api.get('/holidays'),
  getById: (id) => api.get(`/holidays/${id}`),
  create: (data) => api.post('/holidays', data),
  update: (id, data) => api.put(`/holidays/${id}`, data),
  remove: (id) => api.delete(`/holidays/${id}`),
  applyToAllClasses: () => api.post('/holidays/apply-all'),
  checkDateRange: (startDate, endDate) => api.post('/holidays/check-dates', { startDate, endDate })
};
export const holidaysAPI = createCachedAPI(holidaysBaseAPI, 'holidaysAPI');

// Health check API
export const healthAPI = {
  check: () => api.get('/health'),
  clearCache: () => {
    clearCache();
    return Promise.resolve({ success: true, message: 'Cache cleared' });
  }
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