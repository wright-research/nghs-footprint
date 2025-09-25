// Map initialization and utilities
export class MapManager {
    constructor() {
        this.map = null;
        this.accessToken = "pk.eyJ1Ijoid3dyaWdodDIxIiwiYSI6ImNtYTJ4NWtwdjAwb2oydnEzdjV0anRxeWIifQ.h63WS8JxUedXWYkcNCkSnQ";
        this.defaultCenter = [34.36393354341986, -83.8492021425795];
        this.defaultZoom = 9;
        this.currentMarker = null; // Track the currently displayed marker
        this.hexagonData = null; // Store hexagon visit data
        this.hexagonGeometry = null; // Store hexagon geography
        this.currentDepartment = 'All'; // Track current department selection
    }

    // Helper function to reverse latitude and longitude in bounds
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

    // Initialize the map
    initializeMap() {
        // Set Mapbox access token
        mapboxgl.accessToken = this.accessToken;

        // Use the default center coordinates converted to Mapbox format
        const center = MapManager.LatLngUtils.reverse(this.defaultCenter);
        const bounds = MapManager.LatLngUtils.reverseBounds(
            [29.69986828935751, -89.76426300237956], // SW
            [37.00321344128091, -76.06740030653897] // NE
        );

        // Create the map
        this.map = new mapboxgl.Map({
            container: "before-map", // container ID
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
            center: center,
            minZoom: 5, // farthest zoom out
            zoom: 9.3,
            maxZoom: 16, // farthest zoom in
            crossOrigin: "anonymous",
            maxBounds: bounds,
        });

        // Wait for map to load
        this.map.on('load', () => {
            console.log('Map loaded successfully');

            // Add scale control
            const scale = new mapboxgl.ScaleControl({
                maxWidth: 175,
                unit: "imperial",
            });
            this.map.addControl(scale, "bottom-right");

            // Add geocoder
            const geocoderSW = [33.562515748519296, -84.42598713848297];
            const geocoderNE = [34.986892324333375, -82.25873947850033];
            const geocoderBounds = [
                ...this.constructor.LatLngUtils.reverse(geocoderSW),
                ...this.constructor.LatLngUtils.reverse(geocoderNE),
            ];

            const geocoder = new MapboxGeocoder({
                accessToken: mapboxgl.accessToken,
                mapboxgl: mapboxgl,
                placeholder: "Search for an address:",
                // bbox: geocoderBounds,
                limit: 5,
            });

            // Append geocoder to container
            document.getElementById("geocoder-container").appendChild(geocoder.onAdd(this.map));

            // Load county layers after map is ready
            this.loadCountyLayers();

            // Load hexagon choropleth data
            this.loadHexagonData();
        });

        return this.map;
    }

    // Get the map instance
    getMap() {
        return this.map;
    }

