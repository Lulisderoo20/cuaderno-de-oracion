const STORAGE_KEY = "cuaderno-oracion-entry";
const API_ORIGIN = resolveApiOrigin();
const API_URL = `${API_ORIGIN}/api/prayers`;
const state = {
  prayers: [],
  hasLoadedPrayers: false,
  isLoadingPrayers: false,
  saveTimer: undefined,
};

const titleInput = document.querySelector("#entry-title");
const bodyInput = document.querySelector("#entry-body");
const metaLabel = document.querySelector("#entry-meta");
const saveStatus = document.querySelector("#save-status");
const todayLabel = document.querySelector("#today-label");
const exportButton = document.querySelector("#export-button");
const clearButton = document.querySelector("#clear-button");
const chips = document.querySelectorAll(".chip");
const viewButtons = document.querySelectorAll("[data-view-target]");
const viewPanels = document.querySelectorAll("[data-view-panel]");
const centerCount = document.querySelector("#center-count");
const prayerTotal = document.querySelector("#prayer-total");
const latestPrayerLabel = document.querySelector("#latest-prayer-label");
const prayerList = document.querySelector("#prayer-list");
const centerFeedback = document.querySelector("#center-feedback");
const refreshPrayersButton = document.querySelector("#refresh-prayers");
const overlay = document.querySelector("#share-overlay");
const openShareButtons = document.querySelectorAll(
  "#open-share-primary, #open-share-secondary, #open-share-tertiary, #share-from-notebook"
);
const closeShareButton = document.querySelector("#close-share");
const shareForm = document.querySelector("#share-form");
const shareTopic = document.querySelector("#share-topic");
const shareDetail = document.querySelector("#share-detail");
const shareNameField = document.querySelector("#share-name-field");
const shareName = document.querySelector("#share-name");
const shareFeedback = document.querySelector("#share-feedback");
const useNotebookContentButton = document.querySelector("#use-notebook-content");
const submitShareButton = document.querySelector("#submit-share");
const identityOptions = document.querySelectorAll(".identity-option");
const identityInputs = document.querySelectorAll('input[name="identity"]');

function resolveApiOrigin() {
  if (window.location.hostname === "lulisderoo20.github.io") {
    return "https://cuaderno-de-oracion.pages.dev";
  }

  return window.location.origin;
}

function setToday() {
  const formatter = new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const today = formatter.format(new Date());
  todayLabel.textContent = today.charAt(0).toUpperCase() + today.slice(1);
}

function updateMeta() {
  const words = bodyInput.value
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  metaLabel.textContent = `${words} ${words === 1 ? "palabra" : "palabras"}`;
}

function persistNotebook() {
  const payload = {
    title: titleInput.value.trim(),
    body: bodyInput.value,
    updatedAt: new Date().toISOString(),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  saveStatus.textContent = "Todo guardado";
}

function scheduleNotebookSave() {
  saveStatus.textContent = "Guardando...";
  window.clearTimeout(state.saveTimer);
  state.saveTimer = window.setTimeout(() => {
    persistNotebook();
  }, 280);
}

function loadNotebook() {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    updateMeta();
    return;
  }

  try {
    const parsed = JSON.parse(raw);
    titleInput.value = parsed.title ?? "";
    bodyInput.value = parsed.body ?? "";
  } catch (error) {
    console.warn("No se pudo recuperar el cuaderno guardado.", error);
  }

  updateMeta();
}

function slugifyFileName(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function downloadEntry() {
  const currentDate = new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date());

  const title = titleInput.value.trim() || "Mi oración";
  const content = bodyInput.value.trim() || "Todavía no escribiste nada.";
  const fileBody = [`${title}`, `${currentDate}`, "", content].join("\n");
  const blob = new Blob([fileBody], { type: "text/plain;charset=utf-8" });
  const fileName = `${slugifyFileName(title) || "oracion"}.txt`;
  const anchor = document.createElement("a");

  anchor.href = URL.createObjectURL(blob);
  anchor.download = fileName;
  document.body.append(anchor);
  anchor.click();
  URL.revokeObjectURL(anchor.href);
  anchor.remove();
}

