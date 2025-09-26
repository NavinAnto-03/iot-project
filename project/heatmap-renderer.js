// heatmap-renderer.js - Heatmap visualization engine
class HeatmapRenderer {
    constructor(map) {
        this.map = map;
        this.heatmapLayer = null;
        this.sensorLayer = L.layerGroup().addTo(map);
        this.eventLayer = L.layerGroup().addTo(map);
        this.gradient = {
            0.0: '#00b894',
            0.3: '#fdcb6e', 
            0.6: '#e17055',
            1.0: '#d63031'
        };
    }

    updateHeatmap(events) {
        if (this.heatmapLayer) {
            this.map.removeLayer(this.heatmapLayer);
        }

        const heatmapData = events.map(event => ({
            lat: event.location.lat,
            lng: event.location.lng,
            intensity: event.riskLevel || (event.severity / 10)
        }));

        const cfg = {
            radius: 45,
            maxOpacity: 0.8,
            scaleRadius: true,
            useLocalExtrema: false,
            latField: 'lat',
            lngField: 'lng',
            valueField: 'intensity',
            gradient: this.gradient
        };

        this.heatmapLayer = new HeatmapOverlay(cfg);
        this.heatmapLayer.setData(heatmapData);
        this.map.addLayer(this.heatmapLayer);
    }

    updateSensors(sensors) {
        this.sensorLayer.clearLayers();
        
        sensors.forEach(sensor => {
            const marker = L.circleMarker([sensor.location.lat, sensor.location.lng], {
                radius: 8,
                fillColor: this.getSensorColor(sensor.type),
                color: '#fff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.8
            });

            marker.bindPopup(this.createSensorPopup(sensor));
            this.sensorLayer.addLayer(marker);
        });
    }

    updateEvents(events) {
        this.eventLayer.clearLayers();
        
        events.forEach(event => {
            const marker = L.circleMarker([event.location.lat, event.location.lng], {
                radius: 12,
                fillColor: this.getEventColor(event.riskLevel || (event.severity / 10)),
                color: '#fff',
                weight: 3,
                opacity: 1,
                fillOpacity: 0.9
            });

            marker.bindPopup(this.createEventPopup(event));
            this.eventLayer.addLayer(marker);
        });
    }

    getSensorColor(type) {
        const colors = {
            'camera': '#ff6b6b',
            'microphone': '#4ecdc4',
            'motion': '#ffe66d',
            'environment': '#6a0572'
        };
        return colors[type] || '#999';
    }

    getEventColor(riskLevel) {
        if (riskLevel <= 0.3) return '#00b894';
        if (riskLevel <= 0.5) return '#fdcb6e';
        if (riskLevel <= 0.7) return '#e17055';
        return '#d63031';
    }

    createSensorPopup(sensor) {
        return `
            <div class="sensor-popup">
                <h3>${sensor.type.toUpperCase()} Sensor</h3>
                <p><strong>ID:</strong> ${sensor.id}</p>
                <p><strong>Status:</strong> <span style="color: ${sensor.status === 'active' ? '#00b894' : '#ff6b6b'}">${sensor.status}</span></p>
                <p><strong>Value:</strong> ${sensor.value.toFixed(2)}</p>
                <p><strong>Confidence:</strong> ${(sensor.confidence * 100).toFixed(1)}%</p>
                <p><strong>Last Update:</strong> ${new Date(sensor.timestamp).toLocaleTimeString()}</p>
            </div>
        `;
    }

    createEventPopup(event) {
        return `
            <div class="event-popup">
                <h3>${event.type}</h3>
                <p><strong>Risk Level:</strong> <span style="color: ${this.getEventColor(event.riskLevel)}">${(event.riskLevel * 100).toFixed(1)}%</span></p>
                <p><strong>Severity:</strong> ${event.severity.toFixed(1)}/10</p>
                <p><strong>Time:</strong> ${new Date(event.timestamp).toLocaleString()}</p>
                <p><strong>Sensors Involved:</strong> ${event.sensors.length}</p>
                <p><strong>Confidence:</strong> ${(event.confidence * 100).toFixed(1)}%</p>
            </div>
        `;
    }

    toggleLayer(layer, visible) {
        if (visible) {
            this.map.addLayer(layer);
        } else {
            this.map.removeLayer(layer);
        }
    }
}