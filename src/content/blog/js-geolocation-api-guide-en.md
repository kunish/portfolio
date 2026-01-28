---
title: 'JavaScript Geolocation API Complete Guide'
description: 'Master location services: position retrieval, real-time tracking, permission handling, and location-based applications'
pubDate: 'Jan 28 2025'
heroImage: '../../assets/blog-placeholder-2.jpg'
lang: 'en'
translationKey: 'js-geolocation-api-guide'
---

The Geolocation API provides device geographic location information. This article covers its usage and practical applications.

## Basic Usage

### Detecting Support

```javascript
// Check geolocation support
if ('geolocation' in navigator) {
  console.log('Geolocation API supported');
} else {
  console.log('Geolocation API not supported');
}
```

### Getting Current Position

```javascript
// Basic position retrieval
navigator.geolocation.getCurrentPosition(
  // Success callback
  (position) => {
    console.log('Latitude:', position.coords.latitude);
    console.log('Longitude:', position.coords.longitude);
    console.log('Accuracy:', position.coords.accuracy, 'meters');
  },
  // Error callback
  (error) => {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        console.error('User denied location request');
        break;
      case error.POSITION_UNAVAILABLE:
        console.error('Location information unavailable');
        break;
      case error.TIMEOUT:
        console.error('Request timed out');
        break;
    }
  }
);

// Promise wrapper
function getCurrentPosition(options = {}) {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}

// Usage example
async function getLocation() {
  try {
    const position = await getCurrentPosition();
    console.log('Position:', position.coords);
    return position;
  } catch (error) {
    console.error('Failed to get position:', error);
    throw error;
  }
}
```

### Position Options

```javascript
const options = {
  // Enable high accuracy (GPS)
  enableHighAccuracy: true,
  
  // Timeout (milliseconds)
  timeout: 10000,
  
  // Cache duration (milliseconds)
  maximumAge: 0  // 0 means no caching
};

navigator.geolocation.getCurrentPosition(
  (position) => {
    console.log('High accuracy position:', position.coords);
  },
  (error) => {
    console.error('Error:', error.message);
  },
  options
);
```

### Position Information Details

```javascript
navigator.geolocation.getCurrentPosition((position) => {
  const coords = position.coords;
  
  // Required properties
  console.log('Latitude:', coords.latitude);           // degrees
  console.log('Longitude:', coords.longitude);         // degrees
  console.log('Accuracy:', coords.accuracy);           // meters
  
  // Optional properties (may be null)
  console.log('Altitude:', coords.altitude);           // meters
  console.log('Altitude Accuracy:', coords.altitudeAccuracy); // meters
  console.log('Heading:', coords.heading);             // 0-360 degrees, north is 0
  console.log('Speed:', coords.speed);                 // meters/second
  
  // Timestamp
  console.log('Time:', new Date(position.timestamp));
});
```

## Position Tracking

### Real-time Position Monitoring

```javascript
// Start watching position changes
const watchId = navigator.geolocation.watchPosition(
  (position) => {
    console.log('Position update:', {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy: position.coords.accuracy
    });
  },
  (error) => {
    console.error('Watch error:', error.message);
  },
  {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 1000
  }
);

// Stop watching
function stopWatching() {
  navigator.geolocation.clearWatch(watchId);
  console.log('Stopped position tracking');
}

// Stop after some time
setTimeout(stopWatching, 60000); // Stop after 1 minute
```

### Location Tracker Manager

```javascript
class LocationTracker {
  constructor(options = {}) {
    this.options = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
      ...options
    };
    
    this.watchId = null;
    this.listeners = new Set();
    this.lastPosition = null;
    this.isTracking = false;
  }
  
  async getCurrentPosition() {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.lastPosition = position;
          resolve(position);
        },
        reject,
        this.options
      );
    });
  }
  
  startTracking() {
    if (this.isTracking) return;
    
    this.isTracking = true;
    
    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        this.lastPosition = position;
        this.notifyListeners(position);
      },
      (error) => {
        this.notifyListeners(null, error);
      },
      this.options
    );
    
    console.log('Started position tracking');
  }
  
  stopTracking() {
    if (!this.isTracking) return;
    
    navigator.geolocation.clearWatch(this.watchId);
    this.watchId = null;
    this.isTracking = false;
    
    console.log('Stopped position tracking');
  }
  
  onPositionChange(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
  
  notifyListeners(position, error = null) {
    this.listeners.forEach(callback => {
      callback(position, error);
    });
  }
  
  getLastPosition() {
    return this.lastPosition;
  }
  
  getDistance(lat1, lon1, lat2, lon2) {
    // Haversine formula for distance calculation
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    return R * c; // meters
  }
}

// Usage
const tracker = new LocationTracker({
  enableHighAccuracy: true
});

tracker.onPositionChange((position, error) => {
  if (error) {
    console.error('Position error:', error);
    return;
  }
  
  console.log('New position:', position.coords);
});

tracker.startTracking();
```

## Permission Handling

### Permission Status Query

