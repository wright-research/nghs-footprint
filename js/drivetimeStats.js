// js/drivetimeStats.js
// Module to load and filter drive time statistics by department

// Path to the visits stats CSV
const VISITS_STATS_CSV = 'Data/Other/visits_stats_2.csv';
let visitsStatsData = [];

// Load and parse the visits stats CSV
export function loadDrivetimeStats() {
    if (typeof Papa === 'undefined') {
        console.error('PapaParse is not loaded.');
        return;
    }
    Papa.parse(VISITS_STATS_CSV, {
        download: true,
        header: true,
        complete: (results) => {
            visitsStatsData = results.data.filter(row => row.department);
            setupDepartmentListener();
            handleDepartmentChange(); // Initial call
        },
        error: (err) => {
            console.error('Error loading visits stats CSV:', err);
        }
    });
}

// Listen for changes in the department dropdown and update stats
function setupDepartmentListener() {
    const select = document.getElementById('departmentSelect');
    if (!select) return;
    select.addEventListener('sl-change', handleDepartmentChange);
    
    // Also listen for drivetime switch changes
    setupDrivetimeListeners();
}

// Listen for drivetime switch changes to update table styling
function setupDrivetimeListeners() {
    const drivetimeSwitches = ['drivetime-10', 'drivetime-20', 'drivetime-30'];
    
    drivetimeSwitches.forEach(switchId => {
        const switch_ = document.getElementById(switchId);
        if (switch_) {
            switch_.addEventListener('sl-change', updateTableStyling);
        }
    });
}

// Update table row styling based on which drivetime layers are active
function updateTableStyling() {
    const drivetimeSwitches = {
        '10': document.getElementById('drivetime-10'),
        '20': document.getElementById('drivetime-20'),
        '30': document.getElementById('drivetime-30')
    };

    // Update styling for each row
    Object.keys(drivetimeSwitches).forEach(minutes => {
        const switch_ = drivetimeSwitches[minutes];
        const row = document.getElementById(`stats-row-${minutes}`);
        
        if (switch_ && row) {
            if (switch_.checked) {
                // Make row bold when drivetime layer is active
                row.style.fontWeight = 'bold';
                row.style.backgroundColor = 'rgba(0, 100, 200, 0.1)'; // Light blue background
            } else {
                // Return to normal styling when drivetime layer is inactive
                row.style.fontWeight = 'normal';
                row.style.backgroundColor = 'transparent';
            }
        }
    });
}

// Helper: Convert dropdown value (with hyphens) to CSV value (with spaces)
function dropdownValueToCSV(value) {
    return value.replace(/-/g, ' ');
}

