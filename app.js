const $ = (selector) => document.querySelector(selector);

let tripData = null;

async function init() {
  const response = await fetch("data.json");
  tripData = await response.json();

  renderTrip();
  renderBudgetItems();
  setupEvents();
  openInitialTab();
}

function renderTrip() {
  $("#trip-title").textContent = tripData.title;
  $("#trip-summary").textContent = `${tripData.destination} · ${tripData.dates} · ${tripData.people.length} personas`;

  $("#resumen").innerHTML = `
    <article class="card stat-card">
      <span class="stat-icon">📅</span>
      <strong>4 jun → 25 jun</strong>
      <span>Fechas del viaje</span>
    </article>

    <article class="card stat-card">
      <span class="stat-icon">🌍</span>
      <strong>5 países</strong>
      <span>España, Francia, Alemania, Suiza e Italia</span>
    </article>

    <article class="card stat-card">
      <span class="stat-icon">👥</span>
      <strong>${tripData.people.length}</strong>
      <span>Personas viajando</span>
    </article>
  `;

  const totalStages = tripData.schedule.length;

  $("#timeline").innerHTML = tripData.schedule.map((stage, index) => {
    const startHue = 220;
    const endHue = 18;

    const hue = totalStages > 1
      ? Math.round(startHue - ((startHue - endHue) * index / (totalStages - 1)))
      : startHue;

    return `
      <details
        class="day stage-block"
        style="--stage-accent: hsl(${hue} 85% 52%); --stage-soft: hsl(${hue} 100% 96%); --stage-border-soft: hsl(${hue} 70% 88%);"
        ${index === 0 ? "open" : ""}
      >
        <summary class="stage-header">
          <div>
            <h3>${stage.city} <span class="stage-range">(${stage.range})</span></h3>
            <p class="stage-summary">${stage.summary || ""}</p>
          </div>

          <span class="stage-toggle">Ver detalles</span>
        </summary>

        <div class="stage-content">
          ${stage.days.map(day => `
            <div class="stage-day">
              <h4>${formatDate(day.date)} · ${day.title}</h4>

              ${day.items.map(item => `
                <div class="event">
                  <span class="time">${item.time}</span>

                  <div>
                    <strong>${item.title}</strong>
                    <p>${item.details}</p>
                  </div>
                </div>
              `).join("")}
            </div>
          `).join("")}
        </div>
      </details>
    `;
  }).join("");

  $("#bookings").innerHTML = tripData.bookings.map((booking, index) => {
    const files = booking.files || (booking.file ? [{ label: "Descargar", file: booking.file }] : []);

    const allButton = files.length > 1
      ? `<button type="button" onclick="downloadBookingFiles(${index})">Descargar todo</button>`
      : "";

    const fileLinks = files.map(item => `
      <a href="${item.file}" download>${item.label || item.person || "Archivo"}</a>
    `).join("");

    return `
      <article class="booking">
        <div>
          <strong>${booking.name}</strong><br>
          <span>${booking.type}</span>
          ${booking.note ? `<p>${booking.note}</p>` : ""}
        </div>

        <div class="booking-actions">
          ${allButton}
          ${fileLinks}
        </div>
      </article>
    `;
  }).join("");
}

