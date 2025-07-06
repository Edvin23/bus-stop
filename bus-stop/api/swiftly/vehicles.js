import axios from 'axios';

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
    const { agencyKey = 'lametro' } = req.query;
    
    console.log('Swiftly vehicles request:', { agencyKey, hasApiKey: !!process.env.SWIFTLY_API_KEY });
    
    if (!process.env.SWIFTLY_API_KEY) {
      console.error('Swiftly API key missing');
      return res.status(500).json({ 
        error: 'Swiftly API key not configured. Please set SWIFTLY_API_KEY in your .env file.' 
      });
    }

    const url = `https://api.goswift.ly/real-time/${agencyKey}/gtfs-rt-vehicle-positions`;
    console.log('Making request to:', url);

    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      headers: {
        'Authorization': process.env.SWIFTLY_API_KEY,
        'Accept': 'application/x-protobuf'
      }
    });

    console.log('Swiftly response status:', response.status, 'data size:', response.data.length);

    // Return the binary data directly
    res.setHeader('Content-Type', 'application/x-protobuf');
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
      url: `https://api.goswift.ly/real-time/${req.query.agencyKey || 'lametro'}/gtfs-rt-vehicle-positions`
    });
  }
} 