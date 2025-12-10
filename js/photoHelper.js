// Photo Helper Functions
// Centralized logic for handling photo URLs across the application

/**
 * Get full photo URL from path
 * @param {string} photoPath - Relative path from database (e.g., 'assets/photos/employee-123.jpg')
 * @returns {string} - Full URL to photo
 */
function getPhotoUrl(photoPath) {
    if (!photoPath) return null;

    // If already a full URL (http/https), return as is
    if (photoPath.startsWith('http://') || photoPath.startsWith('https://')) {
        return photoPath;
    }

    // If it's a data URL (base64), return as is (for backward compatibility)
    if (photoPath.startsWith('data:image/')) {
        return photoPath;
    }

    // Build full URL from relative path
    const baseUrl = API_CONFIG.BASE_URL.replace('/api', ''); // Remove /api suffix
    return `${baseUrl}/${photoPath}`;
}

/**
 * Upload photo file to server
 * @param {File} file - File object from input
 * @returns {Promise<object>} - Response with photo path
 */
async function uploadPhotoFile(file) {
    // Validate file
    if (!file) {
        throw new Error('No file provided');
    }

    if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file');
    }

    if (file.size > 5 * 1024 * 1024) {
        throw new Error('Image size should be less than 5MB');
    }

    // Create FormData
    const formData = new FormData();
    formData.append('photo', file);

    // Upload to server
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.UPLOAD_PHOTO}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem(STORAGE_KEYS.TOKEN)}`
        },
        body: formData
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to upload photo');
    }

    return data.data; // Returns { filename, path, url }
}

/**
 * Delete photo file from server
 * @param {string} filename - Filename to delete
 * @returns {Promise<object>} - Response
 */
async function deletePhotoFile(filename) {
    if (!filename) {
        throw new Error('Filename is required');
    }

    const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.DELETE_PHOTO(filename)}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem(STORAGE_KEYS.TOKEN)}`
        }
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Failed to delete photo');
    }

    return data;
}

/**
 * Generate avatar HTML with photo or initials
 * @param {object} options - { photo, firstName, lastName, size }
 * @returns {string} - HTML string
 */
function generateAvatarHtml(options) {
    const { photo, firstName, lastName, size = 'w-20 h-20' } = options;
    const initials = `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();

    if (photo) {
        const photoUrl = getPhotoUrl(photo);
        return `<img src="${photoUrl}"
                     alt="${firstName} ${lastName}"
                     class="w-full h-full object-cover"
                     onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\\'w-full h-full rounded-full bg-[#FDEDED] flex items-center justify-center text-2xl font-semibold text-[#F875AA]\\'>${initials}</div>';">`;
    } else {
        return `<div class="w-full h-full rounded-full bg-[#FDEDED] flex items-center justify-center text-2xl font-semibold text-[#F875AA]">${initials}</div>`;
    }
}
