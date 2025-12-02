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
            profileAvatarImg.innerHTML = `<img src="${user.photo}" alt="Avatar" class="w-full h-full object-cover">`;
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

// Show/Hide sections
function showSection(sectionName) {
    // Hide all sections
    const sections = ['profile', 'company', 'security'];
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

    // Validate file type
    if (!file.type.startsWith('image/')) {
        showError('Please select an image file');
        return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showError('Image size should be less than 5MB');
        return;
    }

    try {
        showLoading();

        // Convert to base64
        const reader = new FileReader();
        reader.onload = async function(e) {
            const base64Image = e.target.result;

            // Update avatar in database
            const response = await api.updateEmployee(currentUser.id, {
                photo: base64Image
            });

            if (response.success) {
                // Update UI
                const avatarImg = document.getElementById('profileAvatarImg');
                avatarImg.innerHTML = `<img src="${base64Image}" alt="Avatar" class="w-full h-full object-cover">`;

                currentUser.photo = base64Image;
                hideLoading();
                showSuccess('Avatar updated successfully!');
            }
        };
        reader.readAsDataURL(file);
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
