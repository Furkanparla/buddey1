document.addEventListener('DOMContentLoaded', function() {
    let currentDate = new Date();
    let selectedDates = new Map(); // date string -> selected time slots

    function initializeCalendar() {
        updateCalendarHeader();
        renderCalendar();
        attachCalendarEventListeners();
    }

    function updateCalendarHeader() {
        const monthNames = ["Januari", "Februari", "Maart", "April", "Mei", "Juni",
            "Juli", "Augustus", "September", "Oktober", "November", "December"];
        document.getElementById('currentMonth').textContent = 
            `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    }

    function renderCalendar() {
        const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        const startingDay = firstDay.getDay() || 7; // Convert Sunday (0) to 7
        
        const calendarGrid = document.getElementById('calendarGrid');
        const daysInMonth = lastDay.getDate();
        
        // Clear existing calendar days after the weekday headers
        while (calendarGrid.children.length > 7) {
            calendarGrid.removeChild(calendarGrid.lastChild);
        }
        
        // Add empty cells for days before the first of the month
        for (let i = 1; i < startingDay; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day empty';
            calendarGrid.appendChild(emptyDay);
        }
        
        // Add cells for each day of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dayCell = document.createElement('div');
            dayCell.className = 'calendar-day';
            dayCell.textContent = day;
            
            const dateString = formatDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
            if (selectedDates.has(dateString)) {
                dayCell.classList.add('selected');
            }
            
            // Disable past dates
            const cellDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            if (cellDate < new Date().setHours(0,0,0,0)) {
                dayCell.classList.add('disabled');
            } else {
                dayCell.addEventListener('click', () => handleDateSelection(dateString, dayCell));
            }
            
            calendarGrid.appendChild(dayCell);
        }
    }

    function formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    function handleDateSelection(dateString, dayCell) {
        if (selectedDates.has(dateString)) {
            selectedDates.delete(dateString);
            dayCell.classList.remove('selected');
        } else {
            selectedDates.set(dateString, new Set());
            dayCell.classList.add('selected');
        }
        updateSelectedSlots();
    }

    function updateSelectedSlots() {
        const container = document.getElementById('selectedSlots');
        container.innerHTML = '';
        
        selectedDates.forEach((timeSlots, date) => {
            const dateDiv = document.createElement('div');
            dateDiv.className = 'selected-date';
            
            const formattedDate = new Date(date).toLocaleDateString('nl-NL', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            dateDiv.innerHTML = `
                <div class="selected-date-header">
                    <span>${formattedDate}</span>
                    <button class="remove-date" onclick="removeDate('${date}')">×</button>
                </div>
            `;
            container.appendChild(dateDiv);
        });
    }

    // Attach event listeners
    document.getElementById('prevMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        updateCalendarHeader();
        renderCalendar();
    });

    document.getElementById('nextMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        updateCalendarHeader();
        renderCalendar();
    });

    // Initialize calendar
    initializeCalendar();

    // Make removeDate function globally available
    window.removeDate = function(date) {
        selectedDates.delete(date);
        renderCalendar();
        updateSelectedSlots();
    };

    // Time slot selection
    document.querySelectorAll('input[name="time-slot"]').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const timeSlot = this.value;
            selectedDates.forEach((slots, date) => {
                if (this.checked) {
                    slots.add(timeSlot);
                } else {
                    slots.delete(timeSlot);
                }
            });
            updateSelectedSlots();
        });
    });
}); 