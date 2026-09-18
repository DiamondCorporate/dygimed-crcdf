document.addEventListener("DOMContentLoaded", () => {
  const overlay = document.getElementById("modal-overlay");
  const triggers = document.querySelectorAll(".bullet--interactive");
  const modals = document.querySelectorAll(".modal-card");
  const closeButtons = document.querySelectorAll(".modal-close-btn");
  const planLinks = document.querySelectorAll("[data-plan]");
  const planSelect = document.getElementById("plano_interesse");
  const leadForm = document.getElementById("lead-form");
  const phoneInput = document.getElementById("whatsapp");
  const emailInput = document.getElementById("email");
  const crcInput = document.getElementById("registro_crc");
  const submitButton = leadForm?.querySelector("button[type='submit']");
  const submitLabel = submitButton?.querySelector(".submit-label");
  const formStatus = document.getElementById("form-status");

  function closeAllModals() {
    modals.forEach((modal) => {
      modal.classList.remove("is-active");
      modal.setAttribute("aria-hidden", "true");
    });
    overlay.classList.remove("is-active");
    document.body.classList.remove("modal-open");
  }

  function openModal(modalId) {
    const targetModal = document.getElementById(modalId);
    if (!targetModal) return;
    closeAllModals();
    overlay.classList.add("is-active");
    targetModal.classList.add("is-active");
    targetModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  }

  triggers.forEach((trigger) => trigger.addEventListener("click", () => openModal(trigger.dataset.modal)));
  closeButtons.forEach((button) => button.addEventListener("click", closeAllModals));
  overlay.addEventListener("click", closeAllModals);
  document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeAllModals(); });

  document.querySelectorAll(".modal-card a[href='#cadastro']").forEach((link) => link.addEventListener("click", closeAllModals));

  planLinks.forEach((link) => link.addEventListener("click", () => {
    if (planSelect) planSelect.value = link.dataset.plan;
  }));

  /**
   * Mantém o prefixo brasileiro fixo e formata o número como
   * +55 (DDD) 99999-9999 durante a digitação.
   */
  function getBrazilianPhoneDigits(value) {
    const rawValue = String(value || "");
    let digits = rawValue.replace(/\D/g, "");

    if (/^\s*\+55/.test(rawValue) || (digits.length > 11 && digits.startsWith("55"))) {
      digits = digits.slice(2);
    }

    return digits.slice(0, 11);
  }

  function formatBrazilianPhone(value) {
    const digits = getBrazilianPhoneDigits(value);
    const areaCode = digits.slice(0, 2);
    const localNumber = digits.slice(2);
    let formatted = "+55";

    if (digits.length > 0) formatted += ` (${areaCode}`;
    if (digits.length >= 2) formatted += ")";
    if (localNumber.length > 0) {
      const firstBlockSize = digits.length === 11 ? 5 : 4;
      const firstBlock = localNumber.slice(0, firstBlockSize);
      const secondBlock = localNumber.slice(firstBlockSize, firstBlockSize + 4);
      formatted += ` ${firstBlock}`;
      if (secondBlock) formatted += `-${secondBlock}`;
    }

    return formatted === "+55" ? "+55 " : formatted;
  }

  function placeCursorAtEnd(input) {
    requestAnimationFrame(() => input.setSelectionRange(input.value.length, input.value.length));
  }

  function setFieldState(input, message = "") {
    const field = input.closest(".form-field");
    const error = field?.querySelector(".field-error");
    if (!field || !error) return !message;

    const hasError = Boolean(message);
    field.classList.toggle("has-error", hasError);
    field.classList.toggle("has-success", !hasError && input.value.trim() !== "");
    input.setAttribute("aria-invalid", String(hasError));
    error.textContent = message;
    return !hasError;
  }

  function validateName(input) {
    const value = input.value.trim();
    if (!value) return setFieldState(input, "Informe seu nome completo.");
    if (value.length < 3) return setFieldState(input, "Digite pelo menos 3 caracteres.");
    return setFieldState(input);
  }

  function validatePhone(input) {
    const digits = getBrazilianPhoneDigits(input.value);
    if (digits.length !== 11) {
      return setFieldState(input, "Informe um celular válido com DDD e 9 dígitos.");
    }
    return setFieldState(input);
  }

  function validateEmail(input) {
    const value = input.value.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!value) return setFieldState(input, "Informe seu e-mail.");
    if (!emailPattern.test(value) || !input.validity.valid) {
      return setFieldState(input, "Digite um e-mail válido, como nome@empresa.com.br.");
    }
    return setFieldState(input);
  }

  function validateCrc(input) {
    const value = input.value.trim().toUpperCase();
    const allowedCharacters = /^[A-Z0-9.\-/\s]+$/;
    input.value = value;

    if (!value) return setFieldState(input, "Informe seu registro profissional no CRC.");
    if (value.length < 4 || !/\d/.test(value) || !allowedCharacters.test(value)) {
      return setFieldState(input, "Confira o registro. Exemplo: DF-012345/O-0.");
    }
    return setFieldState(input);
  }

  function validateSelect(input) {
    if (!input.value) return setFieldState(input, "Selecione uma opção.");
    return setFieldState(input);
  }

  function validateConsent(input) {
    if (!input.checked) return setFieldState(input, "É necessário autorizar o contato.");
    return setFieldState(input);
  }

  function validateForm() {
    const validators = [
      [document.getElementById("nome"), validateName],
      [phoneInput, validatePhone],
      [emailInput, validateEmail],
      [crcInput, validateCrc],
      [document.getElementById("associado_crcdf"), validateSelect],
      [document.getElementById("consentimento"), validateConsent],
    ];

    let firstInvalidField = null;
    validators.forEach(([input, validator]) => {
      if (!input) return;
      const isValid = validator(input);
      if (!isValid && !firstInvalidField) firstInvalidField = input;
    });

    return { isValid: !firstInvalidField, firstInvalidField };
  }

  function showFormStatus(type, message) {
    if (!formStatus) return;
    formStatus.hidden = false;
    formStatus.className = `form-status form-status--${type}`;
    formStatus.innerHTML = message;
  }

  function clearFormStatus() {
    if (!formStatus) return;
    formStatus.hidden = true;
    formStatus.className = "form-status";
    formStatus.textContent = "";
  }

  function setSubmitting(isSubmitting) {
    if (!submitButton || !submitLabel) return;
    submitButton.disabled = isSubmitting;
    submitButton.classList.toggle("is-loading", isSubmitting);
    submitLabel.textContent = isSubmitting
      ? "Enviando seus dados..."
      : submitButton.dataset.defaultText;
  }

  if (phoneInput) {
    phoneInput.value = formatBrazilianPhone(phoneInput.value);

    phoneInput.addEventListener("input", () => {
      phoneInput.value = formatBrazilianPhone(phoneInput.value);
      if (phoneInput.closest(".form-field")?.classList.contains("has-error")) validatePhone(phoneInput);
      placeCursorAtEnd(phoneInput);
    });

    phoneInput.addEventListener("focus", () => {
      if (!phoneInput.value.startsWith("+55")) phoneInput.value = "+55 ";
      placeCursorAtEnd(phoneInput);
    });

    phoneInput.addEventListener("blur", () => validatePhone(phoneInput));

    phoneInput.addEventListener("keydown", (event) => {
      const isDeletion = event.key === "Backspace" || event.key === "Delete";
      if (isDeletion && phoneInput.selectionStart <= 4 && phoneInput.selectionEnd <= 4) {
        event.preventDefault();
        phoneInput.value = "+55 ";
        placeCursorAtEnd(phoneInput);
      }
    });
  }

  if (emailInput) {
    emailInput.addEventListener("input", () => {
      if (emailInput.closest(".form-field")?.classList.contains("has-error")) validateEmail(emailInput);
    });
    emailInput.addEventListener("blur", () => {
      emailInput.value = emailInput.value.trim().toLowerCase();
      validateEmail(emailInput);
    });
  }

  if (crcInput) {
    crcInput.addEventListener("input", () => {
      crcInput.value = crcInput.value.toUpperCase().replace(/[^A-Z0-9.\-/\s]/g, "");
      if (crcInput.closest(".form-field")?.classList.contains("has-error")) validateCrc(crcInput);
    });
    crcInput.addEventListener("blur", () => validateCrc(crcInput));
  }

  document.getElementById("nome")?.addEventListener("blur", (event) => validateName(event.currentTarget));
  document.getElementById("associado_crcdf")?.addEventListener("change", (event) => validateSelect(event.currentTarget));
  document.getElementById("consentimento")?.addEventListener("change", (event) => validateConsent(event.currentTarget));

  leadForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearFormStatus();

    const { isValid, firstInvalidField } = validateForm();
    if (!isValid) {
      showFormStatus("error", "<strong>Revise os campos destacados.</strong> Há informações obrigatórias ou inválidas.");
      firstInvalidField.focus();
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(leadForm.action, {
        method: "POST",
        body: new FormData(leadForm),
        headers: { Accept: "application/json" },
      });

      if (!response.ok) throw new Error("Não foi possível concluir o envio.");

      showFormStatus(
        "success",
        "<strong>Cadastro enviado com sucesso!</strong> Recebemos seus dados e a equipe Dygimed entrará em contato.",
      );

      leadForm.reset();
      if (phoneInput) phoneInput.value = "+55 ";
      leadForm.querySelectorAll(".form-field").forEach((field) => field.classList.remove("has-error", "has-success"));
      leadForm.querySelectorAll("[aria-invalid]").forEach((field) => field.setAttribute("aria-invalid", "false"));
      leadForm.querySelectorAll(".field-error").forEach((error) => { error.textContent = ""; });
      formStatus.scrollIntoView({ behavior: "smooth", block: "nearest" });
    } catch (error) {
      showFormStatus(
        "error",
        "<strong>Não conseguimos enviar agora.</strong> Verifique sua conexão e tente novamente em instantes.",
      );
    } finally {
      setSubmitting(false);
    }
  });
});
