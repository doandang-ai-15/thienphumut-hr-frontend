// Check authentication
if (!requireAuth()) {
    throw new Error('Not authenticated');
}

// Check admin authorization
const currentUser = api.getUser();
if (!currentUser || currentUser.role !== 'admin') {
    alert('Access Denied: Only administrators can access this page.\n\nBạn không có quyền truy cập trang này.');
    window.location.href = '/index.html';
    throw new Error('Unauthorized: Admin access required');
}

// Email statistics tracking
let emailStats = {
    today: 0,
    thisMonth: 0,
    sending: 0,
    success: 0
};

let statsUpdateInterval = null;

function loadEmailStats() {
    const savedStats = localStorage.getItem('timesheetEmailStats');
    if (savedStats) {
        try {
            const stats = JSON.parse(savedStats);
            const today = new Date().toDateString();
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();

            if (stats.lastDate === today) {
                emailStats.today = stats.today || 0;
            } else {
                emailStats.today = 0;
            }

            if (stats.lastMonth === currentMonth && stats.lastYear === currentYear) {
                emailStats.thisMonth = stats.thisMonth || 0;
            } else {
                emailStats.thisMonth = 0;
            }
        } catch (e) {
            console.error('Failed to parse stats:', e);
        }
    }
    updateStatsDisplay();
}

function saveEmailStats() {
    const today = new Date().toDateString();
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    localStorage.setItem('timesheetEmailStats', JSON.stringify({
        today: emailStats.today,
        thisMonth: emailStats.thisMonth,
        lastDate: today,
        lastMonth: currentMonth,
        lastYear: currentYear
    }));
}

function updateStatsDisplay() {
    document.getElementById('mailsToday').textContent = emailStats.today;
    document.getElementById('mailsThisMonth').textContent = emailStats.thisMonth;
    document.getElementById('mailsSending').textContent = emailStats.sending;
    document.getElementById('mailsSuccess').textContent = emailStats.success;

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

function startStatsUpdate() {
    if (statsUpdateInterval) return;
    statsUpdateInterval = setInterval(() => {
        updateStatsDisplay();
        if (emailStats.sending === 0 && emailStats.success === 0) {
            stopStatsUpdate();
        }
    }, 250);
}

function stopStatsUpdate() {
    if (statsUpdateInterval) {
        clearInterval(statsUpdateInterval);
        statsUpdateInterval = null;
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    lucide.createIcons();
    loadEmailStats();
    setupTimesheetSending();
});

// ========== TIMESHEET SENDING FUNCTIONS ==========

let timesheetFile = null;

function setupTimesheetSending() {
    const fileInput = document.getElementById('timesheetFileInput');
    const uploadZone = document.getElementById('timesheetUploadZone');
    const filePreview = document.getElementById('timesheetFilePreview');
    const removeFileBtn = document.getElementById('removeTimesheetFile');
    const sendButton = document.getElementById('sendTimesheetButton');

    // File input change
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) handleTimesheetFile(file);
    });

    fileInput.addEventListener('click', (e) => e.stopPropagation());

    uploadZone.addEventListener('click', (e) => {
        if (e.target !== fileInput) fileInput.click();
    });

    // Drag and drop
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
        const file = e.dataTransfer.files[0];
        if (file) handleTimesheetFile(file);
    });

    // Remove file
    removeFileBtn.addEventListener('click', () => {
        timesheetFile = null;
        filePreview.classList.add('hidden');
        fileInput.value = '';
        sendButton.disabled = true;
        document.getElementById('progressSection').classList.add('hidden');
        document.getElementById('responseSection').classList.add('hidden');
        lucide.createIcons();
    });

    // Send button
    sendButton.addEventListener('click', async () => {
        if (!timesheetFile) {
            alert('Vui lòng chọn file bảng chấm công trước!');
            return;
        }

        const saveMonth = document.getElementById('saveMonth').value.trim();
        if (!saveMonth) {
            alert('Vui lòng nhập tháng/năm!');
            return;
        }

        // Validate format
        const monthRegex = /^\d{1,2}\s*\/\s*\d{4}$/;
        if (!monthRegex.test(saveMonth)) {
            alert('Định dạng tháng/năm không hợp lệ!\n\nVui lòng nhập theo định dạng: THÁNG / NĂM\nVí dụ: 01 / 2026');
            return;
        }

        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        await sendBatchTimesheet();
    });
}

