// server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import protobuf from 'protobufjs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

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

// Helper to get absolute path to proto file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROTO_PATH = path.join(__dirname, '../public/gtfs-realtime.proto');

app.get('/api/vehicle-positions', async (req, res) => {
  try {
    const response = await axios.get(GTFS_RT_URL, {
      responseType: 'arraybuffer',
      headers: GTFS_RT_API_KEY ? { 'api_key': GTFS_RT_API_KEY } : {},
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
            lng: vehicle.position.longitude
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
});
