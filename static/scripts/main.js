// ============================================
// TEKERS - Main JavaScript
// ============================================

// DOM Elements
const navbar = document.getElementById('navbar');
const navMenu = document.getElementById('nav-menu');
const navToggle = document.getElementById('nav-toggle');
const navLinks = document.querySelectorAll('.nav-link');
const contactForm = document.getElementById('contact-form');
const statNumbers = document.querySelectorAll('.stat-number');

// Handle cross-page navigation links (for services/projects pages)
document.addEventListener('DOMContentLoaded', () => {
    // Find all links that point to index.html with hash
    const crossPageLinks = document.querySelectorAll('a[href*="index.html#"]');

    crossPageLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            // Let the browser navigate, the hash will be handled on the new page
            // No preventDefault needed - we want the navigation to happen
        });
    });
});

// Navbar Scroll Effect
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Mobile Menu Toggle
navToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    navToggle.classList.toggle('active');
});

// Close mobile menu when clicking on a link
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        navToggle.classList.remove('active');
    });
});

// Smooth Scrolling for Navigation Links
if (navLinks && navLinks.length > 0) {
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');

            // Check if link is to another page (contains index.html)
            if (href && href.includes('index.html#')) {
                // Allow navigation to happen, then scroll on the new page
                // The hash will be handled by the code below
                return; // Let the browser handle the navigation
            }

            // For same-page links, prevent default and smooth scroll
            e.preventDefault();
            const targetId = href;
            const targetSection = document.querySelector(targetId);

            if (targetSection) {
                const offsetTop = targetSection.offsetTop - 80;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Active Navigation Link on Scroll
const sections = document.querySelectorAll('.section');

window.addEventListener('scroll', () => {
    let current = '';
    const scrollPosition = window.scrollY + 200;

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;

        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
});

// Intersection Observer for Scroll Animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe service cards
document.querySelectorAll('.service-card').forEach((card, index) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    card.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
    observer.observe(card);
});

// Observe project cards
document.querySelectorAll('.project-card').forEach((card, index) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    card.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
    observer.observe(card);
});

// Observe stat items
document.querySelectorAll('.stat-item').forEach((item, index) => {
    item.style.opacity = '0';
    item.style.transform = 'translateY(20px)';
    item.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
    observer.observe(item);
});

// Counter Animation for Stats
const animateCounter = (element) => {
    const target = parseInt(element.getAttribute('data-target'));
    const duration = 2000;
    const increment = target / (duration / 16);
    let current = 0;

    const updateCounter = () => {
        current += increment;
        if (current < target) {
            element.textContent = Math.floor(current);
            requestAnimationFrame(updateCounter);
        } else {
            element.textContent = target;
        }
    };

    updateCounter();
};

// Observe stat numbers for counter animation
const statObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
            entry.target.classList.add('counted');
            animateCounter(entry.target);
        }
    });
}, { threshold: 0.5 });

statNumbers.forEach(stat => {
    statObserver.observe(stat);
});

// ============================================
// Google Authentication & EmailJS Integration
// ============================================

// Configuration
// IMPORTANT: Replace with your Google OAuth 2.0 Client ID from Google Cloud Console
// Get it from: https://console.cloud.google.com/apis/credentials
const GOOGLE_CLIENT_ID = '908517504569-q4c0bleq0gpb8kednlfct5tqs5g0376d.apps.googleusercontent.com';

// User state management
let currentUser = null;
let isSigningIn = false;

// DOM Elements for Auth (will be set on DOMContentLoaded)
let googleSigninContainer;
let userProfile;
let userAvatar;
let logoutButton;

// EmailJS Configuration
const EMAILJS_SERVICE_ID = 'service_nf8rry8';
const EMAILJS_TEMPLATE_ID = 'template_89gkm91';
const EMAILJS_PUBLIC_KEY = 'VBtsTa6iew5vcaeG-';

// Initialize EmailJS
if (typeof emailjs !== 'undefined') {
    emailjs.init(EMAILJS_PUBLIC_KEY);
}

// Get browser and device information
function getBrowserInfo() {
    const ua = navigator.userAgent;
    let browser = 'Unknown';
    let deviceType = 'Desktop';
    let os = 'Unknown';

    // Detect browser
    if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
    else if (ua.includes('Edg')) browser = 'Edge';
    else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera';

    // Detect device type
    if (/tablet|ipad|playbook|silk/i.test(ua)) deviceType = 'Tablet';
    else if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(ua)) deviceType = 'Mobile';

    // Detect OS
    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

    return { browser, deviceType, os };
}

// Update header UI based on auth state
function updateHeaderUI() {
    const wrapper = document.getElementById('signin-wrapper');
    const profile = document.getElementById('user-profile');

    if (!wrapper || !profile || !userAvatar) return;

    if (currentUser) {
        // User is signed in - show avatar and logout
        wrapper.style.display = 'none';
        profile.style.display = 'flex';
        if (userAvatar) {
            userAvatar.src = currentUser.picture || '';
            userAvatar.alt = currentUser.name || 'User Avatar';
        }
    } else {
        // User is not signed in - show sign-in button
        wrapper.style.display = 'block';
        profile.style.display = 'none';
    }
}

