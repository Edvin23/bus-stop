// Vercel serverless function to handle all API routes
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import protobuf from 'protobufjs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const app = express();

// CORS configuration for Vercel
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'https://bus-stop-three.vercel.app'
  ],
}));

// Middleware to parse JSON
app.use(express.json());

// Test endpoint to verify server is working
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Server is working!',
    timestamp: new Date().toISOString(),
    env: {
      hasSwiftlyKey: !!process.env.SWIFTLY_API_KEY,
      hasGtfsUrl: !!process.env.GTFS_RT_URL,
      port: process.env.PORT || 'serverless'
    }
  });
});

// GTFS-RT endpoint and API key from .env
const GTFS_RT_URL = process.env.GTFS_RT_URL;
const GTFS_RT_API_KEY = process.env.GTFS_RT_API_KEY;

// Swiftly API configuration
const SWIFTLY_API_KEY = process.env.SWIFTLY_API_KEY;
const SWIFTLY_BASE_URL = 'https://api.goswift.ly';

// Helper to get absolute path to proto file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROTO_PATH = path.join(__dirname, '../bus-stop/public/gtfs-realtime.proto');

// Swiftly vehicles endpoint
app.get('/api/swiftly/vehicles', async (req, res) => {
  try {
    const { agencyKey = 'lametro' } = req.query;
    
    console.log('Swiftly vehicles request:', { agencyKey, hasApiKey: !!SWIFTLY_API_KEY });
    
    if (!SWIFTLY_API_KEY) {
      console.error('Swiftly API key missing');
      return res.status(500).json({ 
        error: 'Swiftly API key not configured. Please set SWIFTLY_API_KEY in your .env file.' 
      });
    }

    const url = `${SWIFTLY_BASE_URL}/real-time/${agencyKey}/gtfs-rt-vehicle-positions`;
    console.log('Making request to:', url);

    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      headers: {
        'Authorization': SWIFTLY_API_KEY,
        'Accept': 'application/x-protobuf'
      }
    });

    console.log('Swiftly response status:', response.status, 'data size:', response.data.length);

    // Return the binary data directly
    res.set('Content-Type', 'application/x-protobuf');
    res.send(response.data);
  } catch (err) {
    console.error('Swiftly API fetch error:', err.message);
    if (err.response) {
      console.error('Response status:', err.response.status);
      console.error('Response headers:', err.response.headers);
      console.error('Response data:', err.response.data);
    }
    res.status(500).json({ 
      error: 'Failed to fetch Swiftly real-time bus data',
      details: err.message,
      url: `${SWIFTLY_BASE_URL}/real-time/${req.query.agencyKey || 'lametro'}/gtfs-rt-vehicle-positions`
    });
  }
});

// GTFS-RT vehicle positions endpoint
app.get('/api/vehicle-positions', async (req, res) => {
  try {
    console.log('GTFS-RT request:', { hasUrl: !!GTFS_RT_URL, hasApiKey: !!GTFS_RT_API_KEY });
    
    if (!GTFS_RT_URL) {
      return res.status(500).json({ 
        error: 'GTFS-RT URL not configured. Please set GTFS_RT_URL in your .env file.' 
      });
    }

    const response = await axios.get(GTFS_RT_URL, {
      responseType: 'arraybuffer',
      headers: GTFS_RT_API_KEY ? { Authorization: `Bearer ${GTFS_RT_API_KEY}` } : {},
    });

    console.log('GTFS-RT response status:', response.status, 'data size:', response.data.length);

    const root = await protobuf.load(PROTO_PATH);
    const FeedMessage = root.lookupType('transit_realtime.FeedMessage');
    const message = FeedMessage.decode(new Uint8Array(response.data));
    const object = FeedMessage.toObject(message, { enums: String, longs: String, defaults: true });

    const buses = [];
    if (object.entity && Array.isArray(object.entity)) {
      object.entity.forEach(entity => {
        const vehicle = entity.vehicle;
        if (vehicle && vehicle.position) {
          buses.push({
            id: vehicle.vehicle?.id || entity.id || 'unknown',
            lat: vehicle.position.latitude,
            lng: vehicle.position.longitude,
            timestamp: Number(vehicle.timestamp) || Date.now(),
          });
        }
      });
    }

    console.log('GTFS-RT parsed buses:', buses.length);
    res.json(buses);
  } catch (err) {
    console.error('GTFS-RT fetch error:', err.message);
    res.status(500).json({ error: 'Failed to fetch real-time bus data' });
  }
});

// Export the Express app for Vercel
export default app; 