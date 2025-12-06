// Check authentication
if (!requireAuth()) {
    throw new Error('Not authenticated');
}

// Global variables
let allEmployees = [];
let selectedEmployee = null;
let uploadedFile = null;

// Email statistics tracking
let emailStats = {
    today: 0,           // Mails sent today
    thisMonth: 0,       // Mails sent this month
    sending: 0,         // Currently sending
    success: 0          // Successfully sent (session only)
};

// Update interval for sending/success counters
let statsUpdateInterval = null;

// Load and initialize email statistics from localStorage
function loadEmailStats() {
    console.log('📊 [LOAD STATS] Loading email statistics...');

    const savedStats = localStorage.getItem('emailStats');
    if (savedStats) {
        try {
            const stats = JSON.parse(savedStats);
            const today = new Date().toDateString();
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();

            // Check if stats are from today
            if (stats.lastDate === today) {
                emailStats.today = stats.today || 0;
            } else {
                emailStats.today = 0;
            }

            // Check if stats are from this month
            if (stats.lastMonth === currentMonth && stats.lastYear === currentYear) {
                emailStats.thisMonth = stats.thisMonth || 0;
            } else {
                emailStats.thisMonth = 0;
            }

            console.log('📊 [LOAD STATS] Loaded stats:', emailStats);
        } catch (e) {
            console.error('❌ [LOAD STATS] Failed to parse:', e);
        }
    }

    updateStatsDisplay();
}

// Save email statistics to localStorage
function saveEmailStats() {
    const today = new Date().toDateString();
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const statsToSave = {
        today: emailStats.today,
        thisMonth: emailStats.thisMonth,
        lastDate: today,
        lastMonth: currentMonth,
        lastYear: currentYear
    };

    localStorage.setItem('emailStats', JSON.stringify(statsToSave));
    console.log('💾 [SAVE STATS] Saved stats:', statsToSave);
}

// Update statistics display in UI
function updateStatsDisplay() {
    document.getElementById('mailsToday').textContent = emailStats.today;
    document.getElementById('mailsThisMonth').textContent = emailStats.thisMonth;
    document.getElementById('mailsSending').textContent = emailStats.sending;
    document.getElementById('mailsSuccess').textContent = emailStats.success;

    // Show/hide sending indicator
    const sendingIndicator = document.getElementById('sendingIndicator');
    const sendingIcon = document.getElementById('sendingIcon');

    if (emailStats.sending > 0) {
        sendingIndicator.classList.remove('hidden');
        sendingIcon.classList.add('animate-spin');
    } else {
        sendingIndicator.classList.add('hidden');
        sendingIcon.classList.remove('animate-spin');
    }
}

// Start updating stats display (every 250ms)
function startStatsUpdate() {
    if (statsUpdateInterval) return; // Already running

    statsUpdateInterval = setInterval(() => {
        updateStatsDisplay();

        // Stop updating if both sending and success are 0
        if (emailStats.sending === 0 && emailStats.success === 0) {
            stopStatsUpdate();
        }
    }, 250);

    console.log('⏱️ [STATS UPDATE] Started update interval');
}

// Stop updating stats display
function stopStatsUpdate() {
    if (statsUpdateInterval) {
        clearInterval(statsUpdateInterval);
        statsUpdateInterval = null;
        console.log('⏹️ [STATS UPDATE] Stopped update interval');
    }
}

// Increment email sent count
function incrementEmailSent() {
    emailStats.today++;
    emailStats.thisMonth++;
    emailStats.sending--;
    emailStats.success++;

    console.log('📈 [STATS] Email sent! Current stats:', emailStats);

    saveEmailStats();
    updateStatsDisplay();
}

// Start sending email (increment sending counter)
function startSendingEmail() {
    emailStats.sending++;
    console.log('🚀 [STATS] Started sending email. Sending count:', emailStats.sending);

    updateStatsDisplay();
    startStatsUpdate();
}

// Load Gmail configuration
function loadGmailConfig() {
    console.log('📧 [LOAD GMAIL CONFIG] Starting...');
    const savedConfig = localStorage.getItem('gmailConfig');
    console.log('📧 [LOAD GMAIL CONFIG] savedConfig from localStorage:', savedConfig);

    if (savedConfig) {
        try {
            const config = JSON.parse(savedConfig);
            console.log('📧 [LOAD GMAIL CONFIG] Parsed config:', config);
            window.start_email = config.senderEmail;
            console.log('✅ [LOAD GMAIL CONFIG] Set window.start_email =', window.start_email);
        } catch (e) {
            console.error('❌ [LOAD GMAIL CONFIG] Failed to parse:', e);
        }
    } else {
        console.warn('⚠️ [LOAD GMAIL CONFIG] No Gmail config found in localStorage');
    }
}

