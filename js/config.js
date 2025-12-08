// API Configuration
const API_CONFIG = {
    // Tự động phát hiện môi trường
    BASE_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:5000/api'  // Development
        : 'http://thienphumut-hr-backend.vercel.app/api',  // Production - Backend Vercel URL
    TIMEOUT: 30000,
};

// API Endpoints
const API_ENDPOINTS = {
    // Auth
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    GET_ME: '/auth/me',
    UPDATE_PASSWORD: '/auth/updatepassword',

    // Dashboard
    DASHBOARD_STATS: '/dashboard/stats',
    DASHBOARD_TRENDS: '/dashboard/trends',

    // Employees
    EMPLOYEES: '/employees',
    EMPLOYEE_DETAIL: (id) => `/employees/${id}`,
    TOP_PERFORMERS: '/employees/top/performers',
    EMPLOYEE_STATS: '/employees/statistics',

    // Departments
    DEPARTMENTS: '/departments',
    DEPARTMENT_DETAIL: (id) => `/departments/${id}`,

    // Leaves
    LEAVES: '/leaves',
    LEAVE_DETAIL: (id) => `/leaves/${id}`,
    LEAVE_STATS: '/leaves/stats/summary',

    // Contracts
    CONTRACTS: '/contracts',
    CONTRACT_DETAIL: (id) => `/contracts/${id}`,
    CONTRACT_SIGN: (id) => `/contracts/${id}/sign`,
    CONTRACT_STATS: '/contracts/stats/summary',
};

// Local Storage Keys
const STORAGE_KEYS = {
    TOKEN: 'peoplehub_token',
    USER: 'peoplehub_user',
};
