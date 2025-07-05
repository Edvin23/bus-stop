import { useEffect, useState } from 'react';
import BusMap from "./components/BusMap";
import { type BusPosition } from './services/gtfsRtService';

function App() {
  const [busPositions, setBusPositions] = useState<BusPosition[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadBuses() {
      try {
        const res = await fetch('http://localhost:5555/api/vehicle-positions');
        const data = await res.json();
        setBusPositions(data);
        setError(null);
      } catch (e: unknown) {
        if (e instanceof Error) {
          setError(e.message);
        } else {
          setError('An unknown error occurred');
        }
      }
    }
    loadBuses();
    const interval = setInterval(loadBuses, 10000); // refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <BusMap busPositions={busPositions} />
      {error && <div style={{ color: 'red', position: 'absolute', top: 10, left: 10 }}>{error}</div>}
    </div>
  );
}

export default App;
