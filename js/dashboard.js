// Dashboard JavaScript - Integrate with Real API

// Check authentication
if (!requireAuth()) {
    throw new Error('Not authenticated');
}

// Load dashboard data
async function loadDashboard() {
    try {
        showLoading();

        // Get current user
        const userResponse = await api.getMe();
        const user = userResponse.data;

        // Update user info in header
        updateUserInfo(user);

        // Load employees and departments to calculate stats (like departments page)
        const [employeesResponse, departmentsResponse] = await Promise.all([
            api.getEmployees(),
            api.getDepartments()
        ]);

        // Calculate stats directly from data
        calculateAndUpdateStats(employeesResponse.data, departmentsResponse.data);

        // Load dashboard stats for charts and top performers
        const statsResponse = await api.getDashboardStats();
        const dashboardData = statsResponse.data;

        console.log('📊 Dashboard Stats Response:', dashboardData);
        console.log('🏆 Top Employees Data:', dashboardData.topEmployees);

        // Log each employee's photo status
        dashboardData.topEmployees.forEach((emp, index) => {
            console.log(`👤 Employee ${index + 1}: ${emp.first_name} ${emp.last_name}`);
            console.log(`   📷 Photo field exists: ${emp.photo ? 'YES' : 'NO'}`);
            if (emp.photo) {
                console.log(`   📷 Photo length: ${emp.photo.length} characters`);
                console.log(`   📷 Photo preview: ${emp.photo.substring(0, 50)}...`);
            }
        });

        // Update charts
        updateNewEmployeesChart(dashboardData.newEmployeesByMonth);
        updateDepartmentChart(dashboardData.departmentDistribution);

        // Update top performers with avatars
        updateTopPerformers(dashboardData.topEmployees);

        hideLoading();
    } catch (error) {
        hideLoading();
        console.error('Failed to load dashboard:', error);
        showError('Failed to load dashboard data. Please refresh the page.');
    }
}

// Update user info in header
function updateUserInfo(user) {
    const userNameElement = document.querySelector('header .text-sm.font-medium');
    if (userNameElement) {
        userNameElement.textContent = `${user.first_name} ${user.last_name}`;
    }

    // Update user initials
    const avatarElement = document.querySelector('header .w-8.h-8');
    if (avatarElement && !avatarElement.querySelector('img')) {
        const initials = `${user.first_name[0]}${user.last_name[0]}`;
        avatarElement.textContent = initials;
    }
}

// Calculate stats from raw data (same approach as departments page)
function calculateAndUpdateStats(employees, departments) {
    console.log('📊 Calculating stats from data...');
    console.log('👥 Employees:', employees.length);
    console.log('🏢 Departments:', departments.length);

    // Total Employees - count all employees with status 'active'
    const totalEmployees = employees.filter(emp => emp.status === 'active').length;

    // Total Departments
    const totalDepartments = departments.length;

    // New This Month - filter employees created in current month (UTC+7)
    const newThisMonth = calculateNewThisMonth(employees);

    console.log('✅ Calculated stats:', {
        totalEmployees,
        totalDepartments,
        newThisMonth
    });

    // Update stats cards
    updateStatsCards({
        total_employees: totalEmployees,
        total_departments: totalDepartments,
        new_this_month: newThisMonth
    });
}

// Calculate employees created in current month (UTC+7 timezone)
function calculateNewThisMonth(employees) {
    // Get current date in UTC+7
    const now = new Date();
    const utcPlus7Offset = 7 * 60; // 7 hours in minutes
    const localOffset = now.getTimezoneOffset(); // Get local timezone offset
    const offsetDiff = utcPlus7Offset + localOffset; // Calculate difference

    const nowInUTC7 = new Date(now.getTime() + offsetDiff * 60 * 1000);
    const currentYear = nowInUTC7.getFullYear();
    const currentMonth = nowInUTC7.getMonth(); // 0-indexed (0 = January)

    console.log('📅 Current date (UTC+7):', nowInUTC7.toISOString());
    console.log('📅 Current year:', currentYear, 'Current month:', currentMonth + 1);

    const newEmployees = employees.filter(emp => {
        if (!emp.created_at) return false;

        // Parse created_at date
        const createdDate = new Date(emp.created_at);

        // Convert to UTC+7
        const createdInUTC7 = new Date(createdDate.getTime() + offsetDiff * 60 * 1000);

        const empYear = createdInUTC7.getFullYear();
        const empMonth = createdInUTC7.getMonth();

        const isMatch = empYear === currentYear && empMonth === currentMonth;

        if (isMatch) {
            console.log('✨ New employee this month:', emp.first_name, emp.last_name, '- Created:', createdInUTC7.toISOString());
        }

        return isMatch;
    });

    console.log('✅ Total new employees this month:', newEmployees.length);
    return newEmployees.length;
}

