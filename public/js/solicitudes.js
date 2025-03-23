// ===============================================================================================
// ============================ Funciones Globales para enviar solicitudes =======================
// ===============================================================================================

//Variables globales
let tableDatos = [], indice = 0, entradastoshow = 10, action='inicial', idActual='inicial', isTutorial = false;

// Cargar texto en modal que funciona como notificación.
const notificacionFront = (data) => {
    const modal = document.querySelector('.tuto-modal');
    const title = document.getElementById('modalTitle');
    const content = document.getElementById('modalContent');
    const imagen = document.querySelector('#tuto-img');
    const overlay = document.querySelector('.overlay');
    const button = document.querySelector('.tuto-btn');
    const alertSection = document.querySelector('.alert-section');

    isTutorial = false;
    button ? button.classList.add('hidden'):null;
    
    
    action =='delete' ? alertSection? alertSection.classList.remove('hidden'):null
                      : alertSection? alertSection.classList.add('hidden'):null;
    // Manejar imagen
    data.img ? (imagen.src = data.img,modal.classList.add('comprobante-img'),imagen.style.opacity='1') 
             : 'public/img/logo.webp';
    // Al ser redireccionado esconder la ventana
    data.redirectUrl && setTimeout(() => { closeNotification(); window.location.href = data.redirectUrl; }, 3000);
    // Actualizar contenido modal
    data.message ? (content.textContent = data.message, title.textContent = 'Notificación')
                 : (content.classList.add('hidden'), title.classList.add('hidden'));
    // Activar modal y overlay
    modal.style.setProperty('--inset', '0% 0% 0% 0%');
    modal.classList.add('firstplane', 'active');
    overlay.classList.add('thirdplane', 'active');
    // Llamar a `refreshBackoffice` si es necesario
    document.title === 'Nbox Time-Backoffice' && data.tableName && refreshBackoffice(data.tableName);
};
 const closeNotification=()=>{
    if(!isTutorial){
    const modal = document.querySelector('.tuto-modal');
    const title = document.getElementById('modalTitle');
    const content = document.getElementById('modalContent');
    const overlay = document.querySelector('.overlay');
    const button = document.querySelector('.tuto-btn');
    const alertSection = document.querySelector('.alert-section');
    const imagen = document.querySelector('#tuto-img');

    alertSection? alertSection.classList.add('hidden'):null;
    overlay.classList.remove('thirdplane', 'active');
    modal.classList.remove('firstplane', 'active');
    setTimeout(() =>{
    title.textContent = 'Notificacion Nbox:'
    content.textContent = 'Nada nuevo para mostrar'; 
    content.classList.remove('hidden');
    title.classList.remove('hidden');       
    button.classList.remove('hidden');
    imagen.src = 'public/img/logo.webp';
    imagen.style.opacity='.15'
    modal.classList.remove('comprobante-img')
    },500);}
}

// Procesamiento antes de llamar métodos de solicitudes al servidor
function solicitarDelete(e) { 
    idActual = e.target.classList[0];
    const data = { message: '¿Seguro que deseas eliminar del registro?' };
    action = 'delete';
    notificacionFront(data);   
}

function solicitarEdit(e) {
    idActual = e.target.classList[0];
    if (tableDatos.tableName == 'usuarios') lanzarModal('user-edit'); 
    else if (tableDatos.tableName == "pedidos") lanzarModal('consignment-edit'); 
    action = 'editar';    
}

function confirmacionPago(e) {
    idActual = e.target.classList[0];
    const data = { message: 'Usted esta a punto de confirmar que se recibió el pago.¿Está seguro?' };
    alertSection.classList.remove('hidden');
    notificacionFront(data);
    action = 'confirmar-pago';
}

// Funciones que envían solicitudes POST GET PUT DELETE

function actionToDo(e) { // Obtener confirmación para borrar o confirmar entrega
    bandera = action;
    action= 'inicial';
    bandera == 'delete' ? solicitud('DELETE', 'delete', { id: idActual }) 
                       : solicitud('PATCH', 'confirm', { id: idActual });  
}

function editFrom_DB(e) { // Abrir ventana modal para editar
    const id = e.target.classList[0];
    solicitud('PUT','edit', {id});
}

