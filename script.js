// script.js
document.getElementById('exportButton').addEventListener('click', exportToExcel);
// script.js
let currentBooking = null;
let isDrawing = false;
let bookings = {};

// Jours de la semaine
const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

// Créneaux horaires
const timeSlots = ['8h00-9h00', '9h00-10h00', '10h00-11h00', '11h00-12h00'];

function initCalendar() {
    const calendar = document.getElementById('calendar');
    
    // Headers des jours
    dayNames.forEach(day => {
        const header = document.createElement('div');
        header.className = 'day-header';
        header.textContent = day;
        calendar.appendChild(header);
    });
    
    // Générer les jours du 16 juin au 15 juillet 2025
    const startDate = new Date(2025, 5, 16); // Juin = 5 (0-indexé)
    const endDate = new Date(2025, 6, 15);   // Juillet = 6
    
    // Remplir les jours avant le 16 juin pour aligner le calendrier
    const firstDayOfWeek = startDate.getDay();
    const daysToAdd = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Lundi = 0
    
    for (let i = daysToAdd; i > 0; i--) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'day-cell';
        calendar.appendChild(emptyDay);
    }
    
    // Générer les jours de travail
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        const dayCell = createDayCell(new Date(currentDate));
        calendar.appendChild(dayCell);
        currentDate.setDate(currentDate.getDate() + 1);
    }
}

function createDayCell(date) {
    const dayCell = document.createElement('div');
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    dayCell.className = `day-cell ${isWeekend ? 'weekend' : 'available'}`;
    
    const dayNumber = document.createElement('div');
    dayNumber.className = 'day-number';
    dayNumber.textContent = date.getDate();
    dayCell.appendChild(dayNumber);
    
    if (!isWeekend) {
        const timeSlotsContainer = document.createElement('div');
        timeSlotsContainer.className = 'time-slots';
        
        timeSlots.forEach(slot => {
            const timeSlot = document.createElement('div');
            timeSlot.className = 'time-slot available';
            timeSlot.textContent = slot;
            timeSlot.onclick = () => openBookingForm(date, slot);
            
            const slotKey = `${date.toISOString().split('T')[0]}_${slot}`;
            if (bookings[slotKey]) {
                timeSlot.className = 'time-slot reserved';
                timeSlot.onclick = null;
                
                const info = document.createElement('div');
                info.className = 'reserved-info';
                info.textContent = `Apt ${bookings[slotKey].apartmentNumber}`;
                timeSlot.appendChild(info);
            }
            
            timeSlotsContainer.appendChild(timeSlot);
        });
        
        dayCell.appendChild(timeSlotsContainer);
    } else {
        const weekendText = document.createElement('div');
        weekendText.textContent = 'Weekend';
        weekendText.style.textAlign = 'center';
        weekendText.style.color = '#999';
        weekendText.style.marginTop = '20px';
        dayCell.appendChild(weekendText);
    }
    
    return dayCell;
}

function openBookingForm(date, slot) {
    currentBooking = { date, slot };
    
    const selectedSlot = document.getElementById('selectedSlot');
    selectedSlot.innerHTML = `<strong>Créneau sélectionné :</strong> ${formatDate(date)} - ${slot}`;
    
    document.getElementById('overlay').style.display = 'block';
    document.getElementById('bookingForm').style.display = 'block';
    
    // Initialiser le canvas de signature
    initSignaturePad();
}

function closeForm() {
    document.getElementById('overlay').style.display = 'none';
    document.getElementById('bookingForm').style.display = 'none';
    currentBooking = null;
    clearForm();
}

function clearForm() {
    document.getElementById('apartmentNumber').value = '';
    document.getElementById('lastName').value = '';
    document.getElementById('firstName').value = '';
    document.getElementById('phone').value = '';
    document.getElementById('email').value = '';
    clearSignature();
}

function initSignaturePad() {
    const canvas = document.getElementById('signature');
    const ctx = canvas.getContext('2d');
    
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('touchstart', startDrawing);
    canvas.addEventListener('touchmove', draw);
    canvas.addEventListener('touchend', stopDrawing);
    
    function startDrawing(e) {
        isDrawing = true;
        draw(e);
    }
    
    function draw(e) {
        if (!isDrawing) return;
        
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX || e.touches[0].clientX) - rect.left;
        const y = (e.clientY || e.touches[0].clientY) - rect.top;
        
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#000';
        
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
    }
    
    function stopDrawing() {
        if (isDrawing) {
            isDrawing = false;
            ctx.beginPath();
        }
    }
}

function clearSignature() {
    const canvas = document.getElementById('signature');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function confirmBooking() {
    // Vérifier les champs obligatoires
    const apartmentNumber = document.getElementById('apartmentNumber').value;
    const lastName = document.getElementById('lastName').value;
    const firstName = document.getElementById('firstName').value;
    const phone = document.getElementById('phone').value;
    
    if (!apartmentNumber || !lastName || !firstName || !phone) {
        alert('Veuillez remplir tous les champs obligatoires.');
        return;
    }
    
    // Vérifier la signature
    const canvas = document.getElementById('signature');
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const hasSignature = imageData.data.some(pixel => pixel !== 0);
    
    if (!hasSignature) {
        alert('Veuillez signer avant de confirmer.');
        return;
    }
    
    // Enregistrer la réservation
    const slotKey = `${currentBooking.date.toISOString().split('T')[0]}_${currentBooking.slot}`;
    bookings[slotKey] = {
        apartmentNumber,
        lastName,
        firstName,
        phone,
        email: document.getElementById('email').value,
        signature: canvas.toDataURL(), // Convertir la signature en base64
        date: currentBooking.date.toISOString(),
        slot: currentBooking.slot,
        timestamp: new Date().toISOString()
    };
    
    // Mettre à jour l'affichage
    updateCalendarDisplay();
    
    alert('Réservation confirmée ! Votre créneau est maintenant réservé de manière définitive.');
    closeForm();
}

function updateCalendarDisplay() {
    // Recréer le calendrier pour refléter les changements
    const calendar = document.getElementById('calendar');
    calendar.innerHTML = '';
    initCalendar();
}

function formatDate(date) {
    const day = date.getDate();
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
}

function exportToExcel() {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Date,Créneau,Appartement,Nom,Prénom,Téléphone,Email,Horodatage\n";
    
    Object.values(bookings).forEach(booking => {
        const date = new Date(booking.date);
        const formattedDate = formatDate(date);
        csvContent += `"${formattedDate}","${booking.slot}","${booking.apartmentNumber}","${booking.lastName}","${booking.firstName}","${booking.phone}","${booking.email}","${new Date(booking.timestamp).toLocaleString()}"\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "planning_plomberie_" + new Date().toISOString().split('T')[0] + ".csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Initialiser le calendrier au chargement
document.addEventListener('DOMContentLoaded', initCalendar);