    // Location settings for each department/facility
    static locationSettings = {
        'All': {
            center: [34.36393354341986, -83.8492021425795], // Default center
            zoom: 9
        },
        'GHI-Blairsville': {
            center: [34.88819465, -83.96257421], // Blairsville, GA
            zoom: 11
        },
        'GHI-Clayton': {
            center: [34.87068984, -83.40153657], // Clayton, GA
            zoom: 11
        },
        'GHI-Cleveland': {
            center: [34.634714343155146, -83.74563998454451], // Cleveland, GA
            zoom: 11
        },
        'GHI-Cumming': {
            center: [34.18482735, -84.12386131], // Cumming, GA
            zoom: 11
        },
        'GHI-Dahlonega': {
            center: [34.52378208, -83.97913477], // Dahlonega, GA
            zoom: 11
        },
        'GHI-Habersham': {
            center: [34.58279096, -83.53570904], // Habersham County area
            zoom: 11
        },
        'GHI-Hamilton-Mill': {
            center: [34.0687694, -83.90835065], // Hamilton Mill, GA
            zoom: 11
        },
        'GHI-MP1-Bethlehem': {
            center: [33.94136499, -83.75982668], // Bethlehem, GA
            zoom: 11
        },
        'GHI-MP1-Buford': {
            center: [34.10464183481392, -84.00181124255549], // Buford, GA
            zoom: 11
        },
        'GHI-MP1-Jefferson': {
            center: [34.10521564, -83.59336152], // Jefferson, GA
            zoom: 11
        },
        'GHI-MP2-Dawsonville': {
            center: [34.368317342880566, -84.03345625512794], // Dawsonville, GA
            zoom: 11
        },
        'GHI-MPB-Braselton': {
            center: [34.12025076, -83.83741488], // Braselton, GA
            zoom: 11
        },
        'GHI-Toccoa': {
            center: [34.57996710408609, -83.3182789268724], // Toccoa, GA
            zoom: 11
        },
        'GHI-Wisteria': {
            center: [34.30353219, -83.81585212], // Gainesville, GA
            zoom: 11
        },
        'NGPG-FM-Auburn': {
            center: [34.01045568, -83.82401803], // Auburn, GA
            zoom: 11
        },
        'NGPG-FM-Chestnut-Mountain': {
            center: [34.19255169, -83.86023549], // Chestnut Mountain area
            zoom: 11
        },
        'NGPG-FM-Clayton': {
            center: [34.88036399, -83.39973462], // Clayton, GA
            zoom: 11
        },
        'NGPG-FM-Community-Clinic': {
            center: [34.28671952, -83.80418067], // Gainesville area
            zoom: 11
        },
        'NGPG-FM-Concierge-Medicine': {
            center: [34.30462881, -83.81214518], // Gainesville area
            zoom: 11
        },
        'NGPG-FM-Cumming': {
            center: [34.25507313, -84.09066905], // Cumming, GA
            zoom: 11
        },
        'NGPG-FM-Dacula': {
            center: [34.0088468, -83.91609719], // Dacula, GA
            zoom: 11
        },
        'NGPG-FM-Dahlonega': {
            center: [34.52511456, -83.97985496], // Dahlonega, GA
            zoom: 11
        },
        'NGPG-FM-Hamilton-Mill': {
            center: [34.06873155, -83.9083655], // Hamilton Mill, GA
            zoom: 11
        },
        'NGPG-FM-Lavonia': {
            center: [34.42846483, -83.10588151], // Lavonia, GA
            zoom: 11
        },
        'NGPG-FM-Oakwood': {
            center: [34.23462493, -83.87316526], // Oakwood, GA
            zoom: 11
        },
        'NGPG-FM-West-Jackson': {
            center: [34.10828999, -83.70612262], // West Jackson area
            zoom: 11
        },
        'NGPG-FM-MP1-Bethlehem': {
            center: [33.941334499649535, -83.75973794878723], // Bethlehem, GA
            zoom: 11
        },
        'NGPG-FM-MP1-Buford': {
            center: [34.10464183481392, -84.00181124255549], // Buford, GA
            zoom: 11
        },
        'NGPG-FM-MP1-Flowery-Branch': {
            center: [34.18004739, -83.91876058], // Flowery Branch, GA
            zoom: 11
        },
        'NGPG-FM-MP1-Jefferson': {
            center: [34.10521564, -83.59336152], // Jefferson, GA
            zoom: 11
        },
        'NGPG-FM-NGMC-Barrow-MOB': {
            center: [34.00806975, -83.70768917], // Barrow County area
            zoom: 11
        },
        'NGPG-FM-IM-Cleveland': {
            center: [34.63471161, -83.74568103], // Cleveland, GA
            zoom: 11
        },
        'NGPG-FM-IM-MP1-Braselton': {
            center: [34.1175788, -83.8399132], // Braselton, GA
            zoom: 11
        },
        'NGPG-FM-IM-MP1-Dawsonville': {
            center: [34.36873143, -84.03310797], // Dawsonville, GA
            zoom: 11
        },
        'NGPG-FM-IM-MP2-Gainesville': {
            center: [34.30692963, -83.80956252], // Gainesville, GA
            zoom: 11
        },
        'NGPG-FM-IM-Toccoa': {
            center: [34.57997561485314, -83.3184000479576], // Toccoa, GA
            zoom: 11
        },
        'NGPG-IM-Demorest': {
            center: [34.58527154, -83.53625313], // Demorest, GA
            zoom: 11
        },
        'NGPG-Ortho-Gainesville': {
            center: [34.30765634, -83.81676159], // Gainesville, GA
            zoom: 11
        },
        'NGPG-Ortho-Surgery-Cleveland': {
            center: [34.63471161, -83.74568103], // Cleveland, GA
            zoom: 11
        },
        'NGPG-Ortho-Surgery-Dahlonega': {
            center: [34.47067524, -83.96826953], // Dahlonega, GA
            zoom: 11
        },
        'NGPG-Ortho-Surgery-Demorest': {
            center: [34.58026403, -83.539835], // Demorest, GA
            zoom: 11
        },
        'NGPG-Ortho-Surgery-Hamilton-Mill': {
            center: [34.06865318, -83.90461233], // Hamilton Mill, GA
            zoom: 11
        },
        'NGPG-Ortho-Surgery-MP1-Bethlehem': {
            center: [33.941334499649535, -83.75973794878723], // Bethlehem, GA
            zoom: 11
        },
        'NGPG-Ortho-Surgery-MP1-Buford': {
            center: [34.10464183481392, -84.00181124255549], // Buford, GA
            zoom: 11
        },
        'NGPG-Ortho-Surgery-MP2-Dawsonville': {
            center: [34.36836889320002, -84.03344442296216], // Dawsonville, GA
            zoom: 11
        },
        'NGPG-Ortho-Surgery-MPB-Braselton': {
            center: [34.12025076, -83.83741488], // Braselton, GA
            zoom: 11
        },
        'NGPG-Ortho-Surgery-Toccoa': {
            center: [34.57996710408609, -83.3182789268724], // Toccoa, GA
            zoom: 11
        },
        'NGPG-Ortho-Surgery-MP1-Gainesville': {
            center: [34.30537305058233, -83.81118341486828], // Gainesville, GA
            zoom: 11
        },
        'NGPG-Surgical-Associates-Cleveland': {
            center: [34.63471161, -83.74568103], // Cleveland, GA
            zoom: 11
        },
        'NGPG-Surgical-Associates-Dawsonville': {
            center: [34.36874472805684, -84.03419862873912], // Dawsonville, GA
            zoom: 11
        },
        'NGPG-Surgical-Associates-Demorest': {
            center: [34.58524702, -83.53623573], // Demorest, GA
            zoom: 11
        },
        'NGPG-Surgical-Associates-MP1-Bethlehem': {
            center: [33.941334499649535, -83.75973794878723], // Bethlehem, GA
            zoom: 11
        },
        'NGPG-Surgical-Associates-MP1-Buford': {
            center: [34.10464183481392, -84.00181124255549], // Buford, GA
            zoom: 11
        },
        'NGPG-Surgical-Associates-MP1-Jefferson': {
            center: [34.10521564, -83.59336152], // Jefferson, GA
            zoom: 11
        },
        'NGPG-Surgical-Associates-MP2-Gainesville': {
            center: [34.30692963, -83.80956252], // Gainesville, GA
            zoom: 11
        },
        'NGPG-Surgical-Associates-MPB-Braselton': {
            center: [34.12025076, -83.83741488], // Braselton, GA
            zoom: 11
        },
        'NGPG-Surgical-Associates-Toccoa': {
            center: [34.57996710408609, -83.3182789268724], // Toccoa, GA
            zoom: 11
        },
        'NGPG-MP1-Thompson-Bridge': {
            center: [34.37260708, -83.87225646], // Thompson Bridge area
            zoom: 11
        },
        'Urgent-Care-Jefferson': {
            center: [34.10521564, -83.59336152], // Jefferson, GA
            zoom: 11
        }
    };

