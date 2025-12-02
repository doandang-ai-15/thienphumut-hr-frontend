// Departments Page JavaScript - Integrate with Real API

// Check authentication
if (!requireAuth()) {
    throw new Error('Not authenticated');
}

let currentDepartments = [];
let currentStats = {
    totalDepartments: 0,
    totalEmployees: 0,
    avgTeamSize: 0,
    activeDepartments: 0
};

// Load departments data
async function loadDepartments() {
    try {
        showLoading();

        const response = await api.getDepartments();

        if (response.success) {
            currentDepartments = response.data;
            renderDepartments(currentDepartments);
            calculateStats(currentDepartments);
        }

        hideLoading();
    } catch (error) {
        hideLoading();
        console.error('Failed to load departments:', error);
        showError('Failed to load departments. Please refresh the page.');
    }
}

// Calculate statistics
function calculateStats(departments) {
    const totalDepartments = departments.length;
    // Use actual_employee_count from backend (already counted active employees)
    const totalEmployees = departments.reduce((sum, dept) => sum + (parseInt(dept.actual_employee_count) || 0), 0);
    const avgTeamSize = totalDepartments > 0 ? Math.round(totalEmployees / totalDepartments) : 0;
    // Count departments that are active (you can add status field in backend if needed)
    const activeDepartments = totalDepartments; // All departments shown are active

    currentStats = {
        totalDepartments,
        totalEmployees,
        avgTeamSize,
        activeDepartments
    };

    renderStats();
}

// Render statistics
function renderStats() {
    // Total Departments
    const totalDeptsEl = document.querySelector('[data-stat="total-departments"]');
    if (totalDeptsEl) {
        totalDeptsEl.textContent = currentStats.totalDepartments;
    }

    // Total Employees
    const totalEmpsEl = document.querySelector('[data-stat="total-employees"]');
    if (totalEmpsEl) {
        totalEmpsEl.textContent = currentStats.totalEmployees;
    }

    // Average Team Size
    const avgTeamEl = document.querySelector('[data-stat="avg-team-size"]');
    if (avgTeamEl) {
        avgTeamEl.textContent = currentStats.avgTeamSize;
    }

    // Active Departments
    const activeDeptsEl = document.querySelector('[data-stat="active-departments"]');
    if (activeDeptsEl) {
        activeDeptsEl.textContent = currentStats.activeDepartments;
    }
}

