// Employees Page JavaScript - Integrate with Real API

// Check authentication
if (!requireAuth()) {
    throw new Error('Not authenticated');
}

let allEmployees = []; // All employees loaded once
let currentEmployees = []; // Filtered employees for display
let currentFilters = {
    search: '',
    department: '',
    status: 'active'
};
let searchDebounceTimer = null; // Debounce timer for search
let currentPage = 1;
let itemsPerPage = 50;
let totalPages = 1;
let totalEmployees = 0;

// Load ALL employees data once (no filters on API call)
async function loadEmployees() {
    try {
        showLoading();

        // Fetch ALL employees without filters (use limit: 'all' to get all records)
        const response = await api.getEmployees({ status: 'active', limit: 'all' });

        if (response.success) {
            allEmployees = response.data;
            totalEmployees = response.total;
            // Apply client-side filters
            applyFilters();
        }

        hideLoading();
    } catch (error) {
        hideLoading();
        console.error('Failed to load employees:', error);
        showError('Failed to load employees. Please refresh the page.');
    }
}

// Client-side filtering (fast, no API call)
function applyFilters() {
    let filtered = [...allEmployees];

    // Filter by search (name)
    if (currentFilters.search) {
        const searchLower = currentFilters.search.toLowerCase();
        filtered = filtered.filter(emp => {
            const fullName = `${emp.first_name} ${emp.last_name}`.toLowerCase();
            const reverseName = `${emp.last_name} ${emp.first_name}`.toLowerCase();
            return fullName.includes(searchLower) ||
                   reverseName.includes(searchLower) ||
                   emp.employee_id.toLowerCase().includes(searchLower);
        });
    }

    // Filter by department (single or multiple)
    if (currentFilters.departments && currentFilters.departments.length > 0) {
        // Multiple departments
        filtered = filtered.filter(emp =>
            currentFilters.departments.includes(emp.department_id?.toString())
        );
    } else if (currentFilters.department) {
        // Single department
        filtered = filtered.filter(emp => emp.department_id === parseInt(currentFilters.department));
    }

    // Filter by status
    if (currentFilters.status) {
        filtered = filtered.filter(emp => emp.status === currentFilters.status);
    }

    currentEmployees = filtered;

    // Calculate pagination
    totalEmployees = filtered.length;
    if (itemsPerPage === 'all') {
        totalPages = 1;
        currentPage = 1;
    } else {
        totalPages = Math.ceil(totalEmployees / itemsPerPage);
        // Reset to page 1 if current page exceeds total pages
        if (currentPage > totalPages && totalPages > 0) {
            currentPage = 1;
        }
    }

    renderEmployeesWithPagination();
}

// Render employees with pagination
function renderEmployeesWithPagination() {
    // Get paginated employees
    let employeesToShow = currentEmployees;
    if (itemsPerPage !== 'all') {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        employeesToShow = currentEmployees.slice(startIndex, endIndex);
    }

    renderEmployees(employeesToShow);
    updatePaginationControls();
}

// Update pagination controls
function updatePaginationControls() {
    const paginationContainer = document.getElementById('paginationControls');
    if (!paginationContainer) return;

    // Show/hide pagination based on items per page
    if (itemsPerPage === 'all' || totalEmployees === 0) {
        paginationContainer.style.display = 'none';
        return;
    }
    paginationContainer.style.display = 'flex';

    // Update showing text
    const startIndex = (currentPage - 1) * itemsPerPage + 1;
    const endIndex = Math.min(currentPage * itemsPerPage, totalEmployees);
    document.getElementById('showingFrom').textContent = startIndex;
    document.getElementById('showingTo').textContent = endIndex;
    document.getElementById('totalEmployees').textContent = totalEmployees;

    // Update previous/next buttons
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');
    if (prevBtn) {
        prevBtn.disabled = currentPage === 1;
    }
    if (nextBtn) {
        nextBtn.disabled = currentPage === totalPages;
    }

    // Render page numbers
    renderPageNumbers();
}

// Render page numbers
function renderPageNumbers() {
    const pageNumbersContainer = document.getElementById('pageNumbers');
    if (!pageNumbersContainer) return;

    let pages = [];

    // Always show first page
    pages.push(1);

    // Show pages around current page
    const range = 2;
    for (let i = Math.max(2, currentPage - range); i <= Math.min(totalPages - 1, currentPage + range); i++) {
        if (!pages.includes(i)) {
            pages.push(i);
        }
    }

    // Always show last page
    if (totalPages > 1 && !pages.includes(totalPages)) {
        pages.push(totalPages);
    }

    // Sort pages
    pages.sort((a, b) => a - b);

    // Build HTML with ellipsis
    let html = '';
    for (let i = 0; i < pages.length; i++) {
        // Add ellipsis if there's a gap
        if (i > 0 && pages[i] - pages[i - 1] > 1) {
            html += '<span class="px-2 text-gray-400">...</span>';
        }

        const isActive = pages[i] === currentPage;
        const activeClass = isActive
            ? 'bg-gradient-to-r from-[#F875AA] to-[#AEDEFC] text-white border-transparent'
            : 'bg-white border-gray-200 text-gray-600 hover:border-[#F875AA]/30 hover:bg-[#FDEDED]/30';

        html += `
            <button onclick="goToPage(${pages[i]})"
                    class="px-3 py-2 rounded-lg border text-sm font-medium transition-all ${activeClass}">
                ${pages[i]}
            </button>
        `;
    }

    pageNumbersContainer.innerHTML = html;
    lucide.createIcons();
}

// Go to specific page
function goToPage(page) {
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    renderEmployeesWithPagination();
}

// Change items per page
function changeItemsPerPage() {
    const select = document.getElementById('itemsPerPage');
    if (!select) return;

    const value = select.value;
    itemsPerPage = value === 'all' ? 'all' : parseInt(value);
    currentPage = 1; // Reset to first page
    applyFilters(); // This will trigger renderEmployeesWithPagination
}

