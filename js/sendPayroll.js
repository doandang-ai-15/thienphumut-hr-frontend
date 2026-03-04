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

// ============================================================
// IMPORT HISTORY FEATURE (Cloudinary storage)
// ============================================================

let _importHistoryAllDetails = [];

/** Escape HTML to prevent XSS */
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function formatViDate(isoString) {
    if (!isoString) return '';
    return new Date(isoString).toLocaleString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

/** Open modal */
async function openImportHistoryModal() {
    const modal = document.getElementById('importHistoryModal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    showSessionListView();
    await loadImportHistory();
    lucide.createIcons();
}

function closeImportHistoryModal() {
    document.getElementById('importHistoryModal').classList.add('hidden');
    document.getElementById('importHistoryModal').classList.remove('flex');
}

function showSessionListView() {
    document.getElementById('importHistorySessionList').classList.remove('hidden');
    document.getElementById('importHistoryDetailView').classList.add('hidden');
}

function backToSessionList() { showSessionListView(); }

/** Fetch and render session list */
async function loadImportHistory() {
    const loadingEl = document.getElementById('importHistoryLoading');
    const emptyEl   = document.getElementById('importHistoryEmpty');
    const listEl    = document.getElementById('importHistoryList');

    loadingEl.classList.remove('hidden');
    emptyEl.classList.add('hidden');
    listEl.classList.add('hidden');
    listEl.innerHTML = '';

    try {
        const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
        const res = await fetch(`${API_CONFIG.BASE_URL}/payroll/import-history`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        loadingEl.classList.add('hidden');

        if (!data.sessions || data.sessions.length === 0) {
            emptyEl.classList.remove('hidden');
            emptyEl.classList.add('flex');
            return;
        }

        listEl.classList.remove('hidden');
        listEl.innerHTML = data.sessions.map(s => renderSessionCard(s)).join('');
        lucide.createIcons();

    } catch (err) {
        console.error('❌ [IMPORT HISTORY]', err);
        loadingEl.classList.add('hidden');
        listEl.classList.remove('hidden');
        listEl.innerHTML = `<div class="text-center py-8 text-red-400 text-sm">Lỗi tải lịch sử: ${err.message}</div>`;
    }
}

/** Render one session card */
function renderSessionCard(s) {
    const hasFile = !!s.file_url;
    return `
    <div class="border border-gray-100 rounded-xl p-4 hover:border-[#F875AA]/30 hover:shadow-sm transition-all bg-white">
        <div class="flex items-start justify-between gap-4">
            <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span class="font-medium text-gray-800 text-sm truncate max-w-[220px]">${escapeHtml(s.file_name)}</span>
                    ${s.month_period && s.month_period !== 'N/A'
                        ? `<span class="px-2 py-0.5 rounded-full bg-[#F875AA]/10 text-[#F875AA] text-xs font-medium">${escapeHtml(s.month_period)}</span>`
                        : ''}
                </div>
                <div class="flex items-center gap-3 text-xs text-gray-400 mb-3 flex-wrap">
                    <span class="flex items-center gap-1"><i data-lucide="clock" class="w-3 h-3"></i>${formatViDate(s.imported_at)}</span>
                    ${s.imported_by_name ? `<span class="flex items-center gap-1"><i data-lucide="user" class="w-3 h-3"></i>${escapeHtml(s.imported_by_name)}</span>` : ''}
                </div>
                <div class="flex flex-wrap gap-2">
                    <span class="px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">👥 ${s.total_employees} NV</span>
                    <span class="px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium">✅ ${s.total_success} gửi OK</span>
                    ${s.total_failed       > 0 ? `<span class="px-2.5 py-1 rounded-full bg-red-50 text-red-600 text-xs font-medium">❌ ${s.total_failed} lỗi</span>` : ''}
                    ${s.total_no_gmail    > 0 ? `<span class="px-2.5 py-1 rounded-full bg-yellow-50 text-yellow-700 text-xs font-medium">📭 ${s.total_no_gmail} Gmail</span>` : ''}
                    ${s.total_not_found   > 0 ? `<span class="px-2.5 py-1 rounded-full bg-orange-50 text-orange-600 text-xs font-medium">🔍 ${s.total_not_found} N/F</span>` : ''}
                    ${s.total_limit_reached > 0 ? `<span class="px-2.5 py-1 rounded-full bg-purple-50 text-purple-600 text-xs font-medium">⏸ ${s.total_limit_reached} quota</span>` : ''}
                </div>
            </div>
            <div class="flex flex-col gap-2 flex-shrink-0">
                <button onclick="openSessionDetail(${s.id}, '${escapeHtml(s.file_name)}', '${escapeHtml(s.imported_at)}')"
                    class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F875AA]/10 text-[#F875AA] hover:bg-[#F875AA]/20 text-xs font-medium whitespace-nowrap">
                    <i data-lucide="list" class="w-3.5 h-3.5"></i>Chi tiết
                </button>
                ${hasFile
                    ? `<a href="${escapeHtml(s.file_url)}" target="_blank" download
                           class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-medium whitespace-nowrap text-center">
                           <i data-lucide="download" class="w-3.5 h-3.5"></i>Tải file
                       </a>`
                    : `<span class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 text-gray-400 text-xs whitespace-nowrap cursor-not-allowed">
                           <i data-lucide="cloud-off" class="w-3.5 h-3.5"></i>Không có file
                       </span>`
                }
            </div>
        </div>
    </div>`;
}

/** Open detail view for a session */
async function openSessionDetail(sessionId, fileName, importedAt) {
    document.getElementById('importHistorySessionList').classList.add('hidden');
    document.getElementById('importHistoryDetailView').classList.remove('hidden');
    document.getElementById('detailSessionTitle').textContent = fileName;
    document.getElementById('detailSessionDate').textContent = formatViDate(importedAt);
    document.getElementById('detailTableBody').innerHTML =
        `<tr><td colspan="6" class="text-center py-8 text-gray-400">
            <div class="flex items-center justify-center gap-2">
                <span class="animate-spin inline-block w-4 h-4 border-2 border-[#F875AA] border-t-transparent rounded-full"></span>
                Đang tải chi tiết...
            </div>
        </td></tr>`;
    document.getElementById('detailSummaryCards').innerHTML = '';

    // Reset filter tabs
    document.querySelectorAll('.detail-filter-btn').forEach(btn => {
        btn.className = btn.className.replace('bg-[#F875AA] text-white', 'bg-gray-100 text-gray-600 hover:bg-gray-200');
    });
    const allBtn = document.querySelector('.detail-filter-btn[data-filter="all"]');
    if (allBtn) allBtn.className = allBtn.className.replace('bg-gray-100 text-gray-600 hover:bg-gray-200', 'bg-[#F875AA] text-white');
    lucide.createIcons();

    try {
        const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
        const res = await fetch(`${API_CONFIG.BASE_URL}/payroll/import-history/${sessionId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const session = data.session;
        _importHistoryAllDetails = data.details || [];

        // Summary cards
        const cards = [
            { label: 'Đã gửi',         value: session.total_success,       color: 'text-green-600',  bg: 'bg-green-50',  icon: '✅' },
            { label: 'Lỗi gửi',        value: session.total_failed,        color: 'text-red-600',    bg: 'bg-red-50',    icon: '❌' },
            { label: 'Chưa có Gmail',  value: session.total_no_gmail,      color: 'text-yellow-700', bg: 'bg-yellow-50', icon: '📭' },
            { label: 'Không tìm thấy',value: session.total_not_found,     color: 'text-orange-600', bg: 'bg-orange-50', icon: '🔍' },
            { label: 'Vượt quota',     value: session.total_limit_reached, color: 'text-purple-600', bg: 'bg-purple-50', icon: '⏸' },
        ];
        document.getElementById('detailSummaryCards').innerHTML = cards.map(c =>
            `<div class="rounded-xl ${c.bg} px-4 py-3 text-center">
                <div class="text-2xl font-bold ${c.color}">${c.value}</div>
                <div class="text-xs text-gray-500 mt-0.5">${c.icon} ${c.label}</div>
            </div>`
        ).join('');

        renderDetailTable('all');
        lucide.createIcons();

    } catch (err) {
        console.error('❌ [IMPORT HISTORY] detail error:', err);
        document.getElementById('detailTableBody').innerHTML =
            `<tr><td colspan="6" class="text-center py-8 text-red-400">Lỗi tải chi tiết: ${err.message}</td></tr>`;
    }
}

/** Render detail table with filter */
function renderDetailTable(filter) {
    const rows = filter === 'all'
        ? _importHistoryAllDetails
        : _importHistoryAllDetails.filter(d => d.status === filter);

    const STATUS = {
        sent:          { label: 'Đã gửi',         cls: 'bg-green-100 text-green-700' },
        failed:        { label: 'Lỗi gửi',         cls: 'bg-red-100 text-red-700' },
        no_gmail:      { label: 'Chưa có Gmail',   cls: 'bg-yellow-100 text-yellow-700' },
        not_found:     { label: 'Không tìm thấy',  cls: 'bg-orange-100 text-orange-700' },
        limit_reached: { label: 'Vượt quota',       cls: 'bg-purple-100 text-purple-700' }
    };

    if (rows.length === 0) {
        document.getElementById('detailTableBody').innerHTML =
            `<tr><td colspan="6" class="text-center py-8 text-gray-400 text-sm">Không có dữ liệu</td></tr>`;
        return;
    }

    document.getElementById('detailTableBody').innerHTML = rows.map((row, i) => {
        const s = STATUS[row.status] || { label: row.status, cls: 'bg-gray-100 text-gray-600' };
        return `<tr class="hover:bg-gray-50/50 transition-colors">
            <td class="px-4 py-3 text-xs text-gray-400">${i + 1}</td>
            <td class="px-4 py-3 text-sm font-mono text-gray-700">${escapeHtml(row.employee_code || '—')}</td>
            <td class="px-4 py-3 text-sm text-gray-800 font-medium">${escapeHtml(row.employee_name || '—')}</td>
            <td class="px-4 py-3 text-sm text-gray-500">${escapeHtml(row.email || '—')}</td>
            <td class="px-4 py-3"><span class="px-2.5 py-1 rounded-full text-xs font-medium ${s.cls}">${s.label}</span></td>
            <td class="px-4 py-3 text-xs text-gray-400 max-w-[160px] truncate" title="${escapeHtml(row.error_message || '')}">
                ${row.error_message ? escapeHtml(row.error_message) : '—'}
            </td>
        </tr>`;
    }).join('');
}

/** Switch filter tab */
function filterDetailTable(filter) {
    document.querySelectorAll('.detail-filter-btn').forEach(btn => {
        const active = btn.dataset.filter === filter;
        btn.className = active
            ? btn.className.replace('bg-gray-100 text-gray-600 hover:bg-gray-200', 'bg-[#F875AA] text-white')
            : btn.className.replace('bg-[#F875AA] text-white', 'bg-gray-100 text-gray-600 hover:bg-gray-200');
    });
    renderDetailTable(filter);
}

