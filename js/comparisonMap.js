// ComparisonMapManager: Handles the split-screen comparison map functionality
export class ComparisonMapManager {
  constructor() {
    this.toggle = null;
    this.comparisonSelect = null;
    this.mapManager = null;
    this.afterMap = null;
    this.compareControl = null;
    this.isComparisonActive = false;
    
    // Map configuration matching MapManager
    this.accessToken = "pk.eyJ1Ijoid3dyaWdodDIxIiwiYSI6ImNtYTJ4NWtwdjAwb2oydnEzdjV0anRxeWIifQ.h63WS8JxUedXWYkcNCkSnQ";
    this.defaultCenter = [34.36393354341986, -83.8492021425795];
    this.defaultZoom = 9;
  }

  // Helper function to reverse latitude and longitude coordinates (copied from MapManager)
  static LatLngUtils = {
    reverse(coord) {
      return [coord[1], coord[0]];
    },
    reverseBounds(sw, ne) {
      return [
        [sw[1], sw[0]],
        [ne[1], ne[0]],
      ];
    },
  };

  initialize() {
    this.toggle = document.getElementById('compareDemographics');
    this.comparisonSelect = document.getElementById('comparisonSelect');
    
    if (!this.toggle || !this.comparisonSelect) {
      console.error('ComparisonMapManager: Required elements not found');
      return;
    }

    // Set initial state
    this.comparisonSelect.disabled = true;

    // Listen for toggle changes
    this.toggle.addEventListener('sl-change', (event) => {
      const isChecked = event.target.checked;
      this.comparisonSelect.disabled = !isChecked;
      
      if (isChecked) {
        this.enableComparisonMode();
      } else {
        this.disableComparisonMode();
      }
    });

    // Listen for comparison layer changes
    this.comparisonSelect.addEventListener('sl-change', (event) => {
      if (this.isComparisonActive) {
        this.updateComparisonLayer(event.target.value);
      }
    });
  }

  // Set reference to MapManager for coordination
  setMapManager(mapManager) {
    this.mapManager = mapManager;
  }

  // Enable comparison mode - create second map and activate split view
  async enableComparisonMode() {
    if (this.isComparisonActive || !this.mapManager) return;

    try {
      console.log('Enabling comparison mode...');
      
      // Create the second map if it doesn't exist
      if (!this.afterMap) {
        await this.createAfterMap();
      }

      // Add comparison-active class to show the after-map
      const comparisonContainer = document.getElementById('comparison-container');
      comparisonContainer.classList.add('comparison-active');

      // Wait a brief moment for CSS transition, then resize the after-map
      // This ensures the map container has proper dimensions when visible
      setTimeout(() => {
        if (this.afterMap) {
          this.afterMap.resize();
          console.log('After-map resized');
        }
      }, 100);

      // Initialize Mapbox GL Compare after a short delay to ensure maps are properly sized
      setTimeout(() => {
        this.initializeCompare();
      }, 150);

      this.isComparisonActive = true;
      console.log('Comparison mode enabled');
      
    } catch (error) {
      console.error('Error enabling comparison mode:', error);
    }
  }

  // Disable comparison mode - return to single map view
  disableComparisonMode() {
    if (!this.isComparisonActive) return;

    try {
      console.log('Disabling comparison mode...');

      // Remove comparison control
      if (this.compareControl) {
        this.compareControl.remove();
        this.compareControl = null;
      }

      // Remove comparison-active class to hide the after-map
      const comparisonContainer = document.getElementById('comparison-container');
      comparisonContainer.classList.remove('comparison-active');

      this.isComparisonActive = false;
      console.log('Comparison mode disabled');
      
    } catch (error) {
      console.error('Error disabling comparison mode:', error);
    }
  }

  // Create the second map instance with matching configuration
  async createAfterMap() {
    if (this.afterMap) return;

    return new Promise((resolve, reject) => {
      try {
        // Set Mapbox access token
        mapboxgl.accessToken = this.accessToken;

        // Get current map state for synchronization
        const beforeMap = this.mapManager.getMap();
        const currentCenter = beforeMap ? beforeMap.getCenter() : ComparisonMapManager.LatLngUtils.reverse(this.defaultCenter);
        const currentZoom = beforeMap ? beforeMap.getZoom() : this.defaultZoom;

        // Use the same bounds as the main map
        const bounds = ComparisonMapManager.LatLngUtils.reverseBounds(
          [29.69986828935751, -89.76426300237956], // SW
          [37.00321344128091, -76.06740030653897] // NE
        );

        // Create the after-map with same configuration as main map
        this.afterMap = new mapboxgl.Map({
          container: "after-map",
          style: {
            version: 8,
            sources: {
              carto: {
                type: "raster",
                tiles: [
                  "https://a.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}{r}.png",
                ],
                tileSize: 256,
                attribution:
                  '&copy; <a href="https://carto.com/">CARTO</a> | <a href="https://www.loopnet.com/commercial-real-estate-brokers/profile/george-hokayem/w7x34gkb", target="_blank">SVN Hokayem Co.</a>',
              },
            },
            glyphs: "mapbox://fonts/mapbox/{fontstack}/{range}.pbf",
            layers: [
              {
                id: "carto-layer",
                type: "raster",
                source: "carto",
                minzoom: 0,
                maxzoom: 20,
              },
            ],
          },
          center: currentCenter,
          minZoom: 5,
          zoom: currentZoom,
          maxZoom: 16,
          crossOrigin: "anonymous",
          maxBounds: bounds,
        });

        // Wait for after-map to load
        this.afterMap.on('load', () => {
          console.log('After-map loaded successfully');
          
          // If the comparison container is already active, resize immediately
          const comparisonContainer = document.getElementById('comparison-container');
          if (comparisonContainer && comparisonContainer.classList.contains('comparison-active')) {
            setTimeout(() => {
              if (this.afterMap) {
                this.afterMap.resize();
              }
            }, 100);
          }
          
          resolve();
        });

        this.afterMap.on('error', (error) => {
          console.error('Error loading after-map:', error);
          reject(error);
        });

      } catch (error) {
        console.error('Error creating after-map:', error);
        reject(error);
      }
    });
  }

  // Initialize Mapbox GL Compare for split-screen functionality
  initializeCompare() {
    if (this.compareControl || !this.mapManager || !this.afterMap) return;

    try {
      const beforeMap = this.mapManager.getMap();
      
      // Initialize the compare control
      this.compareControl = new mapboxgl.Compare(beforeMap, this.afterMap, '#comparison-container', {
        // Enable mouse movement comparison (optional)
        // mousemove: true
      });

      console.log('Mapbox GL Compare initialized');
      
    } catch (error) {
      console.error('Error initializing Mapbox GL Compare:', error);
    }
  }

  // Update the comparison layer based on dropdown selection
  updateComparisonLayer(layerValue) {
    if (!this.afterMap) return;

    console.log('Updating comparison layer to:', layerValue);
    
    // TODO: Phase 2 - Implement different comparison layers
    // For now, just log the selected layer
    // This will be expanded in Phase 2 to load different datasets
  }

  // Get the after-map instance
  getAfterMap() {
    return this.afterMap;
  }

  // Check if comparison mode is currently active
  isActive() {
    return this.isComparisonActive;
  }
}