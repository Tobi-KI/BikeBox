const form = document.getElementById('sim-form');
const statusEl = document.getElementById('status');
const resultsEl = document.getElementById('results');
const metricsEl = document.getElementById('metrics');
const purchaseBody = document.getElementById('purchase-body');
const chart = document.getElementById('chart');
const ctx = chart.getContext('2d');

const endDateInput = document.getElementById('end-date');
if (!endDateInput.value) {
  endDateInput.value = new Date().toISOString().slice(0, 10);
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const symbol = document.getElementById('symbol').value.trim().toLowerCase();
  const startMonth = document.getElementById('start-month').value;
  const endDate = document.getElementById('end-date').value;
  const monthly = Number(document.getElementById('monthly').value);
  const initial = Number(document.getElementById('initial').value);

  if (!symbol || !startMonth || !endDate || monthly <= 0 || initial < 0) {
    setStatus('Bitte gültige Eingaben machen.', true);
    return;
  }

  setStatus('Lade Kursdaten…');
  resultsEl.classList.add('hidden');

  try {
    const prices = await loadStooqData(symbol);
    const result = simulate(prices, startMonth, endDate, monthly, initial);
    renderResult(result, symbol, monthly);
    setStatus(`Simulation erfolgreich für ${symbol.toUpperCase()}.`);
  } catch (error) {
    setStatus(error.message, true);
  }
});

async function loadStooqData(symbol) {
  const url = `https://stooq.com/q/d/l/?s=${encodeURIComponent(symbol)}&i=d`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error('Kursdaten konnten nicht geladen werden. Bitte Symbol prüfen.');
  }

  const csv = await res.text();
  const lines = csv.trim().split('\n');

  if (lines.length < 5) {
    throw new Error('Zu wenige Kursdaten gefunden.');
  }

  const prices = lines.slice(1).map((line) => {
    const [date, , , , close] = line.split(',');
    return {
      date,
      ts: new Date(date + 'T00:00:00Z').getTime(),
      close: Number(close),
    };
  }).filter((row) => Number.isFinite(row.close));

  prices.sort((a, b) => a.ts - b.ts);
  return prices;
}

function simulate(prices, startMonth, endDate, monthly, initial) {
  const start = new Date(`${startMonth}-01T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    throw new Error('Ungültiger Zeitraum.');
  }

  const purchases = [];
  let totalShares = 0;
  let invested = 0;

  const firstPrice = prices.find((p) => p.ts >= start.getTime());
  if (!firstPrice) {
    throw new Error('Keine Kurse im gewählten Zeitraum gefunden.');
  }

  if (initial > 0) {
    const initialShares = initial / firstPrice.close;
    totalShares += initialShares;
    invested += initial;
    purchases.push({
      date: firstPrice.date,
      close: firstPrice.close,
      contribution: initial,
      sharesBought: initialShares,
      totalShares,
      portfolioValue: totalShares * firstPrice.close,
      invested,
    });
  }

  let cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));

  while (cursor <= end) {
    const targetTs = cursor.getTime();
    const price = prices.find((p) => p.ts >= targetTs);

    if (!price || price.ts > end.getTime()) {
      break;
    }

    const sharesBought = monthly / price.close;
    totalShares += sharesBought;
    invested += monthly;

    purchases.push({
      date: price.date,
      close: price.close,
      contribution: monthly,
      sharesBought,
      totalShares,
      portfolioValue: totalShares * price.close,
      invested,
    });

    cursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1));
  }

  if (!purchases.length) {
    throw new Error('Es wurden keine Käufe simuliert.');
  }

  const lastPrice = [...prices].reverse().find((p) => p.ts <= end.getTime()) || purchases[purchases.length - 1];
  const finalValue = totalShares * lastPrice.close;

  return {
    purchases,
    totalShares,
    invested,
    finalValue,
    gain: finalValue - invested,
    returnPct: (finalValue / invested - 1) * 100,
    startDate: purchases[0].date,
    endDate: lastPrice.date,
    lastPrice: lastPrice.close,
  };
}

function renderResult(result, symbol, monthly) {
  const mortgageEquivalent = result.purchases.length * monthly;

  metricsEl.innerHTML = [
    metric('Investiert gesamt', euro(result.invested)),
    metric('Depotwert am Ende', euro(result.finalValue)),
    metric('Gewinn / Verlust', euro(result.gain)),
    metric('Rendite', `${result.returnPct.toFixed(2)} %`),
    metric('Gesamtstücke', result.totalShares.toFixed(4)),
    metric('Vergleich Hypothek', `${euro(mortgageEquivalent)} abbezahlt`),
    metric('Zeitraum', `${result.startDate} bis ${result.endDate}`),
    metric(`${symbol.toUpperCase()} letzter Kurs`, euro(result.lastPrice)),
  ].join('');

  purchaseBody.innerHTML = '';
  for (const row of result.purchases.slice(0, 12)) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${row.date}</td>
      <td>${row.close.toFixed(2)}</td>
      <td>${row.contribution.toFixed(2)}</td>
      <td>${row.sharesBought.toFixed(5)}</td>
      <td>${row.totalShares.toFixed(5)}</td>
      <td>${row.portfolioValue.toFixed(2)}</td>
    `;
    purchaseBody.appendChild(tr);
  }

  drawChart(result.purchases);
  resultsEl.classList.remove('hidden');
}

function drawChart(series) {
  ctx.clearRect(0, 0, chart.width, chart.height);

  const padding = 40;
  const width = chart.width - padding * 2;
  const height = chart.height - padding * 2;

  const maxY = Math.max(...series.map((r) => Math.max(r.portfolioValue, r.invested)));
  const xStep = width / Math.max(series.length - 1, 1);

  ctx.strokeStyle = '#d9e2ec';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i += 1) {
    const y = padding + (height / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(padding + width, y);
    ctx.stroke();
  }

  const toY = (v) => padding + height - (v / maxY) * height;

  line(series.map((r, i) => [padding + i * xStep, toY(r.invested)]), '#ff8c42');
  line(series.map((r, i) => [padding + i * xStep, toY(r.portfolioValue)]), '#005ad3');

  ctx.fillStyle = '#34495e';
  ctx.font = '14px sans-serif';
  ctx.fillText('Orange: investiert', padding, 18);
  ctx.fillText('Blau: Depotwert', padding + 180, 18);
}

function line(points, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  points.forEach(([x, y], idx) => {
    if (idx === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
}

function metric(label, value) {
  return `<div class="metric"><div class="label">${label}</div><div class="value">${value}</div></div>`;
}

function euro(value) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);
}

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.style.color = isError ? '#b42318' : '#0f5132';
}