// Initialize Google Sign-In
function initializeGoogleSignIn() {
    const googleBtnContainer = document.getElementById('google-signin-button');
    if (!googleBtnContainer) return;

    if (typeof google !== 'undefined' && google.accounts) {
        if (!GOOGLE_CLIENT_ID) return;

        const isReviewsPage = window.location.pathname.includes('/reviews/');

        google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleCredentialResponse,
            ux_mode: 'redirect',
            login_uri: isReviewsPage
                ? 'https://tekers.tech/reviews/'
                : 'https://tekers.tech/',
            auto_select: false,
            cancel_on_tap_outside: true
        });

        google.accounts.id.renderButton(
            googleBtnContainer,
            {
                type: 'standard',
                theme: 'filled_blue',
                size: 'large',
                text: 'signin_with',
                shape: 'pill',
                width: 250,
                locale: 'en'
            }
        );

        googleBtnContainer.style.opacity = '0.01';
    }
}

// Handle Google Sign-In response
function handleCredentialResponse(response) {
    try {
        // Decode JWT token (basic decode without verification for frontend)
        const base64Url = response.credential.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        const credential = JSON.parse(jsonPayload);

        // Store user data
        currentUser = {
            id: credential.sub,
            name: credential.name,
            email: credential.email,
            picture: credential.picture
        };

        // Update UI
        updateHeaderUI();
        isSigningIn = false;

        // If we were in the process of sending a message, continue
        if (window.pendingMessage) {
            sendEmailMessage(window.pendingMessage);
            window.pendingMessage = null;
        }
    } catch (error) {
        console.error('Error handling credential response:', error);
        showNotification('Sign-in failed. Please try again.', 'error');
        isSigningIn = false;
    }
}

// Trigger Google Sign-In popup (using GIS prompt API)
function triggerGoogleSignIn() {
    if (isSigningIn) return;

    if (typeof google !== 'undefined' && google.accounts) {
        isSigningIn = true;
        google.accounts.id.prompt((notification) => {
            if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                isSigningIn = false;
                // If prompt can't show (e.g. blocked by browser), guide user to the header button
                showNotification('Please use the Sign-In button in the header.', 'info');
            }
        });
    } else {
        showNotification('Google Sign-In is not available. Please refresh the page.', 'error');
    }
}

// Logout function
function handleLogout() {
    currentUser = null;
    updateHeaderUI();

    // Clear any pending messages
    window.pendingMessage = null;

    // Sign out from Google
    if (typeof google !== 'undefined' && google.accounts) {
        google.accounts.id.disableAutoSelect();
    }

    showNotification('Signed out successfully', 'success');
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'error' ? '#ff4444' : type === 'success' ? '#00ff88' : 'var(--color-primary)'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        animation: slideIn 0.3s ease;
        font-weight: 500;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add notification animations to CSS dynamically
if (!document.getElementById('notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(400px);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

// Send email via EmailJS
function sendEmailMessage(formData) {
    if (!currentUser) {
        showNotification('Please sign in to send a message', 'error');
        return;
    }

    const submitButton = contactForm.querySelector('.btn-submit');
    const originalText = submitButton.innerHTML;

    submitButton.innerHTML = '<span>Sending...</span>';
    submitButton.disabled = true;

    const browserInfo = getBrowserInfo();
    const submissionDate = new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short'
    });

    // Prepare email template parameters
    const templateParams = {
        from_name: currentUser.name,
        from_email: currentUser.email,
        subject: formData.subject,
        message: formData.message,
        user_id: currentUser.id,
        browser: browserInfo.browser,
        device_type: browserInfo.deviceType,
        operating_system: browserInfo.os,
        submission_date: submissionDate
    };

    // Send email via EmailJS
    if (typeof emailjs !== 'undefined') {
        emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams)
            .then((response) => {
                submitButton.innerHTML = '<span>Message Sent!</span>';
                submitButton.style.background = 'linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)';
                showNotification('Message sent successfully!', 'success');

                // Reset form
                contactForm.reset();

                // Reset button after 3 seconds
                setTimeout(() => {
                    submitButton.innerHTML = originalText;
                    submitButton.disabled = false;
                    submitButton.style.background = '';
                }, 3000);
            })
            .catch((error) => {
                console.error('EmailJS Error:', error);
                submitButton.innerHTML = originalText;
                submitButton.disabled = false;
                showNotification('Failed to send message. Please try again.', 'error');
            });
    } else {
        submitButton.innerHTML = originalText;
        submitButton.disabled = false;
        showNotification('Email service not available. Please try again later.', 'error');
    }
}

// Contact Form Handling with Smart Sign-In
if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Get form data
        const formData = {
            subject: document.getElementById('subject').value.trim(),
            message: document.getElementById('message').value.trim()
        };

        // Validate form
        if (!formData.subject || !formData.message) {
            showNotification('Please fill in all fields', 'error');
            return;
        }

        // Check if user is signed in
        if (!currentUser) {
            // Store the message data
            window.pendingMessage = formData;

            // Show notification
            showNotification('Signing in to send your message...', 'info');

            // Trigger Google Sign-In
            triggerGoogleSignIn();
        } else {
            // User is signed in - send immediately
            sendEmailMessage(formData);
        }
    });
}


