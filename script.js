const scale = [
  { min: 50, class: 50 },
  { min: 35, class: 55 },
  { min: 30, class: 60 },
  { min: 22.5, class: 65 },
  { min: 15, class: 70 },
  { min: 12, class: 85 },
  { min: 10, class: 92.5 },
  { min: 8, class: 100 },
  { min: 6, class: 125 },
  { min: 4, class: 175 },
  { min: 2, class: 250 },
  { min: 1, class: 300 },
  { min: 0, class: 400 }
];

document.body.classList.add("js");

const revealTargets = document.querySelectorAll(
  ".section-intro, .network-grid, .tool-card, .workflow div, .calculator-shell, .checklist, .company, .tool-article article, .payment-layout, .dashboard"
);

revealTargets.forEach((target) => target.classList.add("reveal"));

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: "0px 0px -4% 0px" });

  revealTargets.forEach((target) => revealObserver.observe(target));
} else {
  revealTargets.forEach((target) => target.classList.add("in-view"));
}

const navLinks = Array.from(document.querySelectorAll('.site-header nav a[href^="#"]'));
const navTargets = navLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

if (navTargets.length && "IntersectionObserver" in window) {
  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((link) => {
        link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`);
      });
    });
  }, { threshold: 0.32 });

  navTargets.forEach((target) => navObserver.observe(target));
}

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const target = document.querySelector(link.getAttribute("href"));
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    history.pushState(null, "", link.getAttribute("href"));
  });
});

function getClass(density) {
  for (const tier of scale) {
    if (density >= tier.min) return tier.class;
  }
  return 400;
}

function getNextBetter(density) {
  for (let i = scale.length - 1; i >= 0; i--) {
    if (density < scale[i].min) {
      return {
        targetDensity: scale[i].min,
        targetClass: scale[i].class,
        needed: scale[i].min - density
      };
    }
  }
  return null;
}

function calculateDensity(length, width, height, weight, quantity = 1) {
  const cube = (length * width * height) / 1728;
  const totalCube = cube * quantity;
  const totalWeight = weight * quantity;
  const density = totalWeight / totalCube;
  return {
    totalCube,
    totalWeight,
    density,
    freightClass: getClass(density),
    next: getNextBetter(density)
  };
}

function renderQuickDemo() {
  const length = Number(document.getElementById("quickLength")?.value);
  const width = Number(document.getElementById("quickWidth")?.value);
  const height = Number(document.getElementById("quickHeight")?.value);
  const weight = Number(document.getElementById("quickWeight")?.value);

  if (!length || !width || !height || !weight) return;

  const result = calculateDensity(length, width, height, weight);
  document.getElementById("quickDensity").textContent = `${result.density.toFixed(2)} PCF`;
  document.getElementById("quickClass").textContent = result.freightClass;
  document.getElementById("quickDistance").textContent = result.next
    ? `${result.next.needed.toFixed(2)} PCF from Class ${result.next.targetClass}.`
    : "Already in one of the densest classes available.";
}

if (document.getElementById("quickCalculate")) {
  ["quickLength", "quickWidth", "quickHeight", "quickWeight"].forEach((id) => {
    document.getElementById(id)?.addEventListener("input", renderQuickDemo);
  });
  document.getElementById("quickCalculate").addEventListener("click", renderQuickDemo);
  renderQuickDemo();
}

let pieces = [];

function getInputPiece() {
  const l = Number(document.getElementById("length").value);
  const w = Number(document.getElementById("width").value);
  const h = Number(document.getElementById("height").value);
  const wt = Number(document.getElementById("weight").value);
  const qty = Number(document.getElementById("qty").value) || 1;

  if (!l || !w || !h || !wt) return null;
  return { l, w, h, wt, qty };
}

function renderPieces() {
  const list = document.getElementById("pieceList");
  list.innerHTML = pieces.map((p, i) => `
    <div class="piece-item">
      <span>${p.qty} x ${p.l} x ${p.w} x ${p.h}" @ ${p.wt} lbs</span>
      <button type="button" data-remove="${i}">Remove</button>
    </div>
  `).join("");

  list.querySelectorAll("[data-remove]").forEach((button) => {
    button.addEventListener("click", () => {
      pieces.splice(Number(button.dataset.remove), 1);
      renderPieces();
      if (pieces.length) calculateFull();
      else hideResults();
    });
  });
}

function clearShipmentInputs() {
  ["length", "width", "height", "weight"].forEach((id) => {
    document.getElementById(id).value = "";
  });
}

function addPiece() {
  const piece = getInputPiece();
  if (!piece) {
    window.alert("Please fill in Length, Width, Height, and Weight.");
    return;
  }
  pieces.push(piece);
  renderPieces();
  clearShipmentInputs();
}

function hideResults() {
  document.getElementById("results").style.display = "none";
  document.getElementById("emptyState").style.display = "grid";
}

function showResults() {
  document.getElementById("results").style.display = "block";
  document.getElementById("emptyState").style.display = "none";
}

function calculateFull() {
  if (!pieces.length) {
    const piece = getInputPiece();
    if (!piece) {
      window.alert("Please enter dimensions and weight.");
      return;
    }
    pieces = [piece];
    renderPieces();
  }

  let totalCube = 0;
  let totalWeight = 0;

  pieces.forEach((p) => {
    const cube = (p.l * p.w * p.h) / 1728;
    totalCube += cube * p.qty;
    totalWeight += p.wt * p.qty;
  });

  const density = totalWeight / totalCube;
  const freightClass = getClass(density);
  const next = getNextBetter(density);

  document.getElementById("totalCube").textContent = totalCube.toFixed(2);
  document.getElementById("density").textContent = density.toFixed(2);
  document.getElementById("totalWeight").textContent = totalWeight.toFixed(0);
  document.getElementById("classBadge").textContent = freightClass;

  const whatIfEl = document.getElementById("whatIf");
  whatIfEl.className = "what-if";

  if (next && next.needed > 0.01) {
    const pct = ((next.needed / density) * 100).toFixed(1);
    whatIfEl.innerHTML = `
      <strong>You are ${next.needed.toFixed(2)} PCF away from Class ${next.targetClass}.</strong><br>
      That is roughly ${pct}% denser. Reducing height, eliminating overhang, or tighter packing often gets you there.
    `;
  } else {
    whatIfEl.innerHTML = "<strong>You are already in one of the densest classes available.</strong>";
  }

  if (next && next.needed < 0.5) {
    whatIfEl.className = "what-if warning";
    whatIfEl.innerHTML += "<br><br><strong>Borderline density.</strong> Carriers frequently re-measure. Double-check dimensions.";
  }

  showResults();
}

function resetAll() {
  pieces = [];
  ["length", "width", "height", "weight"].forEach((id) => {
    document.getElementById(id).value = "";
  });
  document.getElementById("qty").value = "1";
  renderPieces();
  hideResults();
}

function copyResults() {
  const text = `LTL Density Calculation
Total Cube: ${document.getElementById("totalCube").textContent} ft3
Density: ${document.getElementById("density").textContent} PCF
Total Weight: ${document.getElementById("totalWeight").textContent} lbs
Estimated Class: ${document.getElementById("classBadge").textContent}
Using the current 13-tier NMFC density scale.`;

  navigator.clipboard.writeText(text).then(() => {
    const button = document.getElementById("copyResults");
    const previous = button.textContent;
    button.textContent = "Copied";
    setTimeout(() => {
      button.textContent = previous;
    }, 1200);
  });
}

const paymentRoot = document.getElementById("payment-tracker");
const paymentStorageKey = "giraffePaymentTrackerV5";
let paymentMemoryData = { in: [], out: [] };
let paymentCurrentType = "in";
let paymentEditId = null;

const paymentEl = (id) => document.getElementById(id);

function paymentMoney(value) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2
  }).format(value || 0);
}

function paymentParseDate(dateString) {
  if (!dateString) return null;
  const [y, m, d] = dateString.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function paymentFormatDate(dateString) {
  const date = paymentParseDate(dateString);
  return date ? date.toLocaleDateString() : "";
}

function paymentLoadData() {
  try {
    const storage = globalThis.localStorage;
    const raw = storage?.getItem(paymentStorageKey);
    if (!raw) return paymentMemoryData;
    const parsed = JSON.parse(raw);
    return {
      in: Array.isArray(parsed.in) ? parsed.in : [],
      out: Array.isArray(parsed.out) ? parsed.out : []
    };
  } catch {
    return paymentMemoryData;
  }
}

function paymentSaveData(data) {
  paymentMemoryData = data;
  try {
    globalThis.localStorage?.setItem(paymentStorageKey, JSON.stringify(data));
  } catch {
    // Some preview/browser contexts disable storage. The in-memory copy keeps the tool usable.
  }
}

function paymentAddInterval(dateString, frequency) {
  const date = paymentParseDate(dateString);
  if (!date || frequency === "none") return dateString;

  if (frequency === "weekly") {
    date.setDate(date.getDate() + 7);
  } else if (frequency === "monthly") {
    const originalDay = date.getDate();
    date.setDate(1);
    date.setMonth(date.getMonth() + 1);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    date.setDate(Math.min(originalDay, lastDay));
  } else if (frequency === "yearly") {
    const month = date.getMonth();
    const day = date.getDate();
    date.setFullYear(date.getFullYear() + 1, month, 1);
    const lastDay = new Date(date.getFullYear(), month + 1, 0).getDate();
    date.setDate(Math.min(day, lastDay));
  }

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function paymentRemaining(entry) {
  return Math.max(0, Number(entry.amount || 0) - Number(entry.amountPaid || 0));
}

function paymentStatus(entry) {
  const remaining = paymentRemaining(entry);
  if (remaining <= 0) return "paid";
  if ((entry.amountPaid || 0) > 0) return "partial";

  const due = paymentParseDate(entry.dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (due && due < today) return "overdue";
  return "pending";
}

function paymentIsDueSoon(entry) {
  if (paymentStatus(entry) === "paid") return false;
  const due = paymentParseDate(entry.dueDate);
  if (!due) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = (due - today) / 86400000;
  return diff >= 0 && diff <= 7;
}

function paymentAdvanceRecurring(data) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let changed = false;

  ["in", "out"].forEach((type) => {
    data[type].forEach((entry) => {
      if (!entry.recurring || entry.recurring === "none") return;
      if (paymentRemaining(entry) > 0) return;

      let nextDate = entry.dueDate;
      do {
        nextDate = paymentAddInterval(nextDate, entry.recurring);
      } while (paymentParseDate(nextDate) < today);

      if (nextDate !== entry.dueDate || entry.amountPaid !== 0) {
        entry.dueDate = nextDate;
        entry.amountPaid = 0;
        entry.lastRolledAt = new Date().toISOString();
        changed = true;
      }
    });
  });

  if (changed) paymentSaveData(data);
  return data;
}

function paymentClearForm() {
  paymentEditId = null;
  paymentEl("name").value = "";
  paymentEl("amount").value = "";
  paymentEl("amountPaid").value = "0";
  paymentEl("dueDate").value = "";
  paymentEl("recurring").value = "none";
  paymentEl("notes").value = "";
  paymentEl("saveBtn").textContent = "Save Entry";
}

function paymentSetType(type) {
  paymentCurrentType = type;
  paymentClearForm();
  document.querySelectorAll(".tab").forEach((button) => {
    button.classList.toggle("active", button.dataset.type === type);
  });
  paymentEl("formTitle").textContent = type === "in" ? "Add Money In" : "Add Money Out";
  paymentEl("listTitle").textContent = type === "in" ? "Money In" : "Money Out";
  paymentRender();
}

function paymentSaveEntry() {
  const name = paymentEl("name").value.trim();
  const amount = Number(paymentEl("amount").value);
  const amountPaid = Number(paymentEl("amountPaid").value || 0);
  const dueDate = paymentEl("dueDate").value;
  const recurring = paymentEl("recurring").value;
  const notes = paymentEl("notes").value.trim();

  if (!name || !amount || amount <= 0 || !dueDate) {
    window.alert("Please enter Name, Amount, and Due Date.");
    return;
  }

  if (amountPaid < 0 || amountPaid > amount) {
    window.alert("Amount Already Paid must be between 0 and the total Amount.");
    return;
  }

  const data = paymentLoadData();
  const entry = {
    id: paymentEditId || (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())),
    name,
    amount,
    amountPaid,
    dueDate,
    recurring,
    notes,
    createdAt: paymentEditId ? undefined : new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (paymentEditId) {
    const index = data[paymentCurrentType].findIndex((item) => item.id === paymentEditId);
    if (index >= 0) {
      entry.createdAt = data[paymentCurrentType][index].createdAt;
      data[paymentCurrentType][index] = entry;
    }
  } else {
    data[paymentCurrentType].push(entry);
  }

  paymentSaveData(data);
  paymentClearForm();
  paymentRender();
}

function paymentEditEntry(id) {
  const data = paymentLoadData();
  const entry = data[paymentCurrentType].find((item) => item.id === id);
  if (!entry) return;

  paymentEditId = id;
  paymentEl("name").value = entry.name || "";
  paymentEl("amount").value = entry.amount ?? "";
  paymentEl("amountPaid").value = entry.amountPaid ?? 0;
  paymentEl("dueDate").value = entry.dueDate || "";
  paymentEl("recurring").value = entry.recurring || "none";
  paymentEl("notes").value = entry.notes || "";
  paymentEl("saveBtn").textContent = "Update Entry";
  paymentRoot.scrollIntoView({ behavior: "smooth", block: "start" });
}

function paymentDeleteEntry(id) {
  if (!window.confirm("Delete this entry?")) return;
  const data = paymentLoadData();
  data[paymentCurrentType] = data[paymentCurrentType].filter((entry) => entry.id !== id);
  paymentSaveData(data);
  paymentRender();
}

function paymentMarkPaid(id) {
  const data = paymentLoadData();
  const entry = data[paymentCurrentType].find((item) => item.id === id);
  if (!entry) return;
  entry.amountPaid = Number(entry.amount || 0);
  entry.updatedAt = new Date().toISOString();
  paymentSaveData(data);
  paymentRender();
}

function paymentApplyPayment(id) {
  const data = paymentLoadData();
  const entry = data[paymentCurrentType].find((item) => item.id === id);
  if (!entry) return;

  const remaining = paymentRemaining(entry);
  const raw = window.prompt(`Payment amount (remaining ${paymentMoney(remaining)}):`, remaining.toFixed(2));
  if (raw === null) return;

  const payment = Number(raw);
  if (!payment || payment <= 0 || payment > remaining) {
    window.alert("Enter a valid payment amount up to the remaining balance.");
    return;
  }

  entry.amountPaid = Number(entry.amountPaid || 0) + payment;
  entry.updatedAt = new Date().toISOString();
  paymentSaveData(data);
  paymentRender();
}

function paymentDashboardTotals(data) {
  const all = [
    ...data.in.map((entry) => ({ ...entry, type: "in" })),
    ...data.out.map((entry) => ({ ...entry, type: "out" }))
  ];

  const outstandingIn = data.in.reduce((sum, entry) => sum + paymentRemaining(entry), 0);
  const outstandingOut = data.out.reduce((sum, entry) => sum + paymentRemaining(entry), 0);
  const overdue = all
    .filter((entry) => paymentStatus(entry) === "overdue")
    .reduce((sum, entry) => sum + paymentRemaining(entry), 0);
  const dueSoon = all
    .filter(paymentIsDueSoon)
    .reduce((sum, entry) => sum + paymentRemaining(entry), 0);

  paymentEl("metricIn").textContent = paymentMoney(outstandingIn);
  paymentEl("metricOut").textContent = paymentMoney(outstandingOut);
  paymentEl("metricOverdue").textContent = paymentMoney(overdue);
  paymentEl("metricDueSoon").textContent = paymentMoney(dueSoon);
}

function paymentFilteredSorted(list) {
  const filter = paymentEl("statusFilter").value;
  const sortBy = paymentEl("sortBy").value;

  const priorityScore = (entry) => {
    const status = paymentStatus(entry);
    if (status === "overdue") return 0;
    if (paymentIsDueSoon(entry)) return 1;
    if (status === "partial") return 2;
    if (status === "pending") return 3;
    return 4;
  };

  return [...list]
    .filter((entry) => {
      const status = paymentStatus(entry);
      if (filter === "all") return true;
      if (filter === "open") return status !== "paid";
      if (filter === "overdue") return status === "overdue";
      if (filter === "due-soon") return paymentIsDueSoon(entry);
      if (filter === "paid") return status === "paid";
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "due-asc") return paymentParseDate(a.dueDate) - paymentParseDate(b.dueDate);
      if (sortBy === "due-desc") return paymentParseDate(b.dueDate) - paymentParseDate(a.dueDate);
      if (sortBy === "amount-desc") return paymentRemaining(b) - paymentRemaining(a);

      const priority = priorityScore(a) - priorityScore(b);
      return priority !== 0 ? priority : paymentParseDate(a.dueDate) - paymentParseDate(b.dueDate);
    });
}

function paymentEscapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function paymentRenderEntries(data) {
  const list = paymentFilteredSorted(data[paymentCurrentType] || []);
  const container = paymentEl("entryList");

  if (!list.length) {
    container.innerHTML = '<div class="empty">No matching entries.</div>';
    return;
  }

  container.innerHTML = list.map((entry) => {
    const status = paymentStatus(entry);
    const dueSoon = paymentIsDueSoon(entry);
    const remaining = paymentRemaining(entry);
    const recurrence = entry.recurring && entry.recurring !== "none"
      ? `<span class="badge">${entry.recurring}</span>`
      : "";
    const statusBadge = `<span class="badge ${status}">${status}</span>`;
    const dueSoonBadge = dueSoon && status !== "overdue"
      ? '<span class="badge due-soon">due soon</span>'
      : "";

    return `
      <article class="entry ${status === "overdue" ? "overdue" : ""} ${dueSoon && status !== "overdue" ? "due-soon" : ""} ${status === "paid" ? "paid" : ""}">
        <div>
          <h3>${paymentEscapeHtml(entry.name)}</h3>
          <div class="meta">Due ${paymentFormatDate(entry.dueDate)}</div>
          ${entry.notes ? `<div class="notes">${paymentEscapeHtml(entry.notes)}</div>` : ""}
        </div>
        <div class="entry-right">
          <div class="amount">${paymentMoney(entry.amount)}</div>
          <div class="remaining">${status === "paid" ? "Paid in full" : `${paymentMoney(remaining)} remaining`}</div>
          <div class="badges">${statusBadge}${dueSoonBadge}${recurrence}</div>
          <div class="entry-actions">
            ${status !== "paid" ? `<button class="secondary" data-payment-action="apply" data-id="${entry.id}">Add Payment</button>` : ""}
            ${status !== "paid" ? `<button class="secondary" data-payment-action="paid" data-id="${entry.id}">Mark Paid</button>` : ""}
            <button class="secondary" data-payment-action="edit" data-id="${entry.id}">Edit</button>
            <button class="danger" data-payment-action="delete" data-id="${entry.id}">Delete</button>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

function paymentRender() {
  let data = paymentLoadData();
  data = paymentAdvanceRecurring(data);
  paymentDashboardTotals(data);
  paymentRenderEntries(data);
}

function paymentExportJson() {
  const blob = new Blob([JSON.stringify(paymentLoadData(), null, 2)], { type: "application/json" });
  paymentDownloadBlob(blob, `giraffe-payment-tracker-${new Date().toISOString().slice(0, 10)}.json`);
}

function paymentCsvCell(value) {
  const string = String(value ?? "");
  return `"${string.replaceAll('"', '""')}"`;
}

function paymentExportCsv() {
  const data = paymentLoadData();
  const rows = [["Type", "Name", "Amount", "Amount Paid", "Remaining", "Due Date", "Recurring", "Status", "Notes"]];

  ["in", "out"].forEach((type) => {
    data[type].forEach((entry) => {
      rows.push([
        type,
        entry.name,
        entry.amount,
        entry.amountPaid || 0,
        paymentRemaining(entry),
        entry.dueDate,
        entry.recurring || "none",
        paymentStatus(entry),
        entry.notes || ""
      ]);
    });
  });

  const csv = rows.map((row) => row.map(paymentCsvCell).join(",")).join("\n");
  paymentDownloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8" }), `giraffe-payment-tracker-${new Date().toISOString().slice(0, 10)}.csv`);
}

function paymentDownloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function paymentImportJson(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      if (!parsed || !Array.isArray(parsed.in) || !Array.isArray(parsed.out)) {
        throw new Error("Invalid structure");
      }
      if (!window.confirm("Importing will replace the current tracker data. Continue?")) return;
      paymentSaveData({ in: parsed.in, out: parsed.out });
      paymentClearForm();
      paymentRender();
    } catch {
      window.alert("That file is not a valid Payment Tracker backup.");
    }
  };
  reader.readAsText(file);
}

if (document.getElementById("calculate")) {
  document.getElementById("addPiece").addEventListener("click", addPiece);
  document.getElementById("calculate").addEventListener("click", calculateFull);
  document.getElementById("resetAll").addEventListener("click", resetAll);
  document.getElementById("copyResults").addEventListener("click", copyResults);
}

if (paymentRoot) {
  document.querySelectorAll(".tab").forEach((button) => {
    button.addEventListener("click", () => paymentSetType(button.dataset.type));
  });

  paymentEl("saveBtn").addEventListener("click", paymentSaveEntry);
  paymentEl("clearBtn").addEventListener("click", paymentClearForm);
  paymentEl("statusFilter").addEventListener("change", paymentRender);
  paymentEl("sortBy").addEventListener("change", paymentRender);
  paymentEl("exportBtn").addEventListener("click", paymentExportJson);
  paymentEl("exportCsvBtn").addEventListener("click", paymentExportCsv);
  paymentEl("importBtn").addEventListener("click", () => paymentEl("importFile").click());
  paymentEl("importFile").addEventListener("change", (event) => {
    if (event.target.files?.[0]) paymentImportJson(event.target.files[0]);
    event.target.value = "";
  });

  paymentEl("entryList").addEventListener("click", (event) => {
    const button = event.target.closest("[data-payment-action]");
    if (!button) return;
    const { paymentAction, id } = button.dataset;
    if (paymentAction === "apply") paymentApplyPayment(id);
    if (paymentAction === "paid") paymentMarkPaid(id);
    if (paymentAction === "edit") paymentEditEntry(id);
    if (paymentAction === "delete") paymentDeleteEntry(id);
  });

  paymentRender();
}
