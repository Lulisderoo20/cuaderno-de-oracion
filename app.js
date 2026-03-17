const STORAGE_KEY = "cuaderno-oracion-entry";

const titleInput = document.querySelector("#entry-title");
const bodyInput = document.querySelector("#entry-body");
const metaLabel = document.querySelector("#entry-meta");
const saveStatus = document.querySelector("#save-status");
const todayLabel = document.querySelector("#today-label");
const exportButton = document.querySelector("#export-button");
const clearButton = document.querySelector("#clear-button");
const chips = document.querySelectorAll(".chip");
let saveTimer;

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

function persist() {
  const payload = {
    title: titleInput.value.trim(),
    body: bodyInput.value,
    updatedAt: new Date().toISOString(),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  saveStatus.textContent = "Todo guardado";
}

function load() {
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

function markTyping() {
  saveStatus.textContent = "Guardando...";
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    persist();
  }, 280);
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
  persist();
  updateMeta();
  bodyInput.focus();
}

function insertPrompt(promptText) {
  const existingValue = bodyInput.value.trim();
  const addition = existingValue ? `\n\n${promptText}` : `${promptText}\n`;

  bodyInput.value = `${bodyInput.value}${addition}`;
  bodyInput.focus();
  updateMeta();
  markTyping();
}

titleInput.addEventListener("input", () => {
  markTyping();
  persist();
});

bodyInput.addEventListener("input", () => {
  markTyping();
  updateMeta();
  persist();
});

exportButton.addEventListener("click", downloadEntry);
clearButton.addEventListener("click", clearEntry);

chips.forEach((chip) => {
  chip.addEventListener("click", () => insertPrompt(chip.dataset.prompt ?? ""));
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch((error) => {
      console.warn("No se pudo registrar el service worker.", error);
    });
  });
}

setToday();
load();
