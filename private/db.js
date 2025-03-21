const mysql = require('mysql2');
require('dotenv').config(); // Cargar las variables de entorno

// ======== Configuración de la base de datos ===========
const dbConect = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    charset: process.env.DB_CHARSET,
});

dbConect.connect((err) => {
    if (err) {
        console.log('El error de conexión es: '+err);
        return;
    }
    console.log('Conectado a MySQL');
});


module.exports = dbConect