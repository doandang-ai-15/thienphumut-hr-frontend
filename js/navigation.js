// Global Navigation Script

// Mobile Menu Toggle
function setupMobileMenu() {
    // Create mobile menu button if it doesn't exist
    const header = document.querySelector('header');
    if (!header) return;

    // Check if button already exists
    if (document.getElementById('mobile-menu-btn')) return;

    // Create hamburger button
    const menuBtn = document.createElement('button');
    menuBtn.id = 'mobile-menu-btn';
    menuBtn.className = 'lg:hidden p-2 rounded-xl bg-white/80 border border-gray-100 hover:border-[#F875AA]/30 transition-all';
    menuBtn.innerHTML = '<i data-lucide="menu" class="w-5 h-5 text-gray-600"></i>';

    // Insert button at the start of header
    const headerDiv = header.querySelector('div');
    if (headerDiv) {
        headerDiv.insertBefore(menuBtn, headerDiv.firstChild);
    }

    // Get sidebar
    const sidebar = document.querySelector('aside');
    if (!sidebar) return;

    // Add mobile overlay
    const overlay = document.createElement('div');
    overlay.id = 'mobile-menu-overlay';
    overlay.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-40 hidden lg:hidden';
    document.body.appendChild(overlay);

    // Toggle sidebar function
    function toggleSidebar() {
        sidebar.classList.toggle('hidden');
        sidebar.classList.toggle('fixed');
        sidebar.classList.toggle('inset-y-0');
        sidebar.classList.toggle('left-0');
        sidebar.classList.toggle('z-50');
        overlay.classList.toggle('hidden');
    }

    // Click handlers
    menuBtn.addEventListener('click', toggleSidebar);
    overlay.addEventListener('click', toggleSidebar);

    // Close sidebar when clicking nav links on mobile
    const navLinks = sidebar.querySelectorAll('nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth < 1024) { // lg breakpoint
                toggleSidebar();
            }
        });
    });

    // Re-initialize Lucide icons for the new button
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Update user info in sidebar and header
async function updateSidebarUser() {
    try {
        console.log('🔄 [NAV] Starting updateSidebarUser...');

        // Get fresh user data from API
        const response = await api.getMe();
        console.log('📡 [NAV] API response:', response);

        if (!response.success || !response.data) {
            console.warn('⚠️ [NAV] Failed to fetch user data, using cached user');
            const cachedUser = api.getUser();
            console.log('💾 [NAV] Using cached user:', cachedUser);
            if (!cachedUser) {
                console.error('❌ [NAV] No cached user available');
                return;
            }
            updateUserDisplay(cachedUser);
            hideRestrictedNavItems(cachedUser);
            return;
        }

        const user = response.data;
        console.log('👤 [NAV] Fetched user info from API:', user);
        console.log('👤 [NAV] User fields - first_name:', user.first_name, 'last_name:', user.last_name, 'job_title:', user.job_title);

        // Update display with fresh data
        updateUserDisplay(user);

        // Hide sendPayroll link for non-admin users
        hideRestrictedNavItems(user);

    } catch (error) {
        console.error('❌ [NAV] Failed to update user info:', error);
        console.error('❌ [NAV] Error details:', error.message, error.stack);
        // Fallback to cached user data
        const cachedUser = api.getUser();
        if (cachedUser) {
            console.log('💾 [NAV] Fallback to cached user:', cachedUser);
            updateUserDisplay(cachedUser);
            hideRestrictedNavItems(cachedUser);
        }
    }
}

