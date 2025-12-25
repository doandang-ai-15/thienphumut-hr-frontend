// Settings Page JavaScript - Integrate with Real API

// Check authentication
if (!requireAuth()) {
    throw new Error('Not authenticated');
}

let currentUser = null;

// Pagination state for activity logs
let currentPage = 1;
let itemsPerPage = 10;
let totalItems = 0;
let filteredActivityLogs = [];

// Load user profile
async function loadUserProfile() {
    try {
        showLoading();

        const user = api.getUser();
        if (!user) {
            window.location.href = '/login.html';
            return;
        }

        // Get full user details from API
        const response = await api.getEmployee(user.id);

        if (response.success) {
            currentUser = response.data;
            populateProfileForm(currentUser);
        }

        hideLoading();
    } catch (error) {
        hideLoading();
        console.error('Failed to load profile:', error);
        showError('Failed to load profile data');
    }
}

// Populate profile form with user data
function populateProfileForm(user) {
    // Profile header
    const profileName = document.querySelector('#profileName');
    const profileRole = document.querySelector('#profileRole');
    const profileAvatarImg = document.getElementById('profileAvatarImg');

    if (profileName) profileName.textContent = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    if (profileRole) profileRole.textContent = user.job_title || 'Employee';

    // Avatar - show photo if exists, otherwise show initials
    if (profileAvatarImg) {
        if (user.photo) {
            const photoUrl = getPhotoUrl(user.photo);
            profileAvatarImg.innerHTML = `<img src="${photoUrl}" alt="Avatar" class="w-full h-full object-cover">`;
        } else {
            const initials = user.first_name && user.last_name
                ? `${user.first_name[0]}${user.last_name[0]}`
                : 'U';
            profileAvatarImg.textContent = initials;
        }
    }

    // Profile form fields
    const fields = {
        'first_name': user.first_name,
        'last_name': user.last_name,
        'email': user.email,
        'phone': user.phone,
        'date_of_birth': user.date_of_birth,
        'address': user.address,
        'city': user.city,
        'state': user.state,
        'zip_code': user.zip_code,
        'country': user.country
    };

    Object.keys(fields).forEach(key => {
        const input = document.querySelector(`#profileForm [name="${key}"]`);
        if (input && fields[key]) {
            input.value = fields[key];
        }
    });
}

// Handle profile update
async function handleProfileUpdate(event) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);

    const profileData = {
        first_name: formData.get('first_name'),
        last_name: formData.get('last_name'),
        phone: formData.get('phone'),
        date_of_birth: formData.get('date_of_birth') || null,
        address: formData.get('address'),
        city: formData.get('city'),
        state: formData.get('state'),
        zip_code: formData.get('zip_code'),
        country: formData.get('country')
    };

    try {
        showLoading();

        const response = await api.updateEmployee(currentUser.id, profileData);

        if (response.success) {
            hideLoading();
            showSuccess('Profile updated successfully!');

            // Update current user data
            currentUser = { ...currentUser, ...profileData };
            populateProfileForm(currentUser);
        }
    } catch (error) {
        hideLoading();
        console.error('Failed to update profile:', error);
        showError(error.message || 'Failed to update profile');
    }
}

// Handle password change
async function handlePasswordChange(event) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);

    const currentPassword = formData.get('current_password');
    const newPassword = formData.get('new_password');
    const confirmPassword = formData.get('confirm_password');

    // Validation
    if (newPassword !== confirmPassword) {
        showError('New passwords do not match');
        return;
    }

    if (newPassword.length < 6) {
        showError('Password must be at least 6 characters long');
        return;
    }

    try {
        showLoading();

        const response = await api.updatePassword(currentPassword, newPassword);

        if (response.success) {
            hideLoading();
            showSuccess('Password changed successfully!');
            form.reset();
        }
    } catch (error) {
        hideLoading();
        console.error('Failed to change password:', error);
        showError(error.message || 'Failed to change password');
    }
}

// Global variable to store all activity logs
let allActivityLogs = [];

