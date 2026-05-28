const Hospital = require('../models/Hospital');
const Review = require('../models/Review');

/**
 * Calculates the distance between two coordinates in kilometers using the Haversine formula.
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Number(d.toFixed(1)); // return km with 1 decimal place
}

class HospitalController {
  /**
   * Search hospitals by service, calculate distance, and sort results.
   */
  static search(req, res) {
    try {
      const { service, lat, lon, sortBy } = req.query;

      if (!service) {
        return res.status(400).json({ error: 'Search service/treatment query is required' });
      }

      // Parse coordinates (e.g. from geolocation)
      const userLat = lat ? Number(lat) : null;
      const userLon = lon ? Number(lon) : null;

      // Find hospitals offering the matching active service
      const matchingHospitals = Hospital.searchByService(service);

      // Formulate final results with distance and pricing
      const results = matchingHospitals.map(h => {
        const matchingServiceObj = h.services.find(s => s.name.toLowerCase().includes(service.toLowerCase().trim()));
        const distance = calculateDistance(userLat, userLon, h.latitude, h.longitude);

        return {
          id: h.id,
          name: h.name,
          address: h.address,
          latitude: h.latitude,
          longitude: h.longitude,
          overallRating: h.overallRating,
          totalReviews: h.totalReviews,
          imageUrl: h.imageUrl,
          searchedService: {
            name: matchingServiceObj.name,
            price: matchingServiceObj.price
          },
          distance: distance !== null ? distance : 2.5 // fallback simulated distance if geolocation denied
        };
      });

      // Apply sorting: price (low to high), distance (nearest first), rating (highest first)
      if (sortBy === 'price') {
        results.sort((a, b) => a.searchedService.price - b.searchedService.price);
      } else if (sortBy === 'distance') {
        results.sort((a, b) => a.distance - b.distance);
      } else if (sortBy === 'rating') {
        results.sort((a, b) => b.overallRating - a.overallRating);
      }

      return res.json({ serviceSearched: service, results });
    } catch (error) {
      console.error('Search error:', error);
      return res.status(500).json({ error: 'Failed to search hospitals' });
    }
  }

  /**
   * Get single hospital details, services, and list of reviews.
   */
  static getDetails(req, res) {
    try {
      const { id } = req.params;
      const hospital = Hospital.findById(id);
      
      if (!hospital) {
        return res.status(404).json({ error: 'Hospital not found' });
      }

      // Fetch reviews
      const reviews = Review.getByHospital(id);

      return res.json({ hospital, reviews });
    } catch (error) {
      console.error('Fetch hospital details error:', error);
      return res.status(500).json({ error: 'Failed to fetch hospital details' });
    }
  }

  /**
   * Get admin's own hospital (seeded based on admin associations or fallback for demo)
   */
  static getAdminHospital(req, res) {
    try {
      // In a multi-tenant app, the admin is linked to a specific hospital.
      // For this prototype, we'll map the admin user to the first hospital (City General Hospital) 
      // or match their ID/settings. We seed a link: admin maps to hosp_1 by default.
      const hospital = Hospital.findById('hosp_1'); 
      if (!hospital) {
        return res.status(404).json({ error: 'Admin hospital not found' });
      }
      return res.json({ hospital });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch admin hospital details' });
    }
  }

  /**
   * Update service pricing and active status (Admin panel).
   */
  static updateService(req, res) {
    try {
      const { hospitalId } = req.params;
      const { serviceName, price, active } = req.body;

      if (!serviceName) {
        return res.status(400).json({ error: 'Service name is required' });
      }

      let updatedHospital = null;

      if (price !== undefined) {
        updatedHospital = Hospital.updateServicePrice(hospitalId, serviceName, price);
      }

      if (active !== undefined) {
        updatedHospital = Hospital.toggleServiceActive(hospitalId, serviceName, active);
      }

      if (!updatedHospital) {
        updatedHospital = Hospital.findById(hospitalId);
      }

      return res.json({ message: 'Service settings updated successfully', hospital: updatedHospital });
    } catch (error) {
      console.error('Update service error:', error);
      return res.status(400).json({ error: error.message || 'Failed to update service' });
    }
  }
}

module.exports = HospitalController;
