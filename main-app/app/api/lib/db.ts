import { Pool } from "pg";

/**
 * Create a database connection pool with proper error handling
 * This handles connection failures gracefully and reports useful errors
 */
const createPool = () => {
  try {
    console.log("Initializing database connection pool...");
    
    // Attempt to build a connection string if individual parts are provided
    // This provides a fallback if DATABASE_URL is not set directly
    let connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      console.log("DATABASE_URL not found, attempting to build connection string from individual variables...");
      const dbUser = process.env.DB_USER;
      const dbPassword = process.env.DB_PASSWORD;
      const dbName = process.env.DB_NAME;
      const dbHost = process.env.DB_HOST || 'postgres'; // Default to 'postgres' service name
      const dbPort = process.env.POSTGRES_PORT || '5432'; // Use 5432 as default PostgreSQL port

      console.log(`Using DB_HOST: ${dbHost}, DB_PORT: ${dbPort}`);
      console.log(`DB_USER: ${dbUser}, DB_PASSWORD: ${dbPassword ? '********' : undefined}, DB_NAME: ${dbName}`);

      if (dbUser && dbPassword && dbName) {
        connectionString = `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;
        console.log(`Successfully built database connection string from individual environment variables. Host: ${dbHost}, Port: ${dbPort}, Database: ${dbName}`);
      } else {
        const missingVars = [];
        if (!dbUser) missingVars.push('DB_USER');
        if (!dbPassword) missingVars.push('DB_PASSWORD');
        if (!dbName) missingVars.push('DB_NAME');
        
        console.error(`Critical database configuration missing: ${missingVars.join(', ')} environment variables not set`);
        throw new Error(`Missing database configuration: ${missingVars.join(', ')}`);
      }
    } else {
      console.log("Using provided DATABASE_URL for database connection");
    }
    
    // Parse SSL options with validation
    let ssl = undefined;
    if (process.env.DB_USE_SSL === 'true') {
      ssl = {
        rejectUnauthorized: process.env.DB_REJECT_UNAUTHORIZED === 'true'
      };
      console.log(`SSL configuration enabled. rejectUnauthorized: ${process.env.DB_REJECT_UNAUTHORIZED === 'true'}`);
    }
    
    // Create pool with connection retries and proper SSL options
    const pool = new Pool({
      connectionString,
      ssl,
      max: parseInt(process.env.DB_MAX_CONNECTIONS || '20'), // Maximum number of clients in the pool
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'), // Close idle clients after 30 seconds
      connectionTimeoutMillis: parseInt(process.env.DB_CONNECT_TIMEOUT || '10000'), // Return an error after 10 seconds
    });

    // Handle connection errors
    pool.on("error", (err) => {
      console.error("Unexpected database error:", err);
      // Don't throw error from the event handler, which would crash the app
    });

    // Test connection
    pool.query("SELECT NOW()")
      .then(() => console.log("✅ Database connection established successfully"))
      .catch(err => {
        console.error("❌ Database connection test failed:", err.message);
        console.error("Please check your database credentials and connection parameters");
        console.error("Connection details: Host:", process.env.DB_HOST || "(from connection string)", 
                      "Port:", process.env.POSTGRES_PORT || "5432",
                      "Database:", process.env.DB_NAME || "(from connection string)");
        
        // Log more helpful troubleshooting information
        console.error("Troubleshooting tips:");
        console.error("1. Ensure PostgreSQL is running and accessible on the correct port");
        console.error("2. Verify that the database name exists and user has appropriate permissions");
        console.error("3. Check if network/firewall settings allow connections between services");
        console.error("4. Ensure the PostgreSQL container has fully initialized before connecting");
      });

    return pool;
  } catch (error) {
    console.error("Failed to initialize database pool:", error);
    console.error("The application will continue but database operations will likely fail");
    
    // Return a minimal pool that will gracefully report errors rather than crashing
    return new Pool({
      connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/postgres",
    });
  }
};

const pool = createPool();

export default pool;
