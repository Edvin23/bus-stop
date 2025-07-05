# Swiftly API Integration Setup

This guide will help you set up the Swiftly API integration for real-time bus tracking.

## Prerequisites

1. **Swiftly API Key**: You'll need to request access to the Swiftly API by submitting an application via [this form](http://goswift.ly/realtime-api-key).

2. **Google Maps API Key**: For displaying the map interface.

## Environment Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Google Maps API Key (required for the map display)
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Swiftly API Configuration (for real-time bus data)
SWIFTLY_API_KEY=your_swiftly_api_key_here

# GTFS-RT Configuration (fallback option)
GTFS_RT_URL=https://your-gtfs-rt-endpoint.com/vehicle-positions
GTFS_RT_API_KEY=your_gtfs_rt_api_key_here

# Server Configuration
PORT=5555
```

## Swiftly API Endpoints Available

The application now supports the following Swiftly API endpoints:

### 1. Real-time Vehicle Positions

- **Endpoint**: `/api/swiftly/vehicles`
- **Parameters**: `agencyKey` (default: 'sfmta')
- **Description**: Fetches real-time information about all vehicles and their locations

### 2. Real-time Predictions

- **Endpoint**: `/api/swiftly/predictions`
- **Parameters**:
  - `agencyKey` (default: 'sfmta')
  - `stop` (required) - Stop ID or stop code
  - `route` (optional) - Route short name
  - `number` (default: 3) - Number of predictions to return
- **Description**: Fetches real-time arrival predictions for a specific stop

### 3. Predictions Near Location

- **Endpoint**: `/api/swiftly/predictions-near-location`
- **Parameters**:
  - `agencyKey` (default: 'sfmta')
  - `lat` (required) - Latitude
  - `lon` (required) - Longitude
  - `meters` (default: 1500) - Search radius in meters
  - `number` (default: 3) - Number of predictions per stop
- **Description**: Fetches real-time predictions for stops near a specific location

## Features Added

### Enhanced Bus Information

- **Route Information**: Display route names and numbers
- **Destination**: Show bus destination/headsign
- **Speed**: Real-time speed in mph
- **Heading**: Bus direction/orientation
- **Vehicle Type**: Type of vehicle (bus, train, etc.)

### Interactive Map

- **Custom Bus Icons**: Rotating bus markers that show direction
- **Info Windows**: Click on buses to see detailed information
- **Real-time Updates**: Automatic refresh every 10 seconds
- **Fallback Support**: Falls back to GTFS-RT if Swiftly API fails

### Status Display

- **Live Bus Count**: Shows number of active buses
- **Last Update Time**: Displays when data was last refreshed
- **Loading Indicators**: Shows when data is being fetched
- **Error Handling**: Displays API errors clearly

## Getting Started

1. **Install Dependencies**:

   ```bash
   npm install
   ```

2. **Set up Environment Variables**:

   - Copy the environment variables above to a `.env` file
   - Replace placeholder values with your actual API keys

3. **Start the Server**:

   ```bash
   cd server
   npm install
   npm start
   ```

4. **Start the Frontend**:

   ```bash
   npm run dev
   ```

5. **Access the Application**:
   - Open `http://localhost:5173` in your browser
   - The map will show real-time SFMTA bus positions

## API Key Setup

### Swiftly API Key

1. Visit [goswift.ly/realtime-api-key](http://goswift.ly/realtime-api-key)
2. Fill out the application form
3. Wait for approval and API key
4. Add the key to your `.env` file

### Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Maps JavaScript API
4. Create credentials (API key)
5. Add the key to your `.env` file

## Troubleshooting

### Common Issues

1. **"Swiftly API key not configured"**

   - Make sure `SWIFTLY_API_KEY` is set in your `.env` file
   - Restart the server after adding the key

2. **"Failed to fetch Swiftly real-time bus data"**

   - Check if your API key is valid
   - Verify you have access to the SFMTA agency data
   - Check the server logs for detailed error messages

3. **No buses showing on map**

   - The application will fall back to GTFS-RT if Swiftly fails
   - Check if both API keys are configured
   - Verify the server is running on port 5555

4. **Map not loading**
   - Ensure `VITE_GOOGLE_MAPS_API_KEY` is set correctly
   - Check if the Google Maps API is enabled in your Google Cloud project

## Agency Configuration

The application is currently configured for SFMTA (San Francisco MTA). To use a different agency:

1. Update the `agencyKey` parameter in the API calls
2. Adjust the map center coordinates in `BusMap.tsx`
3. Update the agency name in the UI

## Data Refresh

- **Vehicle Positions**: Updates every 10 seconds
- **Predictions**: Fetched on-demand when needed
- **Fallback**: Automatically switches between Swiftly and GTFS-RT APIs

## Support

For issues with the Swiftly API:

- Check the [Swiftly API documentation](https://api.goswift.ly)
- Contact Swiftly support for API access issues

For application issues:

- Check the browser console for JavaScript errors
- Check the server logs for backend errors
- Verify all environment variables are set correctly
