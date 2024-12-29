// Asegurar que todos los elementos del DOM estén cargados
window.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.card-3d');
    
    const [SHADOW_MAX_OFFSET, BORDER_MAX_SIZE, ROTATION_MAX, SCALE_MAX, ANIMATION_DURATION] = [9, 9, 50, 1.2, '0.3s'];

    function scale(val, inMin, inMax, outMin, outMax) {
        return outMin + (val - inMin) * (outMax - outMin) / (inMax - inMin);
    }

    function handleMove(card, reflection, chip, clientX, clientY) {
        const cardRect = card.getBoundingClientRect();
        const cardCenterX = cardRect.left + cardRect.width / 2;
        const cardCenterY = cardRect.top + cardRect.height / 2;
        const percentX = (clientX - cardCenterX) / (cardRect.width / 2);
        const percentY = (clientY - cardCenterY) / (cardRect.height / 2);

        card.style.zIndex = '10';

        const rotateX = Math.max(-ROTATION_MAX, Math.min(ROTATION_MAX, percentY * 60));
        const rotateY = Math.max(-ROTATION_MAX, Math.min(ROTATION_MAX, -percentX * 60));

        const shadowOffsetX = (rotateY / ROTATION_MAX) * SHADOW_MAX_OFFSET;
        const shadowOffsetY = (rotateX / ROTATION_MAX) * SHADOW_MAX_OFFSET;

        const absX = Math.abs(percentX);
        const absY = Math.abs(percentY);
        const borderSizeX = Math.min(BORDER_MAX_SIZE, absX * BORDER_MAX_SIZE);
        const borderSizeY = Math.min(BORDER_MAX_SIZE, absY * BORDER_MAX_SIZE);

        const relX = (clientX - cardRect.left) / cardRect.width;
        const relY = (clientY - cardRect.top) / cardRect.height;
        const lightX = scale(relX, 0, 1, 150, -50);
        const lightY = scale(relY, 0, 1, 30, -100);
        const lightConstrain = Math.min(Math.max(relY, 0.3), 0.7);
        const lightOpacity = scale(lightConstrain, 0.3, 1, 1, 0) * 255;
        const lightShade = `rgba(${lightOpacity}, ${lightOpacity}, ${lightOpacity}, 1)`;
        const lightShadeBlack = `rgba(0, 0, 0, 1)`;

        reflection.style.backgroundImage = `radial-gradient(circle at ${lightX}% ${lightY}%, ${lightShade} 50%, ${lightShadeBlack})`;

        if (chip) {
            chip.style.backgroundImage = `linear-gradient(138deg, rgba(${lightOpacity}, ${lightOpacity}, ${lightOpacity}, .6), ${lightShade} 40%, rgba(${lightOpacity}, ${lightOpacity}, ${lightOpacity}, 0.3))`;
        }

        if (absX > absY) {
            card.style.borderTop = card.style.borderBottom = '0px solid black';
            card.style.borderLeft = percentX < 0 ? `${borderSizeX}px solid black` : '0px solid black';
            card.style.borderRight = percentX > 0 ? `${borderSizeX}px solid black` : '0px solid black';
        } else {
            card.style.borderLeft = card.style.borderRight = '0px solid black';
            card.style.borderTop = percentY < 0 ? `${borderSizeY}px solid black` : '0px solid black';
            card.style.borderBottom = percentY > 0 ? `${borderSizeY}px solid black` : '0px solid black';
        }

        card.style.transform = `perspective(1000px) scale3d(${SCALE_MAX}, ${SCALE_MAX}, ${SCALE_MAX}) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        card.style.boxShadow = `${shadowOffsetX}px ${shadowOffsetY}px 10px rgba(68, 68, 68, 0.6)`;
    }

    function handleInteraction(event, card, reflection, chip) {
        const clientX = event.touches ? event.touches[0].clientX : event.clientX;
        const clientY = event.touches ? event.touches[0].clientY : event.clientY;

        handleMove(card, reflection, chip, clientX, clientY);
        card.style.animation = 'none';
        reflection.style.opacity = 1;
    }

    function handleLeave(card, reflection, chip) {
        card.style.zIndex = '0';
        card.style.transition = `all ${ANIMATION_DURATION} ease-out`;
        card.style.transform = 'perspective(1000px) scale3d(1, 1, 1) rotateX(0) rotateY(0)';
        card.style.boxShadow = '4px 5px 13px rgba(0, 0, 0, 0.2)';
        card.style.border = '1px solid black';
        reflection.style.opacity = 0;
        if (chip) {
            chip.style.backgroundImage = '';
        }
        card.style.animation = 'rotate3dAnimation 6s ease-in-out infinite';
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const card = entry.target;
                const chipElement = card.querySelector('.chip');
                const reflection = card.querySelector('.reflection');

                // Manejar 'touchstart' y 'touchmove' con preventDefault
                card.addEventListener('touchstart', (event) => {
                    event.preventDefault(); // Prevenir el desplazamiento al iniciar el toque
                }, { passive: false });

                card.addEventListener('mousemove', (event) => handleInteraction(event, card, reflection, chipElement));

                card.addEventListener('touchmove', (event) => {
                    event.preventDefault(); // Prevenir desplazamiento en 'touchmove'
                    handleInteraction(event, card, reflection, chipElement);
                }, { passive: false });

                card.addEventListener('mouseleave', () => handleLeave(card, reflection, chipElement));
                card.addEventListener('touchend', () => handleLeave(card, reflection, chipElement));
            }
        });
    }, { threshold: 0.1 });

    cards.forEach((card) => {
        card.insertAdjacentHTML('afterbegin', '<div class="reflection"></div>');
        observer.observe(card);
    });
});
