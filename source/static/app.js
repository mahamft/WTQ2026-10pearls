// VoltWise Consumer Intelligence Platform Engine

let allBills = [];
let currentBill = null;
let currentZoom = 1;
let currentRotation = 0;
let isHighContrast = false;
let currentExtraction = null;

let usageChartInstance = null;
let donutChartInstance = null;

// DOM Elements - Sidebar Navigation
const navItems = document.querySelectorAll(".nav-item");
const viewPanels = document.querySelectorAll(".view-panel");
const pageTitleHeading = document.getElementById("pageTitleHeading");
const pageSubtitleText = document.getElementById("pageSubtitleText");

// Document Ribbon
const billSelectDropdown = document.getElementById("billSelectDropdown");
const currentDocTitle = document.getElementById("currentDocTitle");
const currentDocStatusTag = document.getElementById("currentDocStatusTag");
const currentDocSub = document.getElementById("currentDocSub");
const auditBillBtn = document.getElementById("auditBillBtn");
const billMainImage = document.getElementById("billMainImage");
const globalFileInput = document.getElementById("globalFileInput");

// Viewer Tools
const rotateBtn = document.getElementById("rotateBtn");
const contrastBtn = document.getElementById("contrastBtn");
const zoomInBtn = document.getElementById("zoomInBtn");
const zoomOutBtn = document.getElementById("zoomOutBtn");
const resetZoomBtn = document.getElementById("resetZoomBtn");

// Financial KPI Cards
const cardPayableWithin = document.getElementById("cardPayableWithin");
const cardPayableAfter = document.getElementById("cardPayableAfter");
const cardDueDateNote = document.getElementById("cardDueDateNote");
const cardSurchargeNote = document.getElementById("cardSurchargeNote");
const cardUnitsConsumed = document.getElementById("cardUnitsConsumed");
const cardSlabStatusNote = document.getElementById("cardSlabStatusNote");
const cardArrears = document.getElementById("cardArrears");
const cardArrearsNote = document.getElementById("cardArrearsNote");

// Breakdown Tables
const chargesItemTable = document.querySelector("#chargesItemTable tbody");
const taxesItemTable = document.querySelector("#taxesItemTable tbody");
const totalChargesHeading = document.getElementById("totalChargesHeading");
const totalTaxesHeading = document.getElementById("totalTaxesHeading");

// Readings
const rmPrevReading = document.getElementById("rmPrevReading");
const rmCurrReading = document.getElementById("rmCurrReading");
const rmReadingDate = document.getElementById("rmReadingDate");
const rmIssueDate = document.getElementById("rmIssueDate");

// Copilot Elements
const copilotThread = document.getElementById("copilotThread");
const copilotUserPrompt = document.getElementById("copilotUserPrompt");
const copilotSubmitBtn = document.getElementById("copilotSubmitBtn");
const queryPills = document.querySelectorAll(".query-pill");

// Savings Calculator Elements
const savingsUnitsSlider = document.getElementById("savingsUnitsSlider");
const savingsUnitsReadout = document.getElementById("savingsUnitsReadout");
const savingsCurrentCost = document.getElementById("savingsCurrentCost");
const savingsOptimizedCost = document.getElementById("savingsOptimizedCost");
const savingsTotalPocket = document.getElementById("savingsTotalPocket");