// Render employees grid
function renderEmployees(employees) {
    const container = document.querySelector('.grid.grid-cols-2');
    if (!container) return;

    if (employees.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-12">
                <div class="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <i data-lucide="users" class="w-10 h-10 text-gray-400"></i>
                </div>
                <p class="text-gray-500">No employees found</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    container.innerHTML = employees.map((emp, index) => {
        const initials = `${emp.first_name[0]}${emp.last_name[0]}`;
        const statusColors = {
            'active': 'bg-[#EDFFF0] text-green-600',
            'on-leave': 'bg-[#FDEDED] text-yellow-600',
            'inactive': 'bg-gray-100 text-gray-600'
        };
        const statusDots = {
            'active': 'bg-green-400',
            'on-leave': 'bg-yellow-400',
            'inactive': 'bg-gray-400'
        };
        const statusText = {
            'active': 'Active',
            'on-leave': 'On Leave',
            'inactive': 'Inactive'
        };

        const gradients = [
            'from-[#F875AA] to-[#AEDEFC]',
            'from-[#AEDEFC] to-[#EDFFF0]',
            'from-[#F875AA] to-[#FDEDED]',
            'from-[#AEDEFC] to-[#F875AA]',
            'from-[#EDFFF0] to-[#AEDEFC]'
        ];
        const gradient = gradients[index % gradients.length];

        // Build avatar HTML - use photo if exists, otherwise show initials (like settings page)
        let avatarContent = generateAvatarHtml({
            photo: emp.photo,
            firstName: emp.first_name,
            lastName: emp.last_name
        });

        // Gmail status
        const gmailStatus = emp.have_gmail !== false; // Default true if undefined
        const gmailClass = gmailStatus ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600';
        const gmailText = gmailStatus ? 'Đã có gmail' : 'Chưa cập nhật gmail';

        return `
            <div class="employee-card bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 text-center cursor-pointer transition-all duration-300 fade-up stagger-${(index % 6) + 1} relative group">
                <!-- Three-dot menu (top-right) -->
                <button onclick="event.stopPropagation(); openEditEmployeeModal(${emp.id})"
                        class="absolute top-3 right-3 w-8 h-8 rounded-lg bg-white/80 hover:bg-[#F875AA] text-gray-600 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg z-10">
                    <i data-lucide="pencil" class="w-4 h-4"></i>
                </button>

                <!-- Card content (clickable for detail view) -->
                <div onclick="viewEmployeeDetail(${emp.id})">
                    <div class="avatar-ring w-20 h-20 mx-auto rounded-full bg-gradient-to-br ${gradient} p-0.5 transition-all duration-300 overflow-hidden">
                        ${avatarContent}
                    </div>
                    <h3 class="mt-4 text-sm font-semibold text-gray-800">${emp.first_name} ${emp.last_name}</h3>
                    <p class="text-xs text-gray-500 mt-1">${emp.department_name || 'No Department'}</p>

                    <!-- Gmail Status Note (clickable to toggle) -->
                    <div onclick="event.stopPropagation(); toggleGmailStatus(${emp.id}, ${gmailStatus})"
                         class="mt-2 inline-flex items-center gap-1 px-2 py-1 ${gmailClass} rounded-full cursor-pointer hover:opacity-80 transition-opacity"
                         title="Click để thay đổi trạng thái Gmail">
                        <span class="text-xs font-medium">${gmailText}</span>
                    </div>

                    <div class="mt-3 inline-flex items-center gap-1 px-2 py-1 ${statusColors[emp.status]} rounded-full">
                        <span class="w-1.5 h-1.5 ${statusDots[emp.status]} rounded-full"></span>
                        <span class="text-xs">${statusText[emp.status]}</span>
                    </div>
                </div>

                <!-- Trash icon (bottom-right) -->
                <button onclick="event.stopPropagation(); deleteEmployee(${emp.id}, '${emp.first_name} ${emp.last_name}')"
                        class="absolute bottom-3 right-3 w-8 h-8 rounded-lg bg-white/80 hover:bg-red-500 text-gray-600 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg z-10">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            </div>
        `;
    }).join('');

    lucide.createIcons();
}

// Search employees with debounce (300ms)
function handleSearch(event) {
    const searchValue = event.target.value.toLowerCase();
    currentFilters.search = searchValue;

    // Clear previous timer
    if (searchDebounceTimer) {
        clearTimeout(searchDebounceTimer);
    }

    // Set new timer for debounced search
    searchDebounceTimer = setTimeout(() => {
        // Use client-side filtering (instant, no API call)
        applyFilters();
    }, 300); // Wait 300ms after user stops typing
}

// Filter by department
function handleDepartmentFilter(departmentId) {
    currentFilters.department = departmentId;
    // Use client-side filtering (instant, no API call)
    applyFilters();
}

// Filter by status
function handleStatusFilter(status) {
    currentFilters.status = status;
    // Use client-side filtering (instant, no API call)
    applyFilters();
}

// View employee detail
async function viewEmployeeDetail(id) {
    try {
        const response = await api.getEmployee(id);
        if (response.success) {
            showEmployeeDetailModal(response.data);
        }
    } catch (error) {
        console.error('Failed to load employee details:', error);
        showError('Failed to load employee details');
    }
}

// Show employee detail modal
function showEmployeeDetailModal(employee) {
    const modal = document.createElement('div');
    modal.id = 'employeeDetailModal';
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4';

    const initials = `${employee.first_name[0]}${employee.last_name[0]}`;

    modal.innerHTML = `
        <div class="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onclick="closeEmployeeDetailModal()"></div>
        <div class="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div class="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-[#FDEDED]/50 to-[#EDFFF0]/50">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-4">
                        <div class="w-16 h-16 rounded-full bg-gradient-to-br from-[#F875AA] to-[#AEDEFC] flex items-center justify-center text-white text-2xl font-bold">
                            ${initials}
                        </div>
                        <div>
                            <h2 class="text-2xl font-semibold text-gray-800">${employee.first_name} ${employee.last_name}</h2>
                            <p class="text-gray-500">${employee.job_title}</p>
                        </div>
                    </div>
                    <button onclick="closeEmployeeDetailModal()" class="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
                        <i data-lucide="x" class="w-5 h-5 text-gray-500"></i>
                    </button>
                </div>
            </div>

            <div class="px-8 py-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                <!-- THÔNG TIN CÁ NHÂN -->
                <div class="mb-6">
                    <h3 class="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                        <i data-lucide="user" class="w-4 h-4 text-[#F875AA]"></i>
                        Thông tin cá nhân
                    </h3>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <p class="text-xs text-gray-500 mb-1">Mã nhân viên</p>
                            <p class="text-sm font-medium text-gray-800">${employee.employee_id}</p>
                        </div>
                        <div>
                            <p class="text-xs text-gray-500 mb-1">Họ và tên đệm</p>
                            <p class="text-sm font-medium text-gray-800">${employee.first_name}</p>
                        </div>
                        <div>
                            <p class="text-xs text-gray-500 mb-1">Tên</p>
                            <p class="text-sm font-medium text-gray-800">${employee.last_name}</p>
                        </div>
                        <div>
                            <p class="text-xs text-gray-500 mb-1">Email</p>
                            <p class="text-sm font-medium text-gray-800">${employee.email}</p>
                        </div>
                        <div>
                            <p class="text-xs text-gray-500 mb-1">Số điện thoại</p>
                            <p class="text-sm font-medium text-gray-800">${employee.phone || 'N/A'}</p>
                        </div>
                        <div>
                            <p class="text-xs text-gray-500 mb-1">Ngày sinh</p>
                            <p class="text-sm font-medium text-gray-800">${employee.date_of_birth ? new Date(employee.date_of_birth).toLocaleDateString('vi-VN') : 'N/A'}</p>
                        </div>
                        <div>
                            <p class="text-xs text-gray-500 mb-1">Giới tính</p>
                            <p class="text-sm font-medium text-gray-800 capitalize">${employee.gender === 'male' ? 'Nam' : employee.gender === 'female' ? 'Nữ' : 'Khác'}</p>
                        </div>
                        <div>
                            <p class="text-xs text-gray-500 mb-1">Trạng thái Gmail</p>
                            <p class="text-sm font-medium ${employee.have_gmail ? 'text-green-600' : 'text-red-600'}">${employee.have_gmail !== false ? '✓ Đã có gmail' : '✗ Chưa cập nhật gmail'}</p>
                        </div>
                    </div>
                </div>

                <!-- THÔNG TIN CÔNG VIỆC -->
                <div class="mb-6 pt-6 border-t border-gray-100">
                    <h3 class="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                        <i data-lucide="briefcase" class="w-4 h-4 text-[#AEDEFC]"></i>
                        Thông tin công việc
                    </h3>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <p class="text-xs text-gray-500 mb-1">Chức vụ</p>
                            <p class="text-sm font-medium text-gray-800">${employee.job_title}</p>
                        </div>
                        <div>
                            <p class="text-xs text-gray-500 mb-1">Phòng ban</p>
                            <p class="text-sm font-medium text-gray-800">${employee.department_name || 'N/A'}</p>
                        </div>
                        <div>
                            <p class="text-xs text-gray-500 mb-1">Loại hợp đồng</p>
                            <p class="text-sm font-medium text-gray-800 capitalize">${employee.employment_type === 'full-time' ? 'Toàn thời gian' : employee.employment_type === 'part-time' ? 'Bán thời gian' : employee.employment_type === 'contract' ? 'Hợp đồng' : employee.employment_type}</p>
                        </div>
                        <div>
                            <p class="text-xs text-gray-500 mb-1">Ngày bắt đầu</p>
                            <p class="text-sm font-medium text-gray-800">${new Date(employee.start_date).toLocaleDateString('vi-VN')}</p>
                        </div>
                        <div>
                            <p class="text-xs text-gray-500 mb-1">Vai trò hệ thống</p>
                            <p class="text-sm font-medium text-gray-800 capitalize">${employee.role === 'admin' ? 'Quản trị viên' : employee.role === 'manager' ? 'Quản lý' : 'Nhân viên'}</p>
                        </div>
                        <div>
                            <p class="text-xs text-gray-500 mb-1">Trạng thái</p>
                            <p class="text-sm font-medium ${employee.status === 'active' ? 'text-green-600' : 'text-gray-600'} capitalize">${employee.status === 'active' ? '✓ Đang làm việc' : employee.status === 'on-leave' ? 'Nghỉ phép' : 'Không hoạt động'}</p>
                        </div>
                        <div>
                            <p class="text-xs text-gray-500 mb-1">Hiệu suất</p>
                            <p class="text-sm font-medium text-gray-800">${employee.performance_score || 0}%</p>
                        </div>
                    </div>
                </div>

                <!-- THÔNG TIN LƯƠNG -->
                <div class="mb-6 pt-6 border-t border-gray-100">
                    <h3 class="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                        <i data-lucide="dollar-sign" class="w-4 h-4 text-green-500"></i>
                        Thông tin lương
                    </h3>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <p class="text-xs text-gray-500 mb-1">Mức lương</p>
                            <p class="text-sm font-medium text-gray-800">${employee.salary ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(employee.salary) : 'N/A'}</p>
                        </div>
                        <div>
                            <p class="text-xs text-gray-500 mb-1">Chu kỳ trả lương</p>
                            <p class="text-sm font-medium text-gray-800 capitalize">${employee.pay_frequency === 'monthly' ? 'Hàng tháng' : employee.pay_frequency === 'bi-weekly' ? 'Hai tuần/lần' : employee.pay_frequency === 'weekly' ? 'Hàng tuần' : employee.pay_frequency || 'N/A'}</p>
                        </div>
                    </div>
                </div>

                <!-- THÔNG TIN ĐỊA CHỈ -->
                <div class="mb-6 pt-6 border-t border-gray-100">
                    <h3 class="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                        <i data-lucide="map-pin" class="w-4 h-4 text-red-500"></i>
                        Địa chỉ
                    </h3>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="col-span-2">
                            <p class="text-xs text-gray-500 mb-1">Địa chỉ</p>
                            <p class="text-sm font-medium text-gray-800">${employee.address || 'N/A'}</p>
                        </div>
                        <div>
                            <p class="text-xs text-gray-500 mb-1">Thành phố</p>
                            <p class="text-sm font-medium text-gray-800">${employee.city || 'N/A'}</p>
                        </div>
                        <div>
                            <p class="text-xs text-gray-500 mb-1">Tỉnh/Thành</p>
                            <p class="text-sm font-medium text-gray-800">${employee.state || 'N/A'}</p>
                        </div>
                        <div>
                            <p class="text-xs text-gray-500 mb-1">Mã bưu điện</p>
                            <p class="text-sm font-medium text-gray-800">${employee.zip_code || 'N/A'}</p>
                        </div>
                        <div>
                            <p class="text-xs text-gray-500 mb-1">Quốc gia</p>
                            <p class="text-sm font-medium text-gray-800">${employee.country || 'N/A'}</p>
                        </div>
                    </div>
                </div>

                ${employee.subordinates && employee.subordinates.length > 0 ? `
                    <div class="mt-6 pt-6 border-t border-gray-100">
                        <h3 class="font-semibold text-gray-800 mb-3">Team Members (${employee.subordinates.length})</h3>
                        <div class="space-y-2">
                            ${employee.subordinates.map(sub => `
                                <div class="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                                    <div class="w-8 h-8 rounded-full bg-gradient-to-br from-[#AEDEFC] to-[#EDFFF0] flex items-center justify-center text-xs font-semibold">
                                        ${sub.first_name[0]}${sub.last_name[0]}
                                    </div>
                                    <div>
                                        <p class="text-sm font-medium text-gray-800">${sub.first_name} ${sub.last_name}</p>
                                        <p class="text-xs text-gray-500">${sub.job_title}</p>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>

            <div class="px-8 py-5 border-t border-gray-100 bg-gray-50">
                <button onclick="closeEmployeeDetailModal()" class="w-full py-3 bg-gradient-to-r from-[#F875AA] to-[#AEDEFC] text-white rounded-xl font-medium hover:shadow-lg transition-all">
                    Đóng cửa sổ
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    lucide.createIcons();
}

// Close employee detail modal
function closeEmployeeDetailModal() {
    const modal = document.getElementById('employeeDetailModal');
    if (modal) {
        modal.remove();
    }
}

// Open Add Employee Modal
async function openAddEmployeeModal() {
    try {
        // Fetch the modal HTML
        const response = await fetch('/employee-add-modal.html');
        const modalHTML = await response.text();

        // Inject into container
        const container = document.getElementById('modalContainer');
        container.innerHTML = modalHTML;

        // Show modal
        const modal = document.getElementById('addEmployeeModal');
        if (modal) {
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
            lucide.createIcons();

            // Load departments and setup form
            await loadDepartmentsForForm();
            setupModalFormHandler();
        }
    } catch (error) {
        console.error('Failed to load modal:', error);
        showError('Failed to open add employee form');
    }
}

// Setup form handler for dynamically loaded modal
function setupModalFormHandler() {
    console.log('🔧 Setting up modal handlers...');

    const addForm = document.getElementById('addEmployeeForm');
    if (addForm) {
        addForm.addEventListener('submit', handleAddEmployee);
        console.log('✅ Form submit handler attached');
    }

    // Setup photo upload
    const photoInput = document.getElementById('photoInput');
    const previewAvatar = document.getElementById('previewAvatar');

    if (photoInput) {
        console.log('✅ Photo input found, attaching listener...');
        photoInput.addEventListener('change', function(e) {
            console.log('📸 Photo change event fired');
            const file = e.target.files[0];
            if (file) {
                console.log('📁 File selected:', file.name, file.size, 'bytes');
                handlePhotoUpload(file);
            } else {
                console.log('⚠️ No file selected');
            }
        });
    } else {
        console.error('❌ Photo input not found!');
    }

    // Setup paste from clipboard
    if (previewAvatar) {
        console.log('✅ Preview avatar found, setting up clipboard paste...');

        // Make avatar focusable and show hint
        previewAvatar.setAttribute('tabindex', '0');
        previewAvatar.style.outline = 'none';

        // Add visual feedback when focused
        previewAvatar.addEventListener('focus', function() {
            this.style.borderColor = '#F875AA';
            this.style.borderWidth = '3px';
            console.log('📋 Avatar focused - ready for paste (Ctrl+V or Win+V)');
        });

        previewAvatar.addEventListener('blur', function() {
            this.style.borderColor = '';
            this.style.borderWidth = '2px';
        });

        // Handle paste event
        previewAvatar.addEventListener('paste', async function(e) {
            console.log('📋 Paste event detected!');
            e.preventDefault();

            const items = e.clipboardData.items;
            console.log('📋 Clipboard items:', items.length);

            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                console.log('📋 Item type:', item.type);

                // Check if item is an image
                if (item.type.indexOf('image') !== -1) {
                    console.log('✅ Image found in clipboard!');
                    const file = item.getAsFile();

                    if (file) {
                        console.log('📁 Pasted file:', file.name, file.size, 'bytes');
                        handlePhotoUpload(file);
                        showSuccess('Ảnh đã được paste từ clipboard!');
                        return;
                    }
                }
            }

            console.log('⚠️ No image found in clipboard');
            showError('Không tìm thấy hình ảnh trong clipboard. Vui lòng copy một hình ảnh và thử lại.');
        });

        console.log('✅ Clipboard paste setup complete');
    }

    // Also setup paste for the whole document (as fallback)
    document.addEventListener('paste', async function(e) {
        // Only handle if modal is open and no other input is focused
        const modal = document.getElementById('addEmployeeModal');
        const activeElement = document.activeElement;

        if (modal && !modal.classList.contains('hidden')) {
            // Don't intercept if user is typing in an input field
            if (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA') {
                return;
            }

            console.log('📋 Document paste event (modal open)');
            const items = e.clipboardData.items;

            for (let i = 0; i < items.length; i++) {
                const item = items[i];

                if (item.type.indexOf('image') !== -1) {
                    e.preventDefault();
                    console.log('✅ Image pasted in document!');
                    const file = item.getAsFile();

                    if (file) {
                        handlePhotoUpload(file);
                        showSuccess('Ảnh đã được paste từ clipboard!');
                        return;
                    }
                }
            }
        }
    });
}

// Close Add Employee Modal
function closeAddEmployeeModal() {
    const modal = document.getElementById('addEmployeeModal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';

        // Clear modal container after animation
        setTimeout(() => {
            const container = document.getElementById('modalContainer');
            if (container) {
                container.innerHTML = '';
            }
        }, 300);
    }
}

// Load departments for form
async function loadDepartmentsForForm() {
    try {
        const response = await api.getDepartments();
        if (response.success) {
            const select = document.querySelector('#addEmployeeForm select[name="department"]');
            if (select) {
                select.innerHTML = '<option value="">Select department</option>' +
                    response.data.map(dept =>
                        `<option value="${dept.id}">${dept.name}</option>`
                    ).join('');
            }
        }
    } catch (error) {
        console.error('Failed to load departments:', error);
    }
}

// Handle add employee form submission
async function handleAddEmployee(event) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);

    console.log('📤 Form submission - uploadedPhotoFile status:', uploadedPhotoFile ? 'HAS PHOTO' : 'NO PHOTO');

    try {
        showLoading();

        // Step 1: Upload photo if exists
        let photoPath = null;
        if (uploadedPhotoFile) {
            console.log('📤 Uploading photo first...');
            const uploadResult = await uploadPhotoFile(uploadedPhotoFile);
            photoPath = uploadResult.path;
            console.log('✅ Photo uploaded:', photoPath);
        }

        // Step 2: Create employee with photo path
        const employeeData = {
            first_name: formData.get('first_name'),
            last_name: formData.get('last_name'),
            email: formData.get('email'),
            employee_id: formData.get('employee_id'), // Mã nhân viên
            phone: formData.get('phone'),
            date_of_birth: formData.get('date_of_birth'),
            gender: formData.get('gender'),
            job_title: formData.get('job_title'),
            department_id: formData.get('department') ? parseInt(formData.get('department')) : null,
            employment_type: formData.get('employment_type'),
            start_date: formData.get('start_date'),
            salary: formData.get('salary') ? parseFloat(formData.get('salary')) : null,
            pay_frequency: formData.get('pay_frequency'),
            address: formData.get('address'),
            city: formData.get('city'),
            state: formData.get('state'),
            zip_code: formData.get('zip_code'),
            country: formData.get('country'),
            photo: photoPath // Store photo path, not base64
        };

        console.log('📋 Employee data to be sent:', {
            ...employeeData,
            photo: employeeData.photo || 'NO PHOTO'
        });

        const response = await api.createEmployee(employeeData);

        if (response.success) {
            hideLoading();
            showSuccess('Employee added successfully!');
            closeAddEmployeeModal();
            form.reset();
            uploadedPhoto = null;
            uploadedPhotoFile = null; // Reset uploaded photo file

            // Reload employee list to show new employee immediately
            await loadEmployees();
        }
    } catch (error) {
        hideLoading();
        console.error('Failed to create employee:', error);
        showError(error.message || 'Failed to create employee');
    }
}

// Global variable to store uploaded photo
let uploadedPhoto = null;
let uploadedPhotoFile = null;

// Handle photo upload in modal
async function handlePhotoUpload(file) {
    console.log('🖼️ handlePhotoUpload called with file:', file);

    if (!file) {
        console.log('❌ No file provided');
        return;
    }

    console.log('📋 File details:', {
        name: file.name,
        type: file.type,
        size: file.size
    });

    // Store file for later upload
    uploadedPhotoFile = file;

    // Validate file type
    if (!file.type.startsWith('image/')) {
        console.log('❌ Invalid file type:', file.type);
        showError('Please select an image file');
        return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        console.log('❌ File too large:', file.size);
        showError('Image size should be less than 5MB');
        return;
    }

    console.log('✅ File validation passed, creating preview...');

    // Create preview for UI
    const reader = new FileReader();
    reader.onload = function(e) {
        const previewUrl = e.target.result;
        console.log('✅ Photo preview created');

        // Update UI to show preview - use the correct ID from modal
        const previewAvatar = document.getElementById('previewAvatar');
        const previewIcon = document.getElementById('previewIcon');

        if (previewAvatar) {
            console.log('✅ Updating photo preview UI');

            // Hide the camera icon
            if (previewIcon) {
                previewIcon.style.display = 'none';
            }

            // Update the preview container to show the image
            previewAvatar.style.borderStyle = 'solid';
            previewAvatar.style.padding = '0';
            previewAvatar.innerHTML = `<img src="${previewUrl}" alt="Preview" class="w-full h-full object-cover rounded-full">`;

            console.log('✅ Photo preview updated successfully!');
        } else {
            console.error('❌ #previewAvatar element not found!');
        }
    };
    reader.onerror = function(error) {
        console.error('❌ FileReader error:', error);
        showError('Failed to read image file');
    };
    reader.readAsDataURL(file);
}

// Open Edit Employee Modal
async function openEditEmployeeModal(employeeId) {
    try {
        showLoading();

        // Fetch employee data
        const response = await api.getEmployee(employeeId);

        if (!response.success) {
            throw new Error('Failed to fetch employee data');
        }

        const employee = response.data;

        // Fetch departments for dropdown
        const deptResponse = await api.getDepartments();
        const departments = deptResponse.success ? deptResponse.data : [];

        hideLoading();

        // Create modal
        const modal = document.createElement('div');
        modal.id = 'editEmployeeModal';
        modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4';

        modal.innerHTML = `
            <div class="absolute inset-0 bg-gray-900/50 backdrop-blur-sm backdrop-in" onclick="closeEditEmployeeModal()"></div>
            <div class="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden modal-in">
                <!-- Header -->
                <div class="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-[#FDEDED]/50 to-[#EDFFF0]/50">
                    <div class="flex items-center justify-between">
                        <div>
                            <h2 class="text-2xl font-semibold text-gray-800">Cập nhật thông tin nhân viên</h2>
                            <p class="text-gray-500 text-sm mt-1">${employee.first_name} ${employee.last_name} - ${employee.employee_id}</p>
                        </div>
                        <button onclick="closeEditEmployeeModal()" class="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all">
                            <i data-lucide="x" class="w-5 h-5 text-gray-500"></i>
                        </button>
                    </div>
                </div>

                <!-- Form -->
                <form id="editEmployeeForm" class="px-8 py-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                    <input type="hidden" name="id" value="${employee.id}">

                    <!-- Photo Upload -->
                    <div class="mb-6 text-center">
                        <label class="block text-sm font-medium text-gray-700 mb-3">Ảnh đại diện</label>
                        <div class="flex justify-center">
                            <label for="editPhotoInput" class="cursor-pointer group">
                                <div id="editPreviewAvatar" class="w-24 h-24 rounded-full border-4 border-dashed border-gray-300 group-hover:border-[#F875AA] transition-all flex items-center justify-center overflow-hidden ${employee.photo ? 'p-0 border-solid' : 'p-4'}">
                                    ${employee.photo
                                        ? `<img src="${employee.photo}" alt="Current photo" class="w-full h-full object-cover rounded-full">`
                                        : `<i data-lucide="camera" id="editPreviewIcon" class="w-8 h-8 text-gray-400 group-hover:text-[#F875AA]"></i>`
                                    }
                                </div>
                                <input type="file" id="editPhotoInput" accept="image/*" class="hidden">
                            </label>
                        </div>
                        <p class="text-xs text-gray-500 mt-2">Click để thay đổi ảnh (tối đa 5MB)</p>
                    </div>

                    <div class="grid grid-cols-2 gap-6">
                        <!-- Basic Info -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Họ *</label>
                            <input type="text" name="first_name" value="${employee.first_name}" required
                                   class="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 focus:border-[#F875AA] focus:outline-none">
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Tên *</label>
                            <input type="text" name="last_name" value="${employee.last_name}" required
                                   class="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 focus:border-[#F875AA] focus:outline-none">
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                            <input type="email" name="email" value="${employee.email}" required
                                   class="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 focus:border-[#F875AA] focus:outline-none">
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Mã nhân viên *</label>
                            <input type="text" name="employee_id" value="${employee.employee_id}" required
                                   class="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 focus:border-[#F875AA] focus:outline-none">
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Số điện thoại</label>
                            <input type="tel" name="phone" value="${employee.phone || ''}"
                                   class="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 focus:border-[#F875AA] focus:outline-none">
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Ngày sinh</label>
                            <input type="date" name="date_of_birth" value="${employee.date_of_birth ? employee.date_of_birth.split('T')[0] : ''}"
                                   class="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 focus:border-[#F875AA] focus:outline-none">
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Giới tính</label>
                            <select name="gender" class="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 focus:border-[#F875AA] focus:outline-none">
                                <option value="male" ${employee.gender === 'male' ? 'selected' : ''}>Nam</option>
                                <option value="female" ${employee.gender === 'female' ? 'selected' : ''}>Nữ</option>
                                <option value="other" ${employee.gender === 'other' ? 'selected' : ''}>Khác</option>
                            </select>
                        </div>

                        <!-- Job Info -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Chức vụ *</label>
                            <input type="text" name="job_title" value="${employee.job_title}" required
                                   class="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 focus:border-[#F875AA] focus:outline-none">
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Phòng ban</label>
                            <select name="department_id" class="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 focus:border-[#F875AA] focus:outline-none">
                                <option value="">Chọn phòng ban</option>
                                ${departments.map(dept =>
                                    `<option value="${dept.id}" ${employee.department_id === dept.id ? 'selected' : ''}>${dept.name}</option>`
                                ).join('')}
                            </select>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Loại hợp đồng *</label>
                            <select name="employment_type" required class="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 focus:border-[#F875AA] focus:outline-none">
                                <option value="full-time" ${employee.employment_type === 'full-time' ? 'selected' : ''}>Toàn thời gian</option>
                                <option value="part-time" ${employee.employment_type === 'part-time' ? 'selected' : ''}>Bán thời gian</option>
                                <option value="contract" ${employee.employment_type === 'contract' ? 'selected' : ''}>Hợp đồng</option>
                            </select>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu *</label>
                            <input type="date" name="start_date" value="${employee.start_date ? employee.start_date.split('T')[0] : ''}" required
                                   class="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 focus:border-[#F875AA] focus:outline-none">
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Lương</label>
                            <input type="number" name="salary" value="${employee.salary || ''}" step="0.01"
                                   class="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 focus:border-[#F875AA] focus:outline-none">
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Chu kỳ trả lương</label>
                            <select name="pay_frequency" class="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 focus:border-[#F875AA] focus:outline-none">
                                <option value="monthly" ${employee.pay_frequency === 'monthly' ? 'selected' : ''}>Hàng tháng</option>
                                <option value="bi-weekly" ${employee.pay_frequency === 'bi-weekly' ? 'selected' : ''}>Hai tuần/lần</option>
                                <option value="weekly" ${employee.pay_frequency === 'weekly' ? 'selected' : ''}>Hàng tuần</option>
                            </select>
                        </div>

                        <!-- Address -->
                        <div class="col-span-2">
                            <label class="block text-sm font-medium text-gray-700 mb-2">Địa chỉ</label>
                            <input type="text" name="address" value="${employee.address || ''}"
                                   class="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 focus:border-[#F875AA] focus:outline-none">
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Thành phố</label>
                            <input type="text" name="city" value="${employee.city || ''}"
                                   class="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 focus:border-[#F875AA] focus:outline-none">
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Tỉnh/Thành</label>
                            <input type="text" name="state" value="${employee.state || ''}"
                                   class="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 focus:border-[#F875AA] focus:outline-none">
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Mã bưu điện</label>
                            <input type="text" name="zip_code" value="${employee.zip_code || ''}"
                                   class="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 focus:border-[#F875AA] focus:outline-none">
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Quốc gia</label>
                            <input type="text" name="country" value="${employee.country || ''}"
                                   class="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 focus:border-[#F875AA] focus:outline-none">
                        </div>

                        <!-- Status and Role -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
                            <select name="status" class="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 focus:border-[#F875AA] focus:outline-none">
                                <option value="active" ${employee.status === 'active' ? 'selected' : ''}>Đang làm việc</option>
                                <option value="on-leave" ${employee.status === 'on-leave' ? 'selected' : ''}>Nghỉ phép</option>
                                <option value="inactive" ${employee.status === 'inactive' ? 'selected' : ''}>Không hoạt động</option>
                            </select>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Vai trò</label>
                            <select name="role" class="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 focus:border-[#F875AA] focus:outline-none">
                                <option value="employee" ${employee.role === 'employee' ? 'selected' : ''}>Nhân viên</option>
                                <option value="manager" ${employee.role === 'manager' ? 'selected' : ''}>Quản lý</option>
                                <option value="admin" ${employee.role === 'admin' ? 'selected' : ''}>Admin</option>
                            </select>
                        </div>
                    </div>
                </form>

                <!-- Footer -->
                <div class="px-8 py-5 border-t border-gray-100 bg-gray-50 flex gap-3">
                    <button onclick="closeEditEmployeeModal()" type="button"
                            class="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-all">
                        Hủy
                    </button>
                    <button onclick="handleUpdateEmployee()" type="button"
                            class="flex-1 py-3 bg-gradient-to-r from-[#F875AA] to-[#AEDEFC] text-white rounded-xl font-medium hover:shadow-lg transition-all">
                        Cập nhật
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        lucide.createIcons();

        // Setup photo upload for edit modal
        setupEditPhotoUpload();

    } catch (error) {
        hideLoading();
        console.error('Failed to open edit modal:', error);
        showError('Không thể mở form cập nhật');
    }
}

// Close Edit Employee Modal
function closeEditEmployeeModal() {
    const modal = document.getElementById('editEmployeeModal');
    if (modal) {
        modal.remove();
        document.body.style.overflow = '';
        editUploadedPhoto = null;
    }
}

// Global variable for edit modal photo
let editUploadedPhoto = null;
let editUploadedPhotoFile = null;

// Setup photo upload for edit modal
function setupEditPhotoUpload() {
    const photoInput = document.getElementById('editPhotoInput');
    const editPreviewAvatar = document.getElementById('editPreviewAvatar');

    if (photoInput) {
        photoInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                handleEditPhotoUpload(file);
            }
        });
    }

    // Setup paste from clipboard for edit modal
    if (editPreviewAvatar) {
        console.log('✅ Edit preview avatar found, setting up clipboard paste...');

        // Make avatar focusable
        editPreviewAvatar.setAttribute('tabindex', '0');
        editPreviewAvatar.style.outline = 'none';

        // Add visual feedback when focused
        editPreviewAvatar.addEventListener('focus', function() {
            this.style.borderColor = '#F875AA';
            this.style.borderWidth = '3px';
            console.log('📋 Edit avatar focused - ready for paste');
        });

        editPreviewAvatar.addEventListener('blur', function() {
            this.style.borderColor = '';
            this.style.borderWidth = '2px';
        });

        // Handle paste event
        editPreviewAvatar.addEventListener('paste', async function(e) {
            console.log('📋 Paste event in edit modal!');
            e.preventDefault();

            const items = e.clipboardData.items;

            for (let i = 0; i < items.length; i++) {
                const item = items[i];

                if (item.type.indexOf('image') !== -1) {
                    const file = item.getAsFile();

                    if (file) {
                        console.log('📁 Pasted file in edit modal:', file.name);
                        handleEditPhotoUpload(file);
                        showSuccess('Ảnh đã được paste từ clipboard!');
                        return;
                    }
                }
            }

            showError('Không tìm thấy hình ảnh trong clipboard.');
        });
    }
}

