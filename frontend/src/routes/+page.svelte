<script lang="ts">
    import { onMount } from "svelte";

    let metrics = $state<any[]>([]);
    let logs = $state<any[]>([]);
    let alerts = $state<any[]>([]);
    let searchQuery = $state("");
    let globalHealth = $state(100);
    let status = $state("OPTIMAL");

    async function fetchMetrics() {
        try {
            const response = await fetch("/api/metrics");
            metrics = await response.json();

            // Calculate a rough global health for the orb
            const bpt = metrics.find((m) => m.name.includes("BPT"));
            if (bpt) {
                globalHealth = Math.floor(bpt.value);
                status = bpt.value > 95 ? "OPTIMAL" : "MONITORING";
            }
        } catch (e) {
            console.error("Failed to fetch metrics", e);
        }
    }

    async function fetchLogs() {
        try {
            const url = new URL("/api/logs", window.location.origin);
            if (searchQuery) url.searchParams.append("query", searchQuery);
            const response = await fetch(url);
            logs = await response.json();
        } catch (e) {
            console.error("Failed to fetch logs", e);
        }
    }

    async function fetchAlerts() {
        try {
            const response = await fetch("/api/alerts");
            alerts = await response.json();
        } catch (e) {
            console.error("Failed to fetch alerts", e);
        }
    }

    function handleSearch(e: Event) {
        e.preventDefault();
        fetchLogs();
    }

    let selectedLog = $state<any>(null);

    function openLog(log: any) {
        selectedLog = log;
    }

    function closeLog() {
        selectedLog = null;
    }

    onMount(() => {
        fetchMetrics();
        fetchLogs();
        fetchAlerts();
        const metricInterval = setInterval(fetchMetrics, 5000);
        const alertInterval = setInterval(fetchAlerts, 15000);
        return () => {
            clearInterval(metricInterval);
            clearInterval(alertInterval);
        };
    });
</script>

