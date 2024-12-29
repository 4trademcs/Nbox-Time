const dbConect = require('./db'); //---acceso a conexion en db
const fs = require('fs'); //---manejo de archivos html
const path = require('path'); //---manejo de directorios, direcciones
const bcryptjs = require('bcryptjs');//---encriptar datos
const jwt = require('jsonwebtoken');//----auth de usuarios por jwt
const { promisify } = require('util');
const moment = require('moment');//----crear fechas con formato de AA:MM:HH:MM:SS
// ------sin usar aun--------
const email = require ('./mailer') //-----acceso a enviar emails automaticos

module.exports =  routesController = {
        handleInsert: async (req, res) => {
            const cookie = desencriptarCookie(req);
            if (!cookie) {
                return res.status(200).json({ message: 'Usted debe iniciar sesión primero', redirectUrl: "/auth" });
            }
    
            const { id } = cookie;
            const updatedData = req.body;
            const date = moment();
            
            // Determina la tabla y asigna un ID de manera dinámica
            const tableName = updatedData.email ? 'usuarios' : 'pedidos';
            updatedData.id = tableName === 'usuarios' ? `Boxess${date.format('YYYYMMDDHHMMSS')}` : `Pedidos${date.format('YYYYMMDDHHMMSS')}`;
            
            // Si la tabla es 'pedidos', asigna el idCliente del cookie
            if (tableName === 'pedidos') {
                updatedData.idCliente = id;
            }
    
            // Si es un usuario y tiene una contraseña, encripta la contraseña
            if (tableName === 'usuarios' && updatedData.pass) {
                updatedData.pass = await bcryptjs.hash(updatedData.pass, 8);
            }
    
            try {
                // Obtiene las columnas y los valores de manera dinámica
                const columns = Object.keys(updatedData).join(', ');
                const placeholders = Object.keys(updatedData).map(() => '?').join(', ');
                const values = Object.values(updatedData);
    
                // Construye la consulta SQL de manera dinámica
                const query = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})`;
                console.log(query);
    
                dbConect.query(query, values, (error, results) => {
                    if (error) {
                        res.status(500).json({ message: `Error al insertar en ${tableName}`, error });
                    } else {
                        res.status(200).json({ message: 'Guardado en Base de Datos',tableName});
                    }
                });
            } catch (error) {
                res.status(500).json({ message: 'Error al procesar la solicitud', error });
            }
        },
   
    handleDelete: (req, res) => {        
        const {id} = req.body; 
        const tableName = seleccionarTabla(id); 

        //verificar status del usuario para permitir borrar de la tabla usuarios
        const cookie = desencriptarCookie(req);
        const {userRole} = cookie; 
        console.log(userRole);  

         //verificar que el usuario este logueado
        if (!cookie) {
            return res.status(200).json({ message: 'Usted debe iniciar sesión primero', redirectUrl:"/auth" }); 
        }
          
        if (tableName ==='usuarios' && userRole !='Admin'){
            return res.status(200).json({ message: 'Usted no tiene permisos para esta operacion' }); 
        }     
    
        const deleteQuery = `DELETE FROM ${tableName} WHERE id = ?`;
        dbConect.query(deleteQuery, [id], (error, results) => {
            if (error) {
                return res.status(500).json({ message: `Error al eliminar el ${tableName.slice(0, -1)}`, error });
            } else {
                res.status(200).json({ message: 'Registro eliminado de la Base de Datos' ,tableName});
            }
        });       
    },

    handleEdit: async (req, res) => {
        const { id, ...updatedData } = req.body;
        const tableName = seleccionarTabla(id);
        const cookie = desencriptarCookie(req);
        const {userRole} = cookie; 

        try {

            //verificar que el usuario este logueado
            if (!cookie) {
                return res.status(200).json({ message: 'Usted debe iniciar sesión primero', redirectUrl:"/auth" }); 
            }
            //restringir editar usuario solo a admin y a gestores
            if (tableName ==='usuarios' && (userRole !='Admin'&& userRole !='Gestor')){
                console.log(false||true);
                return res.status(200).json({ message: 'Usted no tiene permisos para esta operacion' }); 
            }  

            // Si es la tabla 'usuarios' y existe el campo 'pass', encripta la contraseña
            if (tableName === 'usuarios' && updatedData.pass) {
                updatedData.pass = await bcryptjs.hash(updatedData.pass, 8);
            }
    
            // Filtrar datos que sean false o vacíos ('')
            const filteredData = Object.fromEntries(
                Object.entries(updatedData).filter(([key, value]) => value !== '' && value !== false)
            );
    
            console.log(Object.keys(filteredData).length);
    
            // Si no hay datos válidos, devolver un error
            if (Object.keys(filteredData).length === 0) {
                return res.status(400).json({ message: "No hay datos válidos para actualizar." });
            }
    
            // Construcción dinámica de la cláusula SET para el query de actualización
            const setClause = Object.keys(filteredData).map(key => `${key} = ?`).join(', ');
            const updateQuery = `UPDATE ${tableName} SET ${setClause} WHERE id = ?`;
    
            const values = [...Object.values(filteredData), id];
            console.log(updateQuery);
    
            // Ejecuta la consulta de actualización
            dbConect.query(updateQuery, values, (error, results) => {
                if (error) {
                    return res.status(500).json({ message: `Error al actualizar el ${tableName.slice(0, -1)}`, error });
                } else {
                    res.status(200).json({ message: 'Editado y guardado en Base de Datos',tableName});
                }
            });
    
        } catch (error) {
            res.status(500).json({ message: 'Error al procesar la solicitud', error });
        }
    },

    handleGestor : (req, res) => {
        const { id } = req.body;
        dbConect.query('UPDATE pedidos SET Gestor = "Completado",Estado ="Enviando.." WHERE id = ?', [id], (err) => {
            if (err) return res.status(500).json({ error: "Error al actualizar Gestor" });
            verificarEstado(id);  // Verificar si puede actualizar el estado general
            res.status(200).json({ message: 'Gestor confirma que entrego la remesa',tableName:'pedidos'});
        });
    },
    
    handleCliente : (req, res) => {
        const { id } = req.body;
        console.log(id)
        // Verificar si el Gestor ya está en "Completado"
        dbConect.query('SELECT Gestor FROM pedidos WHERE id = ?', [id], (err, result) => {
            if (err) return res.status(500).json({ error: "Error al verificar estado del Gestor" });
            const { Gestor } = result[0];
            if (Gestor !== 'Completado') {
                return res.status(400).json({ message: "El Gestor debe completar primero el pedido" });
            }
            // Si el Gestor ya está completado, actualizar Cliente
            dbConect.query('UPDATE pedidos SET Cliente = "Completado" WHERE id = ?', [id], (err) => {
                if (err) return res.status(500).json({ error: "Error al actualizar Cliente" });
                verificarEstado(id);  // Verificar si puede actualizar el estado general
                res.status(200).json({ message: 'Usted confirma que el cliente recibió la remesa',tableName:'pedidos'});
            });
        });
    },
    

    handleLogin: async (req, res) => {
        const { pass, email } = req.body;
        console.log("Datos recibidos en el backend:", req.body);
    
        try {
            if (!email || !pass) {
                res.status(400).json({ message: 'Por favor, ingrese email y contraseña' });
            } else {
                dbConect.query('SELECT * FROM usuarios WHERE email = ?', [email], async (error, results) => {
                    if (error) {
                        res.status(500).json({ message: 'Error en la consulta a la base de datos:', error });
                    } else if (results.length === 0) {
                        res.status(401).json({ message: 'Email no registrado' });
                    } else {
                        // Verificar si el campo 'pass' está presente en los resultados
                        console.log("Resultado de la consulta:", results[0]);                     
                        const validPassword = await bcryptjs.compare(pass, results[0].Pass);
                        if (!validPassword) {
                            res.status(401).json({ message: 'Contraseña incorrecta' });
                        } else {
                            const id = results[0].Id;
                            const userRole = results[0].Rol;
                            //Generando Token
                            const token = jwt.sign({ id, userRole }, process.env.JWT_SECRET, {
                                expiresIn: process.env.JWT_EXPIRES_IN,
                            });
                            // Configurando cookie...
                            res.cookie('jwt', token, {
                                expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000),
                                httpOnly: true,
                            });
                            res.status(200).json({ message: 'Login exitoso', token, redirectUrl:"/backoffice" });
                        }
                    }
                });
            }
    
        } catch (error) {
            console.log("Error en el Proceso de login:", error);
            res.status(500).json({ message: 'Error en el Proceso de login', error });
        }
    },
  

    handleLogout: (req, res) => {
        console.log(`se ejecuto un logout`);
        res.clearCookie('jwt');
        res.status(200).json({ message: 'Logout exitoso', redirectUrl:"/" });
    },
       

    handleTable: async (req, res) => {
        const tableName = req.query.table;
        const cookie = desencriptarCookie(req);
    
        // Verificar si el usuario está logueado
        if (!cookie) return res.status(401).json({ message: 'Debe iniciar sesión primero', redirectUrl: "/auth" });
    
        const { id, userRole } = cookie;
        let query = '';
    
        // Verificar permisos del usuario
        if (tableName === 'usuarios' && userRole !== 'Admin') {
            return res.status(401).json({ message: 'No tiene permisos para realizar esta acción' });
        }
    
        // Construcción de la consulta SQL según el rol del usuario
        switch (userRole) {
            case 'Cliente':
                query = `SELECT Nombre, Titular, Telefono, Tipo, Direccion, Tarjeta, Id, Monto, idCliente,Cliente, Gestor, Estado FROM pedidos WHERE idCliente = '${id}'`;
                break;
            case 'Gestor':
                query = `SELECT Nombre, Titular, Telefono, Tipo, Direccion, Tarjeta, Id, Monto, idCliente,Cliente, Gestor, Estado FROM pedidos`;
                break;
            case 'Admin':
                query = tableName == 'usuarios'? `SELECT   Nombre, Telefono, Direccion, Email, Patrocinador, Rol, Bono, Id, Carnet FROM usuarios`
                                               :`SELECT Nombre, Titular, Telefono, Tipo, Direccion, Tarjeta, Id, Monto, idCliente, Cliente, Gestor, Estado FROM pedidos`;
                break;
            default:
                return res.status(403).json({ message: 'No tiene permisos para acceder a esta tabla' });
        }
    
        // Ejecutar la consulta SQL
        dbConect.query(query, (error, results) => {
            if (error) {
                return res.status(500).json({ message: `Error al obtener datos en la tabla ${tableName}`, error });
            }
            console.log(results)
            // Procesar resultados y agregar botones dinámicamente según el rol
            const jsonFront = results.map(result => {
                // Crear botones de Proceso dinámicamente 
                let botonesProceso = '';
                switch (userRole) {
                    case 'Cliente': 
                    console.log(result.Gestor)
                    console.log(result.Cliente)
                        botonesProceso = result.Gestor !== 'Completado'
                        ? (result.Cliente !== 'Pendiente'
                            ? result.Cliente  // Mostrar "Foto subida"
                            : `<label for="file-input${result.Id}" class="page-button process">📥 Subir Foto</label>
                            <input class="${result.Id} invisible" id="file-input${result.Id}" type="file" name="file" onchange="uploadImg(event)"/>`)
                        : `<button class="${result.Id} page-button process" onclick="confirmacionPago(event)">Confirmar</button>`;
                                       
                    break;
                    case 'Gestor':
                        botonesProceso = result.Gestor =='Completado' ? `<p>✔</p>`
                                                                      : `<button class="${result.Id} page-button process" onclick="confirmarGestor(event)">Gestor Done</button>`;
                        break;
                    case 'Admin':
                        botonesProceso = `<div style="display:flex;">
                                          <button class="${result.Id} page-button process" onclick="confirmacionPago(event)">Confirmar</button>
                                          <button class="${result.Id} page-button process" onclick="confirmarGestor(event)">Confirmacion Gestor</button></div>`;
                        break;
                }
    
                // Botones de acciones
                const botonesAcciones = `<div style="display:flex;">
                                         <button class="${result.Id} page-button action-edit" onclick="solicitarEdit(event)">Editar</button>
                                         <button class="${result.Id} page-button action-delete" onclick="solicitarDelete(event)">Eliminar</button></div>`;
    
                // Estructura del objeto a enviar al frontend
                let row = {
                    ...result,
                    Proceso: botonesProceso,
                    Acciones: botonesAcciones
                };
    
                // Si el rol es 'Cliente', eliminar campos con info sensible
                if (userRole === 'Cliente') {delete row.Id; delete row.Cliente;delete row.Gestor;delete row.idCliente;}
                // Si el rol es 'Gestor', eliminar campos con info sensible
                if (userRole === 'Cliente') {delete row.Id;delete row.idCliente;}
                // Si es Admin y la tabla es 'usuarios', eliminar el campo 'Proceso'
                if (userRole === 'Admin' && tableName === 'usuarios') delete row.Proceso;
    
                return row;
            });
    
            // console.log('Datos procesados para el frontend:', jsonFront);
    
            // Enviar el JSON con los datos procesados
            res.status(200).json(jsonFront);
        });
    },
    
     
    isAuthenticated : async (req, res, next) => {
        
            // Verificar si el token existe
            if (req.cookies.jwt) {
                try {
                    // Verificar el token JWT
                    const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);
                    
                    // Buscar al usuario en la base de datos por su ID
                    dbConect.query('SELECT * FROM usuarios WHERE id = ?', [decoded.id], (error, results) => {
                        if (error) {
                            // Error en la consulta a la base de datos
                            return res.status(500).json({ message: 'Error en el servidor', error });
                        }
        
                        if (results.length === 0) {
                            // El usuario no existe en la base de datos
                            return res.status(401).json({
                                message: 'El usuario no existe. Intente loguearse o verifique sus credenciales',
                                redirectUrl: "/auth" // URL de redirección en caso de error
                            });
                        }
        
                        // Usuario encontrado, tiene acceso
                        req.user = results[0];
                        next();
                    });
                } catch (error) {
                    // Token expirado o inválido
                    return res.status(401).json({
                        message: 'Su sesión ha expirado, se requiere iniciar sesión nuevamente.',
                        error,
                        redirectUrl: "/auth" // URL de redirección en caso de sesión expirada
                    });
                }
            } else {
                // No hay token en las cookies
                return res.status(401).json({
                    message: 'No autorizado, se requiere iniciar sesión.',
                    redirectUrl: "/auth" // URL de redirección en caso de no estar autenticado
                });
            }
        }
};


// Sub-functions

function seleccionarTabla(id) {
    if (id.includes('Boxess')) {
        return 'usuarios';
    } else if (id.includes('Pedido')) {
        return 'pedidos';
    } else {
        throw new Error('ID no válido.');
    }
}


async function verificarEstado(id) {
    try {
        // Obtener información del pedido
        const [[{ Cliente, Gestor, idCliente, Monto, Estado }]] = await dbConect.promise().query('SELECT Cliente, Gestor, idCliente, Monto, Estado FROM pedidos WHERE id = ?',[id]);

        // Verificar si el estado puede actualizarse a "Completada"
        if (Cliente === 'Completado' && Gestor === 'Completado' && Estado !== 'Completada') {
            await dbConect.promise().query('UPDATE pedidos SET Estado = "Completada" WHERE id = ?', [id]);
            // Obtener patrocinador y bono actual
            const [[{ Patrocinador }]] = await dbConect.promise().query('SELECT Patrocinador FROM usuarios WHERE id = ?',[idCliente]);
            const [[{ Bono }]] = await dbConect.promise().query('SELECT Bono FROM usuarios WHERE id = ?',[Patrocinador]);
            // Calcular el nuevo bono, agregando el 10% de Monto al bono existente y limitarlo a 2 decimales
            const bonoIncrementado = parseFloat((Bono + Monto / 10).toFixed(2));
            // Actualizar el bono del patrocinador
            await dbConect.promise().query('UPDATE usuarios SET Bono = ? WHERE id = ?',[bonoIncrementado, Patrocinador]);
        }

    } catch (error) {
        console.error('Error en la función verificarEstado:', error);
    }
}


  
const desencriptarCookie = (req) => {
    const token = req.cookies.jwt;   
    try {
        // Desencripta y devuelve los datos del usuario
        const { id, userRole, iat, exp } = jwt.verify(token, process.env.JWT_SECRET);
        return { id, userRole, iat, exp }; // Retorna un JSON con los datos    
    } catch (error) {
        return false;
    }
};