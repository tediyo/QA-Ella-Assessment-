const fs = require('fs');
const path = require('path');

/**
 * Custom High-Performance HTML Test Reporter for Jest
 * Generates self-contained, interactive HTML reports with coloured SVG pie charts,
 * response time graphs, KPIs, search/filter controls, and Dark/Light Mode toggle.
 * Zero external npm dependencies required.
 */
class HtmlReporter {
  constructor(globalConfig, options = {}) {
    this.globalConfig = globalConfig;
    this.options = options;
    this.outputFile = options.outputFile || 'reports/test-report.html';
    this.reportTitle = options.pageTitle || 'Ella API — Automated Test Execution Report';
  }

  onRunComplete(_contexts, results) {
    const totalTests = results.numTotalTests || 0;
    const passedTests = results.numPassedTests || 0;
    const failedTests = results.numFailedTests || 0;
    const pendingTests = results.numPendingTests || 0;
    const passRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0;
    const totalDurationSeconds = ((Date.now() - results.startTime) / 1000).toFixed(2);

    // Collect individual test timings and statuses
    const flattened = [];
    (results.testResults || []).forEach((suite) => {
      const suiteName = path.relative(process.cwd(), suite.testFilePath);
      (suite.testResults || []).forEach((test) => {
        flattened.push({
          suite: suiteName,
          title: test.title,
          fullName: test.fullName || test.title,
          status: test.status,
          duration: test.duration || 0,
          failureMessages: test.failureMessages || [],
        });
      });
    });

    // Timing analysis
    const durations = flattened.map((t) => t.duration).sort((a, b) => a - b);
    const avgDuration = durations.length
      ? (durations.reduce((acc, v) => acc + v, 0) / durations.length).toFixed(1)
      : 0;
    const maxDuration = durations.length ? Math.max(...durations) : 0;
    const minDuration = durations.length ? Math.min(...durations) : 0;

    // Fast (<50ms), Medium (50-200ms), Slow (>200ms)
    const fastCount = flattened.filter((t) => t.duration < 50).length;
    const mediumCount = flattened.filter((t) => t.duration >= 50 && t.duration <= 200).length;
    const slowCount = flattened.filter((t) => t.duration > 200).length;

    // SVG Pie Chart calculations (Radius = 70, Circumference ~ 439.82)
    const circumference = 2 * Math.PI * 70;
    const passStroke = (passedTests / (totalTests || 1)) * circumference;
    const failStroke = (failedTests / (totalTests || 1)) * circumference;
    const pendingStroke = (pendingTests / (totalTests || 1)) * circumference;

    const htmlContent = `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.reportTitle}</title>
  <style>
    /* Theme Tokens */
    :root, [data-theme="dark"] {
      --bg: #0f172a;
      --card-bg: #1e293b;
      --card-border: #334155;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --accent: #38bdf8;
      --accent-hover: #0284c7;
      --pass: #10b981;
      --pass-bg: rgba(16, 185, 129, 0.15);
      --fail: #ef4444;
      --fail-bg: rgba(239, 68, 68, 0.15);
      --warn: #f59e0b;
      --warn-bg: rgba(245, 158, 11, 0.15);
      --donut-track: #334155;
      --bar-track: rgba(255, 255, 255, 0.08);
      --table-header: rgba(255, 255, 255, 0.04);
      --table-hover: rgba(255, 255, 255, 0.02);
      --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
    }

    [data-theme="light"] {
      --bg: #f8fafc;
      --card-bg: #ffffff;
      --card-border: #e2e8f0;
      --text: #0f172a;
      --text-muted: #64748b;
      --accent: #0284c7;
      --accent-hover: #0369a1;
      --pass: #059669;
      --pass-bg: rgba(5, 150, 105, 0.12);
      --fail: #dc2626;
      --fail-bg: rgba(220, 38, 38, 0.12);
      --warn: #d97706;
      --warn-bg: rgba(217, 119, 6, 0.12);
      --donut-track: #e2e8f0;
      --bar-track: rgba(0, 0, 0, 0.06);
      --table-header: #f1f5f9;
      --table-hover: #f8fafc;
      --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      padding: 24px;
      line-height: 1.5;
      transition: background 0.25s ease, color 0.25s ease;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 20px;
      border-bottom: 1px solid var(--card-border);
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 16px;
    }
    .header h1 {
      font-size: 1.6rem;
      font-weight: 700;
      background: linear-gradient(90deg, #38bdf8, #818cf8);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .timestamp {
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    /* Theme Toggle Button */
    .theme-toggle-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      color: var(--text);
      padding: 8px 16px;
      border-radius: 24px;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      box-shadow: var(--shadow);
      transition: all 0.2s ease;
      user-select: none;
    }
    .theme-toggle-btn:hover {
      border-color: var(--accent);
      transform: translateY(-1px);
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .kpi-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 18px 16px;
      text-align: center;
      box-shadow: var(--shadow);
      transition: transform 0.2s ease, border-color 0.2s ease;
    }
    .kpi-card:hover {
      transform: translateY(-2px);
      border-color: var(--accent);
    }
    .kpi-card .value {
      font-size: 1.9rem;
      font-weight: 800;
      margin-top: 4px;
    }
    .kpi-card .label {
      font-size: 0.78rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      font-weight: 600;
    }
    .val-pass { color: var(--pass); }
    .val-fail { color: var(--fail); }
    .val-accent { color: var(--accent); }
    .val-warn { color: var(--warn); }

    .charts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 20px;
      margin-bottom: 24px;
    }
    .chart-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 22px;
      display: flex;
      flex-direction: column;
      align-items: center;
      box-shadow: var(--shadow);
    }
    .chart-card h3 {
      font-size: 1rem;
      margin-bottom: 18px;
      align-self: flex-start;
      color: var(--text);
      font-weight: 700;
    }
    .donut-container {
      position: relative;
      width: 180px;
      height: 180px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .donut-center-text {
      position: absolute;
      text-align: center;
    }
    .donut-center-text .rate {
      font-size: 1.7rem;
      font-weight: 800;
      color: var(--pass);
    }
    .donut-center-text .sub {
      font-size: 0.75rem;
      color: var(--text-muted);
      font-weight: 600;
    }
    .legend {
      display: flex;
      gap: 16px;
      margin-top: 18px;
      font-size: 0.85rem;
    }
    .legend-item { display: flex; align-items: center; gap: 6px; }
    .legend-color { width: 12px; height: 12px; border-radius: 3px; }

    /* Bar Histogram */
    .bar-histogram {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 14px;
      margin-top: 8px;
    }
    .bar-row {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 0.85rem;
    }
    .bar-label { width: 120px; color: var(--text-muted); font-weight: 600; }
    .bar-track {
      flex: 1;
      height: 12px;
      background: var(--bar-track);
      border-radius: 6px;
      overflow: hidden;
    }
    .bar-fill {
      height: 100%;
      border-radius: 6px;
      transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    }

    /* Filter & Controls */
    .controls {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 16px;
    }
    .filter-pills { display: flex; gap: 8px; flex-wrap: wrap; }
    .filter-btn {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      color: var(--text-muted);
      padding: 7px 16px;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      box-shadow: var(--shadow);
      transition: all 0.2s ease;
    }
    .filter-btn.active, .filter-btn:hover {
      background: var(--accent);
      color: #ffffff;
      border-color: var(--accent);
    }
    [data-theme="dark"] .filter-btn.active { color: #0f172a; }

    .search-input {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      color: var(--text);
      padding: 9px 16px;
      border-radius: 8px;
      font-size: 0.9rem;
      min-width: 260px;
      outline: none;
      box-shadow: var(--shadow);
      transition: border-color 0.2s ease;
    }
    .search-input:focus { border-color: var(--accent); }

    /* Test Results Table */
    .table-container {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: var(--shadow);
    }
    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.9rem;
    }
    thead th {
      background: var(--table-header);
      padding: 14px 18px;
      font-weight: 700;
      color: var(--text-muted);
      border-bottom: 1px solid var(--card-border);
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    tbody tr {
      border-bottom: 1px solid var(--card-border);
      transition: background 0.15s;
    }
    tbody tr:last-child { border-bottom: none; }
    tbody tr:hover { background: var(--table-hover); }
    tbody td { padding: 14px 18px; }

    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 14px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .badge-passed { background: var(--pass-bg); color: var(--pass); border: 1px solid var(--pass); }
    .badge-failed { background: var(--fail-bg); color: var(--fail); border: 1px solid var(--fail); }
    .badge-pending { background: var(--warn-bg); color: var(--warn); border: 1px solid var(--warn); }

    .latency-pill {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.82rem;
      font-weight: 700;
      padding: 3px 10px;
      border-radius: 8px;
    }
    .lat-fast { background: var(--pass-bg); color: var(--pass); }
    .lat-med { background: var(--warn-bg); color: var(--warn); }
    .lat-slow { background: var(--fail-bg); color: var(--fail); }

    .suite-name { font-size: 0.8rem; color: var(--text-muted); display: block; margin-top: 2px; }
    .error-log {
      margin-top: 10px;
      background: var(--fail-bg);
      border-left: 4px solid var(--fail);
      padding: 10px 14px;
      font-family: ui-monospace, SFMono-Regular, monospace;
      font-size: 0.82rem;
      color: var(--fail);
      white-space: pre-wrap;
      border-radius: 4px;
    }
  </style>
</head>
<body>

  <header class="header">
    <div>
      <h1>${this.reportTitle}</h1>
      <p style="color: var(--text-muted); font-size: 0.88rem; margin-top: 4px;">
        Automated Backend API &amp; Service Test Execution Dashboard
      </p>
    </div>
    <div class="header-actions">
      <div class="timestamp">
        Ran: <strong>${new Date().toLocaleString()}</strong>
      </div>
      <!-- Light / Dark Mode Toggle Button -->
      <button id="theme-toggle" class="theme-toggle-btn" onclick="toggleTheme()" title="Toggle Light / Dark Mode">
        <span id="theme-icon">☀️</span>
        <span id="theme-label">Light Mode</span>
      </button>
    </div>
  </header>

  <!-- KPI Cards -->
  <section class="kpi-grid">
    <div class="kpi-card">
      <div class="label">Total Tests</div>
      <div class="value">${totalTests}</div>
    </div>
    <div class="kpi-card">
      <div class="label">Pass Rate</div>
      <div class="value val-pass">${passRate}%</div>
    </div>
    <div class="kpi-card">
      <div class="label">Passed</div>
      <div class="value val-pass">${passedTests}</div>
    </div>
    <div class="kpi-card">
      <div class="label">Failed</div>
      <div class="value ${failedTests > 0 ? 'val-fail' : ''}">${failedTests}</div>
    </div>
    <div class="kpi-card">
      <div class="label">Total Runtime</div>
      <div class="value val-accent">${totalDurationSeconds}s</div>
    </div>
    <div class="kpi-card">
      <div class="label">Avg Latency</div>
      <div class="value val-warn">${avgDuration}ms</div>
    </div>
  </section>

  <!-- Graphs & Coloured Charts -->
  <section class="charts-grid">
    <!-- Test Status Donut Chart -->
    <div class="chart-card">
      <h3>Test Status Distribution</h3>
      <div class="donut-container">
        <svg width="180" height="180" viewBox="0 0 180 180" style="transform: rotate(-90deg);">
          <!-- Background track -->
          <circle cx="90" cy="90" r="70" stroke="var(--donut-track)" stroke-width="16" fill="transparent" />
          <!-- Passed arc (Green) -->
          <circle cx="90" cy="90" r="70"
            stroke="var(--pass)"
            stroke-width="16"
            fill="transparent"
            stroke-dasharray="${passStroke} ${circumference}"
            stroke-dashoffset="0" />
          <!-- Failed arc (Red) -->
          <circle cx="90" cy="90" r="70"
            stroke="var(--fail)"
            stroke-width="16"
            fill="transparent"
            stroke-dasharray="${failStroke} ${circumference}"
            stroke-dashoffset="-${passStroke}" />
        </svg>
        <div class="donut-center-text">
          <div class="rate">${passRate}%</div>
          <div class="sub">${passedTests} / ${totalTests} Passed</div>
        </div>
      </div>
      <div class="legend">
        <div class="legend-item"><span class="legend-color" style="background: var(--pass);"></span> Passed (${passedTests})</div>
        <div class="legend-item"><span class="legend-color" style="background: var(--fail);"></span> Failed (${failedTests})</div>
        <div class="legend-item"><span class="legend-color" style="background: var(--warn);"></span> Skipped (${pendingTests})</div>
      </div>
    </div>

    <!-- Response Time / Latency Distribution -->
    <div class="chart-card">
      <h3>Response Time &amp; Latency Breakdown</h3>
      <div class="bar-histogram">
        <div class="bar-row">
          <span class="bar-label">Fast (&lt;50ms)</span>
          <div class="bar-track">
            <div class="bar-fill" style="width: ${(fastCount / (totalTests || 1)) * 100}%; background: var(--pass);"></div>
          </div>
          <span style="width: 45px; text-align: right; color: var(--pass); font-weight: 700;">${fastCount}</span>
        </div>
        <div class="bar-row">
          <span class="bar-label">Moderate (50-200ms)</span>
          <div class="bar-track">
            <div class="bar-fill" style="width: ${(mediumCount / (totalTests || 1)) * 100}%; background: var(--warn);"></div>
          </div>
          <span style="width: 45px; text-align: right; color: var(--warn); font-weight: 700;">${mediumCount}</span>
        </div>
        <div class="bar-row">
          <span class="bar-label">Slow (&gt;200ms)</span>
          <div class="bar-track">
            <div class="bar-fill" style="width: ${(slowCount / (totalTests || 1)) * 100}%; background: var(--fail);"></div>
          </div>
          <span style="width: 45px; text-align: right; color: var(--fail); font-weight: 700;">${slowCount}</span>
        </div>
      </div>
      <div style="margin-top: 24px; font-size: 0.85rem; color: var(--text-muted); width: 100%; display: flex; justify-content: space-around;">
        <div>Min: <strong style="color: var(--text);">${minDuration}ms</strong></div>
        <div>Avg: <strong style="color: var(--text);">${avgDuration}ms</strong></div>
        <div>Max: <strong style="color: var(--text);">${maxDuration}ms</strong></div>
      </div>
    </div>
  </section>

  <!-- Filter Controls -->
  <div class="controls">
    <div class="filter-pills">
      <button class="filter-btn active" onclick="filterTests('all', this)">All (${totalTests})</button>
      <button class="filter-btn" onclick="filterTests('passed', this)">Passed (${passedTests})</button>
      <button class="filter-btn" onclick="filterTests('failed', this)">Failed (${failedTests})</button>
      <button class="filter-btn" onclick="filterTests('slow', this)">Slow (&gt;100ms)</button>
    </div>
    <input
      type="text"
      class="search-input"
      placeholder="Search tests, endpoints, or suites..."
      oninput="searchTests(this.value)"
    />
  </div>

  <!-- Detailed Results Table -->
  <div class="table-container">
    <table>
      <thead>
        <tr>
          <th style="width: 130px;">Status</th>
          <th>Test Description &amp; Suite</th>
          <th style="width: 140px; text-align: right;">Response Time</th>
        </tr>
      </thead>
      <tbody id="test-table-body">
        ${flattened
          .map((test) => {
            const latClass =
              test.duration < 50 ? 'lat-fast' : test.duration <= 200 ? 'lat-med' : 'lat-slow';
            return `
        <tr class="test-row" data-status="${test.status}" data-duration="${test.duration}">
          <td>
            <span class="badge badge-${test.status}">${test.status}</span>
          </td>
          <td>
            <strong>${escapeHtml(test.title)}</strong>
            <span class="suite-name">${escapeHtml(test.suite)}</span>
            ${
              test.failureMessages.length
                ? `<div class="error-log">${escapeHtml(test.failureMessages.join('\n'))}</div>`
                : ''
            }
          </td>
          <td style="text-align: right;">
            <span class="latency-pill ${latClass}">${test.duration} ms</span>
          </td>
        </tr>`;
          })
          .join('')}
      </tbody>
    </table>
  </div>

  <script>
    // Theme Switcher Logic (Persists to localStorage)
    function initTheme() {
      const savedTheme = localStorage.getItem('ella-report-theme');
      if (savedTheme) {
        setTheme(savedTheme);
      } else {
        const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
        setTheme(prefersLight ? 'light' : 'dark');
      }
    }

    function setTheme(theme) {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('ella-report-theme', theme);
      const icon = document.getElementById('theme-icon');
      const label = document.getElementById('theme-label');
      if (theme === 'light') {
        icon.textContent = '🌙';
        label.textContent = 'Dark Mode';
      } else {
        icon.textContent = '☀️';
        label.textContent = 'Light Mode';
      }
    }

    function toggleTheme() {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      setTheme(current === 'dark' ? 'light' : 'dark');
    }

    // Filter Logic
    function filterTests(status, btn) {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      if (btn) btn.classList.add('active');

      const rows = document.querySelectorAll('.test-row');
      rows.forEach(row => {
        const rowStatus = row.getAttribute('data-status');
        const duration = parseInt(row.getAttribute('data-duration') || '0', 10);

        if (status === 'all') {
          row.style.display = '';
        } else if (status === 'slow') {
          row.style.display = duration > 100 ? '' : 'none';
        } else {
          row.style.display = rowStatus === status ? '' : 'none';
        }
      });
    }

    // Search Logic
    function searchTests(query) {
      const q = query.toLowerCase();
      const rows = document.querySelectorAll('.test-row');
      rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        row.style.display = text.includes(q) ? '' : 'none';
      });
    }

    // Initialize on load
    initTheme();
  </script>
</body>
</html>`;

    // Ensure output directory exists
    const absolutePath = path.resolve(process.cwd(), this.outputFile);
    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
    fs.writeFileSync(absolutePath, htmlContent, 'utf8');

    console.log(`\n\x1b[32m✔ 📊 HTML Test Report generated:\x1b[0m \x1b[36m${this.outputFile}\x1b[0m`);
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

module.exports = HtmlReporter;
