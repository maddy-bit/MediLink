const Database = require('./Database');

class Booking {
  static FILENAME = 'bookings.json';

  /**
   * Create a new booking entry.
   */
  static create({ patientId, patientName, hospitalId, hospitalName, service, date, timeSlot }) {
    const bookings = Database.read(this.FILENAME);

    const newBooking = {
      id: 'book_' + Date.now() + Math.random().toString(36).substring(2, 7),
      patientId,
      patientName,
      hospitalId,
      hospitalName,
      service,
      date,            // e.g. "2026-05-29"
      timeSlot,        // e.g. "10:00 AM"
      paymentStatus: 'Pending', // Pending until simulated transaction is successful
      amountPaid: 1,   // Token amount of ₹1
      createdAt: new Date().toISOString()
    };

    bookings.push(newBooking);
    Database.write(this.FILENAME, bookings);
    return newBooking;
  }

  /**
   * Find booking by ID.
   */
  static findById(id) {
    const bookings = Database.read(this.FILENAME);
    return bookings.find(b => b.id === id) || null;
  }

  /**
   * Retrieve bookings made by a specific patient.
   */
  static getByPatient(patientId) {
    const bookings = Database.read(this.FILENAME);
    return bookings
      .filter(b => b.patientId === patientId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  /**
   * Retrieve bookings made for a specific hospital (for Admin Feed).
   */
  static getByHospital(hospitalId) {
    const bookings = Database.read(this.FILENAME);
    return bookings
      .filter(b => b.hospitalId === hospitalId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  /**
   * Confirm the booking payment status.
   */
  static confirmPayment(id) {
    const bookings = Database.read(this.FILENAME);
    const bookingIndex = bookings.findIndex(b => b.id === id);
    if (bookingIndex === -1) throw new Error('Booking not found');

    bookings[bookingIndex].paymentStatus = 'Confirmed';
    
    Database.write(this.FILENAME, bookings);
    return bookings[bookingIndex];
  }
}

module.exports = Booking;