// Handle photo upload in edit modal
function handleEditPhotoUpload(file) {
    if (!file.type.startsWith('image/')) {
        showError('Vui lòng chọn file ảnh');
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        showError('Kích thước ảnh phải nhỏ hơn 5MB');
        return;
    }

    // Store file for later upload to Cloudinary
    editUploadedPhotoFile = file;

    // Create preview (base64 only for UI, not for upload)
    const reader = new FileReader();
    reader.onload = function(e) {
        const previewUrl = e.target.result;

        const previewAvatar = document.getElementById('editPreviewAvatar');
        const previewIcon = document.getElementById('editPreviewIcon');

        if (previewAvatar) {
            if (previewIcon) {
                previewIcon.style.display = 'none';
            }

            previewAvatar.style.borderStyle = 'solid';
            previewAvatar.style.padding = '0';
            previewAvatar.innerHTML = `<img src="${previewUrl}" alt="Preview" class="w-full h-full object-cover rounded-full">`;
        }
    };
    reader.readAsDataURL(file);
}

// Handle update employee
async function handleUpdateEmployee() {
    try {
        showLoading();

        const form = document.getElementById('editEmployeeForm');
        const formData = new FormData(form);

        // Step 1: Upload photo to Cloudinary if user selected new photo
        let photoPath = null;
        if (editUploadedPhotoFile) {
            console.log('📤 Uploading photo to Cloudinary...');
            try {
                const uploadResult = await uploadPhotoFile(editUploadedPhotoFile);
                photoPath = uploadResult.path; // This is Cloudinary URL
                console.log('✅ Photo uploaded to Cloudinary:', photoPath);
            } catch (error) {
                hideLoading();
                console.error('Failed to upload photo:', error);
                showError('Failed to upload photo: ' + error.message);
                return;
            }
        }

        // Step 2: Prepare employee data
        const employeeData = {
            first_name: formData.get('first_name'),
            last_name: formData.get('last_name'),
            email: formData.get('email'),
            employee_id: formData.get('employee_id'),
            phone: formData.get('phone'),
            date_of_birth: formData.get('date_of_birth'),
            gender: formData.get('gender'),
            job_title: formData.get('job_title'),
            department_id: formData.get('department_id') ? parseInt(formData.get('department_id')) : null,
            employment_type: formData.get('employment_type'),
            start_date: formData.get('start_date'),
            salary: formData.get('salary') ? parseFloat(formData.get('salary')) : null,
            pay_frequency: formData.get('pay_frequency'),
            address: formData.get('address'),
            city: formData.get('city'),
            state: formData.get('state'),
            zip_code: formData.get('zip_code'),
            country: formData.get('country'),
            status: formData.get('status'),
            role: formData.get('role')
        };

        // Include photo URL from Cloudinary if uploaded
        if (photoPath) {
            employeeData.photo = photoPath;
            console.log('📷 Updating employee with Cloudinary photo URL:', photoPath);
        }

        // Step 3: Update employee in database
        const employeeId = formData.get('id');
        const response = await api.updateEmployee(employeeId, employeeData);

        if (response.success) {
            hideLoading();
            showSuccess('Cập nhật thông tin nhân viên thành công!');
            closeEditEmployeeModal();

            // Reset upload variables
            editUploadedPhoto = null;
            editUploadedPhotoFile = null;

            await loadEmployees();
        }
    } catch (error) {
        hideLoading();
        console.error('Failed to update employee:', error);
        showError(error.message || 'Không thể cập nhật thông tin nhân viên');
    }
}

