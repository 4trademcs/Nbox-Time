const moveEyes =(event)=> {
    const eyeContainer = document.querySelector(".eye-container");
    const eyes = document.querySelectorAll(".eye");
    // Obtener las dimensiones del contenedor de los ojos
    const rect = eyeContainer.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    // Obtener la posición del puntero (mouse o touch)
    const clientX = event.clientX || event.touches[0].clientX;
    const clientY = event.clientY || event.touches[0].clientY;
    // Calcular el desplazamiento en porcentaje y acotar
    const translateX = Math.round(Math.max(-40, Math.min(40, ((clientX - centerX) / rect.width) * 100)));
    const translateY = Math.round(Math.max(-40, Math.min(40, ((clientY - centerY) / rect.height) * 100)));
    // Actualizar las variables CSS para cada ojo
    eyes.forEach((eye) => {
        eye.style.setProperty("--translateX", `${translateX}%`);
        eye.style.setProperty("--translateY", `${translateY}%`);
    });
}
// Escuchar eventos de mouse y touch
document.addEventListener("mousemove", moveEyes);
document.addEventListener("touchmove", moveEyes);