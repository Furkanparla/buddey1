document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('bookingForm');
    const nextBtn = document.getElementById('nextBtn');
    const prevBtn = document.getElementById('prevBtn');
    const steps = document.querySelectorAll('.step-content');
    const progressSteps = document.querySelectorAll('.progress-step');
    const progress = document.getElementById('progress');
    
    let currentStep = 1;
    const totalSteps = steps.length;
    
    // Booking data object
    let bookingData = {
        zipcode: '',
        selectedSlots: [],
        projectType: '',
        jobDescription: '',
        duration: '',
        firstName: '',
        lastName: '',
        email: '',
        address: '',
        city: '',
        photos: [],
        privacyAccepted: false
    };

    // Postcode validatie
    const zipcodeInput = document.getElementById('zipcode');
    const zipcodeError = document.getElementById('zipcode-error');
    const dutchZipcodeRegex = /^[1-9][0-9]{3}\s?[A-Z]{2}$/i;

    zipcodeInput.addEventListener('input', function(e) {
        const value = e.target.value.toUpperCase();
        
        // Format postcode (voeg spatie toe na 4 cijfers)
        if (value.length === 4 && !value.includes(' ')) {
            e.target.value = value + ' ';
        }
        
        validateZipcode(value);
        updateButtonStates();
    });

    function validateZipcode(zipcode) {
        if (!dutchZipcodeRegex.test(zipcode)) {
            zipcodeError.textContent = 'Voer een geldige postcode in (bijv. 1234 AB)';
            nextBtn.disabled = true;
            return false;
        }

        // Simuleer API check voor servicebeschikbaarheid
        checkServiceAvailability(zipcode);
        return true;
    }

    function checkServiceAvailability(zipcode) {
        // Simuleer API call (vervang dit door echte API-integratie)
        setTimeout(() => {
            const isAvailable = true; // Vervang door echte beschikbaarheidscheck
            
            if (isAvailable) {
                zipcodeError.textContent = '';
                nextBtn.disabled = false;
                bookingData.zipcode = zipcode;
            } else {
                zipcodeError.textContent = 'Sorry, we leveren momenteel geen service in dit gebied.';
                nextBtn.disabled = true;
            }
        }, 500);
    }

    // Progress indicator click handlers
    document.querySelectorAll('.progress-step').forEach(step => {
        step.addEventListener('click', () => {
            const clickedStep = parseInt(step.dataset.step);
            if (step.classList.contains('completed') && clickedStep < currentStep) {
                currentStep = clickedStep;
                updateStep();
            }
        });
    });

    // Calendar en Tijdslots Management
    let currentDate = new Date();
    let selectedDate = null;
    const monthNames = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 
                       'juli', 'augustus', 'september', 'oktober', 'november', 'december'];

    // Tijdslot types definitie
    const timeSlotTypes = [
        { id: 'morning', label: 'Ochtend', time: '08:00 - 12:00' },
        { id: 'afternoon', label: 'Middag', time: '12:00 - 18:00' },
        { id: 'evening', label: 'Avond', time: '18:00 - 21:00' }
    ];

    // Map om geselecteerde slots bij te houden
    const selectedSlotsMap = new Map();

    function initializeCalendar() {
        updateCalendarHeader();
        generateCalendarDays();
        setupCalendarNavigation();
        setupTimeSlotHandlers();
        updateTimeSlotAvailability();
    }

    function updateCalendarHeader() {
        document.getElementById('selected-month').textContent = monthNames[currentDate.getMonth()];
        document.getElementById('selected-year').textContent = currentDate.getFullYear();
    }

    function generateCalendarDays() {
        const calendarGrid = document.querySelector('.calendar-grid');
        const weekdayHeaders = Array.from(document.querySelectorAll('.weekday-header'));
        
        // Verwijder bestaande dagen
        const existingDays = calendarGrid.querySelectorAll('.calendar-day');
        existingDays.forEach(day => day.remove());

        // Bereken eerste dag van de maand
        const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        
        // Voeg lege dagen toe voor het begin van de maand
        let firstDayIndex = firstDay.getDay() || 7; // Converteer zondag (0) naar 7
        for (let i = 1; i < firstDayIndex; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day empty';
            calendarGrid.appendChild(emptyDay);
        }

        // Voeg dagen van de maand toe
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.textContent = day;
            
            // Check voor zondag (disabled)
            if (date.getDay() === 0) {
                dayElement.classList.add('disabled');
            } else {
                dayElement.addEventListener('click', () => handleDateSelection(date, dayElement));
            
                // Check voor geselecteerde slots op deze datum
                if (hasSelectedSlotsForDate(date)) {
                    dayElement.classList.add('has-selected-slot');
                }
            }

            // Check voor geselecteerde datum
            if (selectedDate && isSameDay(date, selectedDate)) {
                dayElement.classList.add('selected');
            }

            calendarGrid.appendChild(dayElement);
        }
    }

    function handleDateSelection(date, element) {
        // Toggle selectie van huidige datum
        if (element.classList.contains('selected')) {
            element.classList.remove('selected');
            selectedDate = null;
        } else {
            document.querySelectorAll('.calendar-day.selected').forEach(el => {
                el.classList.remove('selected');
            });
            element.classList.add('selected');
            selectedDate = date;
        }
        
        // Update tijdslots voor geselecteerde datum
        updateTimeSlotAvailability();
    }

    function setupCalendarNavigation() {
        document.getElementById('prev-month').addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            updateCalendarHeader();
            generateCalendarDays();
        });

        document.getElementById('next-month').addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            updateCalendarHeader();
            generateCalendarDays();
        });
    }

    function updateTimeSlotAvailability() {
        const checkboxes = document.querySelectorAll('.time-slot-checkbox input[type="checkbox"]');
        const timeSlotOptions = document.querySelectorAll('.time-slot-option');
        
        if (!selectedDate) {
            checkboxes.forEach((checkbox, index) => {
                checkbox.disabled = true;
                checkbox.checked = false;
                timeSlotOptions[index].classList.remove('selected');
            });
            return;
        }

        const dateStr = selectedDate.toISOString().split('T')[0];
        
        checkboxes.forEach((checkbox, index) => {
            const timeSlotId = checkbox.value;
            const slotKey = `${dateStr}-${timeSlotId}`;
            const isSelected = selectedSlotsMap.has(slotKey);
            
            checkbox.disabled = false;
            checkbox.checked = isSelected;
            timeSlotOptions[index].classList.toggle('selected', isSelected);
        });
    }

    function setupTimeSlotHandlers() {
        document.querySelectorAll('.time-slot-checkbox input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', handleTimeSlotSelection);
        });
    }

    function handleTimeSlotSelection(event) {
        if (!selectedDate) {
            event.preventDefault();
            alert('Selecteer eerst een datum');
            return;
        }

        const checkbox = event.target;
        const timeSlotId = checkbox.value;
        const dateStr = selectedDate.toISOString().split('T')[0];
        const slotKey = `${dateStr}-${timeSlotId}`;
        const timeSlotOption = checkbox.closest('.time-slot-option');

        if (checkbox.checked) {
            if (selectedSlotsMap.size >= 3) {
                checkbox.checked = false;
                alert('U kunt maximaal 3 tijdslots selecteren');
                return;
            }

            const timeSlotType = timeSlotTypes.find(type => type.id === timeSlotId);
            addSelectedSlot(slotKey, {
                date: selectedDate,
                timeSlot: timeSlotType,
                key: slotKey
            });
            timeSlotOption.classList.add('selected');
            updateCalendarHighlight(selectedDate, true);
        } else {
            removeSelectedSlot(slotKey);
            timeSlotOption.classList.remove('selected');
            updateCalendarHighlight(selectedDate, hasSelectedSlotsForDate(selectedDate));
        }

        updateSelectedSlotsList();
        updateButtonStates();
    }

    function updateCalendarHighlight(date, isSelected) {
        const calendarDays = document.querySelectorAll('.calendar-day');
        calendarDays.forEach(day => {
            if (!day.classList.contains('empty') && !day.classList.contains('disabled')) {
                const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), parseInt(day.textContent));
                if (isSameDay(dayDate, date)) {
                    if (isSelected) {
                        day.classList.add('has-selected-slot');
                    } else {
                        day.classList.remove('has-selected-slot');
                        // Als dit de geselecteerde datum was, verwijder ook de 'selected' class
                        if (selectedDate && isSameDay(date, selectedDate)) {
                            day.classList.remove('selected');
                            selectedDate = null;
                        }
                    }
                }
            }
        });
    }

    function hasSelectedSlotsForDate(date) {
        const dateStr = date.toISOString().split('T')[0];
        return Array.from(selectedSlotsMap.keys()).some(key => key.startsWith(dateStr));
    }

    function addSelectedSlot(key, data) {
        selectedSlotsMap.set(key, data);
        updateBookingData();
    }

    function removeSelectedSlot(key) {
        const slotData = selectedSlotsMap.get(key);
        if (slotData) {
            // Verwijder uit de map
            selectedSlotsMap.delete(key);
            
            // Update kalender highlight
            const date = slotData.date;
            updateCalendarHighlight(date, hasSelectedSlotsForDate(date));
            
            // Update checkbox status
            const checkbox = document.querySelector(`.time-slot-checkbox input[value="${slotData.timeSlot.id}"]`);
            const timeSlotOption = checkbox?.closest('.time-slot-option');
            
            if (checkbox) {
                checkbox.checked = false;
                timeSlotOption?.classList.remove('selected');
            }
            
            // Update booking data
            updateBookingData();
        }
    }

    function updateSelectedSlotsList() {
        const selectedSlotsList = document.getElementById('selected-slots-list');
        const selectionHint = document.getElementById('selection-hint');
        selectedSlotsList.innerHTML = '';
        
        if (selectedSlotsMap.size === 0) {
            selectionHint.textContent = 'Je hebt nog niet 3 verschillende dagen geselecteerd. Bij meerdere opties wordt de klus beter opgepakt.';
            nextBtn.disabled = true;
            return;
        }

        const sortedSlots = Array.from(selectedSlotsMap.values()).sort((a, b) => a.date - b.date);
        
        sortedSlots.forEach(data => {
            const slotElement = document.createElement('div');
            slotElement.className = 'selected-slot-item';
            
            const dateStr = data.date.toLocaleDateString('nl-NL', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
            
            slotElement.innerHTML = `
                <div class="slot-info">
                    <div class="slot-date">${dateStr}</div>
                    <div class="slot-time">${data.timeSlot.label}: ${data.timeSlot.time}</div>
                </div>
                <button type="button" class="remove-slot" data-key="${data.key}">×</button>
            `;
            
            const removeButton = slotElement.querySelector('.remove-slot');
            removeButton.addEventListener('click', () => {
                removeSelectedSlot(data.key);
                updateSelectedSlotsList();
                updateButtonStates();
            });
            
            selectedSlotsList.appendChild(slotElement);
        });

        selectionHint.textContent = selectedSlotsMap.size < 3 ? 
            'Je hebt nog niet 3 verschillende dagen geselecteerd. Bij meerdere opties wordt de klus beter opgepakt.' : '';
        
        updateButtonStates();
    }

    function updateBookingData() {
        bookingData.selectedSlots = Array.from(selectedSlotsMap.values()).map(data => ({
            date: data.date.toISOString().split('T')[0],
            timeSlot: data.timeSlot
        }));
    }

    function isSameDay(date1, date2) {
        return date1.getDate() === date2.getDate() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getFullYear() === date2.getFullYear();
    }

    // Event Listeners voor navigatie
    nextBtn.addEventListener('click', () => {
        if (validateStep(currentStep)) {
            if (currentStep < totalSteps) {
                currentStep++;
                updateStep();
            } else {
                submitBooking();
            }
        }
    });

    prevBtn.addEventListener('click', () => {
        if (currentStep > 1) {
            currentStep--;
            updateStep();
        }
    });

    // Validatie per stap
    function validateStep(step) {
        let isValid = true;
        const currentStepElement = steps[step - 1];

        switch(step) {
            case 1:
                isValid = validateZipcode(zipcodeInput.value);
                break;
            case 2:
                isValid = selectedSlotsMap.size > 0;
                break;
            case 3:
                const projectType = document.getElementById('projectType').value;
                const jobDescription = document.getElementById('jobDescription').value;
                const duration = document.getElementById('duration').value;
                isValid = projectType && jobDescription && duration;
                break;
            case 4:
                const requiredFields = currentStepElement.querySelectorAll('input[required], select[required]');
                isValid = Array.from(requiredFields).every(field => field.value.trim() !== '');
                
                // Extra validatie voor e-mail
                const email = document.getElementById('email');
                if (email && email.value) {
                    isValid = isValid && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value);
                }
                
                // Privacy policy check
                const privacyCheckbox = document.getElementById('privacyPolicy');
                if (privacyCheckbox) {
                    isValid = isValid && privacyCheckbox.checked;
                }
                break;
            default:
                isValid = false;
        }

        nextBtn.disabled = !isValid;
        return isValid;
    }

    // Email validatie functie
    function validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    // Update de updateStep functie
    function updateStep() {
        // Verberg huidige stap met fade-out
        const currentStepElement = document.querySelector('.step-content.active');
        if (currentStepElement) {
            currentStepElement.style.opacity = '0';
            currentStepElement.style.transform = 'translateY(20px)';
        }

        setTimeout(() => {
            steps.forEach((step, index) => {
                if (index + 1 === currentStep) {
                    step.classList.add('active');
                } else {
                    step.classList.remove('active');
                }
            });

            const progressWidth = ((currentStep - 1) / (totalSteps - 1)) * 100;
            progress.style.width = `${progressWidth}%`;

            progressSteps.forEach((step, index) => {
                step.classList.remove('active', 'completed');
                
                if (index + 1 === currentStep) {
                    step.classList.add('active');
                } else if (index + 1 < currentStep) {
                    step.classList.add('completed');
                    const stepCircle = step.querySelector('.step-circle');
                    stepCircle.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
                } else {
                    const stepCircle = step.querySelector('.step-circle');
                    stepCircle.innerHTML = (index + 1).toString();
                }
            });

            prevBtn.style.display = currentStep === 1 ? 'none' : 'block';
            nextBtn.textContent = currentStep === totalSteps ? 'Buddey aanvragen' : 'Volgende';

            // Toon nieuwe stap met fade-in
            const newStepElement = document.querySelector('.step-content.active');
            if (newStepElement) {
                // Reset transition
                newStepElement.style.transition = 'none';
                newStepElement.style.opacity = '0';
                newStepElement.style.transform = 'translateY(20px)';
                
                // Trigger reflow
                newStepElement.offsetHeight;
                
                // Start animatie
                newStepElement.style.transition = 'all 0.5s ease';
                newStepElement.style.opacity = '1';
                newStepElement.style.transform = 'translateY(0)';
            }

            // Initialize calendar when reaching step 2
            if (currentStep === 2) {
                initializeCalendar();
            }

            // Update button states
            updateButtonStates();
            
            // Scroll naar boven van de nieuwe stap
            window.scrollTo({
                top: document.querySelector('.booking-container').offsetTop,
                behavior: 'smooth'
            });
        }, 300);
    }

    // Update button states based on current step
    function updateButtonStates() {
        const isCurrentStepValid = validateStep(currentStep);
        nextBtn.disabled = !isCurrentStepValid;
        
        if (currentStep === totalSteps) {
            nextBtn.textContent = 'Buddey aanvragen';
        } else {
            nextBtn.textContent = 'Volgende';
        }
    }

    function submitBooking() {
        // Toon bevestigingsbericht
        const overlay = document.createElement('div');
        overlay.className = 'confirmation-overlay';
        
        const message = document.createElement('div');
        message.className = 'confirmation-message';
        message.innerHTML = `
            <h3>Bedankt voor je aanvraag!</h3>
            <p>We hebben je aanvraag ontvangen en nemen zo spoedig mogelijk contact met je op.</p>
            <button class="btn primary">Sluiten</button>
        `;
        
        document.body.appendChild(overlay);
        document.body.appendChild(message);
        
        // Sluit bevestigingsbericht na klik
        const closeBtn = message.querySelector('.btn');
        closeBtn.addEventListener('click', () => {
            overlay.remove();
            message.remove();
            
            // Reset form
            form.reset();
            currentStep = 1;
            selectedSlotsMap.clear();
            updateStep();
            initializeCalendar();
        });
    }

    // Foto upload functionaliteit
    const jobPhotos = document.getElementById('jobPhotos');
    const photoPreview = document.getElementById('photoPreview');
    const uploadContainer = document.querySelector('.upload-container');

    // Drag & Drop handlers
    uploadContainer.addEventListener('dragenter', handleDragEnter);
    uploadContainer.addEventListener('dragover', handleDragOver);
    uploadContainer.addEventListener('dragleave', handleDragLeave);
    uploadContainer.addEventListener('drop', handleDrop);

    function handleDragEnter(e) {
        e.preventDefault();
        uploadContainer.classList.add('drag-over');
    }

    function handleDragOver(e) {
        e.preventDefault();
        uploadContainer.classList.add('drag-over');
    }

    function handleDragLeave(e) {
        e.preventDefault();
        uploadContainer.classList.remove('drag-over');
    }

    function handleDrop(e) {
        e.preventDefault();
        uploadContainer.classList.remove('drag-over');
        
        const files = Array.from(e.dataTransfer.files);
        handleFiles(files);
    }

    jobPhotos.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        handleFiles(files);
    });

    function handleFiles(files) {
        files.forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                
                reader.onload = function(event) {
                    const photoItem = document.createElement('div');
                    photoItem.className = 'photo-item';
                    
                    const img = document.createElement('img');
                    img.src = event.target.result;
                    
                    const removeBtn = document.createElement('button');
                    removeBtn.className = 'remove-photo';
                    removeBtn.innerHTML = '×';
                    removeBtn.onclick = function() {
                        photoItem.remove();
                        bookingData.photos = bookingData.photos.filter(photo => photo !== event.target.result);
                    };
                    
                    photoItem.appendChild(img);
                    photoItem.appendChild(removeBtn);
                    photoPreview.appendChild(photoItem);
                    
                    bookingData.photos.push(event.target.result);
                };
                
                reader.readAsDataURL(file);
            }
        });
    }

    // Geschatte duur opties
    const durationOptions = [
        { value: '30', label: '30 minuten' },
        { value: '60', label: '1 uur' },
        { value: '90', label: '1,5 uur' },
        { value: '120', label: '2 uur' },
        { value: '150', label: '2,5 uur' },
        { value: '180', label: '3 uur' },
        { value: '210', label: '3,5 uur' },
        { value: '240', label: '4 uur' }
    ];

    function initializeDurationSelect() {
        const durationSelect = document.getElementById('duration');
        // Voeg eerst een lege optie toe
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Kies aantal uur...';
        defaultOption.disabled = true;
        defaultOption.selected = true;
        durationSelect.appendChild(defaultOption);
        
        // Voeg alle duur opties toe
        durationOptions.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option.value;
            optionElement.textContent = option.label;
            durationSelect.appendChild(optionElement);
        });
    }

    // Event listeners voor form validatie
    document.querySelectorAll('input, select, textarea').forEach(element => {
        element.addEventListener('input', () => {
            updateButtonStates();
        });
    });

    document.getElementById('privacyPolicy').addEventListener('change', () => {
        updateButtonStates();
    });

    // Initialize duration select on page load
    document.addEventListener('DOMContentLoaded', () => {
        initializeDurationSelect();
    });
}); 