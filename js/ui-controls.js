// UI Controls management - handles dynamic interface elements
export class UIControlsManager {
    constructor(mapManager = null) {
        this.departmentSelect = null;
        this.drivetimeContainer = null;
        this.drivetimeHeader = null;
        this.mapManager = mapManager;
        this.isochroneManager = null;
        this.comparisonMapManager = null;
        this.proximityAnimationSwitch = null;
        this.drivetimeSwitches = {
            '10': null,
            '20': null,
            '30': null
        };
    }

    // Initialize UI controls
    initialize() {
        // Get DOM elements
        this.departmentSelect = document.getElementById('departmentSelect');
        this.drivetimeContainer = document.querySelector('.drivetime-container');
        this.drivetimeHeader = document.querySelector('.drivetime-header');
        this.proximityAnimationSwitch = document.getElementById('proximity-animation');

        // Get drivetime switches
        this.drivetimeSwitches['10'] = document.getElementById('drivetime-10');
        this.drivetimeSwitches['20'] = document.getElementById('drivetime-20');
        this.drivetimeSwitches['30'] = document.getElementById('drivetime-30');

        if (!this.departmentSelect || !this.drivetimeContainer || !this.drivetimeHeader) {
            console.error('Required UI elements not found');
            return false;
        }

        if (!this.proximityAnimationSwitch) {
            console.warn('Proximity animation switch not found');
        }

        // Check if all switches were found
        const missingSwitches = Object.keys(this.drivetimeSwitches).filter(
            key => !this.drivetimeSwitches[key]
        );
        if (missingSwitches.length > 0) {
            console.error('Missing drivetime switches:', missingSwitches);
            return false;
        }

        this.setupEventListeners();

        // Set initial state based on current selection (with small delay for Shoelace to initialize)
        // Note: Don't trigger map updates on initial load - let the map handle choropleth after data loads
        setTimeout(() => {
            this.handleDepartmentChangeUI();
        }, 100);

        return true;
    }

    // Set up event listeners for UI controls
    setupEventListeners() {
        // Listen for changes on the department dropdown
        this.departmentSelect.addEventListener('sl-change', (event) => {
            this.handleDepartmentChange();
        });

        // Listen for changes on drivetime switches
        Object.keys(this.drivetimeSwitches).forEach(minutes => {
            const switch_ = this.drivetimeSwitches[minutes];
            switch_.addEventListener('sl-change', (event) => {
                this.handleDrivetimeSwitchChange(minutes, event.target.checked);
            });
        });

        // Listen for changes on proximity animation switch
        if (this.proximityAnimationSwitch) {
            this.proximityAnimationSwitch.addEventListener('sl-change', (event) => {
                this.handleProximityAnimationChange(event.target.checked);
            });
        }
    }

    // Handle department dropdown changes
    handleDepartmentChange() {
        const selectedValue = this.departmentSelect.value;

        // Safety check - if no value is selected yet, default to 'All'
        if (!selectedValue || selectedValue === undefined) {
            console.log('No department value selected yet, defaulting to All');
            return;
        }

        if (selectedValue === 'All') {
            // Hide the drivetime container when "All" is selected
            this.drivetimeContainer.style.display = 'none';
        } else {
            // Show the drivetime container and update the header
            this.drivetimeContainer.style.display = 'block';

            // Convert the dropdown value to a more readable format
            const readableName = this.formatDepartmentName(selectedValue);
            this.drivetimeHeader.textContent = `Drivetime From ${readableName} (Minutes)`;
        }

        // Update map view if mapManager is available
        if (this.mapManager) {
            this.mapManager.updateMapView(selectedValue);
        }

        // Update comparison map marker if comparisonMapManager is available
        if (this.comparisonMapManager && this.mapManager) {
            // Get location settings from MapManager to pass to comparison map
            const locationConfig = this.mapManager.constructor.locationSettings[selectedValue];
            if (locationConfig) {
                this.comparisonMapManager.updateLocationMarker(selectedValue, locationConfig.center);
            } else if (selectedValue === 'All') {
                // Remove marker when 'All' is selected
                this.comparisonMapManager.removeCurrentMarker();
            }
        }

        // Clear and disable/enable switches based on selection
        this.updateSwitchState(selectedValue);

        // Load isochrone data if isochroneManager is available
        if (this.isochroneManager) {
            this.isochroneManager.loadIsochrone(selectedValue);
        }
    }