// Show/Hide sections
function showSection(sectionName) {
    // Hide all sections
    const sections = ['profile', 'company', 'security', 'activity'];
    sections.forEach(section => {
        const el = document.getElementById(`section-${section}`);
        if (el) {
            el.style.display = 'none';
        }

        // Update nav active state
        const nav = document.getElementById(`nav-${section}`);
        if (nav) {
            if (section === sectionName) {
                nav.classList.add('active');
                nav.classList.remove('text-gray-600', 'hover:bg-gray-50');
            } else {
                nav.classList.remove('active');
                nav.classList.add('text-gray-600', 'hover:bg-gray-50');
            }
        }
    });

    // Show selected section
    const activeSection = document.getElementById(`section-${sectionName}`);
    if (activeSection) {
        activeSection.style.display = 'block';
    }

    // Load activity logs when activity section is shown
    if (sectionName === 'activity') {
        loadActivityLogs();
    }
}

// Load activity logs from API
async function loadActivityLogs() {
    console.log('📊 [ACTIVITY LOGS] Loading activity logs...');

    const loadingEl = document.getElementById('activityLoading');
    const listEl = document.getElementById('activityLogsList');
    const emptyEl = document.getElementById('activityEmpty');

    console.log('📊 [ACTIVITY LOGS] Elements found:', {
        loadingEl: !!loadingEl,
        listEl: !!listEl,
        emptyEl: !!emptyEl
    });

    try {
        // Show loading state
        loadingEl.classList.remove('hidden');
        listEl.classList.add('hidden');
        emptyEl.classList.add('hidden');

        console.log('📊 [ACTIVITY LOGS] Calling API...');

        // Fetch activity logs from API
        const response = await api.getActivityLogs();

        console.log('📊 [ACTIVITY LOGS] API Response:', response);
        console.log('📊 [ACTIVITY LOGS] Response data:', response.data);
        console.log('📊 [ACTIVITY LOGS] Data length:', response.data?.length);

        if (response.success && response.data) {
            allActivityLogs = response.data;

            console.log('✅ [ACTIVITY LOGS] Loaded', allActivityLogs.length, 'logs');

            // Hide loading
            loadingEl.classList.add('hidden');

            // Filter and display logs
            filterActivityLogs();
        } else {
            console.error('❌ [ACTIVITY LOGS] Response not successful:', response);
            throw new Error('Failed to load activity logs');
        }
    } catch (error) {
        console.error('❌ [ACTIVITY LOGS] Error loading logs:', error);
        console.error('❌ [ACTIVITY LOGS] Error stack:', error.stack);
        loadingEl.classList.add('hidden');
        emptyEl.classList.remove('hidden');
        listEl.classList.add('hidden');
    }
}

// Filter activity logs based on selected filter
function filterActivityLogs() {
    console.log('🔍 [FILTER] Filtering logs...');

    const filter = document.getElementById('activityFilter').value;
    const listEl = document.getElementById('activityLogsList');
    const emptyEl = document.getElementById('activityEmpty');
    const paginationEl = document.getElementById('activityPagination');

    console.log('🔍 [FILTER] Filter value:', filter);
    console.log('🔍 [FILTER] Total logs:', allActivityLogs.length);

    let filtered = allActivityLogs;

    // Apply filter
    if (filter !== 'all') {
        filtered = allActivityLogs.filter(log => {
            const action = log.action.toLowerCase();
            const desc = (log.description || '').toLowerCase();

            // Check both action and description for keywords
            switch(filter) {
                case 'login':
                    return action.includes('login') || desc.includes('logged in');
                case 'logout':
                    return action.includes('logout') || desc.includes('logged out');
                case 'create':
                    return action.includes('create') || action.includes('post') || desc.includes('created');
                case 'update':
                    return action.includes('update') || action.includes('put') || desc.includes('updated');
                case 'delete':
                    return action.includes('delete') || desc.includes('deleted') || desc.includes('removed');
                default:
                    return action.includes(filter);
            }
        });
        console.log('🔍 [FILTER] Filtered logs:', filtered.length);
    }

    // Store filtered results
    filteredActivityLogs = filtered;
    totalItems = filtered.length;

    // Reset to first page when filter changes
    currentPage = 1;

    // Display logs with pagination
    if (filteredActivityLogs.length === 0) {
        console.log('📭 [FILTER] No logs to display - showing empty state');
        listEl.classList.add('hidden');
        emptyEl.classList.remove('hidden');
        paginationEl.classList.add('hidden');
    } else {
        console.log('📋 [FILTER] Displaying', filteredActivityLogs.length, 'logs');
        listEl.classList.remove('hidden');
        emptyEl.classList.add('hidden');
        paginationEl.classList.remove('hidden');
        renderPaginatedLogs();
    }
}

