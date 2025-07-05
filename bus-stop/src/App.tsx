import { useEffect, useState } from 'react';
import BusMap from "./components/BusMap";
import { type BusPosition, fetchBusPositionsWithFallback } from './services/gtfsRtService';

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
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <BusMap busPositions={busPositions} />
      
      {/* Status overlay */}
      <div style={{ 
        position: 'absolute', 
        top: 10, 
        left: 10, 
        background: 'rgba(0, 0, 0, 0.8)', 
        color: 'white', 
        padding: '10px', 
        borderRadius: '5px',
        fontSize: '14px',
        zIndex: 1000
      }}>
        <div style={{ marginBottom: '5px' }}>
          <strong>LA Real-time Bus Tracker</strong>
        </div>
        <div>Buses: {busPositions.length}</div>
        {lastUpdate && (
          <div>Last update: {lastUpdate.toLocaleTimeString()}</div>
        )}
        {loading && <div>🔄 Loading...</div>}
      </div>

      {/* Error display */}
      {error && (
        <div style={{ 
          position: 'absolute', 
          top: 10, 
          right: 10, 
          background: 'rgba(255, 0, 0, 0.9)', 
          color: 'white', 
          padding: '10px', 
          borderRadius: '5px',
          maxWidth: '300px',
          fontSize: '14px',
          zIndex: 1000
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}
    </div>
  );
}

export default App;