// Load employees on page load
async function loadEmployees() {
    console.log('👥 [LOAD EMPLOYEES] Starting...');
    try {
        const response = await api.getEmployees();
        console.log('👥 [LOAD EMPLOYEES] API response:', response);

        if (response.success) {
            allEmployees = response.data;
            console.log(`✅ [LOAD EMPLOYEES] Loaded ${allEmployees.length} employees`);
        } else {
            console.error('❌ [LOAD EMPLOYEES] API returned success: false');
        }
    } catch (error) {
        console.error('❌ [LOAD EMPLOYEES] Error:', error);
    }
}

// Filter employees based on search query
function filterEmployees(query) {
    if (!query || query.trim() === '') return [];

    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);

    return allEmployees.filter(emp => {
        const fullName = `${emp.first_name} ${emp.last_name}`.toLowerCase();
        const employeeId = (emp.employee_id || '').toLowerCase();
        const jobTitle = (emp.job_title || '').toLowerCase();

        return searchTerms.every(term =>
            fullName.includes(term) ||
            employeeId.includes(term) ||
            jobTitle.includes(term)
        );
    });
}

// Display search results
function displaySearchResults(employees) {
    const resultsContent = document.getElementById('searchResultsContent');
    const searchResults = document.getElementById('searchResults');

    if (employees.length === 0) {
        resultsContent.innerHTML = `
            <div class="p-4 text-center text-sm text-gray-500">
                Không tìm thấy nhân viên nào
            </div>
        `;
    } else {
        resultsContent.innerHTML = employees.map(emp => {
            const initials = emp.first_name && emp.last_name
                ? `${emp.first_name[0]}${emp.last_name[0]}`.toUpperCase()
                : 'NV';

            return `
                <div onclick="selectEmployee(${emp.id})" class="flex items-center gap-3 p-3 rounded-lg hover:bg-[#FDEDED]/50 cursor-pointer transition-colors">
                    <div class="w-10 h-10 rounded-full bg-gradient-to-br from-[#F875AA] to-[#AEDEFC] flex items-center justify-center text-white text-sm font-medium">
                        ${initials}
                    </div>
                    <div>
                        <p class="text-sm font-medium text-gray-800">${emp.first_name} ${emp.last_name}</p>
                        <p class="text-xs text-gray-500">${emp.job_title || 'Nhân viên'} • ${emp.employee_id || ''}</p>
                    </div>
                </div>
            `;
        }).join('');
    }

    searchResults.classList.remove('hidden');
    lucide.createIcons();
}

// Select employee
function selectEmployee(employeeId) {
    console.log('🎯 [SELECT EMPLOYEE] employeeId:', employeeId);
    console.log('🎯 [SELECT EMPLOYEE] allEmployees:', allEmployees);

    selectedEmployee = allEmployees.find(emp => emp.id === employeeId);
    console.log('🎯 [SELECT EMPLOYEE] Found employee:', selectedEmployee);

    if (selectedEmployee) {
        // Store end_email
        window.end_email = selectedEmployee.email;
        console.log('✅ [SELECT EMPLOYEE] Set window.end_email =', window.end_email);

        // Display selected employee
        document.getElementById('selectedEmployeeName').textContent =
            `Đã chọn nhân viên: ${selectedEmployee.first_name} ${selectedEmployee.last_name}`;
        document.getElementById('selectedEmployeeEmail').textContent =
            `Email: ${selectedEmployee.email}`;
        document.getElementById('selectedEmployeeDisplay').classList.remove('hidden');

        // Hide search results
        document.getElementById('searchResults').classList.add('hidden');

        // Clear search input
        document.getElementById('employeeSearch').value = '';

        lucide.createIcons();
        console.log('✅ [SELECT EMPLOYEE] UI updated successfully');
    } else {
        console.error('❌ [SELECT EMPLOYEE] Employee not found!');
    }
}

// Clear selected employee
function clearSelectedEmployee() {
    console.log('🗑️ [CLEAR EMPLOYEE] Clearing selected employee');
    selectedEmployee = null;
    window.end_email = null;
    document.getElementById('selectedEmployeeDisplay').classList.add('hidden');
    lucide.createIcons();
    console.log('✅ [CLEAR EMPLOYEE] Cleared successfully');
}

