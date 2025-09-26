/**
 * Booking Calendar
 * Handles calendar UI and time slot selection
 */

class BookingCalendar {
    constructor() {
        this.api = null; // Will be set after BookingAPI is initialized
        this.currentMonth = new Date();
        this.selectedDate = null;
        this.selectedSlot = null;
        this.availableSlots = [];
        this.suggestedSlots = [];

        this.monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];

        this.init();
    }

    init() {
        // Set up month navigation
        document.getElementById('prevMonth')?.addEventListener('click', () => this.previousMonth());
        document.getElementById('nextMonth')?.addEventListener('click', () => this.nextMonth());

        // Initial calendar render
        this.renderCalendar();

        // Set default selected date to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        this.selectDate(tomorrow);
    }

    renderCalendar() {
        const calendarGrid = document.getElementById('calendarGrid');
        if (!calendarGrid) return;

        // Clear existing calendar
        calendarGrid.innerHTML = '';

        // Update month display
        const monthDisplay = document.getElementById('currentMonth');
        if (monthDisplay) {
            monthDisplay.textContent = `${this.monthNames[this.currentMonth.getMonth()]} ${this.currentMonth.getFullYear()}`;
        }

        // Add day headers
        const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayHeaders.forEach(day => {
            const header = document.createElement('div');
            header.className = 'calendar-header';
            header.textContent = day;
            calendarGrid.appendChild(header);
        });

        // Get first day of month and number of days
        const firstDay = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth(), 1);
        const lastDay = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Add empty cells for days before month starts
        for (let i = 0; i < firstDay.getDay(); i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'calendar-day disabled';
            calendarGrid.appendChild(emptyCell);
        }

        // Add days of the month
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.textContent = day;

            const currentDate = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth(), day);
            currentDate.setHours(0, 0, 0, 0);

            // Check if day is in the past
            if (currentDate < today) {
                dayElement.classList.add('disabled');
            } else {
                dayElement.addEventListener('click', () => this.selectDate(currentDate));

                // Check if this is today
                if (currentDate.getTime() === today.getTime()) {
                    dayElement.classList.add('today');
                }

                // Check if this is the selected date
                if (this.selectedDate && currentDate.getTime() === this.selectedDate.getTime()) {
                    dayElement.classList.add('selected');
                }
            }

            calendarGrid.appendChild(dayElement);
        }
    }

    previousMonth() {
        this.currentMonth.setMonth(this.currentMonth.getMonth() - 1);
        this.renderCalendar();
    }

    nextMonth() {
        this.currentMonth.setMonth(this.currentMonth.getMonth() + 1);
        this.renderCalendar();
    }

    async selectDate(date) {
        this.selectedDate = new Date(date);
        this.selectedDate.setHours(0, 0, 0, 0);

        // Update calendar display
        this.renderCalendar();

        // Load available slots for selected date
        await this.loadAvailableSlots();

        // Notify booking flow
        if (window.bookingFlow) {
            window.bookingFlow.onDateSelected(this.selectedDate);
        }
    }

    async loadAvailableSlots() {
        if (!this.selectedDate) return;

        // Initialize API if not already done
        if (!this.api) {
            this.api = window.bookingAPI || new BookingAPI();
        }

        // Show loading state
        this.showLoadingSlots();

        try {
            // Get meeting duration from selected type
            const duration = window.bookingFlow?.selectedMeetingDuration || 30;

            // Fetch available slots
            const slotsData = await this.api.getAvailableSlots(this.selectedDate, duration);
            const smartData = await this.api.getSmartSuggestions(this.selectedDate, duration);

            this.availableSlots = slotsData.slots || [];
            this.suggestedSlots = smartData.suggestions || [];

            // Render time slots
            this.renderTimeSlots();

        } catch (error) {
            console.error('Error loading slots:', error);
            this.showSlotsError();
        }
    }

    renderTimeSlots() {
        // Render suggested slots
        const suggestedContainer = document.getElementById('suggestedSlots');
        if (suggestedContainer) {
            suggestedContainer.innerHTML = '';

            if (this.suggestedSlots.length === 0) {
                suggestedContainer.innerHTML = '<p style="color: #666; font-size: 14px;">No recommendations available for this date.</p>';
            } else {
                this.suggestedSlots.forEach((slot, index) => {
                    const slotElement = this.createSlotElement(slot, true, slot.reason);
                    suggestedContainer.appendChild(slotElement);
                });
            }
        }

        // Render all available slots
        const allSlotsContainer = document.getElementById('allSlots');
        if (allSlotsContainer) {
            allSlotsContainer.innerHTML = '';

            if (this.availableSlots.length === 0) {
                allSlotsContainer.innerHTML = '<p style="color: #666; font-size: 14px;">No available slots for this date. Please select another date.</p>';
            } else {
                // Group slots by time period
                const morningSlots = [];
                const afternoonSlots = [];

                this.availableSlots.forEach(slot => {
                    const hour = new Date(slot.startTime).getHours();
                    if (hour < 12) {
                        morningSlots.push(slot);
                    } else {
                        afternoonSlots.push(slot);
                    }
                });

                // Render morning slots
                if (morningSlots.length > 0) {
                    const morningTitle = document.createElement('h5');
                    morningTitle.textContent = 'Morning';
                    morningTitle.style.cssText = 'color: #666; margin: 15px 0 10px; font-size: 14px;';
                    allSlotsContainer.appendChild(morningTitle);

                    const morningGrid = document.createElement('div');
                    morningGrid.className = 'slots-grid';
                    morningSlots.forEach(slot => {
                        const slotElement = this.createSlotElement(slot, false);
                        morningGrid.appendChild(slotElement);
                    });
                    allSlotsContainer.appendChild(morningGrid);
                }

                // Render afternoon slots
                if (afternoonSlots.length > 0) {
                    const afternoonTitle = document.createElement('h5');
                    afternoonTitle.textContent = 'Afternoon';
                    afternoonTitle.style.cssText = 'color: #666; margin: 15px 0 10px; font-size: 14px;';
                    allSlotsContainer.appendChild(afternoonTitle);

                    const afternoonGrid = document.createElement('div');
                    afternoonGrid.className = 'slots-grid';
                    afternoonSlots.forEach(slot => {
                        const slotElement = this.createSlotElement(slot, false);
                        afternoonGrid.appendChild(slotElement);
                    });
                    allSlotsContainer.appendChild(afternoonGrid);
                }
            }
        }
    }

    createSlotElement(slot, isRecommended = false, reason = null) {
        const slotDiv = document.createElement('div');
        slotDiv.className = 'time-slot';
        if (isRecommended) {
            slotDiv.classList.add('recommended');
        }

        const startTime = new Date(slot.startTime);
        const timeString = startTime.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });

        const timeSpan = document.createElement('span');
        timeSpan.className = 'slot-time';
        timeSpan.textContent = timeString;
        slotDiv.appendChild(timeSpan);

        if (reason) {
            const reasonSpan = document.createElement('span');
            reasonSpan.className = 'slot-label';
            reasonSpan.textContent = reason;
            slotDiv.appendChild(reasonSpan);
        }

        // Check if this slot is selected
        if (this.selectedSlot && slot.startTime === this.selectedSlot.startTime) {
            slotDiv.classList.add('selected');
        }

        slotDiv.addEventListener('click', () => this.selectTimeSlot(slot));

        return slotDiv;
    }

    selectTimeSlot(slot) {
        this.selectedSlot = slot;

        // Update UI
        document.querySelectorAll('.time-slot').forEach(el => {
            el.classList.remove('selected');
        });

        // Find and select the clicked slot
        document.querySelectorAll('.time-slot').forEach(el => {
            if (el.querySelector('.slot-time').textContent ===
                new Date(slot.startTime).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                })) {
                el.classList.add('selected');
            }
        });

        // Enable continue button
        const continueBtn = document.getElementById('continueToDetails');
        if (continueBtn) {
            continueBtn.disabled = false;
        }

        // Notify booking flow
        if (window.bookingFlow) {
            window.bookingFlow.onTimeSelected(slot);
        }

        // Update assistant context
        if (window.bookingAssistant) {
            window.bookingAssistant.updateContext({
                selectedTime: slot,
                step: 'time_selected'
            });
        }
    }

    filterTimeSlots(timeRange) {
        const allSlotsContainer = document.getElementById('allSlots');
        if (!allSlotsContainer) return;

        const slots = allSlotsContainer.querySelectorAll('.time-slot');
        slots.forEach(slot => {
            const timeText = slot.querySelector('.slot-time').textContent;
            const hour = parseInt(timeText.split(':')[0]);
            const isPM = timeText.includes('PM');
            const hour24 = isPM && hour !== 12 ? hour + 12 : (!isPM && hour === 12 ? 0 : hour);

            if (timeRange === 'morning' && hour24 >= 12) {
                slot.style.display = 'none';
            } else if (timeRange === 'afternoon' && hour24 < 12) {
                slot.style.display = 'none';
            } else {
                slot.style.display = 'block';
            }
        });
    }

    showWeekView() {
        // This could be expanded to show a week view
        // For now, just highlight the next 7 days in the calendar
        const today = new Date();
        const weekDates = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            weekDates.push(date);
        }

        // Highlight week dates
        document.querySelectorAll('.calendar-day').forEach(dayEl => {
            const day = parseInt(dayEl.textContent);
            if (!isNaN(day)) {
                const dayDate = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth(), day);
                if (weekDates.some(d => d.toDateString() === dayDate.toDateString())) {
                    dayEl.style.backgroundColor = '#e8f5e9';
                }
            }
        });
    }

    showLoadingSlots() {
        const suggestedContainer = document.getElementById('suggestedSlots');
        const allSlotsContainer = document.getElementById('allSlots');

        const loadingHTML = '<div class="loading">Loading available times...</div>';

        if (suggestedContainer) suggestedContainer.innerHTML = loadingHTML;
        if (allSlotsContainer) allSlotsContainer.innerHTML = loadingHTML;
    }

    showSlotsError() {
        const suggestedContainer = document.getElementById('suggestedSlots');
        const allSlotsContainer = document.getElementById('allSlots');

        const errorHTML = '<p style="color: #c00; font-size: 14px;">Error loading available times. Please try again.</p>';

        if (suggestedContainer) suggestedContainer.innerHTML = errorHTML;
        if (allSlotsContainer) allSlotsContainer.innerHTML = errorHTML;
    }

    reset() {
        this.selectedDate = null;
        this.selectedSlot = null;
        this.availableSlots = [];
        this.suggestedSlots = [];
        this.currentMonth = new Date();
        this.renderCalendar();

        // Clear slots display
        const suggestedContainer = document.getElementById('suggestedSlots');
        const allSlotsContainer = document.getElementById('allSlots');
        if (suggestedContainer) suggestedContainer.innerHTML = '';
        if (allSlotsContainer) allSlotsContainer.innerHTML = '';
    }
}

// Export for use in other modules
window.BookingCalendar = BookingCalendar;