// Settings Page JavaScript - Integrate with Real API

// Check authentication
if (!requireAuth()) {
    throw new Error('Not authenticated');
}

let currentUser = null;

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
    const sections = ['profile', 'company', 'security', 'gmail', 'activity'];
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

    console.log('🔍 [FILTER] Filter value:', filter);
    console.log('🔍 [FILTER] Total logs:', allActivityLogs.length);

    let filteredLogs = allActivityLogs;

    // Apply filter
    if (filter !== 'all') {
        filteredLogs = allActivityLogs.filter(log => log.action.toLowerCase().includes(filter.toLowerCase()));
        console.log('🔍 [FILTER] Filtered logs:', filteredLogs.length);
    }

    // Display logs
    if (filteredLogs.length === 0) {
        console.log('📭 [FILTER] No logs to display - showing empty state');
        listEl.classList.add('hidden');
        emptyEl.classList.remove('hidden');
    } else {
        console.log('📋 [FILTER] Displaying', filteredLogs.length, 'logs');
        listEl.classList.remove('hidden');
        emptyEl.classList.add('hidden');
        renderActivityLogs(filteredLogs);
    }
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
        } else if (log.action.toLowerCase().includes('create')) {
            icon = 'plus-circle';
            iconColor = 'text-blue-500';
            bgColor = 'from-blue-100 to-blue-50';
        } else if (log.action.toLowerCase().includes('update')) {
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
                    <p class="text-sm font-medium text-gray-800">${log.action}</p>
                    <p class="text-xs text-gray-500 mt-1">${log.description || 'Không có mô tả'}</p>
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

// Handle Gmail configuration save
async function handleGmailConfigSave(event) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);

    const gmailConfig = {
        senderEmail: formData.get('sender_email'),
        smtpServer: formData.get('smtp_server'),
        smtpPort: formData.get('smtp_port'),
        appPassword: formData.get('app_password')
    };

    try {
        showLoading();

        // Save to localStorage
        localStorage.setItem('gmailConfig', JSON.stringify(gmailConfig));

        // Set global start_email variable
        window.start_email = gmailConfig.senderEmail;

        hideLoading();
        showSuccess('Cấu hình Gmail đã được lưu thành công!');
    } catch (error) {
        hideLoading();
        console.error('Failed to save Gmail config:', error);
        showError(error.message || 'Không thể lưu cấu hình Gmail');
    }
}

// Load Gmail configuration
function loadGmailConfig() {
    const savedConfig = localStorage.getItem('gmailConfig');
    if (savedConfig) {
        try {
            const config = JSON.parse(savedConfig);

            // Populate form fields
            if (config.senderEmail) document.getElementById('senderEmail').value = config.senderEmail;
            if (config.smtpServer) document.getElementById('smtpServer').value = config.smtpServer;
            if (config.smtpPort) document.getElementById('smtpPort').value = config.smtpPort;
            if (config.appPassword) document.getElementById('appPassword').value = config.appPassword;

            // Set global start_email variable
            window.start_email = config.senderEmail;
        } catch (e) {
            console.error('Failed to load Gmail config:', e);
        }
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

    // Setup Gmail configuration form handler
    const gmailConfigForm = document.getElementById('gmailConfigForm');
    if (gmailConfigForm) {
        gmailConfigForm.addEventListener('submit', handleGmailConfigSave);
    }

    // Load Gmail configuration
    loadGmailConfig();
});
