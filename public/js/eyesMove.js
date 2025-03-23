const moveEyes = (event) => {
    const eyeContainer = document.querySelector(".eye-container");
    if (!eyeContainer) return;

    const iris = document.querySelectorAll(".iris");
    const rect = eyeContainer.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const clientX = event.clientX || (event.touches ? event.touches[0].clientX : centerX);
    const clientY = event.clientY || (event.touches ? event.touches[0].clientY : centerY);

    const translateX = Math.round(Math.max(-40, Math.min(40, ((clientX - centerX) / rect.width) * 100)));
    const translateY = Math.round(Math.max(-40, Math.min(40, ((clientY - centerY) / rect.height) * 100)));

    iris.forEach((iris) => { iris.style.setProperty("--translate", `${translateX}%, ${translateY}%`); });
};

const observer = new IntersectionObserver((entries) => {
    entries[0].isIntersecting 
        ? (document.addEventListener("mousemove", moveEyes),
           document.addEventListener("touchmove", moveEyes))
        : (document.removeEventListener("mousemove", moveEyes),
           document.removeEventListener("touchmove", moveEyes));    
}, { threshold: 0.1 });

observer.observe(document.querySelector(".eye-container"));