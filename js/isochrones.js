// Isochrone data management - handles loading and displaying drivetime isochrones
export class IsochroneManager {
    constructor(mapManager = null) {
        this.mapManager = mapManager;
        this.comparisonMapManager = null;
        this.currentIsochroneData = null;
        this.isochroneLayers = ['isochrone-10min', 'isochrone-20min', 'isochrone-30min'];

        // Mapping from dropdown values to actual GeoJSON file names
        this.isochroneFileMapping = {
            'GHI-Blairsville': 'ghi_Blairsville_iso_clean.geojson',
            'GHI-Clayton': 'ghi_clayton_iso_clean.geojson',
            'GHI-Cleveland': 'nghs_cleveland_iso_clean.geojson',
            'GHI-Cumming': 'ghi_cumming_iso_clean.geojson',
            'GHI-Dahlonega': 'ghi_Dahlonega_iso_clean.geojson',
            'GHI-Habersham': 'ghi_hab_iso_clean.geojson',
            'GHI-Hamilton-Mill': 'ghi_HamMill_iso_clean.geojson',
            'GHI-MP1-Bethlehem': 'medPlaza_beth_iso_clean.geojson',
            'GHI-MP1-Buford': 'medicalPlaza_buford_clean.geojson',
            'GHI-MP1-Jefferson': 'uc_jefferson_iso_clean.geojson',
            'GHI-MP2-Dawsonville': 'medPlaza2_dawsonville_iso_clean.geojson',
            'GHI-MPB-Braselton': 'medical_B_braselton_iso_clean.geojson',
            'GHI-Toccoa': 'toccoa_clinic_iso_clean.geojson',
            'GHI-Wisteria': 'wisteria_medical_iso_clean.geojson',
            'NGPG-FM-Auburn': 'ngpg_Auburn_iso_clean.geojson',
            'NGPG-FM-Chestnut-Mountain': 'ngpg_chestMtn_iso_clean.geojson',
            'NGPG-FM-Clayton': 'ngpg_Clayton_iso_clean.geojson',
            'NGPG-FM-Community-Clinic': 'ngpg_commClinic_iso_clean.geojson',
            'NGPG-FM-Concierge-Medicine': 'ngpg_conciergeMed_iso_clean.geojson',
            'NGPG-FM-Cumming': 'ngpg_Cumming_iso_clean.geojson',
            'NGPG-FM-Dacula': 'ngpg_Dacula_iso_clean.geojson',
            'NGPG-FM-Dahlonega': 'ngpg_Dahlonega_iso_clean.geojson',
            'NGPG-FM-Hamilton-Mill': 'ngpg_hamMill_iso_clean.geojson',
            'NGPG-FM-Lavonia': 'ngpg_FamMed_lavonia_iso_clean.geojson',
            'NGPG-FM-Oakwood': 'ngpg_oakwood_iso_clean.geojson',
            'NGPG-FM-West-Jackson': 'ngpg_wJackson_iso_clean.geojson',
            'NGPG-FM-MP1-Bethlehem': 'medPlaza_beth_iso_clean.geojson',
            'NGPG-FM-MP1-Buford': 'medicalPlaza_buford_clean.geojson',
            'NGPG-FM-MP1-Flowery-Branch': 'medPlaza1_fb_iso_clean.geojson',
            'NGPG-FM-MP1-Jefferson': 'uc_jefferson_iso_clean.geojson',
            'NGPG-FM-NGMC-Barrow-MOB': 'ngmc_Barrow_MOB_iso_clean.geojson',
            'NGPG-FM-IM-Cleveland': 'nghs_cleveland_iso_clean.geojson',
            'NGPG-FM-IM-MP1-Braselton': 'medPlaza1_bras_iso_clean.geojson',
            'NGPG-FM-IM-MP1-Dawsonville': 'medPlaza1_dawsonville_clean.geojson',
            'NGPG-FM-IM-MP2-Gainesville': 'medPark2_gainesville_iso_clean.geojson',
            'NGPG-FM-IM-Toccoa': 'toccoa_clinic_iso_clean.geojson',
            'NGPG-IM-Demorest': 'ngpg_intMed_demorest_iso_clean.geojson',
            'NGPG-Ortho-Gainesville': 'ngpg_orthoTrauma_RS_iso_clean.geojson',
            'NGPG-Ortho-Surgery-Cleveland': 'nghs_cleveland_iso_clean.geojson',
            'NGPG-Ortho-Surgery-Dahlonega': 'ngpg_orthoSurg_Dahlonega_iso_clean.geojson',
            'NGPG-Ortho-Surgery-Demorest': 'ngpg_orthoSurgery_SM_demorest_iso_clean.geojson',
            'NGPG-Ortho-Surgery-Hamilton-Mill': 'ngpg_orthSurgery_HamMill_iso_clean.geojson',
            'NGPG-Ortho-Surgery-MP1-Bethlehem': 'medPlaza_beth_iso_clean.geojson',
            'NGPG-Ortho-Surgery-MP1-Buford': 'medicalPlaza_buford_clean.geojson',
            'NGPG-Ortho-Surgery-MP2-Dawsonville': 'medPlaza2_dawsonville_iso_clean.geojson',
            'NGPG-Ortho-Surgery-MPB-Braselton': 'medical_B_braselton_iso_clean.geojson',
            'NGPG-Ortho-Surgery-Toccoa': 'toccoa_clinic_iso_clean.geojson',
            'NGPG-Ortho-Surgery-MP1-Gainesville': 'medPark1_gainesville_iso_clean.geojson',
            'NGPG-Surgical-Associates-Cleveland': 'nghs_cleveland_iso_clean.geojson',
            'NGPG-Surgical-Associates-Dawsonville': 'ngpg_dawson_surgAssoc_iso_clean.geojson',
            'NGPG-Surgical-Associates-Demorest': 'ngpg_intMed_demorest_iso_clean.geojson',
            'NGPG-Surgical-Associates-MP1-Bethlehem': 'medPlaza_beth_iso_clean.geojson',
            'NGPG-Surgical-Associates-MP1-Buford': 'medicalPlaza_buford_clean.geojson',
            'NGPG-Surgical-Associates-MP1-Jefferson': 'uc_jefferson_iso_clean.geojson',
            'NGPG-Surgical-Associates-MP2-Gainesville': 'medPark2_gainesville_iso_clean.geojson',
            'NGPG-Surgical-Associates-MPB-Braselton': 'medical_B_braselton_iso_clean.geojson',
            'NGPG-Surgical-Associates-Toccoa': 'ngpg_surgAssoc_toccoa_iso_clean.geojson',
            'NGPG-MP1-Thompson-Bridge': 'medicalPlaza_ThomBrid_iso_clean.geojson',
            'Urgent-Care-Jefferson': 'uc_jefferson_iso_clean.geojson',
        };
    }