    // Update map center and zoom based on selected department
    updateMapView(departmentValue) {
        if (!this.map) {
            console.error('Map not initialized');
            return;
        }

        const locationConfig = MapManager.locationSettings[departmentValue];

        if (!locationConfig) {
            console.warn(`No location configuration found for: ${departmentValue}`);
            return;
        }

        // Convert coordinates to Mapbox format (longitude, latitude)
        const center = MapManager.LatLngUtils.reverse(locationConfig.center);

        // Animate to the new location
        this.map.flyTo({
            center: center,
            zoom: locationConfig.zoom,
            duration: 2000, // 2 second animation
            essential: true // This animation is considered essential for accessibility
        });

        console.log(`Map updated for: ${departmentValue}`, {
            center: locationConfig.center,
            zoom: locationConfig.zoom
        });

        // Add or remove marker based on selection
        this.updateLocationMarker(departmentValue, locationConfig.center);

        // Update hexagon choropleth based on selection
        this.updateHexagonChoropleth(departmentValue);
    }

    // Reset map to default view
    resetToDefaultView() {
        this.updateMapView('All');
    }

    // Load county boundary and label layers
    async loadCountyLayers() {
        try {
            console.log('Loading county layers...');

            // Load county boundaries
            await this.loadCountyBoundaries();

            // Load county labels
            await this.loadCountyLabels();

            console.log('County layers loaded successfully');
        } catch (error) {
            console.error('Error loading county layers:', error);
        }
    }

    // Load county boundary polygons
    async loadCountyBoundaries() {
        try {
            const response = await fetch('Data/Other/counties.geojson');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const countiesData = await response.json();

            // Add county boundaries as a source
            this.map.addSource('counties', {
                type: 'geojson',
                data: countiesData
            });

            // Add county boundary layer (outline only)
            this.map.addLayer({
                id: 'county-boundaries',
                type: 'line',
                source: 'counties',
                paint: {
                    'line-color': '#666666',
                    'line-width': 1,
                    'line-opacity': 0.8
                }
            });

            console.log('County boundaries loaded');
        } catch (error) {
            console.error('Error loading county boundaries:', error);
        }
    }