```javascript
// Query permission status
async function checkGeolocationPermission() {
  try {
    const result = await navigator.permissions.query({ name: 'geolocation' });
    
    console.log('Permission state:', result.state);
    // 'granted' - Authorized
    // 'denied' - Rejected
    // 'prompt' - Needs to ask
    
    // Listen for permission changes
    result.addEventListener('change', () => {
      console.log('Permission state changed:', result.state);
    });
    
    return result.state;
  } catch (error) {
    console.error('Permission query failed:', error);
    return 'unknown';
  }
}

// Usage
checkGeolocationPermission().then(state => {
  if (state === 'granted') {
    console.log('Can get position directly');
  } else if (state === 'denied') {
    console.log('Permission denied, need to guide user to enable');
  } else {
    console.log('Need to request permission');
  }
});
```

### Location Service with Permission Handling

```javascript
class GeolocationService {
  constructor() {
    this.permissionState = 'unknown';
    this.initPermissionListener();
  }
  
  async initPermissionListener() {
    try {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      this.permissionState = result.state;
      
      result.addEventListener('change', () => {
        this.permissionState = result.state;
        this.onPermissionChange?.(result.state);
      });
    } catch {
      // Permissions API not supported
    }
  }
  
  async requestPermission() {
    // Request permission by getting position
    try {
      await this.getCurrentPosition({ timeout: 5000 });
      return 'granted';
    } catch (error) {
      if (error.code === 1) {
        return 'denied';
      }
      throw error;
    }
  }
  
  async getCurrentPosition(options = {}) {
    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000
    };
    
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        resolve,
        (error) => {
          reject(this.enhanceError(error));
        },
        { ...defaultOptions, ...options }
      );
    });
  }
  
  enhanceError(error) {
    const messages = {
      1: 'Location permission denied. Please allow location access in browser settings.',
      2: 'Unable to get location. Please check your network connection or GPS settings.',
      3: 'Location request timed out. Please ensure you are in an area with good signal.'
    };
    
    return {
      code: error.code,
      message: messages[error.code] || error.message,
      originalError: error
    };
  }
  
  onPermissionChange = null;
}

// Usage
const geoService = new GeolocationService();

geoService.onPermissionChange = (state) => {
  console.log('Permission state changed:', state);
  
  if (state === 'denied') {
    showPermissionDeniedUI();
  }
};

async function getMyLocation() {
  try {
    const position = await geoService.getCurrentPosition();
    return position.coords;
  } catch (error) {
    // Show friendly error message
    alert(error.message);
    return null;
  }
}
```

## Practical Applications

### Nearby Search

```javascript
class NearbySearch {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.tracker = new LocationTracker();
  }
  
  async searchNearby(type, radius = 1000) {
    const position = await this.tracker.getCurrentPosition();
    const { latitude, longitude } = position.coords;
    
    // Call places search API
    const results = await this.fetchPlaces(latitude, longitude, type, radius);
    
    // Calculate distance and sort
    return results
      .map(place => ({
        ...place,
        distance: this.tracker.getDistance(
          latitude, longitude,
          place.lat, place.lng
        )
      }))
      .sort((a, b) => a.distance - b.distance);
  }
  
  async fetchPlaces(lat, lng, type, radius) {
    // Simulated API call
    const response = await fetch(
      `/api/places?lat=${lat}&lng=${lng}&type=${type}&radius=${radius}`
    );
    return response.json();
  }
  
  formatDistance(meters) {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
  }
}

// Usage
const nearbySearch = new NearbySearch('your-api-key');

async function findNearbyRestaurants() {
  const restaurants = await nearbySearch.searchNearby('restaurant', 2000);
  
  restaurants.forEach(place => {
    console.log(
      `${place.name} - ${nearbySearch.formatDistance(place.distance)}`
    );
  });
}
```

### Workout Tracker

```javascript
class WorkoutTracker {
  constructor() {
    this.tracker = new LocationTracker({
      enableHighAccuracy: true,
      maximumAge: 0
    });
    
    this.path = [];
    this.startTime = null;
    this.totalDistance = 0;
    this.isRecording = false;
  }
  
  start() {
    if (this.isRecording) return;
    
    this.path = [];
    this.startTime = Date.now();
    this.totalDistance = 0;
    this.isRecording = true;
    
    this.tracker.onPositionChange((position, error) => {
      if (error || !position) return;
      this.recordPoint(position);
    });
    
    this.tracker.startTracking();
    console.log('Started recording workout');
  }
  
  stop() {
    if (!this.isRecording) return;
    
    this.tracker.stopTracking();
    this.isRecording = false;
    
    return this.getSummary();
  }
  
  recordPoint(position) {
    const point = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      altitude: position.coords.altitude,
      speed: position.coords.speed,
      timestamp: position.timestamp
    };
    
    // Calculate distance from last point
    if (this.path.length > 0) {
      const lastPoint = this.path[this.path.length - 1];
      const distance = this.tracker.getDistance(
        lastPoint.lat, lastPoint.lng,
        point.lat, point.lng
      );
      
      // Filter out possible GPS drift
      if (distance < 2) return; // Don't record if less than 2 meters
      
      this.totalDistance += distance;
    }
    
    this.path.push(point);
    this.onUpdate?.(this.getStats());
  }
  
  getStats() {
    const duration = Date.now() - this.startTime;
    const avgSpeed = this.totalDistance / (duration / 1000); // m/s
    
    return {
      distance: this.totalDistance,
      duration,
      avgSpeed,
      points: this.path.length
    };
  }
  
  getSummary() {
    const stats = this.getStats();
    
    return {
      ...stats,
      path: [...this.path],
      startTime: this.startTime,
      endTime: Date.now(),
      formattedDistance: this.formatDistance(stats.distance),
      formattedDuration: this.formatDuration(stats.duration),
      formattedPace: this.formatPace(stats.avgSpeed)
    };
  }
  
  formatDistance(meters) {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(2)} km`;
  }
  
  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}:${String(minutes % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
    }
    return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
  }
  
  formatPace(speedMps) {
    if (speedMps <= 0) return '--:--';
    
    const paceSeconds = 1000 / speedMps; // seconds per km
    const minutes = Math.floor(paceSeconds / 60);
    const seconds = Math.round(paceSeconds % 60);
    
    return `${minutes}:${String(seconds).padStart(2, '0')} /km`;
  }
  
  onUpdate = null;
}

