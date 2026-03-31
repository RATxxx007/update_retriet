document.documentElement.classList.add("js");

const header = document.querySelector(".site-header");
const yearNode = document.querySelector("#year");
const revealNodes = document.querySelectorAll("[data-reveal]");
const dateChoiceButtons = document.querySelectorAll("[data-date-choice]");
const dateCards = document.querySelectorAll("[data-date-card]");
const carousels = document.querySelectorAll("[data-carousel]");
const forms = document.querySelectorAll(".inquiry-form");
const copyButtons = document.querySelectorAll("[data-copy-inquiry]");
const venueModal = document.querySelector("[data-venue-modal]");
const venueModalContent = document.querySelector("[data-venue-modal-content]");
const venueOpenButtons = document.querySelectorAll("[data-venue-open]");
const venueCloseButtons = document.querySelectorAll("[data-venue-close]");
const config = window.UPDATE_RETREAT_CONFIG || {};

const messages = {
  sent: "Спасибо. Заявка отправлена.",
  fallback:
    "Онлайн-отправка пока не подключена. Заявка подготовлена для копирования.",
  failed:
    "Не удалось отправить форму автоматически. Заявка подготовлена для копирования.",
  copied: "Заявка скопирована. Можно вставить её в рабочий канал продаж.",
};

const dateDeadlines = {
  "15-20 мая": "предоплата до 16 апреля",
  "23-26 мая": "предоплата до 23 апреля",
  "28 мая - 1 июня": "предоплата до 15 мая",
  "6-10 июня": "предоплата до 6 мая",
};

const dateLocations = {
  "15-20 мая": "Edis Dacha",
  "23-26 мая": "Edis Dacha",
  "28 мая - 1 июня": "Hotel Qvevrebi",
  "6-10 июня": "Edis Dacha",
};

const formatLabels = {
  corporate: "Корпоративный выезд",
  "c-level": "C-level management",
  employees: "Отдых для сотрудников",
};

if (yearNode) {
  yearNode.textContent = new Date().getFullYear();
}

const syncHeader = () => {
  if (!header) return;
  header.classList.toggle("is-scrolled", window.scrollY > 16);
};

const setRevealDelay = () => {
  revealNodes.forEach((node) => {
    const delay = node.dataset.delay || "0";
    node.style.setProperty("--reveal-delay", `${delay}s`);
  });
};

const initReveal = () => {
  if (!("IntersectionObserver" in window)) {
    revealNodes.forEach((node) => node.classList.add("is-visible"));
    return;
  }

  revealNodes.forEach((node) => {
    const rect = node.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.92) {
      node.classList.add("is-visible");
    }
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.14, rootMargin: "0px 0px -40px 0px" }
  );

  revealNodes.forEach((node) => observer.observe(node));
};

const syncDateCards = (value) => {
  dateCards.forEach((card) => {
    card.classList.toggle("is-selected", card.dataset.dateCard === value);
  });
};

const setSelectedDate = (value) => {
  forms.forEach((form) => {
    const select = form.querySelector('select[name="retreatDate"]');
    if (select && value) select.value = value;
  });
  syncDateCards(value);
};

dateChoiceButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const value = button.dataset.dateChoice;
    const target = button.dataset.target;
    setSelectedDate(value);
    if (target) {
      const node = document.querySelector(target);
      if (node) {
        node.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  });
});

carousels.forEach((carousel) => {
  const viewport = carousel.querySelector("[data-carousel-viewport]");
  const prevButton = carousel.querySelector("[data-carousel-prev]");
  const nextButton = carousel.querySelector("[data-carousel-next]");
  if (!viewport || !prevButton || !nextButton) return;

  const scrollAmount = () => Math.max(viewport.clientWidth * 0.88, 280);

  prevButton.addEventListener("click", () => {
    viewport.scrollBy({ left: -scrollAmount(), behavior: "smooth" });
  });

  nextButton.addEventListener("click", () => {
    viewport.scrollBy({ left: scrollAmount(), behavior: "smooth" });
  });
});