// Update stats cards
function updateStatsCards(stats) {
    console.log('📊 Updating Dashboard Stats Cards:', stats);

    // Get stat cards container (grid with stats cards only, not the header)
    const statsGrid = document.querySelector('.grid.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-3');
    if (!statsGrid) {
        console.error('❌ Stats grid not found!');
        return;
    }

    // Get stat elements inside the stats cards only
    const statElements = statsGrid.querySelectorAll('.text-2xl.font-semibold.text-gray-800');
    console.log('📈 Found stat elements in stats grid:', statElements.length);

    // Total Employees (first card)
    if (statElements[0]) {
        console.log('👥 Setting Total Employees:', stats.total_employees);
        statElements[0].textContent = stats.total_employees || 0;
    }

    // New This Month (second card)
    if (statElements[1]) {
        console.log('✨ Setting New This Month:', stats.new_this_month);
        statElements[1].textContent = stats.new_this_month || 0;
    }

    // Departments (third card)
    if (statElements[2]) {
        console.log('🏢 Setting Departments:', stats.total_departments);
        statElements[2].textContent = stats.total_departments || 0;
    }
}

// Update new employees chart
function updateNewEmployeesChart(data) {
    const ctx = document.getElementById('newEmployeesChart');
    if (!ctx) return;

    const labels = data.map(d => d.month.trim());
    const values = data.map(d => parseInt(d.count) || 0);

    const colors = ['rgba(248, 117, 170, 0.8)', 'rgba(174, 222, 252, 0.8)', 'rgba(237, 255, 240, 0.9)'];
    const borderColors = ['#F875AA', '#AEDEFC', '#a8e6b0'];

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'New Employees',
                data: values,
                backgroundColor: colors.slice(0, values.length),
                borderColor: borderColors.slice(0, values.length),
                borderWidth: 2,
                borderRadius: 12,
                borderSkipped: false,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'white',
                    titleColor: '#1f2937',
                    bodyColor: '#6b7280',
                    borderColor: '#F875AA',
                    borderWidth: 1,
                    cornerRadius: 12,
                    padding: 12
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(248, 117, 170, 0.1)' },
                    ticks: { color: '#9ca3af' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#9ca3af' }
                }
            },
            animation: {
                duration: 1500,
                easing: 'easeOutQuart'
            }
        }
    });
}

// Update department distribution chart
function updateDepartmentChart(data) {
    const ctx = document.getElementById('departmentChart');
    if (!ctx) return;

    const labels = data.map(d => d.name);
    const values = data.map(d => parseInt(d.employee_count) || 0);
    const colors = data.map(d => d.color || '#F875AA');

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: colors,
                borderColor: 'white',
                borderWidth: 4,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        padding: 15,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        color: '#6b7280',
                        font: { size: 12 }
                    }
                },
                tooltip: {
                    backgroundColor: 'white',
                    titleColor: '#1f2937',
                    bodyColor: '#6b7280',
                    borderColor: '#F875AA',
                    borderWidth: 1,
                    cornerRadius: 12,
                    padding: 12
                }
            },
            animation: {
                animateRotate: true,
                animateScale: true,
                duration: 1500,
                easing: 'easeOutQuart'
            }
        }
    });
}

