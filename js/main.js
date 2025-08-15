// Main application controller
import { MapManager } from './map.js';
import { DrawerManager } from './drawers.js';
import { UIControlsManager } from './ui-controls.js';
import { IsochroneManager } from './isochrones.js';
import { loadPermitData } from './permits.js';
import { loadDrivetimeStats } from './drivetimeStats.js';
import { ComparisonMapManager } from './comparisonMap.js';
import { PossibleSitesManager } from './possibleSites.js';
import { authenticationManager } from './authentication.js';

class NGHSFootprintApp {
    constructor() {
        this.mapManager = new MapManager();
        this.drawerManager = new DrawerManager();
        this.uiControlsManager = new UIControlsManager();
        this.isochroneManager = new IsochroneManager();
        this.comparisonMapManager = new ComparisonMapManager();
        this.possibleSitesManager = new PossibleSitesManager();
        this.isInitialized = false;
    }

    // Initialize the entire application
    async initialize() {
        try {
            // console.log('Initializing NGHS Footprint App...');

            // Wait for DOM to be fully loaded
            if (document.readyState !== 'complete') {
                await new Promise(resolve => {
                    if (document.readyState === 'loading') {
                        document.addEventListener('DOMContentLoaded', resolve);
                    } else {
                        resolve();
                    }
                });
            }

            // Initialize map
            // console.log('Initializing map...');
            this.mapManager.initializeMap();

            // Initialize drawers
            // console.log('Initializing drawers...');
            const drawersInitialized = this.drawerManager.initialize();

            if (!drawersInitialized) {
                throw new Error('Failed to initialize drawers');
            }

            // Initialize UI controls
            // console.log('Initializing UI controls...');
            const uiControlsInitialized = this.uiControlsManager.initialize();

            if (!uiControlsInitialized) {
                throw new Error('Failed to initialize UI controls');
            }

            // Initialize drivetime stats module
            loadDrivetimeStats();

            // Initialize comparison map manager
            this.comparisonMapManager.initialize();

            // Initialize possible sites manager
            this.possibleSitesManager.initialize();

            // Connect managers for coordination
            this.uiControlsManager.setMapManager(this.mapManager);
            this.isochroneManager.setMapManager(this.mapManager);
            this.uiControlsManager.setIsochroneManager(this.isochroneManager);
            this.uiControlsManager.setComparisonMapManager(this.comparisonMapManager);
            this.comparisonMapManager.setMapManager(this.mapManager);
            this.possibleSitesManager.setMapManager(this.mapManager);
            this.possibleSitesManager.setComparisonMapManager(this.comparisonMapManager);
            
            // Connect isochrone manager with comparison map manager for sync
            this.isochroneManager.setComparisonMapManager(this.comparisonMapManager);
            this.comparisonMapManager.setIsochroneManager(this.isochroneManager);
            
            // Connect possible sites manager with comparison map manager for sync
            this.comparisonMapManager.setPossibleSitesManager(this.possibleSitesManager);

            this.isInitialized = true;
            // console.log('NGHS Footprint App initialized successfully!');

            // Set up any additional application-level event listeners
            this.setupGlobalEventListeners();

            // Set up permit tracker integration
            this.setupPermitTrackerIntegration();

        } catch (error) {
            console.error('Error initializing NGHS Footprint App:', error);
        }
    }

    // Set up global event listeners
    setupGlobalEventListeners() {
        // Listen for window resize to handle map resizing if needed
        window.addEventListener('resize', () => {
            if (this.mapManager.getMap()) {
                this.mapManager.getMap().resize();
            }
            
            // Also resize the comparison map if it's active
            if (this.comparisonMapManager.isActive() && this.comparisonMapManager.getAfterMap()) {
                this.comparisonMapManager.getAfterMap().resize();
            }
        });

        // Add any other global event listeners here
    }

    // Set up permit tracker drawer integration
    setupPermitTrackerIntegration() {
        // Listen for opening of the permit tracker drawer
        const permitBtn = document.querySelector('.permitTrackerBtn');
        const permitDrawer = document.querySelector('.permit-tracker-drawer');
        if (permitBtn && permitDrawer) {
            permitBtn.addEventListener('click', () => {
                permitDrawer.hidden = false;
                loadPermitData();
            });
        }
        // Listen for close button
        const closeBtn = document.querySelector('.close-permit-button');
        if (closeBtn && permitDrawer) {
            closeBtn.addEventListener('click', () => {
                permitDrawer.hidden = true;
            });
        }
    }

    // Get map instance (for use by other modules)
    getMap() {
        return this.mapManager.getMap();
    }

    // Get drawer manager (for use by other modules)
    getDrawerManager() {
        return this.drawerManager;
    }

    // Get UI controls manager (for use by other modules)
    getUIControlsManager() {
        return this.uiControlsManager;
    }

    // Get isochrone manager (for use by other modules)
    getIsochroneManager() {
        return this.isochroneManager;
    }

    // Get possible sites manager (for use by other modules)
    getPossibleSitesManager() {
        return this.possibleSitesManager;
    }

    // Check if app is fully initialized
    isReady() {
        return this.isInitialized;
    }
}

// Create and initialize the app
const app = new NGHSFootprintApp();

// Wire login/logout handlers
authenticationManager.onLogin = () => {
    if (!app.isReady()) {
        app.initialize();
    }
};
authenticationManager.onLogout = () => {
    // Optionally: reset UI or keep app state; overlay will block interactions after logout.
};

// Initialize authentication when page loads; app starts after successful login
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        authenticationManager.init();
    });
} else {
    authenticationManager.init();
}

// Export the app instance for use by other modules if needed
export default app;

// Expose app instance globally for debugging
window.nghsApp = app; 