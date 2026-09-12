const service = require('./vendor.service');
const https = require('https');

exports.nearby = async (req, res, next) => {
  try {
    const { type, latitude, longitude, radius } = req.query;

    if (!type || !latitude || !longitude) {
      return res.status(400).json({
        message: 'type, latitude and longitude are required',
      });
    }

    const lat = Number(latitude);
    const lon = Number(longitude);
    const searchRadius = radius ? Number(radius) : 5000;

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lon) ||
      !Number.isFinite(searchRadius)
    ) {
      return res.status(400).json({
        message: 'Invalid location or radius',
      });
    }

    const vendors = await service.searchNearby({
      type,
      latitude: lat,
      longitude: lon,
      radius: searchRadius,
    });

    res.json({
      items: vendors,
      total: vendors.length,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/vendors/route
 * Query params: fromLat, fromLon, toLat, toLon
 * Returns: { distance_m, duration_s, geometry } from OSRM
 */
exports.route = async (req, res, next) => {
  try {
    const { fromLat, fromLon, toLat, toLon } = req.query;

    if (!fromLat || !fromLon || !toLat || !toLon) {
      return res.status(400).json({
        message: 'fromLat, fromLon, toLat and toLon are required',
      });
    }

    const fLat = Number(fromLat);
    const fLon = Number(fromLon);
    const tLat = Number(toLat);
    const tLon = Number(toLon);

    if (
      !Number.isFinite(fLat) ||
      !Number.isFinite(fLon) ||
      !Number.isFinite(tLat) ||
      !Number.isFinite(tLon)
    ) {
      return res.status(400).json({ message: 'Invalid coordinates' });
    }

    // OSRM public demo server - driving profile, GeoJSON geometry
    // Coordinates are lon,lat order (OSRM convention)
    const osrmUrl =
      'https://router.project-osrm.org/route/v1/driving/' +
      fLon + ',' + fLat + ';' + tLon + ',' + tLat +
      '?overview=full&geometries=geojson&steps=false';

    console.log('[Route] Calling OSRM: ' + osrmUrl);

    const osrmData = await new Promise((resolve, reject) => {
      const request = https.get(osrmUrl, {
        headers: { 'User-Agent': 'EventManagement/1.0' },
        timeout: 10000,
      }, (osrmRes) => {
        let body = '';
        osrmRes.on('data', (chunk) => { body += chunk; });
        osrmRes.on('end', () => {
          console.log('[Route] OSRM status: ' + osrmRes.statusCode + ', body length: ' + body.length);
          if (osrmRes.statusCode !== 200) {
            reject(new Error('OSRM returned HTTP ' + osrmRes.statusCode + ': ' + body.slice(0, 200)));
            return;
          }
          try { resolve(JSON.parse(body)); }
          catch (e) { reject(new Error('OSRM invalid JSON: ' + body.slice(0, 200))); }
        });
      });

      request.on('timeout', () => {
        request.destroy();
        reject(new Error('OSRM request timed out after 10s'));
      });

      request.on('error', (err) => {
        reject(new Error('OSRM network error: ' + err.message));
      });
    });

    if (osrmData.code !== 'Ok' || !osrmData.routes || osrmData.routes.length === 0) {
      console.warn('[Route] OSRM code: ' + osrmData.code);
      return res.status(502).json({ message: 'OSRM could not find a route' });
    }

    const route = osrmData.routes[0];
    console.log('[Route] Success - distance: ' + route.distance + 'm, duration: ' + route.duration + 's');

    return res.json({
      distance_m: route.distance,
      duration_s: route.duration,
      geometry:   route.geometry,
    });
  } catch (err) {
    console.error('[Route] Error: ' + err.message);
    return res.status(502).json({ message: 'Route unavailable: ' + err.message });
  }
};
