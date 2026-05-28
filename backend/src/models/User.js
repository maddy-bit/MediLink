const db = require('../config/db');
const bcrypt = require('bcryptjs');

class User {
  /**
   * Create a new user.
   */
  static async create({
    name,
    email,
    password,
    role
  }) {
    const normalizedEmail =
      email.toLowerCase().trim();

    // Check existing email
    const existingUser =
      await db.query(
        `
        SELECT *
        FROM users
        WHERE email = $1
        LIMIT 1
        `,
        [normalizedEmail]
      );

    if (
      existingUser.rows.length > 0
    ) {
      throw new Error(
        'Email is already registered'
      );
    }

    // Hash password
    const salt =
      await bcrypt.genSalt(10);

    const hashedPassword =
      await bcrypt.hash(
        password,
        salt
      );

    const newUser = {
      id:
        'user_' +
        Date.now() +
        Math.random()
          .toString(36)
          .substring(2, 7),

      name: name.trim(),

      email: normalizedEmail,

      password: hashedPassword,

      role:
        role === 'admin'
          ? 'admin'
          : 'patient'
    };

    const query = `
      INSERT INTO users (
        id,
        name,
        email,
        password,
        role
      )
      VALUES (
        $1,$2,$3,$4,$5
      )
      RETURNING
        id,
        name,
        email,
        role,
        created_at
    `;

    const values = [
      newUser.id,
      newUser.name,
      newUser.email,
      newUser.password,
      newUser.role
    ];

    const result =
      await db.query(
        query,
        values
      );

    return result.rows[0];
  }

  /**
   * Find user by email.
   */
  static async findByEmail(
    email
  ) {
    const normalizedEmail =
      email.toLowerCase().trim();

    const query = `
      SELECT *
      FROM users
      WHERE email = $1
      LIMIT 1
    `;

    const result =
      await db.query(
        query,
        [normalizedEmail]
      );

    return (
      result.rows[0] || null
    );
  }

  /**
   * Find user by ID.
   */
  static async findById(id) {
    const query = `
      SELECT
        id,
        name,
        email,
        role,
        created_at
      FROM users
      WHERE id = $1
      LIMIT 1
    `;

    const result =
      await db.query(
        query,
        [id]
      );

    return (
      result.rows[0] || null
    );
  }

  /**
   * Verify password.
   */
  static async verifyPassword(
    user,
    plainPassword
  ) {
    return await bcrypt.compare(
      plainPassword,
      user.password
    );
  }
}

module.exports = User;