// Render logs for current page
function renderPaginatedLogs() {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const logsToDisplay = filteredActivityLogs.slice(startIndex, endIndex);

    console.log('📄 [PAGINATION] Rendering page', currentPage, 'items:', startIndex, '-', endIndex);

    renderActivityLogs(logsToDisplay);
    updatePaginationControls();
}

// Update pagination controls
function updatePaginationControls() {
    const startIndex = (currentPage - 1) * itemsPerPage + 1;
    const endIndex = Math.min(currentPage * itemsPerPage, totalItems);
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    // Update info text
    document.getElementById('paginationInfo').textContent = `${startIndex}-${endIndex} của ${totalItems}`;

    // Update button states
    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = currentPage >= totalPages;

    console.log('🔢 [PAGINATION] Page', currentPage, 'of', totalPages);
}

// Change items per page
function changeItemsPerPage() {
    itemsPerPage = parseInt(document.getElementById('itemsPerPage').value);
    currentPage = 1; // Reset to first page
    renderPaginatedLogs();
}

// Go to next page
function nextPage() {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        renderPaginatedLogs();
    }
}

// Go to previous page
function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        renderPaginatedLogs();
    }
}

// Translate activity log action to Vietnamese
function translateAction(action) {
    const translations = {
        'LOGIN': 'Đăng nhập',
        'LOGOUT': 'Đăng xuất',
        'CREATE_EMPLOYEE': 'Tạo nhân viên mới',
        'UPDATE_EMPLOYEE': 'Cập nhật thông tin nhân viên',
        'DELETE_EMPLOYEE': 'Xóa nhân viên',
        'ADD_EMPLOYEE_TO_DEPARTMENT': 'Thêm nhân viên vào phòng ban',
        'REMOVE_EMPLOYEE_FROM_DEPARTMENT': 'Xóa nhân viên khỏi phòng ban',
        'CREATE_DEPARTMENT': 'Tạo phòng ban mới',
        'UPDATE_DEPARTMENT': 'Cập nhật phòng ban',
        'DELETE_DEPARTMENT': 'Xóa phòng ban',
        'CREATE_LEAVE': 'Tạo đơn nghỉ phép',
        'UPDATE_LEAVE': 'Cập nhật đơn nghỉ phép',
        'DELETE_LEAVE': 'Xóa đơn nghỉ phép',
        'APPROVE_LEAVE': 'Duyệt đơn nghỉ phép',
        'REJECT_LEAVE': 'Từ chối đơn nghỉ phép',
        'CREATE_CONTRACT': 'Tạo hợp đồng mới',
        'UPDATE_CONTRACT': 'Cập nhật hợp đồng',
        'DELETE_CONTRACT': 'Xóa hợp đồng'
    };

    // Check direct mapping first
    if (translations[action]) {
        return translations[action];
    }

    // Handle HTTP method actions (POST /api/..., PUT /api/..., DELETE /api/...)
    if (action.startsWith('POST ')) {
        return 'Tạo mới dữ liệu';
    } else if (action.startsWith('PUT ')) {
        return 'Cập nhật dữ liệu';
    } else if (action.startsWith('DELETE ')) {
        return 'Xóa dữ liệu';
    } else if (action.startsWith('GET ')) {
        return 'Truy xuất dữ liệu';
    }

    // Return original if no translation found
    return action;
}