    // Set the map manager reference
    setMapManager(mapManager) {
        this.mapManager = mapManager;
    }

    // Set the comparison map manager reference
    setComparisonMapManager(comparisonMapManager) {
        this.comparisonMapManager = comparisonMapManager;
    }

    // Load isochrone data for a specific department
    async loadIsochrone(departmentValue) {
        if (!this.mapManager || !this.mapManager.getMap()) {
            console.error('Map manager not available');
            return false;
        }

        // Clear existing isochrones first
        this.clearIsochrones();

        // Skip if "All" is selected
        if (departmentValue === 'All') {
            return true;
        }

        // Get the filename for this department
        const filename = this.isochroneFileMapping[departmentValue];
        if (!filename) {
            console.warn(`No isochrone file mapping found for department: ${departmentValue}`);
            return false;
        }

        try {
            // Load the GeoJSON data
            const response = await fetch(`Data/Isochrones/${filename}`);
            if (!response.ok) {
                throw new Error(`Failed to load isochrone data: ${response.status}`);
            }

            const geojsonData = await response.json();
            this.currentIsochroneData = geojsonData;

            // Use the new unified approach to add layers to ALL active maps
            this.showIsochroneLayers(geojsonData);

            console.log(`Successfully loaded isochrone data for ${departmentValue}`);
            return true;

        } catch (error) {
            console.error(`Error loading isochrone data for ${departmentValue}:`, error);
            return false;
        }
    }

    // ========== OBSOLETE METHOD REMOVED ==========
    // addIsochroneLayers() has been replaced by the unified showIsochroneLayers() approach

    // Show/hide specific isochrone layer on ALL active maps
    toggleIsochroneLayer(minutes, isVisible) {
        // Apply to main map
        if (this.mapManager && this.mapManager.getMap()) {
            this.setLayerVisibility(this.mapManager.getMap(), minutes, isVisible);
        }

        // Apply to comparison map if it's active
        if (this.comparisonMapManager && this.comparisonMapManager.isActive()) {
            const comparisonMap = this.comparisonMapManager.getAfterMap();
            if (comparisonMap) {
                this.setLayerVisibility(comparisonMap, minutes, isVisible);
            }
        }
    }

    // Clear all isochrone layers from ALL active maps
    clearIsochrones() {
        // Clear from main map
        if (this.mapManager && this.mapManager.getMap()) {
            this.clearIsochronesFromMap(this.mapManager.getMap());
        }

        // Clear from comparison map if it exists (active or not, to be safe)
        if (this.comparisonMapManager && this.comparisonMapManager.getAfterMap()) {
            this.clearIsochronesFromMap(this.comparisonMapManager.getAfterMap());
        }

        this.currentIsochroneData = null;
    }

    // Check if isochrone data is currently loaded
    hasIsochroneData() {
        return this.currentIsochroneData !== null;
    }

    // Get current isochrone data
    getCurrentIsochroneData() {
        return this.currentIsochroneData;
    }

    // Get available departments (keys from the mapping)
    getAvailableDepartments() {
        return Object.keys(this.isochroneFileMapping);
    }

