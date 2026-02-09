// ============================================================================
// COSMIC WATCH - BACKEND SERVER
// ============================================================================

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// NASA API Configuration
const NASA_API_KEY = process.env.NASA_API_KEY || 'smJ35jKybPdC9UI2o8HfPs1Ad5fv87z7tNhLzUGe';
const NASA_BASE_URL = 'https://api.nasa.gov/neo/rest/v1';

// Serve frontend files from correct path
app.use(express.static(path.join(__dirname, '../frontend')));

// Serve frontend HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Asteroid data endpoint - FIXED
app.get('/api/asteroids', async (req, res) => {
    console.log('🌍 Asteroid data request received');
    
    try {
        // Get today's date and yesterday's date for better data
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const start_date = yesterday.toISOString().split('T')[0];
        const end_date = today.toISOString().split('T')[0];
        
        console.log(`Fetching data for ${start_date} to ${end_date}`);
        
        const url = `${NASA_BASE_URL}/feed?start_date=${start_date}&end_date=${end_date}&api_key=${NASA_API_KEY}`;
        console.log(`NASA API URL: ${url}`);
        
        const response = await axios.get(url, {
            timeout: 10000, // 10 second timeout
            headers: {
                'User-Agent': 'CosmicWatch/1.0'
            }
        });
        
        console.log('NASA API Response Status:', response.status);
        
        if (!response.data || !response.data.near_earth_objects) {
            console.log('Invalid response structure:', response.data);
            throw new Error('Invalid NASA API response structure');
        }
        
        const asteroids = [];
        const nearEarthObjects = response.data.near_earth_objects;
        
        console.log('Days with data:', Object.keys(nearEarthObjects));
        
        // Process asteroid data
        Object.values(nearEarthObjects).forEach(dayAsteroids => {
            dayAsteroids.forEach(asteroid => {
                try {
                    const closeApproach = asteroid.close_approach_data?.[0];
                    
                    // Calculate average diameter
                    const diameterMin = asteroid.estimated_diameter?.kilometers?.estimated_diameter_min || 0.1;
                    const diameterMax = asteroid.estimated_diameter?.kilometers?.estimated_diameter_max || 0.3;
                    const diameter = (diameterMin + diameterMax) / 2;
                    
                    // Get velocity and distance
                    const velocity = closeApproach?.relative_velocity?.kilometers_per_hour || 30000;
                    const missDistance = closeApproach?.miss_distance?.kilometers || 5000000;
                    
                    asteroids.push({
                        id: asteroid.id || `ast-${Date.now()}-${Math.random()}`,
                        name: asteroid.name || `Asteroid ${asteroid.id || 'Unknown'}`,
                        diameter: diameter,
                        velocity: parseFloat(velocity),
                        missDistance: parseFloat(missDistance),
                        hazardous: asteroid.is_potentially_hazardous_asteroid || false,
                        closeApproachDate: closeApproach?.close_approach_date_full || end_date
                    });
                } catch (err) {
                    console.log('Error processing asteroid:', err.message);
                }
            });
        });
        
        // Sort by miss distance (closest first)
        asteroids.sort((a, b) => a.missDistance - b.missDistance);
        
        // Limit response to 15 asteroids
        const limitedAsteroids = asteroids.slice(0, 15);
        
        console.log(`✅ Processed ${asteroids.length} asteroids, sending ${limitedAsteroids.length}`);
        console.log('Sample asteroid:', limitedAsteroids[0]);
        
        res.json(limitedAsteroids);
        
    } catch (error) {
        console.error('❌ NASA API Error:', error.message);
        console.error('Error details:', error.response?.data || error.stack);
        
        // Fallback to demo data
        console.log('⚠️ Using demo data as fallback');
        const demoData = getDemoData();
        res.json(demoData);
    }
});

// Demo data endpoint - FIXED
app.get('/api/asteroids/demo', (req, res) => {
    console.log('📊 Demo data request received');
    try {
        const demoData = getDemoData();
        res.json(demoData);
    } catch (error) {
        console.error('Demo data error:', error);
        res.status(500).json({ error: 'Failed to load demo data' });
    }
});

// Health check endpoint - FIXED
app.get('/api/health', (req, res) => {
    try {
        res.json({ 
            status: 'healthy', 
            service: 'Cosmic Watch API',
            timestamp: new Date().toISOString(),
            endpoints: {
                asteroids: ' http://localhost:5000/api/asteroids',
                demo: '/api/asteroids/demo',
                health: '/api/health'
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Health check failed' });
    }
});

// Test endpoint to check if API is working
app.get('/api/test', (req, res) => {
    res.json({
        message: 'Cosmic Watch API is running!',
        timestamp: new Date().toISOString(),
        endpoints: [
            '/api/asteroids',
            '/api/asteroids/demo',
            '/api/health',
            '/api/test'
        ]
    });
});

// Helper function for demo data - FIXED
function getDemoData() {
    return [
        {
            id: '20010345',
            name: 'Apophis (99942)',
            diameter: 0.34,
            velocity: 30000,
            missDistance: 31000,
            hazardous: true,
            closeApproachDate: '2029-04-13'
        },
        {
            id: '200101955',
            name: 'Bennu (101955)',
            diameter: 0.49,
            velocity: 28000,
            missDistance: 75000,
            hazardous: true,
            closeApproachDate: '2135-09-25'
        },
        {
            id: '2023DW',
            name: '2023 DW',
            diameter: 0.05,
            velocity: 25000,
            missDistance: 1800000,
            hazardous: false,
            closeApproachDate: '2046-02-14'
        },
        {
            id: '65803',
            name: 'Didymos (65803)',
            diameter: 0.78,
            velocity: 21000,
            missDistance: 10700000,
            hazardous: false,
            closeApproachDate: '2123-11-04'
        },
        {
            id: '162173',
            name: 'Ryugu (162173)',
            diameter: 0.87,
            velocity: 32000,
            missDistance: 950000,
            hazardous: false,
            closeApproachDate: '2024-12-06'
        },
        {
            id: '2010RF12',
            name: '2010 RF12',
            diameter: 0.007,
            velocity: 45000,
            missDistance: 79000,
            hazardous: false,
            closeApproachDate: '2095-09-05'
        },
        {
            id: '2012TC4',
            name: '2012 TC4',
            diameter: 0.013,
            velocity: 28000,
            missDistance: 50000,
            hazardous: false,
            closeApproachDate: '2027-10-12'
        },
        {
            id: '2014JO25',
            name: '2014 JO25',
            diameter: 0.65,
            velocity: 23000,
            missDistance: 1800000,
            hazardous: false,
            closeApproachDate: '2027-04-19'
        }
    ];
}

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        message: err.message 
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Start server - FIXED
app.listen(PORT, () => {
    console.log(`🚀 Cosmic Watch Backend running on port ${PORT}`);
    console.log(`🌐 Frontend available at: http://localhost:${PORT}`);
    console.log(`📡 API endpoints:`);
    console.log(`   GET /api/asteroids      - Live asteroid data`);
    console.log(`   GET /api/asteroids/demo - Demo asteroid data`);
    console.log(`   GET /api/health         - Health check`);
    console.log(`   GET /api/test           - Test endpoint`);
    console.log(`   GET /                   - Frontend interface`);
    
    // Test the NASA API key
    console.log(`\n🔑 NASA API Key: ${NASA_API_KEY.substring(0, 8)}...`);
    console.log(`📅 Current date: ${new Date().toISOString().split('T')[0]}`);
});