// Update top performers list
function updateTopPerformers(employees) {
    console.log('🎯 updateTopPerformers called with employees:', employees);

    const container = document.querySelector('.space-y-4');
    if (!container) {
        console.error('❌ Top performers container not found!');
        return;
    }

    container.innerHTML = '';

    const rankColors = [
        'from-yellow-400 to-yellow-500',
        'from-gray-300 to-gray-400',
        'from-amber-600 to-amber-700',
        'from-[#F875AA]/60 to-[#F875AA]/80',
        'from-[#AEDEFC]/60 to-[#AEDEFC]/80'
    ];

    const bgColors = [
        'from-[#F875AA]/5',
        'from-[#AEDEFC]/5',
        'from-[#EDFFF0]/30',
        'from-[#FDEDED]/30',
        'from-[#AEDEFC]/5'
    ];

    employees.forEach((emp, index) => {
        const initials = `${emp.first_name[0]}${emp.last_name[0]}`;
        const score = emp.performance_score || 0;

        console.log(`🏆 Rendering employee ${index + 1}: ${emp.first_name} ${emp.last_name}`);
        console.log(`   📷 Has photo: ${emp.photo ? 'YES' : 'NO'}`);

        // Build avatar HTML - use photo if available, otherwise show initials
        let avatarHTML;
        if (emp.photo) {
            console.log(`   ✅ Using photo for ${emp.first_name}`);
            avatarHTML = `
                <div class="w-12 h-12 rounded-full bg-gradient-to-br from-[#F875AA] to-[#AEDEFC] p-0.5">
                    <img src="${emp.photo}" alt="${emp.first_name} ${emp.last_name}"
                         class="w-full h-full rounded-full object-cover bg-white"
                         onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\\'w-full h-full rounded-full bg-white flex items-center justify-center\\'><span class=\\'text-sm font-medium text-gray-600\\'>${initials}</span></div>';">
                </div>
            `;
        } else {
            console.log(`   ℹ️ Using initials for ${emp.first_name} (no photo)`);
            avatarHTML = `
                <div class="w-12 h-12 rounded-full bg-gradient-to-br from-[#F875AA] to-[#AEDEFC] p-0.5">
                    <div class="w-full h-full rounded-full bg-white flex items-center justify-center">
                        <span class="text-sm font-medium text-gray-600">${initials}</span>
                    </div>
                </div>
            `;
        }

        const html = `
            <div class="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r ${bgColors[index]} to-transparent hover:from-[#F875AA]/10 transition-all group">
                <div class="rank-badge w-10 h-10 rounded-full bg-gradient-to-br ${rankColors[index]} flex items-center justify-center text-white font-bold shadow-lg">
                    ${index + 1}
                </div>
                ${avatarHTML}
                <div class="flex-1">
                    <p class="font-medium text-gray-800">${emp.first_name} ${emp.last_name}</p>
                    <p class="text-sm text-gray-500">${emp.job_title}</p>
                </div>
                <div class="flex-1 hidden sm:block">
                    <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div class="progress-bar h-full bg-gradient-to-r from-[#F875AA] to-[#AEDEFC] rounded-full" style="width: ${score}%"></div>
                    </div>
                </div>
                <div class="text-right">
                    <p class="font-semibold text-gray-800">${score}%</p>
                    <p class="text-xs text-gray-500">Performance</p>
                </div>
            </div>
        `;

        container.innerHTML += html;
    });

    // Animate progress bars
    setTimeout(() => {
        const progressBars = document.querySelectorAll('.progress-bar');
        progressBars.forEach((bar, index) => {
            const width = bar.style.width;
            bar.style.width = '0%';
            setTimeout(() => {
                bar.style.width = width;
            }, 100 + (index * 100));
        });
    }, 500);
}

// Logout function
async function handleLogout() {
    try {
        await api.logout();
        window.location.href = '/login.html';
    } catch (error) {
        console.error('Logout failed:', error);
        // Force logout anyway
        api.removeToken();
        window.location.href = '/login.html';
    }
}

// Initialize dashboard on page load
document.addEventListener('DOMContentLoaded', function() {
    loadDashboard();
    lucide.createIcons();

    // Animate progress bars on load
    setTimeout(() => {
        const progressBars = document.querySelectorAll('.progress-bar');
        progressBars.forEach((bar, index) => {
            const width = bar.style.width;
            bar.style.width = '0%';
            setTimeout(() => {
                bar.style.width = width;
            }, 500 + (index * 100));
        });
    }, 1000);
});
