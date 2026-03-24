// ============================================
// TEKERS - Reviews Page JavaScript
// ============================================

(function () {
    'use strict';

    const CSRF_TOKEN = document.querySelector('input[name="csrfmiddlewaretoken"]')?.value || '';
    let selectedRating = 0;
    let currentGoogleCredential = null;

    // Restore auth state after Google redirect
    if (typeof _googleRedirectCredential !== 'undefined' && _googleRedirectCredential) {
        currentGoogleCredential = _googleRedirectCredential;
    }
    if (typeof _googleRedirectUser !== 'undefined' && _googleRedirectUser) {
        window.currentUser = _googleRedirectUser;
        if (typeof updateHeaderUI === 'function') updateHeaderUI();
        setTimeout(updateReviewFormVisibility, 200);
    }

    // ── Star Rating Interaction ──────────────────────
    const starBtns = document.querySelectorAll('.star-btn');
    const ratingInput = document.getElementById('rating-value');

    starBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            selectedRating = parseInt(btn.dataset.rating);
            ratingInput.value = selectedRating;
            updateStarDisplay(selectedRating);
        });

        btn.addEventListener('mouseenter', () => {
            highlightStars(parseInt(btn.dataset.rating));
        });
    });

    const starsContainer = document.querySelector('.stars-interactive');
    if (starsContainer) {
        starsContainer.addEventListener('mouseleave', () => {
            highlightStars(selectedRating);
        });
    }

    function updateStarDisplay(rating) {
        starBtns.forEach(btn => {
            const val = parseInt(btn.dataset.rating);
            btn.classList.toggle('active', val <= rating);
        });
    }

    function highlightStars(rating) {
        starBtns.forEach(btn => {
            const val = parseInt(btn.dataset.rating);
            btn.classList.toggle('hover', val <= rating);
        });
    }

    // ── Character Counter ────────────────────────────
    const commentField = document.getElementById('review-comment');
    const charCount = document.getElementById('char-count');

    if (commentField && charCount) {
        commentField.addEventListener('input', () => {
            charCount.textContent = commentField.value.length;
        });
    }

    // ── Auth State for Reviews ───────────────────────
    function updateReviewFormVisibility() {
        const loginPrompt = document.getElementById('login-prompt');
        const formCard = document.getElementById('review-form-card');
        const formAvatar = document.getElementById('form-user-avatar');
        const formName = document.getElementById('form-user-name');
        const formEmail = document.getElementById('form-user-email');

        if (!loginPrompt || !formCard) return;

        if (typeof currentUser !== 'undefined' && currentUser) {
            loginPrompt.style.display = 'none';
            formCard.style.display = 'block';

            if (formAvatar) formAvatar.src = currentUser.picture || '';
            if (formName) formName.textContent = currentUser.name || 'User';
            if (formEmail) {
                const email = currentUser.email || '';
                formEmail.textContent = maskEmailClient(email);
            }

            // Check if user already has a review
            checkExistingReview(currentUser.id);
        } else {
            loginPrompt.style.display = 'flex';
            formCard.style.display = 'none';
        }
    }

    function maskEmailClient(email) {
        try {
            const [name, domain] = email.split('@');
            const visible = name.length > 2 ? name.slice(0, 2) : name.slice(0, 1);
            return visible + '***@' + domain;
        } catch {
            return '***@***.com';
        }
    }

    // ── Check Existing Review ────────────────────────
    function checkExistingReview(googleId) {
        fetch(`/api/reviews/user/?google_id=${encodeURIComponent(googleId)}`)
            .then(res => res.json())
            .then(data => {
                if (data.has_review) {
                    // Pre-fill form
                    selectedRating = data.review.rating;
                    ratingInput.value = selectedRating;
                    updateStarDisplay(selectedRating);
                    if (commentField) commentField.value = data.review.comment;
                    if (charCount) charCount.textContent = data.review.comment.length;

                    const submitBtn = document.getElementById('review-submit-btn');
                    if (submitBtn) {
                        submitBtn.querySelector('span').textContent = 'Update Review';
                    }

                    const formNote = document.getElementById('form-note');
                    if (formNote) {
                        formNote.textContent = 'You have already submitted a review. Submitting again will update it.';
                        formNote.style.display = 'block';
                    }
                }
            })
            .catch(err => console.error('Error checking existing review:', err));
    }

    // ── Submit Review ────────────────────────────────
    const reviewForm = document.getElementById('review-form');

    if (reviewForm) {
        reviewForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Validate
            if (!selectedRating || selectedRating < 1) {
                showNotification('Please select a star rating.', 'error');
                return;
            }

            const comment = commentField?.value?.trim();
            if (!comment) {
                showNotification('Please write a review comment.', 'error');
                return;
            }

            // Check auth
            if (typeof currentUser === 'undefined' || !currentUser) {
                showNotification('Please sign in with Google first.', 'error');
                return;
            }

            // Get fresh Google credential
            if (!currentGoogleCredential) {
                showNotification('Session expired. Please sign in again.', 'error');
                handleLogout();
                return;
            }

            const submitBtn = document.getElementById('review-submit-btn');
            const originalHTML = submitBtn.innerHTML;
            submitBtn.innerHTML = '<span>Submitting...</span>';
            submitBtn.disabled = true;

            try {
                const response = await fetch('/api/reviews/submit/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': CSRF_TOKEN,
                    },
                    body: JSON.stringify({
                        credential: currentGoogleCredential,
                        rating: selectedRating,
                        comment: comment,
                    }),
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    const action = data.action === 'created' ? 'submitted' : 'updated';
                    showNotification(`Review ${action} successfully! It will appear after admin approval.`, 'success');

                    submitBtn.innerHTML = '<span>Review ' + (data.action === 'created' ? 'Submitted!' : 'Updated!') + '</span>';
                    submitBtn.style.background = 'linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)';

                    setTimeout(() => {
                        submitBtn.innerHTML = originalHTML;
                        submitBtn.querySelector('span').textContent = 'Update Review';
                        submitBtn.disabled = false;
                        submitBtn.style.background = '';
                    }, 3000);
                } else {
                    const errorMsg = data.error || 'Failed to submit review.';
                    showNotification(errorMsg, 'error');

                    // Handle specific auth errors
                    if (response.status === 401) {
                        showNotification('Authentication expired. Please sign in again.', 'error');
                        handleLogout();
                    }

                    submitBtn.innerHTML = originalHTML;
                    submitBtn.disabled = false;
                }
            } catch (error) {
                console.error('Submit review error:', error);
                showNotification('Network error. Please check your connection.', 'error');
                submitBtn.innerHTML = originalHTML;
                submitBtn.disabled = false;
            }
        });
    }

    // ── Override handleCredentialResponse to capture token ──
    const originalHandleCredentialResponse = window.handleCredentialResponse;

    window.handleCredentialResponse = function (response) {
        // Store the raw credential for API calls
        currentGoogleCredential = response.credential;

        // Call the original handler
        if (originalHandleCredentialResponse) {
            originalHandleCredentialResponse(response);
        }

        // Update reviews form after sign-in
        setTimeout(updateReviewFormVisibility, 100);
    };

    // ── Override handleLogout to clear review state ──
    const originalHandleLogout = window.handleLogout;

    window.handleLogout = function () {
        currentGoogleCredential = null;

        if (originalHandleLogout) {
            originalHandleLogout();
        }

        updateReviewFormVisibility();
    };

    // ── Initialize on page load ──────────────────────
    // Pick up credential from Google redirect (server verified it)
    if (typeof _googleRedirectCredential !== 'undefined' && _googleRedirectCredential) {
        currentGoogleCredential = _googleRedirectCredential;
    }

    // Poll for currentUser to be set (from main.js Google auth)
    const authCheckInterval = setInterval(() => {
        if (typeof currentUser !== 'undefined' && currentUser) {
            clearInterval(authCheckInterval);
            updateReviewFormVisibility();
        }
    }, 500);

    // Stop checking after 10 seconds
    setTimeout(() => clearInterval(authCheckInterval), 10000);

    // Also check immediately on DOMContentLoaded
    document.addEventListener('DOMContentLoaded', () => {
        updateReviewFormVisibility();
    });

    // ── Scroll animations for review cards ───────────
    const reviewCards = document.querySelectorAll('.review-card');
    const reviewObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    reviewCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
        reviewObserver.observe(card);
    });
})();
