// ComparisonMapManager: Handles the split-screen comparison map functionality
export class ComparisonMapManager {
  constructor() {
    this.toggle = null;
    this.comparisonSelect = null;
    this.mapManager = null;
    this.afterMap = null;
    this.compareControl = null;
    this.isComparisonActive = false;
    this.currentMarker = null; // Track the currently displayed marker on comparison map
    
    // Demographic data storage
    this.demographicData = null;
    this.hexagonGeometry = null;
    
    // Map configuration matching MapManager
    this.accessToken = "pk.eyJ1Ijoid3dyaWdodDIxIiwiYSI6ImNtYTJ4NWtwdjAwb2oydnEzdjV0anRxeWIifQ.h63WS8JxUedXWYkcNCkSnQ";
    this.defaultCenter = [34.36393354341986, -83.8492021425795];
    this.defaultZoom = 9;
    
    // Mapping between comparison dropdown values and CSV column names
    this.comparisonDataMapping = {
      'current-population': 'current_pop',
      'projected-population-change': 'pop_change',
      'home-sales': 'total_sales',
      'median-home-price': 'median_price_sf',
      'median-income': 'median_income'
    };

    // DOT Projects data
    this.dotProjectsData = null;
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

          // Load demographic data
      this.loadDemographicData();

      // Load DOT projects data
      this.loadDotProjectsData();
  }

  // Set reference to MapManager for coordination
  setMapManager(mapManager) {
    this.mapManager = mapManager;
  }

  // Set reference to IsochroneManager for coordination
  setIsochroneManager(isochroneManager) {
    this.isochroneManager = isochroneManager;
  }

  // Set reference to PossibleSitesManager for coordination
  setPossibleSitesManager(possibleSitesManager) {
    this.possibleSitesManager = possibleSitesManager;
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

      // Load the default comparison layer
      setTimeout(() => {
        const defaultLayer = this.comparisonSelect.value;
        if (defaultLayer) {
          this.updateComparisonLayer(defaultLayer);
        }
      }, 200); // Give the map a moment to fully initialize

      // Sync marker with main map's current department selection (after isochrone sync)
      setTimeout(() => {
        this.syncMarkerWithMainMap();
        
        // Sync possible sites markers if they are currently active
        if (this.possibleSitesManager) {
          this.possibleSitesManager.syncWithComparisonMode();
        }
      }, 350); // Give the isochrone sync time to complete first

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

      // Hide comparison legend
      const comparisonLegend = document.getElementById('comparison-legend');
      if (comparisonLegend) {
        comparisonLegend.style.display = 'none';
      }

      // Hide comparison tooltip
      const comparisonTooltip = document.getElementById('comparison-tooltip');
      if (comparisonTooltip) {
        comparisonTooltip.style.display = 'none';
      }

      // Remove any existing marker
      this.removeCurrentMarker();

      // Clean up any active layers
      this.removeComparisonChoropleth();
      this.removeDotProjects();

      // Remove possible sites markers from comparison map
      if (this.possibleSitesManager) {
        this.possibleSitesManager.clearComparisonMarkers();
      }

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
    
    // Handle different comparison layer types
    if (layerValue === 'aerial' || layerValue === 'streets') {
      // For blank layers, change the base map style and hide legend
      this.removeComparisonChoropleth();
      this.removeDotProjects();
      this.hideComparisonLegend();
      this.updateBaseMapStyle(layerValue);
      return;
    }
    
    // Handle demographic choropleth layers
    if (this.comparisonDataMapping[layerValue]) {
      this.removeDotProjects();
      
      // Restore default style if currently using aerial/streets
      if (this.needsStyleRestore()) {
        this.restoreDefaultStyle(() => {
          this.updateDemographicChoropleth(layerValue);
        });
      } else {
        this.updateDemographicChoropleth(layerValue);
      }
      return;
    }

    // Handle DOT Projects layers
    if (layerValue === 'dot-under-construction' || layerValue === 'dot-pre-construction') {
      this.removeComparisonChoropleth();
      this.hideComparisonLegend();
      
      // Restore default style if currently using aerial/streets
      if (this.needsStyleRestore()) {
        this.restoreDefaultStyle(() => {
          this.updateDotProjectsLayer(layerValue);
        });
      } else {
        this.updateDotProjectsLayer(layerValue);
      }
      return;
    }
    
    console.warn(`Comparison layer not yet implemented: ${layerValue}`);
  }