    // Load county label points
    async loadCountyLabels() {
        try {
            const response = await fetch('Data/Other/county_labels.geojson');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const labelsData = await response.json();

            // Add county labels as a source
            this.map.addSource('county-labels', {
                type: 'geojson',
                data: labelsData
            });

            // Add county label layer
            this.map.addLayer({
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
                    // make the text all caps
                    'text-transform': 'uppercase',
                    // italicize the text
                },
                paint: {
                    'text-color': '#252525',
                    'text-halo-color': '#ffffff',
                    'text-halo-width': 2
                }
            });

            console.log('County labels loaded');
        } catch (error) {
            console.error('Error loading county labels:', error);
        }
    }

    // Ensure county layers stay on top of all other layers
    ensureCountyLayersOnTop() {
        if (this.map.getLayer('county-boundaries')) {
            this.map.moveLayer('county-boundaries');
        }
        if (this.map.getLayer('county-label-text')) {
            this.map.moveLayer('county-label-text');
        }
    }

    // County layers are always visible - toggle functions removed for simplicity

    // Custom marker element creation function
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

    // Add or update location marker based on selected department
    updateLocationMarker(departmentValue, centerCoords) {
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

        // Convert coordinates to Mapbox format (longitude, latitude)
        const markerCoords = MapManager.LatLngUtils.reverse(centerCoords);

        // Create the marker
        this.currentMarker = new mapboxgl.Marker(markerElement)
            .setLngLat(markerCoords)
            .addTo(this.map);

        console.log(`Marker added for: ${departmentValue}`, markerCoords);
    }

    // Remove current marker (if any)
    removeCurrentMarker() {
        if (this.currentMarker) {
            this.currentMarker.remove();
            this.currentMarker = null;
            console.log('Marker removed');
        }
    }

    // Get current marker status
    hasMarker() {
        return this.currentMarker !== null;
    }

    // Mapping between dropdown values and CSV column names
    static dropdownToColumnMapping = {
        'All': 'Total_Visits',
        'GHI-Blairsville': 'GHI Blairsville',
        'GHI-Clayton': 'GHI Clayton',
        'GHI-Cleveland': 'GHI Cleveland',
        'GHI-Cumming': 'GHI Cumming',
        'GHI-Dahlonega': 'GHI Dahlonega',
        'GHI-Habersham': 'GHI Habersham',
        'GHI-Hamilton-Mill': 'GHI Hamilton Mill',
        'GHI-MP1-Bethlehem': 'GHI at MP1 in Bethlehem',
        'GHI-MP1-Buford': 'GHI at MP1 in Buford',
        'GHI-MP1-Jefferson': 'GHI at MP1 in Jefferson',
        'GHI-MP2-Dawsonville': 'GHI at MP2 in Dawsonville',
        'GHI-MPB-Braselton': 'GHI at MPB in Braselton',
        'GHI-Toccoa': 'GHI at Toccoa Clinic',
        'GHI-Wisteria': 'GHI at Wisteria MOB',
        'NGPG-FM-Auburn': 'NGPG FM Auburn',
        'NGPG-FM-Chestnut-Mountain': 'NGPG FM Chestnut Mountain',
        'NGPG-FM-Clayton': 'NGPG FM Clayton',
        'NGPG-FM-Community-Clinic': 'NGPG FM Community Clinic Gainesville',
        'NGPG-FM-Concierge-Medicine': 'NGPG FM Concierge Medicine Gainesville',
        'NGPG-FM-Cumming': 'NGPG FM Cumming',
        'NGPG-FM-Dacula': 'NGPG FM Dacula',
        'NGPG-FM-Dahlonega': 'NGPG FM Dahlonega',
        'NGPG-FM-Hamilton-Mill': 'NGPG FM Hamilton Mill',
        'NGPG-FM-Lavonia': 'NGPG FM Lavonia',
        'NGPG-FM-Oakwood': 'NGPG FM Oakwood',
        'NGPG-FM-West-Jackson': 'NGPG FM West Jackson in Hoschton',
        'NGPG-FM-MP1-Bethlehem': 'NGPG FM at MP1 in Bethlehem',
        'NGPG-FM-MP1-Buford': 'NGPG FM at MP1 in Buford',
        'NGPG-FM-MP1-Flowery-Branch': 'NGPG FM at MP1 in Flowery Branch',
        'NGPG-FM-MP1-Jefferson': 'NGPG FM at MP1 in Jefferson',
        'NGPG-FM-NGMC-Barrow-MOB': 'NGPG FM at NGMC Barrow MOB',
        'NGPG-FM-IM-Cleveland': 'NGPG FM/IM Cleveland',
        'NGPG-FM-IM-MP1-Braselton': 'NGPG FM/IM at MP1 in Braselton',
        'NGPG-FM-IM-MP1-Dawsonville': 'NGPG FM/IM at MP1 in Dawsonville',
        'NGPG-FM-IM-MP2-Gainesville': 'NGPG FM/IM at MP2 in Gainesville',
        'NGPG-FM-IM-Toccoa': 'NGPG FM/IM at Toccoa Clinic',
        'NGPG-IM-Demorest': 'NGPG IM Demorest',
        'NGPG-Ortho-Gainesville': 'NGPG Ortho Trauma Gainesville',
        'NGPG-Ortho-Surgery-Cleveland': 'NGPG Orthopedic Surgery Cleveland',
        'NGPG-Ortho-Surgery-Dahlonega': 'NGPG Orthopedic Surgery Dahlonega',
        'NGPG-Ortho-Surgery-Demorest': 'NGPG Orthopedic Surgery Demorest',
        'NGPG-Ortho-Surgery-Hamilton-Mill': 'NGPG Orthopedic Surgery Hamilton Mill',
        'NGPG-Ortho-Surgery-MP1-Bethlehem': 'NGPG Orthopedic Surgery at MP1 in Bethlehem',
        'NGPG-Ortho-Surgery-MP1-Buford': 'NGPG Orthopedic Surgery at MP1 in Buford',
        'NGPG-Ortho-Surgery-MP2-Dawsonville': 'NGPG Orthopedic Surgery at MP2 in Dawsonville',
        'NGPG-Ortho-Surgery-MPB-Braselton': 'NGPG Orthopedic Surgery at MPB in Braselton',
        'NGPG-Ortho-Surgery-Toccoa': 'NGPG Orthopedic Surgery at Toccoa Clinic',
        'NGPG-Ortho-Surgery-MP1-Gainesville': 'NGPG Orthopedic Surgery at MP1 in Gainesville',
        'NGPG-Surgical-Associates-Cleveland': 'NGPG Surgical Associates Cleveland',
        'NGPG-Surgical-Associates-Dawsonville': 'NGPG Surgical Associates Dawsonville',
        'NGPG-Surgical-Associates-Demorest': 'NGPG Surgical Associates Demorest',
        'NGPG-Surgical-Associates-MP1-Bethlehem': 'NGPG Surgical Associates at MP1 in Bethlehem',
        'NGPG-Surgical-Associates-MP1-Buford': 'NGPG Surgical Associates at MP1 in Buford',
        'NGPG-Surgical-Associates-MP1-Jefferson': 'NGPG Surgical Associates at MP1 in Jefferson',
        'NGPG-Surgical-Associates-MP2-Gainesville': 'NGPG Surgical Associates at MP2 in Gainesville',
        'NGPG-Surgical-Associates-MPB-Braselton': 'NGPG Surgical Associates at MPB in Braselton',
        'NGPG-Surgical-Associates-Toccoa': 'NGPG Surgical Associates at Toccoa Clinic',
        'NGPG-MP1-Thompson-Bridge': 'NGPG at MP1 Thompson Bridge',
        'Urgent-Care-Jefferson': 'Urgent Care Jefferson'
    };

    // Load hexagon geography and visits data
    async loadHexagonData() {
        try {
            console.log('Loading hexagon data...');

            // Load both geography and data in parallel
            const [geoResponse, dataResponse] = await Promise.all([
                fetch('Data/Other/hexagon_geos.geojson'),
                fetch('Data/Other/visits_by_hex_2.csv')
            ]);

            if (!geoResponse.ok || !dataResponse.ok) {
                throw new Error('Failed to load hexagon data files');
            }

            // Parse the data
            this.hexagonGeometry = await geoResponse.json();
            const csvText = await dataResponse.text();
            this.hexagonData = this.parseCSV(csvText);

            // Join the data with geography
            this.joinHexagonData();

            console.log('Hexagon data loaded successfully');

            // Show initial choropleth for "All" (Total_Visits) now that data is ready
            this.updateHexagonChoropleth('All');
        } catch (error) {
            console.error('Error loading hexagon data:', error);
        }
    }

    // Simple CSV parser
    parseCSV(csvText) {
        const lines = csvText.trim().split('\n');
        const headers = lines[0].split(',');

        const data = {};
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            const h3_id = values[0];

            data[h3_id] = {};
            for (let j = 1; j < headers.length; j++) {
                data[h3_id][headers[j]] = parseFloat(values[j]) || 0;
            }
        }

        return data;
    }

    // Join hexagon data with geography
    joinHexagonData() {
        if (!this.hexagonGeometry || !this.hexagonData) {
            console.warn('Missing hexagon data for join');
            return;
        }

        // Get all possible column names from the first data entry
        const sampleDataKeys = Object.keys(Object.values(this.hexagonData)[0] || {});

        // Add visit data to each hexagon feature
        this.hexagonGeometry.features.forEach(feature => {
            const h3_id = feature.properties.h3_id;
            const visitData = this.hexagonData[h3_id] || {};

            // Ensure all columns have default values (0) if missing
            sampleDataKeys.forEach(column => {
                feature.properties[column] = visitData[column] !== undefined ? visitData[column] : 0;
            });
        });

        console.log('Hexagon data joined successfully');
    }

    // Create or update hexagon choropleth layer
    updateHexagonChoropleth(departmentValue) {
        if (!this.hexagonGeometry || !this.hexagonData) {
            console.warn('Hexagon data not fully loaded yet');
            return;
        }

        // Track current department for tooltip
        this.currentDepartment = departmentValue;

        // Get the column name for this department
        const columnName = MapManager.dropdownToColumnMapping[departmentValue];
        if (!columnName) {
            console.warn(`No column mapping found for: ${departmentValue}`);
            return;
        }

        // Filter hexagons to only include those with visits > 0
        const filteredFeatures = this.hexagonGeometry.features
            .filter(f => (f.properties[columnName] || 0) > 0);

        if (filteredFeatures.length === 0) {
            console.warn(`No data found for column: ${columnName}`);
            this.hideHexagonLayer();
            return;
        }

        // Calculate data ranges for styling from filtered features
        const values = filteredFeatures.map(f => f.properties[columnName]);
        const maxValue = Math.max(...values);
        const minValue = Math.min(...values);

        // Create filtered GeoJSON
        const filteredGeometry = {
            type: 'FeatureCollection',
            features: filteredFeatures
        };

        // Remove existing hexagon layers if they exist
        if (this.map.getLayer('hex-hover-outline')) {
            this.map.removeLayer('hex-hover-outline');
        }
        if (this.map.getLayer('hexagon-choropleth')) {
            this.map.removeLayer('hexagon-choropleth');
        }
        if (this.map.getSource('hover-hex')) {
            this.map.removeSource('hover-hex');
        }
        if (this.map.getSource('hexagon-choropleth')) {
            this.map.removeSource('hexagon-choropleth');
        }

        // Add hexagon source with filtered data
        this.map.addSource('hexagon-choropleth', {
            type: 'geojson',
            data: filteredGeometry
        });

        // Create color expression based on visit values (simplified since we filtered out zeros)
        const colorExpression = [
            'interpolate',
            ['linear'],
            ['to-number', ['get', columnName]], // Ensure it's treated as number
            minValue, '#fef0d9',         // Light yellow for low values
            maxValue * 0.25, '#fdcc8a',  // Gold/yellow 
            maxValue * 0.5, '#fc8d59',   // Dark orange
            maxValue * 0.75, '#e34a33',  // Orange-red
            maxValue, '#b30000'          // Deep red for high values
        ];

        // Add hexagon choropleth layer (before county layers to keep them on top)
        const beforeLayer = this.map.getLayer('county-boundaries') ? 'county-boundaries' : undefined;
        this.map.addLayer({
            id: 'hexagon-choropleth',
            type: 'fill',
            source: 'hexagon-choropleth',
            paint: {
                'fill-color': colorExpression,
                'fill-opacity': 0.7,
                'fill-outline-color': '#cccccc' // Light gray outline by default
            }
        }, beforeLayer);

        // Add hover highlight source and layer
        this.addHoverHighlight();

        // Ensure county layers stay on top after adding choropleth
        this.ensureCountyLayersOnTop();

        // Add hover effect
        this.setupHexagonHover();

        console.log(`Hexagon choropleth updated for: ${columnName}`, {
            minValue,
            maxValue,
            hexagonCount: filteredFeatures.length
        });

        // Update legend with current data ranges
        this.updateLegend(columnName, minValue, maxValue, departmentValue);
    }

    // Add hover highlight source and layer
    addHoverHighlight() {
        // Add a source for the highlighted hex
        this.map.addSource("hover-hex", {
            type: "geojson",
            data: {
                type: "FeatureCollection",
                features: []
            }
        });

        // Add hover highlight layer (above choropleth, below county layers)
        const hoverBeforeLayer = this.map.getLayer('county-boundaries') ? 'county-boundaries' : undefined;
        this.map.addLayer({
            id: "hex-hover-outline",
            type: "line",
            source: "hover-hex",
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

    // Setup hexagon hover effects
    setupHexagonHover() {
        let hoveredHexId = null;
        const tooltip = document.getElementById('tooltip');
        const tooltipVisits = document.getElementById('tooltip-visits');

        // Track hover over hex layer
        this.map.on("mousemove", "hexagon-choropleth", (e) => {
            this.map.getCanvas().style.cursor = 'pointer';

            if (e.features.length > 0) {
                const feature = e.features[0];
                const h3_id = feature.properties.h3_id;

                // Only update if we're hovering over a new hexagon
                if (h3_id !== hoveredHexId) {
                    hoveredHexId = h3_id;

                    // Update the hover source with the current feature
                    this.map.getSource("hover-hex").setData({
                        type: "FeatureCollection",
                        features: [feature]
                    });
                }

                // Update tooltip with visit count
                if (tooltip && tooltipVisits) {
                    // Get the current department's column name
                    const columnName = MapManager.dropdownToColumnMapping[this.currentDepartment] || 'Total_Visits';
                    const visits = feature.properties[columnName] || 0;

                    // Format the visit count
                    tooltipVisits.textContent = visits.toLocaleString();

                    // Smart positioning with edge detection
                    const mouseX = e.originalEvent.pageX;
                    const mouseY = e.originalEvent.pageY;
                    const windowWidth = window.innerWidth;
                    const tooltipOffset = 15; // Distance from cursor
                    const edgeBuffer = 200; // Switch sides when this close to edge

                    // Show tooltip first to get dimensions
                    tooltip.style.display = 'block';
                    const tooltipWidth = tooltip.offsetWidth;

                    // Check if tooltip would go off right edge
                    if (mouseX + tooltipWidth + tooltipOffset > windowWidth - edgeBuffer) {
                        // Position to the left of cursor
                        tooltip.style.left = (mouseX - tooltipWidth - tooltipOffset) + 'px';
                    } else {
                        // Position to the right of cursor (default)
                        tooltip.style.left = (mouseX + tooltipOffset) + 'px';
                    }

                    tooltip.style.top = (mouseY - tooltipOffset) + 'px';
                }
            }
        });

        // Hide hover highlight and tooltip when not hovering
        this.map.on("mouseleave", "hexagon-choropleth", () => {
            this.map.getCanvas().style.cursor = '';
            hoveredHexId = null;

            // Clear the hover source
            this.map.getSource("hover-hex").setData({
                type: "FeatureCollection",
                features: []
            });

            // Hide tooltip
            if (tooltip) {
                tooltip.style.display = 'none';
            }
        });
    }

    // Hide hexagon layer
    hideHexagonLayer() {
        if (this.map.getLayer('hexagon-choropleth')) {
            this.map.setLayoutProperty('hexagon-choropleth', 'visibility', 'none');
        }
    }

    // Show hexagon layer
    showHexagonLayer() {
        if (this.map.getLayer('hexagon-choropleth')) {
            this.map.setLayoutProperty('hexagon-choropleth', 'visibility', 'visible');
        }
    }

    // Update legend based on current department and data range
    updateLegend(columnName, minValue, maxValue, departmentValue) {
        const legendContainer = document.getElementById('legend');
        const legendTitle = document.getElementById('legend-title');
        const legendItems = document.getElementById('legend-items');

        if (!legendContainer || !legendTitle || !legendItems) {
            console.warn('Legend elements not found');
            return;
        }

        // Set legend title based on department
        const departmentName = departmentValue === 'All' ?
            'All Facilities' :
            this.formatDepartmentName(departmentValue);

        legendTitle.innerHTML = `<h3>Visits by Hexagon<br><span style="font-size: 0.9em; font-weight: normal;">${departmentName}</span></h3>`;

        // Calculate median value for display
        const medianValue = Math.round((minValue + maxValue) / 2);

        // Create vertical color bar with gradient (more compact with only 3 values)
        const legendHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
            <!-- Color bar -->
            <div style="
                width: 20px;
                height: 80px;
                background: linear-gradient(to bottom, 
                    #fef0d9 0%, 
                    #fdcc8a 25%, 
                    #fc8d59 50%, 
                    #e34a33 75%, 
                    #b30000 100%
                );
                border: 1px solid rgba(255, 255, 255, 0.3);
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
            ">
                <div style="display: flex; align-items: flex-start;">
                    ${minValue.toLocaleString()}
                </div>
                <div style="display: flex; align-items: center;">
                    ${medianValue.toLocaleString()}
                </div>
                <div style="display: flex; align-items: flex-end;">
                    ${maxValue.toLocaleString()}
                </div>
            </div>
        </div>
    `;
        legendItems.innerHTML = legendHTML;
    }

    // Format department name for legend (reuse from UI controls formatting)
    formatDepartmentName(value) {
        // Handle special cases first
        const specialCases = {
            'All': 'Total Visits',
            'GHI-Blairsville': 'GHI Blairsville',
            'GHI-Clayton': 'GHI Clayton',
            'GHI-Cleveland': 'GHI Cleveland',
            'GHI-Cumming': 'GHI Cumming',
            'GHI-Dahlonega': 'GHI Dahlonega',
            'GHI-Habersham': 'GHI Habersham',
            'GHI-Hamilton-Mill': 'GHI Hamilton Mill',
            'GHI-MP1-Bethlehem': 'GHI at MP1 in Bethlehem',
            'GHI-MP1-Buford': 'GHI at MP1 in Buford',
            'GHI-MP1-Jefferson': 'GHI at MP1 in Jefferson',
            'GHI-MP2-Dawsonville': 'GHI at MP2 in Dawsonville',
            'GHI-MPB-Braselton': 'GHI at MPB in Braselton',
            'GHI-Toccoa': 'GHI at Toccoa Clinic',
            'GHI-Wisteria': 'GHI at Wisteria MOB',
            'NGPG-FM-Auburn': 'NGPG FM Auburn',
            'NGPG-FM-Chestnut-Mountain': 'NGPG FM Chestnut Mountain',
            'NGPG-FM-Clayton': 'NGPG FM Clayton',
            'NGPG-FM-Community-Clinic': 'NGPG FM Community Clinic Gainesville',
            'NGPG-FM-Concierge-Medicine': 'NGPG FM Concierge Medicine Gainesville',
            'NGPG-FM-Cumming': 'NGPG FM Cumming',
            'NGPG-FM-Dacula': 'NGPG FM Dacula',
            'NGPG-FM-Dahlonega': 'NGPG FM Dahlonega',
            'NGPG-FM-Hamilton-Mill': 'NGPG FM Hamilton Mill',
            'NGPG-FM-Lavonia': 'NGPG FM Lavonia',
            'NGPG-FM-Oakwood': 'NGPG FM Oakwood',
            'NGPG-FM-West-Jackson': 'NGPG FM West Jackson in Hoschton',
            'NGPG-FM-MP1-Bethlehem': 'NGPG FM at MP1 in Bethlehem',
            'NGPG-FM-MP1-Buford': 'NGPG FM at MP1 in Buford',
            'NGPG-FM-MP1-Flowery-Branch': 'NGPG FM at MP1 in Flowery Branch',
            'NGPG-FM-MP1-Jefferson': 'NGPG FM at MP1 in Jefferson',
            'NGPG-FM-NGMC-Barrow-MOB': 'NGPG FM at NGMC Barrow MOB',
            'NGPG-FM-IM-Cleveland': 'NGPG FM/IM Cleveland',
            'NGPG-FM-IM-MP1-Braselton': 'NGPG FM/IM at MP1 in Braselton',
            'NGPG-FM-IM-MP1-Dawsonville': 'NGPG FM/IM at MP1 in Dawsonville',
            'NGPG-FM-IM-MP2-Gainesville': 'NGPG FM/IM at MP2 in Gainesville',
            'NGPG-FM-IM-Toccoa': 'NGPG FM/IM at Toccoa Clinic',
            'NGPG-IM-Demorest': 'NGPG IM Demorest',
            'NGPG-Ortho-Gainesville': 'NGPG Ortho Trauma Gainesville',
            'NGPG-Ortho-Surgery-Cleveland': 'NGPG Orthopedic Surgery Cleveland',
            'NGPG-Ortho-Surgery-Dahlonega': 'NGPG Orthopedic Surgery Dahlonega',
            'NGPG-Ortho-Surgery-Demorest': 'NGPG Orthopedic Surgery Demorest',
            'NGPG-Ortho-Surgery-Hamilton-Mill': 'NGPG Orthopedic Surgery Hamilton Mill',
            'NGPG-Ortho-Surgery-MP1-Bethlehem': 'NGPG Orthopedic Surgery at MP1 in Bethlehem',
            'NGPG-Ortho-Surgery-MP1-Buford': 'NGPG Orthopedic Surgery at MP1 in Buford',
            'NGPG-Ortho-Surgery-MP2-Dawsonville': 'NGPG Orthopedic Surgery at MP2 in Dawsonville',
            'NGPG-Ortho-Surgery-MPB-Braselton': 'NGPG Orthopedic Surgery at MPB in Braselton',
            'NGPG-Ortho-Surgery-Toccoa': 'NGPG Orthopedic Surgery at Toccoa Clinic',
            'NGPG-Ortho-Surgery-MP1-Gainesville': 'NGPG Orthopedic Surgery at MP1 in Gainesville',
            'NGPG-Surgical-Associates-Cleveland': 'NGPG Surgical Associates Cleveland',
            'NGPG-Surgical-Associates-Dawsonville': 'NGPG Surgical Associates Dawsonville',
            'NGPG-Surgical-Associates-Demorest': 'NGPG Surgical Associates Demorest',
            'NGPG-Surgical-Associates-MP1-Bethlehem': 'NGPG Surgical Associates at MP1 in Bethlehem',
            'NGPG-Surgical-Associates-MP1-Buford': 'NGPG Surgical Associates at MP1 in Buford',
            'NGPG-Surgical-Associates-MP1-Jefferson': 'NGPG Surgical Associates at MP1 in Jefferson',
            'NGPG-Surgical-Associates-MP2-Gainesville': 'NGPG Surgical Associates at MP2 in Gainesville',
            'NGPG-Surgical-Associates-MPB-Braselton': 'NGPG Surgical Associates at MPB in Braselton',
            'NGPG-Surgical-Associates-Toccoa': 'NGPG Surgical Associates at Toccoa Clinic',
            'NGPG-MP1-Thompson-Bridge': 'NGPG at MP1 Thompson Bridge',
            'Urgent-Care-Jefferson': 'Urgent Care Jefferson',
        };

        if (specialCases[value]) {
            return specialCases[value];
        }

        // Fallback: replace dashes with spaces and handle basic formatting
        return value.replace(/-/g, ' ')
            .replace(/Medical Plaza (\d+) /g, 'Medical Plaza $1 in ')
            .replace(/Medical Park (\d+) /g, 'Medical Park $1 in ');
    }

    // Add any additional map methods here as needed

} 