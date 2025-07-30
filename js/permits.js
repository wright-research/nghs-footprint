// js/permits.js
// Module to load and parse building permit CSV data for the permit tracker

// Ensure PapaParse is available globally (included in index.html)

const CSV_PATH = 'Data/Other/bps.csv';
let chartInstance = null;
let allData = [];
let allMonths = [];
let currentPermitType = 'all'; // default

// Helper: Format year_month to readable label
function formatYearMonth(ym) {
    const year = parseInt(ym.slice(0, 4), 10);
    const month = parseInt(ym.slice(4, 6), 10) - 1; // zero-based month
    const date = new Date(year, month, 1);
    return date.toLocaleString('default', { month: 'short', year: 'numeric' });
}

// Load and parse CSV, then initialize chart and listeners
export function loadPermitData() {
    if (typeof Papa === 'undefined') {
        console.error('PapaParse is not loaded.');
        return;
    }
    Papa.parse(CSV_PATH, {
        download: true,
        header: true,
        complete: (results) => {
            allData = results.data.filter(row => row.year_month && row.Name && row.All_permits);
            allMonths = Array.from(new Set(allData.map(row => row.year_month))).sort();
            setupJurisdictionListener();
            setupPermitTypeListener();
            renderPermitChart();
        },
        error: (err) => {
            console.error('Error loading permit CSV:', err);
        }
    });
}

// Listen for changes in the jurisdiction dropdown and update chart
function setupJurisdictionListener() {
    const select = document.getElementById('jurisdictionSelect');
    if (!select) return;
    select.addEventListener('sl-change', renderPermitChart);
}

// Listen for changes in the permit type radio group and update chart
function setupPermitTypeListener() {
    const radio = document.getElementById('permitTypeSelect');
    if (!radio) return;
    radio.addEventListener('sl-change', (e) => {
        currentPermitType = radio.value || 'all';
        renderPermitChart();
    });
}

// Get selected jurisdictions from the dropdown
function getSelectedJurisdictions() {
    const select = document.getElementById('jurisdictionSelect');
    if (!select) return [];
    return Array.from(select.value || []);
}

// Map radio value to CSV column
function getPermitColumn() {
    switch (currentPermitType) {
        case 'single-family':
            return 'SF_permits';
        case 'multi-family':
            return 'MF_permits';
        case 'all':
        default:
            return 'All_permits';
    }
}

// Convert dropdown value to human-readable label for unincorporated areas
function prettifyAreaName(value) {
    // Unincorporated area pattern
    const match = value.match(/^(.+)-County-U\.A\.$/);
    if (match) {
        return `Unincorporated ${match[1]} County`;
    }
    // Otherwise, replace hyphens with spaces for all other names
    return value.replace(/-/g, ' ');
}

// Prepare Chart.js datasets for selected jurisdictions and permit type
function getChartDatasets(selectedJurisdictions) {
    const permitCol = getPermitColumn();
    return selectedJurisdictions.map(jur => {
        const data = allMonths.map(month => {
            const row = allData.find(r => r.Name === jur && r.year_month === month);
            return row && row[permitCol] ? parseInt(row[permitCol], 10) : 0;
        });
        return {
            label: prettifyAreaName(jur),
            data,
            fill: false,
            borderWidth: 2,
            tension: 0.2
        };
    });
}

// Chart.js plugin to draw a vertical line at the hovered x position
const verticalLinePlugin = {
    id: 'verticalLineOnHover',
    afterDraw: function (chart) {
        if (chart.tooltip?._active && chart.tooltip._active.length) {
            const ctx = chart.ctx;
            ctx.save();
            const activePoint = chart.tooltip._active[0];
            const x = activePoint.element.x;
            const topY = chart.scales.y.top;
            const bottomY = chart.scales.y.bottom;

            ctx.beginPath();
            ctx.moveTo(x, topY);
            ctx.lineTo(x, bottomY);
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = 'rgba(80,80,80,0.7)';
            ctx.setLineDash([4, 4]);
            ctx.stroke();
            ctx.restore();
        }
    }
};

// Render or update the Chart.js line chart
function renderPermitChart() {
    const canvas = document.getElementById('permitChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const selectedJurisdictions = getSelectedJurisdictions();
    if (!selectedJurisdictions.length) return;

    const datasets = getChartDatasets(selectedJurisdictions);
    const labels = allMonths.map(formatYearMonth);

    if (chartInstance) {
        chartInstance.data.labels = labels;
        chartInstance.data.datasets = datasets;
        chartInstance.update();
    } else {
        chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: true, position: 'right' },
                    title: { display: false, },
                    tooltip: { mode: 'index', intersect: false }
                },
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                scales: {
                    x: {
                        title: { display: false },
                        ticks: {
                            callback: function (value, index, ticks) {
                                // Show every other label (even indices only)
                                return index % 2 === 0 ? this.getLabelForValue(value) : '';
                            }
                        }
                    },
                    y: { title: { display: false }, beginAtZero: true }
                }
            },
            plugins: [verticalLinePlugin]
        });
    }
}