// Subfunciones del tutorial
const tutoTables = async ()=>{
    showTab();
    lanzarModal('tutorial-table'); 
    document.querySelector('.tabs-list').scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });   
 }

// Variable global para almacenar los pasos del tutorial y el paso actual
let tutorial = {
    step: 0, // Paso actual
    steps: [
        {title: '¡Bienvenido a Nbox Time! 🎉', content: 'Te guiaremos paso a paso para que domines nuestro sistema de remesas. ¡Comencemos!', inset: '0% 0% 0% 0%',action: ()=>{isTutorial=true;}},
        {title: 'Tu Centro de Control 🎛️', content: 'Aquí gestionarás todas tus remesas. Cada fila representa una transacción con su estado actual.', inset: '0% 0% 60% 0%', action: tutoTables},
        {title: 'Métodos de Pago 💳', content: 'Revisa las opciones disponibles. Selecciona el que mejor se adapte a tus necesidades.', inset: '0% 0% 60% 0%', focusSection: '.json-section', action: showPay},
        {title: 'Menú de Navegación 🗂️', content: 'Despliega el menú de servicios para acceder a las diferentes opciones disponibles.', inset: '60% 0% 0% 0%', focusSection: '.menu', action: showMenu},
        {title: 'Acceso Restringido 🔒', content: 'No te preocupes si no puedes acceder a algunas áreas,están disponibles solo para administradores.', inset: '60% 0% 0% 0%'},
        {title: 'Crear una Nueva Remesa ✈️', content: 'Selecciona "Nueva Remesa" en el menú principal.', inset: '60% 0% 0% 0%'},
        {title: 'Completar los Datos 📝', content: 'Ingresa la información requerida, como el monto y los detalles del destinatario.', inset: '60% 0% 0% 0%'},
        {title: 'Ver Lista de Pedidos 📋', content: 'Accede a la sección "Ver lista de Pedidos" para revisar los métodos de pago disponibles.', inset: '60% 0% 0% 0%',focusSection: '.json-section', action: showPay},
        {title: 'Realizar la Transferencia 💸', content: 'Haz una transferencia que coincida con el monto declarado en la remesa.', inset: '60% 0% 0% 0%'},
        {title: 'Tomar Captura de Pantalla 📸', content: 'Toma una captura de pantalla del comprobante de transferencia.', inset: '60% 0% 0% 0%'},
        {title: 'Subir el Comprobante ⬆️', content: 'Sube el comprobante de pago en la plataforma.', inset: '60% 0% 0% 0%',focusSection: '.menu', action: tutoTables},
        {title: 'Estado: Procesando ⏳', content: 'Una vez detectado tu pedido y subido el comprobante, tu remesa estará en estado "Procesando".', inset: '60% 0% 0% 0%'},
        {title: 'Gestión del Pedido 👨‍💼', content: 'Un gestor ejecutará tu pedido y contrastará la transferencia con el monto declarado.', inset: '60% 0% 0% 0%'},
        {title: 'Entrega del Dinero 💵', content: 'El gestor hará llegar el dinero a tu familiar y actualizará el estado de la remesa.', inset: '60% 0% 0% 0%'},
        {title: 'Seguimiento en Tiempo Real 🕒', content: 'Observa el estado de cada remesa en todo momento:\n🟢 Completada\n🟡 En Proceso\n🔴 Pendiente', inset: '0% 0% 0% 0%'},
        {title: 'Confirmar Recepción ✅', content: 'Una vez que verifiques que recibiste el dinero, confirma la recepción para marcar la remesa como completada.', inset: '0% 0% 0% 0%'},
        {title: '¡Eres un Experto! 🚀', content: '¡Felicidades! Ahora dominas nuestro sistema. ¿Listo para tu primera remesa?', inset: '0% 0% 0% 0%',  action: async()=>{isTutorial=false;await showPay();}}
    ]
};

const showModal = async () => {
    closeMenu();
    const modal = document.querySelector('.tuto-modal');
    const step = tutorial.steps[tutorial.step];
 
    // Actualizar contenido modal
    document.getElementById('modalTitle').textContent = step.title;
    document.getElementById('modalContent').textContent = step.content;
    modal.style.setProperty('--inset', step.inset);        
    // Activar modal y overlay
    modal.classList.add('firstplane', 'active');
    document.querySelector('.overlay').classList.add('thirdplane', 'active');

    //Ejecutar funcion extra si fuera necesario
    if (step.action) await step.action();   

    // Enfocar un objeto si se requiere
    if (step.focusSection) {
        const elements = document.querySelectorAll(step.focusSection);
        if (step.focusSection == '.menu')document.querySelector('header').classList.add('firstplane');
        if (elements.length > 0) {
            elements.forEach(e => e.classList.add('focusSection', 'secondplane'));
            elements[0].scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        }
    }

}

const nextModal = () => {
    const modal = document.querySelector('.tuto-modal');
    const currentStepData = tutorial.steps[tutorial.step];
    
    // Resetear focusSection del paso actual
    if (currentStepData?.focusSection) {
        document.querySelectorAll(currentStepData.focusSection).forEach(e => e.classList.remove('focusSection', 'secondplane'));
    }
    document.querySelector('header').classList.remove('firstplane');
    // Transición al siguiente paso
    modal.classList.remove('firstplane', 'active');
    setTimeout(() => {
        tutorial.step++;
        if (tutorial.step < tutorial.steps.length) {
            showModal();
        } else {
            document.querySelector('.overlay').classList.remove('thirdplane', 'active');
            tutorial.step = 0; // Reiniciar tutorial
        }
    }, 300);
}

// Iniciar tutorial
const generarTutorial = () => {
    tutorial.step = 0; // Reiniciar paso actual
    showModal();
}

