const Database = require('./Database');
const bcrypt = require('bcryptjs');

class User {
  static FILENAME = 'users.json';

  /**
   * Create a new user (patient or admin).
   */
  static async create({ name, email, password, role }) {
    const users = Database.read(this.FILENAME);
    
    // Check if email already registered
    const normalizedEmail = email.toLowerCase().trim();
    if (users.find(u => u.email === normalizedEmail)) {
      throw new Error('Email is already registered');
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = {
      id: 'user_' + Date.now() + Math.random().toString(36).substring(2, 7),
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: role === 'admin' ? 'admin' : 'patient' // default to patient
    };

    users.push(newUser);
    Database.write(this.FILENAME, users);

    // Return user object without the password
    const { password: _, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  }

  /**
   * Find a user by email.
   */
  static findByEmail(email) {
    const users = Database.read(this.FILENAME);
    const normalizedEmail = email.toLowerCase().trim();
    return users.find(u => u.email === normalizedEmail) || null;
  }

  /**
   * Find a user by ID.
   */
  static findById(id) {
    const users = Database.read(this.FILENAME);
    return users.find(u => u.id === id) || null;
  }

  /**
   * Verify password.
   */
  static async verifyPassword(user, plainPassword) {
    return await bcrypt.compare(plainPassword, user.password);
  }
}

module.exports = User;
