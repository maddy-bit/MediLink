const db = require('../config/db');
const Hospital = require('./Hospital');

class Review {
  /**
   * Create a review and update hospital rating.
   */
  static async create({
    hospitalId,
    patientName,
    rating,
    comment
  }) {
    const newReview = {
      id:
        'rev_' +
        Date.now() +
        Math.random().toString(36).substring(2, 7),

      hospitalId,
      patientName:
        patientName.trim() ||
        'Anonymous Patient',

      rating: Math.min(
        5,
        Math.max(1, Number(rating))
      ),

      comment: comment.trim(),

      createdAt:
        new Date().toISOString()
    };

    const query = `
      INSERT INTO reviews (
        hospital_id,
        patient_name,
        rating,
        comment,
        created_at
      )
      VALUES ($1,$2,$3,$4,$5)
      RETURNING *;
    `;

    const values = [
      newReview.hospitalId,
      newReview.patientName,
      newReview.rating,
      newReview.comment,
      newReview.createdAt
    ];

    const result = await db.query(
      query,
      values
    );

    // Recalculate rating
    await this.recalculateHospitalRating(
      hospitalId
    );

    return result.rows[0];
  }

  /**
   * Get all reviews for hospital.
   */
  static async getByHospital(
    hospitalId
  ) {
    const query = `
      SELECT *
      FROM reviews
      WHERE hospital_id = $1
      ORDER BY created_at DESC
    `;

    const result = await db.query(
      query,
      [hospitalId]
    );

    return result.rows;
  }

  /**
   * Recalculate average rating.
   */
  static async recalculateHospitalRating(
    hospitalId
  ) {
    const query = `
      SELECT
        COUNT(*) AS total_reviews,
        AVG(rating) AS average_rating
      FROM reviews
      WHERE hospital_id = $1
    `;

    const result = await db.query(
      query,
      [hospitalId]
    );

    const row = result.rows[0];

    const totalReviews =
      Number(row.total_reviews);

    const avgRating =
      Number(
        row.average_rating || 0
      );

    if (totalReviews === 0) return;

    await Hospital.updateRating(
      hospitalId,
      avgRating,
      totalReviews
    );
  }
}

module.exports = Review;