// Translate activity log description to Vietnamese
function translateDescription(description) {
    if (!description) return 'Không có mô tả';

    // Replace common English terms with Vietnamese
    let translated = description
        .replace(/logged in/gi, 'đã đăng nhập')
        .replace(/logged out/gi, 'đã đăng xuất')
        .replace(/Created new employee:/gi, 'Đã tạo nhân viên mới:')
        .replace(/Updated employee:/gi, 'Đã cập nhật nhân viên:')
        .replace(/Deleted employee:/gi, 'Đã xóa nhân viên:')
        .replace(/Added (.*) to department:/gi, 'Đã thêm $1 vào phòng ban:')
        .replace(/Removed (.*) from department:/gi, 'Đã xóa $1 khỏi phòng ban:')
        .replace(/Created new department:/gi, 'Đã tạo phòng ban mới:')
        .replace(/Updated department:/gi, 'Đã cập nhật phòng ban:')
        .replace(/Deleted department:/gi, 'Đã xóa phòng ban:')
        .replace(/performed/gi, 'đã thực hiện');

    // Replace HTTP method + URL paths with user-friendly Vietnamese (e.g., PUT /api/employees/17 -> mã nhân viên: 17)
    translated = translated
        .replace(/POST \/api\/employees\/(\d+)/gi, 'mã nhân viên: $1')
        .replace(/PUT \/api\/employees\/(\d+)/gi, 'mã nhân viên: $1')
        .replace(/DELETE \/api\/employees\/(\d+)/gi, 'mã nhân viên: $1')
        .replace(/GET \/api\/employees\/(\d+)/gi, 'mã nhân viên: $1')
        .replace(/POST \/api\/departments\/(\d+)/gi, 'mã phòng ban: $1')
        .replace(/PUT \/api\/departments\/(\d+)/gi, 'mã phòng ban: $1')
        .replace(/DELETE \/api\/departments\/(\d+)/gi, 'mã phòng ban: $1')
        .replace(/GET \/api\/departments\/(\d+)/gi, 'mã phòng ban: $1')
        .replace(/POST \/api\/leave-applications\/(\d+)/gi, 'mã đơn nghỉ phép: $1')
        .replace(/PUT \/api\/leave-applications\/(\d+)/gi, 'mã đơn nghỉ phép: $1')
        .replace(/DELETE \/api\/leave-applications\/(\d+)/gi, 'mã đơn nghỉ phép: $1')
        .replace(/POST \/api\/contracts\/(\d+)/gi, 'mã hợp đồng: $1')
        .replace(/PUT \/api\/contracts\/(\d+)/gi, 'mã hợp đồng: $1')
        .replace(/DELETE \/api\/contracts\/(\d+)/gi, 'mã hợp đồng: $1');

    // Replace "ID: [number]" with more user-friendly Vietnamese
    translated = translated.replace(/\bID:\s*(\d+)/gi, 'Số thứ tự tài khoản đang thao tác: $1');

    return translated;
}

