// Drawer management functionality
export class DrawerManager {
    constructor() {
        this.mainDrawer = null;
        this.permitDrawer = null;
        this.drawerTooltip = null;
        this.permitTooltip = null;
    }

    // Initialize drawer functionality
    initialize() {
        // Get drawer elements
        this.mainDrawer = document.querySelector('.drawer-placement');
        this.permitDrawer = document.querySelector('.permit-tracker-drawer');

        // Get tooltip elements that contain the buttons
        this.drawerTooltip = document.getElementById('drawerTooltip');
        this.permitTooltip = document.getElementById('permitTrackerTooltip');

        if (!this.mainDrawer || !this.permitDrawer) {
            console.error('Drawer elements not found');
            return false;
        }

        if (!this.drawerTooltip || !this.permitTooltip) {
            console.error('Tooltip elements not found');
            return false;
        }

        this.setupEventListeners();
        return true;
    }

    // Set up event listeners for drawer controls
    setupEventListeners() {
        // Main drawer controls
        const mainDrawerButton = this.drawerTooltip.querySelector('.openDrawer');
        const mainCloseButton = this.mainDrawer.querySelector('.close-button');

        // Permit drawer controls  
        const permitDrawerButton = this.permitTooltip.querySelector('.permitTrackerBtn');
        const permitCloseButton = this.permitDrawer.querySelector('.close-permit-button');

        if (mainDrawerButton) {
            mainDrawerButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.openMainDrawer();
            });
        }

        if (mainCloseButton) {
            mainCloseButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.closeMainDrawer();
            });
        }

        if (permitDrawerButton) {
            permitDrawerButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.openPermitDrawer();
            });
        }

        if (permitCloseButton) {
            permitCloseButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.closePermitDrawer();
            });
        }

        // Handle drawer hide events (when clicking outside or pressing escape)
        this.mainDrawer.addEventListener('sl-hide', () => {
            this.onMainDrawerClose();
        });

        this.permitDrawer.addEventListener('sl-hide', () => {
            this.onPermitDrawerClose();
        });
    }

    // Open main filter drawer
    openMainDrawer() {
        console.log('Opening main drawer');
        this.mainDrawer.show();
    }

    // Close main filter drawer
    closeMainDrawer() {
        console.log('Closing main drawer');
        this.mainDrawer.hide();
    }

    // Open permit tracker drawer
    openPermitDrawer() {
        console.log('Opening permit drawer');
        this.permitDrawer.show();
    }

    // Close permit tracker drawer
    closePermitDrawer() {
        console.log('Closing permit drawer');
        this.permitDrawer.hide();
    }

    // Handle main drawer close event
    onMainDrawerClose() {
        console.log('Main drawer closed');
        // Add any cleanup or state changes needed when drawer closes
    }

    // Handle permit drawer close event
    onPermitDrawerClose() {
        console.log('Permit drawer closed');
        // Add any cleanup or state changes needed when drawer closes
    }

    // Check if main drawer is open
    isMainDrawerOpen() {
        return this.mainDrawer && this.mainDrawer.hasAttribute('open');
    }

    // Check if permit drawer is open
    isPermitDrawerOpen() {
        return this.permitDrawer && this.permitDrawer.hasAttribute('open');
    }
} 