function confirmar(e) {
    const id = e.target.classList[0];
    solicitud('PATCH','confirm', {id});
}
function showPic (e){
    const id = e.target.classList[0];
    solicitud('POST','comprobante', {id});
}
function uploadImg(e) {
    const file = e.target.files[0];
    if (!file) { alert('No se seleccionó ningún archivo');  return; }
    // Validar tamaño del archivo (3 MB máximo)
    const maxSize = 3 * 1024 * 1024; // 3 MB en bytes
    if (file.size > maxSize) {
        const data = { message: 'Tamaño superior a 3 MB o formato no permitido' };
        notificacionFront(data);
        return;
    }
    // Validar formato del archivo (solo imágenes permitidas)
    const MimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!MimeTypes.includes(file.type)) {
        const data = { message: 'Tamaño superior a 3 MB o formato no permitido' };
        notificacionFront(data);
        return;
    }
    // Crear FormData y agregar el archivo y la clase
    const className = e.target.classList[0];    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('className', className); // Agregar la clase como variable adicional
    // Verificar contenido del FormData
    console.log('Contenido del FormData:');
    for (let [key, value] of formData.entries()) {
        console.log(key, value);
    }
    // Enviar la solicitud al backend
    solicitud('POST', 'upload', formData, null);
}


// ==============================================================================
// ================================ Métodos =====================================
// ==============================================================================


// funcion generica para hacer solicitudes GET, POST, PUT, PATCH y enviar notificacion
async function solicitud(method, ruta, objeto = null, contentType = 'application/json') {
    const options = {
        method,
        headers: contentType ? { 'Content-Type': contentType } : undefined,
        body: method !== 'GET' && objeto ? (contentType ? JSON.stringify(objeto) : objeto) : undefined
    };
    console.log("📌 Objeto enviado:", objeto);
    
    try {
        const response = await fetch(`/${ruta}`, options);
        const responseType = response.headers.get('Content-Type');
        let data = null;

        // Manejar respuesta de imagen directa
        if (responseType?.startsWith('image/')) {
            const blob = await response.blob();
            data = { 
                img: URL.createObjectURL(blob),
            };
            notificacionFront(data);
            return data;
        }
        
        // Manejar JSON
        if (responseType?.includes('application/json')) {
            data = await response.json();
            if (data.message || data.img) notificacionFront(data);
        } else {
            window.location.href = `/${ruta}`;
        }

        console.log('✅ Datos obtenidos:', data);
        return data;
    } catch (error) {
        console.error('❌ Error en solicitud:', error);
        throw error;
    }
}


//_________________________________MANEJO DE TABLA_____________________________________

// Función para solicitar datos del backend
const solicitarData = async (tableName) => {
    try {
        const response = await fetch(`/show?table=${tableName}`);
        const result = await response.json();
        console.log('Respuesta del backend:', result);
        
        // Verificar si la respuesta contiene `tableData` con estructura válida
        if (result.data && !Array.isArray(result.data)) {
            result.message = 'Ocurrió un problema sin definir al procesar la solicitud.';
            notificacionFront(result);
        }
            
        // Guardar el objeto completo del backend en `tableDatos`
        tableDatos = result;      
     
    } catch (error) {
        console.error('Error al obtener los datos:', error);
    }
};

const estadistica = async (tableName) => {
    // Verificar si `tableDatos` está vacío o no tiene datos
    if (!tableDatos.data || tableDatos.data.length === 0) { await solicitarData(tableName); }

    if (tableName == 'pedidos'){
        const data = tableDatos.data;
        const totalEnviado = calcularTotalEnviado(data);
        const remesas = contarRemesas(data);
        const porcentajeCompletadas = calcularPorcentajeCompletadas(data);
        const distribucionPorTipo = calcularDistribucionPorTipo(data);
        const topClientes = calcularTopClientes(data);

        // Generar el contenido HTML
        smartCard(...totalEnviado,...remesas,...porcentajeCompletadas,...distribucionPorTipo,...topClientes );
    }else if (tableName == 'usuarios'){   console.log('estadisticas usuarios');   }
};