// Render departments grid
function renderDepartments(departments) {
    const container = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3');
    if (!container) return;

    if (departments.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-12">
                <div class="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <i data-lucide="building-2" class="w-10 h-10 text-gray-400"></i>
                </div>
                <p class="text-gray-500">No departments found</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    const departmentIcons = {
        'Technology': 'code',
        'Marketing': 'megaphone',
        'Sales': 'trending-up',
        'Human Resources': 'users',
        'Finance': 'dollar-sign',
        'Operations': 'settings'
    };

    const departmentColors = [
        { bg: 'from-[#F875AA] to-[#FDEDED]', text: 'text-[#F875AA]', icon: 'bg-[#F875AA]/10' },
        { bg: 'from-[#AEDEFC] to-[#EDFFF0]', text: 'text-[#5BA3C8]', icon: 'bg-[#AEDEFC]/10' },
        { bg: 'from-[#EDFFF0] to-[#FDEDED]', text: 'text-green-500', icon: 'bg-green-500/10' },
        { bg: 'from-[#FDEDED] to-[#AEDEFC]', text: 'text-purple-500', icon: 'bg-purple-500/10' },
        { bg: 'from-[#F875AA] to-[#EDFFF0]', text: 'text-orange-500', icon: 'bg-orange-500/10' },
        { bg: 'from-[#AEDEFC] to-[#FDEDED]', text: 'text-blue-500', icon: 'bg-blue-500/10' }
    ];

    container.innerHTML = departments.map((dept, index) => {
        const color = departmentColors[index % departmentColors.length];
        const icon = departmentIcons[dept.name] || 'building-2';

        // Use actual_employee_count from backend
        const employeeCount = parseInt(dept.actual_employee_count) || 0;

        // Build manager name from first_name and last_name from backend
        const managerName = dept.manager_first_name && dept.manager_last_name
            ? `${dept.manager_first_name} ${dept.manager_last_name}`
            : 'No Manager';

        // Manager initials
        const managerInitials = dept.manager_first_name && dept.manager_last_name
            ? `${dept.manager_first_name[0]}${dept.manager_last_name[0]}`
            : 'NA';

        // Build manager avatar HTML
        let managerAvatarHTML;
        if (dept.manager_photo) {
            managerAvatarHTML = `<img src="${dept.manager_photo}" alt="${managerName}" class="w-full h-full object-cover" onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\\'w-full h-full flex items-center justify-center text-white text-xs font-semibold\\'>${managerInitials}</div>';">`;
        } else {
            managerAvatarHTML = `<div class="w-full h-full flex items-center justify-center text-white text-xs font-semibold">${managerInitials}</div>`;
        }

        return `
            <div onclick="viewDepartmentDetail(${dept.id})"
                 class="department-card bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 cursor-pointer transition-all duration-300 fade-up stagger-${(index % 6) + 1}">
                <div class="flex items-start justify-between mb-4">
                    <div class="w-12 h-12 rounded-2xl ${color.icon} flex items-center justify-center">
                        <i data-lucide="${icon}" class="w-6 h-6 ${color.text}"></i>
                    </div>
                    <span class="px-3 py-1 bg-gradient-to-r ${color.bg} text-xs font-semibold rounded-full ${color.text}">
                        ${employeeCount} thành viên
                    </span>
                </div>
                <h3 class="text-lg font-semibold text-gray-800 mb-2">${dept.name}</h3>
                <p class="text-sm text-gray-500 mb-4 line-clamp-2">${dept.description || 'No description'}</p>
                <div class="flex items-center gap-2 pt-4 border-t border-gray-100">
                    <div class="w-8 h-8 rounded-full bg-gradient-to-br from-[#F875AA] to-[#AEDEFC] overflow-hidden">
                        ${managerAvatarHTML}
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-xs text-gray-400">Trưởng phòng ban</p>
                        <p class="text-sm font-medium text-gray-700 truncate">${managerName}</p>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    lucide.createIcons();
}

// View department detail
async function viewDepartmentDetail(id) {
    try {
        const response = await api.getDepartment(id);
        if (response.success) {
            showDepartmentDetailModal(response.data);
        }
    } catch (error) {
        console.error('Failed to load department details:', error);
        showError('Failed to load department details');
    }
}

// Show department detail modal
function showDepartmentDetailModal(department) {
    console.log('🏢 showDepartmentDetailModal called with department:', department);
    console.log('👥 Department employees:', department.employees);

    // Log each employee's photo status
    if (department.employees && department.employees.length > 0) {
        department.employees.forEach((emp, index) => {
            console.log(`👤 Employee ${index + 1}: ${emp.first_name} ${emp.last_name}`);
            console.log(`   📷 Photo field exists: ${emp.photo ? 'YES' : 'NO'}`);
            if (emp.photo) {
                console.log(`   📷 Photo length: ${emp.photo.length} characters`);
            }
        });
    }

    const modal = document.createElement('div');
    modal.id = 'departmentDetailModal';
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4';

    // Store department data globally for update function
    window.currentDepartment = department;

    // Build manager name from backend data
    const managerName = department.manager_first_name && department.manager_last_name
        ? `${department.manager_first_name} ${department.manager_last_name}`
        : null;

    const managerInitials = department.manager_first_name && department.manager_last_name
        ? `${department.manager_first_name[0]}${department.manager_last_name[0]}`
        : 'NA';

    // Employee count from employees array or 0
    const employeeCount = department.employees ? department.employees.length : 0;

    modal.innerHTML = `
        <div class="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onclick="closeDepartmentDetailModal()"></div>
        <div class="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
            <div class="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-[#FDEDED]/50 to-[#EDFFF0]/50">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-4">
                        <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#F875AA] to-[#AEDEFC] flex items-center justify-center">
                            <i data-lucide="building-2" class="w-8 h-8 text-white"></i>
                        </div>
                        <div>
                            <h2 class="text-2xl font-semibold text-gray-800">${department.name}</h2>
                            <p class="text-gray-500">${employeeCount} employees</p>
                        </div>
                    </div>
                    <button onclick="closeDepartmentDetailModal()" class="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
                        <i data-lucide="x" class="w-5 h-5 text-gray-500"></i>
                    </button>
                </div>
            </div>

            <div class="px-8 py-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                <div class="space-y-6">
                    <div>
                        <p class="text-sm text-gray-500 mb-1">Description</p>
                        <p class="text-gray-800">${department.description || 'No description available'}</p>
                    </div>

                    <div>
                        <div class="flex items-center justify-between mb-2">
                            <p class="text-sm text-gray-500">Trưởng phòng ban</p>
                            <button onclick="toggleEditManager()" id="editManagerBtn" class="text-xs text-[#F875AA] hover:text-[#F875AA]/80 font-medium">
                                Edit
                            </button>
                        </div>

                        <!-- Display Mode -->
                        <div id="managerDisplay" class="${managerName ? '' : 'hidden'}">
                            <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                <div class="w-12 h-12 rounded-full bg-gradient-to-br from-[#F875AA] to-[#AEDEFC] overflow-hidden">
                                    ${department.manager_photo
                                        ? `<img src="${department.manager_photo}" alt="${managerName}" class="w-full h-full object-cover" onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\\'w-full h-full flex items-center justify-center text-white font-semibold\\'>${managerInitials}</div>';">`
                                        : `<div class="w-full h-full flex items-center justify-center text-white font-semibold">${managerInitials}</div>`
                                    }
                                </div>
                                <div class="flex-1">
                                    <p class="font-medium text-gray-800">${managerName || 'No Manager'}</p>
                                    <p class="text-sm text-gray-500">Manager</p>
                                </div>
                            </div>
                        </div>

                        <!-- No Manager Display -->
                        <div id="noManagerDisplay" class="${!managerName ? '' : 'hidden'}">
                            <div class="p-3 bg-gray-50 rounded-xl text-center">
                                <p class="text-sm text-gray-500">No manager assigned</p>
                            </div>
                        </div>

                        <!-- Edit Mode -->
                        <div id="managerEdit" class="hidden">
                            <div class="space-y-3">
                                <select id="managerSelect" class="w-full px-4 py-3 rounded-xl border-2 border-gray-100 bg-white focus:border-[#F875AA] focus:outline-none text-sm">
                                    <option value="">Loading...</option>
                                </select>
                                <div class="flex gap-2">
                                    <button onclick="saveManager()" class="flex-1 px-4 py-2 bg-gradient-to-r from-[#F875AA] to-[#AEDEFC] text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all">
                                        Save
                                    </button>
                                    <button onclick="cancelEditManager()" class="flex-1 px-4 py-2 border-2 border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all">
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    ${department.employees && department.employees.length > 0 ? `
                        <div>
                            <p class="text-sm text-gray-500 mb-3">Team Members (${department.employees.length})</p>
                            <div class="grid grid-cols-2 gap-3">
                                ${department.employees.slice(0, 8).map((emp, index) => {
                                    const initials = `${emp.first_name[0]}${emp.last_name[0]}`;

                                    console.log(`🎨 Rendering team member ${index + 1}: ${emp.first_name} ${emp.last_name}`);
                                    console.log(`   📷 Has photo: ${emp.photo ? 'YES' : 'NO'}`);

                                    // Build avatar - use photo if exists, otherwise show initials
                                    let avatarHTML;
                                    if (emp.photo) {
                                        console.log(`   ✅ Using photo for ${emp.first_name}`);
                                        avatarHTML = `<img src="${emp.photo}" alt="${emp.first_name} ${emp.last_name}" class="w-full h-full object-cover" onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\\'w-full h-full flex items-center justify-center text-xs font-semibold\\'>${initials}</div>';">`;
                                    } else {
                                        console.log(`   ℹ️ Using initials for ${emp.first_name} (no photo)`);
                                        avatarHTML = `<div class="w-full h-full flex items-center justify-center text-xs font-semibold">${initials}</div>`;
                                    }

                                    return `
                                        <div class="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50">
                                            <div class="w-8 h-8 rounded-full bg-gradient-to-br from-[#AEDEFC] to-[#EDFFF0] overflow-hidden">
                                                ${avatarHTML}
                                            </div>
                                            <div class="flex-1 min-w-0">
                                                <p class="text-sm font-medium text-gray-800 truncate">${emp.first_name} ${emp.last_name}</p>
                                                <p class="text-xs text-gray-500 truncate">${emp.job_title || 'Employee'}</p>
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                            ${department.employees.length > 8 ? `
                                <p class="text-sm text-gray-500 mt-2 text-center">+${department.employees.length - 8} more employees</p>
                            ` : ''}
                        </div>
                    ` : ''}
                </div>
            </div>

            <div class="px-8 py-5 border-t border-gray-100 bg-gray-50">
                <button onclick="closeDepartmentDetailModal()" class="w-full py-3 bg-gradient-to-r from-[#F875AA] to-[#AEDEFC] text-white rounded-xl font-medium hover:shadow-lg transition-all">
                    Close
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    lucide.createIcons();
}

// Close department detail modal
function closeDepartmentDetailModal() {
    const modal = document.getElementById('departmentDetailModal');
    if (modal) {
        modal.remove();
    }
}

// Toggle edit manager mode
async function toggleEditManager() {
    const displayDiv = document.getElementById('managerDisplay');
    const noManagerDiv = document.getElementById('noManagerDisplay');
    const editDiv = document.getElementById('managerEdit');
    const editBtn = document.getElementById('editManagerBtn');

    // Hide displays, show edit
    displayDiv.classList.add('hidden');
    noManagerDiv.classList.add('hidden');
    editDiv.classList.remove('hidden');
    editBtn.classList.add('hidden');

    // Load employees for dropdown
    await loadManagerOptions();
}

// Cancel edit manager
function cancelEditManager() {
    const displayDiv = document.getElementById('managerDisplay');
    const noManagerDiv = document.getElementById('noManagerDisplay');
    const editDiv = document.getElementById('managerEdit');
    const editBtn = document.getElementById('editManagerBtn');

    const dept = window.currentDepartment;
    const hasManager = dept.manager_first_name && dept.manager_last_name;

    // Show appropriate display
    if (hasManager) {
        displayDiv.classList.remove('hidden');
        noManagerDiv.classList.add('hidden');
    } else {
        displayDiv.classList.add('hidden');
        noManagerDiv.classList.remove('hidden');
    }

    editDiv.classList.add('hidden');
    editBtn.classList.remove('hidden');
}

// Load manager options
async function loadManagerOptions() {
    try {
        const response = await api.getEmployees();
        if (response.success) {
            const select = document.getElementById('managerSelect');
            const currentManagerId = window.currentDepartment.manager_id;

            select.innerHTML = '<option value="">No Manager</option>' +
                response.data.map(emp =>
                    `<option value="${emp.id}" ${emp.id === currentManagerId ? 'selected' : ''}>
                        ${emp.first_name} ${emp.last_name} - ${emp.job_title}
                    </option>`
                ).join('');
        }
    } catch (error) {
        console.error('Failed to load employees:', error);
        showError('Failed to load employee list');
    }
}

// Save manager
async function saveManager() {
    const select = document.getElementById('managerSelect');
    const newManagerId = select.value ? parseInt(select.value) : null;
    const dept = window.currentDepartment;

    try {
        showLoading();

        const response = await api.updateDepartment(dept.id, {
            manager_id: newManagerId
        });

        if (response.success) {
            hideLoading();
            showSuccess('Department head updated successfully!');

            // Reload department details
            closeDepartmentDetailModal();
            await loadDepartments();
        }
    } catch (error) {
        hideLoading();
        console.error('Failed to update manager:', error);
        showError(error.message || 'Failed to update department head');
    }
}

// Open Add Department Modal
async function openAddDepartmentModal() {
    try {
        const response = await fetch('/department-add-modal.html');
        const modalHTML = await response.text();

        const container = document.getElementById('modalContainer');
        container.innerHTML = modalHTML;

        const modal = document.getElementById('addDepartmentModal');
        if (modal) {
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
            lucide.createIcons();

            setupModalFormHandler();
        }
    } catch (error) {
        console.error('Failed to load modal:', error);
        showError('Failed to open add department form');
    }
}

// Setup form handler for dynamically loaded modal
function setupModalFormHandler() {
    const addForm = document.getElementById('addDepartmentForm');
    if (addForm) {
        addForm.addEventListener('submit', handleAddDepartment);
    }

    // Load employees for manager dropdown
    loadEmployeesForManager();
}

// Load employees for manager dropdown
async function loadEmployeesForManager() {
    try {
        const response = await api.getEmployees();
        if (response.success) {
            const select = document.querySelector('#addDepartmentForm select[name="manager_id"]');
            if (select) {
                select.innerHTML = '<option value="">Select manager (optional)</option>' +
                    response.data.map(emp =>
                        `<option value="${emp.id}">${emp.first_name} ${emp.last_name} - ${emp.job_title}</option>`
                    ).join('');
            }
        }
    } catch (error) {
        console.error('Failed to load employees:', error);
    }
}

// Close Add Department Modal
function closeAddDepartmentModal() {
    const modal = document.getElementById('addDepartmentModal');
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

// Handle add department form submission
async function handleAddDepartment(event) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);

    const departmentData = {
        name: formData.get('name'),
        description: formData.get('description'),
        manager_id: formData.get('manager_id') ? parseInt(formData.get('manager_id')) : null,
        budget: formData.get('budget') ? parseFloat(formData.get('budget')) : null,
        location: formData.get('location')
    };

    try {
        showLoading();
        const response = await api.createDepartment(departmentData);

        if (response.success) {
            hideLoading();
            showSuccess('Department added successfully!');
            closeAddDepartmentModal();
            form.reset();

            await loadDepartments();
        }
    } catch (error) {
        hideLoading();
        console.error('Failed to create department:', error);
        showError(error.message || 'Failed to create department');
    }
}

// Initialize departments page
document.addEventListener('DOMContentLoaded', function() {
    loadDepartments();
    lucide.createIcons();

    // Close modal on escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeAddDepartmentModal();
            closeDepartmentDetailModal();
        }
    });
});
