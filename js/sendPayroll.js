// Check authentication
if (!requireAuth()) {
    throw new Error('Not authenticated');
}

// Check admin authorization - Only admin can access sendPayroll
const currentUser = api.getUser();
if (!currentUser || currentUser.role !== 'admin') {
    alert('⛔ Access Denied: Only administrators can access this page.\n\nBạn không có quyền truy cập trang này.');
    window.location.href = '/index.html';
    throw new Error('Unauthorized: Admin access required');
}

// Global variables (Feature 1 removed - only batch payroll remains)

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

// ========== FEATURE 1 REMOVED ==========
// All Feature 1 code (employee search + single file upload + manual send) has been removed
// Only batch payroll feature remains below

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 [INIT] ========== PAGE INITIALIZATION ==========');
    console.log('🚀 [INIT] DOMContentLoaded fired');

    // Initialize Lucide icons
    lucide.createIcons();

    // Load email statistics
    loadEmailStats();

    // ========== BATCH PAYROLL GENERATION ==========
    setupBatchPayrollGeneration();

    console.log('🚀 [INIT] ========== INITIALIZATION COMPLETE ==========');
});

// ========== BATCH PAYROLL GENERATION FUNCTIONS ==========

let overallPayrollFile = null;

function setupBatchPayrollGeneration() {
    const overallPayrollInput = document.getElementById('overallPayrollInput');
    const overallPayrollUploadZone = document.getElementById('overallPayrollUploadZone');
    const overallPayrollPreview = document.getElementById('overallPayrollPreview');
    const overallPayrollFileName = document.getElementById('overallPayrollFileName');
    const overallPayrollFileSize = document.getElementById('overallPayrollFileSize');
    const removeOverallPayrollFile = document.getElementById('removeOverallPayrollFile');
    const sendBatchButton = document.getElementById('sendBatchButton');

    // File input change handler
    overallPayrollInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            handleOverallPayrollFile(file);
        }
    });

    // Prevent input element from triggering parent click
    overallPayrollInput.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    // Click handler to trigger file input
    overallPayrollUploadZone.addEventListener('click', (e) => {
        // Only trigger if not clicking directly on the input element
        if (e.target !== overallPayrollInput) {
            overallPayrollInput.click();
        }
    });

    // Drag and drop handlers
    overallPayrollUploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        overallPayrollUploadZone.classList.add('dragover');
    });

    overallPayrollUploadZone.addEventListener('dragleave', () => {
        overallPayrollUploadZone.classList.remove('dragover');
    });

    overallPayrollUploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        overallPayrollUploadZone.classList.remove('dragover');

        const file = e.dataTransfer.files[0];
        if (file) {
            handleOverallPayrollFile(file);
        }
    });

    // Remove file handler
    removeOverallPayrollFile.addEventListener('click', () => {
        overallPayrollFile = null;
        overallPayrollPreview.classList.add('hidden');
        overallPayrollInput.value = '';
        sendBatchButton.disabled = true;
        document.getElementById('progressSection').classList.add('hidden');
        document.getElementById('responseSection').classList.add('hidden');
        lucide.createIcons();
    });

    // Send batch button handler
    sendBatchButton.addEventListener('click', async () => {
        if (!overallPayrollFile) {
            alert('Vui lòng chọn file Overall-payroll trước!');
            return;
        }

        // Scroll to bottom to show progress bar
        window.scrollTo({
            top: document.body.scrollHeight,
            behavior: 'smooth'
        });

        await sendBatchPayroll();
    });
}

function handleOverallPayrollFile(file) {
    // Validate file type
    const validExtensions = ['.xlsx', '.xls'];
    const fileName = file.name.toLowerCase();
    const isValid = validExtensions.some(ext => fileName.endsWith(ext));

    if (!isValid) {
        alert('❌ File không hợp lệ!\n\nVui lòng chọn file Excel (.xlsx hoặc .xls)');
        return;
    }

    // Store file
    overallPayrollFile = file;

    // Update UI
    const overallPayrollFileName = document.getElementById('overallPayrollFileName');
    const overallPayrollFileSize = document.getElementById('overallPayrollFileSize');
    const overallPayrollPreview = document.getElementById('overallPayrollPreview');
    const sendBatchButton = document.getElementById('sendBatchButton');

    overallPayrollFileName.textContent = file.name;
    overallPayrollFileSize.textContent = `${(file.size / 1024).toFixed(2)} KB • Sẵn sàng xử lý`;

    overallPayrollPreview.classList.remove('hidden');
    sendBatchButton.disabled = false;

    // Hide previous sections
    document.getElementById('progressSection').classList.add('hidden');
    document.getElementById('responseSection').classList.add('hidden');

    lucide.createIcons();

    console.log('✅ [BATCH] File loaded:', file.name);
}

