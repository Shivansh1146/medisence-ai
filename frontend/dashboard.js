/**
 * MedicSense AI - Enhanced Dashboard Module
 * Comprehensive dashboard functionality
 */

class Dashboard {
    constructor() {
        this.userId = localStorage.getItem('userId') || this.generateUserId();
        this.appointments = [];
        this.healthRecords = [];
        this.init();
    }

    generateUserId() {
        const id = 'user_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('userId', id);
        return id;
    }

    init() {
        this.loadAppointments();
        this.loadHealthRecords();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Book appointment button
        const bookBtn = document.getElementById('bookAppointmentBtn');
        if (bookBtn) {
            bookBtn.addEventListener('click', () => this.showBookingModal());
        }

        // Add vitals button
        const vitalsBtn = document.getElementById('addVitalsBtn');
        if (vitalsBtn) {
            vitalsBtn.addEventListener('click', () => this.showVitalsModal());
        }
    }

    // Appointments Management
    async loadAppointments() {
        try {
            const response = await fetch(`/api/appointments/${this.userId}`);
            const data = await response.json();
            
            if (data.success) {
                this.appointments = data.appointments;
                this.renderAppointments();
            }
        } catch (error) {
            console.error('Error loading appointments:', error);
        }
    }

    renderAppointments() {
        const container = document.getElementById('appointmentsContainer');
        if (!container) return;

        if (this.appointments.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-alt"></i>
                    <p>No upcoming appointments</p>
                    <button onclick="dashboard.showBookingModal()" class="btn-primary">
                        Book Appointment
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = this.appointments.map(apt => `
            <div class="appointment-card">
                <div class="appointment-header">
                    <h3>${apt.doctor_name}</h3>
                    <span class="badge ${apt.status}">${apt.status}</span>
                </div>
                <div class="appointment-details">
                    <p><i class="fas fa-stethoscope"></i> ${apt.specialty}</p>
                    <p><i class="fas fa-calendar"></i> ${apt.date}</p>
                    <p><i class="fas fa-clock"></i> ${apt.time}</p>
                </div>
                ${apt.status === 'scheduled' ? `
                    <div class="appointment-actions">
                        <button onclick="dashboard.rescheduleAppointment('${apt.id}')" class="btn-secondary">
                            Reschedule
                        </button>
                        <button onclick="dashboard.cancelAppointment('${apt.id}')" class="btn-danger">
                            Cancel
                        </button>
                    </div>
                ` : ''}
            </div>
        `).join('');
    }

    async bookAppointment(appointmentData) {
        try {
            const response = await fetch('/api/appointments/book', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: this.userId,
                    ...appointmentData
                })
            });

            const data = await response.json();
            
            if (data.success) {
                this.showNotification('Appointment booked successfully!', 'success');
                this.loadAppointments();
                this.hideBookingModal();
            } else {
                this.showNotification(data.message || 'Failed to book appointment', 'error');
            }
        } catch (error) {
            console.error('Error booking appointment:', error);
            this.showNotification('Failed to book appointment', 'error');
        }
    }

    async cancelAppointment(appointmentId) {
        if (!confirm('Are you sure you want to cancel this appointment?')) return;

        try {
            const response = await fetch(`/api/appointments/${appointmentId}/cancel`, {
                method: 'PUT'
            });

            const data = await response.json();
            
            if (data.success) {
                this.showNotification('Appointment cancelled', 'success');
                this.loadAppointments();
            }
        } catch (error) {
            console.error('Error cancelling appointment:', error);
        }
    }

    // Health Records Management
    async loadHealthRecords() {
        try {
            const response = await fetch(`/api/health/vitals/${this.userId}`);
            const data = await response.json();
            
            if (data.success) {
                this.healthRecords = data.records;
                this.renderHealthChart();
            }
        } catch (error) {
            console.error('Error loading health records:', error);
        }
    }

    async saveVitals(vitalsData) {
        try {
            const response = await fetch('/api/health/vitals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: this.userId,
                    ...vitalsData
                })
            });

            const data = await response.json();
            
            if (data.success) {
                this.showNotification('Vitals saved successfully!', 'success');
                this.loadHealthRecords();
                this.hideVitalsModal();
            }
        } catch (error) {
            console.error('Error saving vitals:', error);
            this.showNotification('Failed to save vitals', 'error');
        }
    }

    renderHealthChart() {
        // Implementation for chart rendering
        const container = document.getElementById('healthChartContainer');
        if (!container || this.healthRecords.length === 0) return;

        // You can integrate Chart.js or other charting library here
        console.log('Rendering health chart with data:', this.healthRecords);
    }

    // Modal Management
    showBookingModal() {
        const modal = document.getElementById('bookingModal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    hideBookingModal() {
        const modal = document.getElementById('bookingModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    showVitalsModal() {
        const modal = document.getElementById('vitalsModal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    hideVitalsModal() {
        const modal = document.getElementById('vitalsModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // Notifications
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Initialize dashboard
let dashboard;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        dashboard = new Dashboard();
    });
} else {
    dashboard = new Dashboard();
}