    // Handle drivetime switch changes
    handleDrivetimeSwitchChange(minutes, isChecked) {
        if (this.isochroneManager) {
            this.isochroneManager.toggleIsochroneLayer(minutes, isChecked);
        }
    }

    // Handle proximity animation switch changes
    handleProximityAnimationChange(isChecked) {
        if (this.mapManager) {
            this.mapManager.setProximityAnimationEnabled(isChecked);
            console.log(`Proximity animation ${isChecked ? 'enabled' : 'disabled'}`);
        }
    }

    // Update switch state based on department selection
    updateSwitchState(selectedValue) {
        const isAllSelected = selectedValue === 'All';

        // Clear all switches and disable them if "All" is selected
        Object.keys(this.drivetimeSwitches).forEach(minutes => {
            const switch_ = this.drivetimeSwitches[minutes];
            switch_.checked = false;
            switch_.disabled = isAllSelected;

            // Also hide the isochrone layer when clearing switches
            if (this.isochroneManager) {
                this.isochroneManager.toggleIsochroneLayer(minutes, false);
            }
        });
    }

    // Get the current state of all drivetime switches
    getDrivetimeSwitchStates() {
        const states = {};
        Object.keys(this.drivetimeSwitches).forEach(minutes => {
            states[minutes] = this.drivetimeSwitches[minutes].checked;
        });
        return states;
    }

    // Handle UI changes only (without triggering map updates) - used for initial load
    handleDepartmentChangeUI() {
        const selectedValue = this.departmentSelect.value;

        // Safety check - if no value is selected yet, default to 'All'
        if (!selectedValue || selectedValue === undefined) {
            console.log('No department value selected yet, defaulting to All');
            return;
        }

        if (selectedValue === 'All') {
            // Hide the drivetime container when "All" is selected
            this.drivetimeContainer.style.display = 'none';
        } else {
            // Show the drivetime container and update the header
            this.drivetimeContainer.style.display = 'block';

            // Convert the dropdown value to a more readable format
            const readableName = this.formatDepartmentName(selectedValue);
            this.drivetimeHeader.textContent = `Drivetime From ${readableName} (Minutes)`;
        }

        // Update switch state (UI only - no map updates)
        this.updateSwitchState(selectedValue);
    }

    // Convert dropdown values to readable department names
    formatDepartmentName(value) {
        // Safety check for undefined or null values
        if (!value || typeof value !== 'string') {
            console.warn('Invalid value passed to formatDepartmentName:', value);
            return 'Unknown Department';
        }

        // Handle special cases first
        const specialCases = {
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

        // Check if we have a special case mapping
        if (specialCases[value]) {
            return specialCases[value];
        }

        // Fallback: replace dashes with spaces and handle basic formatting
        return value.replace(/-/g, ' ')
            .replace(/Medical Plaza (\d+) /g, 'Medical Plaza $1 in ')
            .replace(/Medical Park (\d+) /g, 'Medical Park $1 in ');
    }

    // Get current selected department
    getCurrentDepartment() {
        return this.departmentSelect ? this.departmentSelect.value : null;
    }

    // Set the map manager reference (for coordination between modules)
    setMapManager(mapManager) {
        this.mapManager = mapManager;
    }

    // Set the isochrone manager reference (for coordination between modules)
    setIsochroneManager(isochroneManager) {
        this.isochroneManager = isochroneManager;
    }

    // Set the comparison map manager reference (for coordination between modules)
    setComparisonMapManager(comparisonMapManager) {
        this.comparisonMapManager = comparisonMapManager;
    }

    // Programmatically set department selection
    setDepartment(value) {
        if (this.departmentSelect) {
            this.departmentSelect.value = value;
            this.handleDepartmentChange();
        }
    }
} 