<div class="dashboard-container">
    <header class="top-bar glass">
        <div class="brand">
            <span class="lume-logo breathe"></span>
            <h1 class="lume-brand glow-text-primary">LUME</h1>
            <span class="brand-tag">TORRE DE CONTROLO</span>
        </div>
        <div class="system-status">
            {#if alerts.some((a) => a.type === "CRITICAL")}
                <span class="status-dot critical"></span>
                <span class="status-label critical"
                    >SYSTEM ALERT: ATTENTION REQUIRED</span
                >
            {:else}
                <span class="status-dot success"></span>
                <span class="status-label">GLOBAL HEALTH: {status}</span>
            {/if}
        </div>
    </header>

    <main class="light-board-grid">
        <div class="main-visual glass glow-shadow-blue">
            <div class="health-orb-container">
                <div class="health-orb success breathe"></div>
                <div class="health-value">{globalHealth}%</div>
                <div class="health-label">System Integrity</div>
            </div>

            {#if alerts.length > 0}
                <div class="floating-alerts">
                    {#each alerts.slice(0, 2) as alert}
                        <div
                            class="alert-tile glass {alert.type.toLowerCase()}"
                        >
                            <span class="alert-type">{alert.type}</span>
                            <p>{alert.message}</p>
                        </div>
                    {/each}
                </div>
            {/if}

            <div class="visual-footer">
                <p>Real-time ecosystem monitoring active</p>
            </div>
        </div>

        <div class="metrics-sidebar">
            {#each metrics as metric}
                <div class="metric-card glass">
                    <h3>{metric.name}</h3>
                    <div class="metric-value">
                        {metric.name.includes("Logs")
                            ? metric.value.toLocaleString()
                            : "Active"}
                        {metric.name.includes("Logs") ? " EPS" : ""}
                    </div>
                    <div
                        class="metric-trend {metric.status === 'optimal'
                            ? 'success'
                            : 'secondary'}"
                    >
                        {metric.name.includes("Logs")
                            ? "↑ Real-time"
                            : `↑ ${metric.value.toFixed(1)}% Health`}
                    </div>
                </div>
            {/each}
        </div>
    </main>

    <section class="log-spotlight glass">
        <header class="spotlight-header">
            <div class="title-group">
                <h2 class="glow-text-primary">LOG SPOTLIGHT</h2>
                <span class="subtitle">MERRICK ERROR INTELLIGENCE</span>
            </div>
            <form class="search-box glass" onsubmit={handleSearch}>
                <input
                    type="text"
                    placeholder="Search by ID or Message..."
                    bind:value={searchQuery}
                />
                <button type="submit">SEARCH</button>
            </form>
        </header>

        <div class="log-table-container">
            <table class="log-table">
                <thead>
                    <tr>
                        <th>TIMESTAMP</th>
                        <th>ID</th>
                        <th>MODULE</th>
                        <th>LEVEL</th>
                        <th>MESSAGE</th>
                    </tr>
                </thead>
                <tbody>
                    {#each logs as log}
                        <tr
                            class="log-row clickable"
                            onclick={() => openLog(log)}
                        >
                            <td class="timestamp"
                                >{new Date(
                                    log.timestamp,
                                ).toLocaleTimeString()}</td
                            >
                            <td class="id-cell">{log.id}</td>
                            <td class="module-cell"
                                ><span class="badge">{log.module}</span></td
                            >
                            <td class="level-cell">
                                <span
                                    class="level-indicator {log.level.toLowerCase()}"
                                    >{log.level}</span
                                >
                            </td>
                            <td class="message">{log.message}</td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    </section>

    {#if selectedLog}
        <div
            class="modal-backdrop"
            onclick={closeLog}
            onkeydown={(e) => e.key === "Escape" && closeLog()}
            role="button"
            tabindex="0"
            aria-label="Close modal"
        >
            <div
                class="log-detail-modal glass glow-shadow-blue"
                onclick={(e) => e.stopPropagation()}
                role="document"
            >
                <header class="modal-header">
                    <div class="modal-title">
                        <span
                            class="level-indicator {selectedLog.level.toLowerCase()}"
                            >{selectedLog.level}</span
                        >
                        <h2>{selectedLog.id} Detail</h2>
                    </div>
                    <button
                        class="close-btn"
                        onclick={closeLog}
                        aria-label="Close detail view">&times;</button
                    >
                </header>

                <div class="modal-body">
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="detail-label">Timestamp</span>
                            <span class="detail-value"
                                >{new Date(
                                    selectedLog.timestamp,
                                ).toLocaleString()}</span
                            >
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Environment</span>
                            <span class="detail-value"
                                >{selectedLog.environment}</span
                            >
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Module</span>
                            <span class="detail-value badge"
                                >{selectedLog.module}</span
                            >
                        </div>
                    </div>

                    <div class="message-section">
                        <span class="detail-label">Message</span>
                        <p class="full-message">{selectedLog.message}</p>
                    </div>

                    {#if selectedLog.stack_trace || selectedLog.stackTrace}
                        <div class="stack-trace-section">
                            <span class="detail-label">Stack Trace</span>
                            <pre class="stack-trace">{selectedLog.stack_trace ||
                                    selectedLog.stackTrace}</pre>
                        </div>
                    {/if}
                </div>
            </div>
        </div>
    {/if}
</div>

<style>
    .dashboard-container {
        padding: 24px;
        height: 100vh;
        display: flex;
        flex-direction: column;
        gap: 24px;
        max-width: 1600px;
        margin: 0 auto;
    }

    .top-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 32px;
    }

    .brand {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .lume-logo {
        width: 12px;
        height: 12px;
        background: var(--primary-glow);
        border-radius: 50%;
        box-shadow: 0 0 10px var(--primary-glow);
    }

    .lume-brand {
        font-size: 1.5rem;
        font-weight: 800;
        letter-spacing: 2px;
    }

    .brand-tag {
        font-size: 0.75rem;
        color: var(--text-secondary);
        letter-spacing: 1px;
        border-left: 1px solid var(--border-color);
        padding-left: 12px;
        margin-left: 4px;
    }

    .system-status {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.8rem;
        font-weight: 600;
    }

    .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
    }

    .status-dot.success {
        background: var(--success-glow);
        box-shadow: 0 0 8px var(--success-glow);
    }

    .status-dot.critical {
        background: var(--critical-glow);
        box-shadow: 0 0 8px var(--critical-glow);
    }

    .status-label.critical {
        color: var(--critical-glow);
        text-shadow: 0 0 8px rgba(255, 51, 102, 0.3);
    }

    .floating-alerts {
        position: absolute;
        top: 24px;
        right: 24px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        width: 320px;
        z-index: 10;
    }

    .alert-tile {
        padding: 16px;
        border-left: 4px solid var(--primary-glow);
        animation: slideIn 0.5s ease-out;
    }

    .alert-tile.predictive {
        border-color: var(--primary-glow);
    }

    .alert-tile.critical {
        border-color: var(--critical-glow);
        background: rgba(255, 51, 102, 0.05);
    }

    .alert-type {
        font-size: 0.65rem;
        font-weight: 800;
        letter-spacing: 1px;
        color: var(--text-muted);
        display: block;
        margin-bottom: 4px;
    }

    .alert-tile p {
        font-size: 0.8rem;
        line-height: 1.4;
        color: var(--text-primary);
    }

    @keyframes slideIn {
        from {
            transform: translateX(50px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    .light-board-grid {
        flex: 1;
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: 24px;
        min-height: 0;
    }

    .main-visual {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        position: relative;
        overflow: hidden;
    }

    .health-orb-container {
        text-align: center;
        position: relative;
    }

    .health-orb {
        width: 200px;
        height: 200px;
        border-radius: 50%;
        margin-bottom: 24px;
        background: radial-gradient(
            circle at 30% 30%,
            var(--success-glow),
            transparent
        );
        filter: blur(2px);
        border: 2px solid var(--success-glow);
        animation: breathe 4s ease-in-out infinite;
    }

    .health-value {
        font-size: 3.5rem;
        font-weight: 800;
        font-family: "Outfit";
    }

    .health-label {
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 2px;
        font-size: 0.9rem;
    }

    .visual-footer {
        position: absolute;
        bottom: 24px;
        color: var(--text-muted);
        font-size: 0.8rem;
    }

    .metrics-sidebar {
        display: flex;
        flex-direction: column;
        gap: 24px;
    }

    .metric-card {
        padding: 24px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        transition: var(--t-smooth);
    }

    .metric-card:hover {
        border-color: var(--primary-glow);
        background: rgba(255, 255, 255, 0.05);
    }

    .metric-card h3 {
        font-size: 1rem;
        color: var(--text-secondary);
    }

    .metric-value {
        font-size: 1.5rem;
        font-weight: 700;
    }

    .metric-trend {
        font-size: 0.8rem;
        font-weight: 600;
    }

    .metric-trend.success {
        color: var(--success-glow);
    }
    .metric-trend.secondary {
        color: var(--primary-glow);
    }

    .clickable {
        cursor: pointer;
    }

    .clickable:hover {
        background: rgba(255, 255, 255, 0.05) !important;
        box-shadow: inset 0 0 10px rgba(0, 163, 255, 0.1);
    }

    .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        animation: fadeIn 0.3s ease-out;
    }

    .log-detail-modal {
        width: 800px;
        max-width: 90%;
        max-height: 80vh;
        background: var(--surface-color);
        border: 1px solid var(--border-color);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        animation: scaleIn 0.3s ease-out;
    }

    .modal-header {
        padding: 24px;
        border-bottom: 1px solid var(--border-color);
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .modal-title {
        display: flex;
        align-items: center;
        gap: 16px;
    }

    .modal-title h2 {
        font-size: 1.2rem;
        margin: 0;
        color: var(--text-primary);
    }

    .close-btn {
        background: transparent;
        border: none;
        color: var(--text-muted);
        font-size: 2rem;
        cursor: pointer;
        transition: var(--t-smooth);
    }

    .close-btn:hover {
        color: var(--text-primary);
    }

    .modal-body {
        padding: 24px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 24px;
    }

    .detail-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
    }

    .detail-item {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .detail-item label {
        font-size: 0.7rem;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 1px;
    }

    .detail-item span {
        font-size: 0.9rem;
        color: var(--text-secondary);
    }

    .message-section label,
    .stack-trace-section label {
        display: block;
        font-size: 0.7rem;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-bottom: 12px;
    }

    .full-message {
        font-size: 1rem;
        line-height: 1.6;
        color: var(--text-primary);
        background: rgba(255, 255, 255, 0.02);
        padding: 16px;
        border-radius: 8px;
        border-left: 4px solid var(--primary-glow);
    }

    .stack-trace {
        font-family: "JetBrains Mono", monospace;
        font-size: 0.75rem;
        background: #000;
        padding: 16px;
        border-radius: 8px;
        overflow-x: auto;
        color: var(--text-secondary);
        border: 1px solid var(--border-color);
        line-height: 1.5;
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }

    @keyframes scaleIn {
        from {
            transform: scale(0.95);
            opacity: 0;
        }
        to {
            transform: scale(1);
            opacity: 1;
        }
    }
    /* ... existing styles ... */
    .log-spotlight {
        margin-top: 24px;
        padding: 24px;
        display: flex;
        flex-direction: column;
        gap: 20px;
        max-height: 500px;
    }

    .spotlight-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .subtitle {
        font-size: 0.7rem;
        color: var(--text-muted);
        letter-spacing: 2px;
    }

    .search-box {
        display: flex;
        padding: 4px 8px;
        gap: 12px;
    }

    .search-box input {
        background: transparent;
        border: none;
        color: var(--text-primary);
        padding: 8px;
        width: 300px;
        outline: none;
    }

    .search-box button {
        background: var(--primary-glow);
        border: none;
        color: var(--bg-color);
        padding: 8px 16px;
        border-radius: 8px;
        font-weight: 700;
        cursor: pointer;
        transition: var(--t-smooth);
    }

    .search-box button:hover {
        box-shadow: 0 0 15px var(--primary-glow);
    }

    .log-table-container {
        overflow-y: auto;
        border-radius: 8px;
    }

    .log-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.85rem;
    }

    .log-table th {
        text-align: left;
        padding: 12px;
        color: var(--text-secondary);
        border-bottom: 1px solid var(--border-color);
        position: sticky;
        top: 0;
        background: var(--surface-color);
    }

    .log-row {
        border-bottom: 1px solid var(--border-color);
        transition: var(--t-smooth);
    }

    .log-row:hover {
        background: rgba(255, 255, 255, 0.02);
    }

    .log-table td {
        padding: 12px;
    }

    .timestamp {
        color: var(--text-muted);
        width: 100px;
    }
    .id-cell {
        font-family: monospace;
        color: var(--primary-glow);
        width: 80px;
    }

    .badge {
        padding: 2px 8px;
        border-radius: 4px;
        background: var(--border-color);
        color: var(--text-secondary);
    }

    .level-indicator {
        padding: 2px 10px;
        border-radius: 20px;
        font-size: 0.7rem;
        font-weight: 700;
    }

    .level-indicator.error {
        background: rgba(255, 51, 102, 0.1);
        color: var(--critical-glow);
        border: 1px solid var(--critical-glow);
        box-shadow: 0 0 10px rgba(255, 51, 102, 0.1);
    }

    .level-indicator.warning {
        background: rgba(255, 204, 0, 0.1);
        color: var(--warning-glow);
        border: 1px solid var(--warning-glow);
    }

    .message {
        color: var(--text-secondary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    /* Existing dashboard styles maintained below */
    .dashboard-container {
        padding: 24px;
        height: 100vh;
        display: flex;
        flex-direction: column;
        gap: 24px;
        max-width: 1600px;
        margin: 0 auto;
    }

    .top-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 32px;
    }

    .brand {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .lume-logo {
        width: 12px;
        height: 12px;
        background: var(--primary-glow);
        border-radius: 50%;
        box-shadow: 0 0 10px var(--primary-glow);
    }

    .lume-brand {
        font-size: 1.5rem;
        font-weight: 800;
        letter-spacing: 2px;
    }

    .brand-tag {
        font-size: 0.75rem;
        color: var(--text-secondary);
        letter-spacing: 1px;
        border-left: 1px solid var(--border-color);
        padding-left: 12px;
        margin-left: 4px;
    }

    .system-status {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.8rem;
        font-weight: 600;
    }

    .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
    }

    .status-dot.success {
        background: var(--success-glow);
        box-shadow: 0 0 8px var(--success-glow);
    }

    .light-board-grid {
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: 24px;
    }

    .main-visual {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 40px;
        position: relative;
        overflow: hidden;
    }

    .health-orb-container {
        text-align: center;
        position: relative;
    }

    .health-orb {
        width: 200px;
        height: 200px;
        border-radius: 50%;
        margin-bottom: 24px;
        background: radial-gradient(
            circle at 30% 30%,
            var(--success-glow),
            transparent
        );
        filter: blur(2px);
        border: 2px solid var(--success-glow);
        animation: breathe 4s ease-in-out infinite;
    }

    .health-value {
        font-size: 3.5rem;
        font-weight: 800;
        font-family: "Outfit";
    }

    .health-label {
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 2px;
        font-size: 0.9rem;
    }

    .visual-footer {
        position: absolute;
        bottom: 24px;
        color: var(--text-muted);
        font-size: 0.8rem;
    }

    .metrics-sidebar {
        display: flex;
        flex-direction: column;
        gap: 24px;
    }

    .metric-card {
        padding: 24px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        transition: var(--t-smooth);
    }

    .metric-card:hover {
        border-color: var(--primary-glow);
        background: rgba(255, 255, 255, 0.05);
    }

    .metric-card h3 {
        font-size: 1rem;
        color: var(--text-secondary);
    }

    .metric-value {
        font-size: 1.5rem;
        font-weight: 700;
    }

    .metric-trend {
        font-size: 0.8rem;
        font-weight: 600;
    }

    .metric-trend.success {
        color: var(--success-glow);
    }
    .metric-trend.secondary {
        color: var(--primary-glow);
    }
</style>
