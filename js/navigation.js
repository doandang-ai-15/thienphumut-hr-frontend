// Global Navigation Script

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

        // Update sidebar user
        updateSidebarUser();

        // Setup logout
        setupLogoutButton();

        // Highlight active nav
        highlightActiveNav();
    }
});
