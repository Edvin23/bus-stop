// server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import protobuf from 'protobufjs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env from parent directory (where the .env file is located)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = 5555;

// ✅ CORS: allow Vite frontend (http://localhost:5173, :5174, :5175)
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175'
  ],
}));

// ✅ Middleware to parse JSON
app.use(express.json());

// GTFS-RT endpoint and API key from .env
const GTFS_RT_URL = process.env.GTFS_RT_URL;
const GTFS_RT_API_KEY = process.env.GTFS_RT_API_KEY;

// Swiftly API configuration
const SWIFTLY_API_KEY = process.env.SWIFTLY_API_KEY;
const SWIFTLY_BASE_URL = 'https://api.goswift.ly';

// Helper to get absolute path to proto file
const PROTO_PATH = path.join(__dirname, '../public/gtfs-realtime.proto');

// Swiftly vehicles endpoint (using GTFS-RT since that's what we have access to)
app.get('/api/swiftly/vehicles', async (req, res) => {
  try {
    const { agencyKey = 'lametro' } = req.query;
    
    if (!SWIFTLY_API_KEY) {
      return res.status(500).json({ 
        error: 'Swiftly API key not configured. Please set SWIFTLY_API_KEY in your .env file.' 
      });
    }

    // Use GTFS-RT vehicle positions endpoint since we have access to that
    const response = await axios.get(`${SWIFTLY_BASE_URL}/real-time/${agencyKey}/gtfs-rt-vehicle-positions`, {
      responseType: 'arraybuffer',
      headers: {
        'Authorization': SWIFTLY_API_KEY,
        'Accept': 'application/x-protobuf'
      }
    });

    // Return the binary data directly
    res.set('Content-Type', 'application/x-protobuf');
    res.send(response.data);
  } catch (err) {
    console.error('Swiftly API fetch error:', err.message);
    if (err.response) {
      console.error('Response status:', err.response.status);
      console.error('Response data:', err.response.data);
    }
    res.status(500).json({ 
      error: 'Failed to fetch Swiftly real-time bus data',
      details: err.message 
    });
  }
});

// Swiftly predictions endpoint
app.get('/api/swiftly/predictions', async (req, res) => {
  try {
    const { agencyKey = 'sfmta', stop, route, number = 3 } = req.query;
    
    if (!SWIFTLY_API_KEY) {
      return res.status(500).json({ 
        error: 'Swiftly API key not configured. Please set SWIFTLY_API_KEY in your .env file.' 
      });
    }

    if (!stop) {
      return res.status(400).json({ error: 'Stop parameter is required' });
    }

    const params = new URLSearchParams({
      stop,
      number: number.toString()
    });
    
    if (route) {
      params.append('route', route);
    }

    const response = await axios.get(`${SWIFTLY_BASE_URL}/real-time/${agencyKey}/predictions?${params}`, {
      headers: {
        'Authorization': SWIFTLY_API_KEY,
        'Accept': 'application/json'
      }
    });

    res.json(response.data);
  } catch (err) {
    console.error('Swiftly predictions fetch error:', err.message);
    if (err.response) {
      console.error('Response status:', err.response.status);
      console.error('Response data:', err.response.data);
    }
    res.status(500).json({ 
      error: 'Failed to fetch Swiftly predictions',
      details: err.message 
    });
  }
});

// Swiftly predictions near location endpoint
app.get('/api/swiftly/predictions-near-location', async (req, res) => {
  try {
    const { agencyKey = 'sfmta', lat, lon, meters = 1500, number = 3 } = req.query;
    
    if (!SWIFTLY_API_KEY) {
      return res.status(500).json({ 
        error: 'Swiftly API key not configured. Please set SWIFTLY_API_KEY in your .env file.' 
      });
    }

    if (!lat || !lon) {
      return res.status(400).json({ error: 'Latitude and longitude parameters are required' });
    }

    const params = new URLSearchParams({
      lat: lat.toString(),
      lon: lon.toString(),
      meters: meters.toString(),
      number: number.toString()
    });

    const response = await axios.get(`${SWIFTLY_BASE_URL}/real-time/${agencyKey}/predictions-near-location?${params}`, {
      headers: {
        'Authorization': SWIFTLY_API_KEY,
        'Accept': 'application/json'
      }
    });

    res.json(response.data);
  } catch (err) {
    console.error('Swiftly predictions near location fetch error:', err.message);
    if (err.response) {
      console.error('Response status:', err.response.status);
      console.error('Response data:', err.response.data);
    }
    res.status(500).json({ 
      error: 'Failed to fetch Swiftly predictions near location',
      details: err.message 
    });
  }
});

app.get('/api/vehicle-positions', async (req, res) => {
  try {
    const response = await axios.get(GTFS_RT_URL, {
      responseType: 'arraybuffer',
      headers: GTFS_RT_API_KEY ? { Authorization: `Bearer ${GTFS_RT_API_KEY}` } : {},
    });

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
          });
        }
      });
    }

    res.json(buses);
  } catch (err) {
    console.error('GTFS-RT fetch error:', err.message);
    res.status(500).json({ error: 'Failed to fetch real-time bus data' });
  }
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📡 Swiftly API endpoints available:`);
  console.log(`   - GET /api/swiftly/vehicles?agencyKey=sfmta`);
  console.log(`   - GET /api/swiftly/predictions?agencyKey=sfmta&stop=12345`);
  console.log(`   - GET /api/swiftly/predictions-near-location?agencyKey=sfmta&lat=37.7749&lon=-122.4194`);
});
