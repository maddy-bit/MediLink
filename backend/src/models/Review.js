const Database = require('./Database');
const Hospital = require('./Hospital');

class Review {
  static FILENAME = 'reviews.json';

  /**
   * Create a review and trigger update to hospital rating.
   */
  static create({ hospitalId, patientName, rating, comment }) {
    const reviews = Database.read(this.FILENAME);

    const newReview = {
      id: 'rev_' + Date.now() + Math.random().toString(36).substring(2, 7),
      hospitalId,
      patientName: patientName.trim() || 'Anonymous Patient',
      rating: Math.min(5, Math.max(1, Number(rating))),
      comment: comment.trim(),
      createdAt: new Date().toISOString()
    };

    reviews.push(newReview);
    Database.write(this.FILENAME, reviews);

    // Recompute and update the hospital's cached average rating
    this.recalculateHospitalRating(hospitalId);

    return newReview;
  }

  /**
   * Get all reviews for a hospital, sorted newest first.
   */
  static getByHospital(hospitalId) {
    const reviews = Database.read(this.FILENAME);
    return reviews
      .filter(r => r.hospitalId === hospitalId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  /**
   * Calculate average rating and total count, then notify Hospital model.
   */
  static recalculateHospitalRating(hospitalId) {
    const reviews = Database.read(this.FILENAME);
    const hospitalReviews = reviews.filter(r => r.hospitalId === hospitalId);
    
    if (hospitalReviews.length === 0) return;

    const totalReviews = hospitalReviews.length;
    const sumRatings = hospitalReviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = sumRatings / totalReviews;

    Hospital.updateRating(hospitalId, avgRating, totalReviews);
  }
}

module.exports = Review;
