const Database = require('./Database');

class Hospital {
  static FILENAME = 'hospitals.json';

  /**
   * Get all hospitals.
   */
  static getAll() {
    return Database.read(this.FILENAME);
  }

  /**
   * Find a hospital by ID.
   */
  static findById(id) {
    const hospitals = Database.read(this.FILENAME);
    return hospitals.find(h => h.id === id) || null;
  }

  /**
   * Search hospitals that offer a specific service and check if that service is active.
   */
  static searchByService(serviceName) {
    const hospitals = Database.read(this.FILENAME);
    if (!serviceName) return hospitals;
    
    const query = serviceName.toLowerCase().trim();
    return hospitals.filter(h => 
      h.services.some(s => s.name.toLowerCase().includes(query) && s.active)
    );
  }

  /**
   * Update the price of a service at a hospital.
   */
  static updateServicePrice(hospitalId, serviceName, newPrice) {
    const hospitals = Database.read(this.FILENAME);
    const hospitalIndex = hospitals.findIndex(h => h.id === hospitalId);
    if (hospitalIndex === -1) throw new Error('Hospital not found');

    const hospital = hospitals[hospitalIndex];
    const service = hospital.services.find(s => s.name.toLowerCase() === serviceName.toLowerCase().trim());
    if (!service) throw new Error(`Service '${serviceName}' not found in hospital`);

    service.price = Math.max(0, Number(newPrice));
    
    Database.write(this.FILENAME, hospitals);
    return hospital;
  }

  /**
   * Toggle the active status of a service at a hospital.
   */
  static toggleServiceActive(hospitalId, serviceName, active) {
    const hospitals = Database.read(this.FILENAME);
    const hospitalIndex = hospitals.findIndex(h => h.id === hospitalId);
    if (hospitalIndex === -1) throw new Error('Hospital not found');

    const hospital = hospitals[hospitalIndex];
    const service = hospital.services.find(s => s.name.toLowerCase() === serviceName.toLowerCase().trim());
    if (!service) throw new Error(`Service '${serviceName}' not found in hospital`);

    service.active = Boolean(active);
    
    Database.write(this.FILENAME, hospitals);
    return hospital;
  }

  /**
   * Update the cached overall rating and total reviews count.
   */
  static updateRating(hospitalId, averageRating, totalReviews) {
    const hospitals = Database.read(this.FILENAME);
    const hospitalIndex = hospitals.findIndex(h => h.id === hospitalId);
    if (hospitalIndex === -1) return;

    hospitals[hospitalIndex].overallRating = Number(Number(averageRating).toFixed(1));
    hospitals[hospitalIndex].totalReviews = Number(totalReviews);
    
    Database.write(this.FILENAME, hospitals);
  }
}

module.exports = Hospital;