// Helper function to update user display elements
function updateUserDisplay(user) {
    console.log('🔄 [NAV] updateUserDisplay called with user:', user);

    // Get user initials
    const initials = user.first_name && user.last_name
        ? `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
        : (user.email ? user.email[0].toUpperCase() : 'U');

    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email || 'User';
    const jobTitle = user.job_title || user.role || 'Employee';

    console.log('🔄 [NAV] Updating display with:', { initials, fullName, jobTitle });

    // Strategy: Find all avatar elements first, then work up to find their containers
    const avatarElements = document.querySelectorAll('.w-9.h-9.rounded-full, .w-10.h-10.rounded-full');
    console.log('🔍 [NAV] Found', avatarElements.length, 'avatar elements');

    let updatedCount = 0;
    avatarElements.forEach((avatar, index) => {
        console.log(`🔍 [NAV] Processing avatar ${index + 1}/${avatarElements.length}`);

        // Skip if this avatar contains an image (not text initials)
        if (avatar.querySelector('img')) {
            console.log(`⏭️ [NAV] Avatar ${index + 1} contains img, skipping`);
            return;
        }

        // Get the parent container that has both avatar and user info
        // User profile structure: parent div contains avatar + info div + logout link
        // We need to get the parent, not the avatar itself (which also has flex items-center)
        const container = avatar.parentElement;
        if (!container || !container.classList.contains('flex')) {
            console.log(`⚠️ [NAV] Avatar ${index + 1} - no container found or not flex`);
            console.log(`⚠️ [NAV] Avatar HTML:`, avatar.outerHTML);
            return;
        }
        console.log(`✅ [NAV] Avatar ${index + 1} - Found container`);
        console.log(`📋 [NAV] Container HTML:`, container.outerHTML.substring(0, 300));

        // Find name and role elements within this specific container
        const infoContainer = container.querySelector('.flex-1.min-w-0');
        if (!infoContainer) {
            console.log(`⚠️ [NAV] Avatar ${index + 1} - no infoContainer found`);
            console.log(`📋 [NAV] Container classes:`, container.className);
            console.log(`📋 [NAV] Container children:`, container.children.length);
            for (let i = 0; i < container.children.length; i++) {
                console.log(`  Child ${i}:`, container.children[i].className);
            }
            return;
        }

        const nameEl = infoContainer.querySelector('.text-sm.font-medium.text-gray-800');
        const roleEl = infoContainer.querySelector('.text-xs.text-gray-500');

        console.log(`🔍 [NAV] Avatar ${index + 1} - nameEl:`, nameEl ? 'found' : 'NOT FOUND', ', roleEl:', roleEl ? 'found' : 'NOT FOUND');

        // Update avatar initials - always update since HTML is now empty
        avatar.textContent = initials;
        console.log(`✅ [NAV] Avatar ${index + 1} - Updated avatar to:`, initials);

        // Update user name - always update since HTML is now empty
        if (nameEl) {
            nameEl.textContent = fullName;
            console.log(`✅ [NAV] Avatar ${index + 1} - Updated name to:`, fullName);
        } else {
            console.error(`❌ [NAV] Avatar ${index + 1} - Name element not found!`);
        }

        // Update job title - always update since HTML is now empty
        if (roleEl) {
            roleEl.textContent = jobTitle;
            console.log(`✅ [NAV] Avatar ${index + 1} - Updated role to:`, jobTitle);
        } else {
            console.error(`❌ [NAV] Avatar ${index + 1} - Role element not found!`);
        }

        updatedCount++;
    });

    console.log(`✅ [NAV] Successfully updated ${updatedCount} user profile section(s)`);
}

// Hide restricted navigation items based on user role
function hideRestrictedNavItems(user) {
    // Only admin can access sendPayroll
    if (user.role !== 'admin') {
        const sendPayrollLink = document.querySelector('aside a[href="sendPayroll.html"]');
        if (sendPayrollLink) {
            sendPayrollLink.style.display = 'none';
            console.log('🔒 [AUTH] Hidden sendPayroll link for role:', user.role);
        }
    }
}

// Setup logout button
function setupLogoutButton() {
    const logoutLinks = document.querySelectorAll('a[href="login.html"]');
    logoutLinks.forEach(link => {
        link.addEventListener('click', async (e) => {
            e.preventDefault();

            if (confirm('Are you sure you want to logout?')) {
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
        });
    });
}

// Highlight active nav item
function highlightActiveNav() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('aside nav a');

    navLinks.forEach(link => {
        const href = link.getAttribute('href');

        // Remove active classes
        link.classList.remove('bg-gradient-to-r', 'from-[#F875AA]/20', 'to-[#AEDEFC]/20', 'text-[#F875AA]');
        link.classList.add('text-gray-500', 'hover:text-[#F875AA]');

        // Add active classes to current page
        if (href === currentPage || (currentPage === '' && href === 'index.html')) {
            link.classList.remove('text-gray-500', 'hover:text-[#F875AA]');
            link.classList.add('bg-gradient-to-r', 'from-[#F875AA]/20', 'to-[#AEDEFC]/20', 'text-[#F875AA]');
        }
    });
}

// Add loading spinner to body
function addLoadingSpinner() {
    if (document.getElementById('loader')) return;

    const loader = document.createElement('div');
    loader.id = 'loader';
    loader.className = 'fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center hidden';
    loader.innerHTML = `
        <div class="text-center">
            <div class="w-16 h-16 border-4 border-[#F875AA]/30 border-t-[#F875AA] rounded-full animate-spin mx-auto"></div>
            <p class="mt-4 text-gray-600 font-medium">Loading...</p>
        </div>
    `;
    document.body.appendChild(loader);
}

// Initialize navigation on all pages
document.addEventListener('DOMContentLoaded', function() {
    // Check if on a protected page
    const publicPages = ['login.html'];
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    if (!publicPages.includes(currentPage)) {
        // Add loading spinner
        addLoadingSpinner();

        // Setup mobile menu
        setupMobileMenu();

        // Update sidebar user
        updateSidebarUser();

        // Setup logout
        setupLogoutButton();

        // Highlight active nav
        highlightActiveNav();
    }
});