  // Update base map style for blank layers (Aerial/Streets)
  updateBaseMapStyle(layerValue) {
    if (!this.afterMap) return;

    console.log(`Updating base map style to: ${layerValue}`);

    // Store current map state to preserve position
    const currentCenter = this.afterMap.getCenter();
    const currentZoom = this.afterMap.getZoom();

    // Define style based on layer value
    let newStyle;
    if (layerValue === 'aerial') {
      // ArcGIS aerial imagery style
      newStyle = {
        version: 8,
        sources: {
          aerial: {
            type: "raster",
            tiles: [
              "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
            ],
            tileSize: 256,
            attribution: "Imagery © Esri",
          },
        },
        glyphs: "mapbox://fonts/mapbox/{fontstack}/{range}.pbf", // Required for text labels
        layers: [
          {
            id: "esri-tiles",
            type: "raster",
            source: "aerial",
          },
        ],
      };
    } else if (layerValue === 'streets') {
      // Mapbox streets style
      newStyle = "mapbox://styles/mapbox/streets-v11";
    }

    // Set the new style
    this.afterMap.setStyle(newStyle);

    // Wait for style to load, then restore county layers and position
    this.afterMap.once('styledata', () => {
      // Restore the map position
      this.afterMap.setCenter(currentCenter);
      this.afterMap.setZoom(currentZoom);

      // Re-add county boundaries and labels
      this.loadCountyLayersAfterMap().then(() => {
        // Apply special styling for aerial layer
        if (layerValue === 'aerial') {
          this.applyAerialCountyStyling();
        }
      });
      
      console.log(`Base map style updated to: ${layerValue}`);
    });
  }

  // Restore default CARTO style for data layers
  restoreDefaultStyle(callback) {
    if (!this.afterMap) return;

    console.log('Restoring default CARTO style...');

    // Store current map state to preserve position
    const currentCenter = this.afterMap.getCenter();
    const currentZoom = this.afterMap.getZoom();

    // Default CARTO light style (matching createAfterMap)
    const defaultStyle = {
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
    };

    // Set the default style
    this.afterMap.setStyle(defaultStyle);

    // Wait for style to load, then restore position and county layers
    this.afterMap.once('styledata', () => {
      // Restore the map position
      this.afterMap.setCenter(currentCenter);
      this.afterMap.setZoom(currentZoom);

      // Re-add county boundaries and labels
      this.loadCountyLayersAfterMap().then(() => {
        console.log('Default CARTO style restored');
        if (callback) callback();
      });
    });
  }

  // Check if current style is a blank style (aerial or streets)
  needsStyleRestore() {
    if (!this.afterMap) return false;
    
    // Check if current style has CARTO source (default style)
    const style = this.afterMap.getStyle();
    return !style.sources.carto;
  }

