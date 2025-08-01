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
            'GHI-Cumming': 'ghi_cumming_iso_clean.geojson',
            'GHI-Dahlonega': 'ghi_Dahlonega_iso_clean.geojson',
            'GHI-Habersham': 'ghi_hab_iso_clean.geojson',
            'GHI-Hamilton-Mill': 'ghi_HamMill_iso_clean.geojson',
            'Medical-Plaza-Bethlehem': 'medPlaza_beth_iso_clean.geojson',
            'Medical-Plaza-1-Braselton': 'medPlaza1_bras_iso_clean.geojson',
            'Medical-Plaza-B-Braselton': 'medical_B_braselton_iso_clean.geojson',
            'Medical-Plaza-Buford': 'medicalPlaza_buford_clean.geojson',
            'Medical-Plaza-1-Dawsonville': 'medPlaza1_dawsonville_clean.geojson',
            'Medical-Plaza-2-Dawsonville': 'medPlaza2_dawsonville_iso_clean.geojson',
            'Medical-Plaza-1-Flowery-Branch': 'medPlaza1_fb_iso_clean.geojson',
            'Medical-Park-1-Gainesville': 'medPark1_gainesville_iso_clean.geojson',
            'Medical-Park-2-Gainesville': 'medPark2_gainesville_iso_clean.geojson',
            'Medical-Plaza-Jefferson': 'uc_jefferson_iso_clean.geojson',
            'Medical-Plaza-1-Thompson-Bridge': 'medicalPlaza_ThomBrid_iso_clean.geojson',
            'NGHS-Cleveland-MOB': 'nghs_cleveland_iso_clean.geojson',
            'NGMC-Barrow-MOB': 'ngmc_Barrow_MOB_iso_clean.geojson',
            'NGPG-Auburn-Primary-Care': 'ngpg_Auburn_iso_clean.geojson',
            'NGPG-Chestnut-Mountain': 'ngpg_chestMtn_iso_clean.geojson',
            'NGPG-Clayton-Primary-Care': 'ngpg_Clayton_iso_clean.geojson',
            'NGPG-Community-Clinic': 'ngpg_commClinic_iso_clean.geojson',
            'Concierge-Medicine': 'ngpg_conciergeMed_iso_clean.geojson',
            'NGPG-Cumming': 'ngpg_Cumming_iso_clean.geojson',
            'NGPG-Dacula-Primary-Care': 'ngpg_dacula_iso_clean.geojson',
            'NGPG-Dahlonega': 'ngpg_Dahlonega_iso_clean.geojson',
            'Dawsonville-Surgical-Associates': 'ngpg_dawson_surgAssoc_iso_clean.geojson',
            'NGPG-Family-Medicine-Lavonia': 'ngpg_FamMed_lavonia_iso_clean.geojson',
            'NGPG-Hamilton-Mill': 'ngpg_hamMill_iso_clean.geojson',
            'NGPG-Internal-Medicine-Demorest': 'ngpg_intMed_demorest_iso_clean.geojson',
            'NGPG-Oakwood': 'ngpg_oakwood_iso_clean.geojson',
            'NGPG-Orthopedic-Surgery-Sports-Medicine': 'ngpg_orthoSurgery_SM_demorest_iso_clean.geojson',
            'NGPG-Orthopedic-Surgery-Dahlonega': 'ngpg_orthoSurg_Dahlonega_iso_clean.geojson',
            'NGPG-Orthopedic-Surgery-Hamilton-Mill': 'ngpg_orthSurgery_HamMill_iso_clean.geojson',
            'NGPG-Orthopedic-Surgery-Toccoa': 'ngpg_surgAssoc_toccoa_iso_clean.geojson',
            'NGPG-Orthopedic-Trauma-Recon-Surgery': 'ngpg_orthoTrauma_RS_iso_clean.geojson',
            'NGPG-Surgical-Associates-Demorest': 'ngpg_surgAssoc_toccoa_iso_clean.geojson',
            'NGPG-Surgical-Associates-Toccoa': 'ngpg_surgAssoc_toccoa_iso_clean.geojson',
            'NGPG-West-Jackson': 'ngpg_wJackson_iso_clean.geojson',
            'Toccoa-Clinic': 'toccoa_clinic_iso_clean.geojson',
            'Urgent-Care-Jefferson': 'uc_jefferson_iso_clean.geojson',
            'Wisteria-Medical-Office-Building': 'wisteria_medical_iso_clean.geojson'
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

            // Add the isochrone layers to the map
            this.addIsochroneLayers(geojsonData);
            
            // Also add to comparison map if it's active
            if (this.comparisonMapManager && this.comparisonMapManager.isActive()) {
                await this.comparisonMapManager.loadIsochroneAfterMap(departmentValue, geojsonData);
            }

            console.log(`Successfully loaded isochrone data for ${departmentValue}`);
            return true;

        } catch (error) {
            console.error(`Error loading isochrone data for ${departmentValue}:`, error);
            return false;
        }
    }

    // Add isochrone data source to the map (but don't show layers yet)
    addIsochroneLayers(geojsonData) {
        if (!this.mapManager || !this.mapManager.getMap()) {
            return;
        }

        const map = this.mapManager.getMap();

        // Remove existing layers if they exist
        this.clearIsochrones();

        // Add source for isochrone data
        map.addSource('isochrone-source', {
            type: 'geojson',
            data: geojsonData
        });

        // Define border colors for each time interval (border-only, no fill)
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

    // Show/hide specific isochrone layer
    toggleIsochroneLayer(minutes, isVisible) {
        if (!this.mapManager || !this.mapManager.getMap()) {
            return;
        }

        const map = this.mapManager.getMap();
        const layerId = `isochrone-${minutes}-min-border`;

        if (map.getLayer(layerId)) {
            map.setLayoutProperty(layerId, 'visibility', isVisible ? 'visible' : 'none');
        }

        // Also toggle on comparison map if it's active
        if (this.comparisonMapManager && this.comparisonMapManager.isActive()) {
            this.comparisonMapManager.toggleIsochroneLayerAfterMap(minutes, isVisible);
        }
    }

    // Clear all isochrone layers
    clearIsochrones() {
        if (!this.mapManager || !this.mapManager.getMap()) {
            return;
        }

        const map = this.mapManager.getMap();

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

        // Also clear from comparison map if it's active
        if (this.comparisonMapManager && this.comparisonMapManager.isActive()) {
            this.comparisonMapManager.clearIsochronesAfterMap();
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
} 