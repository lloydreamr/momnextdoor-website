/**
 * Booking Assistant
 * Handles the conversational AI assistant interface
 */

class BookingAssistant {
    constructor() {
        this.api = null; // Will be set after BookingAPI is initialized
        this.messagesContainer = document.getElementById('assistantMessages');
        this.inputField = document.getElementById('assistantInput');
        this.sendButton = document.getElementById('assistantSend');
        this.quickActions = document.getElementById('quickActions');

        this.conversationContext = {
            step: 'initial',
            meetingType: null,
            selectedDate: null,
            selectedTime: null,
            userPreferences: {}
        };

        this.init();
    }

    init() {
        // Set up event listeners
        this.sendButton?.addEventListener('click', () => this.handleSend());
        this.inputField?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleSend();
            }
        });

        // Set up quick action buttons
        this.quickActions?.querySelectorAll('.quick-action').forEach(button => {
            button.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                this.handleQuickAction(action);
            });
        });

        // Add initial suggestions based on context
        this.updateQuickActions();
    }

    handleSend() {
        const input = this.inputField.value.trim();
        if (!input) return;

        // Add user message to chat
        this.addMessage(input, 'user');

        // Clear input
        this.inputField.value = '';

        // Process input
        this.processInput(input);
    }

    async processInput(input) {
        // Initialize API if not already done
        if (!this.api) {
            this.api = window.bookingAPI || new BookingAPI();
        }

        // Show typing indicator
        this.showTyping();

        try {
            // Process through API
            const response = await this.api.processAssistantInput(input, this.conversationContext);

            // Remove typing indicator
            this.hideTyping();

            // Handle response based on type
            this.handleAssistantResponse(response);

        } catch (error) {
            this.hideTyping();
            this.addMessage("I'm having trouble understanding that. Could you try again?", 'bot');
        }
    }

    handleAssistantResponse(response) {
        // Add bot message
        this.addMessage(response.message, 'bot');

        // Execute action if specified
        if (response.action) {
            this.executeAction(response.action, response.data);
        }

        // Update context
        if (response.type === 'date_suggestion') {
            this.conversationContext.selectedDate = response.data.date;
        } else if (response.type === 'time_preference') {
            this.conversationContext.userPreferences.timeRange = response.data.timeRange;
        }

        // Update quick actions based on new context
        this.updateQuickActions();
    }

    executeAction(action, data) {
        switch (action) {
            case 'select_date':
                // Update calendar to show selected date
                if (window.bookingCalendar) {
                    window.bookingCalendar.selectDate(data.date);
                }
                // Move to time selection step if on date selection
                if (window.bookingFlow && window.bookingFlow.currentStep === 2) {
                    window.bookingFlow.loadAvailableSlots(data.date);
                }
                break;

            case 'filter_times':
                // Filter time slots based on preference
                if (window.bookingCalendar) {
                    window.bookingCalendar.filterTimeSlots(data.timeRange);
                }
                break;

            case 'find_earliest':
                // Find and highlight earliest available slot
                this.findEarliestSlot();
                break;

            case 'show_week_view':
                // Show week view in calendar
                if (window.bookingCalendar) {
                    window.bookingCalendar.showWeekView();
                }
                break;

            case 'request_confirmation_number':
                // Show input for confirmation number
                this.requestConfirmationNumber();
                break;

            default:
                console.log('Unknown action:', action);
        }
    }

    handleQuickAction(action) {
        let message = '';

        switch (action) {
            case 'tomorrow':
                message = "Show me available times for tomorrow";
                break;
            case 'next-week':
                message = "What's available next week?";
                break;
            case 'urgent':
                message = "I need an urgent appointment";
                break;
            case 'morning':
                message = "I prefer morning appointments";
                break;
            case 'afternoon':
                message = "I prefer afternoon appointments";
                break;
            case 'reschedule':
                message = "I need to reschedule my appointment";
                break;
            default:
                return;
        }

        // Simulate user input
        this.inputField.value = message;
        this.handleSend();
    }

    updateQuickActions() {
        // Update quick action buttons based on conversation context
        const actions = this.quickActions?.querySelectorAll('.quick-action');
        if (!actions) return;

        // Hide all first
        actions.forEach(btn => btn.style.display = 'none');

        // Show relevant actions based on context
        if (this.conversationContext.step === 'initial') {
            this.showQuickActions(['tomorrow', 'next-week', 'urgent']);
        } else if (this.conversationContext.selectedDate && !this.conversationContext.selectedTime) {
            this.showQuickActions(['morning', 'afternoon', 'urgent']);
        } else if (this.conversationContext.selectedTime) {
            this.showQuickActions(['reschedule', 'cancel']);
        }
    }

    showQuickActions(actionNames) {
        actionNames.forEach(name => {
            const btn = this.quickActions?.querySelector(`[data-action="${name}"]`);
            if (btn) btn.style.display = 'inline-block';
        });
    }

    addMessage(text, type = 'bot') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = text;

        // Parse markdown-like formatting
        contentDiv.innerHTML = this.parseMessageFormat(contentDiv.textContent);

        messageDiv.appendChild(contentDiv);
        this.messagesContainer.appendChild(messageDiv);

        // Scroll to bottom
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    parseMessageFormat(text) {
        // Simple markdown-like parsing
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>')
            .replace(/• /g, '<br>• ');
    }

    showTyping() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot typing';
        typingDiv.id = 'typingIndicator';

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.innerHTML = '<span class="typing-dots"><span></span><span></span><span></span></span>';

        typingDiv.appendChild(contentDiv);
        this.messagesContainer.appendChild(typingDiv);
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    hideTyping() {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    async findEarliestSlot() {
        // Initialize API if not already done
        if (!this.api) {
            this.api = window.bookingAPI || new BookingAPI();
        }

        const today = new Date();
        let foundSlot = null;

        // Check next 7 days for earliest slot
        for (let i = 0; i < 7; i++) {
            const checkDate = new Date(today);
            checkDate.setDate(today.getDate() + i);

            const slots = await this.api.getAvailableSlots(checkDate);
            if (slots.slots && slots.slots.length > 0) {
                foundSlot = {
                    date: checkDate,
                    slot: slots.slots[0]
                };
                break;
            }
        }

        if (foundSlot) {
            this.addMessage(`The earliest available slot is ${this.api.formatDateTime(foundSlot.slot.startTime, 'full')}. Would you like to book it?`, 'bot');

            // Auto-select this slot in the UI
            if (window.bookingCalendar) {
                window.bookingCalendar.selectDate(foundSlot.date);
                window.bookingCalendar.selectTimeSlot(foundSlot.slot);
            }
        } else {
            this.addMessage("I couldn't find any available slots in the next week. Would you like to check further ahead?", 'bot');
        }
    }

    requestConfirmationNumber() {
        this.addMessage("Please enter your confirmation number (e.g., CONF-ABC123):", 'bot');
        this.conversationContext.awaitingConfirmation = true;
    }

    // Helper method to provide context-aware suggestions
    provideSuggestions() {
        const step = window.bookingFlow?.currentStep || 1;

        const suggestions = {
            1: "Select the type of meeting that best fits your needs. Each has a different duration and focus.",
            2: "Choose a date and time that works for you. I've highlighted some recommended slots based on availability.",
            3: "Please fill in your contact information so Domina can prepare for your meeting.",
            4: "Review all the details and confirm your appointment."
        };

        if (suggestions[step]) {
            this.addMessage(suggestions[step], 'bot');
        }
    }

    // Update conversation context when user progresses through form
    updateContext(updates) {
        this.conversationContext = {
            ...this.conversationContext,
            ...updates
        };

        // Provide relevant suggestions
        this.provideSuggestions();
    }

    // Reset assistant for new booking
    reset() {
        this.conversationContext = {
            step: 'initial',
            meetingType: null,
            selectedDate: null,
            selectedTime: null,
            userPreferences: {}
        };

        // Clear messages except initial greeting
        const messages = this.messagesContainer.querySelectorAll('.message');
        for (let i = 1; i < messages.length; i++) {
            messages[i].remove();
        }

        // Reset quick actions
        this.updateQuickActions();
    }
}

// Add typing animation styles
const style = document.createElement('style');
style.textContent = `
    .typing-dots {
        display: inline-flex;
        align-items: center;
    }

    .typing-dots span {
        height: 8px;
        width: 8px;
        background-color: #999;
        border-radius: 50%;
        display: inline-block;
        margin: 0 2px;
        animation: typing 1.4s infinite;
    }

    .typing-dots span:nth-child(2) {
        animation-delay: 0.2s;
    }

    .typing-dots span:nth-child(3) {
        animation-delay: 0.4s;
    }

    @keyframes typing {
        0%, 80%, 100% {
            opacity: 0.5;
            transform: scale(1);
        }
        40% {
            opacity: 1;
            transform: scale(1.2);
        }
    }
`;
document.head.appendChild(style);

// Export for use in other modules
window.BookingAssistant = BookingAssistant;