async function sendBatchPayroll() {
    const sendBatchButton = document.getElementById('sendBatchButton');
    const progressSection = document.getElementById('progressSection');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const responseSection = document.getElementById('responseSection');

    try {
        console.log('📊 [BATCH SEND] Starting batch send with SSE...');

        const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
        if (!token) {
            throw new Error('No authentication token found. Please login again.');
        }

        // Show loading state
        sendBatchButton.disabled = true;
        sendBatchButton.innerHTML = `
            <div class="animate-spin">
                <i data-lucide="loader-2" class="w-5 h-5"></i>
            </div>
            Đang xử lý...
        `;
        lucide.createIcons();

        // Show progress bar
        progressSection.classList.remove('hidden');
        responseSection.classList.add('hidden');

        // Track results
        const results = {
            success: [],
            noGmail: [],
            notFound: [],
            failed: [],
            limitReached: []
        };
        let totalEmployees = 0;
        let dailyLimit = 80;
        let totalSentToday = 0;
        let remainingQuota = 80;

        // Upload file first to get SSE endpoint
        const formData = new FormData();
        formData.append('overallPayroll', overallPayrollFile);

        // Create EventSource for SSE
        console.log('📤 [BATCH SEND] Creating SSE connection...');

        // We need to use fetch with streaming instead of EventSource because EventSource doesn't support POST
        const response = await fetch(`${API_CONFIG.BASE_URL}/payroll/batch-send`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Read SSE stream
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = JSON.parse(line.slice(6));
                    console.log('📥 [SSE] Received:', data);

                    if (data.type === 'start') {
                        totalEmployees = data.total;
                        dailyLimit = data.dailyLimit || 80;
                        totalSentToday = data.todayCount || 0;
                        remainingQuota = data.remainingQuota || 80;
                        progressText.textContent = `0/${totalEmployees}`;
                        progressBar.style.width = '0%';
                    } else if (data.type === 'progress') {
                        // Update progress bar
                        const percentage = (data.current / data.total) * 100;
                        progressBar.style.width = `${percentage}%`;
                        progressText.textContent = `${data.current}/${data.total}`;

                        // Add to results
                        if (data.status === 'success') {
                            results.success.push({
                                employeeName: data.employeeName,
                                employeeCode: data.employeeCode,
                                email: data.email
                            });
                        } else if (data.status === 'noGmail') {
                            results.noGmail.push({
                                employeeName: data.employeeName,
                                employeeCode: data.employeeCode,
                                reason: 'Chưa cập nhật Gmail'
                            });
                        } else if (data.status === 'notFound') {
                            results.notFound.push({
                                employeeName: data.employeeName,
                                employeeCode: data.employeeCode,
                                reason: 'Không tìm thấy nhân viên'
                            });
                        } else if (data.status === 'failed') {
                            results.failed.push({
                                employeeName: data.employeeName,
                                employeeCode: data.employeeCode,
                                email: data.email,
                                error: data.error
                            });
                        } else if (data.status === 'limitReached') {
                            results.limitReached.push({
                                employeeName: data.employeeName,
                                employeeCode: data.employeeCode,
                                email: data.email,
                                reason: 'Đạt giới hạn 80 emails/ngày'
                            });
                        }

                        // Update daily quota if available
                        if (data.emailsSentToday !== undefined) {
                            totalSentToday = data.emailsSentToday;
                        }
                        if (data.remainingQuota !== undefined) {
                            remainingQuota = data.remainingQuota;
                        }
                    } else if (data.type === 'complete') {
                        console.log('✅ [SSE] Batch send complete!');
                        // Will display results after loop
                    } else if (data.type === 'error') {
                        throw new Error(data.message || data.error);
                    }
                }
            }
        }

        // Hide progress, show results
        progressSection.classList.add('hidden');
        responseSection.classList.remove('hidden');

        // Show daily limit warning if applicable
        if (totalSentToday > 0 || results.limitReached.length > 0) {
            const dailyLimitWarning = document.getElementById('dailyLimitWarning');
            dailyLimitWarning.classList.remove('hidden');
            document.getElementById('totalSentToday').textContent = totalSentToday;
            document.getElementById('remainingQuota').textContent = remainingQuota;
        }

        // Update summary stats
        document.getElementById('totalCount').textContent = totalEmployees;
        document.getElementById('successCount').textContent = results.success.length;
        document.getElementById('noGmailCount').textContent = results.noGmail.length;
        document.getElementById('limitReachedCount').textContent = results.limitReached.length;
        document.getElementById('failedCount').textContent = results.notFound.length + results.failed.length;

        // Populate success list
        if (results.success.length > 0) {
            document.getElementById('successSection').classList.remove('hidden');
            document.getElementById('successList').innerHTML = results.success.map((item, idx) => `
                <div class="flex items-center gap-3 p-2 bg-white rounded-lg">
                    <div class="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <span class="text-xs font-semibold text-green-600">${idx + 1}</span>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-gray-800 truncate">${item.employeeName}</p>
                        <p class="text-xs text-gray-500 truncate">${item.employeeCode} • ${item.email}</p>
                    </div>
                    <i data-lucide="check" class="w-4 h-4 text-green-500 flex-shrink-0"></i>
                </div>
            `).join('');
        }

        // Populate no gmail list
        if (results.noGmail.length > 0) {
            document.getElementById('noGmailSection').classList.remove('hidden');
            document.getElementById('noGmailList').innerHTML = results.noGmail.map((item, idx) => `
                <div class="flex items-center gap-3 p-2 bg-white rounded-lg">
                    <div class="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                        <span class="text-xs font-semibold text-yellow-600">${idx + 1}</span>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-gray-800 truncate">${item.employeeName}</p>
                        <p class="text-xs text-gray-500 truncate">${item.employeeCode} • ${item.reason}</p>
                    </div>
                    <i data-lucide="alert-circle" class="w-4 h-4 text-yellow-500 flex-shrink-0"></i>
                </div>
            `).join('');
        }

        // Populate limit reached list
        if (results.limitReached.length > 0) {
            document.getElementById('limitReachedSection').classList.remove('hidden');
            document.getElementById('limitReachedList').innerHTML = results.limitReached.map((item, idx) => `
                <div class="flex items-center gap-3 p-2 bg-white rounded-lg">
                    <div class="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                        <span class="text-xs font-semibold text-orange-600">${idx + 1}</span>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-gray-800 truncate">${item.employeeName}</p>
                        <p class="text-xs text-gray-500 truncate">${item.employeeCode} • ${item.email}</p>
                    </div>
                    <i data-lucide="clock" class="w-4 h-4 text-orange-500 flex-shrink-0"></i>
                </div>
            `).join('');
        }

        // Populate failed list (combine notFound and failed)
        const failedItems = [
            ...results.notFound.map(item => ({ ...item, type: 'notFound' })),
            ...results.failed.map(item => ({ ...item, type: 'failed' }))
        ];
        if (failedItems.length > 0) {
            document.getElementById('failedSection').classList.remove('hidden');
            document.getElementById('failedList').innerHTML = failedItems.map((item, idx) => `
                <div class="flex items-center gap-3 p-2 bg-white rounded-lg">
                    <div class="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                        <span class="text-xs font-semibold text-red-600">${idx + 1}</span>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-gray-800 truncate">${item.employeeName}</p>
                        <p class="text-xs text-gray-500 truncate">${item.employeeCode} • ${item.reason || item.error}</p>
                    </div>
                    <i data-lucide="x" class="w-4 h-4 text-red-500 flex-shrink-0"></i>
                </div>
            `).join('');
        }

        lucide.createIcons();

        // Reset button
        sendBatchButton.innerHTML = `
            <i data-lucide="send" class="w-5 h-5"></i>
            Gửi bảng lương cho tất cả nhân viên
        `;
        sendBatchButton.disabled = false;
        lucide.createIcons();

    } catch (error) {
        console.error('❌ [BATCH SEND] Error:', error);
        alert(`❌ Lỗi!\n\n${error.message}`);

        progressSection.classList.add('hidden');

        // Reset button
        sendBatchButton.innerHTML = `
            <i data-lucide="send" class="w-5 h-5"></i>
            Gửi bảng lương cho tất cả nhân viên
        `;
        sendBatchButton.disabled = false;
        lucide.createIcons();
    }
}

// Download payroll file with authentication
async function downloadPayrollFile(downloadUrl, fileName) {
    try {
        console.log('📥 [DOWNLOAD] Downloading:', fileName);

        const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
        if (!token) {
            alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
            return;
        }

        // Fetch file with authentication
        const response = await fetch(`${API_CONFIG.BASE_URL}${downloadUrl}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to download: ${response.statusText}`);
        }

        // Convert to blob and trigger download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        console.log('✅ [DOWNLOAD] Downloaded successfully:', fileName);

    } catch (error) {
        console.error('❌ [DOWNLOAD] Error:', error);
        alert(`❌ Lỗi tải xuống!\n\n${error.message}`);
    }
}