// Delete employee
async function deleteEmployee(employeeId, employeeName) {
    if (!confirm(`Bạn có chắc chắn muốn xóa nhân viên "${employeeName}"?\n\nHành động này không thể hoàn tác!`)) {
        return;
    }

    try {
        showLoading();
        const response = await api.deleteEmployee(employeeId);

        if (response.success) {
            hideLoading();
            showSuccess(`Đã xóa nhân viên "${employeeName}" thành công!`);
            await loadEmployees();
        }
    } catch (error) {
        hideLoading();
        console.error('Failed to delete employee:', error);
        showError(error.message || 'Không thể xóa nhân viên');
    }
}

// Delete all employees
async function deleteAllEmployees() {
    if (allEmployees.length === 0) {
        showError('Không có nhân viên nào để xóa');
        return;
    }

    // Get current user to skip them and admins
    const currentUser = api.getUser();
    const currentUserId = currentUser?.id;

    // Filter out current user and admins
    const employeesToDelete = allEmployees.filter(emp => {
        // Skip current user (owner/admin who is logged in)
        if (emp.id === currentUserId) {
            return false;
        }
        // Skip all admin users
        if (emp.role === 'admin') {
            return false;
        }
        return true;
    });

    // Count skipped employees
    const skippedCount = allEmployees.length - employeesToDelete.length;
    const skippedAdmins = allEmployees.filter(emp => emp.role === 'admin' && emp.id !== currentUserId).length;
    const skippedCurrentUser = currentUserId && allEmployees.some(emp => emp.id === currentUserId) ? 1 : 0;

    if (employeesToDelete.length === 0) {
        showError('Không có nhân viên nào để xóa (đã bỏ qua admin và tài khoản đang đăng nhập)');
        return;
    }

    let skipInfo = '';
    if (skippedCount > 0) {
        skipInfo = `\n\n📌 Sẽ bỏ qua ${skippedCount} tài khoản:`;
        if (skippedCurrentUser > 0) {
            skipInfo += `\n   • Tài khoản đang đăng nhập (${currentUser.first_name} ${currentUser.last_name})`;
        }
        if (skippedAdmins > 0) {
            skipInfo += `\n   • ${skippedAdmins} tài khoản Admin`;
        }
    }

    const confirmMessage = `⚠️ CẢNH BÁO: Bạn sắp xóa ${employeesToDelete.length} nhân viên!${skipInfo}\n\nHành động này KHÔNG THỂ hoàn tác!\n\nBạn có chắc chắn muốn tiếp tục?`;

    if (!confirm(confirmMessage)) {
        return;
    }

    // Double confirmation for safety
    const doubleConfirm = prompt(`Để xác nhận xóa ${employeesToDelete.length} nhân viên, vui lòng nhập "XOA TAT CA":`);

    if (doubleConfirm !== 'XOA TAT CA') {
        showError('Xác nhận không đúng. Hủy thao tác xóa.');
        return;
    }

    try {
        showLoading();

        let successCount = 0;
        let failCount = 0;
        const errors = [];
        const totalEmployees = employeesToDelete.length;

        // Delete employees one by one (excluding admins and current user)
        for (let i = 0; i < employeesToDelete.length; i++) {
            const emp = employeesToDelete[i];

            try {
                const response = await api.deleteEmployee(emp.id);

                if (response.success) {
                    successCount++;
                    console.log(`✅ Deleted: ${emp.first_name} ${emp.last_name}`);
                } else {
                    failCount++;
                    errors.push(`${emp.first_name} ${emp.last_name}: ${response.message || 'Unknown error'}`);
                }
            } catch (error) {
                failCount++;
                errors.push(`${emp.first_name} ${emp.last_name}: ${error.message}`);
                console.error(`❌ Failed to delete ${emp.first_name} ${emp.last_name}:`, error);
            }

            // Small delay to avoid overwhelming the server (reduced for faster bulk delete up to 300 employees)
            await new Promise(resolve => setTimeout(resolve, 10));
        }

        hideLoading();

        // Show results
        let resultMessage = '';
        if (failCount === 0) {
            resultMessage = `Đã xóa thành công ${successCount} nhân viên!`;
            if (skippedCount > 0) {
                resultMessage += ` (Đã bỏ qua ${skippedCount} tài khoản admin/owner)`;
            }
            showSuccess(resultMessage);
        } else {
            showError(`Đã xóa ${successCount}/${totalEmployees} nhân viên. Thất bại: ${failCount}\n\nLỗi:\n${errors.join('\n')}`);
        }

        // Reload employee list
        await loadEmployees();

    } catch (error) {
        hideLoading();
        console.error('Failed to delete all employees:', error);
        showError(error.message || 'Không thể xóa tất cả nhân viên');
    }
}

