// Types for KMZ response
interface KMZPoint {
  name: string;
  coordinates: [number, number, number]; // [lng, lat, elevation]
  type: string;
  properties: Record<string, any>;
}

interface KMZLine {
  name: string;
  coordinates: [number, number, number][]; // Array of [lng, lat, elevation]
  length: string | null;
  type: string;
  properties: Record<string, any>;
}

interface KMZResponse {
  points: KMZPoint[];
  lines: KMZLine[];
}

//  existing types
type GPSPoint = {
  name: string;
  coordinates: [number, number]; // [lng, lat]
  properties?: {
    icon?: string;
    remarks?: string;
    type?: string;
    [key: string]: any;
  };
};

type Connection = {
  start: string;
  end: string;
  length: number;
  name: string;
  coordinates: [number, number][]; // Array of [lng, lat]
  color?: string;
  existing?: boolean;
};

interface ConvertedKMZData {
  points: GPSPoint[];
  connections: Connection[];
}

export const convertKMZToStandardFormat = (kmzData: KMZResponse): ConvertedKMZData => {
  // Convert points - remove elevation and keep only [lng, lat]
  const convertedPoints: GPSPoint[] = kmzData.points.map((point, index) => {
    // Ensure point has a valid name
    const pointName = point.name && point.name.trim() !== '' 
      ? point.name.trim() 
      : `KMZ_Point_${index + 1}`;

    return {
      name: pointName,
      coordinates: [point.coordinates[0], point.coordinates[1]], // Remove elevation
      properties: {
        ...point.properties,
        type: point.type,
        icon: point.properties?.asset_type || point.type || 'default',
        remarks: point.properties?.remarks || '',
      },
    };
  });

  // Convert lines to connections
  const convertedConnections: Connection[] = kmzData.lines.map((line, index) => {
    // Extract start and end node names from properties with fallbacks
    const startNode = line.properties?.start_node || 
                     line.properties?.start || 
                     `Start_${index + 1}`;
    const endNode = line.properties?.end_node || 
                   line.properties?.end || 
                   `End_${index + 1}`;
    
    // Convert coordinates - remove elevation and keep only [lng, lat]
    const coordinates: [number, number][] = line.coordinates.map(coord => [
      coord[0], // longitude
      coord[1]  // latitude
    ]);

    // Parse length - handle both string and null values
    let length = 0;
    if (line.length) {
      length = parseFloat(line.length);
    } else if (line.properties?.seg_length) {
      // Convert from meters to kilometers if seg_length is provided
      length = parseFloat(line.properties.seg_length) / 1000;
    } else if (line.properties?.length) {
      length = parseFloat(line.properties.length);
    }

    // Determine if connection is existing based on status or type
    const existing = line.properties?.status === 'Accepted' || 
                    line.properties?.status === 'Existing' ||
                    line.type === 'Incremental Cable' || 
                    line.properties?.type === 'Incremental Cable' || 
                    line.properties?.asset_type === 'Incremental Cable';

    // Generate color based on type or status
    let color = '#FF0000'; // Default red
    if (line.type === 'Incremental Cable' || 
        line.properties?.type === 'Incremental Cable' || 
        line.properties?.asset_type === 'Incremental Cable') {
      color = existing ? '#00AA00' : '#FF0000'; // Green for existing, red for new
    }

    // Ensure connection has a valid name
    const connectionName = line.name && line.name.trim() !== '' 
      ? line.name.trim() 
      : `${startNode} TO ${endNode}`;

    return {
      start: startNode,
      end: endNode,
      length: length,
      name: connectionName,
      coordinates: coordinates,
      color: color,
      existing: existing,
      properties: line.properties || {}
    };
  });

  return {
    points: convertedPoints,
    connections: convertedConnections,
  };
};

// Helper function to validate converted data
export const validateConvertedData = (data: ConvertedKMZData): boolean => {
  // Check if points have valid coordinates
  const validPoints = data.points.every(point => 
    Array.isArray(point.coordinates) && 
    point.coordinates.length === 2 &&
    typeof point.coordinates[0] === 'number' &&
    typeof point.coordinates[1] === 'number'
  );

  // Check if connections have valid data
  const validConnections = data.connections.every(conn => 
    conn.start && 
    conn.end && 
    Array.isArray(conn.coordinates) &&
    conn.coordinates.length >= 2 &&
    conn.coordinates.every(coord => 
      Array.isArray(coord) && 
      coord.length === 2 &&
      typeof coord[0] === 'number' &&
      typeof coord[1] === 'number'
    )
  );

  return validPoints && validConnections;
};