// Función para renderizar datos en la tabla 
const imprimirDatos = async (tableName = 'pedidos') => {
    const data = tableDatos.data;
    const userRole = tableDatos.userRole;
    
    if (!tableDatos.data) notificacionFront(tableDatos);
    
    if (tableDatos.data.length === 0 || !tableDatos.data) {
        const table = document.getElementById('tablas');
        table.innerHTML = `<h4>Aquí aparecerá una tabla detallada con las operaciones que realices con nosotros. Por ahora no hay ${tableDatos.tableName} que mostrar 
                           <div id="tables-container" class="tablas-dinamicas">`;
    } else {
        const columnasVisibles = ['Nombre', 'Titular', 'Monto', 'Cliente', 'Gestor', 'Estado', 'Acciones', 'Rol', 'Email','Carnet','Bono','Telefono',];

        // Construcción de encabezados
        const tableHeaders = Object.keys(data[0])
            .filter(key => key !== 'protectedId')
            .map(key => {
                const hiddenClass = columnasVisibles.includes(key) ? '' : 'details hidden';
                return `<th class="${hiddenClass}">${key}</th>`;
            })
            .join('');

        const headerRow = `<tr>${tableHeaders}<th>Acciones</th></tr>`;

        // Construcción de filas de datos
        const tableRows = data.slice(indice, indice + entradastoshow).map(row => {
            const botones = generarBotonesProceso(row, userRole);
            const rowData = Object.keys(row)
                .filter(key => key !== 'protectedId')
                .map(key => {
                    const hiddenClass = columnasVisibles.includes(key) ? '' : 'details hidden';
                    return `<td class="${hiddenClass}">${row[key]}</td>`;
                }).join('');

            const accionesCell = `<td>
                                    <div style="display: flex; gap: 10px;">
                                        <button class="${row.protectedId} page-button action-edit" onclick="solicitarEdit(event)">Editar</button>
                                        <button class="${row.protectedId} page-button action-delete" onclick="solicitarDelete(event)">Eliminar</button>
                                    </div>
                                </td>`;
            return `<tr>${rowData}${accionesCell}</tr>`;
        }).join('');   

        // Contenedor de la tabla
        const tableContainer = document.getElementById('tablas');
        tableContainer.innerHTML = `<div class="card-office-title">Historial de ${tableDatos.tableName}</div>                                    
                                    <div id="tables-container" class="tablas-dinamicas table-adaptative">
                                        <table>
                                            <thead>${headerRow}</thead>
                                            <tbody>${tableRows}</tbody>
                                        </table>
                                    </div>`;

        // Controles adicionales
        actualizarControles(data, tableName);
        estadistica(tableName); 
    }
};

const detailsColumnVisibility = () => {
    document.querySelectorAll('.details').forEach(element => { element.classList.toggle('hidden'); });
    document.getElementById('tables-container').classList.toggle('table-adaptative');           
};

// Función para generar botones según el rol
const generarBotonesProceso = (row, userRole) => {
    if(tableDatos.tableName != 'pedidos') return;
    switch (`${row.Cliente}-${row.Gestor}-${row.Estado}`){
        case `Pendiente-Pendiente-${row.Estado}`:
            (userRole == 'Cliente' || userRole == 'Admin') 
                    ? row.Cliente =`<label for="file-input-${row.protectedId}" class="page-button process">📥 Subir Foto</label>
                                    <input class="${row.protectedId} hidden" id="file-input-${row.protectedId}" type="file" name="file" onchange="uploadImg(event)"/>`
                    : row.Cliente =`${row.Cliente}`;  
            row.Gestor = `${row.Gestor}`;
            return row;
        case `Comprobante Subido-Pendiente-Pendiente`:
            (userRole == 'Cliente' || userRole == 'Admin' || userRole == 'Procesador')  
                    ? row.Cliente =  `<button class="${row.protectedId} page-button process" onclick="showPic(event)">Ver Comprobante</button>`
                    : `${row.Cliente}`;  
            (userRole == 'Procesador' || userRole == 'Admin')         
                    ? row.Gestor = `<button class="${row.protectedId} page-button process" onclick="confirmar(event)">Confirmar</button>`
                    : row.Gestor =  `${row.Gestor}`;  
            return row;
        case `Comprobante Subido-Pendiente-Pagado`:
            (userRole == 'Cliente' || userRole == 'Admin' || userRole == 'Procesador')  
                    ? row.Cliente =  `<button class="${row.protectedId} page-button process" onclick="showPic(event)">Ver Comprobante</button>`
                    : `${row.Cliente}`;  
            (userRole == 'Admin')         
                    ? row.Gestor = `<button class="${row.protectedId} page-button process" onclick="confirmar(event)">Confirmar</button>`
                    : 
            (userRole == 'Procesador')         
                    ? row.Gestor = `Procesado`
                    : 
            (userRole == 'Gestor')         
                    ? row.Gestor = `<button class="${row.protectedId} page-button process" onclick="confirmar(event)">Confirmar</button>`
                    : row.Gestor =  `${row.Gestor}`; 
            return row; 
        case `Comprobante Subido-Completado-${row.Estado}`:
            (userRole == 'Cliente' || userRole == 'Admin') 
                    ? row.Cliente =  `<button class="${row.protectedId} page-button process" onclick="confirmar(event)">Confirmar</button>`
                    : row.Cliente =`${row.Cliente}`;  
            row.Gestor = `${row.Gestor}`;
            return row;   
        case `Completado-Completado-${row.Estado}`:
            row.Cliente = `${row.Cliente}`;
            row.Gestor =  `${row.Gestor}`;  
            return row;
    }
    
};

