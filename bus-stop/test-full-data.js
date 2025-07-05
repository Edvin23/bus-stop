import protobuf from 'protobufjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testFullData() {
  try {
    console.log('Fetching full GTFS-RT data from server...');
    
    // Fetch the actual data from our server
    const response = await fetch('http://localhost:5555/api/swiftly/vehicles?agencyKey=lametro');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const buffer = await response.arrayBuffer();
    console.log('✅ Received data, size:', buffer.byteLength, 'bytes');
    
    // Load the proto file
    const protoPath = path.join(__dirname, 'public', 'gtfs-realtime.proto');
    console.log('Loading proto file from:', protoPath);
    
    const root = await protobuf.load(protoPath);
    console.log('✅ Proto file loaded successfully');
    
    // Get the FeedMessage type
    const FeedMessage = root.lookupType('transit_realtime.FeedMessage');
    console.log('✅ FeedMessage type found');
    
    console.log('Attempting to decode...');
    const message = FeedMessage.decode(new Uint8Array(buffer));
    console.log('✅ Protobuf decoding successful');
    
    const object = FeedMessage.toObject(message, { enums: String, longs: String, defaults: true });
    console.log('✅ Object conversion successful');
    
    console.log('Header:', object.header);
    console.log('Number of entities:', object.entity ? object.entity.length : 0);
    
    if (object.entity && object.entity.length > 0) {
      console.log('First entity:', JSON.stringify(object.entity[0], null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Error details:', error);
  }
}

testFullData(); 