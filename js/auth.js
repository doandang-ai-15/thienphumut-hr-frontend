// Authentication JavaScript for Login Page

// Check if already logged in
if (api.isAuthenticated() && window.location.pathname.includes('login.html')) {
    window.location.href = '/index.html';
}

// Handle Login
async function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    const btn = document.getElementById('loginBtn');
    const btnText = document.getElementById('loginBtnText');
    const btnLoader = document.getElementById('loginBtnLoader');

    // Show loading
    btnText.classList.add('hidden');
    btnLoader.classList.remove('hidden');
    btnLoader.classList.add('flex');
    btn.disabled = true;

    try {
        const response = await api.login(email, password);

        if (response.success) {
            // Show success message
            showSuccessMessage('Login successful! Redirecting to dashboard...');

            // Redirect after short delay
            setTimeout(() => {
                window.location.href = '/index.html';
            }, 1000);
        }
    } catch (error) {
        // Show error message
        showErrorMessage(error.message || 'Login failed. Please check your credentials.');

        // Reset button
        btnText.classList.remove('hidden');
        btnLoader.classList.add('hidden');
        btnLoader.classList.remove('flex');
        btn.disabled = false;
    }
}

// Handle Register
async function handleRegister(event) {
    event.preventDefault();

    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Validate passwords match
    if (password !== confirmPassword) {
        showErrorMessage('Passwords do not match');
        return;
    }

    const btn = document.getElementById('registerBtn');
    const btnText = document.getElementById('registerBtnText');
    const btnLoader = document.getElementById('registerBtnLoader');

    // Show loading
    btnText.classList.add('hidden');
    btnLoader.classList.remove('hidden');
    btnLoader.classList.add('flex');
    btn.disabled = true;

    try {
        // Split name into first and last
        const nameParts = name.trim().split(' ');
        const first_name = nameParts[0];
        const last_name = nameParts.slice(1).join(' ') || nameParts[0];

        const response = await api.register({
            first_name,
            last_name,
            email,
            password,
            job_title: 'Employee',
            employment_type: 'full-time'
        });

        if (response.success) {
            showSuccessMessage('Account created successfully! Redirecting...');

            setTimeout(() => {
                window.location.href = '/index.html';
            }, 1000);
        }
    } catch (error) {
        showErrorMessage(error.message || 'Registration failed. Please try again.');

        // Reset button
        btnText.classList.remove('hidden');
        btnLoader.classList.add('hidden');
        btnLoader.classList.remove('flex');
        btn.disabled = false;
    }
}

// Show error message with animation
function showErrorMessage(message) {
    const container = document.createElement('div');
    container.className = 'fixed top-4 right-4 z-50 animate-slide-in';
    container.innerHTML = `
        <div class="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 shadow-lg max-w-md">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                    <i data-lucide="x-circle" class="w-5 h-5 text-red-500"></i>
                </div>
                <div class="flex-1">
                    <p class="text-sm font-medium text-red-800">Error</p>
                    <p class="text-sm text-red-600">${message}</p>
                </div>
                <button onclick="this.closest('.fixed').remove()" class="text-red-400 hover:text-red-600">
                    <i data-lucide="x" class="w-5 h-5"></i>
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(container);
    lucide.createIcons();

    setTimeout(() => {
        container.remove();
    }, 5000);
}

// Show success message with animation
function showSuccessMessage(message) {
    const container = document.createElement('div');
    container.className = 'fixed top-4 right-4 z-50 animate-slide-in';
    container.innerHTML = `
        <div class="bg-green-50 border-l-4 border-green-500 rounded-lg p-4 shadow-lg max-w-md">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <i data-lucide="check-circle" class="w-5 h-5 text-green-500"></i>
                </div>
                <div class="flex-1">
                    <p class="text-sm font-medium text-green-800">Success</p>
                    <p class="text-sm text-green-600">${message}</p>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(container);
    lucide.createIcons();

    setTimeout(() => {
        container.remove();
    }, 3000);
}
