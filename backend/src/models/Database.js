const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

class Database {
  /**
   * Reads data from a JSON file.
   * @param {string} filename - The JSON filename (e.g., 'users.json')
   * @returns {Array} - The parsed JSON array data
   */
  static read(filename) {
    const filePath = path.join(DATA_DIR, filename);
    if (!fs.existsSync(filePath)) {
      // Create empty file
      fs.writeFileSync(filePath, JSON.stringify([], null, 2), 'utf-8');
      return [];
    }
    try {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data || '[]');
    } catch (error) {
      console.error(`Error reading database file: ${filename}`, error);
      return [];
    }
  }

  /**
   * Writes data to a JSON file.
   * @param {string} filename - The JSON filename
   * @param {Array} data - The array data to serialize
   * @returns {boolean} - Success status
   */
  static write(filename, data) {
    const filePath = path.join(DATA_DIR, filename);
    const tempPath = `${filePath}.tmp`;
    try {
      // Write to temp file first to ensure atomic updates
      fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tempPath, filePath);
      return true;
    } catch (error) {
      console.error(`Error writing database file: ${filename}`, error);
      if (fs.existsSync(tempPath)) {
        try { fs.unlinkSync(tempPath); } catch (_) {}
      }
      return false;
    }
  }
}

module.exports = Database;
