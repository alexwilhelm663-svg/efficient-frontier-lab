const fmt = x => (x * 100).toLocaleString('de-DE', { maximumFractionDigits: 2 });
const colors = ['#c3f071', '#6cb8cd', '#eab487'];

export class PortfolioChart {
  constructor(canvas, tooltip) {
    this.canvas = canvas;
    this.tooltip = tooltip;
    this.points = [];
    this.observer = new ResizeObserver(() => this.render());
    this.observer.observe(canvas.parentElement);
    canvas.addEventListener('pointermove', event => this.hover(event));
    canvas.addEventListener('pointerleave', () => { tooltip.hidden = true; });
  }
  setData(data, showEnvelope = false) { this.data = data; this.showEnvelope = showEnvelope; this.render(); }
  render() {
    if (!this.data) return;
    const canvas = this.canvas, ctx = canvas.getContext('2d');
    const width = canvas.clientWidth, height = canvas.clientHeight;
    if (!width || !height) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const { model, cloud, frontier, minimum, maximumSharpe, selected, envelope } = this.data;
    const left = 45, right = width < 450 ? 15 : 23, top = 28, bottom = 48;
    const plotWidth = width - left - right, plotHeight = height - top - bottom;
    const maximumRisk = Math.max(...model.assets.map(a => a.volatility)) * 1.08;
    const r0 = Math.min(...model.mu), r1 = Math.max(...model.mu), spread = Math.max(r1 - r0, 0.01);
    const y0 = r0 - spread * 0.12, y1 = r1 + spread * 0.18;
    const x = v => left + v / maximumRisk * plotWidth;
    const y = r => top + plotHeight - (r - y0) / (y1 - y0) * plotHeight;
    ctx.clearRect(0, 0, width, height);
    ctx.font = '10px system-ui, sans-serif';
    ctx.fillStyle = '#98a9ad'; ctx.textAlign = 'left';
    ctx.fillText('Erwartete Rendite (% p.a.)', left, 13);
    for (let i = 0; i <= 5; i++) {
      const xx = left + plotWidth * i / 5;
      const yy = top + plotHeight * i / 5;
      ctx.strokeStyle = '#2a383d'; ctx.lineWidth = 0.7;
      ctx.beginPath(); ctx.moveTo(xx, top); ctx.lineTo(xx, top + plotHeight); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(left, yy); ctx.lineTo(left + plotWidth, yy); ctx.stroke();
      ctx.fillStyle = '#91a5ab'; ctx.textAlign = 'center';
      ctx.fillText((maximumRisk * i / 5 * 100).toLocaleString('de-DE', { maximumFractionDigits: 1 }), xx, height - bottom + 19);
      ctx.textAlign = 'right';
      ctx.fillText(((y1 - (y1 - y0) * i / 5) * 100).toLocaleString('de-DE', { maximumFractionDigits: 1 }), left - 9, yy + 3);
    }
    ctx.textAlign = 'center'; ctx.fillText('Risiko / Volatilität (% p.a.)', left + plotWidth / 2, height - 6);
    const minS = Math.min(...cloud.map(p => p.sharpe)), maxS = Math.max(...cloud.map(p => p.sharpe));
    this.points = [];
    for (const p of cloud) {
      const t = (p.sharpe - minS) / (maxS - minS || 1);
      ctx.fillStyle = `hsla(${195 - t * 40}, ${25 + t * 15}%, ${40 + t * 16}%, .36)`;
      ctx.beginPath(); ctx.arc(x(p.volatility), y(p.expectedReturn), 1.5, 0, Math.PI * 2); ctx.fill();
      this.points.push({ x: x(p.volatility), y: y(p.expectedReturn), p, label: 'Simulierte Mischung' });
    }
    const line = (values, color, dash = [], lineWidth = 2) => {
      ctx.strokeStyle = color; ctx.lineWidth = lineWidth; ctx.setLineDash(dash); ctx.beginPath();
      values.forEach((p, i) => { const xx = x(p.volatility), yy = y(p.expectedReturn); if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy); });
      ctx.stroke(); ctx.setLineDash([]);
    };
    if (this.showEnvelope) line(envelope, '#8990dc', [3, 4], 1.4);
    line(frontier, '#c3f071', [], 2.6);
    if (selected) {
      ctx.strokeStyle = '#c6d7ce55'; ctx.lineWidth = 1; ctx.setLineDash([3, 4]);
      ctx.beginPath(); ctx.moveTo(x(selected.volatility), y(selected.expectedReturn)); ctx.lineTo(x(selected.volatility), height - bottom); ctx.stroke(); ctx.setLineDash([]);
    }
    const marker = (p, color, label, labelOffset = 0, square = false) => {
      const xx = x(p.volatility), yy = y(p.expectedReturn);
      ctx.beginPath();
      if (square) ctx.rect(xx - 4, yy - 4, 8, 8); else ctx.arc(xx, yy, 5, 0, Math.PI * 2);
      ctx.fillStyle = color; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#172023'; ctx.stroke();
      if (label) {
        ctx.font = '10px system-ui, sans-serif'; ctx.fillStyle = color;
        ctx.textAlign = xx > width - 90 ? 'right' : 'left';
        ctx.fillText(label, xx + (xx > width - 90 ? -10 : 9), yy - 10 + labelOffset);
      }
      this.points.push({ x: xx, y: yy, p, label: label || 'Dein Risikobudget' });
    };
    model.assets.forEach((a, i) => {
      const p = { ...a, sharpe: (a.expectedReturn - model.riskFreeRate) / a.volatility, weights: model.assets.map((_, j) => +(i === j)) };
      marker(p, colors[i % colors.length], String.fromCharCode(65 + i), 0, true);
    });
    marker(minimum, '#b6d5d8', width < 400 ? 'Min.' : 'Min. Risiko', 25);
    marker(maximumSharpe, '#eab487', width < 400 ? 'Sharpe' : 'Max. Sharpe');
    if (selected) marker(selected, '#f1f7ef', 'Budget', 26);
  }
  hover(event) {
    const rect = this.canvas.getBoundingClientRect();
    const px = event.clientX - rect.left, py = event.clientY - rect.top;
    let best = null, distance = 14 ** 2;
    // Reverse gives named portfolios priority at matching coordinates.
    for (let i = this.points.length - 1; i >= 0; i--) {
      const point = this.points[i], d = (point.x - px) ** 2 + (point.y - py) ** 2;
      if (d < distance - 1e-9) { best = point; distance = d; }
    }
    if (!best) { this.tooltip.hidden = true; return; }
    const p = best.p;
    this.tooltip.textContent = `${best.label}\nRendite ${fmt(p.expectedReturn)} % · Risiko ${fmt(p.volatility)} %\nSharpe ${p.sharpe.toLocaleString('de-DE', { maximumFractionDigits: 3 })}\n${p.weights.map((w, i) => `${String.fromCharCode(65 + i)}: ${fmt(w)} %`).join(' · ')}`;
    this.tooltip.hidden = false;
    this.tooltip.style.left = `${Math.max(0, Math.min(px + 12, rect.width - this.tooltip.offsetWidth))}px`;
    this.tooltip.style.top = `${Math.max(0, Math.min(py + 12, rect.height - this.tooltip.offsetHeight))}px`;
  }
}
