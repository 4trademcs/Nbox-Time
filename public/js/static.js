// ====================== Lanzar modal con logo ==========================
document.addEventListener('DOMContentLoaded', () => {
    lanzarModal('alert-ok'); 
    lanzarModal('alert-re-confirm'); 
});

// Funcion global para llamar a un elemento externo al accionar boton
// El botón debe tener un id que coincida con el nombre del modal a llamar
function llamarFormularioModal(event) {    
    if (event.target) {
        lanzarModal(`${event.target.id}`);
    }
}

// Función para cargar contenido
function lanzarModal(id) {
    let title = '';
     const alert_ok =`<dialog id="alert-ok">
                        <form method="dialog">
                            <button class="flexbox modal transparent">
                                <div class="mensaje">
                                    <h2 class="texto"></h2>
                                    <img class="bg-img" src="public/img/logo.webp" alt="">
                                </div>   
                            </button> 
                        </form>
                    </dialog>`;

    const alert_re_confirm =`<dialog id="alert-re-confirm" class="modal form-container" >
                                <div class="flexbox">
                                    <form class="flexbox-column form alert" method="dialog">
                                        <img  class="background-img" src="public/img/logo.webp"alt="logo de la compañia">                           
                                        <h2 id="alert-message"></h2>
                                        <div class="field alert-button btns" >
                                            <button class="delete alert-button" onclick="actionToDo(event)">Aceptar</button>
                                            <button class="alert-button">Cancelar</button>
                                        </div>
                                    </form>
                                </div>
                            </dialog>`;
                        
    const ventana_modal =  `<dialog open="" id="modal-logo" class="modal">
                                <div class="flexbox container-full-alto">
                                    <form method="dialog" class="flexbox" id="modal-form">
                                        <button class="flexbox" id="modal-button-close">
                                                <div class="flexbox column" id="modal-content">
                                                    <h2 class="company-name">NBOX TIME</h2>
                                                    <div class="line line1"><p class="temp">seguridad</p></div>
                                                    <div class="line line2"><p class="temp">confianza</p></div>
                                                    <div class="line line3"><p class="temp">familia</p></div>
                                                    <div class="line line4"><p class="temp">negocio</p></div>
                                                    <div class="line line5"><p class="temp">dinero</p></div>
                                                    <div class="line line6"><p class="temp">felicidad</p></div>
                                                    <div class="line line7"><p class="temp">futuro</p></div>
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
                            
    switch (id) {
        case 'alert-ok':
            document.body.insertAdjacentHTML('beforeend', alert_ok);
            break;
            
        case 'alert-re-confirm':
            document.body.insertAdjacentHTML('beforeend', alert_re_confirm);
            break;

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

        default:
            document.body.insertAdjacentHTML('beforeend', ventana_modal);
    }
}



    // Función para borrar un elemento por su ID 
    function eliminarHTML(id) {
        const elemento = document.getElementById(id);
        if (elemento) elemento.remove();
        else console.warn(`Elemento con ID "${id}" no encontrado.`);
    }


    const showText = (event) => {
        const Element = event.currentTarget;
    
        // Encontrar el input relacionado dentro del mismo contenedor .field
        const field = Element.closest('.field'); // Encuentra el contenedor más cercano con la clase .field
        const input = field.querySelector('input[type="password"], input[type="text"]'); // Selecciona el input en el contenedor
    
        if (input) {
            input.type = input.type === "password" ? "text" : "password";    
            // Alternar las clases 'hidden' entre los dos SVG en el contenedor
            const svgs = field.querySelectorAll('svg.pass-ico');
            svgs.forEach(svg => svg.classList.toggle('hidden'));
        }
    };
    
