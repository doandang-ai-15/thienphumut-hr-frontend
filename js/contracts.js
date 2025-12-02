// Contracts Page JavaScript - Integrate with Real API

// Check authentication
if (!requireAuth()) {
    throw new Error('Not authenticated');
}

let currentContracts = [];
let currentFilter = 'all'; // all, active, expiring, expired
let currentStats = {
    total: 0,
    active: 0,
    expiring: 0,
    expired: 0
};

// Load contracts
async function loadContracts(status = null) {
    try {
        showLoading();

        const filters = status ? { status } : {};
        const response = await api.getContracts(filters);

        if (response.success) {
            currentContracts = response.data;
            calculateStats(currentContracts);
            renderContracts(currentContracts);
        }

        hideLoading();
    } catch (error) {
        hideLoading();
        console.error('Failed to load contracts:', error);
        showError('Failed to load contracts. Please refresh the page.');
    }
}

// Calculate statistics
function calculateStats(contracts) {
    const total = contracts.length;
    const active = contracts.filter(c => c.status === 'còn thời hạn').length;
    const expired = contracts.filter(c => c.status === 'hết hạn').length;

    // Expiring soon: active contracts ending within 30 days
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    const expiring = contracts.filter(c => {
        if (c.status !== 'còn thời hạn' || !c.end_date) return false;
        const endDate = new Date(c.end_date);
        return endDate >= today && endDate <= thirtyDaysFromNow;
    }).length;

    currentStats = { total, active, expiring, expired };
    renderStats();
}

// Render statistics
function renderStats() {
    const totalEl = document.querySelector('[data-stat="total"]');
    if (totalEl) totalEl.textContent = currentStats.total;

    const activeEl = document.querySelector('[data-stat="active"]');
    if (activeEl) activeEl.textContent = currentStats.active;

    const expiringEl = document.querySelector('[data-stat="expiring"]');
    if (expiringEl) expiringEl.textContent = currentStats.expiring;

    const expiredEl = document.querySelector('[data-stat="expired"]');
    if (expiredEl) expiredEl.textContent = currentStats.expired;
}

