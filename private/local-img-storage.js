const fs = require('fs');
const path = require('path');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const sharp = require('sharp'); // para redimensionar imágenes
const dbConect = require('./db');
const { decryptID } = require('./encryption');

// Configurar multer
const upload = multer({
    dest: path.join(__dirname, '../private/img/uploads'),
    limits: { fileSize: 3 * 1024 * 1024 }, // Límite de 3 MB
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
        const extname = path.extname(file.originalname).toLowerCase();

        if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(extname)) {
            cb(null, true); // Aceptar el archivo
        } else {
            cb(new Error('La foto debe estar en formatos permitidos (JPEG, PNG, GIF) y pesar menos de 3 MB'));
        }
    },
}).single('file');

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
            console.log('Usuario autenticado. ID:', userId);
        } catch (err) {
            console.log('Token inválido o expirado:', err.message);
            return res.status(401).json({ message: 'Token inválido o expirado' });
        }

        upload(req, res, async (err) => {
            if (err) {
                console.log('Error en Multer:', err.message);
                if (err.message === 'File too large') return res.status(400).json({ message: 'La foto debe pesar menos de 3 MB' });                
                if (err.message.includes('formato permitido'))  return res.status(400).json({ message: err.message });
                
                return res.status(500).json({ message: `Error al subir el archivo: ${err}` });
            }

            const file = req.file;
            const className = req.body.className; // Obtener className desde el frontend

            if (!file || !className) {
                console.log('Archivo o nombre no proporcionado.');
                return res.status(400).json({ message: 'Archivo o className no proporcionado' });
            }

            console.log('Archivo recibido:', file);
            console.log('ClassName recibido:', className);

            // Desencriptar el className para obtener el ID
            let decryptedID;
            try {
                decryptedID = decryptID(className);
                console.log('ID desencriptado:', decryptedID);
            } catch (decryptError) {
                return res.status(500).json({ message: 'Error al procesar el className encriptado' });
            }

            // Crear carpeta del usuario dentro de `/private/img/uploads/`
            const userDir = path.join(__dirname, `../private/img/uploads/${userId}`);
            if (!fs.existsSync(userDir)) {
                console.log('Creando carpeta del usuario:', userDir);
                fs.mkdirSync(userDir, { recursive: true });
            }

            // Ruta para el archivo dentro de la carpeta del usuario
            const newFilePath = path.join(userDir, `${decryptedID}${path.extname(file.originalname)}`);

            try {
                // Verificar las dimensiones de la imagen y redimensionar si es necesario con sharp
                const metadata = await sharp(file.path).metadata();
                console.log('Metadatos de la imagen:', metadata);

                const maxWidth = 800; // Ancho máximo permitido
                const maxHeight = 800; // Alto máximo permitido

                if (metadata.width > maxWidth || metadata.height > maxHeight) {
                    console.log('Redimensionando imagen...');
                    await sharp(file.path).resize(maxWidth, maxHeight, { fit: 'inside', // Mantener la relación de aspecto
                            withoutEnlargement: true, // No agrandar imágenes más pequeñas
                        })
                        .toFile(newFilePath); // Guardar la imagen redimensionada
                } else {
                    console.log('La imagen no necesita redimensionarse.');
                    fs.renameSync(file.path, newFilePath); // Mover el archivo sin cambios
                }

                console.log('Imagen guardada en:', newFilePath);

                /* Pensar en la posibilidad de actualizar la base de datos con la nueva ruta relativa
                const relativePath = `/private/img/uploads/${userId}/${decryptedID}${path.extname(file.originalname)}`;*/
                dbConect.query('UPDATE pedidos SET Cliente = ? WHERE id = ?', ['Comprobante Subido', decryptedID], (updateError) => {
                    if (updateError) {
                        console.log('Error al actualizar la base de datos:', updateError.message);
                        return res.status(500).json({ error: 'Error al actualizar Cliente' });
                    }
                    res.json({ message: 'Comprobante subido exitosamente', tableName: 'pedidos' });
                });
            } catch (sharpError) {
                console.error('Error al procesar la imagen:', sharpError.message);
                return res.status(500).json({ message: 'Error al redimensionar la imagen' });
            } finally {
                // Eliminar el archivo temporal si existe
                if (fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                    console.log('Archivo temporal eliminado.');
                }
            }
        });
    },
};