const STORAGE_KEY = "cuaderno-oracion-entry";
const API_ORIGIN = resolveApiOrigin();
const API_URL = `${API_ORIGIN}/api/prayers`;
const state = {
  prayers: [],
  hasLoadedPrayers: false,
  isLoadingPrayers: false,
  saveTimer: undefined,
  selectedPrayerMonthKey: getCurrentPrayerMonthKey(),
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
const monthFilterList = document.querySelector("#month-filter-list");
const refreshPrayersButton = document.querySelector("#refresh-prayers");
const installButton = document.querySelector("#install-app");
const installFeedback = document.querySelector("#install-feedback");
const overlay = document.querySelector("#share-overlay");
const shareDialog = document.querySelector("#share-dialog");
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
let deferredInstallPrompt = null;

function resolveApiOrigin() {
  if (window.location.hostname === "lulisderoo20.github.io") {
    return "https://cuaderno-de-oracion.pages.dev";
  }

  return window.location.origin;
}

function isStandaloneMode() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

function isIOSDevice() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
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

function setInstallFeedback(message, variant = "") {
  installFeedback.textContent = message;
  installFeedback.classList.toggle("is-success", variant === "success");
}

function updateInstallUi() {
  if (isStandaloneMode()) {
    installButton.textContent = "App instalada";
    installButton.disabled = true;
    setInstallFeedback(
      "Ya la tienes instalada en este dispositivo.",
      "success"
    );
    return;
  }

  installButton.disabled = false;
  installButton.textContent = "Descargar app";

  if (deferredInstallPrompt) {
    setInstallFeedback("Instálala para abrirla como una app en este dispositivo.");
    return;
  }

  if (isIOSDevice()) {
    setInstallFeedback(
      "En iPhone o iPad: usa Compartir y luego Añadir a pantalla de inicio."
    );
    return;
  }

  setInstallFeedback(
    "Si no aparece el diálogo, usa el menú del navegador y elige Instalar app."
  );
}

function deriveNotebookTopic() {
  const title = titleInput.value.trim();
  if (title) {
    return title;
  }

  const firstLine = bodyInput.value
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean);

  return firstLine ? firstLine.slice(0, 120) : "Oración desde mi cuaderno";
}

function getCurrentPrayerMonthKey() {
  const now = new Date();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  return `${now.getFullYear()}-${month}`;
}