// Render contracts
function renderContracts(contracts) {
    const container = document.querySelector('#contractsTableBody');
    if (!container) return;

    if (contracts.length === 0) {
        container.innerHTML = `
            <div class="col-span-12 text-center py-12">
                <div class="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <i data-lucide="file-text" class="w-10 h-10 text-gray-400"></i>
                </div>
                <p class="text-gray-500">No contracts found</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    container.innerHTML = contracts.map(contract => {
        const statusColors = {
            active: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
            expired: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
            terminated: { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-500' },
            draft: { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500' }
        };

        const color = statusColors[contract.status] || statusColors.draft;

        // Format dates
        const startDate = new Date(contract.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const endDate = contract.end_date ? new Date(contract.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Indefinite';

        // Employee info
        const employeeName = `${contract.first_name || ''} ${contract.last_name || ''}`.trim() || 'Unknown';
        const employeeInitials = contract.first_name && contract.last_name
            ? `${contract.first_name[0]}${contract.last_name[0]}`
            : '??';

        // Contract type display
        const typeDisplay = {
            'permanent': 'Permanent',
            'fixed-term': 'Fixed-Term',
            'freelance': 'Freelance',
            'internship': 'Internship'
        };

        // Check if expiring soon (within 30 days)
        const isExpiringSoon = contract.status === 'còn thời hạn' && contract.end_date && (() => {
            const today = new Date();
            const end = new Date(contract.end_date);
            const daysUntilExpiry = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
            return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
        })();

        // Build avatar - use photo if exists, otherwise show initials
        let avatarHTML;
        if (contract.employee_photo) {
            avatarHTML = `<img src="${contract.employee_photo}" alt="${employeeName}" class="w-full h-full object-cover" onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\\'w-full h-full flex items-center justify-center text-white text-sm font-semibold\\'>${employeeInitials}</div>';">`;
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
                        <p class="text-xs text-gray-500">${contract.job_title || contract.employee_code || 'N/A'}</p>
                    </div>
                </div>

                <!-- Contract Number -->
                <div class="col-span-2">
                    <p class="text-sm text-gray-800 font-medium">${contract.contract_number || 'N/A'}</p>
                    <p class="text-xs text-gray-500">${typeDisplay[contract.contract_type] || contract.contract_type}</p>
                </div>

                <!-- Duration -->
                <div class="col-span-2">
                    <p class="text-sm text-gray-800">${startDate}</p>
                    <p class="text-xs text-gray-500">to ${endDate}</p>
                </div>

                <!-- Salary -->
                <div class="col-span-2">
                    <p class="text-sm text-gray-800 font-medium">$${contract.salary ? Number(contract.salary).toLocaleString() : 'N/A'}</p>
                    <p class="text-xs text-gray-500">Hàng tháng</p>
                </div>

                <!-- Status -->
                <div class="col-span-2">
                    <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full ${color.bg} ${color.text} text-xs font-medium">
                        <div class="w-1.5 h-1.5 rounded-full ${color.dot}"></div>
                        ${contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
                    </span>
                    ${isExpiringSoon ? `<p class="text-xs text-orange-500 mt-1">⚠️ Expiring soon</p>` : ''}
                </div>

                <!-- Actions -->
                <div class="col-span-1 flex items-center justify-end gap-2">
                    <button onclick="viewContractDetail(${contract.id})" class="p-2 hover:bg-white rounded-lg transition-colors" title="View Details">
                        <i data-lucide="eye" class="w-4 h-4 text-gray-600"></i>
                    </button>
                    ${window.userRole !== 'employee' ? `
                        <button onclick="editContract(${contract.id})" class="p-2 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                            <i data-lucide="edit" class="w-4 h-4 text-blue-600"></i>
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
    const tabs = ['all', 'active', 'expiring', 'expired'];
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

    // Update current filter and apply filters
    currentFilter = status;
    applyFilters();
}

// View contract detail
async function viewContractDetail(id) {
    try {
        const response = await api.getContract(id);
        if (response.success) {
            showContractDetailModal(response.data);
        }
    } catch (error) {
        console.error('Failed to load contract details:', error);
        showError('Failed to load contract details');
    }
}

// Show contract detail modal
function showContractDetailModal(contract) {
    const modal = document.createElement('div');
    modal.id = 'contractDetailModal';
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4';

    const statusColors = {
        active: { bg: 'bg-green-100', text: 'text-green-700' },
        expired: { bg: 'bg-red-100', text: 'text-red-700' },
        terminated: { bg: 'bg-gray-100', text: 'text-gray-700' },
        draft: { bg: 'bg-yellow-100', text: 'text-yellow-700' }
    };
    const color = statusColors[contract.status] || statusColors.draft;

    const startDate = new Date(contract.start_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const endDate = contract.end_date ? new Date(contract.end_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Indefinite';
    const signedDate = contract.signed_at ? new Date(contract.signed_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Not signed yet';

    const employeeName = `${contract.first_name || ''} ${contract.last_name || ''}`.trim() || 'Unknown';
    const employeeInitials = contract.first_name && contract.last_name
        ? `${contract.first_name[0]}${contract.last_name[0]}`
        : '??';

    const typeDisplay = {
        'permanent': 'Permanent',
        'fixed-term': 'Fixed-Term',
        'freelance': 'Freelance',
        'internship': 'Internship'
    };

    modal.innerHTML = `
        <div class="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onclick="closeContractDetailModal()"></div>
        <div class="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
            <div class="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-[#FDEDED]/50 to-[#EDFFF0]/50">
                <div class="flex items-center justify-between">
                    <div>
                        <h2 class="text-2xl font-semibold text-gray-800">Chi tiết hợp đồng</h2>
                        <p class="text-sm text-gray-500 mt-1">${contract.contract_number || 'No Contract Number'}</p>
                    </div>
                    <button onclick="closeContractDetailModal()" class="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
                        <i data-lucide="x" class="w-5 h-5 text-gray-500"></i>
                    </button>
                </div>
            </div>

            <div class="px-8 py-6 overflow-y-auto max-h-[calc(90vh-180px)] space-y-6">
                <!-- Employee Info -->
                <div>
                    <p class="text-sm text-gray-500 mb-2">Nhân viên</p>
                    <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <div class="w-12 h-12 rounded-full bg-gradient-to-br from-[#F875AA] to-[#AEDEFC] overflow-hidden">
                            ${contract.employee_photo
                                ? `<img src="${contract.employee_photo}" alt="${employeeName}" class="w-full h-full object-cover" onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\\'w-full h-full flex items-center justify-center text-white font-semibold\\'>${employeeInitials}</div>';">`
                                : `<div class="w-full h-full flex items-center justify-center text-white font-semibold">${employeeInitials}</div>`
                            }
                        </div>
                        <div>
                            <p class="font-medium text-gray-800">${employeeName}</p>
                            <p class="text-sm text-gray-500">${contract.job_title || contract.employee_code || 'N/A'}</p>
                        </div>
                    </div>
                </div>

                <!-- Contract Details -->
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <p class="text-sm text-gray-500 mb-1">Chi tiết hợp đồng</p>
                        <p class="font-medium text-gray-800">${typeDisplay[contract.contract_type] || contract.contract_type}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-500 mb-1">Tình trạng</p>
                        <span class="inline-block px-3 py-1 rounded-full ${color.bg} ${color.text} text-sm font-medium capitalize">
                            ${contract.status}
                        </span>
                    </div>
                    <div>
                        <p class="text-sm text-gray-500 mb-1">Ngày bắt đầu</p>
                        <p class="font-medium text-gray-800">${startDate}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-500 mb-1">Ngày kết thúc</p>
                        <p class="font-medium text-gray-800">${endDate}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-500 mb-1">Lương khởi điểm</p>
                        <p class="font-medium text-gray-800">$${contract.salary ? Number(contract.salary).toLocaleString() : 'N/A'}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-500 mb-1">Ngày ký hợp đồng</p>
                        <p class="font-medium text-gray-800">${signedDate}</p>
                    </div>
                </div>

                <!-- Terms -->
                ${contract.terms ? `
                    <div>
                        <p class="text-sm text-gray-500 mb-2">Điều khoản & điều kiện</p>
                        <p class="text-gray-800 p-3 bg-gray-50 rounded-xl text-sm whitespace-pre-wrap">${contract.terms}</p>
                    </div>
                ` : ''}
            </div>

            <div class="px-8 py-5 border-t border-gray-100 bg-gray-50 flex gap-3">
                <button onclick="closeContractDetailModal()" class="flex-1 py-3 bg-gradient-to-r from-[#F875AA] to-[#AEDEFC] text-white rounded-xl font-medium hover:shadow-lg transition-all">
                    Đóng
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    lucide.createIcons();
}

// Close contract detail modal
function closeContractDetailModal() {
    const modal = document.getElementById('contractDetailModal');
    if (modal) {
        modal.remove();
    }
}

// Edit contract (placeholder)
function editContract(id) {
    showError('Chức năng điều chỉnh hợp đồng đang trong quá trình phát triển, sẽ xong sớm!');
}

// Open Add Contract Modal
async function openModal() {
    try {
        const response = await fetch('/contract-add-modal.html');
        const modalHTML = await response.text();

        const container = document.getElementById('modalContainer');
        container.innerHTML = modalHTML;

        const modal = document.getElementById('addContractModal');
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';

        lucide.createIcons();
        setupContractModalFormHandler();
    } catch (error) {
        console.error('Failed to load contract modal:', error);
        showError('Failed to load contract form');
    }
}

// Setup contract modal form handler
function setupContractModalFormHandler() {
    const addForm = document.getElementById('addContractForm');
    if (addForm) {
        addForm.addEventListener('submit', handleAddContract);
    }

    // Load employees for dropdown
    loadEmployeesForContract();
}

// Load employees for contract
async function loadEmployeesForContract() {
    try {
        const response = await api.getEmployees();
        if (response.success) {
            const select = document.querySelector('#addContractForm select[name="employee_id"]');
            if (select) {
                select.innerHTML = '<option value="">Chọn nhân viên</option>' +
                    response.data.map(emp =>
                        `<option value="${emp.id}">${emp.employee_id} - ${emp.first_name} ${emp.last_name}</option>`
                    ).join('');
            }
        }
    } catch (error) {
        console.error('Failed to load employees:', error);
    }
}

// Close Add Contract Modal
function closeAddContractModal() {
    const modal = document.getElementById('addContractModal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';

        setTimeout(() => {
            const container = document.getElementById('modalContainer');
            if (container) container.innerHTML = '';
        }, 300);
    }
}

// Handle add contract
async function handleAddContract(event) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);

    const contractData = {
        employee_id: parseInt(formData.get('employee_id')),
        contract_type: formData.get('contract_type'),
        contract_number: formData.get('contract_number'),
        start_date: formData.get('start_date'),
        end_date: formData.get('end_date') || null,
        salary: parseFloat(formData.get('salary')),
        terms: formData.get('terms')
    };

    try {
        showLoading();
        const response = await api.createContract(contractData);

        if (response.success) {
            hideLoading();
            showSuccess('Contract created successfully!');
            closeAddContractModal();
            form.reset();

            await loadContracts();
        }
    } catch (error) {
        hideLoading();
        console.error('Failed to create contract:', error);
        showError(error.message || 'Failed to create contract');
    }
}

// Filter and search functionality
function applyFilters() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const typeFilter = document.getElementById('typeFilter')?.value || '';

    let filtered = currentContracts;

    // Map English filter values to Vietnamese database values
    const statusMap = {
        'active': 'còn thời hạn',
        'expired': 'hết hạn',
        'terminated': 'chấm dứt',
        'draft': 'dự thảo hợp đồng'
    };

    // Apply status filter from tab
    if (currentFilter === 'expiring') {
        const today = new Date();
        const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(c => {
            if (c.status !== 'còn thời hạn' || !c.end_date) return false;
            const endDate = new Date(c.end_date);
            return endDate >= today && endDate <= thirtyDaysFromNow;
        });
    } else if (currentFilter !== 'all') {
        const dbStatus = statusMap[currentFilter] || currentFilter;
        filtered = filtered.filter(contract => contract.status === dbStatus);
    }

    // Apply type filter
    if (typeFilter) {
        filtered = filtered.filter(contract => contract.contract_type === typeFilter);
    }

    // Apply search
    if (searchTerm) {
        filtered = filtered.filter(contract => {
            const employeeName = `${contract.first_name || ''} ${contract.last_name || ''}`.toLowerCase();
            const contractNumber = (contract.contract_number || '').toLowerCase();
            const contractType = (contract.contract_type || '').toLowerCase();

            return employeeName.includes(searchTerm) ||
                   contractNumber.includes(searchTerm) ||
                   contractType.includes(searchTerm);
        });
    }

    renderContracts(filtered);
}

// Initialize contracts page
document.addEventListener('DOMContentLoaded', function() {
    // Get user role from token
    const user = api.getUser();
    window.userRole = user?.role || 'employee';

    loadContracts();
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
            closeAddContractModal();
            closeContractDetailModal();
        }
    });
});
