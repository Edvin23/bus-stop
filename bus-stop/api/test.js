export default function handler(req, res) {
  res.status(200).json({ 
    message: 'Test API is working!',
    timestamp: new Date().toISOString(),
    env: {
      hasSwiftlyKey: !!process.env.SWIFTLY_API_KEY,
      hasGtfsUrl: !!process.env.GTFS_RT_URL,
      method: req.method,
      url: req.url
    }
  });
} 