// Initialize employees page
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initializing employees page...');
    loadEmployees();
    lucide.createIcons();

    // Setup search
    const searchInput = document.querySelector('input[placeholder="Tìm nhân viên theo tên..."]');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }

    // Photo upload will be setup when modal opens (in setupModalFormHandler)

    // Close modal on escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeAddEmployeeModal();
            closeEmployeeDetailModal();
            closeEditEmployeeModal();
        }
    });
});

// Toggle Gmail Status
async function toggleGmailStatus(employeeId, currentStatus) {
    try {
        const newStatus = !currentStatus;
        const statusText = newStatus ? 'Đã có gmail' : 'Chưa cập nhật gmail';

        // Confirm action
        if (!confirm(`Thay đổi trạng thái Gmail thành "${statusText}"?`)) {
            return;
        }

        showLoading();

        // Update employee
        const response = await api.updateEmployee(employeeId, {
            have_gmail: newStatus
        });

        if (response.success) {
            hideLoading();
            showSuccess(`Đã cập nhật trạng thái Gmail: ${statusText}`);
            // Reload employees to reflect changes
            await loadEmployees();
        }
    } catch (error) {
        hideLoading();
        console.error('Failed to update Gmail status:', error);
        showError('Không thể cập nhật trạng thái Gmail');
    }
}