  // Apply special white county boundary styling for aerial layer
  applyAerialCountyStyling() {
    if (!this.afterMap) return;

    // Update county boundary styling to be more visible on aerial imagery
    if (this.afterMap.getLayer('county-boundaries')) {
      this.afterMap.setPaintProperty('county-boundaries', 'line-color', '#ffffff');
      this.afterMap.setPaintProperty('county-boundaries', 'line-width', 2);
      this.afterMap.setPaintProperty('county-boundaries', 'line-opacity', 0.9);
      
      console.log('Applied white county boundary styling for aerial view');
    }
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
          'text-color': '#252525',
          'text-halo-color': '#ffffff',
          'text-halo-width': 2
        }
      });

      console.log('County labels loaded for comparison map');
    } catch (error) {
      console.error('Error loading county labels for comparison map:', error);
    }
  }

  // Ensure proper layer ordering on after-map: choropleth < isochrones < counties
  ensureCountyLayersOnTopAfterMap() {
    if (!this.afterMap) return;

    // Define the proper layer order (bottom to top)
    const layerOrder = [
      // Choropleth layers (bottom)
      'comparison-choropleth',
      // Isochrone layers (middle)
      'isochrone-30-min-border',
      'isochrone-20-min-border', 
      'isochrone-10-min-border',
      // DOT projects lines (above isochrones)
      'dot-projects-lines',
      // Hover highlight (above choropleth, isochrones, and DOT projects)
      'comparison-hover-outline',
      // County layers (top)
      'county-boundaries',
      'county-label-text'
    ];

    // Move layers to proper order if they exist
    layerOrder.forEach(layerId => {
      if (this.afterMap.getLayer(layerId)) {
        this.afterMap.moveLayer(layerId);
      }
    });
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

  // Load demographic data for comparison layers
  async loadDemographicData() {
    try {
      console.log('Loading demographic data...');

      // Load both geometry and demographic data in parallel
      const [geoResponse, dataResponse] = await Promise.all([
        fetch('Data/Other/hexagon_geos.geojson'),
        fetch('Data/Hex_demogs/hex_demogs2.csv')
      ]);

      if (!geoResponse.ok || !dataResponse.ok) {
        throw new Error('Failed to load demographic data files');
      }

      // Parse the data
      this.hexagonGeometry = await geoResponse.json();
      const csvText = await dataResponse.text();
      this.demographicData = this.parseCSV(csvText);

      // Join the demographic data with geometry
      this.joinDemographicData();

      console.log('Demographic data loaded successfully');
    } catch (error) {
      console.error('Error loading demographic data:', error);
    }
  }

  // Simple CSV parser (adapted from MapManager)
  parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    // Trim whitespace and carriage returns from header names
    const headers = lines[0].split(',').map(header => header.trim().replace(/\r$/g, ''));

    const data = {};
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      const hex_Res7 = values[0].trim(); // Also trim the key

      data[hex_Res7] = {};
      for (let j = 1; j < headers.length; j++) {
        const value = values[j] ? values[j].trim() : ''; // Trim values too
        const headerName = headers[j];
        
        // Parse as number if possible, set to null for empty strings, otherwise keep as string
        if (value === '' || value === undefined) {
          data[hex_Res7][headerName] = null;
        } else if (!isNaN(value)) {
          data[hex_Res7][headerName] = parseFloat(value);
        } else {
          data[hex_Res7][headerName] = value;
        }
      }
    }

    return data;
  }

  // Join demographic data with hexagon geometry
  joinDemographicData() {
    if (!this.hexagonGeometry || !this.demographicData) {
      console.warn('Missing data for demographic join');
      return;
    }

    // Get all possible column names from the first data entry
    const sampleDataKeys = Object.keys(Object.values(this.demographicData)[0] || {});
    let successfulJoins = 0;
    
    // Add demographic data to each hexagon feature
    this.hexagonGeometry.features.forEach(feature => {
      // Try both possible key names
      const h3_id = feature.properties.h3_id;
      const hex_Res7 = feature.properties.hex_Res7;
      
      // Check which key exists in demographic data
      let demoData = {};
      if (this.demographicData[h3_id]) {
        demoData = this.demographicData[h3_id];
        successfulJoins++;
      } else if (this.demographicData[hex_Res7]) {
        demoData = this.demographicData[hex_Res7];
        successfulJoins++;
      }

      // Ensure all columns have default values if missing
      sampleDataKeys.forEach(column => {
        feature.properties[column] = demoData[column] !== undefined ? demoData[column] : null;
      });
    });

    console.log('Demographic data joined successfully');
  }

  // Update demographic choropleth layer on comparison map
  updateDemographicChoropleth(layerValue) {
    if (!this.hexagonGeometry || !this.demographicData || !this.afterMap) {
      console.warn('Demographic data not fully loaded yet');
      return;
    }

    // Get the column name for this layer
    const columnName = this.comparisonDataMapping[layerValue];
    if (!columnName) {
      console.warn(`No column mapping found for: ${layerValue}`);
      return;
    }

    // Filter hexagons to only include those with valid data
    const filteredFeatures = this.hexagonGeometry.features
      .filter(f => {
        const value = f.properties[columnName];
        return value !== null && value !== undefined && value !== '' && !isNaN(value);
      });

    if (filteredFeatures.length === 0) {
      console.warn(`No valid data found for column: ${columnName}`);
      this.removeComparisonChoropleth();
      return;
    }

    // Calculate data ranges for styling from filtered features
    const values = filteredFeatures.map(f => parseFloat(f.properties[columnName]));
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);

    // Create filtered GeoJSON
    const filteredGeometry = {
      type: 'FeatureCollection',
      features: filteredFeatures
    };

    // Remove existing comparison choropleth layers
    this.removeComparisonChoropleth();

    // Add hexagon source with filtered data
    this.afterMap.addSource('comparison-choropleth', {
      type: 'geojson',
      data: filteredGeometry
    });

    // Create color expression based on demographic values with layer-specific colors
    const colorExpression = this.getColorExpression(layerValue, columnName, minValue, maxValue);

    // Add hexagon choropleth layer (before county layers to keep them on top)
    const beforeLayer = this.afterMap.getLayer('county-boundaries') ? 'county-boundaries' : undefined;
    this.afterMap.addLayer({
      id: 'comparison-choropleth',
      type: 'fill',
      source: 'comparison-choropleth',
      paint: {
        'fill-color': colorExpression,
        'fill-opacity': 0.7,
        'fill-outline-color': '#cccccc' // Light gray outline by default
      }
    }, beforeLayer);

    // Add hover highlight for comparison map
    this.addComparisonHoverHighlight();

    // Ensure county layers stay on top after adding choropleth
    this.ensureCountyLayersOnTopAfterMap();

    // Add hover effect
    this.setupComparisonHover(columnName, layerValue);

    console.log(`Demographic choropleth updated for: ${columnName}`, {
      minValue,
      maxValue,
      hexagonCount: filteredFeatures.length
    });

    // Update comparison legend
    this.updateComparisonLegend(layerValue, columnName, minValue, maxValue);
  }

  // Load DOT projects data
  async loadDotProjectsData() {
    try {
      console.log('Loading DOT projects data...');
      
      const response = await fetch('Data/Other/gdot_projects.geojson');
      if (!response.ok) {
        throw new Error('Failed to load DOT projects data');
      }

      this.dotProjectsData = await response.json();
      console.log('DOT projects data loaded successfully');
    } catch (error) {
      console.error('Error loading DOT projects data:', error);
    }
  }

  // Update DOT projects layer on comparison map
  updateDotProjectsLayer(layerValue) {
    if (!this.dotProjectsData || !this.afterMap) {
      console.warn('DOT projects data not fully loaded yet');
      return;
    }

    // Remove any existing DOT projects layers
    this.removeDotProjects();

    // Determine which status to show based on layer value
    const targetStatus = layerValue === 'dot-under-construction' ? 'UNDER-CONSTRUCTION' : 'PRE-CONSTRUCTION';
    const lineColor = layerValue === 'dot-under-construction' ? '#22c55e' : '#dc2626'; // Green for under construction, red for pre-construction

    // Filter features by status
    const filteredFeatures = this.dotProjectsData.features.filter(feature => 
      feature.properties.Status === targetStatus
    );

    if (filteredFeatures.length === 0) {
      console.warn(`No DOT projects found with status: ${targetStatus}`);
      return;
    }

    // Create filtered GeoJSON
    const filteredData = {
      type: 'FeatureCollection',
      features: filteredFeatures
    };

    // Add DOT projects source
    this.afterMap.addSource('dot-projects', {
      type: 'geojson',
      data: filteredData
    });

    // Add DOT projects layer with appropriate color and hover effects
    const beforeLayer = this.afterMap.getLayer('county-boundaries') ? 'county-boundaries' : undefined;
    this.afterMap.addLayer({
      id: 'dot-projects-lines',
      type: 'line',
      source: 'dot-projects',
      paint: {
        'line-color': lineColor,
        'line-width': 6,
        'line-opacity': 1
      }
    }, beforeLayer);

    // Ensure proper layer ordering
    this.ensureCountyLayersOnTopAfterMap();

    // Add hover and click functionality
    this.setupDotProjectsInteraction();

    console.log(`DOT projects layer updated: ${targetStatus}, ${filteredFeatures.length} features`);
  }

  // Setup hover and click interactions for DOT projects
  setupDotProjectsInteraction() {
    if (!this.afterMap) return;

    let hoveredFeatureId = null;

    // Create tooltip if it doesn't exist
    let dotTooltip = document.getElementById('dot-projects-tooltip');
    if (!dotTooltip) {
      dotTooltip = this.createDotProjectsTooltip();
    }

    // Change cursor on hover
    this.afterMap.on('mouseenter', 'dot-projects-lines', () => {
      this.afterMap.getCanvas().style.cursor = 'pointer';
    });

    // Handle hover - show tooltip and set hover state for line width increase
    this.afterMap.on('mousemove', 'dot-projects-lines', (e) => {
      if (e.features.length > 0) {
        const feature = e.features[0];
        const featureId = feature.id;

        // Only update if we're hovering over a new feature
        if (featureId !== hoveredFeatureId) {
          // Remove hover state from previously hovered feature
          if (hoveredFeatureId !== null) {
            this.afterMap.setFeatureState(
              { source: 'dot-projects', id: hoveredFeatureId },
              { hover: false }
            );
          }

          // Set hover state for current feature (increases line width)
          this.afterMap.setFeatureState(
            { source: 'dot-projects', id: featureId },
            { hover: true }
          );

          hoveredFeatureId = featureId;
        }

        const description = feature.properties.Desc_short || 'DOT Project';

        // Update tooltip content
        dotTooltip.textContent = description;

        // Position tooltip
        const mouseX = e.originalEvent.pageX;
        const mouseY = e.originalEvent.pageY;
        const tooltipOffset = 15;
        const windowWidth = window.innerWidth;
        const edgeBuffer = 200;

        // Show tooltip first to get dimensions
        dotTooltip.style.display = 'block';
        const tooltipWidth = dotTooltip.offsetWidth;

        // Check if tooltip would go off right edge
        if (mouseX + tooltipWidth + tooltipOffset > windowWidth - edgeBuffer) {
          // Position to the left of cursor
          dotTooltip.style.left = (mouseX - tooltipWidth - tooltipOffset) + 'px';
        } else {
          // Position to the right of cursor (default)
          dotTooltip.style.left = (mouseX + tooltipOffset) + 'px';
        }

        dotTooltip.style.top = (mouseY - tooltipOffset) + 'px';
      }
    });

    // Handle mouse leave - hide tooltip, reset cursor, and remove hover state
    this.afterMap.on('mouseleave', 'dot-projects-lines', () => {
      this.afterMap.getCanvas().style.cursor = '';
      
      // Remove hover state from currently hovered feature
      if (hoveredFeatureId !== null) {
        this.afterMap.setFeatureState(
          { source: 'dot-projects', id: hoveredFeatureId },
          { hover: false }
        );
        hoveredFeatureId = null;
      }

      if (dotTooltip) {
        dotTooltip.style.display = 'none';
      }
    });

    // Handle click - open URL in new tab
    this.afterMap.on('click', 'dot-projects-lines', (e) => {
      if (e.features.length > 0) {
        const feature = e.features[0];
        const url = feature.properties.URL;
        
        if (url) {
          window.open(url, '_blank');
        }
      }
    });
  }

  // Create tooltip element for DOT projects
  createDotProjectsTooltip() {
    const tooltip = document.createElement('div');
    tooltip.id = 'dot-projects-tooltip';
    tooltip.style.cssText = `
      position: absolute;
      background: rgba(0,0,0,0.8);
      color: white;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 500;
      pointer-events: none;
      z-index: 1000;
      max-width: 300px;
      word-wrap: break-word;
      display: none;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    `;
    
    document.body.appendChild(tooltip);
    return tooltip;
  }

  // Remove DOT projects layers and cleanup
  removeDotProjects() {
    if (!this.afterMap) return;

    // Clean up any remaining feature states before removing the source
    if (this.afterMap.getSource('dot-projects')) {
      // Reset all feature states to ensure clean removal
      try {
        this.afterMap.removeFeatureState({ source: 'dot-projects' });
      } catch (error) {
        // Ignore errors if source doesn't exist or features are already cleaned up
      }
    }

    // Remove event listeners
    this.afterMap.off('mouseenter', 'dot-projects-lines');
    this.afterMap.off('mousemove', 'dot-projects-lines');
    this.afterMap.off('mouseleave', 'dot-projects-lines');
    this.afterMap.off('click', 'dot-projects-lines');

    // Remove layer and source
    if (this.afterMap.getLayer('dot-projects-lines')) {
      this.afterMap.removeLayer('dot-projects-lines');
    }
    if (this.afterMap.getSource('dot-projects')) {
      this.afterMap.removeSource('dot-projects');
    }

    // Hide tooltip
    const dotTooltip = document.getElementById('dot-projects-tooltip');
    if (dotTooltip) {
      dotTooltip.style.display = 'none';
    }
  }

  // Remove comparison choropleth layers
  removeComparisonChoropleth() {
    if (!this.afterMap) return;

    // Remove event listeners to avoid conflicts when switching layers
    this.afterMap.off('mousemove', 'comparison-choropleth');
    this.afterMap.off('mouseleave', 'comparison-choropleth');

    // Remove layers if they exist
    if (this.afterMap.getLayer('comparison-hover-outline')) {
      this.afterMap.removeLayer('comparison-hover-outline');
    }
    if (this.afterMap.getLayer('comparison-choropleth')) {
      this.afterMap.removeLayer('comparison-choropleth');
    }
    
    // Remove sources if they exist
    if (this.afterMap.getSource('comparison-hover-hex')) {
      this.afterMap.removeSource('comparison-hover-hex');
    }
    if (this.afterMap.getSource('comparison-choropleth')) {
      this.afterMap.removeSource('comparison-choropleth');
    }

    // Hide tooltip when removing choropleth
    const comparisonTooltip = document.getElementById('comparison-tooltip');
    if (comparisonTooltip) {
      comparisonTooltip.style.display = 'none';
    }
  }

  // Add hover highlight source and layer for comparison map
  addComparisonHoverHighlight() {
    if (!this.afterMap) return;

    // Add a source for the highlighted hex
    this.afterMap.addSource("comparison-hover-hex", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: []
      }
    });

    // Add hover highlight layer (above choropleth, below county layers)
    const hoverBeforeLayer = this.afterMap.getLayer('county-boundaries') ? 'county-boundaries' : undefined;
    this.afterMap.addLayer({
      id: "comparison-hover-outline",
      type: "line",
      source: "comparison-hover-hex",
      paint: {
        "line-color": "#000000",
        "line-width": 2,
        "line-opacity": 0.9,
        "line-opacity-transition": {
          duration: 300,
          delay: 0
        },
        "line-width-transition": {
          duration: 300,
          delay: 0
        }
      }
    }, hoverBeforeLayer);
  }

  // Setup hover effects for comparison choropleth
  setupComparisonHover(columnName, layerValue) {
    if (!this.afterMap) return;

    let hoveredHexId = null;
    
    // Get or create comparison tooltip
    let comparisonTooltip = document.getElementById('comparison-tooltip');
    if (!comparisonTooltip) {
      comparisonTooltip = this.createComparisonTooltip();
    }

    const tooltipLabel = comparisonTooltip.querySelector('#comparison-tooltip-label');
    const tooltipValue = comparisonTooltip.querySelector('#comparison-tooltip-value');

    // Track hover over comparison choropleth layer
    this.afterMap.on("mousemove", "comparison-choropleth", (e) => {
      this.afterMap.getCanvas().style.cursor = 'pointer';

      if (e.features.length > 0) {
        const feature = e.features[0];
        const h3_id = feature.properties.h3_id;

        // Only update if we're hovering over a new hexagon
        if (h3_id !== hoveredHexId) {
          hoveredHexId = h3_id;

          // Update the hover source with the current feature
          this.afterMap.getSource("comparison-hover-hex").setData({
            type: "FeatureCollection",
            features: [feature]
          });
        }

        // Update tooltip with demographic data
        if (tooltipLabel && tooltipValue) {
          const value = feature.properties[columnName] || 0;
          const label = this.getTooltipLabel(layerValue);
          
          // Update tooltip content
          tooltipLabel.textContent = label + ':';
          tooltipValue.textContent = this.formatTooltipValue(value, layerValue);

          // Smart positioning with edge detection
          const mouseX = e.originalEvent.pageX;
          const mouseY = e.originalEvent.pageY;
          const windowWidth = window.innerWidth;
          const tooltipOffset = 15; // Distance from cursor
          const edgeBuffer = 200; // Switch sides when this close to edge

          // Show tooltip first to get dimensions
          comparisonTooltip.style.display = 'block';
          const tooltipWidth = comparisonTooltip.offsetWidth;

          // Check if tooltip would go off right edge
          if (mouseX + tooltipWidth + tooltipOffset > windowWidth - edgeBuffer) {
            // Position to the left of cursor
            comparisonTooltip.style.left = (mouseX - tooltipWidth - tooltipOffset) + 'px';
          } else {
            // Position to the right of cursor (default)
            comparisonTooltip.style.left = (mouseX + tooltipOffset) + 'px';
          }

          comparisonTooltip.style.top = (mouseY - tooltipOffset) + 'px';
        }
      }
    });

    // Hide hover highlight and tooltip when not hovering
    this.afterMap.on("mouseleave", "comparison-choropleth", () => {
      this.afterMap.getCanvas().style.cursor = '';
      hoveredHexId = null;

      // Clear the hover source
      this.afterMap.getSource("comparison-hover-hex").setData({
        type: "FeatureCollection",
        features: []
      });

      // Hide tooltip
      if (comparisonTooltip) {
        comparisonTooltip.style.display = 'none';
      }
    });
  }

  // Create comparison tooltip element
  createComparisonTooltip() {
    const tooltip = document.createElement('div');
    tooltip.id = 'comparison-tooltip';
    tooltip.style.cssText = `
      position: absolute;
      background: rgba(0,0,0,0.6);
      color: white;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 13px;
      pointer-events: none;
      z-index: 1000;
      display: none;
      white-space: nowrap;
    `;
    
    tooltip.innerHTML = `
      <strong><span id="comparison-tooltip-label">Population</span></strong> 
      <span id="comparison-tooltip-value">0</span>
    `;
    
    document.body.appendChild(tooltip);
    return tooltip;
  }

  // Get tooltip label based on layer type
  getTooltipLabel(layerValue) {
    const labels = {
      'current-population': 'Population',
      'projected-population-change': 'Percent Change',
      'home-sales': 'Home Sales',
      'median-home-price': 'Median Price / SF',
      'median-income': 'Median Income'
    };
    
    return labels[layerValue] || 'Value';
  }

  // Format tooltip value based on layer type
  formatTooltipValue(value, layerValue) {
    if (value === null || value === undefined || value === '') {
      return 'No data';
    }
    
    // Handle different formatting based on layer type
    switch (layerValue) {
      case 'current-population':
        return Math.round(value).toLocaleString();
      
      case 'projected-population-change':
        // Convert to percentage (assuming the value is a decimal like 0.52 for 52%)
        return (value).toFixed(1) + '%';
      
      case 'median-home-price':
        return '$' + Math.round(value).toLocaleString();
      
      case 'median-income':
        return '$' + Math.round(value).toLocaleString();
      
      case 'home-sales':
        return Math.round(value).toLocaleString();
      
      default:
        return value.toLocaleString();
    }
  }

  // Get color expression based on layer type
  getColorExpression(layerValue, columnName, minValue, maxValue) {
    // Define color ramps for different layer types
    const colorRamps = {
      'current-population': {
        colors: [
          '#f7fbff', // Very light blue
          '#c6dbef', // Light blue
          '#6baed6', // Medium blue
          '#2171b5', // Dark blue
          '#08306b'  // Very dark blue
        ]
      },
      'projected-population-change': {
        colors: [
          '#fcfbfd', // Very light purple
          '#dadaeb', // Light purple
          '#9e9ac8', // Medium purple
          '#6a51a3', // Dark purple
          '#3f007d'  // Very dark purple
        ]
      },
      'home-sales': {
        colors: [
          '#fef5f3', // Very light red
          '#fdbcb4', // Light red
          '#fc8d59', // Medium red
          '#e34a33', // Dark red
          '#b30000'  // Very dark red
        ]
      },
      'median-home-price': {
        colors: [
          '#f7fcf5', // Very light green
          '#c7e9c0', // Light green
          '#74c476', // Medium green
          '#31a354', // Dark green
          '#006d2c'  // Very dark green
        ]
      },
      'median-income': {
        colors: [
          '#f7fcf5', // Very light green
          '#c7e9c0', // Light green
          '#74c476', // Medium green
          '#31a354', // Dark green
          '#006d2c'  // Very dark green
        ]
      }
    };

    // Get the appropriate color ramp or fall back to default (yellow-red)
    const ramp = colorRamps[layerValue] || {
      colors: ['#fef0d9', '#fdcc8a', '#fc8d59', '#e34a33', '#b30000']
    };

    return [
      'interpolate',
      ['linear'],
      ['to-number', ['get', columnName]], // Ensure it's treated as number
      minValue, ramp.colors[0],           // Lightest color for low values
      maxValue * 0.25, ramp.colors[1],    // Light color
      maxValue * 0.5, ramp.colors[2],     // Medium color
      maxValue * 0.75, ramp.colors[3],    // Dark color
      maxValue, ramp.colors[4]            // Darkest color for high values
    ];
  }

  // Format legend values with appropriate symbols based on layer type
  formatLegendValue(value, layerValue) {
    if (value === null || value === undefined) {
      return 'No data';
    }

    const formattedNumber = Math.round(value).toLocaleString();

    switch (layerValue) {
      case 'projected-population-change':
        return formattedNumber + '%';
      
      case 'median-home-price':
      case 'median-income':
        return '$' + formattedNumber;
      
      case 'current-population':
      case 'home-sales':
      default:
        return formattedNumber;
    }
  }

  // Hide comparison legend
  hideComparisonLegend() {
    const legendContainer = document.getElementById('comparison-legend');
    if (legendContainer) {
      legendContainer.style.display = 'none';
    }
  }

  // Update comparison legend
  updateComparisonLegend(layerValue, columnName, minValue, maxValue) {
    const legendContainer = document.getElementById('comparison-legend');
    
    if (!legendContainer) {
      console.warn('Comparison legend container not found');
      return;
    }

    // Show the legend
    legendContainer.style.display = 'block';

    // Format layer name for display
    const displayName = this.formatLayerName(layerValue);

        // Calculate median value for display
    const medianValue = Math.round((minValue + maxValue) / 2);

    // Get the appropriate color gradient for this layer
    const gradient = this.getLegendGradient(layerValue);

    // Create legend HTML (more compact with only 3 values)
    const legendHTML = `
        <h3 id="comparison-legend-title">${displayName}</h3>
        <div style="display: flex; align-items: center; gap: 12px;">
            <!-- Color bar -->
            <div style="
                width: 20px;
                height: 80px;
                background: ${gradient};
                border: 1px solid rgba(0, 0, 0, 0.3);
                flex-shrink: 0;
            "></div>
            
            <!-- Value labels -->
            <div style="
                height: 80px;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                font-size: 15px;
                color: #fff;
                text-align: left;
            ">
                <div style="text-align: left;">${this.formatLegendValue(minValue, layerValue)}</div>
                <div style="text-align: left;">${this.formatLegendValue(medianValue, layerValue)}</div>
                <div style="text-align: left;">${this.formatLegendValue(maxValue, layerValue)}</div>
            </div>
        </div>
    `;
    
    legendContainer.innerHTML = legendHTML;
  }

  // Get CSS gradient for legend based on layer type
  getLegendGradient(layerValue) {
    const gradients = {
      'current-population': 'linear-gradient(to bottom, #f7fbff 0%, #c6dbef 25%, #6baed6 50%, #2171b5 75%, #08306b 100%)',
      'projected-population-change': 'linear-gradient(to bottom, #fcfbfd 0%, #dadaeb 25%, #9e9ac8 50%, #6a51a3 75%, #3f007d 100%)',
      'home-sales': 'linear-gradient(to bottom, #fef5f3 0%, #fdbcb4 25%, #fc8d59 50%, #e34a33 75%, #b30000 100%)',
      'median-home-price': 'linear-gradient(to bottom, #f7fcf5 0%, #c7e9c0 25%, #74c476 50%, #31a354 75%, #006d2c 100%)',
      'median-income': 'linear-gradient(to bottom, #f7fcf5 0%, #c7e9c0 25%, #74c476 50%, #31a354 75%, #006d2c 100%)'
    };

    // Return the appropriate gradient or fall back to default (yellow-red)
    return gradients[layerValue] || 'linear-gradient(to bottom, #fef0d9 0%, #fdcc8a 25%, #fc8d59 50%, #e34a33 75%, #b30000 100%)';
  }

  // Format layer name for display
  formatLayerName(layerValue) {
    const layerNames = {
      'current-population': 'Current Population',
      'projected-population-change': 'Projected 5-Yr.<br> Population Change',
      'home-sales': 'Home Sales (since 2024)',
      'median-home-price': 'Median Home Sale<br>Price / SF (since 2024)',
      'median-income': 'Median Income'
    };

    return layerNames[layerValue] || layerValue;
  }

  // Custom marker element creation function (copied from MapManager)
  createCustomMarker(scale = 1.0) {
    const el = document.createElement('div');
    el.className = 'custom-marker';
    el.style.backgroundImage = 'url(Assets/nghs_logo.png)';
    el.style.backgroundSize = '80% 80%';
    el.style.backgroundPosition = 'center';
    el.style.backgroundRepeat = 'no-repeat';
    el.style.width = `${36 * scale}px`;
    el.style.height = `${30 * scale}px`;
    el.style.backgroundColor = 'rgba(255, 255, 255, 0.85)';
    el.style.borderRadius = '50%';
    el.style.border = '2px solid #343a40';
    return el;
  }

  // Add or update location marker based on selected department (synced from main map)
  updateLocationMarker(departmentValue, centerCoords) {
    // Only proceed if comparison map is active and after-map exists
    if (!this.isComparisonActive || !this.afterMap) {
      return;
    }

    // Remove existing marker if it exists
    if (this.currentMarker) {
      this.currentMarker.remove();
      this.currentMarker = null;
    }

    // Don't show marker for "All" selection
    if (departmentValue === 'All') {
      return;
    }

    // Create and add new marker for specific location
    const markerElement = this.createCustomMarker(1.2); // Slightly larger scale

    // Convert coordinates to Mapbox format (longitude, latitude) using the same location settings as main map
    const markerCoords = ComparisonMapManager.LatLngUtils.reverse(centerCoords);

    // Create the marker
    this.currentMarker = new mapboxgl.Marker(markerElement)
      .setLngLat(markerCoords)
      .addTo(this.afterMap);

    console.log(`Comparison map marker added for: ${departmentValue}`, markerCoords);
  }

  // Remove current marker (if any)
  removeCurrentMarker() {
    if (this.currentMarker) {
      this.currentMarker.remove();
      this.currentMarker = null;
      console.log('Comparison map marker removed');
    }
  }

  // Sync marker with main map's current department selection
  syncMarkerWithMainMap() {
    if (!this.mapManager || !this.isComparisonActive) {
      return;
    }

    // Get current department selection from the main map
    const departmentSelect = document.getElementById('departmentSelect');
    if (!departmentSelect) return;

    const currentDepartment = departmentSelect.value;
    
    // Import location settings from MapManager (we need to access them somehow)
    // Since MapManager.locationSettings is static, we can reference it directly
    if (this.mapManager.constructor.locationSettings && this.mapManager.constructor.locationSettings[currentDepartment]) {
      const locationConfig = this.mapManager.constructor.locationSettings[currentDepartment];
      this.updateLocationMarker(currentDepartment, locationConfig.center);
    }
  }
}