// Show filename warning modal
function showFilenameWarningModal(fileName) {
    console.log('⚠️ [FILENAME WARNING] Showing modal for file:', fileName);

    // Check if filename has Vietnamese characters or spaces
    const hasVietnamese = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(fileName);
    const hasSpaces = /\s/.test(fileName);

    if (!hasVietnamese && !hasSpaces) {
        console.log('✅ [FILENAME WARNING] Filename is valid, no modal needed');
        return; // Filename is good, no need to show modal
    }

    const modal = document.createElement('div');
    modal.id = 'filenameWarningModal';
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onclick="closeFilenameWarningModal()"></div>
        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
            <div class="px-6 py-5 border-b border-gray-100">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center">
                        <i data-lucide="alert-triangle" class="w-5 h-5 text-orange-500"></i>
                    </div>
                    <div>
                        <h3 class="text-lg font-semibold text-gray-800">Lưu ý về tên file</h3>
                        <p class="text-xs text-gray-500">Đề xuất đổi tên file</p>
                    </div>
                </div>
            </div>

            <div class="px-6 py-5">
                <p class="text-sm text-gray-600 mb-4">Hãy chắc chắn rằng tên file <strong>không có dấu</strong> và <strong>không có khoảng cách</strong> để tránh lỗi khi gửi email.</p>

                <div class="space-y-3">
                    <div class="flex items-center gap-2 p-3 bg-red-50 rounded-xl border border-red-200">
                        <i data-lucide="x-circle" class="w-4 h-4 text-red-500 flex-shrink-0"></i>
                        <span class="text-sm text-gray-700 line-through">Bảng lương tháng 12.xlsx</span>
                    </div>

                    <div class="flex items-center gap-2 p-3 bg-green-50 rounded-xl border border-green-200">
                        <i data-lucide="check-circle" class="w-4 h-4 text-green-500 flex-shrink-0"></i>
                        <span class="text-sm text-gray-700 font-medium">Bang_luong_thang_12.xlsx</span>
                    </div>
                </div>

                <div class="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-200">
                    <div class="flex gap-2">
                        <i data-lucide="info" class="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5"></i>
                        <p class="text-xs text-blue-700">Bạn vẫn có thể tiếp tục, nhưng nên đổi tên file trước khi upload để đảm bảo email được gửi thành công.</p>
                    </div>
                </div>
            </div>

            <div class="px-6 py-4 border-t border-gray-100 bg-gray-50 flex gap-2">
                <button onclick="closeFilenameWarningModal()" class="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#F875AA] to-[#AEDEFC] text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all">
                    Đã hiểu
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    lucide.createIcons();
    console.log('✅ [FILENAME WARNING] Modal displayed');
}

// Close filename warning modal
function closeFilenameWarningModal() {
    const modal = document.getElementById('filenameWarningModal');
    if (modal) {
        modal.remove();
        console.log('✅ [FILENAME WARNING] Modal closed');
    }
}

