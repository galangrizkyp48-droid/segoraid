import postgres from 'postgres'

const connectionString = process.env.DATABASE_URL!

// Create a singleton postgres client
const sql = postgres(connectionString, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
    ssl: false, // VPS local connection
})

export default sql