    // Check if a department has isochrone data available
    hasIsochroneForDepartment(departmentValue) {
        return this.isochroneFileMapping.hasOwnProperty(departmentValue);
    }

    // ========== NEW UNIFIED METHODS (Phase 1) ==========
    
    // Master method to show isochrone layers on both main and comparison maps
    // This follows the same pattern as PossibleSitesManager.showSiteMarkers()
    showIsochroneLayers(geojsonData) {
        if (!geojsonData) {
            console.warn('No geojson data provided to showIsochroneLayers');
            return;
        }

        // Clear existing layers from ALL maps first (like hideSiteMarkers)
        this.clearIsochrones();

        // Add layers to main map
        if (this.mapManager && this.mapManager.getMap()) {
            this.addIsochroneLayersToMap(this.mapManager.getMap(), geojsonData);
        }

        // Add layers to comparison map if it's active
        if (this.comparisonMapManager && this.comparisonMapManager.isActive()) {
            const comparisonMap = this.comparisonMapManager.getAfterMap();
            if (comparisonMap) {
                this.addIsochroneLayersToMap(comparisonMap, geojsonData);
            }
        }

        console.log('Isochrone layers added to all active maps');
    }

    // Helper method to add isochrone layers to a specific map
    // Extracted from the existing addIsochroneLayers method
    addIsochroneLayersToMap(map, geojsonData) {
        if (!map || !geojsonData) {
            return;
        }

        // Add source for isochrone data
        map.addSource('isochrone-source', {
            type: 'geojson',
            data: geojsonData
        });

        // Define border colors for each time interval (matching existing logic)
        const timeBorders = {
            '10-min': '#0064c8', // Dark blue for 10-minute (closest)
            '20-min': '#0096ff', // Medium blue for 20-minute  
            '30-min': '#64c8ff'  // Light blue for 30-minute (farthest)
        };

        // Add border layers for each time interval (but hidden initially)
        const timeIntervals = ['30-min', '20-min', '10-min'];

        timeIntervals.forEach((timeInterval, index) => {
            const layerId = `isochrone-${timeInterval}-border`;

            // Add border layer (initially hidden)
            map.addLayer({
                id: layerId,
                type: 'line',
                source: 'isochrone-source',
                filter: ['==', 'BUFFER_RADIUS', timeInterval],
                paint: {
                    'line-color': timeBorders[timeInterval],
                    'line-width': 3,
                    'line-opacity': 1
                },
                layout: {
                    'visibility': 'none' // Initially hidden
                }
            });
        });
    }

    // Helper method to set layer visibility on a specific map
    setLayerVisibility(map, minutes, isVisible) {
        if (!map) {
            return;
        }

        const layerId = `isochrone-${minutes}-min-border`;
        if (map.getLayer(layerId)) {
            map.setLayoutProperty(layerId, 'visibility', isVisible ? 'visible' : 'none');
        }
    }

    // Helper method to clear isochrones from a specific map
    clearIsochronesFromMap(map) {
        if (!map) {
            return;
        }

        // Define all possible layer IDs
        const timeIntervals = ['10-min', '20-min', '30-min'];

        // Remove all isochrone layers
        timeIntervals.forEach(timeInterval => {
            const layerId = `isochrone-${timeInterval}-border`;
            if (map.getLayer(layerId)) {
                map.removeLayer(layerId);
            }
        });

        // Remove the source
        if (map.getSource('isochrone-source')) {
            map.removeSource('isochrone-source');
        }
    }

    // Sync method to be called when comparison mode is enabled
    // This is the direct equivalent of PossibleSitesManager.syncWithComparisonMode()
    syncWithComparisonMode() {
        if (this.currentIsochroneData) {
            console.log('Syncing isochrones with comparison mode...');
            // If isochrones are loaded, refresh them to include comparison map
            this.showIsochroneLayers(this.currentIsochroneData);
            
            // Restore current visibility states from the switches
            this.syncCurrentVisibilityStates();
        }
    }

    // Helper method to sync current switch states to both maps
    syncCurrentVisibilityStates() {
        const drivetimeSwitches = {
            '10': document.getElementById('drivetime-10'),
            '20': document.getElementById('drivetime-20'),
            '30': document.getElementById('drivetime-30')
        };

        // Check each switch and apply its state to both maps
        Object.keys(drivetimeSwitches).forEach(minutes => {
            const switch_ = drivetimeSwitches[minutes];
            if (switch_ && switch_.checked) {
                // Apply visibility to main map
                if (this.mapManager && this.mapManager.getMap()) {
                    this.setLayerVisibility(this.mapManager.getMap(), minutes, true);
                }
                // Apply visibility to comparison map if active
                if (this.comparisonMapManager && this.comparisonMapManager.isActive()) {
                    const comparisonMap = this.comparisonMapManager.getAfterMap();
                    if (comparisonMap) {
                        this.setLayerVisibility(comparisonMap, minutes, true);
                    }
                }
            }
        });
    }
} 