const openVenueModal = (venueId) => {
  if (!venueModal || !venueModalContent) return;
  const template = document.querySelector(`#venue-template-${venueId}`);
  if (!(template instanceof HTMLTemplateElement)) return;
  venueModalContent.innerHTML = template.innerHTML;
  venueModal.hidden = false;
  document.body.style.overflow = "hidden";
};

const closeVenueModal = () => {
  if (!venueModal || !venueModalContent) return;
  venueModal.hidden = true;
  venueModalContent.innerHTML = "";
  document.body.style.overflow = "";
};

venueOpenButtons.forEach((button) => {
  button.addEventListener("click", () => openVenueModal(button.dataset.venueOpen));
});

venueCloseButtons.forEach((button) => {
  button.addEventListener("click", closeVenueModal);
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeVenueModal();
});

const buildInquirySummary = (form) => {
  const formData = new FormData(form);
  const selectedDate = formData.get("retreatDate") || "15-20 мая";

  return [
    "Продукт: Summit Reset",
    `Слот: ${selectedDate}`,
    `Площадка: ${dateLocations[selectedDate] || ""}`,
    `Дедлайн предоплаты: ${dateDeadlines[selectedDate] || ""}`,
    `Компания: ${formData.get("company") || ""}`,
    `Контактное лицо: ${formData.get("fullName") || ""}`,
    `Должность: ${formData.get("role") || ""}`,
    `Контакт: ${formData.get("contact") || ""}`,
    `Размер группы: ${formData.get("groupSize") || ""}`,
    `Формат: ${formatLabels[formData.get("format")] || formData.get("format") || ""}`,
    `Задачи и хотелки: ${formData.get("goals") || ""}`,
  ].join("\n");
};

const revealFallback = (form, summary, message) => {
  const status = form.querySelector(".form-status");
  const panel = form.querySelector(".fallback-panel");
  const summaryField = form.querySelector(".fallback-panel__summary");

  if (status) status.textContent = message;
  if (panel) panel.hidden = false;
  if (summaryField) summaryField.value = summary;
};

const copyFallbackSummary = async (button) => {
  const form = button.closest(".inquiry-form");
  if (!form) return;

  const summaryField = form.querySelector(".fallback-panel__summary");
  const status = form.querySelector(".form-status");
  if (!summaryField) return;

  try {
    await navigator.clipboard.writeText(summaryField.value);
    if (status) status.textContent = messages.copied;
  } catch {
    summaryField.focus();
    summaryField.select();
  }
};

copyButtons.forEach((button) => {
  button.addEventListener("click", () => copyFallbackSummary(button));
});

forms.forEach((form) => {
  const dateSelect = form.querySelector('select[name="retreatDate"]');
  if (dateSelect) {
    dateSelect.addEventListener("change", () => syncDateCards(dateSelect.value));
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!form.reportValidity()) return;

    const status = form.querySelector(".form-status");
    const panel = form.querySelector(".fallback-panel");
    const summary = buildInquirySummary(form);

    if (!config.inquiryEndpoint) {
      revealFallback(form, summary, messages.fallback);
      return;
    }

    const payload = {
      product: "Summit Reset",
      retreatDate: form.elements.retreatDate.value,
      retreatLocation: dateLocations[form.elements.retreatDate.value] || "",
      retreatDeadline: dateDeadlines[form.elements.retreatDate.value] || "",
      company: form.elements.company.value.trim(),
      fullName: form.elements.fullName.value.trim(),
      role: form.elements.role.value.trim(),
      contact: form.elements.contact.value.trim(),
      groupSize: form.elements.groupSize.value.trim(),
      format: form.elements.format.value,
      goals: form.elements.goals.value.trim(),
      page: window.location.pathname,
    };

    try {
      const response = await fetch(config.inquiryEndpoint, {
        method: config.inquiryMethod || "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Request failed");

      form.reset();
      form.elements.groupSize.value = 5;
      form.elements.retreatDate.value = "15-20 мая";
      form.elements.format.value = "corporate";
      syncDateCards("15-20 мая");
      if (panel) panel.hidden = true;
      if (status) status.textContent = messages.sent;
    } catch {
      revealFallback(form, summary, messages.failed);
    }
  });
});

setRevealDelay();
initReveal();
syncHeader();
syncDateCards("15-20 мая");

window.addEventListener("scroll", syncHeader, { passive: true });