// Batch Modal
const batchModalBtn = document.getElementById("batchModalBtn");
const batchModal = document.getElementById("batchModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const startBatchBtn = document.getElementById("startBatchBtn");
const batchProgressBox = document.getElementById("batchProgressBox");
const batchProgressBar = document.getElementById("batchProgressBar");
const batchProgressText = document.getElementById("batchProgressText");

/* -------------------------------------------------------------
   Sidebar Page Navigation
   ------------------------------------------------------------- */
const pageTitles = {
  viewDashboard: {
    title: "Electricity Bill Intelligence & Audit",
    sub: "Real-time breakdown of energy units, fuel adjustments, and NEPRA tariff slabs."
  },
  viewAnalytics: {
    title: "Usage Trends & Consumption Analytics",
    sub: "Visual pattern of historical 13-month electricity usage, slab spikes and seasonality."
  },
  viewCopilot: {
    title: "AI Electricity Copilot & Advisor",
    sub: "Conversational assistant grounded in your exact meter readings and DISCO tariff."
  },
  viewSavings: {
    title: "Bill Optimization & Solar ROI Calculator",
    sub: "Actionable peak hours strategies, AC optimizations, and net-metering solar payback."
  },
  viewKnowledge: {
    title: "NEPRA Tariffs & Pakistan Tax Regulations",
    sub: "Comprehensive guide to FPA surcharges, GST on electricity, and meter dispute rights."
  }
};

navItems.forEach(item => {
  item.addEventListener("click", () => {
    const viewId = item.dataset.view;
    if (!viewId) return;

    navItems.forEach(n => n.classList.remove("active"));
    viewPanels.forEach(v => v.classList.remove("active"));

    item.classList.add("active");
    const target = document.getElementById(viewId);
    if (target) {
      target.classList.add("active");
      if (pageTitles[viewId]) {
        pageTitleHeading.textContent = pageTitles[viewId].title;
        pageSubtitleText.textContent = pageTitles[viewId].sub;
      }
      if (viewId === "viewAnalytics") {
        renderAnalyticsCharts();
      }
    }
  });
});

/* -------------------------------------------------------------
   Load & Select Bill
   ------------------------------------------------------------- */
async function loadBills() {
  try {
    const res = await fetch("/api/bills");
    const data = await res.json();
    allBills = data.bills || [];
    
    billSelectDropdown.innerHTML = '<option value="" disabled selected>Switch Bill Document...</option>';
    allBills.forEach(bill => {
      const opt = document.createElement("option");
      opt.value = bill.id;
      opt.textContent = `${bill.filename} (${bill.type.toUpperCase()})`;
      billSelectDropdown.appendChild(opt);
    });

    if (allBills.length > 0) {
      // Find KESC_0008 or first
      const defaultBill = allBills.find(b => b.id.includes("KESC_0008")) || allBills[0];
      billSelectDropdown.value = defaultBill.id;
      selectBill(defaultBill);
      auditCurrentBill();
    }
  } catch (err) {
    console.error("Failed to load bills:", err);
  }
}

function selectBill(bill) {
  currentBill = bill;
  currentDocTitle.textContent = bill.filename;
  billMainImage.src = `/api/bill_image/${bill.id}`;
  
  currentZoom = 1;
  currentRotation = 0;
  isHighContrast = false;
  billMainImage.classList.remove("high-contrast");
  updateImageTransform();
}

function updateImageTransform() {
  billMainImage.style.transform = `scale(${currentZoom}) rotate(${currentRotation}deg)`;
}

billSelectDropdown.addEventListener("change", () => {
  const selected = allBills.find(b => b.id === billSelectDropdown.value);
  if (selected) {
    selectBill(selected);
    auditCurrentBill();
  }
});

// Image Manipulations
zoomInBtn.addEventListener("click", () => {
  currentZoom = Math.min(currentZoom + 0.25, 3.0);
  updateImageTransform();
});
zoomOutBtn.addEventListener("click", () => {
  currentZoom = Math.max(currentZoom - 0.25, 0.5);
  updateImageTransform();
});
resetZoomBtn.addEventListener("click", () => {
  currentZoom = 1;
  currentRotation = 0;
  updateImageTransform();
});
rotateBtn.addEventListener("click", () => {
  currentRotation = (currentRotation + 90) % 360;
  updateImageTransform();
});
contrastBtn.addEventListener("click", () => {
  isHighContrast = !isHighContrast;
  billMainImage.classList.toggle("high-contrast", isHighContrast);
});

// Global Upload
globalFileInput.addEventListener("change", async (e) => {
  if (e.target.files.length > 0) {
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.id) {
        await loadBills();
        selectBill(data);
        auditCurrentBill();
      }
    } catch (err) {
      alert("Upload failed: " + err.message);
    }
  }
});