// Send email function
async function sendPayrollEmail(emailTitle) {
    console.log('📮 [SEND EMAIL] ========== STARTING EMAIL SEND ==========');
    console.log('📮 [SEND EMAIL] Email title:', emailTitle);

    // Check Gmail config
    const gmailConfig = localStorage.getItem('gmailConfig');
    console.log('📮 [SEND EMAIL] Gmail config exists:', !!gmailConfig);

    if (!gmailConfig) {
        console.error('❌ [SEND EMAIL] No Gmail config found');
        alert('Vui lòng cấu hình Gmail trong trang Cài đặt trước');
        return false;
    }

    // Check start_email
    console.log('📮 [SEND EMAIL] window.start_email:', window.start_email);
    if (!window.start_email) {
        console.error('❌ [SEND EMAIL] start_email is not set');
        alert('Email gửi chưa được cấu hình');
        return false;
    }

    // Check end_email
    console.log('📮 [SEND EMAIL] window.end_email:', window.end_email);
    if (!window.end_email) {
        console.error('❌ [SEND EMAIL] end_email is not set');
        alert('Vui lòng chọn nhân viên để gửi bảng lương');
        return false;
    }

    // Check uploaded file
    console.log('📮 [SEND EMAIL] uploadedFile:', uploadedFile);
    if (!uploadedFile) {
        console.error('❌ [SEND EMAIL] No file uploaded');
        alert('Vui lòng chọn file bảng lương để gửi');
        return false;
    }

    // Parse Gmail config
    const config = JSON.parse(gmailConfig);
    console.log('📮 [SEND EMAIL] Parsed Gmail config:', {
        senderEmail: config.senderEmail,
        smtpServer: config.smtpServer,
        smtpPort: config.smtpPort,
        hasPassword: !!config.appPassword
    });

    // All checks passed
    console.log('✅ [SEND EMAIL] All validations passed!');
    console.log('📮 [SEND EMAIL] Email details:', {
        from: window.start_email,
        to: window.end_email,
        subject: emailTitle,
        fileName: uploadedFile.name,
        fileSize: uploadedFile.size,
        fileType: uploadedFile.type
    });

    try {
        // Start tracking - increment sending counter
        startSendingEmail();

        console.log('🚀 [SEND EMAIL] Calling backend API...');

        // Prepare FormData
        const formData = new FormData();
        formData.append('payrollFile', uploadedFile);
        formData.append('senderEmail', config.senderEmail);
        formData.append('smtpServer', config.smtpServer);
        formData.append('smtpPort', config.smtpPort);
        formData.append('appPassword', config.appPassword);
        formData.append('recipientEmail', window.end_email);
        formData.append('subject', emailTitle);
        formData.append('employeeName', selectedEmployee ? `${selectedEmployee.first_name} ${selectedEmployee.last_name}` : '');

        console.log('📦 [SEND EMAIL] FormData prepared');

        // Get auth token
        const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
        if (!token) {
            console.error('❌ [SEND EMAIL] No auth token found');
            alert('Vui lòng đăng nhập lại');

            // Failed - decrement sending counter
            emailStats.sending--;
            updateStatsDisplay();
            return false;
        }

        // Call backend API
        const response = await fetch(`${API_CONFIG.BASE_URL}/email/send-payroll`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        const data = await response.json();
        console.log('📬 [SEND EMAIL] Backend response:', data);

        if (!response.ok || !data.success) {
            console.error('❌ [SEND EMAIL] Backend returned error:', data.message);
            alert(`Lỗi gửi email: ${data.message || 'Không rõ lỗi'}`);

            // Failed - decrement sending counter
            emailStats.sending--;
            updateStatsDisplay();
            return false;
        }

        console.log('✅ [SEND EMAIL] Email sent successfully!');
        console.log('📮 [SEND EMAIL] ========== EMAIL SEND COMPLETE ==========');

        // Success - increment stats
        incrementEmailSent();

        return true;

    } catch (error) {
        console.error('❌ [SEND EMAIL] Exception caught:', error);
        alert(`Lỗi kết nối backend: ${error.message}`);

        // Failed - decrement sending counter
        emailStats.sending--;
        updateStatsDisplay();
        return false;
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 [INIT] ========== PAGE INITIALIZATION ==========');
    console.log('🚀 [INIT] DOMContentLoaded fired');

    // Initialize Lucide icons
    lucide.createIcons();

    // Load email statistics
    loadEmailStats();

    // Load Gmail config and employees
    loadGmailConfig();
    loadEmployees();

    // Employee search functionality
    const searchInput = document.getElementById('employeeSearch');
    const searchResults = document.getElementById('searchResults');

    searchInput.addEventListener('focus', () => {
        if (searchInput.value.length > 0) {
            const filteredEmployees = filterEmployees(searchInput.value);
            displaySearchResults(filteredEmployees);
        }
    });

    searchInput.addEventListener('input', () => {
        if (searchInput.value.length > 0) {
            const filteredEmployees = filterEmployees(searchInput.value);
            displaySearchResults(filteredEmployees);
        } else {
            searchResults.classList.add('hidden');
        }
    });

    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.classList.add('hidden');
        }
    });

    // File upload functionality
    const uploadZone = document.getElementById('uploadZone');
    const fileInput = document.getElementById('fileInput');
    const filePreview = document.getElementById('filePreview');
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');
    const removeFile = document.getElementById('removeFile');

    // Drag and drop events
    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.classList.add('dragover');
    });

    uploadZone.addEventListener('dragleave', () => {
        uploadZone.classList.remove('dragover');
    });

    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });

    function handleFile(file) {
        console.log('📄 [HANDLE FILE] File selected:', file);
        console.log('📄 [HANDLE FILE] File name:', file.name);
        console.log('📄 [HANDLE FILE] File type:', file.type);
        console.log('📄 [HANDLE FILE] File size:', file.size);

        const validTypes = ['.xlsx', '.xls', '.csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/csv'];
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        console.log('📄 [HANDLE FILE] File extension:', fileExtension);

        if (validTypes.includes(fileExtension) || validTypes.includes(file.type)) {
            uploadedFile = file;
            fileName.textContent = file.name;
            fileSize.textContent = formatFileSize(file.size) + ' • Sẵn sàng tải lên';
            filePreview.classList.remove('hidden');
            uploadZone.style.display = 'none';
            console.log('✅ [HANDLE FILE] File accepted and stored');

            // Show filename warning modal if needed
            showFilenameWarningModal(file.name);
        } else {
            console.error('❌ [HANDLE FILE] Invalid file type');
            alert('Vui lòng tải lên tệp Excel hợp lệ (.xlsx, .xls, hoặc .csv)');
        }
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    removeFile.addEventListener('click', () => {
        fileInput.value = '';
        uploadedFile = null;
        filePreview.classList.add('hidden');
        uploadZone.style.display = 'block';
    });

    // Upload button
    const uploadButton = document.getElementById('uploadButton');
    uploadButton.addEventListener('click', async () => {
        console.log('🔘 [UPLOAD BUTTON] Button clicked!');

        // Scroll to top smoothly
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
        console.log('⬆️ [UPLOAD BUTTON] Scrolling to top');

        console.log('🔘 [UPLOAD BUTTON] uploadedFile:', uploadedFile);
        console.log('🔘 [UPLOAD BUTTON] selectedEmployee:', selectedEmployee);
        console.log('🔘 [UPLOAD BUTTON] window.start_email:', window.start_email);
        console.log('🔘 [UPLOAD BUTTON] window.end_email:', window.end_email);

        if (!uploadedFile) {
            console.error('❌ [UPLOAD BUTTON] No file uploaded');
            alert('Vui lòng chọn một tệp để tải lên');
            return;
        }

        if (!selectedEmployee) {
            console.error('❌ [UPLOAD BUTTON] No employee selected');
            alert('Vui lòng chọn nhân viên trước khi gửi bảng lương');
            return;
        }

        // Prompt for email title
        const defaultTitle = `Bảng lương tháng ${new Date().getMonth() + 1}/${new Date().getFullYear()}`;
        console.log('📝 [UPLOAD BUTTON] Prompting for email title, default:', defaultTitle);
        const emailTitle = prompt('Nhập tiêu đề email:', defaultTitle);
        console.log('📝 [UPLOAD BUTTON] User entered title:', emailTitle);

        if (!emailTitle) {
            console.log('⚠️ [UPLOAD BUTTON] User cancelled or entered empty title');
            return;
        }

        console.log('🚀 [UPLOAD BUTTON] Starting email send process...');
        uploadButton.innerHTML = '<i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i> Đang gửi email...';
        uploadButton.disabled = true;
        lucide.createIcons();

        try {
            const success = await sendPayrollEmail(emailTitle);
            console.log('📮 [UPLOAD BUTTON] sendPayrollEmail returned:', success);

            if (success) {
                console.log('✅ [UPLOAD BUTTON] Email sent successfully!');
                uploadButton.innerHTML = '<i data-lucide="check-circle" class="w-5 h-5"></i> Gửi email thành công!';
                uploadButton.classList.remove('from-[#F875AA]', 'to-[#AEDEFC]');
                uploadButton.classList.add('from-green-500', 'to-green-400');
                lucide.createIcons();

                setTimeout(() => {
                    console.log('🔄 [UPLOAD BUTTON] Resetting UI after success');
                    uploadButton.innerHTML = '<i data-lucide="upload" class="w-5 h-5"></i> Tải lên bảng lương nhân viên';
                    uploadButton.classList.remove('from-green-500', 'to-green-400');
                    uploadButton.classList.add('from-[#F875AA]', 'to-[#AEDEFC]');
                    uploadButton.disabled = false;
                    fileInput.value = '';
                    uploadedFile = null;
                    filePreview.classList.add('hidden');
                    uploadZone.style.display = 'block';
                    lucide.createIcons();
                }, 2000);
            } else {
                console.error('❌ [UPLOAD BUTTON] Email send failed');
                uploadButton.innerHTML = '<i data-lucide="upload" class="w-5 h-5"></i> Tải lên bảng lương nhân viên';
                uploadButton.disabled = false;
                lucide.createIcons();
            }
        } catch (error) {
            console.error('❌ [UPLOAD BUTTON] Error caught:', error);
            alert('Lỗi khi gửi email: ' + error.message);
            uploadButton.innerHTML = '<i data-lucide="upload" class="w-5 h-5"></i> Tải lên bảng lương nhân viên';
            uploadButton.disabled = false;
            lucide.createIcons();
        }
    });

    // Keyboard shortcut for search
    document.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            searchInput.focus();
        }
    });

    console.log('🚀 [INIT] ========== INITIALIZATION COMPLETE ==========');
});