// Función para actualizar controles de navegación y filtrado
const actualizarControles = (data, tableName) => {
    const botonesFiltrado = `
        <div class="filtred-navigation">      
            <select id="filterKey" onchange="displaySelectedOption()">
                ${Object.keys(data[0]).slice(0, -1).map(key => `<option value="${key}">${key}</option>`).join('')}
            </select>
            <input type="text" id="filterValue" placeholder="🔍..buscar" oninput="debouncedFilter('${tableName}')">
            <button class="table-navigation" onclick="applyFilter('${tableName}')">Filtrar</button> 
            <button onclick="detailsColumnVisibility()" class="table-navigation">Detalles</button>                        
        </div>`;
    const botonesNavegacion = `
        <div class="navigation"> 
            <button class="table-navigation" onclick="cambiarPagina(-1, '${tableName}')">Anterior</button>
            <button class="table-navigation" onclick="cambiarPagina(1, '${tableName}')">Siguiente</button>
        </div>`;

    const tableContainer = document.getElementById('tables-container');
    const filter = document.querySelector('.filtred-navigation');
    const navigation = document.querySelector('.navigation');

    filter?.remove();
    navigation?.remove();

    tableContainer.insertAdjacentHTML('beforebegin', botonesFiltrado);
    tableContainer.insertAdjacentHTML('afterend', botonesNavegacion);
};

const displaySelectedOption = () => {
    const select = document.getElementById('filterKey');
    select.setAttribute('title', select.options[select.selectedIndex].text);
};

// --------cambiar paginas-------
const cambiarPagina = (direccion, tableName) => {
    const nuevoIndice = indice + direccion * entradastoshow;

    if (nuevoIndice >= 0 && nuevoIndice < tableDatos.data.length) {
        indice = nuevoIndice; 
        imprimirDatos(tableName);
    } else {
        notificacionFront({ message: direccion > 0? 'No hay más datos para mostrar.': 'Estás en la primera página.', });
    }
};

// --------------- filtros -------------
const applyFilter = (tableName) => {
    const filterKey = document.getElementById('filterKey').value.trim();
    const filterValue = document.getElementById('filterValue').value.trim().toLowerCase();

    if (!filterKey || !filterValue) { notificacionFront({ message: 'Ingrese un valor válido para filtrar.' });
        return;
    }
    // Filtrar directamente en `tableDatos.data`
    const filteredData = tableDatos.data.filter(row =>
        String(row[filterKey]).toLowerCase().includes(filterValue)
    );

    if (filteredData.length === 0) { notificacionFront({ message: 'No hay coincidencias.' });
        return;
    }

    // Actualizar índice y mostrar datos filtrados
    indice = 0;
    const originalData = tableDatos.data;
    tableDatos.data = filteredData;
    imprimirDatos(tableName);
    tableDatos.data = originalData;
};

// ----------tiempo de demora-------
let debounceTimer;
const debouncedFilter = (tableName) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => applyFilter(tableName), 2000);
};

const refreshBackoffice = async (tableName) => {
    await solicitarData(tableName);
    if (!tableName.message){
        await imprimirDatos(tableName);
        await estadistica(tableName);
        await renderContainer(await solicitud('GET', 'pagos'));
    }
}