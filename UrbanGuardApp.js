class UrbanGuardApp {
    static init() {
        this.sensorFusion = new SensorFusionEngine();
        this.wokwiConnector = new WokwiConnector();
        this.heatmapRenderer = null;
        this.isInitialized = false;
        
        this.initializeMap();
        this.setupEventListeners();
        this.connectToWokwi();
        
        this.isInitialized = true;
        console.log('UrbanGuard AI Safety Monitor initialized');
    }

    static initializeMap() {
        const map = L.map('map').setView([40.7128, -74.0060], 13);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        this.heatmapRenderer = new HeatmapRenderer(map);
    }

    static setupEventListeners() {
        document.getElementById('heatmap-toggle').addEventListener('change', (e) => {
            if (this.heatmapRenderer.heatmapLayer) {
                this.heatmapRenderer.toggleLayer(this.heatmapRenderer.heatmapLayer, e.target.checked);
            }
        });
        document.getElementById('sensors-toggle').addEventListener('change', (e) => {
            this.heatmapRenderer.toggleLayer(this.heatmapRenderer.sensorLayer, e.target.checked);
        });
        document.getElementById('refresh-toggle').addEventListener('change', (e) => {
        });

        document.querySelectorAll('.time-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.applyTimeFilter(e.target.dataset.time);
            });
        });

        window.onWokwiData = (sensorData) => {
            this.processSensorData(sensorData);
        };
    }

    static async connectToWokwi() {
        const connected = await this.wokwiConnector.connect();
        document.getElementById('connection-status').textContent = 
            connected ? 'Connected to Wokwi' : 'Using Simulated Data';
    }

    static processSensorData(sensorData) {

        sensorData.forEach(sensor => {
            this.sensorFusion.addSensorData(
                sensor.id,
                sensor.type,
                sensor.location,
                sensor.value,
                sensor.timestamp
            );
        });

        const events = this.sensorFusion.correlateEvents();
        
        this.heatmapRenderer.updateHeatmap(events);
        this.heatmapRenderer.updateSensors(sensorData);
        this.heatmapRenderer.updateEvents(events);
        
        this.updateStatistics(sensorData, events);
        this.updateEventList(events);
    }

    static updateStatistics(sensors, events) {
        const activeSensors = sensors.filter(s => s.status === 'active').length;
        const avgSeverity = events.length > 0 ? 
            events.reduce((sum, e) => sum + e.severity, 0) / events.length : 0;
        
        document.getElementById('active-sensors').textContent = activeSensors;
        document.getElementById('events-today').textContent = events.length;
        document.getElementById('safety-index').textContent = 
            `${Math.max(0, 100 - (avgSeverity * 10)).toFixed(0)}%`;
    }

    static updateEventList(events) {
        const eventList = document.getElementById('event-list');
        eventList.innerHTML = '';

        events.forEach(event => {
            const li = document.createElement('li');
            li.className = 'event-item';
            li.innerHTML = `
                <div class="event-type">${event.type}</div>
                <div class="event-location">Risk: ${(event.riskLevel * 100).toFixed(1)}%</div>
                <div class="event-time">${new Date(event.timestamp).toLocaleTimeString()}</div>
            `;
            eventList.appendChild(li);
        });
    }

    static applyTimeFilter(timeRange) {
        const now = Date.now();
        let timeThreshold = now - (60 * 60 * 1000); 
        
        switch(timeRange) {
            case '6h': timeThreshold = now - (6 * 60 * 60 * 1000); break;
            case '24h': timeThreshold = now - (24 * 60 * 60 * 1000); break;
        }
    }

}
