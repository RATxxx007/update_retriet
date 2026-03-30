document.documentElement.classList.add("js");

const header = document.querySelector(".site-header");
const yearNode = document.querySelector("#year");
const revealNodes = document.querySelectorAll("[data-reveal]");
const formatChoiceButtons = document.querySelectorAll("[data-format-choice]");
const dateChoiceButtons = document.querySelectorAll("[data-date-choice]");
const dateCards = document.querySelectorAll("[data-date-card]");
const programTabs = document.querySelectorAll("[data-program-tab]");
const programPanels = document.querySelectorAll("[data-program-panel]");
const forms = document.querySelectorAll(".inquiry-form");
const copyButtons = document.querySelectorAll("[data-copy-inquiry]");
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
  "16-20 мая": "предоплата до 16 апреля",
  "23-26 мая": "предоплата до 23 апреля",
  "6-10 июня": "предоплата до 6 мая",
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
    { threshold: 0.18, rootMargin: "0px 0px -40px 0px" }
  );

  revealNodes.forEach((node) => observer.observe(node));
};

const setSelectedFormat = (value) => {
  forms.forEach((form) => {
    const select = form.querySelector('select[name="format"]');
    if (select && value) select.value = value;
  });
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

formatChoiceButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const value = button.dataset.formatChoice;
    setSelectedFormat(value);
    const contactSection = document.querySelector("#contact");
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});

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

const openProgramPanel = (targetId) => {
  programTabs.forEach((tab) => {
    const isActive = tab.dataset.programTab === targetId;
    tab.classList.toggle("is-active", isActive);
    tab.setAttribute("aria-selected", String(isActive));
  });

  programPanels.forEach((panel) => {
    const isActive = panel.id === targetId;
    panel.classList.toggle("is-active", isActive);
    panel.hidden = !isActive;
  });
};

programTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    openProgramPanel(tab.dataset.programTab);
  });
});

const buildInquirySummary = (form) => {
  const formData = new FormData(form);
  const selectedDate = formData.get("retreatDate") || "16-20 мая";

  const formatLabels = {
    "small-company": "Небольшая компания",
    "c-level": "C-level management",
    b2b2c: "B2B2C для сотрудников",
  };

  return [
    `Продукт: Summit Reset`,
    `Дата: ${selectedDate}`,
    `Дедлайн предоплаты: ${dateDeadlines[selectedDate] || ""}`,
    `Компания: ${formData.get("company") || ""}`,
    `Контактное лицо: ${formData.get("fullName") || ""}`,
    `Должность: ${formData.get("role") || ""}`,
    `Контакт: ${formData.get("contact") || ""}`,
    `Размер группы: ${formData.get("groupSize") || ""}`,
    `Формат: ${formatLabels[formData.get("format")] || formData.get("format") || ""}`,
    `Цель поездки: ${formData.get("goals") || ""}`,
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
    dateSelect.addEventListener("change", () => {
      syncDateCards(dateSelect.value);
    });
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
      setSelectedDate("16-20 мая");
      setSelectedFormat("small-company");
      form.elements.groupSize.value = 5;
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
syncDateCards("16-20 мая");
openProgramPanel("day-1");

window.addEventListener("scroll", syncHeader, { passive: true });