function getPrayerMonthKey(value) {
  const date = new Date(value);
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}`;
}

function formatPrayerMonthLabel(monthKey) {
  const [year, month] = monthKey.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return new Intl.DateTimeFormat("es-AR", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function getPrayerMonthGroups() {
  const groups = new Map();

  state.prayers.forEach((prayer) => {
    const monthKey = getPrayerMonthKey(prayer.created_at);
    if (!groups.has(monthKey)) {
      groups.set(monthKey, []);
    }

    groups.get(monthKey).push(prayer);
  });

  return groups;
}

function renderMonthFilters(groups) {
  monthFilterList.innerHTML = "";

  if (groups.size === 0) {
    return;
  }

  Array.from(groups.keys())
    .sort((left, right) => right.localeCompare(left))
    .forEach((monthKey) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "month-filter-button";
      button.textContent = formatPrayerMonthLabel(monthKey);
      button.classList.toggle("is-active", state.selectedPrayerMonthKey === monthKey);
      button.addEventListener("click", () => {
        state.selectedPrayerMonthKey = monthKey;
        renderPrayers();
      });
      monthFilterList.append(button);
    });
}

function renderEmptyMonth(monthKey, hasOtherMonths) {
  const emptyCard = document.createElement("article");
  emptyCard.className = "prayer-empty";
  const monthLabel = formatPrayerMonthLabel(monthKey);

  emptyCard.innerHTML = hasOtherMonths
    ? `
      <strong>No hay oraciones visibles en ${monthLabel}.</strong>
      <p>Prueba entrando a otro mes para ver pedidos anteriores de la comunidad.</p>
    `
    : `
      <strong>El centro todavía está comenzando.</strong>
      <p>Sé la primera persona en subir una oración para que otros puedan acompañarte.</p>
    `;

  prayerList.append(emptyCard);
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
  const groups = getPrayerMonthGroups();
  const currentMonthKey = getCurrentPrayerMonthKey();

  if (!state.selectedPrayerMonthKey) {
    state.selectedPrayerMonthKey = currentMonthKey;
  }

  renderMonthFilters(groups);

  if (state.prayers.length === 0) {
    renderEmptyMonth(state.selectedPrayerMonthKey, false);
    renderPrayerStats();
    return;
  }

  const selectedPrayers = groups.get(state.selectedPrayerMonthKey) ?? [];

  if (selectedPrayers.length === 0) {
    renderEmptyMonth(state.selectedPrayerMonthKey, groups.size > 0);
    renderPrayerStats();
    return;
  }

  selectedPrayers.forEach((prayer) => {
    const card = document.createElement("article");
    card.className = "prayer-card";

    const header = document.createElement("div");
    header.className = "prayer-card-header";

    const headingBlock = document.createElement("div");
    const title = document.createElement("h3");
    title.textContent = prayer.topic;

    const meta = document.createElement("p");
    meta.className = "prayer-meta";
    meta.textContent = `De: ${
      prayer.author_mode === "anonymous" ? "Anónimo" : prayer.author_name
    }`;

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
    if (!state.hasLoadedPrayers) {
      state.selectedPrayerMonthKey = getCurrentPrayerMonthKey();
    }
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
  shareTopic.value = deriveNotebookTopic();
  shareDetail.value = bodyInput.value.trim();

  if (shareDialog.classList.contains("is-notebook-share")) {
    return;
  }

  if (!shareTopic.value.trim()) {
    shareTopic.focus();
    return;
  }

  shareDetail.focus();
}

function openShareOverlay(prefillFromNotebook = false) {
  if (prefillFromNotebook) {
    if (bodyInput.value.trim().length < 12) {
      window.alert(
        "Escribe una oración un poco más completa en tu cuaderno antes de subirla al centro."
      );
      bodyInput.focus();
      return;
    }

    shareDialog.classList.add("is-notebook-share");
    fillShareFormFromNotebook();
  } else {
    shareDialog.classList.remove("is-notebook-share");
  }

  overlay.classList.remove("is-hidden");
  overlay.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  setShareFeedback("");

  window.setTimeout(() => {
    if (prefillFromNotebook) {
      if (getSelectedIdentity() === "named") {
        shareName.focus();
        return;
      }

      document.querySelector('input[name="identity"]:checked')?.focus();
      return;
    }

    shareTopic.focus();
  }, 40);
}

function closeShareOverlay() {
  overlay.classList.add("is-hidden");
  overlay.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  shareDialog.classList.remove("is-notebook-share");
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

async function handleInstallClick() {
  if (isStandaloneMode()) {
    updateInstallUi();
    return;
  }

  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    const choice = await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;

    if (choice.outcome === "accepted") {
      setInstallFeedback(
        "La app se está instalando en este dispositivo.",
        "success"
      );
    } else {
      setInstallFeedback(
        "Puedes instalarla cuando quieras desde este mismo botón."
      );
    }

    updateInstallUi();
    return;
  }

  if (isIOSDevice()) {
    setInstallFeedback(
      "En iPhone o iPad: usa Compartir y luego Añadir a pantalla de inicio."
    );
    return;
  }

  setInstallFeedback(
    "Abre el menú del navegador y elige Instalar app para descargarla."
  );
}

titleInput.addEventListener("input", scheduleNotebookSave);

bodyInput.addEventListener("input", () => {
  updateMeta();
  scheduleNotebookSave();
});

exportButton.addEventListener("click", downloadEntry);
clearButton.addEventListener("click", clearEntry);
refreshPrayersButton.addEventListener("click", loadPrayers);
installButton.addEventListener("click", handleInstallClick);
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

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  updateInstallUi();
});

window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  installButton.textContent = "App instalada";
  setInstallFeedback(
    "La app quedó instalada. Ahora puedes abrirla como una app normal.",
    "success"
  );
  updateInstallUi();
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
updateInstallUi();
setView("notebook");
