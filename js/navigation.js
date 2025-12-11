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

// Update user info in sidebar
async function updateSidebarUser() {
    try {
        const user = api.getUser();
        if (!user) return;

        // Update sidebar user name
        const sidebarNameElements = document.querySelectorAll('aside .text-sm.font-medium.text-gray-800');
        sidebarNameElements.forEach(el => {
            if (el.textContent.includes('John Doe') || el.textContent.includes('JD')) {
                el.textContent = `${user.first_name} ${user.last_name}`;
            }
        });

        // Update sidebar user initials
        const sidebarAvatars = document.querySelectorAll('aside .w-10.h-10.rounded-full');
        sidebarAvatars.forEach(el => {
            if (el.textContent === 'JD' || el.textContent.length <= 2) {
                el.textContent = `${user.first_name[0]}${user.last_name[0]}`;
            }
        });

        // Update sidebar role
        const roleElements = document.querySelectorAll('aside .text-xs.text-gray-500');
        roleElements.forEach(el => {
            if (el.textContent === 'HR Manager') {
                el.textContent = user.job_title || user.role;
            }
        });
    } catch (error) {
        console.error('Failed to update sidebar user:', error);
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