// Open Filter Modal
async function openFilterModal() {
    try {
        showLoading();

        // Fetch departments
        const response = await api.getDepartments();
        hideLoading();

        if (!response.success) {
            showError('Không thể tải danh sách phòng ban');
            return;
        }

        const departments = response.data;

        // Create modal HTML
        const modalHTML = `
            <div id="filterModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
                <!-- Backdrop -->
                <div class="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onclick="closeFilterModal()"></div>

                <!-- Modal Content -->
                <div class="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
                    <!-- Header -->
                    <div class="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-[#FDEDED]/50 to-[#EDFFF0]/50">
                        <div class="flex items-center justify-between">
                            <div>
                                <h2 class="text-2xl font-semibold text-gray-800">Lọc theo phòng ban</h2>
                                <p class="text-sm text-gray-500 mt-1">Chọn phòng ban để lọc nhân viên</p>
                            </div>
                            <button onclick="closeFilterModal()" class="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                                <i data-lucide="x" class="w-5 h-5 text-gray-500"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Body -->
                    <div class="px-8 py-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            ${departments.map(dept => `
                                <label class="flex items-center gap-3 p-4 border-2 border-gray-100 rounded-xl hover:border-[#F875AA]/30 cursor-pointer transition-all group">
                                    <input type="checkbox"
                                           class="department-filter-checkbox w-5 h-5 rounded border-gray-300 text-[#F875AA] focus:ring-[#F875AA]"
                                           value="${dept.id}"
                                           data-department-name="${dept.name}">
                                    <div class="flex-1">
                                        <p class="text-sm font-medium text-gray-800 group-hover:text-[#F875AA] transition-colors">${dept.name}</p>
                                        <p class="text-xs text-gray-500">${dept.employee_count || 0} nhân viên</p>
                                    </div>
                                </label>
                            `).join('')}
                        </div>

                        <!-- Select All / Deselect All -->
                        <div class="mt-6 flex gap-3">
                            <button onclick="selectAllDepartments()" class="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors">
                                Chọn tất cả
                            </button>
                            <button onclick="deselectAllDepartments()" class="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors">
                                Bỏ chọn tất cả
                            </button>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div class="px-8 py-5 border-t border-gray-100 bg-gray-50 flex gap-3">
                        <button onclick="closeFilterModal()" type="button"
                                class="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-all">
                            Hủy
                        </button>
                        <button onclick="applyDepartmentFilter()" type="button"
                                class="flex-1 py-3 bg-gradient-to-r from-[#F875AA] to-[#AEDEFC] text-white rounded-xl font-medium hover:shadow-lg transition-all">
                            Bắt đầu lọc
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Inject modal into body
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHTML;
        document.body.appendChild(modalContainer);
        document.body.style.overflow = 'hidden';

        // Initialize Lucide icons
        lucide.createIcons();

    } catch (error) {
        hideLoading();
        console.error('Failed to open filter modal:', error);
        showError('Không thể mở bộ lọc');
    }
}

// Close Filter Modal
function closeFilterModal() {
    const modal = document.getElementById('filterModal');
    if (modal) {
        modal.remove();
        document.body.style.overflow = '';
    }
}

// Select All Departments
function selectAllDepartments() {
    const checkboxes = document.querySelectorAll('.department-filter-checkbox');
    checkboxes.forEach(checkbox => checkbox.checked = true);
}

// Deselect All Departments
function deselectAllDepartments() {
    const checkboxes = document.querySelectorAll('.department-filter-checkbox');
    checkboxes.forEach(checkbox => checkbox.checked = false);
}

// Apply Department Filter
async function applyDepartmentFilter() {
    const checkboxes = document.querySelectorAll('.department-filter-checkbox:checked');
    const selectedDepartments = Array.from(checkboxes).map(cb => cb.value);

    console.log('Selected departments:', selectedDepartments);

    if (selectedDepartments.length === 0) {
        showError('Vui lòng chọn ít nhất một phòng ban');
        return;
    }

    closeFilterModal();

    // Update filter and apply client-side filtering (instant)
    if (selectedDepartments.length === 1) {
        // Single department selected
        currentFilters.department = selectedDepartments[0];
    } else {
        // Multiple departments - need custom filter
        currentFilters.department = ''; // Clear single filter
        currentFilters.departments = selectedDepartments; // Store multiple
    }

    applyFilters();

    const filteredCount = currentEmployees.length;
    showSuccess(`Đã lọc ${filteredCount} nhân viên từ ${selectedDepartments.length} phòng ban`);
}

// ==================== BULK IMPORT FUNCTIONS ====================

let selectedExcelFile = null;

// Open Bulk Import Modal
async function openBulkImportModal() {
    try {
        // Fetch the modal HTML
        const response = await fetch('/employee-bulk-import-modal.html');
        const modalHTML = await response.text();

        // Inject into container
        const container = document.getElementById('modalContainer');
        container.innerHTML = modalHTML;

        // Show modal
        const modal = document.getElementById('bulkImportModal');
        if (modal) {
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
            lucide.createIcons();

            // Setup file upload handlers
            setupBulkImportHandlers();
        }
    } catch (error) {
        console.error('Failed to load bulk import modal:', error);
        showError('Không thể mở form nhập hàng loạt');
    }
}

// Close Bulk Import Modal
function closeBulkImportModal() {
    const modal = document.getElementById('bulkImportModal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';

        // Clear state
        selectedExcelFile = null;

        // Clear modal container after animation
        setTimeout(() => {
            const container = document.getElementById('modalContainer');
            if (container) {
                container.innerHTML = '';
            }
        }, 300);
    }
}

// Setup file upload handlers
function setupBulkImportHandlers() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('excelFileInput');

    // Click to select file
    dropZone.addEventListener('click', () => {
        if (!document.getElementById('fileSelected').classList.contains('hidden')) {
            return; // Don't trigger if file already selected
        }
        fileInput.click();
    });

    // File input change
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            handleFileSelect(file);
        }
    });

    // Drag and drop
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('border-[#F875AA]', 'bg-gradient-to-br', 'from-[#FDEDED]/30', 'to-[#EDFFF0]/30');
    });

    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.classList.remove('border-[#F875AA]', 'bg-gradient-to-br', 'from-[#FDEDED]/30', 'to-[#EDFFF0]/30');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('border-[#F875AA]', 'bg-gradient-to-br', 'from-[#FDEDED]/30', 'to-[#EDFFF0]/30');

        const file = e.dataTransfer.files[0];
        if (file) {
            handleFileSelect(file);
        }
    });
}

// Handle file selection
function handleFileSelect(file) {
    // Validate file type
    const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
    ];

    if (!validTypes.includes(file.type) && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        showError('Vui lòng chọn file Excel (.xlsx hoặc .xls)');
        return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
        showError('Kích thước file không được vượt quá 10MB');
        return;
    }

    selectedExcelFile = file;

    // Update UI
    document.getElementById('uploadPrompt').classList.add('hidden');
    document.getElementById('fileSelected').classList.remove('hidden');
    document.getElementById('fileName').textContent = file.name;
    document.getElementById('fileSize').textContent = `${(file.size / 1024).toFixed(2)} KB`;
    document.getElementById('startImportBtn').disabled = false;

    console.log('✅ File selected:', file.name);
}

// Clear selected file
function clearSelectedFile() {
    selectedExcelFile = null;
    document.getElementById('uploadPrompt').classList.remove('hidden');
    document.getElementById('fileSelected').classList.add('hidden');
    document.getElementById('excelFileInput').value = '';
    document.getElementById('startImportBtn').disabled = true;
    document.getElementById('importResults').classList.add('hidden');
}

// Start bulk import
async function startBulkImport() {
    if (!selectedExcelFile) {
        showError('Vui lòng chọn file Excel');
        return;
    }

    try {
        // Hide results from previous import
        document.getElementById('importResults').classList.add('hidden');
        document.getElementById('importProgress').classList.remove('hidden');
        document.getElementById('startImportBtn').disabled = true;

        // Scroll to bottom of modal body to show progress bar
        const modalBody = document.querySelector('#bulkImportModal .overflow-y-auto');
        if (modalBody) {
            // Small delay to ensure progress bar is visible before scrolling
            setTimeout(() => {
                modalBody.scrollTo({ top: modalBody.scrollHeight, behavior: 'smooth' });
            }, 100);
        }

        // Read Excel file
        console.log('📖 Reading Excel file...');
        const employeesData = await readExcelFile(selectedExcelFile);

        if (!employeesData || employeesData.length === 0) {
            throw new Error('File Excel không có dữ liệu hoặc định dạng không đúng');
        }

        console.log(`📊 Found ${employeesData.length} employees in Excel file`);
        console.log('📋 Sample data (first row):', employeesData[0]);
        console.log('📋 All column names:', Object.keys(employeesData[0]));

        // Get departments for mapping
        const deptResponse = await api.getDepartments();
        const departments = deptResponse.success ? deptResponse.data : [];
        const deptMap = {};
        departments.forEach(dept => {
            deptMap[dept.name.toLowerCase()] = dept.id;
        });

        // Helper function to get value from multiple possible column names
        const getFieldValue = (empData, possibleNames) => {
            // First, try to find column with exact match or trimmed match
            for (const key of Object.keys(empData)) {
                const trimmedKey = key.trim();
                for (const name of possibleNames) {
                    if (key === name || trimmedKey === name.trim()) {
                        const value = empData[key];
                        if (value !== undefined && value !== null && value !== '') {
                            return value;
                        }
                    }
                }
            }
            return null;
        };

        // Import employees one by one
        let successCount = 0;
        let failCount = 0;
        const errors = [];
        const importedRows = new Set(); // Track successfully imported rows to avoid duplicates

        for (let i = 0; i < employeesData.length; i++) {
            const empData = employeesData[i];
            const rowNumber = i + 2; // +2 because row 1 is header, and index starts at 0

            // Skip if already imported
            if (importedRows.has(i)) {
                console.log(`⏭️ Row ${rowNumber}: Already imported, skipping`);
                continue;
            }

            // Update progress
            const progress = ((i + 1) / employeesData.length) * 100;
            updateProgress(progress, `Đang xử lý nhân viên ${i + 1}/${employeesData.length}`);

            try {

                // Map Vietnamese column names to English field names
                let firstName = getFieldValue(empData, ['Họ và tên đệm', 'Ho va ten dem', 'first_name', 'Họ']);
                let lastName = getFieldValue(empData, ['Tên', 'Ten', 'last_name']);
                const email = getFieldValue(empData, ['Email', 'email']);
                const employeeId = getFieldValue(empData, ['Mã nhân viên', 'Ma nhan vien', 'employee_id', 'MSNV', 'Mã NV']);
                const jobTitle = getFieldValue(empData, ['Chức vụ', 'Chuc vu', 'job_title', 'Vị trí', 'Vi tri']);
                const department = getFieldValue(empData, ['Phòng ban', 'Phong ban', 'department', 'Bộ phận', 'Bo phan']);

                // Handle "Họ và tên" (full name) column - split into firstName and lastName
                if (!firstName || !lastName) {
                    const fullName = getFieldValue(empData, ['Họ và tên', 'Ho va ten', 'Họ tên', 'Ho ten', 'full_name', 'Tên đầy đủ', 'Ten day du']);
                    if (fullName) {
                        const nameParts = fullName.toString().trim().split(/\s+/);
                        if (nameParts.length >= 2) {
                            // Last word is lastName, rest is firstName (Vietnamese naming convention)
                            lastName = nameParts[nameParts.length - 1];
                            firstName = nameParts.slice(0, -1).join(' ');
                        } else if (nameParts.length === 1) {
                            // Single name - use as both
                            firstName = nameParts[0];
                            lastName = nameParts[0];
                        }
                    }
                }

                // Validate required fields (Email is now optional)
                if (!firstName || !lastName || !employeeId || !jobTitle || !department) {
                    throw new Error(`Thiếu trường bắt buộc (Họ và tên/Họ và tên đệm + Tên, Mã nhân viên, Chức vụ, Phòng ban)`);
                }

                // Determine have_gmail status based on email presence
                const hasEmail = email && email.toString().trim() !== '';
                const haveGmail = hasEmail;

                // Map department name to ID
                const deptName = department.toLowerCase().trim();
                let departmentId = deptMap[deptName];

                // If department not found, create it automatically
                if (!departmentId) {
                    console.log(`📝 Creating new department: "${department}"`);
                    updateProgress(progress, `Đang tạo phòng ban mới: ${department}`);

                    try {
                        const createDeptResponse = await api.createDepartment({
                            name: department,
                            description: `Tự động tạo từ import nhân viên hàng loạt`
                        });

                        if (createDeptResponse.success) {
                            departmentId = createDeptResponse.data.id;
                            // Update department map
                            deptMap[deptName] = departmentId;
                            console.log(`✅ Created department "${department}" with ID: ${departmentId}`);

                            // Show notification to user
                            showSuccess(`Đã tạo phòng ban mới: "${department}"`);
                        } else {
                            throw new Error(`Không thể tạo phòng ban "${department}": ${createDeptResponse.message}`);
                        }
                    } catch (createError) {
                        throw new Error(`Không thể tạo phòng ban "${department}": ${createError.message}`);
                    }
                }

                // Prepare employee data
                const salary = getFieldValue(empData, ['Lương', 'Luong', 'salary']);

                // Generate placeholder email if no email provided (database requires email field)
                // Format: msnv@noemail.thienphumut.local
                const placeholderEmail = `${employeeId.toString().toLowerCase().replace(/\s+/g, '')}@noemail.thienphumut.local`;

                const employeeData = {
                    first_name: firstName,
                    last_name: lastName,
                    email: hasEmail ? email : placeholderEmail, // Use placeholder if no email
                    employee_id: employeeId,
                    job_title: jobTitle,
                    department_id: departmentId,
                    phone: getFieldValue(empData, ['Số điện thoại', 'So dien thoai', 'phone']),
                    date_of_birth: getFieldValue(empData, ['Ngày sinh', 'Ngay sinh', 'date_of_birth']),
                    gender: getFieldValue(empData, ['Giới tính', 'Gioi tinh', 'gender']) || 'other',
                    employment_type: getFieldValue(empData, ['Loại hợp đồng', 'Loai hop dong', 'employment_type']),
                    start_date: getFieldValue(empData, ['Ngày bắt đầu', 'Ngay bat dau', 'start_date']),
                    salary: salary ? parseFloat(salary) : null,
                    pay_frequency: getFieldValue(empData, ['Chu kỳ lương', 'Chu ky luong', 'pay_frequency']),
                    address: getFieldValue(empData, ['Địa chỉ', 'Dia chi', 'address']),
                    city: getFieldValue(empData, ['Thành phố', 'Thanh pho', 'city']),
                    state: getFieldValue(empData, ['Tỉnh/Thành', 'Tinh/Thanh', 'state']),
                    zip_code: getFieldValue(empData, ['Mã bưu điện', 'Ma buu dien', 'zip_code']),
                    country: getFieldValue(empData, ['Quốc gia', 'Quoc gia', 'country']),
                    have_gmail: haveGmail // Set gmail status based on email presence
                };

                // Create employee
                const response = await api.createEmployee(employeeData);

                if (response.success) {
                    successCount++;
                    importedRows.add(i); // Mark this row as successfully imported
                    const gmailStatus = haveGmail ? '(Đã có gmail)' : '(Chưa cập nhật gmail)';
                    console.log(`✅ Row ${rowNumber}: ${firstName} ${lastName} imported successfully ${gmailStatus}`);
                } else {
                    throw new Error(response.message || 'Unknown error');
                }

            } catch (error) {
                failCount++;
                const empFirstName = getFieldValue(empData, ['Họ và tên đệm', 'Ho va ten dem', 'first_name']) || '';
                const empLastName = getFieldValue(empData, ['Tên', 'Ten', 'last_name']) || '';
                const empName = `${empFirstName} ${empLastName}`.trim() || 'N/A';
                const errorMsg = `Dòng ${rowNumber} (${empName}): ${error.message}`;
                errors.push(errorMsg);
                console.error(`❌ ${errorMsg}`);
            }

            // Small delay to avoid overwhelming the server
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Hide progress, show results
        document.getElementById('importProgress').classList.add('hidden');
        document.getElementById('importResults').classList.remove('hidden');

        // Update results
        document.getElementById('totalRows').textContent = employeesData.length;
        document.getElementById('successCount').textContent = successCount;
        document.getElementById('failCount').textContent = failCount;

        // Show errors if any
        if (errors.length > 0) {
            document.getElementById('errorDetails').classList.remove('hidden');
            const errorList = document.getElementById('errorList');
            errorList.innerHTML = errors.map(err => `<div>• ${err}</div>`).join('');
        } else {
            document.getElementById('errorDetails').classList.add('hidden');
        }

        // Show summary message
        if (failCount === 0) {
            showSuccess(`Nhập thành công ${successCount} nhân viên!`);
        } else {
            showError(`Nhập thành công ${successCount}, thất bại ${failCount} nhân viên. Xem chi tiết bên dưới.`);
        }

        // Reload employee list
        await loadEmployees();

        // Re-enable button
        document.getElementById('startImportBtn').disabled = false;

    } catch (error) {
        console.error('Bulk import failed:', error);
        document.getElementById('importProgress').classList.add('hidden');
        document.getElementById('startImportBtn').disabled = false;
        showError(error.message || 'Có lỗi xảy ra khi nhập nhân viên hàng loạt');
    }
}

// Read Excel file
function readExcelFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = function(e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });

                // Get first sheet
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];

                // Convert to JSON
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                console.log('📊 Excel data parsed:', jsonData);
                resolve(jsonData);

            } catch (error) {
                console.error('Error parsing Excel file:', error);
                reject(new Error('Không thể đọc file Excel. Vui lòng kiểm tra định dạng file.'));
            }
        };

        reader.onerror = function(error) {
            console.error('FileReader error:', error);
            reject(new Error('Không thể đọc file'));
        };

        reader.readAsArrayBuffer(file);
    });
}

// Update progress bar
function updateProgress(percent, detail) {
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const progressDetail = document.getElementById('progressDetail');

    if (progressBar) {
        progressBar.style.width = percent + '%';
    }
    if (progressText) {
        progressText.textContent = Math.round(percent) + '%';
    }
    if (progressDetail) {
        progressDetail.textContent = detail;
    }
}

// ==================== UPDATE MAIL STATUS FUNCTIONALITY ====================

// Scan all employees with @noemail.thienphumut.local email and set have_gmail = false
async function updateMailStatus() {
    try {
        showLoading();

        // Find employees whose email ends with @noemail.thienphumut.local and have_gmail is not already false
        const noMailEmployees = allEmployees.filter(emp => {
            const email = (emp.email || '').toLowerCase();
            const hasNoMail = email.endsWith('@noemail.thienphumut.local');
            const currentlyMarkedAsHavingGmail = emp.have_gmail !== false;
            return hasNoMail && currentlyMarkedAsHavingGmail;
        });

        hideLoading();

        if (noMailEmployees.length === 0) {
            showSuccess('Tất cả nhân viên đã có tình trạng mail chính xác! Không cần cập nhật.');
            return;
        }

        // Confirm action
        if (!confirm(`Tìm thấy ${noMailEmployees.length} nhân viên có email @noemail.thienphumut.local nhưng đang được đánh dấu "Đã có gmail".\n\nBạn có muốn cập nhật tất cả thành "Chưa cập nhật gmail" không?`)) {
            return;
        }

        showLoading();

        let successCount = 0;
        let failCount = 0;
        const errors = [];

        for (const emp of noMailEmployees) {
            try {
                const response = await api.updateEmployee(emp.id, { have_gmail: false });
                if (response.success) {
                    successCount++;
                } else {
                    failCount++;
                    errors.push(`${emp.employee_id}: ${response.message}`);
                }
            } catch (error) {
                failCount++;
                errors.push(`${emp.employee_id}: ${error.message}`);
            }
        }

        hideLoading();

        if (successCount > 0) {
            showSuccess(`Đã cập nhật ${successCount} nhân viên thành "Chưa cập nhật gmail"!`);
            await loadEmployees();
        }

        if (failCount > 0) {
            showError(`Có ${failCount} nhân viên cập nhật thất bại. Vui lòng kiểm tra lại.`);
            console.error('Update mail status errors:', errors);
        }
    } catch (error) {
        hideLoading();
        console.error('Failed to update mail status:', error);
        showError('Không thể cập nhật tình trạng mail');
    }
}

// ==================== FORMAT NAMES FUNCTIONALITY ====================

// Detect duplicate name pattern
function detectDuplicateNames() {
    const duplicates = [];

    allEmployees.forEach(emp => {
        const firstName = emp.first_name.trim();
        const lastName = emp.last_name.trim();
        const fullName = `${firstName} ${lastName}`;

        // Split full name into words
        const words = fullName.split(/\s+/);

        // Check if the last word (lastName) appears more than once in the full name
        const lastNameOccurrences = words.filter(word =>
            word.toUpperCase() === lastName.toUpperCase()
        ).length;

        if (lastNameOccurrences > 1) {
            // Found duplicate - the lastName appears in both firstName and lastName
            duplicates.push({
                id: emp.id,
                employee_id: emp.employee_id,
                current_first_name: firstName,
                current_last_name: lastName,
                current_full_name: fullName,
                suggested_first_name: firstName.split(/\s+/).slice(0, -1).join(' '),
                suggested_last_name: lastName,
                suggested_full_name: `${firstName.split(/\s+/).slice(0, -1).join(' ')} ${lastName}`
            });
        }
    });

    return duplicates;
}

// Open Format Names Modal
async function openFormatNamesModal() {
    showLoading();

    // Detect duplicates
    const duplicates = detectDuplicateNames();

    hideLoading();

    if (duplicates.length === 0) {
        showSuccess('Không tìm thấy nhân viên nào có tên bị duplicate! 🎉');
        return;
    }

    const modal = `
        <div id="formatNamesModal" class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 backdrop-in">
            <div class="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden modal-in">
                <!-- Header -->
                <div class="bg-gradient-to-r from-[#F875AA] to-[#AEDEFC] p-6 text-white">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                <i data-lucide="sparkles" class="w-6 h-6"></i>
                            </div>
                            <div>
                                <h2 class="text-xl font-semibold">Format lại tên nhân viên</h2>
                                <p class="text-white/80 text-sm mt-0.5">Phát hiện ${duplicates.length} nhân viên có tên bị duplicate</p>
                            </div>
                        </div>
                        <button onclick="closeFormatNamesModal()" class="w-8 h-8 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors">
                            <i data-lucide="x" class="w-5 h-5"></i>
                        </button>
                    </div>
                </div>

                <!-- Content -->
                <div class="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                    <div class="space-y-4">
                        ${duplicates.map((dup, index) => `
                            <div class="border-2 border-gray-100 rounded-xl p-4 hover:border-[#F875AA]/30 transition-all">
                                <div class="flex items-start justify-between gap-4">
                                    <div class="flex-1">
                                        <div class="flex items-center gap-2 mb-2">
                                            <span class="text-xs font-medium text-gray-500">MSNV: ${dup.employee_id}</span>
                                        </div>

                                        <!-- Current Name -->
                                        <div class="mb-3">
                                            <p class="text-xs text-red-600 font-medium mb-1">❌ Hiện tại (Duplicate):</p>
                                            <div class="bg-red-50 rounded-lg p-3 border border-red-200">
                                                <p class="text-sm text-gray-800">
                                                    <span class="font-medium">Họ và tên đệm:</span>
                                                    <span class="text-red-600">${dup.current_first_name}</span>
                                                </p>
                                                <p class="text-sm text-gray-800 mt-1">
                                                    <span class="font-medium">Tên:</span>
                                                    <span class="text-red-600">${dup.current_last_name}</span>
                                                </p>
                                            </div>
                                        </div>

                                        <!-- Arrow -->
                                        <div class="flex items-center justify-center my-2">
                                            <i data-lucide="arrow-down" class="w-5 h-5 text-gray-400"></i>
                                        </div>

                                        <!-- Suggested Name -->
                                        <div>
                                            <p class="text-xs text-green-600 font-medium mb-1">✅ Sau khi format:</p>
                                            <div class="bg-green-50 rounded-lg p-3 border border-green-200">
                                                <p class="text-sm text-gray-800">
                                                    <span class="font-medium">Họ và tên đệm:</span>
                                                    <span class="text-green-600">${dup.suggested_first_name}</span>
                                                </p>
                                                <p class="text-sm text-gray-800 mt-1">
                                                    <span class="font-medium">Tên:</span>
                                                    <span class="text-green-600">${dup.suggested_last_name}</span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Footer -->
                <div class="border-t border-gray-100 p-6 bg-gray-50">
                    <div class="flex items-center justify-between">
                        <p class="text-sm text-gray-600">
                            <i data-lucide="info" class="w-4 h-4 inline mr-1"></i>
                            Sẽ format <span class="font-semibold text-[#F875AA]">${duplicates.length} nhân viên</span>
                        </p>
                        <div class="flex gap-3">
                            <button onclick="closeFormatNamesModal()" class="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 font-medium hover:bg-gray-100 transition-all">
                                Hủy
                            </button>
                            <button onclick="processFormatNames()" class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#F875AA] to-[#AEDEFC] text-white font-medium hover:shadow-lg transition-all">
                                <i data-lucide="sparkles" class="w-4 h-4 inline mr-2"></i>
                                Tiến hành format
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.getElementById('modalContainer').innerHTML = modal;
    lucide.createIcons();
}

// Close Format Names Modal
function closeFormatNamesModal() {
    const modal = document.getElementById('formatNamesModal');
    if (modal) {
        modal.remove();
    }
}

// Process format names
async function processFormatNames() {
    const duplicates = detectDuplicateNames();

    if (duplicates.length === 0) {
        showSuccess('Không có nhân viên nào cần format!');
        closeFormatNamesModal();
        return;
    }

    showLoading();

    let successCount = 0;
    let failCount = 0;
    const errors = [];

    for (const dup of duplicates) {
        try {
            const updateData = {
                first_name: dup.suggested_first_name,
                last_name: dup.suggested_last_name
            };

            const response = await api.updateEmployee(dup.id, updateData);

            if (response.success) {
                successCount++;
            } else {
                failCount++;
                errors.push(`${dup.employee_id}: ${response.message}`);
            }
        } catch (error) {
            failCount++;
            errors.push(`${dup.employee_id}: ${error.message}`);
        }
    }

    hideLoading();
    closeFormatNamesModal();

    // Show result
    if (successCount > 0) {
        showSuccess(`✅ Đã format thành công ${successCount} nhân viên!`);

        // Reload employees
        await loadEmployees();
    }

    if (failCount > 0) {
        showError(`❌ Có ${failCount} nhân viên format thất bại. Vui lòng kiểm tra lại.`);
        console.error('Format errors:', errors);
    }
}
// This file will be appended to employees.js

// ==================== FORMAT EMPLOYEE CODE VALIDATION ====================

async function formatEmployeeCode() {
    console.log('🚀 [FRONTEND STEP 1] formatEmployeeCode() called');

    showLoading();
    console.log('⏳ [FRONTEND STEP 2] Loading screen shown');

    try {
        console.log('📡 [FRONTEND STEP 3] Calling API: /employees/validate-codes');
        const response = await api.get('/employees/validate-codes');
        console.log('✅ [FRONTEND STEP 4] API response received:', response);

        hideLoading();
        console.log('✅ [FRONTEND STEP 5] Loading screen hidden');

        if (!response.success) {
            console.error('❌ [FRONTEND STEP 6] Response success is false:', response);
            showError('❌ Không thể đọc file DS CNV hoặc database');
            return;
        }

        console.log('📊 [FRONTEND STEP 7] Extracting data from response');
        const { summary, mismatches, notFoundInDB, notFoundInFile } = response;
        console.log('📊 [FRONTEND STEP 8] Summary:', summary);
        console.log('📊 [FRONTEND STEP 9] Mismatches count:', mismatches?.length || 0);
        console.log('📊 [FRONTEND STEP 10] NotFoundInDB count:', notFoundInDB?.length || 0);
        console.log('📊 [FRONTEND STEP 11] NotFoundInFile count:', notFoundInFile?.length || 0);

        // Show modal with results
        console.log('🎨 [FRONTEND STEP 12] Showing modal...');
        showEmployeeCodeValidationModal(summary, mismatches, notFoundInDB, notFoundInFile);
        console.log('✅ [FRONTEND STEP 13] Modal shown successfully');

    } catch (error) {
        hideLoading();
        console.error('❌ [FRONTEND ERROR] Failed to validate employee codes:', error);
        console.error('❌ [FRONTEND ERROR] Error type:', error.constructor.name);
        console.error('❌ [FRONTEND ERROR] Error message:', error.message);
        console.error('❌ [FRONTEND ERROR] Error stack:', error.stack);

        if (error.response) {
            console.error('❌ [FRONTEND ERROR] Response status:', error.response.status);
            console.error('❌ [FRONTEND ERROR] Response data:', error.response.data);
        }

        showError('❌ Lỗi khi validate mã nhân viên: ' + error.message);
    }
}

function showEmployeeCodeValidationModal(summary, mismatches, notFoundInDB, notFoundInFile) {
    // Store mismatches globally for update function
    currentMismatches = mismatches;
    console.log('💾 [MODAL] Stored mismatches:', currentMismatches.length);

    const mismatchesHTML = mismatches.length > 0 ? `
    <div class="mb-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <i data-lucide="alert-triangle" class="w-5 h-5 text-yellow-500"></i>
            Mã nhân viên không khớp (${mismatches.length})
        </h3>
        <div class="space-y-2">
            ${mismatches.map(m => `
                <div class="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                    <div class="flex items-start justify-between">
                        <div class="flex-1">
                            <div class="font-medium text-gray-800">${m.fullName}</div>
                            <div class="text-sm text-gray-600 mt-1">Row ${m.row} trong DS CNV</div>
                        </div>
                        <div class="flex gap-6 text-sm">
                            <div>
                                <div class="text-xs text-gray-500">File DS CNV</div>
                                <div class="font-mono font-semibold text-orange-600">${m.fileCode}</div>
                            </div>
                            <div class="text-gray-400 self-center">→</div>
                            <div>
                                <div class="text-xs text-gray-500">Database</div>
                                <div class="font-mono font-semibold text-blue-600">${m.dbCode}</div>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    </div>
    ` : '';

    const notFoundInDBHTML = notFoundInDB.length > 0 ? `
    <div class="mb-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <i data-lucide="user-x" class="w-5 h-5 text-red-500"></i>
            Không tìm thấy trong Database (${notFoundInDB.length})
        </h3>
        <div class="space-y-2">
            ${notFoundInDB.map(n => `
                <div class="bg-red-50 border border-red-200 rounded-xl p-4">
                    <div class="flex items-center justify-between">
                        <div>
                            <div class="font-medium text-gray-800">${n.fullName}</div>
                            <div class="text-sm text-gray-600 mt-1">Mã: <span class="font-mono">${n.fileCode}</span> - Row ${n.row}</div>
                        </div>
                        <div class="text-xs text-red-600 bg-red-100 px-3 py-1 rounded-full">
                            Chưa có trong DB
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    </div>
    ` : '';

    const notFoundInFileHTML = notFoundInFile.length > 0 ? `
    <div class="mb-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <i data-lucide="file-x" class="w-5 h-5 text-purple-500"></i>
            Không có trong DS CNV (${notFoundInFile.length})
        </h3>
        <div class="space-y-2">
            ${notFoundInFile.map(n => `
                <div class="bg-purple-50 border border-purple-200 rounded-xl p-4">
                    <div class="flex items-center justify-between">
                        <div>
                            <div class="font-medium text-gray-800">${n.fullName}</div>
                            <div class="text-sm text-gray-600 mt-1">Mã: <span class="font-mono">${n.dbCode}</span></div>
                        </div>
                        <div class="text-xs text-purple-600 bg-purple-100 px-3 py-1 rounded-full">
                            Chưa có trong DS CNV
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    </div>
    ` : '';

    const allMatchedHTML = mismatches.length === 0 && notFoundInDB.length === 0 && notFoundInFile.length === 0 ? `
    <div class="text-center py-12">
        <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i data-lucide="check-circle" class="w-10 h-10 text-green-500"></i>
        </div>
        <h3 class="text-xl font-semibold text-gray-800 mb-2">Tất cả đều khớp! 🎉</h3>
        <p class="text-gray-600">Không có mã nhân viên nào bị sai lệch giữa file DS CNV và Database.</p>
    </div>
    ` : '';

    const modal = `
        <div id="employeeCodeValidationModal" class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 backdrop-in">
            <div class="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden modal-in">
                <div class="bg-gradient-to-r from-[#F875AA] to-[#AEDEFC] p-6 text-white">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                <i data-lucide="hash" class="w-6 h-6"></i>
                            </div>
                            <div>
                                <h2 class="text-xl font-semibold">Kết quả kiểm tra mã nhân viên</h2>
                                <p class="text-white/80 text-sm mt-0.5">So sánh giữa file DS CNV và Database</p>
                            </div>
                        </div>
                        <button onclick="closeEmployeeCodeValidationModal()" class="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                            <i data-lucide="x" class="w-5 h-5"></i>
                        </button>
                    </div>
                </div>

                <div class="p-6 border-b border-gray-200">
                    <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div class="bg-blue-50 rounded-xl p-4 text-center">
                            <div class="text-2xl font-bold text-blue-600">${summary.totalInFile}</div>
                            <div class="text-xs text-gray-600 mt-1">Tổng DS CNV</div>
                        </div>
                        <div class="bg-green-50 rounded-xl p-4 text-center">
                            <div class="text-2xl font-bold text-green-600">${summary.totalInDB}</div>
                            <div class="text-xs text-gray-600 mt-1">Tổng Database</div>
                        </div>
                        <div class="bg-emerald-50 rounded-xl p-4 text-center">
                            <div class="text-2xl font-bold text-emerald-600">${summary.matchedCorrectly}</div>
                            <div class="text-xs text-gray-600 mt-1">Khớp đúng</div>
                        </div>
                        <div class="bg-yellow-50 rounded-xl p-4 text-center">
                            <div class="text-2xl font-bold text-yellow-600">${summary.mismatches}</div>
                            <div class="text-xs text-gray-600 mt-1">Mã không khớp</div>
                        </div>
                        <div class="bg-red-50 rounded-xl p-4 text-center">
                            <div class="text-2xl font-bold text-red-600">${summary.notFoundInDB + summary.notFoundInFile}</div>
                            <div class="text-xs text-gray-600 mt-1">Không tìm thấy</div>
                        </div>
                    </div>
                </div>

                <div class="p-6 overflow-y-auto" style="max-height: calc(90vh - 300px);">
                    ${mismatchesHTML}
                    ${notFoundInDBHTML}
                    ${notFoundInFileHTML}
                    ${allMatchedHTML}
                </div>

                <div class="p-6 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                    <div class="text-sm text-gray-600">
                        ${mismatches.length > 0 ? `<span class="font-medium text-yellow-600">${mismatches.length} mã không khớp</span> cần được cập nhật` : ''}
                    </div>
                    <div class="flex gap-3">
                        ${mismatches.length > 0 ? `
                        <button onclick="updateAllEmployeeCodes()" class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-medium hover:shadow-lg transition-all flex items-center gap-2">
                            <i data-lucide="refresh-cw" class="w-4 h-4"></i>
                            Cập nhật tất cả
                        </button>
                        ` : ''}
                        <button onclick="closeEmployeeCodeValidationModal()" class="px-6 py-2.5 rounded-xl bg-white border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors">
                            Đóng
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modal);
    lucide.createIcons();
}

function closeEmployeeCodeValidationModal() {
    const modal = document.getElementById('employeeCodeValidationModal');
    if (modal) {
        modal.remove();
    }
}

// Store mismatches globally for update function
let currentMismatches = [];

async function updateAllEmployeeCodes() {
    if (currentMismatches.length === 0) {
        showError('Không có mã nhân viên nào cần cập nhật');
        return;
    }

    // Confirm before update
    const confirmMsg = `Bạn có chắc muốn cập nhật ${currentMismatches.length} mã nhân viên từ DS CNV vào database?\n\nHành động này sẽ thay đổi dữ liệu trong database!`;
    if (!confirm(confirmMsg)) {
        return;
    }

    console.log('🔄 [UPDATE FRONTEND] Starting update process...');
    showLoading();

    try {
        console.log('📡 [UPDATE FRONTEND] Calling API: /employees/update-codes');
        console.log('📊 [UPDATE FRONTEND] Mismatches to update:', currentMismatches);

        const response = await api.post('/employees/update-codes', {
            mismatches: currentMismatches
        });

        console.log('✅ [UPDATE FRONTEND] API response:', response);
        hideLoading();

        if (response.success) {
            const { results } = response;
            console.log(`✅ [UPDATE FRONTEND] Update completed: ${results.successCount} success, ${results.failedCount} failed`);

            // Close current modal
            closeEmployeeCodeValidationModal();

            // Show success message
            showSuccess(`✅ Đã cập nhật thành công ${results.successCount} mã nhân viên!`);

            // If there were failures, show them
            if (results.failedCount > 0) {
                console.error('❌ [UPDATE FRONTEND] Failed updates:', results.failed);
                showError(`⚠️ Có ${results.failedCount} mã nhân viên cập nhật thất bại. Vui lòng kiểm tra console.`);
            }

            // Re-run validation to show new results
            setTimeout(() => {
                formatEmployeeCode();
            }, 1500);
        } else {
            showError('❌ Cập nhật thất bại: ' + (response.error || 'Unknown error'));
        }

    } catch (error) {
        hideLoading();
        console.error('❌ [UPDATE FRONTEND ERROR] Failed to update employee codes:', error);
        showError('❌ Lỗi khi cập nhật mã nhân viên: ' + error.message);
    }
}