function clearEntry() {
  const confirmed = window.confirm(
    "Se va a vaciar el título y el texto guardado en este navegador. ¿Quieres continuar?"
  );

  if (!confirmed) {
    return;
  }

  titleInput.value = "";
  bodyInput.value = "";
  window.clearTimeout(state.saveTimer);
  persistNotebook();
  updateMeta();
  bodyInput.focus();
}

function insertPrompt(promptText) {
  const existingValue = bodyInput.value.trim();
  const addition = existingValue ? `\n\n${promptText}` : `${promptText}\n`;

  bodyInput.value = `${bodyInput.value}${addition}`;
  bodyInput.focus();
  updateMeta();
  scheduleNotebookSave();
}

function setView(viewName) {
  viewButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.viewTarget === viewName);
  });

  viewPanels.forEach((panel) => {
    panel.classList.toggle("is-hidden", panel.dataset.viewPanel !== viewName);
  });

  if (viewName === "center" && !state.hasLoadedPrayers) {
    loadPrayers();
  }
}

function setCenterFeedback(message, variant = "") {
  centerFeedback.textContent = message;
  centerFeedback.classList.toggle("is-error", variant === "error");
}

function setShareFeedback(message, variant = "") {
  shareFeedback.textContent = message;
  shareFeedback.classList.toggle("is-error", variant === "error");
  shareFeedback.classList.toggle("is-success", variant === "success");
}

function renderPrayerStats() {
  const total = state.prayers.length;
  prayerTotal.textContent = `${total}`;
  centerCount.textContent =
    total === 0 ? "Sin pedidos aún" : `${total} pedidos compartidos`;

  latestPrayerLabel.textContent =
    total === 0 ? "Aún no hay pedidos" : formatPrayerDate(state.prayers[0].created_at);
}

function renderPrayers() {
  prayerList.innerHTML = "";

  if (state.prayers.length === 0) {
    const emptyCard = document.createElement("article");
    emptyCard.className = "prayer-empty";
    emptyCard.innerHTML = `
      <strong>El centro todavía está comenzando.</strong>
      <p>Sé la primera persona en subir una oración para que otros puedan acompañarte.</p>
    `;
    prayerList.append(emptyCard);
    renderPrayerStats();
    return;
  }

  state.prayers.forEach((prayer) => {
    const card = document.createElement("article");
    card.className = "prayer-card";

    const header = document.createElement("div");
    header.className = "prayer-card-header";

    const headingBlock = document.createElement("div");
    const title = document.createElement("h3");
    title.textContent = prayer.topic;

    const meta = document.createElement("p");
    meta.className = "prayer-meta";
    meta.textContent =
      prayer.author_mode === "anonymous"
        ? "Pedido anónimo"
        : `Pedido por ${prayer.author_name}`;

    headingBlock.append(title, meta);

    const date = document.createElement("p");
    date.className = "prayer-date";
    date.textContent = formatPrayerDate(prayer.created_at);

    header.append(headingBlock, date);

    const detail = document.createElement("p");
    detail.textContent = prayer.detail;

    card.append(header, detail);
    prayerList.append(card);
  });

  renderPrayerStats();
}

function formatPrayerDate(value) {
  const formatter = new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return formatter.format(new Date(value));
}

async function loadPrayers() {
  if (state.isLoadingPrayers) {
    return;
  }

  state.isLoadingPrayers = true;
  setCenterFeedback("Cargando oraciones...");

  try {
    const response = await fetch(API_URL, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("No se pudo cargar el centro de oraciones.");
    }

    const data = await response.json();
    state.prayers = Array.isArray(data.prayers) ? data.prayers : [];
    state.hasLoadedPrayers = true;
    renderPrayers();
    setCenterFeedback(
      state.prayers.length === 0
        ? "Todavía no hay pedidos publicados."
        : "Estas son las oraciones compartidas hasta ahora."
    );
  } catch (error) {
    console.error(error);
    setCenterFeedback(
      "No pudimos cargar el centro de oraciones en este momento.",
      "error"
    );
  } finally {
    state.isLoadingPrayers = false;
  }
}

