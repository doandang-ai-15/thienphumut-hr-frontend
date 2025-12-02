// Mapping between Vietnamese (database) and English (UI)

const statusMapping = {
    // Leave Application Status
    leave: {
        'chờ xét duyệt': 'pending',
        'duyệt': 'approved',
        'không duyệt': 'rejected',
        'pending': 'chờ xét duyệt',
        'approved': 'duyệt',
        'rejected': 'không duyệt'
    },

    // Leave Types
    leaveTypes: {
        'Du lịch': 'vacation',
        'Bệnh': 'sick',
        'Lý do cá nhân': 'personal',
        'Nghỉ không lương': 'unpaid',
        'Thai sản': 'maternity',
        'Nghĩa vụ quân sự': 'military',
        'Khác': 'other',
        'vacation': 'Du lịch',
        'sick': 'Bệnh',
        'personal': 'Lý do cá nhân',
        'unpaid': 'Nghỉ không lương',
        'maternity': 'Thai sản',
        'military': 'Nghĩa vụ quân sự',
        'other': 'Khác'
    },

    // Contract Status
    contract: {
        'còn thời hạn': 'active',
        'hết hạn': 'expired',
        'chấm dứt': 'terminated',
        'dự thảo hợp đồng': 'draft',
        'active': 'còn thời hạn',
        'expired': 'hết hạn',
        'terminated': 'chấm dứt',
        'draft': 'dự thảo hợp đồng'
    },

    // Contract Types
    contractTypes: {
        'vĩnh viễn': 'permanent',
        'có thời hạn': 'fixed-term',
        'freelance': 'freelance',
        'thực tập sinh': 'internship',
        'permanent': 'vĩnh viễn',
        'fixed-term': 'có thời hạn',
        'internship': 'thực tập sinh'
    }
};

// Convert from Vietnamese (DB) to English (UI display)
function dbToUI(category, value) {
    if (!value) return value;
    return statusMapping[category]?.[value] || value;
}

// Convert from English (UI) to Vietnamese (DB)
function uiToDB(category, value) {
    if (!value) return value;
    return statusMapping[category]?.[value] || value;
}

// Get display name for leave type
function getLeaveTypeDisplay(dbValue) {
    // If already in English, return as is
    if (['vacation', 'sick', 'personal', 'unpaid', 'maternity', 'military', 'other'].includes(dbValue)) {
        return dbValue;
    }
    // Return Vietnamese value as is for display
    return dbValue;
}

// Get display name for contract type
function getContractTypeDisplay(dbValue) {
    // If already in English, return formatted
    const typeDisplay = {
        'permanent': 'Permanent',
        'fixed-term': 'Fixed-Term',
        'freelance': 'Freelance',
        'internship': 'Internship',
        'vĩnh viễn': 'Permanent',
        'có thời hạn': 'Fixed-Term',
        'thực tập sinh': 'Internship'
    };
    return typeDisplay[dbValue] || dbValue;
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { statusMapping, dbToUI, uiToDB, getLeaveTypeDisplay, getContractTypeDisplay };
}
