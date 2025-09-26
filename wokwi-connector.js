// wokwi-connector.js - Connection to Wokwi simulator
class WokwiConnector {
    constructor() {
        this.sensors = new Map();
        this.connected = false;
        this.port = null;
        this.reader = null;
        this.writer = null;
    }

    async connect() {
        try {
            // Request serial port connection
            this.port = await navigator.serial.requestPort();
            await this.port.open({ baudRate: 9600 });

            this.reader = this.port.readable.getReader();
            this.writer = this.port.writable.getWriter();
            
            this.connected = true;
            console.log('Connected to Wokwi simulator');
            this.listenForData();
            
            return true;
        } catch (error) {
            console.error('Error connecting to Wokwi:', error);
            this.simulateData(); // Fallback to simulated data
            return false;
        }
    }

    async listenForData() {
        try {
            while (this.connected) {
                const { value, done } = await this.reader.read();
                if (done) break;
                
                const text = new TextDecoder().decode(value);
                this.processSensorData(text);
            }
        } catch (error) {
            console.error('Error reading from Wokwi:', error);
        }
    }

    processSensorData(data) {
        try {
            const sensorPackets = data.split('\n').filter(packet => packet.trim());
            
            sensorPackets.forEach(packet => {
                const parsed = JSON.parse(packet);
                
                if (parsed.type && parsed.value !== undefined) {
                    this.sensors.set(parsed.id, {
                        id: parsed.id,
                        type: parsed.type,
                        location: parsed.location || this.generateLocation(parsed.id),
                        value: parsed.value,
                        timestamp: Date.now(),
                        status: 'active'
                    });
                }
            });

            // Notify application of new data
            if (typeof window.onWokwiData === 'function') {
                window.onWokwiData(Array.from(this.sensors.values()));
            }
        } catch (error) {
            console.error('Error processing sensor data:', error);
        }
    }

    generateLocation(sensorId) {
        // Generate consistent location based on sensor ID
        const baseLat = 40.7128;
        const baseLng = -74.0060;
        const hash = this.hashString(sensorId);
        
        return {
            lat: baseLat + (hash % 100) * 0.001,
            lng: baseLng + ((hash >> 8) % 100) * 0.001
        };
    }

    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash);
    }

    simulateData() {
        // Fallback simulation when Wokwi is not available
        console.log('Using simulated sensor data');
        
        setInterval(() => {
            const simulatedSensors = this.generateSimulatedData();
            
            if (typeof window.onWokwiData === 'function') {
                window.onWokwiData(simulatedSensors);
            }
        }, 2000);
    }

    generateSimulatedData() {
        const sensorTypes = ['camera', 'microphone', 'motion', 'environment'];
        const locations = [
            { lat: 40.7128, lng: -74.0060, name: "Times Square" },
            { lat: 40.7589, lng: -73.9851, name: "Central Park" },
            { lat: 40.7505, lng: -73.9934, name: "Penn Station" },
            { lat: 40.6892, lng: -74.0445, name: "Statue of Liberty" }
        ];

        return locations.flatMap(location => 
            sensorTypes.map((type, index) => ({
                id: `sensor-${location.name}-${type}-${index}`,
                type: type,
                location: location,
                value: Math.random() * 10,
                timestamp: Date.now(),
                status: Math.random() > 0.1 ? 'active' : 'inactive'
            }))
        );
    }

    async sendCommand(command) {
        if (this.writer && this.connected) {
            const data = new TextEncoder().encode(command + '\n');
            await this.writer.write(data);
        }
    }

    async disconnect() {
        this.connected = false;
        
        if (this.reader) {
            await this.reader.cancel();
            this.reader.releaseLock();
        }
        
        if (this.writer) {
            this.writer.releaseLock();
        }
        
        if (this.port) {
            await this.port.close();
        }
    }
}