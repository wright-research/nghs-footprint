// Possible Sites management - handles showing/hiding potential site location markers
export class PossibleSitesManager {
    constructor() {
        this.toggle = null;
        this.mapManager = null;
        this.siteMarkers = [];
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

    // Show site markers on the main map
    showSiteMarkers() {
        if (!this.mapManager || !this.mapManager.getMap()) {
            console.warn('Map manager not available');
            return;
        }

        const map = this.mapManager.getMap();

        // Remove existing markers first
        this.hideSiteMarkers();

        // Add markers for each site location
        this.siteLocations.forEach((coords, index) => {
            const marker = this.createSiteMarker(coords, index);
            this.siteMarkers.push(marker);
        });

        this.isActive = true;
        console.log(`Added ${this.siteMarkers.length} possible site markers`);
    }

    // Hide/remove all site markers
    hideSiteMarkers() {
        this.siteMarkers.forEach(marker => {
            marker.remove();
        });
        this.siteMarkers = [];
        this.isActive = false;
        console.log('Removed all possible site markers');
    }

    // Create a red marker for a site location
    createSiteMarker(coords, index) {
        if (!this.mapManager || !this.mapManager.getMap()) {
            return null;
        }

        const map = this.mapManager.getMap();

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
        return this.isActive && this.siteMarkers.length > 0;
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
}