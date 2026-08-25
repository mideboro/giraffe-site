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
  const length = Number(document.getElementById("quickLength").value);
  const width = Number(document.getElementById("quickWidth").value);
  const height = Number(document.getElementById("quickHeight").value);
  const weight = Number(document.getElementById("quickWeight").value);

  if (!length || !width || !height || !weight) return;

  const result = calculateDensity(length, width, height, weight);
  document.getElementById("quickDensity").textContent = `${result.density.toFixed(2)} PCF`;
  document.getElementById("quickClass").textContent = result.freightClass;
  document.getElementById("quickDistance").textContent = result.next
    ? `${result.next.needed.toFixed(2)} PCF from Class ${result.next.targetClass}.`
    : "Already in one of the densest classes available.";
}

["quickLength", "quickWidth", "quickHeight", "quickWeight"].forEach((id) => {
  document.getElementById(id).addEventListener("input", renderQuickDemo);
});
document.getElementById("quickCalculate").addEventListener("click", renderQuickDemo);
renderQuickDemo();

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

document.getElementById("addPiece").addEventListener("click", addPiece);
document.getElementById("calculate").addEventListener("click", calculateFull);
document.getElementById("resetAll").addEventListener("click", resetAll);
document.getElementById("copyResults").addEventListener("click", copyResults);
