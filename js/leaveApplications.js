// Leave Applications Page JavaScript - Integrate with Real API

// Check authentication
if (!requireAuth()) {
    throw new Error('Not authenticated');
}

let currentLeaves = [];
let currentFilter = 'all'; // all, pending, approved, rejected
let currentStats = {
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0
};

// Load leave applications
async function loadLeaves(status = null) {
    try {
        showLoading();

        const filters = status ? { status } : {};
        const response = await api.getLeaves(filters);

        if (response.success) {
            currentLeaves = response.data;
            calculateStats(currentLeaves);
            renderLeaves(currentLeaves);
        }

        hideLoading();
    } catch (error) {
        hideLoading();
        console.error('Failed to load leaves:', error);
        showError('Failed to load leave applications. Please refresh the page.');
    }
}

// Calculate statistics
function calculateStats(leaves) {
    const pending = leaves.filter(l => l.status === 'chờ xét duyệt').length;
    const approved = leaves.filter(l => l.status === 'duyệt').length;
    const rejected = leaves.filter(l => l.status === 'không duyệt').length;
    const total = leaves.length;

    currentStats = { pending, approved, rejected, total };
    renderStats();
}

// Render statistics
function renderStats() {
    const pendingEl = document.querySelector('[data-stat="pending"]');
    if (pendingEl) pendingEl.textContent = currentStats.pending;

    const approvedEl = document.querySelector('[data-stat="approved"]');
    if (approvedEl) approvedEl.textContent = currentStats.approved;

    const rejectedEl = document.querySelector('[data-stat="rejected"]');
    if (rejectedEl) rejectedEl.textContent = currentStats.rejected;

    const totalEl = document.querySelector('[data-stat="total"]');
    if (totalEl) totalEl.textContent = currentStats.total;
}

// Render leave applications
function renderLeaves(leaves) {
    const container = document.querySelector('#leavesTableBody');
    if (!container) return;

    if (leaves.length === 0) {
        container.innerHTML = `
            <div class="col-span-12 text-center py-12">
                <div class="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <i data-lucide="calendar-x" class="w-10 h-10 text-gray-400"></i>
                </div>
                <p class="text-gray-500">No leave applications found</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    container.innerHTML = leaves.map(leave => {
        const statusColors = {
            pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500' },
            approved: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
            rejected: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' }
        };

        const color = statusColors[leave.status] || statusColors.pending;

        // Format dates
        const startDate = new Date(leave.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const endDate = new Date(leave.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

        // Use days from backend (already calculated)
        const days = leave.days || 1;

        // Employee info - Backend returns first_name, last_name (not employee_first_name)
        const employeeName = `${leave.first_name || ''} ${leave.last_name || ''}`.trim() || 'Unknown';
        const employeeInitials = leave.first_name && leave.last_name
            ? `${leave.first_name[0]}${leave.last_name[0]}`
            : '??';

        // Build avatar - use photo if exists, otherwise show initials
        let avatarHTML;
        if (leave.employee_photo) {
            avatarHTML = `<img src="${leave.employee_photo}" alt="${employeeName}" class="w-full h-full object-cover" onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\\'w-full h-full flex items-center justify-center text-white text-sm font-semibold\\'>${employeeInitials}</div>';">`;
        } else {
            avatarHTML = `<div class="w-full h-full flex items-center justify-center text-white text-sm font-semibold">${employeeInitials}</div>`;
        }

        return `
            <div class="grid grid-cols-12 gap-4 px-6 py-4 border-b border-gray-50 hover:bg-[#FDEDED]/30 transition-colors items-center">
                <!-- Employee -->
                <div class="col-span-3 flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-gradient-to-br from-[#F875AA] to-[#AEDEFC] overflow-hidden">
                        ${avatarHTML}
                    </div>
                    <div>
                        <p class="font-medium text-gray-800 text-sm">${employeeName}</p>
                        <p class="text-xs text-gray-500">${leave.job_title || 'N/A'}</p>
                    </div>
                </div>

                <!-- Type -->
                <div class="col-span-2">
                    <p class="text-sm text-gray-800 capitalize">${leave.leave_type || 'N/A'}</p>
                </div>

                <!-- Duration -->
                <div class="col-span-2">
                    <p class="text-sm text-gray-800">${startDate} - ${endDate}</p>
                    <p class="text-xs text-gray-500">${days} day${days > 1 ? 's' : ''}</p>
                </div>

                <!-- Reason -->
                <div class="col-span-2">
                    <p class="text-sm text-gray-600 truncate">${leave.reason || 'No reason provided'}</p>
                </div>

                <!-- Status -->
                <div class="col-span-2">
                    <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full ${color.bg} ${color.text} text-xs font-medium">
                        <div class="w-1.5 h-1.5 rounded-full ${color.dot}"></div>
                        ${leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                    </span>
                </div>

                <!-- Actions -->
                <div class="col-span-1 flex items-center justify-end gap-2">
                    <button onclick="viewLeaveDetail(${leave.id})" class="p-2 hover:bg-white rounded-lg transition-colors" title="View Details">
                        <i data-lucide="eye" class="w-4 h-4 text-gray-600"></i>
                    </button>
                    ${leave.status === 'chờ xét duyệt' && (window.userRole === 'admin' || window.userRole === 'manager') ? `
                        <button onclick="approveLeave(${leave.id})" class="p-2 hover:bg-green-50 rounded-lg transition-colors" title="Approve">
                            <i data-lucide="check" class="w-4 h-4 text-green-600"></i>
                        </button>
                        <button onclick="rejectLeave(${leave.id})" class="p-2 hover:bg-red-50 rounded-lg transition-colors" title="Reject">
                            <i data-lucide="x" class="w-4 h-4 text-red-600"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');

    lucide.createIcons();
}