function handleTimesheetFile(file) {
    const validExtensions = ['.xlsx', '.xls'];
    const fileName = file.name.toLowerCase();
    const isValid = validExtensions.some(ext => fileName.endsWith(ext));

    if (!isValid) {
        alert('File không hợp lệ!\n\nVui lòng chọn file Excel (.xlsx hoặc .xls)');
        return;
    }

    timesheetFile = file;

    document.getElementById('timesheetFileName').textContent = file.name;
    document.getElementById('timesheetFileSize').textContent = `${(file.size / 1024).toFixed(2)} KB`;

    document.getElementById('timesheetFilePreview').classList.remove('hidden');
    document.getElementById('sendTimesheetButton').disabled = false;

    document.getElementById('progressSection').classList.add('hidden');
    document.getElementById('responseSection').classList.add('hidden');

    lucide.createIcons();
}

// ============================================================
// IMPORT HISTORY FEATURE
// ============================================================

let _importHistoryAllDetails = [];

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
        const res = await fetch(`${API_CONFIG.BASE_URL}/timesheet/import-history`, {
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
        console.error('[IMPORT HISTORY]', err);
        loadingEl.classList.add('hidden');
        listEl.classList.remove('hidden');
        listEl.innerHTML = `<div class="text-center py-8 text-red-400 text-sm">Lỗi tải lịch sử: ${err.message}</div>`;
    }
}

