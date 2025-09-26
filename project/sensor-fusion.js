// sensor-fusion.js - AI-powered sensor data fusion and analysis
class SensorFusionEngine {
    constructor() {
        this.sensors = new Map();
        this.events = [];
        this.riskAssessment = new RiskAssessment();
        this.lastUpdate = Date.now();
    }

    addSensorData(sensorId, type, location, value, timestamp) {
        const sensorData = {
            id: sensorId,
            type: type,
            location: location,
            value: value,
            timestamp: timestamp,
            confidence: this.calculateConfidence(type, value)
        };

        this.sensors.set(sensorId, sensorData);
        this.correlateEvents();
    }

    calculateConfidence(type, value) {
        // AI algorithm to calculate confidence based on sensor type and value
        const confidenceModels = {
            'camera': (v) => v > 7 ? 0.9 : v > 4 ? 0.7 : 0.5,
            'microphone': (v) => v > 75 ? 0.8 : v > 50 ? 0.6 : 0.4,
            'motion': (v) => v > 6 ? 0.85 : v > 3 ? 0.65 : 0.45,
            'environment': (v) => v > 8 ? 0.95 : v > 5 ? 0.75 : 0.55
        };

        return confidenceModels[type] ? confidenceModels[type](value) : 0.5;
    }

    correlateEvents() {
        // AI correlation algorithm to detect patterns across multiple sensors
        const correlatedEvents = [];
        const timeWindow = 300000; // 5 minutes
        
        this.sensors.forEach((sensor, id) => {
            if (Date.now() - sensor.timestamp < timeWindow) {
                const similarEvents = Array.from(this.sensors.values()).filter(s => 
                    s.id !== id && 
                    this.calculateDistance(s.location, sensor.location) < 0.5 && // within 500m
                    Math.abs(s.timestamp - sensor.timestamp) < 60000 // within 1 minute
                );

                if (similarEvents.length > 0) {
                    const fusedEvent = this.fuseSensorData([sensor, ...similarEvents]);
                    correlatedEvents.push(fusedEvent);
                }
            }
        });

        this.events = correlatedEvents;
        return correlatedEvents;
    }

    fuseSensorData(sensorGroup) {
        // AI data fusion algorithm
        const weights = {
            'camera': 0.4,
            'microphone': 0.25,
            'motion': 0.2,
            'environment': 0.15
        };

        let totalWeight = 0;
        let fusedValue = 0;
        let maxSeverity = 0;

        sensorGroup.forEach(sensor => {
            const weight = weights[sensor.type] * sensor.confidence;
            fusedValue += sensor.value * weight;
            totalWeight += weight;
            maxSeverity = Math.max(maxSeverity, sensor.value);
        });

        return {
            id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            severity: totalWeight > 0 ? (fusedValue / totalWeight) : 0,
            location: this.calculateCentroid(sensorGroup.map(s => s.location)),
            timestamp: Date.now(),
            sensors: sensorGroup.map(s => s.id),
            confidence: totalWeight,
            type: this.determineEventType(sensorGroup)
        };
    }

    calculateDistance(loc1, loc2) {
        // Haversine distance calculation
        const R = 6371; // Earth's radius in km
        const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
        const dLon = (loc2.lng - loc1.lng) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
        return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
    }

    calculateCentroid(locations) {
        const avgLat = locations.reduce((sum, loc) => sum + loc.lat, 0) / locations.length;
        const avgLng = locations.reduce((sum, loc) => sum + loc.lng, 0) / locations.length;
        return { lat: avgLat, lng: avgLng };
    }

    determineEventType(sensorGroup) {
        const typeCounts = {};
        sensorGroup.forEach(sensor => {
            typeCounts[sensor.type] = (typeCounts[sensor.type] || 0) + 1;
        });

        const dominantType = Object.keys(typeCounts).reduce((a, b) => 
            typeCounts[a] > typeCounts[b] ? a : b
        );

        const eventTypeMap = {
            'camera': 'Visual Anomaly Detected',
            'microphone': 'Audio Disturbance',
            'motion': 'Unusual Movement',
            'environment': 'Environmental Hazard'
        };

        return eventTypeMap[dominantType] || 'Multiple Sensor Alert';
    }
}

class RiskAssessment {
    assessRisk(event, historicalData) {
        // AI risk assessment algorithm
        const baseRisk = event.severity / 10;
        const timeFactor = this.calculateTimeFactor(event.timestamp);
        const locationFactor = this.calculateLocationFactor(event.location, historicalData);
        const correlationFactor = event.confidence;

        return Math.min(1, baseRisk * 0.5 + timeFactor * 0.2 + locationFactor * 0.2 + correlationFactor * 0.1);
    }

    calculateTimeFactor(timestamp) {
        const hour = new Date(timestamp).getHours();
        // Higher risk during night hours
        return hour >= 22 || hour <= 6 ? 0.8 : hour >= 18 ? 0.6 : 0.3;
    }

    calculateLocationFactor(location, historicalData) {
        // Analyze historical events at this location
        const locationEvents = historicalData.filter(event => 
            this.calculateDistance(event.location, location) < 0.2 // within 200m
        );

        if (locationEvents.length === 0) return 0.3;
        
        const avgSeverity = locationEvents.reduce((sum, event) => sum + event.severity, 0) / locationEvents.length;
        return Math.min(1, avgSeverity / 8);
    }

    calculateDistance(loc1, loc2) {
        const R = 6371;
        const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
        const dLon = (loc2.lng - loc1.lng) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
        return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
    }
}