// Set tab filter
function setTab(status) {
    // Update button styles
    const tabs = ['all', 'pending', 'approved', 'rejected'];
    tabs.forEach(tab => {
        const btn = document.getElementById(`tab-${tab}`);
        if (btn) {
            if (tab === status) {
                btn.classList.add('tab-active');
            } else {
                btn.classList.remove('tab-active');
            }
        }
    });

    // Update current filter and apply all filters
    currentFilter = status;
    applyFilters();
}

// View leave detail
async function viewLeaveDetail(id) {
    try {
        const response = await api.getLeave(id);
        if (response.success) {
            showLeaveDetailModal(response.data);
        }
    } catch (error) {
        console.error('Failed to load leave details:', error);
        showError('Failed to load leave details');
    }
}

// Show leave detail modal
function showLeaveDetailModal(leave) {
    const modal = document.createElement('div');
    modal.id = 'leaveDetailModal';
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4';

    const statusColors = {
        pending: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
        approved: { bg: 'bg-green-100', text: 'text-green-700' },
        rejected: { bg: 'bg-red-100', text: 'text-red-700' }
    };
    const color = statusColors[leave.status] || statusColors.pending;

    const startDate = new Date(leave.start_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const endDate = new Date(leave.end_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const days = leave.days || 1;

    // Backend returns first_name, last_name (not employee_first_name)
    const employeeName = `${leave.first_name || ''} ${leave.last_name || ''}`.trim() || 'Unknown';
    const employeeInitials = leave.first_name && leave.last_name
        ? `${leave.first_name[0]}${leave.last_name[0]}`
        : '??';

    modal.innerHTML = `
        <div class="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onclick="closeLeaveDetailModal()"></div>
        <div class="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div class="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-[#FDEDED]/50 to-[#EDFFF0]/50">
                <div class="flex items-center justify-between">
                    <div>
                        <h2 class="text-2xl font-semibold text-gray-800">Chi tiết đơn nghỉ phép</h2>
                        <p class="text-sm text-gray-500 mt-1 capitalize">${leave.leave_type || 'Leave'} Request</p>
                    </div>
                    <button onclick="closeLeaveDetailModal()" class="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
                        <i data-lucide="x" class="w-5 h-5 text-gray-500"></i>
                    </button>
                </div>
            </div>

            <div class="px-8 py-6 space-y-6">
                <!-- Employee Info -->
                <div>
                    <p class="text-sm text-gray-500 mb-2">Thông tin nhân viên</p>
                    <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <div class="w-12 h-12 rounded-full bg-gradient-to-br from-[#F875AA] to-[#AEDEFC] overflow-hidden">
                            ${leave.employee_photo
                                ? `<img src="${leave.employee_photo}" alt="${employeeName}" class="w-full h-full object-cover" onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\\'w-full h-full flex items-center justify-center text-white font-semibold\\'>${employeeInitials}</div>';">`
                                : `<div class="w-full h-full flex items-center justify-center text-white font-semibold">${employeeInitials}</div>`
                            }
                        </div>
                        <div>
                            <p class="font-medium text-gray-800">${employeeName}</p>
                            <p class="text-sm text-gray-500">${leave.job_title || leave.employee_code || 'N/A'}</p>
                        </div>
                    </div>
                </div>

                <!-- Leave Details -->
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <p class="text-sm text-gray-500 mb-1">Loại nghỉ phép</p>
                        <p class="font-medium text-gray-800 capitalize">${leave.leave_type || 'N/A'}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-500 mb-1">Tình trạng</p>
                        <span class="inline-block px-3 py-1 rounded-full ${color.bg} ${color.text} text-sm font-medium capitalize">
                            ${leave.status}
                        </span>
                    </div>
                    <div>
                        <p class="text-sm text-gray-500 mb-1">Từ ngày</p>
                        <p class="font-medium text-gray-800">${startDate}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-500 mb-1">Đến ngày</p>
                        <p class="font-medium text-gray-800">${endDate}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-500 mb-1">Trong vòng</p>
                        <p class="font-medium text-gray-800">${days} day${days > 1 ? 's' : ''}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-500 mb-1">Có hiệu lực từ</p>
                        <p class="font-medium text-gray-800">${new Date(leave.created_at).toLocaleDateString()}</p>
                    </div>
                </div>

                <!-- Reason -->
                <div>
                    <p class="text-sm text-gray-500 mb-2">Lý do</p>
                    <p class="text-gray-800 p-3 bg-gray-50 rounded-xl">${leave.reason || 'No reason provided'}</p>
                </div>

                ${leave.approver_first_name ? `
                    <div>
                        <p class="text-sm text-gray-500 mb-2">${leave.status === 'duyệt' ? 'Approved' : 'Reviewed'} By</p>
                        <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-[#F875AA] to-[#AEDEFC] overflow-hidden">
                                ${leave.approver_photo
                                    ? `<img src="${leave.approver_photo}" alt="${leave.approver_first_name} ${leave.approver_last_name}" class="w-full h-full object-cover" onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\\'w-full h-full flex items-center justify-center text-white text-sm font-semibold\\'>${leave.approver_first_name[0]}${leave.approver_last_name[0]}</div>';">`
                                    : `<div class="w-full h-full flex items-center justify-center text-white text-sm font-semibold">${leave.approver_first_name[0]}${leave.approver_last_name[0]}</div>`
                                }
                            </div>
                            <div>
                                <p class="font-medium text-gray-800">${leave.approver_first_name} ${leave.approver_last_name}</p>
                                <p class="text-sm text-gray-500">${leave.status === 'duyệt' ? 'Approver' : 'Reviewer'}</p>
                            </div>
                        </div>
                    </div>
                ` : ''}
            </div>

            <div class="px-8 py-5 border-t border-gray-100 bg-gray-50 flex gap-3">
                ${leave.status === 'chờ xét duyệt' && (window.userRole === 'admin' || window.userRole === 'manager') ? `
                    <button onclick="approveLeaveFromModal(${leave.id})" class="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-all">
                        Duyệt
                    </button>
                    <button onclick="rejectLeaveFromModal(${leave.id})" class="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-all">
                        Không duyệt
                    </button>
                ` : `
                    <button onclick="closeLeaveDetailModal()" class="flex-1 py-3 bg-gradient-to-r from-[#F875AA] to-[#AEDEFC] text-white rounded-xl font-medium hover:shadow-lg transition-all">
                        Đóng
                    </button>
                `}
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    lucide.createIcons();
}

// Close leave detail modal
function closeLeaveDetailModal() {
    const modal = document.getElementById('leaveDetailModal');
    if (modal) {
        modal.remove();
    }
}

// Approve leave
async function approveLeave(id) {
    if (!confirm('Bạn có chắc muốn duyệt đơn nghỉ phép này không?')) return;

    try {
        showLoading();
        const response = await api.updateLeave(id, { status: 'duyệt' });

        if (response.success) {
            hideLoading();
            showSuccess('Leave request approved successfully!');
            await loadLeaves();
        }
    } catch (error) {
        hideLoading();
        console.error('Failed to approve leave:', error);
        showError(error.message || 'Failed to approve leave request');
    }
}

// Reject leave
async function rejectLeave(id) {
    if (!confirm('Bạn có chắc muốn không duyệt đơn xin nghỉ phép này không?')) return;

    try {
        showLoading();
        const response = await api.updateLeave(id, { status: 'không duyệt' });

        if (response.success) {
            hideLoading();
            showSuccess('Leave request rejected');
            await loadLeaves();
        }
    } catch (error) {
        hideLoading();
        console.error('Failed to reject leave:', error);
        showError(error.message || 'Failed to reject leave request');
    }
}

// Approve from modal
async function approveLeaveFromModal(id) {
    closeLeaveDetailModal();
    await approveLeave(id);
}

// Reject from modal
async function rejectLeaveFromModal(id) {
    closeLeaveDetailModal();
    await rejectLeave(id);
}

// Open add leave modal
async function openAddLeaveModal() {
    try {
        const response = await fetch('/leave-add-modal.html');
        const modalHTML = await response.text();

        const container = document.getElementById('modalContainer');
        container.innerHTML = modalHTML;

        const modal = document.getElementById('addLeaveModal');
        if (modal) {
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
            lucide.createIcons();

            setupLeaveModalFormHandler();
        }
    } catch (error) {
        console.error('Failed to load modal:', error);
        showError('Failed to open leave application form');
    }
}

// Setup leave modal form handler
function setupLeaveModalFormHandler() {
    const addForm = document.getElementById('addLeaveForm');
    if (addForm) {
        addForm.addEventListener('submit', handleAddLeave);
    }

    // Load employees for dropdown
    loadEmployeesForLeave();

    // Set min date to today
    const startDateInput = document.querySelector('#addLeaveForm input[name="start_date"]');
    const endDateInput = document.querySelector('#addLeaveForm input[name="end_date"]');

    if (startDateInput) {
        const today = new Date().toISOString().split('T')[0];
        startDateInput.min = today;

        startDateInput.addEventListener('change', function() {
            if (endDateInput) {
                endDateInput.min = this.value;
                if (endDateInput.value && endDateInput.value < this.value) {
                    endDateInput.value = this.value;
                }
            }
        });
    }
}

// Load employees for leave application
async function loadEmployeesForLeave() {
    try {
        console.log('[DEBUG] Loading employees for leave application...');
        const response = await api.getEmployees();

        console.log('[DEBUG] API Response:', response);
        console.log('[DEBUG] Response success:', response?.success);
        console.log('[DEBUG] Response data:', response?.data);
        console.log('[DEBUG] Response data length:', response?.data?.length);

        if (response && response.success && response.data) {
            const select = document.getElementById('employeeSelect');
            console.log('[DEBUG] Employee select element:', select);

            if (select) {
                // Get current user
                const currentUser = api.getUser();
                console.log('[DEBUG] Current user:', currentUser);
                const currentUserId = currentUser?.id;
                console.log('[DEBUG] Current user ID:', currentUserId);

                const options = response.data.map(emp => {
                    const selected = emp.id === currentUserId ? 'selected' : '';
                    return `<option value="${emp.id}" ${selected}>
                        ${emp.employee_id} - ${emp.first_name} ${emp.last_name} (${emp.job_title})
                    </option>`;
                }).join('');

                console.log('[DEBUG] Generated options:', options.substring(0, 200) + '...');
                select.innerHTML = options;
                console.log('[DEBUG] Employee dropdown updated successfully');

                lucide.createIcons();
            } else {
                console.error('[DEBUG] Employee select element not found!');
            }
        } else {
            console.error('[DEBUG] Invalid response:', {
                hasResponse: !!response,
                hasSuccess: response?.success,
                hasData: !!response?.data,
                dataType: typeof response?.data
            });
            throw new Error('Invalid API response');
        }
    } catch (error) {
        console.error('[DEBUG] Error in loadEmployeesForLeave:', error);
        console.error('[DEBUG] Error stack:', error.stack);
        showError('Failed to load employee list');
    }
}

// Close add leave modal
function closeAddLeaveModal() {
    const modal = document.getElementById('addLeaveModal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';

        setTimeout(() => {
            const container = document.getElementById('modalContainer');
            if (container) {
                container.innerHTML = '';
            }
        }, 300);
    }
}

// Handle add leave
async function handleAddLeave(event) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);

    const startDate = formData.get('start_date');
    const endDate = formData.get('end_date');

    // Calculate days (inclusive of both start and end date)
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    const leaveData = {
        employee_id: parseInt(formData.get('employee_id')),
        leave_type: formData.get('leave_type'),
        start_date: startDate,
        end_date: endDate,
        days: days,
        reason: formData.get('reason')
    };

    try {
        showLoading();
        const response = await api.createLeave(leaveData);

        if (response.success) {
            hideLoading();
            showSuccess('Leave application submitted successfully!');
            closeAddLeaveModal();
            form.reset();

            await loadLeaves();
        }
    } catch (error) {
        hideLoading();
        console.error('Failed to create leave:', error);
        showError(error.message || 'Failed to submit leave application');
    }
}

// Filter and search functionality
function applyFilters() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const typeFilter = document.getElementById('typeFilter')?.value || '';

    let filtered = currentLeaves;

    // Map English filter values to Vietnamese database values
    const statusMap = {
        'pending': 'chờ xét duyệt',
        'approved': 'duyệt',
        'rejected': 'không duyệt'
    };

    // Apply status filter from tab
    if (currentFilter !== 'all') {
        const dbStatus = statusMap[currentFilter] || currentFilter;
        filtered = filtered.filter(leave => leave.status === dbStatus);
    }

    // Apply type filter
    if (typeFilter) {
        filtered = filtered.filter(leave => leave.leave_type === typeFilter);
    }

    // Apply search
    if (searchTerm) {
        filtered = filtered.filter(leave => {
            const employeeName = `${leave.first_name || ''} ${leave.last_name || ''}`.toLowerCase();
            const leaveType = (leave.leave_type || '').toLowerCase();
            const reason = (leave.reason || '').toLowerCase();
            const status = (leave.status || '').toLowerCase();

            return employeeName.includes(searchTerm) ||
                   leaveType.includes(searchTerm) ||
                   reason.includes(searchTerm) ||
                   status.includes(searchTerm);
        });
    }

    renderLeaves(filtered);
}

// Initialize leave applications page
document.addEventListener('DOMContentLoaded', function() {
    // Get user role from token
    const user = api.getUser();
    window.userRole = user?.role || 'employee';

    loadLeaves();
    lucide.createIcons();

    // Set initial tab
    setTab('all');

    // Setup search and filter event listeners
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', applyFilters);
    }

    const typeFilter = document.getElementById('typeFilter');
    if (typeFilter) {
        typeFilter.addEventListener('change', applyFilters);
    }

    // Close modal on escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeAddLeaveModal();
            closeLeaveDetailModal();
        }
    });
});