function renderSessionCard(s) {
    const hasFile = !!s.file_url;
    const machineLabel = s.timesheet_number ? `Máy ${s.timesheet_number}` : '';
    return `
    <div class="border border-gray-100 rounded-xl p-4 hover:border-teal-300 hover:shadow-sm transition-all bg-white">
        <div class="flex items-start justify-between gap-4">
            <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span class="font-medium text-gray-800 text-sm truncate max-w-[220px]">${escapeHtml(s.file_name)}</span>
                    ${s.month_period ? `<span class="px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 text-xs font-medium">${escapeHtml(s.month_period)}</span>` : ''}
                    ${machineLabel ? `<span class="px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-700 text-xs font-medium">${escapeHtml(machineLabel)}</span>` : ''}
                </div>
                <div class="flex items-center gap-3 text-xs text-gray-400 mb-3 flex-wrap">
                    <span class="flex items-center gap-1"><i data-lucide="clock" class="w-3 h-3"></i>${formatViDate(s.imported_at)}</span>
                    ${s.imported_by_name ? `<span class="flex items-center gap-1"><i data-lucide="user" class="w-3 h-3"></i>${escapeHtml(s.imported_by_name)}</span>` : ''}
                </div>
                <div class="flex flex-wrap gap-2">
                    <span class="px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">${s.total_employees} NV</span>
                    <span class="px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium">${s.total_success} gửi OK</span>
                    ${s.total_failed > 0 ? `<span class="px-2.5 py-1 rounded-full bg-red-50 text-red-600 text-xs font-medium">${s.total_failed} lỗi</span>` : ''}
                    ${s.total_no_gmail > 0 ? `<span class="px-2.5 py-1 rounded-full bg-yellow-50 text-yellow-700 text-xs font-medium">${s.total_no_gmail} Gmail</span>` : ''}
                    ${s.total_not_found > 0 ? `<span class="px-2.5 py-1 rounded-full bg-orange-50 text-orange-600 text-xs font-medium">${s.total_not_found} N/F</span>` : ''}
                    ${s.total_limit_reached > 0 ? `<span class="px-2.5 py-1 rounded-full bg-purple-50 text-purple-600 text-xs font-medium">${s.total_limit_reached} quota</span>` : ''}
                </div>
            </div>
            <div class="flex flex-col gap-2 flex-shrink-0">
                <button onclick="openSessionDetail(${s.id}, '${escapeHtml(s.file_name)}', '${escapeHtml(s.imported_at)}')"
                    class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 text-teal-600 hover:bg-teal-100 text-xs font-medium whitespace-nowrap">
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

async function openSessionDetail(sessionId, fileName, importedAt) {
    document.getElementById('importHistorySessionList').classList.add('hidden');
    document.getElementById('importHistoryDetailView').classList.remove('hidden');
    document.getElementById('detailSessionTitle').textContent = fileName;
    document.getElementById('detailSessionDate').textContent = formatViDate(importedAt);
    document.getElementById('detailTableBody').innerHTML =
        `<tr><td colspan="6" class="text-center py-8 text-gray-400">
            <div class="flex items-center justify-center gap-2">
                <span class="animate-spin inline-block w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full"></span>
                Đang tải chi tiết...
            </div>
        </td></tr>`;
    document.getElementById('detailSummaryCards').innerHTML = '';

    document.querySelectorAll('.detail-filter-btn').forEach(btn => {
        btn.className = btn.className.replace('bg-teal-500 text-white', 'bg-gray-100 text-gray-600 hover:bg-gray-200');
    });
    const allBtn = document.querySelector('.detail-filter-btn[data-filter="all"]');
    if (allBtn) allBtn.className = allBtn.className.replace('bg-gray-100 text-gray-600 hover:bg-gray-200', 'bg-teal-500 text-white');
    lucide.createIcons();

    try {
        const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
        const res = await fetch(`${API_CONFIG.BASE_URL}/timesheet/import-history/${sessionId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const session = data.session;
        _importHistoryAllDetails = data.details || [];

        const cards = [
            { label: 'Đã gửi',        value: session.total_success,       color: 'text-green-600',  bg: 'bg-green-50' },
            { label: 'Lỗi gửi',       value: session.total_failed,        color: 'text-red-600',    bg: 'bg-red-50' },
            { label: 'Chưa có Gmail',  value: session.total_no_gmail,      color: 'text-yellow-700', bg: 'bg-yellow-50' },
            { label: 'Không tìm thấy', value: session.total_not_found,     color: 'text-orange-600', bg: 'bg-orange-50' },
            { label: 'Vượt quota',     value: session.total_limit_reached, color: 'text-purple-600', bg: 'bg-purple-50' },
        ];
        document.getElementById('detailSummaryCards').innerHTML = cards.map(c =>
            `<div class="rounded-xl ${c.bg} px-4 py-3 text-center">
                <div class="text-2xl font-bold ${c.color}">${c.value}</div>
                <div class="text-xs text-gray-500 mt-0.5">${c.label}</div>
            </div>`
        ).join('');

        renderDetailTable('all');
        lucide.createIcons();

    } catch (err) {
        console.error('[IMPORT HISTORY] detail error:', err);
        document.getElementById('detailTableBody').innerHTML =
            `<tr><td colspan="6" class="text-center py-8 text-red-400">Lỗi tải chi tiết: ${err.message}</td></tr>`;
    }
}