function renderBudgetItems() {
  const budgetItems = tripData.budgetItems || [];

  const totalGeneral = budgetItems.reduce((sum, item) => {
    return sum + Number(item.total || 0);
  }, 0);

  const totalPagado = budgetItems
    .filter(item => item.paid)
    .reduce((sum, item) => {
      return sum + Number(item.total || 0);
    }, 0);

  const totalPendiente = budgetItems
    .filter(item => !item.paid)
    .reduce((sum, item) => {
      return sum + Number(item.total || 0);
    }, 0);

  const costosSinValor = budgetItems.filter(item => {
    return Number(item.total || 0) === 0;
  }).length;

  const porPersona = tripData.people.length
    ? totalGeneral / tripData.people.length
    : 0;

  $("#budgetSummary").innerHTML = `
    <span class="pill">Total confirmado: ${formatMoney(totalGeneral)} COP</span>
    <span class="pill">Pagado: ${formatMoney(totalPagado)} COP</span>
    <span class="pill">Pendiente valorizado: ${formatMoney(totalPendiente)} COP</span>
    <span class="pill">Costos sin valor: ${costosSinValor}</span>
    <span class="pill">Por persona: ${formatMoney(porPersona)} COP</span>
  `;

  const groupedItems = groupByCategory(budgetItems);

  $("#budgetRows").innerHTML = Object.entries(groupedItems).map(([category, items]) => {
    const categoryTotal = items.reduce((sum, item) => {
      return sum + Number(item.total || 0);
    }, 0);

    const categoryPerPerson = tripData.people.length
      ? categoryTotal / tripData.people.length
      : 0;

    return `
      <tr class="category-row">
        <td colspan="7">
          <div class="category-title">
            <span>${category}</span>
            <small>Total: ${formatMoney(categoryTotal)} COP · Por persona: ${formatMoney(categoryPerPerson)} COP</small>
          </div>
        </td>
      </tr>

      ${items.map(item => `
        <tr>
          <td><strong>${item.concept}</strong></td>
          <td>${item.provider || "—"}</td>
          <td class="nowrap">${formatDate(item.date)}</td>
          <td class="money-cell">${formatMoney(item.total)} ${item.currency}</td>
          <td class="money-cell">${formatMoney(item.perPerson)} ${item.currency}</td>
          <td>
            <span class="status ${item.paid ? "paid" : "pending"}">
              ${item.paid ? "Pagado" : "Pendiente"}
            </span>
          </td>
          <td>${item.note || "—"}</td>
        </tr>
      `).join("")}
    `;
  }).join("");
}
function groupByCategory(items) {
  const order = ["Transporte", "Alojamiento", "Alquiler", "Entradas", "Otros"];

  const grouped = items.reduce((acc, item) => {
    const category = item.category || "Otros";

    if (!acc[category]) {
      acc[category] = [];
    }

    acc[category].push(item);
    return acc;
  }, {});

  return Object.fromEntries(
    Object.entries(grouped).sort(([a], [b]) => {
      const indexA = order.indexOf(a);
      const indexB = order.indexOf(b);

      if (indexA === -1 && indexB === -1) {
        return a.localeCompare(b);
      }

      if (indexA === -1) return 1;
      if (indexB === -1) return -1;

      return indexA - indexB;
    })
  );
}

function formatDate(dateString) {
  const date = new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString("es-CO", {
    day: "numeric",
    month: "short"
  });
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString("es-CO", {
    maximumFractionDigits: 0
  });
}

function downloadBookingFiles(index) {
  const booking = tripData.bookings[index];
  const files = booking.files || (booking.file ? [{ file: booking.file }] : []);

  files.forEach((item, fileIndex) => {
    setTimeout(() => {
      const link = document.createElement("a");
      link.href = item.file;
      link.download = item.file.split("/").pop();

      document.body.appendChild(link);
      link.click();
      link.remove();
    }, fileIndex * 300);
  });
}

function setupTabs() {
  document.querySelectorAll("[data-tab]").forEach(button => {
    button.addEventListener("click", () => {
      activateTab(button.dataset.tab, true);
    });
  });

  document.querySelectorAll("[data-tab-link]").forEach(link => {
    link.addEventListener("click", event => {
      event.preventDefault();

      const tabName = link.dataset.tabLink;
      activateTab(tabName, true);

      document.querySelector(".travel-tabs").scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    });
  });
}

function activateTab(tabName, updateHash = false) {
  document.querySelectorAll("[data-tab]").forEach(button => {
    const isActive = button.dataset.tab === tabName;

    button.classList.toggle("active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });

  document.querySelectorAll(".tab-panel").forEach(panel => {
    const isActive = panel.id === tabName;

    panel.classList.toggle("active", isActive);
    panel.hidden = !isActive;
  });

  if (updateHash) {
    history.replaceState(null, "", `#${tabName}`);
  }
}

function openInitialTab() {
  const tabFromHash = location.hash.replace("#", "");

  if (["cronograma", "reservas", "gastos"].includes(tabFromHash)) {
    activateTab(tabFromHash);
  }
}

function setupEvents() {
  setupTabs();

  $("#exportBudget").addEventListener("click", exportBudgetCsv);
}

function exportBudgetCsv() {
  const budgetItems = tripData.budgetItems || [];

  const rows = [
    ["Categoría", "Concepto", "Proveedor", "Fecha", "Total", "Por persona", "Moneda", "Estado", "Nota"]
  ].concat(
    budgetItems.map(item => [
      item.category,
      item.concept,
      item.provider || "",
      item.date,
      item.total,
      item.perPerson,
      item.currency,
      item.paid ? "Pagado" : "Pendiente",
      item.note || ""
    ])
  );

  const csv = rows
    .map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "costos-fijos-viaje.csv";
  link.click();

  URL.revokeObjectURL(url);
}

init();