// Usage
const workout = new WorkoutTracker();

workout.onUpdate = (stats) => {
  console.log('Distance:', workout.formatDistance(stats.distance));
  console.log('Duration:', workout.formatDuration(stats.duration));
};

// Start recording
workout.start();

// Stop and get summary
setTimeout(() => {
  const summary = workout.stop();
  console.log('Workout summary:', summary);
}, 300000); // After 5 minutes
```

### Geofencing

```javascript
class Geofence {
  constructor() {
    this.fences = new Map();
    this.tracker = new LocationTracker();
    this.insideFences = new Set();
  }
  
  addFence(id, center, radius, callbacks = {}) {
    this.fences.set(id, {
      center,
      radius,
      onEnter: callbacks.onEnter || (() => {}),
      onExit: callbacks.onExit || (() => {}),
      onStay: callbacks.onStay || (() => {})
    });
  }
  
  removeFence(id) {
    this.fences.delete(id);
    this.insideFences.delete(id);
  }
  
  start() {
    this.tracker.onPositionChange((position, error) => {
      if (error || !position) return;
      this.checkFences(position);
    });
    
    this.tracker.startTracking();
  }
  
  stop() {
    this.tracker.stopTracking();
  }
  
  checkFences(position) {
    const { latitude, longitude } = position.coords;
    
    this.fences.forEach((fence, id) => {
      const distance = this.tracker.getDistance(
        latitude, longitude,
        fence.center.lat, fence.center.lng
      );
      
      const isInside = distance <= fence.radius;
      const wasInside = this.insideFences.has(id);
      
      if (isInside && !wasInside) {
        // Entered fence
        this.insideFences.add(id);
        fence.onEnter({ id, distance, position });
      } else if (!isInside && wasInside) {
        // Exited fence
        this.insideFences.delete(id);
        fence.onExit({ id, distance, position });
      } else if (isInside && wasInside) {
        // Staying in fence
        fence.onStay({ id, distance, position });
      }
    });
  }
  
  isInside(id) {
    return this.insideFences.has(id);
  }
}

// Usage
const geofence = new Geofence();

// Add office fence
geofence.addFence('office', 
  { lat: 40.7128, lng: -74.0060 },
  200, // 200 meter radius
  {
    onEnter: ({ id }) => {
      console.log('Entered office area');
      // Auto check-in
    },
    onExit: ({ id }) => {
      console.log('Left office area');
      // Remind to check-out
    }
  }
);

// Add home fence
geofence.addFence('home',
  { lat: 40.7228, lng: -74.0160 },
  100,
  {
    onEnter: () => {
      console.log('Arrived home');
      // Trigger smart home
    }
  }
);

geofence.start();
```

## Best Practices Summary

```
Geolocation API Best Practices:
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Permission Handling                               │
│   ├── Explain why location permission needed        │
│   ├── Handle permission denial gracefully          │
│   ├── Provide manual location input fallback       │
│   └── Cache location to reduce requests            │
│                                                     │
│   Accuracy vs Battery                               │
│   ├── Choose high/low accuracy as needed           │
│   ├── Set reasonable update intervals              │
│   ├── Stop tracking when not needed                │
│   └── Use maximumAge for caching                   │
│                                                     │
│   Error Handling                                    │
│   ├── Handle all error types                       │
│   ├── Provide friendly error messages              │
│   ├── Implement timeout and retry                  │
│   └── Provide fallback solutions                   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Scenario | Recommended Settings |
|----------|---------------------|
| One-time location | enableHighAccuracy: false, timeout: 10000 |
| Navigation tracking | enableHighAccuracy: true, maximumAge: 0 |
| Workout recording | enableHighAccuracy: true, maximumAge: 1000 |
| City-level location | enableHighAccuracy: false, maximumAge: 60000 |

---

*Use the Geolocation API wisely to provide location-based intelligent services.*
