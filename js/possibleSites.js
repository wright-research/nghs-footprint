// Possible Sites management - handles showing/hiding potential site location markers
export class PossibleSitesManager {
    constructor() {
        this.toggle = null;
        this.mapManager = null;
        this.comparisonMapManager = null;
        this.siteMarkers = []; // Markers on main map
        this.comparisonSiteMarkers = []; // Markers on comparison map
        this.isActive = false;
        
        // Site coordinates (lat, lng format)
        this.siteLocations = [
            [34.282624436396034, -84.07551550163099],
            [34.25355342288231, -84.09095084214657],
            [34.10703981804112, -83.59378720792247],
            [34.10113213953785, -83.59355942525713]
        ];
    }

    // Initialize the possible sites toggle
    initialize() {
        this.toggle = document.getElementById('possible-sites');
        
        if (!this.toggle) {
            console.error('PossibleSitesManager: Toggle element not found');
            return false;
        }

        // Set initial state
        this.toggle.checked = false;

        // Listen for toggle changes
        this.toggle.addEventListener('sl-change', (event) => {
            const isChecked = event.target.checked;
            
            if (isChecked) {
                this.showSiteMarkers();
            } else {
                this.hideSiteMarkers();
            }
        });

        console.log('PossibleSitesManager initialized');
        return true;
    }

    // Set reference to MapManager for coordination
    setMapManager(mapManager) {
        this.mapManager = mapManager;
    }

    // Set reference to ComparisonMapManager for coordination
    setComparisonMapManager(comparisonMapManager) {
        this.comparisonMapManager = comparisonMapManager;
    }

    // Show site markers on both main map and comparison map (if active)
    showSiteMarkers() {
        if (!this.mapManager || !this.mapManager.getMap()) {
            console.warn('Map manager not available');
            return;
        }

        // Remove existing markers first
        this.hideSiteMarkers();

        // Add markers to main map
        const mainMap = this.mapManager.getMap();
        this.siteLocations.forEach((coords, index) => {
            const marker = this.createSiteMarker(mainMap, coords, index);
            if (marker) {
                this.siteMarkers.push(marker);
            }
        });

        // Add markers to comparison map if it's active
        if (this.comparisonMapManager && this.comparisonMapManager.isActive()) {
            const comparisonMap = this.comparisonMapManager.getAfterMap();
            if (comparisonMap) {
                this.siteLocations.forEach((coords, index) => {
                    const marker = this.createSiteMarker(comparisonMap, coords, index);
                    if (marker) {
                        this.comparisonSiteMarkers.push(marker);
                    }
                });
            }
        }

        this.isActive = true;
        console.log(`Added ${this.siteMarkers.length} markers to main map${this.comparisonSiteMarkers.length > 0 ? ` and ${this.comparisonSiteMarkers.length} markers to comparison map` : ''}`);
    }

    // Hide/remove all site markers from both maps
    hideSiteMarkers() {
        // Remove markers from main map
        this.siteMarkers.forEach(marker => {
            marker.remove();
        });
        this.siteMarkers = [];

        // Remove markers from comparison map
        this.comparisonSiteMarkers.forEach(marker => {
            marker.remove();
        });
        this.comparisonSiteMarkers = [];

        this.isActive = false;
        console.log('Removed all possible site markers from both maps');
    }

    // Create a site marker for a specific map and location
    createSiteMarker(map, coords, index) {
        if (!map) {
            return null;
        }

        // Create custom red marker element
        const el = document.createElement('div');
        el.className = 'possible-site-marker';
        el.style.width = '16px';
        el.style.height = '16px';
        el.style.backgroundColor = '#238b45'; // color of the marker
        el.style.borderRadius = '50%';
        el.style.border = '2px solid #ffffff';
        el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
        el.style.cursor = 'pointer';

        // Convert coordinates to Mapbox format (longitude, latitude)
        const mapboxCoords = [coords[1], coords[0]]; // Reverse lat/lng to lng/lat

        // Create popup for this site
        const siteName = `Site ${index + 1}`;
        const popup = new mapboxgl.Popup({
            offset: 25,
            closeButton: true,
            closeOnClick: false
        }).setHTML(`<div style="padding: 6px; font-size: 18px; font-weight: bold;">${siteName}</div>`);

        // Create the marker with popup
        const marker = new mapboxgl.Marker(el)
            .setLngLat(mapboxCoords)
            .setPopup(popup)
            .addTo(map);

        return marker;
    }

    // Get current toggle state
    isToggleActive() {
        return this.toggle ? this.toggle.checked : false;
    }

    // Get current markers state
    hasActiveMarkers() {
        return this.isActive && (this.siteMarkers.length > 0 || this.comparisonSiteMarkers.length > 0);
    }

    // Programmatically set toggle state
    setToggleState(checked) {
        if (this.toggle) {
            this.toggle.checked = checked;
            // Trigger the change event to update markers
            this.toggle.dispatchEvent(new CustomEvent('sl-change', {
                detail: { checked: checked }
            }));
        }
    }

    // Sync markers when comparison mode is enabled
    syncWithComparisonMode() {
        if (this.isActive && this.toggle && this.toggle.checked) {
            // If markers are supposed to be shown, refresh them to include comparison map
            this.showSiteMarkers();
        }
    }

    // Remove markers from comparison map when comparison mode is disabled
    clearComparisonMarkers() {
        this.comparisonSiteMarkers.forEach(marker => {
            marker.remove();
        });
        this.comparisonSiteMarkers = [];
    }
}