// Render activity logs in UI
function renderActivityLogs(logs) {
    console.log('🎨 [RENDER] Rendering', logs.length, 'logs');

    const listEl = document.getElementById('activityLogsList');

    if (!listEl) {
        console.error('❌ [RENDER] List element not found!');
        return;
    }

    console.log('🎨 [RENDER] First log:', logs[0]);

    listEl.innerHTML = logs.map((log, index) => {
        console.log(`🎨 [RENDER] Processing log ${index + 1}:`, log);
        const date = new Date(log.created_at);
        const formattedDate = date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        // Translate action and description
        const translatedAction = translateAction(log.action);
        const translatedDescription = translateDescription(log.description);

        // Determine icon and color based on action
        let icon = 'activity';
        let iconColor = 'text-gray-500';
        let bgColor = 'from-gray-100 to-gray-50';

        if (log.action.toLowerCase().includes('login')) {
            icon = 'log-in';
            iconColor = 'text-green-500';
            bgColor = 'from-green-100 to-green-50';
        } else if (log.action.toLowerCase().includes('logout')) {
            icon = 'log-out';
            iconColor = 'text-orange-500';
            bgColor = 'from-orange-100 to-orange-50';
        } else if (log.action.toLowerCase().includes('create') || log.action.toLowerCase().includes('post')) {
            icon = 'plus-circle';
            iconColor = 'text-blue-500';
            bgColor = 'from-blue-100 to-blue-50';
        } else if (log.action.toLowerCase().includes('update') || log.action.toLowerCase().includes('put')) {
            icon = 'edit';
            iconColor = 'text-[#AEDEFC]';
            bgColor = 'from-[#AEDEFC]/20 to-[#AEDEFC]/10';
        } else if (log.action.toLowerCase().includes('delete')) {
            icon = 'trash-2';
            iconColor = 'text-red-500';
            bgColor = 'from-red-100 to-red-50';
        }

        return `
            <div class="flex items-start gap-4 p-4 rounded-xl border border-gray-100 hover:shadow-md transition-all bg-white">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-br ${bgColor} flex items-center justify-center flex-shrink-0">
                    <i data-lucide="${icon}" class="w-5 h-5 ${iconColor}"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-800">${translatedAction}</p>
                    <p class="text-xs text-gray-500 mt-1">${translatedDescription}</p>
                    <div class="flex items-center gap-2 mt-2">
                        <span class="text-xs text-gray-400">${formattedDate}</span>
                        ${log.employee_id ? `<span class="text-xs text-gray-300">•</span><span class="text-xs text-gray-400">ID: ${log.employee_id}</span>` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // Re-render lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Language and date format are now static (Vietnamese and DD/MM/YYYY)
// No change functionality needed

// Toggle password visibility
function togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    const button = input.nextElementSibling;
    const icon = button.querySelector('i');

    if (input.type === 'password') {
        input.type = 'text';
        icon.setAttribute('data-lucide', 'eye-off');
    } else {
        input.type = 'password';
        icon.setAttribute('data-lucide', 'eye');
    }

    // Re-render lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Handle avatar upload
async function handleAvatarUpload(file) {
    if (!file) return;

    try {
        showLoading();

        // Upload photo to server
        const uploadResult = await uploadPhotoFile(file);
        const photoPath = uploadResult.path;

        // Update avatar in database
        const response = await api.updateEmployee(currentUser.id, {
            photo: photoPath
        });

        if (response.success) {
            // Update UI
            const photoUrl = getPhotoUrl(photoPath);
            const avatarImg = document.getElementById('profileAvatarImg');
            avatarImg.innerHTML = `<img src="${photoUrl}" alt="Avatar" class="w-full h-full object-cover">`;

            currentUser.photo = photoPath;
            hideLoading();
            showSuccess('Avatar updated successfully!');
        }
    } catch (error) {
        hideLoading();
        console.error('Failed to upload avatar:', error);
        showError(error.message || 'Failed to upload avatar');
    }
}

// Remove avatar
async function removeAvatar() {
    try {
        showLoading();

        const response = await api.updateEmployee(currentUser.id, {
            photo: null
        });

        if (response.success) {
            // Reset to initials
            const avatarImg = document.getElementById('profileAvatarImg');
            const initials = currentUser.first_name && currentUser.last_name
                ? `${currentUser.first_name[0]}${currentUser.last_name[0]}`
                : 'U';
            avatarImg.innerHTML = initials;

            currentUser.photo = null;
            hideLoading();
            showSuccess('Avatar removed successfully!');
        }
    } catch (error) {
        hideLoading();
        console.error('Failed to remove avatar:', error);
        showError(error.message || 'Failed to remove avatar');
    }
}

// Save company information
async function saveCompanyInfo() {
    const companyData = {
        industry: document.getElementById('companyIndustry')?.value,
        company_size: document.getElementById('companySize')?.value,
        website: document.getElementById('companyWebsite')?.value,
        address: document.getElementById('companyAddress')?.value
    };

    try {
        showLoading();

        // TODO: Create API endpoint for company settings
        // For now, just save to localStorage
        localStorage.setItem('companyInfo', JSON.stringify(companyData));

        hideLoading();
        showSuccess('Company information saved successfully!');
    } catch (error) {
        hideLoading();
        console.error('Failed to save company info:', error);
        showError(error.message || 'Failed to save company information');
    }
}

// Initialize settings page
document.addEventListener('DOMContentLoaded', function() {
    loadUserProfile();
    lucide.createIcons();

    // Setup profile form handler
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileUpdate);
    }

    // Setup password form handler
    const passwordForm = document.getElementById('passwordForm');
    if (passwordForm) {
        passwordForm.addEventListener('submit', handlePasswordChange);
    }

    // Show profile section by default
    showSection('profile');

    // Language and date format are now static - no event listeners needed

    // Setup avatar upload handler
    const avatarUpload = document.getElementById('avatarUpload');
    if (avatarUpload) {
        avatarUpload.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                handleAvatarUpload(file);
            }
        });
    }

    // Setup save company button
    const saveCompanyBtn = document.getElementById('saveCompanyBtn');
    if (saveCompanyBtn) {
        saveCompanyBtn.addEventListener('click', saveCompanyInfo);
    }

    // Load company info from localStorage
    const savedCompanyInfo = localStorage.getItem('companyInfo');
    if (savedCompanyInfo) {
        try {
            const companyData = JSON.parse(savedCompanyInfo);
            if (companyData.industry) document.getElementById('companyIndustry').value = companyData.industry;
            if (companyData.company_size) document.getElementById('companySize').value = companyData.company_size;
            if (companyData.website) document.getElementById('companyWebsite').value = companyData.website;
            if (companyData.address) document.getElementById('companyAddress').value = companyData.address;
        } catch (e) {
            console.error('Failed to load company info:', e);
        }
    }

});
