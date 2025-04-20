// ---------------------- Carga y procesamiento de datos ---------------------
document.addEventListener('DOMContentLoaded', async () => { 
   refreshBackoffice('pedidos');
});

//global variables
const tabTrigger = document.querySelector('#tab-trigger');
const payTrigger = document.querySelector('#pay-trigger');
const table = document.querySelector('.tabs-content');

// -------------------------------- Backoffice tablas ----------------------------
// Solicitar data backend de las tablas 
const showTable = async (event) =>{
    switch (event.target.id){
     case 'show-users': 
        await solicitarData('usuarios');         
        break;
     case 'show-consignment': 
        await solicitarData('pedidos');                  
        break;
     default : return;
    }
    alternateTab([tabTrigger],[payTrigger],'active'); 
    await showTab(); 
    setTimeout(() =>  table.scrollIntoView({behavior: 'smooth', block: 'center', inline: 'center'}),800);
    // if(!(table.classList.value.includes('toLeft'))) table.classList.add('toLeft');
 }; 

const showTab= async ()=> {
    alternateTab([tabTrigger],[payTrigger],'active');
    table.classList.add('toLeft');
    setTimeout(() => {alternateTab(document.querySelectorAll('.json-section'),false,'hidden')},800);
    await imprimirDatos(tableDatos.tableName);
    await estadistica(tableDatos.tableName);
};

const showPay = async () => {
    alternateTab([payTrigger],[tabTrigger],'active');    
    table.classList.remove('toLeft');
    alternateTab(false,document.querySelectorAll('.json-section'),'hidden');
    // const data = await solicitud('GET', 'pagos');
    // if (data) renderContainer(data);
    // else console.error('No se pudo obtener datos de la solicitud.');
};

const alternateTab = (activate, deactivate, toggleClass) => {
    if (activate)
    activate.forEach(element => { element.classList.contains(toggleClass) ? null : element.classList.add(toggleClass); });
    if (deactivate)
    deactivate.forEach(element => { element.classList.contains(toggleClass) ? element.classList.remove(toggleClass) : null; });
};


// ---------------------- Funciones genérica para imprimir json en el dom ---------------------
const smartCard = (...contents) => {
    const section = document.querySelector(".insert");
    section.innerHTML = "";
    contents.forEach(content => {
        const html = `
            <div class="card-office">
                <div class="card-office-header">
                    <span class="card-office-title">${content.text}:</span>
                    <span class="card-office-value">${content.value}</span>
                </div>
            </div>`;
        section.innerHTML += html;
    });
};

const renderContainer = (data) => {
    const container = document.querySelector('#pagos-container');
    container.innerHTML = '';
    container.innerHTML = Object.entries(data).map(([key, values]) => 
        `<div class="card">
            <h3 class="global-h">${key.toUpperCase()}</h3>
                <div class="card-sub-items">
                 ${Object.entries(values).map(([subKey, value]) => 
                    `<div class="card-item">
                        <strong>${subKey}:</strong> 
                        <span>${value}</span>
                     </div>`).join('')}
                </div>
        </div>`).join('');
};


// --------------------------- FUnciones de estadisticas --------------------------------
// Cálculo del total enviado
const calcularTotalEnviado = (data) => {
    const total = data
        .filter(remesa => remesa.Estado === "Completada")
        .reduce((total, remesa) => total + remesa.Monto, 0);
    return [{ value: `$${total.toFixed(2)}`, text: "Total enviado" }];
};

// Contar remesas enviadas y pendientes
const contarRemesas = (data) => {
    const enviadas = data.filter(remesa => remesa.Estado === "Completada").length;
    const pendientes = data.filter(remesa => remesa.Estado === "Pendiente").length;
    return [
        { value: enviadas, text: "Remesas enviadas" },
        { value: pendientes, text: "Remesas pendientes" }
    ];
};

// Calcular porcentaje de remesas completadas
const calcularPorcentajeCompletadas = (data) => {
    const totalRemesas = data.length;
    const completadas = data.filter(remesa => remesa.Estado === "Completada").length;
    const porcentaje = totalRemesas > 0 ? (completadas / totalRemesas) * 100 : 0;
    return [{ value: `${porcentaje.toFixed(1)}%`, text: "Transacciones completadas" }];
};

// Calcular distribución por tipo de remesa
const calcularDistribucionPorTipo = (data) => {
    const distribucion = data.reduce((acc, remesa) => {
        acc[remesa.Tipo] = (acc[remesa.Tipo] || 0) + 1;
        return acc;
    }, {});
    return Object.entries(distribucion).map(([tipo, cantidad]) => ({
        value: cantidad,
        text: `Remesas tipo ${tipo}`
    }));
};

// Calcular los principales clientes por monto total
const calcularTopClientes = (data) => {
    const montosPorCliente = data.reduce((acc, remesa) => {
        const nombreCompleto = `<strong class='value'>${remesa.Nombre}</strong> remeso a <strong class='value'>${remesa.Titular}</strong>`;
        acc[nombreCompleto] = (acc[nombreCompleto] || 0) + remesa.Monto;
        return acc;
    }, {});

    const topClientes = Object.entries(montosPorCliente)
        .sort(([, montoA], [, montoB]) => montoB - montoA)
        .slice(0, 5);
    return topClientes.map(([nombreCompleto, monto]) => ({
        value: `$${monto.toFixed(2)}`,
        text: `Cliente ${nombreCompleto} por valor de`
    }));
};