// Función para mostrar/ocultar campos dinámicos en el formulario
function check() {
    const sponsorField = document.querySelector('.validate-sponsor.sql');
    const sponsorIdField = document.getElementById('sponsor-id-field');
    const consignmentField = document.querySelector('.validate-type.sql');
    const dynamicField = document.getElementById('dinamic-field');

    // Manejo del campo de patrocinador
    if (sponsorField) {
        if (sponsorField.value === "Patrocinador") {
            sponsorIdField.innerHTML = `<label class="label dinamic-delete" for="contact-bono">ID de su patrocinador:</label>  
                                            <input id="contact-bono" class="sql" type="text" placeholder="Alvarez1" required>`;
        } else {
            sponsorIdField.innerHTML = '';
        }
    }

    // Manejo de campos dinámicos según el tipo de remesa
    if (consignmentField) {
        if (consignmentField.value.includes('efectivo')) {
            dynamicField.innerHTML = `
                <label class="label dinamic-delete" for="remesa-direction">Dirección del beneficiario</label>
                <textarea id="remesa-direction" class="validate-address" rows="5" maxlength="100" placeholder="Municipio, Calle, #" required></textarea>`;
        } else if (consignmentField.value.includes('Transferencia')) {
            dynamicField.innerHTML = `
                <label class="label dinamic-delete" for="remesa-card">Tarjeta</label>
                <input id="remesa-card" class="validate-tel" type="tel" maxlength="16" placeholder="9230045604230957 sin espacios ni '-'" required>`;
        } else {
            dynamicField.innerHTML = '';
        }
    }
}

let formStep = 1;

const navigateSteps = (event, direction, margin, ...validateInputs) => {
    event.preventDefault();

    if (validateStep(...validateInputs)) {
        if (direction === "submit") {
            const actions = {
                "form-user-register": guardarPersona,
                "form-consignment-register": guardarRemesa,
                "login": sendLogin
            };
            actions[document.querySelector("form.validated").id]?.(event);
        } else {
            document.querySelector(".form.validated").style.marginLeft = `-${margin}%`;
            updateProgress(direction.startsWith("next") ? "add" : "remove");
        }
    }
};

const updateProgress = (action) => {
    const bullet = document.querySelectorAll(".bullet");
    const check = document.querySelectorAll(".check");
    const text = document.querySelectorAll(".step p");
    const idx = action === 'add' ? formStep - 1 : formStep - 2;

    bullet[idx]?.classList[action]("active");
    check[idx]?.classList[action]("active");
    text[idx]?.classList[action]("active");
    formStep += action === 'add' ? 1 : -1;
};

const validateStep = (...validateInputs) => {
    const validationConfig = {
        sqlInjectionFilter: /^[^'";]+$/,
        email: { sel: ".validate-email", regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, msg: "Correo inválido." },
        password: { 
            sel: ".validate-password", 
            regex: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/, 
            msg: "La clave debe tener más de 8 caracteres e incluir letras y números." 
        },
        confirmPassword: { 
            sel: ".validate-confirm-password", 
            regex: (confirmElement) => {
                const form = confirmElement.closest("form");
                const passwordInput = form?.querySelector(".validate-password");
                return passwordInput ? new RegExp(`^${passwordInput.value}$`) : /.^/; 
            },
            msg: "Las contraseñas no coinciden."
        },
        name: { sel: ".validate-name", regex: /^[a-zA-ZÀ-ÿ\s]{1,50}$/, msg: "Nombre inválido." },
        dni: { sel: ".validate-dni", regex: /^\d{8,11}$/, msg: "DNI inválido (de 8 a 11 números)." },
        phone: { sel: ".validate-tel", regex: /^\d{8,16}$/, msg: "Número inválido." },
        source: { sel: ".validate-sponsor.sql", regex: /^(Patrocinador|Remesa|Google)$/, msg: "Opción inválida." },
        type: { sel: ".validate-type.sql", regex: /^(USD efectivo|CUP efectivo|Transferencia CUP|Transferencia USD)$/, msg: "Selección inválida." },
        amount: { sel: ".validate-number", regex: /^\d{2,4}$/, msg: "Monto inválido." },
        address: { sel: ".validate-address", regex: /^[a-zA-Z0-9À-ÿ\s,#]{1,200}$/, msg: "Dirección inválida." }
    };

    const container = document.querySelector(".form.validated");
    let allValid = true;

    validateInputs.forEach(input => {
        const { sel, regex, msg } = validationConfig[input] || {};
        const elements = container?.querySelectorAll(sel);

        elements?.forEach(element => {
            clearValidationMessages(element);

            const isEmpty = element.value.trim() === "";
            const dynamicRegex = typeof regex === "function" ? regex(element) : regex;

            // Permitir campos vacíos si `editar` es verdadero
            if (action=="editar" && isEmpty) return;

            const isValid = dynamicRegex.test(element.value) && 
                            (!element.classList.contains("sql") || validationConfig.sqlInjectionFilter.test(element.value));

            if (!isValid) {
                showValidationMessage(element, msg);
                allValid = false;
            }
        });
    });

    return allValid;
};

const showValidationMessage = (inputElement, message) => {
    inputElement.style.borderColor = "var(--alert-color)";
    const errorText = document.createElement("small");
    errorText.classList.add("validation-message");
    errorText.textContent = message;
    inputElement.insertAdjacentElement("afterend", errorText);
};

const clearValidationMessages = (inputElement) => {
    inputElement.style.borderColor = "";
    inputElement.parentElement.querySelectorAll(".validation-message").forEach(msg => msg.remove());
};
