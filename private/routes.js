const express = require('express');
const path = require('path');
const routesController = require('./controller');
const uploader = require('./local-img-storage');
const router = express.Router();

// 🔹 Rutas Estáticas 
router.use('/public', express.static(path.join(__dirname, '../public')));
// 🔹 Rutas de Páginas
router.get('/', (req, res) => res.sendFile(path.join(__dirname, '../pages/Nbox Time.html')));
router.get('/auth', (req, res) => res.sendFile(path.join(__dirname, '../pages/login.html')));
router.get('/backoffice', routesController.isAuthenticated, (req, res) => res.sendFile(path.join(__dirname, '../pages/backoffice.html')));
router.get('/terminos', (req, res) => res.sendFile(path.join(__dirname, '../pages/Terminos y Condiciones.html')));
// 🔹 Rutas API
router.post('/sign', routesController.handleInsert);
router.post('/login', routesController.handleLogin);
router.get('/logout', routesController.handleLogout);
router.get('/show', routesController.handleTable);
router.delete('/delete', routesController.handleDelete);
router.put('/edit', routesController.handleEdit);
router.patch('/confirm', routesController.handleConfirm);
router.post('/upload', uploader.loadImg);
router.get('/pagos', routesController.handlePago);
router.post('/comprobante', routesController.handleComprobante);
router.post('/changeOwnPass', mailControl.handleMail);
// 🔹 Manejar rutas no definidas y redirigir a la página 404
router.use((req, res) => res.status(404).sendFile(path.join(__dirname, '../pages/404.html')));

module.exports = router;
