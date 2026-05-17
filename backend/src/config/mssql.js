require('dotenv').config();
const sql = require('mssql');

const config = {
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    options: {
        encrypt: true, // Bắt buộc đối với Azure SQL
        trustServerCertificate: true
    }
};

const connectDB = async () => {
    try {
        const pool = await sql.connect(config);
        console.log('Kết nối cơ sở dữ liệu thành công');
        return pool;
    }
    catch (err) {
        console.error('Kết nối cơ sở dữ liệu thất bại:', err);
        process.exit(1);
    }
};

module.exports = { connectDB, sql };