import axios from 'axios';
import protobuf from 'protobufjs';
import path from 'path';
import { fileURLToPath } from 'url';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    console.log('GTFS-RT request:', { hasUrl: !!process.env.GTFS_RT_URL, hasApiKey: !!process.env.GTFS_RT_API_KEY });
    
    if (!process.env.GTFS_RT_URL) {
      return res.status(500).json({ 
        error: 'GTFS-RT URL not configured. Please set GTFS_RT_URL in your .env file.' 
      });
    }

    const response = await axios.get(process.env.GTFS_RT_URL, {
      responseType: 'arraybuffer',
      headers: process.env.GTFS_RT_API_KEY ? { Authorization: `Bearer ${process.env.GTFS_RT_API_KEY}` } : {},
    });

    console.log('GTFS-RT response status:', response.status, 'data size:', response.data.length);

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const PROTO_PATH = path.join(__dirname, '../public/gtfs-realtime.proto');

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
} 