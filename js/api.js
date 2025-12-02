// API Service Layer
class APIService {
    constructor() {
        this.baseURL = API_CONFIG.BASE_URL;
        this.timeout = API_CONFIG.TIMEOUT;
    }

    // Get authentication token
    getToken() {
        return localStorage.getItem(STORAGE_KEYS.TOKEN);
    }

    // Set authentication token
    setToken(token) {
        localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    }

    // Remove authentication token
    removeToken() {
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
    }

    // Get current user
    getUser() {
        const user = localStorage.getItem(STORAGE_KEYS.USER);
        return user ? JSON.parse(user) : null;
    }

    // Set current user
    setUser(user) {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    }

    // Check if user is authenticated
    isAuthenticated() {
        return !!this.getToken();
    }

    // Make HTTP request
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const token = this.getToken();

        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            ...options,
            headers,
        };

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);

            const response = await fetch(url, {
                ...config,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            const data = await response.json();

            if (!response.ok) {
                // Handle authentication errors
                if (response.status === 401) {
                    this.removeToken();
                    window.location.href = '/login.html';
                }
                throw new Error(data.message || 'Request failed');
            }

            return data;
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Request timeout');
            }
            throw error;
        }
    }

    // GET request
    async get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        return this.request(url, { method: 'GET' });
    }

    // POST request
    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    // PUT request
    async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    // DELETE request
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    // ==================== AUTH ENDPOINTS ====================
    async login(email, password) {
        const response = await this.post(API_ENDPOINTS.LOGIN, { email, password });
        if (response.success && response.data.token) {
            this.setToken(response.data.token);
            this.setUser(response.data.user);
        }
        return response;
    }

    async register(userData) {
        const response = await this.post(API_ENDPOINTS.REGISTER, userData);
        if (response.success && response.data.token) {
            this.setToken(response.data.token);
            this.setUser(response.data.user);
        }
        return response;
    }

    async logout() {
        await this.post(API_ENDPOINTS.LOGOUT);
        this.removeToken();
    }

    async getMe() {
        const response = await this.get(API_ENDPOINTS.GET_ME);
        if (response.success) {
            this.setUser(response.data);
        }
        return response;
    }

    async updatePassword(currentPassword, newPassword) {
        return this.put(API_ENDPOINTS.UPDATE_PASSWORD, {
            currentPassword,
            newPassword,
        });
    }

    // ==================== DASHBOARD ENDPOINTS ====================
    async getDashboardStats() {
        return this.get(API_ENDPOINTS.DASHBOARD_STATS);
    }

    async getDashboardTrends(months = 6) {
        return this.get(API_ENDPOINTS.DASHBOARD_TRENDS, { months });
    }

    // ==================== EMPLOYEE ENDPOINTS ====================
    async getEmployees(params = {}) {
        return this.get(API_ENDPOINTS.EMPLOYEES, params);
    }

    async getEmployee(id) {
        return this.get(API_ENDPOINTS.EMPLOYEE_DETAIL(id));
    }

    async createEmployee(employeeData) {
        return this.post(API_ENDPOINTS.EMPLOYEES, employeeData);
    }

    async updateEmployee(id, employeeData) {
        return this.put(API_ENDPOINTS.EMPLOYEE_DETAIL(id), employeeData);
    }

    async deleteEmployee(id) {
        return this.delete(API_ENDPOINTS.EMPLOYEE_DETAIL(id));
    }

    async getTopPerformers(limit = 5) {
        return this.get(API_ENDPOINTS.TOP_PERFORMERS, { limit });
    }

    async getEmployeeStatistics() {
        return this.get(API_ENDPOINTS.EMPLOYEE_STATS);
    }

    // ==================== DEPARTMENT ENDPOINTS ====================
    async getDepartments() {
        return this.get(API_ENDPOINTS.DEPARTMENTS);
    }

    async getDepartment(id) {
        return this.get(API_ENDPOINTS.DEPARTMENT_DETAIL(id));
    }

    async createDepartment(departmentData) {
        return this.post(API_ENDPOINTS.DEPARTMENTS, departmentData);
    }

    async updateDepartment(id, departmentData) {
        return this.put(API_ENDPOINTS.DEPARTMENT_DETAIL(id), departmentData);
    }

    async deleteDepartment(id) {
        return this.delete(API_ENDPOINTS.DEPARTMENT_DETAIL(id));
    }

    // ==================== LEAVE ENDPOINTS ====================
    async getLeaves(params = {}) {
        return this.get(API_ENDPOINTS.LEAVES, params);
    }

    async getLeave(id) {
        return this.get(API_ENDPOINTS.LEAVE_DETAIL(id));
    }

    async createLeave(leaveData) {
        return this.post(API_ENDPOINTS.LEAVES, leaveData);
    }

    async updateLeave(id, leaveData) {
        return this.put(API_ENDPOINTS.LEAVE_DETAIL(id), leaveData);
    }

    async updateLeaveStatus(id, status) {
        return this.put(API_ENDPOINTS.LEAVE_DETAIL(id), { status });
    }

    async deleteLeave(id) {
        return this.delete(API_ENDPOINTS.LEAVE_DETAIL(id));
    }

    async getLeaveStats(year) {
        return this.get(API_ENDPOINTS.LEAVE_STATS, { year });
    }

    // ==================== CONTRACT ENDPOINTS ====================
    async getContracts(params = {}) {
        return this.get(API_ENDPOINTS.CONTRACTS, params);
    }

    async getContract(id) {
        return this.get(API_ENDPOINTS.CONTRACT_DETAIL(id));
    }

    async createContract(contractData) {
        return this.post(API_ENDPOINTS.CONTRACTS, contractData);
    }

    async updateContract(id, contractData) {
        return this.put(API_ENDPOINTS.CONTRACT_DETAIL(id), contractData);
    }

    async deleteContract(id) {
        return this.delete(API_ENDPOINTS.CONTRACT_DETAIL(id));
    }

    async signContract(id) {
        return this.post(API_ENDPOINTS.CONTRACT_SIGN(id));
    }

    async getContractStats() {
        return this.get(API_ENDPOINTS.CONTRACT_STATS);
    }
}

// Create global API instance
const api = new APIService();

// Auth middleware for pages
function requireAuth() {
    if (!api.isAuthenticated()) {
        window.location.href = '/login.html';
        return false;
    }
    return true;
}

// Show loading spinner
function showLoading() {
    const loader = document.getElementById('loader');
    if (loader) loader.classList.remove('hidden');
}

// Hide loading spinner
function hideLoading() {
    const loader = document.getElementById('loader');
    if (loader) loader.classList.add('hidden');
}

// Show error message
function showError(message) {
    // You can customize this to use a toast/notification library
    alert(message);
}

// Show success message
function showSuccess(message) {
    // You can customize this to use a toast/notification library
    alert(message);
}