// Map dropdown values to CSV department values
const departmentDropdownToCSV = {
    'GHI-Blairsville': 'GHI Blairsville',
    'GHI-Clayton': 'GHI Clayton',
    'GHI-Cleveland': 'GHI Cleveland',
    'GHI-Cumming': 'GHI Cumming',
    'GHI-Dahlonega': 'GHI Dahlonega',
    'GHI-Habersham': 'GHI Habersham',
    'GHI-Hamilton-Mill': 'GHI Hamilton Mill',
    'GHI-MP1-Bethlehem': 'GHI at MP1 in Bethlehem',
    'GHI-MP1-Buford': 'GHI at MP1 in Buford',
    'GHI-MP1-Jefferson': 'GHI at MP1 in Jefferson',
    'GHI-MP2-Dawsonville': 'GHI at MP2 in Dawsonville',
    'GHI-MPB-Braselton': 'GHI at MPB in Braselton',
    'GHI-Toccoa': 'GHI at Toccoa Clinic',
    'GHI-Wisteria': 'GHI at Wisteria MOB',
    'NGPG-FM-Auburn': 'NGPG FM Auburn',
    'NGPG-FM-Chestnut-Mountain': 'NGPG FM Chestnut Mountain',
    'NGPG-FM-Clayton': 'NGPG FM Clayton',
    'NGPG-FM-Community-Clinic': 'NGPG FM Community Clinic Gainesville',
    'NGPG-FM-Concierge-Medicine': 'NGPG FM Concierge Medicine Gainesville',
    'NGPG-FM-Cumming': 'NGPG FM Cumming',
    'NGPG-FM-Dacula': 'NGPG FM Dacula',
    'NGPG-FM-Dahlonega': 'NGPG FM Dahlonega',
    'NGPG-FM-Hamilton-Mill': 'NGPG FM Hamilton Mill',
    'NGPG-FM-Lavonia': 'NGPG FM Lavonia',
    'NGPG-FM-Oakwood': 'NGPG FM Oakwood',
    'NGPG-FM-West-Jackson': 'NGPG FM West Jackson in Hoschton',
    'NGPG-FM-MP1-Bethlehem': 'NGPG FM at MP1 in Bethlehem',
    'NGPG-FM-MP1-Buford': 'NGPG FM at MP1 in Buford',
    'NGPG-FM-MP1-Flowery-Branch': 'NGPG FM at MP1 in Flowery Branch',
    'NGPG-FM-MP1-Jefferson': 'NGPG FM at MP1 in Jefferson',
    'NGPG-FM-NGMC-Barrow-MOB': 'NGPG FM at NGMC Barrow MOB',
    'NGPG-FM-IM-Cleveland': 'NGPG FM/IM Cleveland',
    'NGPG-FM-IM-MP1-Braselton': 'NGPG FM/IM at MP1 in Braselton',
    'NGPG-FM-IM-MP1-Dawsonville': 'NGPG FM/IM at MP1 in Dawsonville',
    'NGPG-FM-IM-MP2-Gainesville': 'NGPG FM/IM at MP2 in Gainesville',
    'NGPG-FM-IM-Toccoa': 'NGPG FM/IM at Toccoa Clinic',
    'NGPG-IM-Demorest': 'NGPG IM Demorest',
    'NGPG-Ortho-Gainesville': 'NGPG Ortho Trauma Gainesville',
    'NGPG-Ortho-Surgery-Cleveland': 'NGPG Orthopedic Surgery Cleveland',
    'NGPG-Ortho-Surgery-Dahlonega': 'NGPG Orthopedic Surgery Dahlonega',
    'NGPG-Ortho-Surgery-Demorest': 'NGPG Orthopedic Surgery Demorest',
    'NGPG-Ortho-Surgery-Hamilton-Mill': 'NGPG Orthopedic Surgery Hamilton Mill',
    'NGPG-Ortho-Surgery-MP1-Bethlehem': 'NGPG Orthopedic Surgery at MP1 in Bethlehem',
    'NGPG-Ortho-Surgery-MP1-Buford': 'NGPG Orthopedic Surgery at MP1 in Buford',
    'NGPG-Ortho-Surgery-MP2-Dawsonville': 'NGPG Orthopedic Surgery at MP2 in Dawsonville',
    'NGPG-Ortho-Surgery-MPB-Braselton': 'NGPG Orthopedic Surgery at MPB in Braselton',
    'NGPG-Ortho-Surgery-Toccoa': 'NGPG Orthopedic Surgery at Toccoa Clinic',
    'NGPG-Ortho-Surgery-MP1-Gainesville': 'NGPG Orthopedic Surgery at MP1 in Gainesville',
    'NGPG-Surgical-Associates-Cleveland': 'NGPG Surgical Associates Cleveland',
    'NGPG-Surgical-Associates-Dawsonville': 'NGPG Surgical Associates Dawsonville',
    'NGPG-Surgical-Associates-Demorest': 'NGPG Surgical Associates Demorest',
    'NGPG-Surgical-Associates-MP1-Bethlehem': 'NGPG Surgical Associates at MP1 in Bethlehem',
    'NGPG-Surgical-Associates-MP1-Buford': 'NGPG Surgical Associates at MP1 in Buford',
    'NGPG-Surgical-Associates-MP1-Jefferson': 'NGPG Surgical Associates at MP1 in Jefferson',
    'NGPG-Surgical-Associates-MP2-Gainesville': 'NGPG Surgical Associates at MP2 in Gainesville',
    'NGPG-Surgical-Associates-MPB-Braselton': 'NGPG Surgical Associates at MPB in Braselton',
    'NGPG-Surgical-Associates-Toccoa': 'NGPG Surgical Associates at Toccoa Clinic',
    'NGPG-MP1-Thompson-Bridge': 'NGPG at MP1 Thompson Bridge',
    'Urgent-Care-Jefferson': 'Urgent Care Jefferson',
};

