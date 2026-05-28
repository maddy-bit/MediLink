const db = require('../config/db');

class Booking {
  /**
   * Create a new booking entry.
   */
  static async create({
    patientId,
    patientName,
    hospitalId,
    hospitalName,
    service,
    date,
    timeSlot
  }) {
    const newBooking = {
      id:
        'book_' +
        Date.now() +
        Math.random().toString(36).substring(2, 7),

      patientId,
      patientName,
      hospitalId,
      hospitalName,
      service,
      date,
      timeSlot,
      paymentStatus: 'Pending',
      amountPaid: 1,
      createdAt: new Date().toISOString()
    };

    const query = `
      INSERT INTO bookings (
        id,
        patient_id,
        patient_name,
        hospital_id,
        hospital_name,
        service,
        booking_date,
        time_slot,
        payment_status,
        amount_paid,
        created_at
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11
      )
      RETURNING *
    `;

    const values = [
      newBooking.id,
      newBooking.patientId,
      newBooking.patientName,
      newBooking.hospitalId,
      newBooking.hospitalName,
      newBooking.service,
      newBooking.date,
      newBooking.timeSlot,
      newBooking.paymentStatus,
      newBooking.amountPaid,
      newBooking.createdAt
    ];

    const result = await db.query(query, values);

    return result.rows[0];
  }

  /**
   * Find booking by ID.
   */
  static async findById(id) {
    const query = `
      SELECT *
      FROM bookings
      WHERE id = $1
      LIMIT 1
    `;

    const result = await db.query(query, [id]);

    return result.rows[0] || null;
  }

  /**
   * Retrieve bookings made by a specific patient.
   */
  static async getByPatient(patientId) {
    const query = `
      SELECT *
      FROM bookings
      WHERE patient_id = $1
      ORDER BY created_at DESC
    `;

    const result = await db.query(query, [patientId]);

    return result.rows;
  }

  /**
   * Retrieve bookings made for a specific hospital.
   */
  static async getByHospital(hospitalId) {
    const query = `
      SELECT *
      FROM bookings
      WHERE hospital_id = $1
      ORDER BY created_at DESC
    `;

    const result = await db.query(query, [hospitalId]);

    return result.rows;
  }

  /**
   * Confirm booking payment status.
   */
  static async confirmPayment(id) {
    const query = `
      UPDATE bookings
      SET payment_status = 'Confirmed'
      WHERE id = $1
      RETURNING *
    `;

    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      throw new Error('Booking not found');
    }

    return result.rows[0];
  }
}

module.exports = Booking;