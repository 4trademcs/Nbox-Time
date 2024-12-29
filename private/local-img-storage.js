const fs = require('fs');
const path = require('path');
const multer = require('multer');
const dbConect = require('./db'); // Asegúrate de que tienes acceso a tu módulo de conexión a la base de datos

// Configurar multer con solo el destino
const upload = multer({ dest: path.join(__dirname, '../public/img/uploads') }).single('file');

// Función para renombrar, actualizar base de datos y subir la imagen
module.exports = {
    loadImg: (req, res) => {
        upload(req, res, (err) => {
            if (err) return res.status(500).json({ message: 'Error al subir el archivo' });

            const file = req.file;
            const id = req.body.id;

            // Nueva ruta para renombrar el archivo
            const newPath = path.join(file.destination, `${id}${path.extname(file.originalname)}`);
            const relativePath = `/img/uploads/${id}${path.extname(file.originalname)}`; // Ruta relativa para la base de datos

            // Renombrar el archivo
            fs.rename(file.path, newPath, (err) => {
                if (err) return res.status(500).json({ message: 'Error al renombrar el archivo' });

                // Actualizar base de datos: Establecer el campo Cliente con el link a la foto subida
                dbConect.query('UPDATE pedidos SET Cliente = ? WHERE id = ?', [`<a href="/src${relativePath}" target="_blank">Foto subida</a>`, id], (err) => {
                    if (err) return res.status(500).json({ error: "Error al actualizar Cliente" });

                    // Notificar éxito al cliente solo si se actualizó la base de datos correctamente
                    res.json({ message: 'Archivo subido espere a que el gestor confirme la entrega',tableName: 'pedidos' });
                });
            });
        });
    }
};
