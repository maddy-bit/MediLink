const db = require('../config/db');

class Hospital {
  /**
   * Get all hospitals.
   */
  static async getAll() {
    const query = `
      SELECT *
      FROM hospitals
      ORDER BY name ASC
    `;

    const hospitalsResult = await db.query(query);

    const hospitals = await Promise.all(
      hospitalsResult.rows.map(async (hospital) => {
        const servicesResult = await db.query(
          `
          SELECT
            service_name AS name,
            price,
            active
          FROM services
          WHERE hospital_id = $1
          `,
          [hospital.id]
        );

        return {
          ...hospital,
          services: servicesResult.rows
        };
      })
    );

    return hospitals;
  }

  /**
   * Find a hospital by ID.
   */
  static async findById(id) {
    const hospitalQuery = `
      SELECT *
      FROM hospitals
      WHERE id = $1
      LIMIT 1
    `;

    const hospitalResult = await db.query(
      hospitalQuery,
      [id]
    );

    if (hospitalResult.rows.length === 0) {
      return null;
    }

    const hospital = hospitalResult.rows[0];

    const servicesQuery = `
      SELECT
        service_name AS name,
        price,
        active
      FROM services
      WHERE hospital_id = $1
    `;

    const servicesResult = await db.query(
      servicesQuery,
      [id]
    );

    return {
      ...hospital,
      services: servicesResult.rows
    };
  }

  /**
   * Search hospitals by service.
   */
  static async searchByService(serviceName) {
    if (!serviceName) {
      return await this.getAll();
    }

    const query = `
      SELECT DISTINCT h.*
      FROM hospitals h
      JOIN services s
      ON h.id = s.hospital_id
      WHERE
        LOWER(s.service_name)
        LIKE LOWER($1)
      AND s.active = true
    `;

    const hospitalsResult = await db.query(
      query,
      [`%${serviceName.trim()}%`]
    );

    const hospitals = await Promise.all(
      hospitalsResult.rows.map(async (hospital) => {
        const servicesResult = await db.query(
          `
          SELECT
            service_name AS name,
            price,
            active
          FROM services
          WHERE hospital_id = $1
          `,
          [hospital.id]
        );

        return {
          ...hospital,
          services: servicesResult.rows
        };
      })
    );

    return hospitals;
  }

  /**
   * Update service price.
   */
  static async updateServicePrice(
    hospitalId,
    serviceName,
    newPrice
  ) {
    const query = `
      UPDATE services
      SET price = $1
      WHERE hospital_id = $2
      AND LOWER(service_name)
      = LOWER($3)
      RETURNING *
    `;

    const result = await db.query(
      query,
      [
        Math.max(0, Number(newPrice)),
        hospitalId,
        serviceName.trim()
      ]
    );

    if (result.rows.length === 0) {
      throw new Error(
        `Service '${serviceName}' not found in hospital`
      );
    }

    return await this.findById(hospitalId);
  }

  /**
   * Toggle active status.
   */
  static async toggleServiceActive(
    hospitalId,
    serviceName,
    active
  ) {
    const query = `
      UPDATE services
      SET active = $1
      WHERE hospital_id = $2
      AND LOWER(service_name)
      = LOWER($3)
      RETURNING *
    `;

    const result = await db.query(
      query,
      [
        Boolean(active),
        hospitalId,
        serviceName.trim()
      ]
    );

    if (result.rows.length === 0) {
      throw new Error(
        `Service '${serviceName}' not found in hospital`
      );
    }

    return await this.findById(hospitalId);
  }

  /**
   * Update hospital rating.
   */
  static async updateRating(
    hospitalId,
    averageRating,
    totalReviews
  ) {
    const query = `
      UPDATE hospitals
      SET
        overall_rating = $1,
        total_reviews = $2
      WHERE id = $3
    `;

    await db.query(query, [
      Number(
        Number(averageRating).toFixed(1)
      ),
      Number(totalReviews),
      hospitalId
    ]);
  }
}

module.exports = Hospital;