function getSelectedIdentity() {
  const selected = document.querySelector('input[name="identity"]:checked');
  return selected ? selected.value : "named";
}

function syncIdentitySelection() {
  const selectedValue = getSelectedIdentity();

  identityOptions.forEach((option) => {
    const input = option.querySelector('input[name="identity"]');
    option.classList.toggle(
      "is-selected",
      Boolean(input) && input.value === selectedValue
    );
  });

  const showName = selectedValue === "named";
  shareNameField.classList.toggle("is-hidden", !showName);
  shareName.required = showName;
}

function fillShareFormFromNotebook() {
  if (!shareTopic.value.trim() && titleInput.value.trim()) {
    shareTopic.value = titleInput.value.trim();
  }

  if (!shareDetail.value.trim() && bodyInput.value.trim()) {
    shareDetail.value = bodyInput.value.trim();
  }

  if (!shareTopic.value.trim()) {
    shareTopic.focus();
    return;
  }

  shareDetail.focus();
}

function openShareOverlay(prefillFromNotebook = false) {
  if (prefillFromNotebook) {
    fillShareFormFromNotebook();
  }

  overlay.classList.remove("is-hidden");
  overlay.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  setShareFeedback("");

  window.setTimeout(() => {
    shareTopic.focus();
  }, 40);
}

function closeShareOverlay() {
  overlay.classList.add("is-hidden");
  overlay.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

async function submitPrayer(event) {
  event.preventDefault();

  const identity = getSelectedIdentity();
  const payload = {
    topic: shareTopic.value.trim(),
    detail: shareDetail.value.trim(),
    authorMode: identity,
    authorName: identity === "named" ? shareName.value.trim() : "",
  };

  if (!payload.topic || !payload.detail) {
    setShareFeedback("Completa el motivo y el detalle antes de publicar.", "error");
    return;
  }

  if (identity === "named" && !payload.authorName) {
    setShareFeedback("Si quieres aparecer con tu nombre, escríbelo primero.", "error");
    shareName.focus();
    return;
  }

  submitShareButton.disabled = true;
  setShareFeedback("Publicando tu oración...");

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "No se pudo publicar la oración.");
    }

    setShareFeedback("Tu oración ya quedó en el centro.", "success");
    shareForm.reset();
    document.querySelector('input[name="identity"][value="named"]').checked = true;
    syncIdentitySelection();
    state.hasLoadedPrayers = false;
    await loadPrayers();
    setView("center");

    window.setTimeout(() => {
      closeShareOverlay();
      setShareFeedback("");
    }, 450);
  } catch (error) {
    console.error(error);
    setShareFeedback(
      error instanceof Error ? error.message : "No se pudo publicar la oración.",
      "error"
    );
  } finally {
    submitShareButton.disabled = false;
  }
}

titleInput.addEventListener("input", scheduleNotebookSave);

bodyInput.addEventListener("input", () => {
  updateMeta();
  scheduleNotebookSave();
});

exportButton.addEventListener("click", downloadEntry);
clearButton.addEventListener("click", clearEntry);
refreshPrayersButton.addEventListener("click", loadPrayers);
shareForm.addEventListener("submit", submitPrayer);
useNotebookContentButton.addEventListener("click", fillShareFormFromNotebook);
closeShareButton.addEventListener("click", closeShareOverlay);

openShareButtons.forEach((button) => {
  button.addEventListener("click", () => {
    openShareOverlay(button.id === "share-from-notebook");
  });
});

viewButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setView(button.dataset.viewTarget);
  });
});

identityInputs.forEach((input) => {
  input.addEventListener("change", syncIdentitySelection);
});

chips.forEach((chip) => {
  chip.addEventListener("click", () => insertPrompt(chip.dataset.prompt ?? ""));
});

overlay.addEventListener("click", (event) => {
  if (event.target === overlay) {
    closeShareOverlay();
  }
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !overlay.classList.contains("is-hidden")) {
    closeShareOverlay();
  }
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch((error) => {
      console.warn("No se pudo registrar el service worker.", error);
    });
  });
}

setToday();
loadNotebook();
syncIdentitySelection();
setView("notebook");
