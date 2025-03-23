// Función para cargar contenido
function lanzarModal(id) {
    let title = '';                        
    const ventana_modal =  `<dialog open="" id="modal-logo" class="modal">
                                <div class="flexbox container-full-alto">
                                    <form method="dialog" class="flexbox" id="modal-form">
                                        <button class="flexbox" id="modal-button-close">
                                                <div class="flexbox column" id="modal-content">
                                                    <h2 class="company-name">NBOX TIME</h2>
                                                    <div class="line line1"><p class="line-tittle">seguridad</p></div>
                                                    <div class="line line2"><p class="line-tittle">confianza</p></div>
                                                    <div class="line line3"><p class="line-tittle">familia</p></div>
                                                    <div class="line line4"><p class="line-tittle">negocio</p></div>
                                                    <div class="line line5"><p class="line-tittle">dinero</p></div>
                                                    <div class="line line6"><p class="line-tittle">felicidad</p></div>
                                                    <div class="line line7"><p class="line-tittle">futuro</p></div>
                                                </div>
                                        </button>
                                    </form>
                                </div>
                            </dialog>`;
                                
    const consignment_register = ` <div id="form-container" class="flexbox modal">
                                        <button class="close-modal" onclick="eliminarHTML('form-container')"></button>
                                        <div class="multistep-form-container">
                                            <h2 id="form-title"></h2>
                                
                                            <div class="progress-bar">
                                                <div class="step"><p>Paso&nbsp;</p><div class="bullet"><span>1</span></div><div class="check fas fa-check"></div></div>
                                                <div class="step"><p>&nbsp; Fin&nbsp;&nbsp;</p><div class="bullet"><span>2</span></div><div class="check fas fa-check"></div></div>
                                            </div>
                                    
                                            <div class="form">
                                                <form class="form validated" id="form-consignment-register" name="remesa">
                                                    <img class="background-img" src="public/img/logo.webp">
                                                    
                                                    <!-- Página 1 -->
                                                    <div class="page slide-page active step1">
                                                        <h3 class="title">Datos personales</h3>
                                                        <div class="field">
                                                            <label class="label" for="remesa-name">Nombre de quien recibe la remesa</label>
                                                            <input id="remesa-name" type="text" placeholder="Beneficiario" class="validate-name sql">
                                                        </div>
                                                          <div class="field">
                                                            <label class="label" for="remesa-owner">Nombre de quien envía la remesa</label>
                                                            <input id="remesa-owner" type="text" placeholder="Titular de la cuenta que realiza el envío" class="validate-name sql">
                                                        </div>
                                                        <div class="field">
                                                            <label class="label" for="remesa-tel">Teléfono de quien recibe la remesa</label>
                                                            <input id="remesa-tel" type="tel" placeholder="(+53)********" class="validate-tel">
                                                        </div>
                                                        <div class="field">
                                                            <button class="next" onclick="navigateSteps(event, 'step1', 100, 'name', 'phone')">Siguiente</button>
                                                        </div>
                                                    </div>
                                    
                                                    <!-- Página 2 -->
                                                    <div class="page submit">
                                                        <h3 class="title">Detalles del envío</h3>
                                                        <div class="field">
                                                            <label class="label" for="remesa-monto">Monto</label>
                                                            <input id="remesa-monto" type="number" placeholder="100 USD" class="validate-number">
                                                        </div>
                                                        <div class="field">
                                                            <label class="label" for="remesa-type">¿Cómo desea recibir su remesa?</label>
                                                            <input id="remesa-type" list="remesa-sponsor-option" class="validate-type sql" onchange="check()">
                                                            <datalist name="type-of-user" id="remesa-sponsor-option">
                                                                <option value="USD efectivo"></option>
                                                                <option value="CUP efectivo"></option>
                                                                <option value="Transferencia CUP">recibir CUP en su tarjeta</option>
                                                                <option value="Transferencia USD">recibir USD en su tarjeta</option>
                                                            </datalist>
                                                        </div>
                                                        <div class="field" id="dinamic-field"></div>
                                                        <div class="field">
                                                            <label for="marcar">Aceptar los
                                                                <a href="/terminos" target="_blank">términos y condiciones</a> de la entrega
                                                                <input type="checkbox" id="marcar" required>
                                                            </label>
                                                        </div>
                                                        <div class="field btns">
                                                            <button class="prev" onclick="navigateSteps(event, 'step2', 0)">Atrás</button>
                                                            <button class="submit" onclick="navigateSteps(event,'submit',0,'amount','type','address','phone')">Enviar</button>
                                                        </div>
                                                    </div>
                                                </form>
                                            </div>
                                        </div>
                                    </div>`;
                                                 

    const user_register = `<div id="form-container" class="flexbox modal">
                                <button class="close-modal" onclick="eliminarHTML('form-container')"></button>
                                <div class="multistep-form-container">
                                    <h2 id="form-title"></h2>
                                    
                                    <div class="progress-bar">
                                        <div class="step"><p>Paso&nbsp;</p><div class="bullet"><span>1</span></div><div class="check fas fa-check"></div></div>
                                        <div class="step"><p>Paso&nbsp;</p><div class="bullet"><span>2</span></div><div class="check fas fa-check"></div></div>
                                        <div class="step"><p>Paso&nbsp;</p><div class="bullet"><span>3</span></div><div class="check fas fa-check"></div></div>
                                        <div class="step"><p>&nbsp; Fin&nbsp;&nbsp;</p><div class="bullet"><span>4</span></div><div class="check fas fa-check"></div></div>
                                    </div>
                            
                                    <div class="form">
                                        <form class="form validated" id="form-user-register" name="contact">
                                            <img class="background-img" src="public/img/logo.webp">
                                            
                                            <!-- Página 1 -->
                                            <div class="page slide-page active next1">
                                                <h3 class="title">Información de Contacto</h3>
                                                <div class="field">
                                                    <label class="label" for="contact-email">Correo Electronico</label>
                                                    <input id="contact-email" name="email" type="email" placeholder="tu_email@gmail.com" class="validate-email sql">
                                                </div>
                                                <div class="field">
                                                    <label class="label" for="contact-pass">Clave</label>
                                                    <input id="contact-pass" name="password" type="password" placeholder="Establece tu contraseña" autocomplete="new-password" class="validate-password sql">
                                                        <svg class="pass-ico" onclick="showText(event)">
                                                            <use href="public/img/svg/password-open.svg#pass-ico"></use>
                                                        </svg>
                                                        <svg class="pass-ico hidden" onclick="showText(event)">
                                                            <use href="public/img/svg/password.svg#pass-ico"></use>
                                                        </svg>
                                                </div>        
                                                <div class="field">  
                                                    <label class="label" for="contact-pass-2fa">Reconfirme:</label>      
                                                        <input id="contact-pass-2fa" name="password" type="password" placeholder="Repite tu contraseña" autocomplete="new-password" class="validate-confirm-password sql">
                                                            <svg class="pass-ico" onclick="showText(event)">
                                                                <use href="public/img/svg/password-open.svg#pass-ico"></use>
                                                            </svg>
                                                            <svg class="pass-ico hidden" onclick="showText(event)">
                                                                <use href="public/img/svg/password.svg#pass-ico"></use>
                                                            </svg>
                                                </div>
                                                <div class="field">
                                                    <button class="next" onclick="navigateSteps(event, 'next1', 100, 'email', 'password','confirmPassword')">Siguiente</button>
                                                </div>
                                            </div>
                            
                                            <!-- Página 2 -->
                                            <div class="page next2">
                                                <h3 class="title">Información Personal</h3>
                                                <div class="field">
                                                    <label class="label" for="contact-name">Nombre y Apellidos</label>
                                                    <input id="contact-name" name="name" type="text" placeholder="Robert Kiyosaki" class="validate-name sql">
                                                </div>
                                                <div class="field">
                                                    <label class="label" for="contact-dni">DNI</label>
                                                    <input id="contact-dni" name="dni" type="text" placeholder="tu carnet:99103456992" class="validate-dni">
                                                </div>
                                                <div class="field btns">
                                                    <button class="prev" onclick="navigateSteps(event, 'prev1', 0)">Atrás</button>
                                                    <button class="next" onclick="navigateSteps(event, 'next2', 200, 'name', 'dni')">Siguiente</button>
                                                </div>
                                            </div>
                            
                                            <!-- Página 3 -->
                                            <div class="page next3">
                                                <h3 class="title">Información Personal</h3>
                                                <div class="field">
                                                    <label class="label" for="contact-tel">Número de Telefono</label>
                                                    <input id="contact-tel" name="telefono" type="tel" placeholder="(+53)********" class="validate-tel">
                                                </div>
                                                <div class="field">
                                                    <label class="label" for="contact-direction">Direccion</label>
                                                    <textarea id="contact-direction" name="direccion" rows="5" maxlength="140" placeholder="Direccion de envio: Municipio,calle,#" class="validate-address"></textarea>
                                                </div>
                                                <div class="field btns">
                                                    <button class="prev" onclick="navigateSteps(event, 'prev2', 100)">Atrás</button>
                                                    <button class="next" onclick="navigateSteps(event, 'next3', 300, 'phone', 'address')">Siguiente</button>
                                                </div>
                                            </div>
                            
                                            <!-- Página 4 -->
                                            <div class="page submit">
                                                <h3 class="title">Casi listo, solo déjanos saber:</h3>
                                                <div class="field">
                                                    <label class="label" for="contact-sponsor">Cómo conociste nuestro negocio?</label>
                                                    <input id="contact-sponsor" name="source" list="contact-sponsor-option" class="validate-sponsor sql" onchange="check()">
                                                    <datalist id="contact-sponsor-option">
                                                        <option value="Patrocinador">Por un amigo</option>
                                                        <option value="Remesa">Un familiar envió dinero</option>
                                                        <option value="Google">Lo busqué en internet</option>
                                                    </datalist>
                                                </div>
                                                <div class="field" id="sponsor-id-field"></div>
                                                <div class="field">
                                                    <label for="marcar">Aceptar los
                                                        <a href="/terminos" target="_blank">términos y condiciones</a>
                                                        <input type="checkbox" id="marcar" name="terms" required>
                                                    </label>
                                                </div>
                                                <div class="field btns">
                                                    <button class="prev" onclick="navigateSteps(event, 'prev3', 200)">Atrás</button>
                                                    <button class="submit" onclick="navigateSteps(event, 'submit', 0, 'source')">Enviar</button>
                                                </div>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>`;

    const  banner = `<div class="banner"></div>`;

    const tuto_table = `<div class="card-office-title">Historial de pedidos</div>
                        <div class="filtred-navigation" class="focusSection secondplane">
                           <select id="filterKey" class="focusSection secondplane" onchange="displaySelectedOption()" title="Tarjeta">
                                <option value="Nombre">Nombre</option>
                                <option value="Titular">Titular</option>
                                <option value="Telefono">Telefono</option>
                                <option value="Tipo">Tipo</option>
                                <option value="Direccion">Direccion</option>
                                <option value="Tarjeta">Tarjeta</option>
                                <option value="Id">Id</option>
                                <option value="Monto">Monto</option>
                                <option value="idCliente">idCliente</option>
                                <option value="Patrocinador">Patrocinador</option>
                                <option value="Cliente">Cliente</option>
                                <option value="Gestor">Gestor</option>
                                <option value="Estado">Estado</option>
                            </select>
                            <input class="focusSection secondplane" type="text" id="filterValue" placeholder="🔍..buscar">
                            <button class="table-navigation focusSection secondplane">Filtrar</button>
                            <button class="table-navigation focusSection secondplane" onclick="detailsColumnVisibility()" >Detalles</button>
                        </div>
                        <div id="tables-container" class="tablas-dinamicas focusSection secondplane">
                            <table>
                                <thead>
                                    <tr>
                                        <th class="">Nombre</th>
                                        <th class="">Titular</th>
                                        <th class="">Telefono</th>
                                        <th class="details hidden">Tipo</th>
                                        <th class="details hidden">Direccion</th>
                                        <th class="details hidden">Tarjeta</th>
                                        <th class="">Monto</th>
                                        <th class="">Cliente</th>
                                        <th class="">Gestor</th>
                                        <th class="">Estado</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td class="">Jhon</td>
                                        <td class="">Maria</td>
                                        <td class="">58253302</td>
                                        <td class="details hidden">CUP efectivo</td>
                                        <td class="details hidden"></td>
                                        <td class="details hidden">2147483647</td>
                                        <td class="">100</td>
                                        <td class=""><button class="page-button process">Ver Comprobante</button></td>
                                        <td class="">Pendiente</td>
                                        <td class="">Pendiente</td>
                                        <td>
                                            <div style="display: flex; gap: 10px;">
                                                <button class="page-button action-edit">Editar</button>
                                                <button class="page-button action-delete">Eliminar</button>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="">Sintia</td>
                                        <td class="">Frank</td>
                                        <td class="">42552393</td>
                                        <td class="details hidden">CUP efectivo</td>
                                        <td class="details hidden"></td>
                                        <td class="details hidden">2147483647</td>
                                        <td class="">130</td>
                                        <td class=""><button class="page-button process">Confirmar</button></td>
                                        <td class="">Completado</td>
                                        <td class="">Pendiente</td>
                                        <td>
                                            <div style="display: flex; gap: 10px;">
                                                <button class="page-button action-edit">Editar</button>
                                                <button class="page-button action-delete">Eliminar</button>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="">Hianny</td>
                                        <td class="">Frank</td>
                                        <td class="">123556390</td>
                                        <td class="details hidden">CUP efectivo</td>
                                        <td class="details hidden">frfrfrfr</td>
                                        <td class="details hidden">2147483647</td>
                                        <td class="">573</td>
                                        <td class="">Completado</td>
                                        <td class="">Completado</td>
                                        <td class="">Completada</td>
                                        <td>
                                            <div style="display: flex; gap: 10px;">
                                                <button class="page-button action-edit">Editar</button>
                                                <button class="page-button action-delete">Eliminar</button>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div class="navigation ">
                            <button class="table-navigation focusSection secondplane">Anterior</button>
                            <button class="table-navigation focusSection secondplane">Siguiente</button>
                        </div>`;
                            
    switch (id) {
        case 'consignment-edit':
            title = 'Editar Remesa';
            action = 'editar';
            document.body.insertAdjacentHTML('beforeend', consignment_register);
            document.getElementById('form-title').textContent = title;
            break;
        case 'consignment-register':
            title = 'Solicitar Remesa';
            action = 'registrar';
            document.body.insertAdjacentHTML('beforeend', consignment_register);
            document.getElementById('form-title').textContent = title;
            break;
        case 'user-edit':
            title = 'Editar Usuario';
            action = 'editar';
            document.body.insertAdjacentHTML('beforeend', user_register);
            document.getElementById('form-title').textContent = title;
            break;
        case 'user-register':
            title = 'Registrar Usuario';
            action = 'registrar';
            document.body.insertAdjacentHTML('beforeend', user_register);
            document.getElementById('form-title').textContent = title;
            break;                
        case 'banner':
            document.querySelector('.main').insertAdjacentHTML('afterbegin', banner);
            break;
        case 'tutorial-table':
            document.querySelector('#tablas').innerHTML= tuto_table;
            break;
        default:
            document.body.insertAdjacentHTML('beforeend', ventana_modal);
    }
}


// Función para borrar un elemento por su ID 
const eliminarHTML = (id)=> {
    const elemento = document.getElementById(id);
    elemento? elemento.remove(): console.warn(`Elemento con ID "${id}" no encontrado.`);
}

//logica para los ojos de los passwords
const showText = (event) => {
    const Element = event.currentTarget;    
    const field = Element.closest('.field');
    const input = field.querySelector('input[type="password"], input[type="text"]');
    if (input) {
        input.type = input.type === "password" ? "text" : "password";    
        // Alternar las clases 'hidden' entre los dos SVG en el contenedor
        const svgs = field.querySelectorAll('svg.pass-ico');
        svgs.forEach(svg => svg.classList.toggle('hidden'));
    }
}; 
