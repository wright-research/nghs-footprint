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

  // Set reference to IsochroneManager for coordination
  setIsochroneManager(isochroneManager) {
    this.isochroneManager = isochroneManager;
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

      // Sync any existing isochrones from the main map
      this.syncExistingIsochrones();

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
          
          // Load county layers for the after-map
          this.loadCountyLayersAfterMap();
          
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

  // Load county layers for the after-map (reusing logic from MapManager)
  async loadCountyLayersAfterMap() {
    if (!this.afterMap) return;

    try {
      console.log('Loading county layers for comparison map...');

      // Load county boundaries and labels in parallel
      await Promise.all([
        this.loadCountyBoundariesAfterMap(),
        this.loadCountyLabelsAfterMap()
      ]);

      console.log('County layers loaded successfully for comparison map');
    } catch (error) {
      console.error('Error loading county layers for comparison map:', error);
    }
  }

  // Load county boundary polygons for after-map
  async loadCountyBoundariesAfterMap() {
    if (!this.afterMap) return;

    try {
      const response = await fetch('Data/Other/counties.geojson');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const countiesData = await response.json();

      // Add county boundaries as a source
      this.afterMap.addSource('counties', {
        type: 'geojson',
        data: countiesData
      });

      // Add county boundary layer (outline only)
      this.afterMap.addLayer({
        id: 'county-boundaries',
        type: 'line',
        source: 'counties',
        paint: {
          'line-color': '#666666',
          'line-width': 1,
          'line-opacity': 0.8
        }
      });

      console.log('County boundaries loaded for comparison map');
    } catch (error) {
      console.error('Error loading county boundaries for comparison map:', error);
    }
  }

  // Load county label points for after-map
  async loadCountyLabelsAfterMap() {
    if (!this.afterMap) return;

    try {
      const response = await fetch('Data/Other/county_labels.geojson');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const labelsData = await response.json();

      // Add county labels as a source
      this.afterMap.addSource('county-labels', {
        type: 'geojson',
        data: labelsData
      });

      // Add county label layer
      this.afterMap.addLayer({
        id: 'county-label-text',
        type: 'symbol',
        source: 'county-labels',
        layout: {
          'text-field': ['get', 'county'],
          'text-font': ['Open Sans Bold Italic', 'Arial Unicode MS Bold'],
          'text-size': 16,
          'text-anchor': 'center',
          'text-allow-overlap': false,
          'text-ignore-placement': false,
          'text-optional': true,
          'text-transform': 'uppercase',
        },
        paint: {
          'text-color': '#444444',
          'text-halo-color': '#ffffff',
          'text-halo-width': 1
        }
      });

      console.log('County labels loaded for comparison map');
    } catch (error) {
      console.error('Error loading county labels for comparison map:', error);
    }
  }

  // Ensure county layers stay on top of other layers in after-map
  ensureCountyLayersOnTopAfterMap() {
    if (!this.afterMap) return;

    // Move county boundaries to top if they exist
    if (this.afterMap.getLayer('county-boundaries')) {
      this.afterMap.moveLayer('county-boundaries');
    }

    // Move county labels to top (above boundaries) if they exist
    if (this.afterMap.getLayer('county-label-text')) {
      this.afterMap.moveLayer('county-label-text');
    }
  }

  // Load isochrone data for after-map (sync with main map)
  async loadIsochroneAfterMap(departmentValue, isochroneData) {
    if (!this.afterMap || !isochroneData) return;

    try {
      // Clear existing isochrones first
      this.clearIsochronesAfterMap();

      // Skip if "All" is selected
      if (departmentValue === 'All') {
        return;
      }

      // Add source for isochrone data
      this.afterMap.addSource('isochrone-source', {
        type: 'geojson',
        data: isochroneData
      });

      // Define border colors for each time interval (matching main map)
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
        this.afterMap.addLayer({
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

      // Ensure county layers stay on top
      this.ensureCountyLayersOnTopAfterMap();

      console.log(`Isochrone layers added to comparison map for ${departmentValue}`);
    } catch (error) {
      console.error('Error loading isochrone for comparison map:', error);
    }
  }

  // Show/hide specific isochrone layer on after-map
  toggleIsochroneLayerAfterMap(minutes, isVisible) {
    if (!this.afterMap) return;

    const layerId = `isochrone-${minutes}-min-border`;

    if (this.afterMap.getLayer(layerId)) {
      this.afterMap.setLayoutProperty(layerId, 'visibility', isVisible ? 'visible' : 'none');
    }
  }

  // Clear all isochrone layers from after-map
  clearIsochronesAfterMap() {
    if (!this.afterMap) return;

    // Define all possible layer IDs
    const timeIntervals = ['10-min', '20-min', '30-min'];

    // Remove all isochrone layers
    timeIntervals.forEach(timeInterval => {
      const layerId = `isochrone-${timeInterval}-border`;
      if (this.afterMap.getLayer(layerId)) {
        this.afterMap.removeLayer(layerId);
      }
    });

    // Remove the source
    if (this.afterMap.getSource('isochrone-source')) {
      this.afterMap.removeSource('isochrone-source');
    }
  }

  // Sync existing isochrones from main map when comparison mode is enabled
  syncExistingIsochrones() {
    if (!this.isochroneManager || !this.afterMap) return;

    // Get current isochrone data if it exists
    const currentIsochroneData = this.isochroneManager.getCurrentIsochroneData();
    if (!currentIsochroneData) return;

    // Get the current department selection
    const departmentSelect = document.getElementById('departmentSelect');
    if (!departmentSelect) return;

    const currentDepartment = departmentSelect.value;
    if (currentDepartment === 'All') return;

    // Load the isochrone data on the comparison map
    this.loadIsochroneAfterMap(currentDepartment, currentIsochroneData).then(() => {
      // Sync the visibility of existing checkboxes
      const drivetimeCheckboxes = {
        '10': document.getElementById('drivetime-10'),
        '20': document.getElementById('drivetime-20'),
        '30': document.getElementById('drivetime-30')
      };

      // Check each checkbox and sync visibility
      Object.keys(drivetimeCheckboxes).forEach(minutes => {
        const checkbox = drivetimeCheckboxes[minutes];
        if (checkbox && checkbox.checked) {
          this.toggleIsochroneLayerAfterMap(minutes, true);
        }
      });
    });
  }
}