const Review = require('../models/Review');
const Hospital = require('../models/Hospital');

class ReviewController {
  /**
   * Submit a review.
   */
  static async create(
    req,
    res
  ) {
    try {
      const {
        hospitalId,
        rating,
        comment
      } = req.body;

      const patientName =
        req.user?.name ||
        req.body
          .patientName ||
        'Anonymous';

      if (
        !hospitalId ||
        !rating ||
        !comment
      ) {
        return res
          .status(400)
          .json({
            error:
              'All fields (hospitalId, rating, comment) are required'
          });
      }

      const ratingVal =
        Number(rating);

      if (
        isNaN(
          ratingVal
        ) ||
        ratingVal < 1 ||
        ratingVal > 5
      ) {
        return res
          .status(400)
          .json({
            error:
              'Rating must be between 1 and 5'
          });
      }

      // PostgreSQL async
      const hospital =
        await Hospital.findById(
          hospitalId
        );

      if (
        !hospital
      ) {
        return res
          .status(404)
          .json({
            error:
              'Hospital not found'
          });
      }

      // PostgreSQL async
      const review =
        await Review.create({
          hospitalId,
          patientName,
          rating:
            ratingVal,
          comment
        });

      return res
        .status(201)
        .json({
          message:
            'Review posted successfully',
          review
        });
    } catch (error) {
      console.error(
        'Create review error:',
        error
      );

      return res
        .status(500)
        .json({
          error:
            'Failed to post review'
        });
    }
  }

  /**
   * Get hospital reviews.
   */
  static async getByHospital(
    req,
    res
  ) {
    try {
      const {
        hospitalId
      } = req.params;

      const reviews =
        await Review.getByHospital(
          hospitalId
        );

      return res.json({
        reviews
      });
    } catch (error) {
      console.error(
        'Fetch reviews error:',
        error
      );

      return res
        .status(500)
        .json({
          error:
            'Failed to retrieve reviews'
        });
    }
  }
}

module.exports =
  ReviewController;