// Handle department selection and log the chosen department
function handleDepartmentChange() {
    const select = document.getElementById('departmentSelect');
    if (!select) return;
    const selected = select.value;
    const statsContainer = document.getElementById('summary-stats-container');
    const statsBody = document.getElementById('summary-stats-body');
    // Remove any existing h4
    const oldH4 = statsContainer.querySelector('h4');
    if (oldH4) oldH4.remove();
    if (!selected || selected === 'All') {
        // Show default message and remove h4
        if (statsBody) {
            statsBody.innerHTML = '<tr><td colspan="3">Select a department to view statistics</td></tr>';
        }
        return;
    }
    // Use mapping object for CSV lookup
    const csvDepartment = departmentDropdownToCSV[selected] || dropdownValueToCSV(selected);
    const departmentRow = visitsStatsData.find(row => row.department === csvDepartment);
    // Insert h4 with department name under h3
    const h3 = statsContainer.querySelector('h3');
    if (h3) {
        const h4 = document.createElement('h4');
        h4.textContent = csvDepartment;
        h4.style.marginBottom = '10px';
        h4.style.marginTop = '0px';
        h4.style.textAlign = 'center';
        h3.insertAdjacentElement('afterend', h4);
    }
    // (Leave table body as-is for now)
    if (departmentRow) {
        // Populate the table with Within column only
        if (statsBody) {
            // Robust numeric parsing that preserves zero values
            const parseNumeric = (value) => {
                if (value === null || value === undefined || value === '') return null;
                const num = Number(String(value).replace(/,/g, ''));
                return Number.isFinite(num) ? num : null;
            };

            const v10Num = parseNumeric(departmentRow.visits_10);
            const v20Num = parseNumeric(departmentRow.visits_20);
            const v30Num = parseNumeric(departmentRow.visits_30);
            const vTotalNum = parseNumeric(departmentRow.visits_sum_universe);

            // Prefer calculating remainder as Total - Within 30; fallback to CSV column if needed
            let vRemainderNum = null;
            if (vTotalNum !== null && v30Num !== null) {
                vRemainderNum = Math.max(0, vTotalNum - v30Num);
            } else {
                vRemainderNum = parseNumeric(departmentRow.visits_remainder);
            }

            // Percentages
            const p10NumCsv = parseNumeric(departmentRow['visits_10_%']);
            const p20NumCsv = parseNumeric(departmentRow['visits_20_%']);
            let p30Num = parseNumeric(departmentRow['visits_30_%']);
            if (p30Num === null && v30Num !== null && vTotalNum !== null && vTotalNum > 0) {
                p30Num = (v30Num / vTotalNum) * 100;
            }
            let pRemainderNum = parseNumeric(departmentRow['visits_remainder_%']);
            if (pRemainderNum === null && p30Num !== null) {
                pRemainderNum = 100 - p30Num;
            } else if (pRemainderNum === null && vRemainderNum !== null && vTotalNum !== null && vTotalNum > 0) {
                pRemainderNum = (vRemainderNum / vTotalNum) * 100;
            }

            // Format for display
            const v10 = v10Num !== null ? v10Num.toLocaleString() : '';
            const v20 = v20Num !== null ? v20Num.toLocaleString() : '';
            const v30 = v30Num !== null ? v30Num.toLocaleString() : '';
            const vRemainder = vRemainderNum !== null ? vRemainderNum.toLocaleString() : '';
            const vTotal = vTotalNum !== null ? vTotalNum.toLocaleString() : '';

            const p10 = p10NumCsv !== null ? Math.round(p10NumCsv) + '%' : '';
            const p20 = p20NumCsv !== null ? Math.round(p20NumCsv) + '%' : '';
            const p30 = p30Num !== null ? Math.round(p30Num) + '%' : '';
            const pRemainder = pRemainderNum !== null ? Math.round(pRemainderNum) + '%' : '';
            const pTotal = '100%';
            statsBody.innerHTML = `
                <tr>
                    <th>Within</th>
                    <th>Visits</th>
                    <th>% of Total</th>
                </tr>
                <tr id="stats-row-10"><td>10 min</td><td>${v10}</td><td>${p10}</td></tr>
                <tr id="stats-row-20"><td>20 min</td><td>${v20}</td><td>${p20}</td></tr>
                <tr id="stats-row-30"><td>30 min</td><td>${v30}</td><td>${p30}</td></tr>
                <tr id="stats-row-remainder"><td>> 30 min</td><td>${vRemainder}</td><td>${pRemainder}</td></tr>
                <tr><td><i>Total</i></td><td><i>${vTotal}</i></td><td><i>${pTotal}</i></td></tr>
            `;
            
            // Update styling based on current drivetime checkbox states
            updateTableStyling();
        }
    } else {
        // Optionally show not found message
    }
} 