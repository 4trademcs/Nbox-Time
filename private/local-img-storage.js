const fs = require('fs');
const path = require('path');
const multer = require('multer');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const dbConect = require('./db');
const { decryptID, getKey } = require('./encryption');

// Configurar multer con solo el destino
const upload = multer({ dest: path.join(__dirname, '../public/img/uploads') }).single('file');

module.exports = {
    loadImg: (req, res) => {
        // Extraer cookie y decodificar JWT
        const token = req.cookies.jwt;
        if (!token) {
            return res.status(401).json({ message: 'Usuario no autenticado' });
        }

        let userId;
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            userId = decoded.id; // ID del usuario desde la cookie
        } catch (err) {
            return res.status(401).json({ message: 'Token inválido o expirado' });
        }

        upload(req, res, (err) => {
            if (err) {
                return res.status(500).json({ message: 'Error al subir el archivo' });
            }

            const file = req.file;
            const encryptedID = req.body.id;

            if (!file || !encryptedID) {
                return res.status(400).json({ message: 'Archivo o ID no proporcionado' });
            }

            // Desencriptar el ID para nombrar el archivo
            let decryptedID;
            try {
                decryptedID = decryptID(encryptedID);
            } catch (decryptError) {
                return res.status(500).json({ message: 'Error al procesar el ID encriptado' });
            }

            // Crear carpeta del usuario usando el ID obtenido de la cookie
            const userDir = path.join(file.destination, userId); // Carpeta con el ID del usuario
            if (!fs.existsSync(userDir)) {
                fs.mkdirSync(userDir, { recursive: true });
            }

            // Ruta para el archivo dentro de la carpeta del usuario
            const newFilePath = path.join(userDir, `${decryptedID}${path.extname(file.originalname)}`);

            // Renombrar el archivo y moverlo a la carpeta del usuario
            fs.rename(file.path, newFilePath, (renameError) => {
                if (renameError) {
                    return res.status(500).json({ message: 'Error al procesar el archivo' });
                }

                // Actualizar la base de datos con la ruta del archivo
                const relativePath = `/img/uploads/${userId}/${decryptedID}${path.extname(file.originalname)}`;
                dbConect.query('UPDATE pedidos SET Cliente = ? WHERE id = ?', [`<a href="/src${relativePath}" target="_blank">Foto subida</a>`, decryptedID], (updateError) => {
                    if (updateError) {
                        return res.status(500).json({ error: 'Error al actualizar Cliente' });
                    }

                    console.log(`Solicitud de subir img a la ruta: ${newFilePath}`);
                    res.json({ message: 'Archivo subido exitosamente', tableName: 'pedidos' });
                });
            });
        });
    },
};
