const Booking = require('../models/Booking');
const Hospital = require('../models/Hospital');

class BookingController {
  /**
   * Create a new booking (patient must be authenticated).
   * Status is initialized to 'Pending' until payment is received.
   */
  static async create(req, res) {
    try {
      const { hospitalId, service, date, timeSlot } = req.body;
      const patientId = req.user.id;
      const patientName = req.user.name;

      if (!hospitalId || !service || !date || !timeSlot) {
        return res.status(400).json({ error: 'All fields (hospitalId, service, date, timeSlot) are required' });
      }

      const hospital = await Hospital.findById(hospitalId);
      if (!hospital) {
        return res.status(404).json({ error: 'Hospital not found' });
      }

      // Check if service is offered and active
      const serviceObj = hospital.services.find(s => s.name.toLowerCase() === service.toLowerCase().trim());
      if (!serviceObj || !serviceObj.active) {
        return res.status(400).json({ error: 'Selected medical service is currently unavailable at this hospital' });
      }

      const booking =await  Booking.create({
        patientId,
        patientName,
        hospitalId,
        hospitalName: hospital.name,
        service: serviceObj.name,
        date,
        timeSlot
      });

      return res.status(201).json({ message: 'Booking initialized. Proceed to token payment.', booking });
    } catch (error) {
      console.error('Create booking error:', error);
      return res.status(500).json({ error: 'Failed to initialize booking' });
    }
  }

  /**
   * Complete payment simulation of ₹1 token and confirm booking.
   */
  static async confirmPayment(req, res) {
    try {
      const { bookingId } = req.body;

      if (!bookingId) {
        return res.status(400).json({ error: 'Booking ID is required' });
      }

      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      // Process simulated transaction of ₹1
      // Updates paymentStatus to 'Confirmed'
      const updatedBooking =await Booking.confirmPayment(bookingId);

      return res.json({ 
        message: 'Payment simulation successful. Booking confirmed!', 
        booking: updatedBooking 
      });
    } catch (error) {
      console.error('Confirm payment error:', error);
      return res.status(400).json({ error: error.message || 'Payment confirmation failed' });
    }
  }

  /**
   * Get booking logs for a patient (history).
   */
  static async getPatientHistory(req, res) {
    try {
      const bookings =await  Booking.getByPatient(req.user.id);
      return res.json({ bookings });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch patient booking history' });
    }
  }

  /**
   * Get real-time booking feed for a specific hospital (Admin).
   */
  static async getHospitalFeed(req, res) {
    try {
      const { hospitalId } = req.params;
      
      // In this demo, if hospitalId is not provided we default to the admin's seeded hospital 'hosp_1'
      const targetHospitalId = hospitalId || 'hosp_1';
      
      const bookings = await Booking.getByHospital(targetHospitalId);
      return res.json({ bookings });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch hospital booking feed' });
    }
  }
}

module.exports = BookingController;
