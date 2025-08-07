// UI Controls management - handles dynamic interface elements
export class UIControlsManager {
    constructor(mapManager = null) {
        this.departmentSelect = null;
        this.drivetimeContainer = null;
        this.drivetimeHeader = null;
        this.mapManager = mapManager;
        this.isochroneManager = null;
        this.comparisonMapManager = null;
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

        // Get drivetime switches
        this.drivetimeSwitches['10'] = document.getElementById('drivetime-10');
        this.drivetimeSwitches['20'] = document.getElementById('drivetime-20');
        this.drivetimeSwitches['30'] = document.getElementById('drivetime-30');

        if (!this.departmentSelect || !this.drivetimeContainer || !this.drivetimeHeader) {
            console.error('Required UI elements not found');
            return false;
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
            'GHI-Cumming': 'GHI Cumming',
            'GHI-Dahlonega': 'GHI Dahlonega',
            'GHI-Habersham': 'GHI Habersham',
            'GHI-Hamilton-Mill': 'GHI Hamilton Mill',
            'NGHS-Cleveland-MOB': 'NGHS Cleveland MOB',
            'NGMC-Barrow-MOB': 'NGMC Barrow MOB',
            'NGPG-Auburn-Primary-Care': 'NGPG Auburn Primary Care',
            'NGPG-Chestnut-Mountain': 'NGPG Chestnut Mountain',
            'NGPG-Clayton-Primary-Care': 'NGPG Clayton Primary Care',
            'NGPG-Community-Clinic': 'NGPG Community Clinic',
            'Concierge-Medicine': 'Concierge Medicine',
            'NGPG-Cumming': 'NGPG Cumming',
            'NGPG-Dacula-Primary-Care': 'NGPG Dacula Primary Care',
            'NGPG-Dahlonega': 'NGPG Dahlonega',
            'Dawsonville-Surgical-Associates': 'Dawsonville Surgical Associates',
            'NGPG-Family-Medicine-Lavonia': 'NGPG Family Medicine in Lavonia',
            'NGPG-Hamilton-Mill': 'NGPG Hamilton Mill',
            'NGPG-Internal-Medicine-Demorest': 'NGPG Internal Medicine in Demorest',
            'NGPG-Oakwood': 'NGPG Oakwood',
            'NGPG-Orthopedic-Surgery-Sports-Medicine': 'NGPG Ortho. Surgery & Sports Med. in Demorest',
            'NGPG-Orthopedic-Surgery-Dahlonega': 'NGPG Ortho. Surgery in Dahlonega',
            'NGPG-Orthopedic-Surgery-Hamilton-Mill': 'NGPG Ortho. Surgery in Hamilton Mill',
            'NGPG-Orthopedic-Surgery-Toccoa': 'NGPG Ortho. Surgery in Toccoa',
            'NGPG-Orthopedic-Trauma-Recon-Surgery': 'NGPG Ortho. Trauma & Recon. Surgery',
            'NGPG-Surgical-Associates-Demorest': 'NGPG Surgical Associates in Demorest',
            'NGPG-Surgical-Associates-Toccoa': 'NGPG Surgical Associates in Toccoa',
            'NGPG-West-Jackson': 'NGPG West Jackson',
            'Toccoa-Clinic': 'Toccoa Clinic',
            'Urgent-Care-Jefferson': 'Urgent Care in Jefferson',
            'Wisteria-Medical-Office-Building': 'Wisteria Medical Office Building'
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