function renderDetailTable(filter) {
    const rows = filter === 'all'
        ? _importHistoryAllDetails
        : _importHistoryAllDetails.filter(d => d.status === filter);

    const STATUS = {
        sent:          { label: 'Đã gửi',        cls: 'bg-green-100 text-green-700' },
        failed:        { label: 'Lỗi gửi',        cls: 'bg-red-100 text-red-700' },
        no_gmail:      { label: 'Chưa có Gmail',  cls: 'bg-yellow-100 text-yellow-700' },
        not_found:     { label: 'Không tìm thấy', cls: 'bg-orange-100 text-orange-700' },
        limit_reached: { label: 'Vượt quota',      cls: 'bg-purple-100 text-purple-700' }
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

function filterDetailTable(filter) {
    document.querySelectorAll('.detail-filter-btn').forEach(btn => {
        const active = btn.dataset.filter === filter;
        btn.className = active
            ? btn.className.replace('bg-gray-100 text-gray-600 hover:bg-gray-200', 'bg-teal-500 text-white')
            : btn.className.replace('bg-teal-500 text-white', 'bg-gray-100 text-gray-600 hover:bg-gray-200');
    });
    renderDetailTable(filter);
}

// ============================================================
// TIMESHEET SENDING
// ============================================================

async function sendBatchTimesheet() {
    const sendButton = document.getElementById('sendTimesheetButton');
    const progressSection = document.getElementById('progressSection');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const responseSection = document.getElementById('responseSection');

    try {
        const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
        if (!token) {
            throw new Error('No authentication token found. Please login again.');
        }

        // Show loading state
        sendButton.disabled = true;
        sendButton.innerHTML = `
            <div class="animate-spin">
                <i data-lucide="loader-2" class="w-5 h-5"></i>
            </div>
            Đang xử lý...
        `;
        lucide.createIcons();

        progressSection.classList.remove('hidden');
        responseSection.classList.add('hidden');

        // Build FormData
        const formData = new FormData();
        formData.append('timesheetFile', timesheetFile);
        formData.append('timesheet_number', document.getElementById('timesheetNumber').value);
        formData.append('save_month', document.getElementById('saveMonth').value.trim());
        formData.append('skip_from', document.getElementById('skipFrom').value || '0');
        formData.append('skip_to', document.getElementById('skipTo').value || '0');

        // Track results
        const results = {
            success: [],
            noGmail: [],
            notFound: [],
            failed: [],
            limitReached: []
        };
        let totalEmployees = 0;
        let totalSentToday = 0;
        let remainingQuota = 300;

        // Fetch with SSE streaming
        const response = await fetch(`${API_CONFIG.BASE_URL}/timesheet/batch-send`, {
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

                    if (data.type === 'start') {
                        totalEmployees = data.total;
                        totalSentToday = data.todayCount || 0;
                        remainingQuota = data.remainingQuota || 300;
                        progressText.textContent = `0/${totalEmployees}`;
                        progressBar.style.width = '0%';
                    } else if (data.type === 'progress') {
                        const percentage = (data.current / data.total) * 100;
                        progressBar.style.width = `${percentage}%`;
                        progressText.textContent = `${data.current}/${data.total}`;

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
                                reason: 'Đạt giới hạn 300 emails/ngày'
                            });
                        }
                    } else if (data.type === 'complete') {
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

        // Daily limit warning
        if (totalSentToday > 0 || results.limitReached.length > 0) {
            document.getElementById('dailyLimitWarning').classList.remove('hidden');
            document.getElementById('totalSentToday').textContent = totalSentToday;
            document.getElementById('remainingQuota').textContent = remainingQuota;
        }

        // Summary stats
        document.getElementById('totalCount').textContent = totalEmployees;
        document.getElementById('successCount').textContent = results.success.length;
        document.getElementById('noGmailCount').textContent = results.noGmail.length;
        document.getElementById('limitReachedCount').textContent = results.limitReached.length;
        document.getElementById('failedCount').textContent = results.notFound.length + results.failed.length;

        // Update email stats
        emailStats.today += results.success.length;
        emailStats.thisMonth += results.success.length;
        emailStats.success = results.success.length;
        saveEmailStats();
        updateStatsDisplay();

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
                        <p class="text-xs text-gray-500 truncate">${item.employeeCode} &bull; ${item.email}</p>
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
                        <p class="text-xs text-gray-500 truncate">${item.employeeCode} &bull; ${item.reason}</p>
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
                        <p class="text-xs text-gray-500 truncate">${item.employeeCode} &bull; ${item.email}</p>
                    </div>
                    <i data-lucide="clock" class="w-4 h-4 text-orange-500 flex-shrink-0"></i>
                </div>
            `).join('');
        }

        // Populate failed list
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
                        <p class="text-xs text-gray-500 truncate">${item.employeeCode} &bull; ${item.reason || item.error}</p>
                    </div>
                    <i data-lucide="x" class="w-4 h-4 text-red-500 flex-shrink-0"></i>
                </div>
            `).join('');
        }

        lucide.createIcons();

        // Reset button
        sendButton.innerHTML = `
            <i data-lucide="send" class="w-5 h-5"></i>
            Gửi bảng chấm công cho tất cả nhân viên
        `;
        sendButton.disabled = false;
        lucide.createIcons();

    } catch (error) {
        console.error('[TIMESHEET] Error:', error);
        alert(`Lỗi!\n\n${error.message}`);

        progressSection.classList.add('hidden');

        sendButton.innerHTML = `
            <i data-lucide="send" class="w-5 h-5"></i>
            Gửi bảng chấm công cho tất cả nhân viên
        `;
        sendButton.disabled = false;
        lucide.createIcons();
    }
}