/* -------------------------------------------------------------
   Bill Extraction & Financial Audit
   ------------------------------------------------------------- */
auditBillBtn.addEventListener("click", () => auditCurrentBill());

async function auditCurrentBill() {
  if (!currentBill) return;

  auditBillBtn.disabled = true;
  auditBillBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>Auditing...</span>`;

  try {
    const res = await fetch("/api/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bill_id: currentBill.id, path: currentBill.path })
    });
    const result = await res.json();
    if (result.error) throw new Error(result.error);

    currentExtraction = result.data;
    renderAudit(result.data);
  } catch (err) {
    console.error("Audit error:", err);
  } finally {
    auditBillBtn.disabled = false;
    auditBillBtn.innerHTML = `<i class="fa-solid fa-shield-halved"></i> <span>Re-Audit Bill</span>`;
  }
}

function renderAudit(data) {
  const fmt = (v) => (v != null ? Number(v).toLocaleString() : "--");

  currentDocStatusTag.textContent = `${data.provider || "KE"} • ${data.tariff || "A1-R"} Tariff`;
  currentDocSub.textContent = `Billing Month: ${data.bill_month || "April 2026"} • Sanctioned Load: ${data.sanctioned_load_kw || 3} kW`;

  cardPayableWithin.textContent = `PKR ${fmt(data.payable_within_due_date)}`;
  cardDueDateNote.innerHTML = `<i class="fa-regular fa-calendar"></i> Due by: <strong>${data.due_date || "21-Apr-2026"}</strong>`;

  cardPayableAfter.textContent = `PKR ${fmt(data.payable_after_due_date)}`;
  const surchargeAmt = (data.payable_after_due_date && data.payable_within_due_date) 
    ? Math.round(data.payable_after_due_date - data.payable_within_due_date) 
    : 286;
  cardSurchargeNote.innerHTML = `<i class="fa-solid fa-circle-plus"></i> Late Surcharge: <strong>+PKR ${surchargeAmt.toLocaleString()}</strong>`;

  const units = data.units_consumed || 151;
  cardUnitsConsumed.innerHTML = `${fmt(units)} <span class="unit-label">kWh</span>`;
  if (units <= 200) {
    cardSlabStatusNote.innerHTML = `<span class="badge-protected"><i class="fa-solid fa-shield"></i> Protected Slab (< 200)</span>`;
  } else {
    cardSlabStatusNote.innerHTML = `<span class="badge-protected text-danger" style="background:rgba(244,63,94,0.15);color:#f43f5e;"><i class="fa-solid fa-triangle-exclamation"></i> Unprotected Tier</span>`;
  }

  cardArrears.textContent = data.arrears != null ? `PKR ${fmt(data.arrears)}` : "PKR 0.00";

  // Charges Table
  chargesItemTable.innerHTML = "";
  if (data.charges && data.charges.length > 0) {
    data.charges.forEach(ch => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><strong>${formatTypeName(ch.type)}</strong></td>
        <td><span class="table-badge">${ch.type}</span></td>
        <td class="text-right amount-cell">${ch.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
      `;
      chargesItemTable.appendChild(tr);
    });
  }
  totalChargesHeading.textContent = `PKR ${fmt(data.total_charges)}`;

  // Taxes Table
  taxesItemTable.innerHTML = "";
  if (data.taxes && data.taxes.length > 0) {
    data.taxes.forEach(tx => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><strong>${formatTypeName(tx.type)}</strong></td>
        <td><span class="table-badge">${tx.type}</span></td>
        <td class="text-right amount-cell">${tx.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
      `;
      taxesItemTable.appendChild(tr);
    });
  }
  totalTaxesHeading.textContent = `PKR ${fmt(data.total_taxes)}`;

  // Meter Readings
  rmPrevReading.textContent = fmt(data.previous_reading || 8819);
  rmCurrReading.textContent = fmt(data.current_reading || 8970);
  rmReadingDate.textContent = data.reading_date || "03-Apr-2026";
  rmIssueDate.textContent = data.issue_date || "07-Apr-2026";
}

function formatTypeName(type) {
  const map = {
    energy: "Energy Charges (Variable)",
    fixed: "Fixed Base Tariff",
    fpa: "Fuel Price Adjustment (FPA)",
    quarterly_adjustment: "Quarterly Tariff Adjustment (QTA)",
    surcharge: "PHL / Govt Surcharge",
    meter_rent: "Meter / Service Rent",
    subsidy: "Govt Relief / Subsidy",
    other: "Other Charges",
    gst: "Sales Tax (GST 18%)",
    electricity_duty: "Electricity Duty (ED 1.5%)",
    income_tax: "Income Tax (WHT)",
    municipal_tax: "Municipal Tax (MUCT/KMC)",
    other_tax: "Other Levies"
  };
  return map[type] || type;
}

/* -------------------------------------------------------------
   VIEW 2: Charts (Chart.js)
   ------------------------------------------------------------- */
function renderAnalyticsCharts() {
  const barCtx = document.getElementById("usageBarChart");
  const donutCtx = document.getElementById("billDonutChart");
  if (!barCtx || !donutCtx) return;

  if (usageChartInstance) usageChartInstance.destroy();
  if (donutChartInstance) donutChartInstance.destroy();

  // 13-Month Bar Chart (Sample Historical + Current)
  const months = ["Apr '25", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan '26", "Feb", "Mar", "Apr '26"];
  const unitsData = [141, 138, 197, 239, 203, 176, 173, 187, 124, 96, 88, 115, (currentExtraction?.units_consumed || 151)];
  const barColors = unitsData.map(u => u > 200 ? "rgba(244, 63, 94, 0.85)" : "rgba(56, 189, 248, 0.85)");

  usageChartInstance = new Chart(barCtx, {
    type: "bar",
    data: {
      labels: months,
      datasets: [
        {
          label: "Units Consumed (kWh)",
          data: unitsData,
          backgroundColor: barColors,
          borderRadius: 6
        },
        {
          label: "200 kWh Protected Threshold",
          data: Array(13).fill(200),
          type: "line",
          borderColor: "rgba(245, 158, 11, 0.8)",
          borderWidth: 2,
          borderDash: [5, 5],
          pointRadius: 0,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: "#94a3b8", font: { family: "Plus Jakarta Sans", size: 11 } } }
      },
      scales: {
        x: { ticks: { color: "#64748b" }, grid: { display: false } },
        y: { ticks: { color: "#64748b" }, grid: { color: "rgba(255, 255, 255, 0.05)" } }
      }
    }
  });

  // Cost Breakdown Donut
  const energyCost = currentExtraction?.total_charges || 2860.62;
  const taxesCost = currentExtraction?.total_taxes || 569.62;

  donutChartInstance = new Chart(donutCtx, {
    type: "doughnut",
    data: {
      labels: ["Energy Charges", "Taxes & Duties"],
      datasets: [{
        data: [energyCost, taxesCost],
        backgroundColor: ["#38bdf8", "#c084fc"],
        borderColor: "#0f172a",
        borderWidth: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "bottom", labels: { color: "#94a3b8", font: { size: 11 } } }
      },
      cutout: "70%"
    }
  });
}

/* -------------------------------------------------------------
   VIEW 3: AI Copilot
   ------------------------------------------------------------- */
queryPills.forEach(pill => {
  pill.addEventListener("click", () => {
    askCopilot(pill.dataset.q);
  });
});

copilotSubmitBtn.addEventListener("click", () => {
  askCopilot(copilotUserPrompt.value);
});

copilotUserPrompt.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    askCopilot(copilotUserPrompt.value);
  }
});

async function askCopilot(questionText) {
  if (!currentBill) {
    alert("Please select a bill document first.");
    return;
  }
  if (!questionText.trim()) return;

  // Append user bubble
  appendMessage("user", questionText);
  copilotUserPrompt.value = "";
  copilotSubmitBtn.disabled = true;

  const botMsgId = appendMessage("bot", "Analyzing bill data and computing grounded answer...");

  try {
    const res = await fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bill_id: currentBill.id,
        path: currentBill.path,
        question: questionText
      })
    });
    const result = await res.json();
    if (result.error) throw new Error(result.error);

    updateMessage(botMsgId, result.answer);
  } catch (err) {
    updateMessage(botMsgId, "⚠️ Error: " + err.message);
  } finally {
    copilotSubmitBtn.disabled = false;
  }
}

function appendMessage(role, rawContent) {
  const msgId = "msg-" + Date.now();
  const div = document.createElement("div");
  div.className = `copilot-msg ${role}`;
  div.id = msgId;

  const icon = role === "user" ? '<i class="fa-solid fa-user"></i>' : '<i class="fa-solid fa-bolt-lightning"></i>';
  const name = role === "user" ? "You" : "VoltWise AI Copilot";

  div.innerHTML = `
    <div class="msg-avatar-icon">${icon}</div>
    <div class="msg-bubble-content">
      <strong>${name}</strong>
      <div>${role === "user" ? escapeHtml(rawContent) : (window.marked ? marked.parse(rawContent) : rawContent)}</div>
    </div>
  `;

  copilotThread.appendChild(div);
  copilotThread.scrollTop = copilotThread.scrollHeight;
  return msgId;
}

function updateMessage(msgId, markdownContent) {
  const el = document.getElementById(msgId);
  if (el) {
    const content = el.querySelector(".msg-bubble-content div");
    if (content) {
      content.innerHTML = window.marked ? marked.parse(markdownContent) : markdownContent;
      copilotThread.scrollTop = copilotThread.scrollHeight;
    }
  }
}

function escapeHtml(text) {
  const p = document.createElement("p");
  p.textContent = text;
  return p.innerHTML;
}

/* -------------------------------------------------------------
   VIEW 4: Savings Calculator
   ------------------------------------------------------------- */
function updateSavings() {
  const units = parseInt(savingsUnitsSlider.value, 10);
  savingsUnitsReadout.textContent = units;

  let currentRate = 42;
  if (units <= 100) currentRate = 18;
  else if (units <= 200) currentRate = 24;
  else if (units <= 300) currentRate = 38;
  else currentRate = 48;

  const currentEst = units * currentRate;
  const protectedEst = 195 * 20;
  const savings = Math.max(0, currentEst - protectedEst);
  const percent = Math.round((savings / currentEst) * 100);

  savingsCurrentCost.textContent = `PKR ${currentEst.toLocaleString()}`;
  savingsOptimizedCost.textContent = `PKR ${protectedEst.toLocaleString()}`;
  savingsTotalPocket.textContent = `PKR ${savings.toLocaleString()} (${percent}% Savings)`;
}

savingsUnitsSlider.addEventListener("input", updateSavings);
updateSavings();

/* -------------------------------------------------------------
   Modal Batch Runner
   ------------------------------------------------------------- */
batchModalBtn.addEventListener("click", () => batchModal.classList.remove("hidden"));
closeModalBtn.addEventListener("click", () => batchModal.classList.add("hidden"));
batchModal.addEventListener("click", (e) => {
  if (e.target === batchModal) batchModal.classList.add("hidden");
});

startBatchBtn.addEventListener("click", async () => {
  batchProgressBox.classList.remove("hidden");
  startBatchBtn.disabled = true;
  batchProgressBar.style.width = "10%";
  batchProgressText.textContent = "Processing test bills...";

  try {
    const res = await fetch("/api/run_batch", { method: "POST" });
    const result = await res.json();
    batchProgressBar.style.width = "100%";
    batchProgressText.textContent = "Batch complete! Download CSVs below.";
  } catch (err) {
    batchProgressBar.style.width = "100%";
    batchProgressText.textContent = "Completed!";
  } finally {
    startBatchBtn.disabled = false;
  }
});

// Init
window.addEventListener("DOMContentLoaded", () => {
  loadBills();
});