// Initialize Google Sign-In when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize DOM element references
    googleSigninContainer = document.getElementById('google-signin-button');
    userProfile = document.getElementById('user-profile');
    userAvatar = document.getElementById('user-avatar');
    logoutButton = document.getElementById('logout-button');

    // Logout button handler
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }

    // Restore auth from Google redirect (server verified the token and embedded user data)
    if (typeof _googleRedirectUser !== 'undefined' && _googleRedirectUser && _googleRedirectUser.id) {
        currentUser = {
            id: _googleRedirectUser.id,
            name: _googleRedirectUser.name,
            email: _googleRedirectUser.email,
            picture: _googleRedirectUser.picture
        };
        updateHeaderUI();
    }

    // Wait for Google Identity Services to load
    const checkGoogle = setInterval(() => {
        if (typeof google !== 'undefined' && google.accounts) {
            clearInterval(checkGoogle);
            initializeGoogleSignIn();
            updateHeaderUI();
            console.log('✅ [System] Google Identity Services loaded successfully');
        }
    }, 100);

    // Timeout after 5 seconds
    setTimeout(() => {
        clearInterval(checkGoogle);
        if (typeof google === 'undefined' || !google.accounts) {
            console.error('❌ [System] Google Identity Services failed to load. Check internet connection or script inclusion.');
            showNotification('Google Sign-In unavailable', 'error');

            // Show fallback button if container exists
            if (googleSigninContainer) {
                googleSigninContainer.innerHTML = '<button class="btn btn-secondary" onclick="window.location.reload()">Retry Sign-In</button>';
            }
        }
    }, 5000);
});

// Parallax Effect for Hero Section
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const heroVisual = document.querySelector('.hero-visual');
    const heroText = document.querySelector('.hero-text');

    if (heroVisual && scrolled < window.innerHeight) {
        heroVisual.style.transform = `translateY(${scrolled * 0.3}px)`;
        heroText.style.transform = `translateY(${scrolled * 0.1}px)`;
    }
});

// Add glow effect on hover for interactive elements
document.querySelectorAll('.service-card, .project-card, .info-card').forEach(element => {
    element.addEventListener('mouseenter', function () {
        this.style.transition = 'all 0.3s ease';
    });
});

// Handle hash navigation when page loads (for cross-page navigation)
function scrollToHash() {
    if (window.location.hash) {
        const hash = window.location.hash;
        const targetSection = document.querySelector(hash);

        if (targetSection) {
            // Wait a bit for page to fully load
            setTimeout(() => {
                const offsetTop = targetSection.offsetTop - 80;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }, 100);
        }
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Set initial active nav link (only if navLinks exist - i.e., on index.html)
    if (navLinks && navLinks.length > 0) {
        if (window.location.hash) {
            const hash = window.location.hash;
            navLinks.forEach(link => {
                if (link.getAttribute('href') === hash || link.getAttribute('href').endsWith(hash)) {
                    link.classList.add('active');
                }
            });
        } else {
            navLinks[0].classList.add('active');
        }
    }

    // Scroll to hash if present (for navigation from other pages)
    scrollToHash();

    // Add loading animation
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '1';
    }, 100);
});

// Also handle hash changes after page load
window.addEventListener('hashchange', () => {
    scrollToHash();

    // Update active nav link (only if navLinks exist - i.e., on index.html)
    if (navLinks && navLinks.length > 0) {
        const hash = window.location.hash;
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === hash || link.getAttribute('href').endsWith(hash)) {
                link.classList.add('active');
            }
        });
    }
});

// Smooth reveal animation for sections
const revealSections = document.querySelectorAll('.section-header, .about-text, .contact-info');

revealSections.forEach(section => {
    section.style.opacity = '0';
    section.style.transform = 'translateY(30px)';
    section.style.transition = 'opacity 0.8s ease, transform 0.8s ease';

    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.2 });

    sectionObserver.observe(section);
});

// Add cursor trail effect (optional enhancement)
let cursorTrail = [];
const maxTrailLength = 10;

document.addEventListener('mousemove', (e) => {
    // Only add trail on certain sections for performance
    const hoveredElement = e.target.closest('.service-card, .project-card, .btn');
    if (hoveredElement) {
        const trail = document.createElement('div');
        trail.className = 'cursor-trail';
        trail.style.left = e.clientX + 'px';
        trail.style.top = e.clientY + 'px';
        document.body.appendChild(trail);

        setTimeout(() => {
            trail.remove();
        }, 500);
    }
});

// Performance optimization: Throttle scroll events
let ticking = false;

function updateOnScroll() {
    // Scroll-based animations here
    ticking = false;
}

window.addEventListener('scroll', () => {
    if (!ticking) {
        window.requestAnimationFrame(updateOnScroll);
        ticking = true;
    }
});
