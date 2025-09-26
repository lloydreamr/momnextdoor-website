/**
 * Contact form functionality for MomNextDoor
 * Handles form show/hide, validation, and submission
 */

export function initContactForm() {
    const showFormBtn = document.getElementById('showContactForm');
    const hideFormBtn = document.getElementById('hideContactForm');
    const formContainer = document.getElementById('contactFormContainer');
    const contactForm = document.querySelector('.contact-form');

    // Show contact form
    showFormBtn?.addEventListener('click', function() {
        formContainer.style.display = 'block';
        formContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Focus first input for accessibility
        setTimeout(() => {
            const firstInput = contactForm.querySelector('#contactName');
            firstInput?.focus();
        }, 300);
    });

    // Hide contact form
    hideFormBtn?.addEventListener('click', function() {
        formContainer.style.display = 'none';
        clearFormErrors();
        contactForm?.reset();
    });

    // Form validation and submission
    contactForm?.addEventListener('submit', function(e) {
        e.preventDefault();

        if (validateForm()) {
            submitForm();
        }
    });

    // Real-time validation
    const inputs = contactForm?.querySelectorAll('input, textarea');
    inputs?.forEach(input => {
        input.addEventListener('blur', function() {
            validateField(this);
        });
    });
}

function validateForm() {
    const form = document.querySelector('.contact-form');
    const nameField = form.querySelector('#contactName');
    const phoneField = form.querySelector('#contactPhone');
    const emailField = form.querySelector('#contactEmail');
    const messageField = form.querySelector('#careNeeds');

    let isValid = true;

    // Validate name
    if (!nameField.value.trim()) {
        showError('nameError', 'Please enter your name');
        isValid = false;
    } else {
        hideError('nameError');
    }

    // Validate phone
    const phonePattern = /^[\d\s\-\(\)\+]{10,}$/;
    if (!phoneField.value.trim()) {
        showError('phoneError', 'Please enter your phone number');
        isValid = false;
    } else if (!phonePattern.test(phoneField.value.replace(/\s/g, ''))) {
        showError('phoneError', 'Please enter a valid phone number');
        isValid = false;
    } else {
        hideError('phoneError');
    }

    // Validate email (optional but if provided, must be valid)
    if (emailField.value.trim()) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(emailField.value)) {
            showError('emailError', 'Please enter a valid email address');
            isValid = false;
        } else {
            hideError('emailError');
        }
    }

    // Validate message
    if (!messageField.value.trim()) {
        showError('messageError', 'Please tell us about your care needs');
        isValid = false;
    } else if (messageField.value.trim().length < 10) {
        showError('messageError', 'Please provide more details about your care needs');
        isValid = false;
    } else {
        hideError('messageError');
    }

    return isValid;
}

function validateField(field) {
    const fieldId = field.id;
    const errorId = fieldId.replace('contact', '').replace('careNeeds', 'message').toLowerCase() + 'Error';

    if (fieldId === 'contactName') {
        if (!field.value.trim()) {
            showError(errorId, 'Please enter your name');
        } else {
            hideError(errorId);
        }
    } else if (fieldId === 'contactPhone') {
        const phonePattern = /^[\d\s\-\(\)\+]{10,}$/;
        if (!field.value.trim()) {
            showError(errorId, 'Please enter your phone number');
        } else if (!phonePattern.test(field.value.replace(/\s/g, ''))) {
            showError(errorId, 'Please enter a valid phone number');
        } else {
            hideError(errorId);
        }
    } else if (fieldId === 'contactEmail' && field.value.trim()) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(field.value)) {
            showError(errorId, 'Please enter a valid email address');
        } else {
            hideError(errorId);
        }
    } else if (fieldId === 'careNeeds') {
        if (!field.value.trim()) {
            showError(errorId, 'Please tell us about your care needs');
        } else if (field.value.trim().length < 10) {
            showError(errorId, 'Please provide more details');
        } else {
            hideError(errorId);
        }
    }
}

function showError(errorId, message) {
    const errorElement = document.getElementById(errorId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
}

function hideError(errorId) {
    const errorElement = document.getElementById(errorId);
    if (errorElement) {
        errorElement.style.display = 'none';
    }
}

function clearFormErrors() {
    const errorElements = document.querySelectorAll('.error-message');
    errorElements.forEach(element => {
        element.style.display = 'none';
    });
}

function submitForm() {
    const form = document.querySelector('.contact-form');
    const submitBtn = form.querySelector('button[type="submit"]');

    // Show loading state
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Sending...';
    submitBtn.disabled = true;

    // Create FormData for Netlify Forms
    const formData = new FormData(form);

    fetch('/', {
        method: 'POST',
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(formData).toString()
    })
    .then(() => {
        // Success
        showSuccessMessage();
        form.reset();
        clearFormErrors();

        // Hide form after success
        setTimeout(() => {
            document.getElementById('contactFormContainer').style.display = 'none';
        }, 3000);
    })
    .catch(() => {
        // Error fallback - provide phone number
        showErrorMessage();
    })
    .finally(() => {
        // Reset button
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    });
}

function showSuccessMessage() {
    const form = document.querySelector('.contact-form');
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.innerHTML = `
        <p style="color: var(--primary-green-dark); font-weight: 600; text-align: center; padding: var(--spacing-lg); background: rgba(45, 139, 79, 0.1); border-radius: 10px; margin-bottom: var(--spacing-lg);">
            ✅ Thank you! Your message has been sent. We'll get back to you soon.
        </p>
    `;
    form.insertBefore(successDiv, form.firstChild);
}

function showErrorMessage() {
    const form = document.querySelector('.contact-form');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message-general';
    errorDiv.innerHTML = `
        <p style="color: var(--accent-red); font-weight: 600; text-align: center; padding: var(--spacing-lg); background: rgba(220, 53, 69, 0.1); border-radius: 10px; margin-bottom: var(--spacing-lg);">
            There was an issue sending your message. Please call us directly at <a href="tel:7809041463" style="color: var(--primary-green-dark);">780-904-1463</a>
        </p>
    `;
    form.insertBefore(errorDiv, form.firstChild);
}