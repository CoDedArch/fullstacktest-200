import { useEffect, useState } from "react";

// Define the Schema and Table types
interface Schema {
  id: string;
  name: string;
  schema_type: string;
  schema_definition: {
    tables: Table[];
  };
  created_at: string;
}

interface Table {
  name: string;
  fields: Field[];
  description?: string;
}

interface Field {
  name: string;
  type: string;
  required: boolean;
  description?: string;
}

const useWebSocket = (projectTitle: string) => {
  const [tables, setTables] = useState<Table[]>([]); // State to store tables
  const [isConnected, setIsConnected] = useState(false); // State to track WebSocket connection

  useEffect(() => {
    // Create a WebSocket connection
    const socket = new WebSocket(
      `ws://127.0.0.1:8000/ws/project-schemas/${projectTitle}`
    );

    // Handle WebSocket connection open
    socket.onopen = () => {
      console.log("WebSocket connected");
      setIsConnected(true);
    };

    // Handle incoming messages
    socket.onmessage = (event) => {
      const data: Schema[] = JSON.parse(event.data); // Parse the response and type it as Schema[]
      console.log("WebSocket data received:", data);

      // Extract tables from the schema_definition
      if (data && data.length > 0) {
        const allTables = data.flatMap(
          (schema: Schema) => schema.schema_definition.tables || []
        );
        setTables(allTables);
      }
    };

    // Handle WebSocket errors
    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    // Handle WebSocket connection close
    socket.onclose = () => {
      console.log("WebSocket disconnected");
      setIsConnected(false);
    };

    // Cleanup function to close the WebSocket connection
    return () => {
      socket.close();
    };
  }, [projectTitle]); // Re-run the effect if projectId changes

  return { tables, isConnected };
};

export default useWebSocket;
