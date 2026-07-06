const db = require('../db');
const bcrypt = require('bcryptjs');

class User {
  static async create(username, email, password) {
    const hashed = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashed]
    );
    return result.insertId;
  }

  static async findByUsername(username) {
    const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
    return rows[0];
  }

  static async comparePassword(plain, hashed) {
    return bcrypt.compare(plain, hashed);
  }
}

module.exports = User;
