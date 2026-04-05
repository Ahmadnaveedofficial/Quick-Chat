import sql from 'mssql';
import 'dotenv/config'


const dbConfig = {
    user: process.env.DB_USER,             
    password: process.env.DB_PASSWORD,     
    server: process.env.DB_SERVER,         
    database: process.env.DB_DATABASE,     
    port: 1433,
    options: {                  
        trustServerCertificate: true,      
        enableArithAbort: true
    }
};


const connectToDatabase = async () => {
  try {
    const pool = await sql.connect(dbConfig);
    console.log("Connected to SQL Server successfully.");
    return pool;
  } catch (err) {
    console.error("Database connection failed:", err);
           console.error(err.message || err);
    console.error('Stack:', err.stack);
      console.dir(err, { depth: null });
  }
};
 
export default connectToDatabase;

