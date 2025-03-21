const express = require('express');
const routes = require('./private/routes.js'); //---acceso a las rutas
const cookieParser = require('cookie-parser'); //---para manejar cookies
const app = express();


// ======== Middlewares ===========
app.use(express.json());
app.use(cookieParser()); // Agregar el middleware para manejar cookies
app.use('/', routes);

//Evitar q luego de hacer Logout pulsen boton atras y la pagina sea accesible
app.use(function(req, res, next){
    if(!req.cookies.jwt){
        res.header('Cache-control','private, no-cache, no-strore, must-revalidate');
    }

});

// Levantar el servidor
const port = 3000;
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});
