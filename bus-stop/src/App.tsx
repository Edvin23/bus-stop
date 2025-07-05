import { useEffect, useState } from 'react';
import BusMap from "./components/BusMap";
import { type BusPosition, fetchBusPositionsWithFallback } from './services/gtfsRtService';
import './App.css';

function App() {
  const [busPositions, setBusPositions] = useState<BusPosition[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    async function loadBuses() {
      try {
        setLoading(true);
        const data = await fetchBusPositionsWithFallback('lametro');
        setBusPositions(data);
        setLastUpdate(new Date());
        setError(null);
      } catch (e: unknown) {
        if (e instanceof Error) {
          setError(e.message);
        } else {
          setError('An unknown error occurred');
        }
      } finally {
        setLoading(false);
      }
    }
    
    loadBuses();
    const interval = setInterval(loadBuses, 10000); // refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <h1 className="app-title">🚌 LA Metro Real-time Bus Tracker</h1>
        <p className="app-subtitle">Live tracking of LA Metro buses across Los Angeles</p>
      </header>

      {/* Map Container */}
      <div className="map-container">
        <BusMap busPositions={busPositions} />
        
        {/* Status overlay */}
        <div className="status-overlay">
          <div className="status-title">📊 Live Status</div>
          <div className="status-item">
            <span className="status-label">Active Buses:</span>
            <span className="status-value">{busPositions.length}</span>
          </div>
          {lastUpdate && (
            <div className="status-item">
              <span className="status-label">Last Update:</span>
              <span className="status-value">{lastUpdate.toLocaleTimeString()}</span>
            </div>
          )}
          {loading && (
            <div className="status-item">
              <span className="status-label">Status:</span>
              <span className="status-value">
                <span className="loading">🔄</span> Loading...
              </span>
            </div>
          )}
        </div>

        {/* Error display */}
        {error && (
          <div className="error-display">
            <div className="error-title">⚠️ Error</div>
            <div>{error}</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
