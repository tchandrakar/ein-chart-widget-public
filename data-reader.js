"use strict";

class EINDataReader {
    constructor(sheetId, gid = 0) {
        this.sheetId = sheetId;
        this.gid = gid;
        // Use CSV export with CORS proxy
        this.csvUrl = `https://docs.google.com/spreadsheets/d/${this.sheetId}/export?format=csv&gid=${this.gid}`;
        this.corsProxies = [
            'https://api.allorigins.win/raw?url=',
            'https://corsproxy.io/?',
            'https://cors-anywhere.herokuapp.com/'
        ];
        this.maxSteps = 0;
        this.stepSize = 1;
        this.estimateTitleText = 'Estimate';
        this.fifthPercentileTitleText = '5th Percentile';
        this.ninetyFifthPercentileTitleText = '95th Percentile';
    }
    /**
     * Fetch data from Google Sheets using CORS proxy
     * @returns Promise<DataRow[]> Array of data rows
     */
    async fetchData() {
        // First try direct access (might work in some browsers/environments)
        try {
            const response = await fetch(this.csvUrl);
            if (response.ok) {
                const csvText = await response.text();
                return this.parseCSV(csvText);
            }
        }
        catch (error) {
            console.log('Direct access failed, trying CORS proxies...');
        }
        // Try CORS proxies
        for (const proxy of this.corsProxies) {
            try {
                console.log(`Trying proxy: ${proxy}`);
                const response = await fetch(proxy + encodeURIComponent(this.csvUrl));
                if (response.ok) {
                    const csvText = await response.text();
                    return this.parseCSV(csvText);
                }
            }
            catch (error) {
                console.log(`Proxy ${proxy} failed:`, error.message);
                continue;
            }
        }
        // If all proxies fail, try with sample data as fallback
        console.warn('All data sources failed, using sample data');
        return this.getSampleData();
    }
    /**
     * Parse CSV text into array of objects
     * @param csvText - Raw CSV text
     * @returns Parsed data
     */
    parseCSV(csvText) {
        const lines = csvText.split('\n').filter(line => line.trim());
        if (lines.length < 2) {
            throw new Error('CSV data appears to be empty or invalid');
        }
        const headers = lines[0].split(',').map(header => header.trim().replace(/"/g, ''));
        const data = [];
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line) {
                // Handle CSV parsing with quoted values
                const values = this.parseCSVLine(line);
                const row = {};
                headers.forEach((header, index) => {
                    row[header] = values[index] || '';
                });
                // Only add rows with valid date and estimate data
                if (row.Date && row.Estimate) {
                    data.push(row);
                }
            }
        }
        return data;
    }
    /**
     * Parse a single CSV line handling quoted values
     * @param line - CSV line
     * @returns Array of values
     */
    parseCSVLine(line) {
        const values = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const nextChar = line[i + 1];
            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    current += '"';
                    i++; // Skip next quote
                }
                else {
                    inQuotes = !inQuotes;
                }
            }
            else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            }
            else {
                current += char;
            }
        }
        values.push(current.trim());
        return values;
    }
    /**
     * Get sample data as fallback
     * @returns Sample data
     */
    getSampleData() {
        return [
            // 2024 data showing recent months with realistic EIN processing times
            { Date: '1/15/2024', Estimate: '45', '5th Percentile': '28', '95th Percentile': '65' },
            { Date: '2/15/2024', Estimate: '48', '5th Percentile': '32', '95th Percentile': '68' },
            { Date: '3/15/2024', Estimate: '42', '5th Percentile': '25', '95th Percentile': '62' },
            { Date: '4/15/2024', Estimate: '38', '5th Percentile': '22', '95th Percentile': '58' },
            { Date: '5/15/2024', Estimate: '35', '5th Percentile': '20', '95th Percentile': '55' },
            { Date: '6/15/2024', Estimate: '32', '5th Percentile': '18', '95th Percentile': '52' },
            { Date: '7/15/2024', Estimate: '28', '5th Percentile': '15', '95th Percentile': '48' },
            { Date: '8/15/2024', Estimate: '25', '5th Percentile': '12', '95th Percentile': '42' },
            { Date: '9/15/2024', Estimate: '22', '5th Percentile': '10', '95th Percentile': '38' },
            { Date: '10/15/2024', Estimate: '35', '5th Percentile': '20', '95th Percentile': '55' },
            { Date: '11/15/2024', Estimate: '68', '5th Percentile': '45', '95th Percentile': '85' },
            { Date: '12/15/2024', Estimate: '52', '5th Percentile': '38', '95th Percentile': '74' },
            // 2025 data (Jan - Feb)
            { Date: '1/15/2025', Estimate: '42', '5th Percentile': '28', '95th Percentile': '62' },
            { Date: '2/15/2025', Estimate: '38', '5th Percentile': '25', '95th Percentile': '58' },
            { Date: '3/15/2025', Estimate: '40', '5th Percentile': '26', '95th Percentile': '60' }
        ];
    }
    /**
     * Process data for Chart.js
     * @param rawData - Raw data from CSV
     * @returns Processed data for Chart.js
     */
    processDataForChart(rawData) {
        let minDate = new Date(0);
        const processedData = rawData
            .filter(row => row.Date && row.Estimate)
            .map(row => {
            // Parse date more robustly
            let date;
            // Handle different date formats
            date = new Date(row.Date);
            if (date >= minDate) {
                minDate = date;
            }
            return {
                date: date,
                estimate: parseFloat(row.Estimate) || 0,
                fifthPercentile: parseFloat(row['5th Percentile']) || 0,
                ninetyFifthPercentile: parseFloat(row['95th Percentile']) || 0,
            };
        });
        minDate.setMonth(minDate.getMonth() - 2);
        minDate.setDate(1);
        const dateFilteredMinProcessedData = processedData
            .filter(item => !isNaN(item.date.getTime()) && item.date >= minDate) // Filter out invalid dates
            .sort((a, b) => a.date.getTime() - b.date.getTime());
        // Create labels and data arrays
        const labels = [];
        const seenLabels = new Set();
        const estimateData = [];
        const fifthPercentileData = [];
        const ninetyFifthPercentileData = [];
        const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
            'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        // Group data by unique month-year combinations to avoid duplicates
        const uniqueData = [];
        const seenDate = new Set();
        // Process each data point to create continuous series
        dateFilteredMinProcessedData.forEach(item => {
            const date = `${item.date.getDate()}-${item.date.getMonth()}-${item.date.getFullYear()}`;
            if (!seenDate.has(date)) {
                seenDate.add(date);
                uniqueData.push(item);
            }
        });
        uniqueData.forEach((item) => {
            const currentMonth = monthNames[item.date.getMonth()];
            estimateData.push(item.estimate);
            fifthPercentileData.push(item.fifthPercentile);
            ninetyFifthPercentileData.push(item.ninetyFifthPercentile);
            this.maxSteps = Math.max(this.maxSteps, item.estimate, item.fifthPercentile, item.ninetyFifthPercentile);
            const labelCheckWithYear = `${currentMonth}-${item.date.getFullYear()}`;
            if (!seenLabels.has(labelCheckWithYear)) {
                seenLabels.add(labelCheckWithYear);
                labels.push(currentMonth);
            }
            else {
                labels.push('');
            }
        });
        this.stepSize = Math.ceil((Math.ceil(this.maxSteps) / 5) + 1);
        this.maxSteps = (Math.ceil(this.maxSteps / this.stepSize) * this.stepSize);
        const hoverConfiguration = {
            pointHoverBackgroundColor: '#BEE4F7',
            pointHoverBorderColor: '#5FB9E6',
            pointHoverBorderWidth: 1,
        };
        const chartData = {
            labels: labels,
            datasets: [
                {
                    label: this.fifthPercentileTitleText,
                    data: fifthPercentileData,
                    borderColor: 'rgba(190, 228, 247, 0.8)',
                    backgroundColor: 'rgba(237, 249, 255, 0.3)',
                    borderWidth: 1,
                    fill: false,
                    tension: 0.5,
                    pointRadius: 0,
                    pointHoverRadius: 0,
                    ...hoverConfiguration,
                    order: 3
                },
                {
                    label: this.ninetyFifthPercentileTitleText,
                    data: ninetyFifthPercentileData,
                    borderColor: 'rgba(190, 228, 247, 0.8)',
                    backgroundColor: 'rgba(237, 249, 255, 0.4)',
                    borderWidth: 1,
                    fill: '-1', // Fill to the previous dataset (5th percentile)
                    tension: 0.5,
                    pointRadius: 0,
                    pointHoverRadius: 0,
                    ...hoverConfiguration,
                    order: 2
                },
                {
                    label: this.estimateTitleText,
                    data: estimateData,
                    borderColor: '#4A90E2',
                    backgroundColor: '#008FD5',
                    borderWidth: 1.3,
                    fill: false,
                    tension: 0.5,
                    opacity: 0.75,
                    pointBackgroundColor: '#008FD5',
                    pointBorderColor: '#008FD5',
                    pointRadius: 0,
                    pointHoverRadius: 6,
                    ...hoverConfiguration,
                    order: 1
                }
            ],
            rawData: dateFilteredMinProcessedData
        };
        // Attach rawData to the chart data object for tooltip access
        chartData.rawData = uniqueData;
        return chartData;
    }
    /**
     * Initialize custom tooltip positioner for Chart.js
     */
    initializeCustomTooltipPositioner() {
        const estimateTitleText = this.estimateTitleText;
        const fifthPercentileTitleText = this.fifthPercentileTitleText;
        const ninetyFifthPercentileTitleText = this.ninetyFifthPercentileTitleText;
        const xOffset = 0;
        const yOffset = -10;
        // Check if Chart.js is available and initialize custom positioner
        if (typeof window !== 'undefined' && window.Chart) {
            const Chart = window.Chart;
            // Check if Tooltip and positioners exist before setting custom positioner
            if (Chart.Tooltip && Chart.Tooltip.positioners) {
                // Define custom positioner for EIN chart tooltip
                Chart.Tooltip.positioners.einCustomPositioner = function (elements, eventPosition) {
                    if (!elements.length) {
                        return { x: eventPosition.x + xOffset, y: eventPosition.y + yOffset };
                    }
                    // Find the Estimate dataset element
                    const estimateElement = elements.find(el => el.datasetIndex !== undefined && this.chart.data.datasets[el.datasetIndex].label === estimateTitleText);
                    // If Estimate line is visible and has data, position on it
                    if (estimateElement && estimateElement.element.x !== undefined) {
                        return {
                            x: estimateElement.element.x + xOffset,
                            y: estimateElement.element.y + yOffset
                        };
                    }
                    // If Estimate is not visible, find active percentile lines
                    const percentileElements = elements.filter((el) => {
                        if (el.datasetIndex === undefined)
                            return false;
                        const is5thPercentile = el.datasetIndex !== undefined && this.chart.data.datasets[el.datasetIndex].label === fifthPercentileTitleText;
                        const is95thPercentile = el.datasetIndex !== undefined && this.chart.data.datasets[el.datasetIndex].label === ninetyFifthPercentileTitleText;
                        return is5thPercentile || is95thPercentile;
                    });
                    if (percentileElements.length >= 2) {
                        // Position between the two percentile lines
                        const y1 = percentileElements[0].element.y;
                        const y2 = percentileElements[1].element.y;
                        const x = percentileElements[0].element.x; // Use same x position
                        return {
                            x: x + xOffset,
                            y: (y1 + y2) / 2 + yOffset // Average Y position between the lines
                        };
                    }
                    else if (percentileElements.length === 1) {
                        // Only one percentile line visible, position on it
                        return {
                            x: percentileElements[0].element.x + xOffset,
                            y: percentileElements[0].element.y + yOffset
                        };
                    }
                    // Fallback to default positioning
                    const x = elements.reduce((sum, el) => sum + el.element.x, 0) / elements.length;
                    const y = elements.reduce((sum, el) => sum + el.element.y, 0) / elements.length;
                    return { x: x + xOffset, y: y + yOffset };
                };
            }
        }
    }
    /**
     * Get chart options
     * @returns Chart.js options
     */
    getChartOptions() {
        // Initialize custom positioner
        this.initializeCustomTooltipPositioner();
        const estimateTitleText = this.estimateTitleText;
        const fifthPercentileTitleText = this.fifthPercentileTitleText;
        const ninetyFifthPercentileTitleText = this.ninetyFifthPercentileTitleText;
        const maxSteps = this.maxSteps; // Store for use in callback
        const stepSize = this.stepSize;
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#666666',
                        font: {
                            size: 12,
                            family: 'Arial, sans-serif'
                        },
                        filter: function (item) {
                            // Show all lines in legend in the correct order
                            return [estimateTitleText, fifthPercentileTitleText, ninetyFifthPercentileTitleText].includes(item.text);
                        },
                        usePointStyle: true,
                        padding: 20
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    position: 'einCustomPositioner', // Use our custom positioner
                    backgroundColor: 'rgba(255, 255, 255, 1.0)',
                    titleColor: '#000000',
                    bodyColor: '#000000',
                    borderColor: 'rgba(211, 210, 210, 0.8)',
                    borderWidth: 1,
                    displayColors: true,
                    xAlign: 'center',
                    yAlign: 'bottom',
                    padding: 12,
                    font: {
                        size: 12,
                        family: 'Graphik'
                    },
                    titleMarginBottom: 2,
                    callbacks: {
                        title: function (context) {
                            if (context.length > 0) {
                                // Get the raw data from the chart instance
                                const chart = context[0].chart;
                                const dataIndex = context[0].dataIndex;
                                // Handle null chart gracefully
                                if (!chart || !chart.data) {
                                    return 'EIN Processing Time';
                                }
                                const rawData = chart.data.rawData;
                                if (rawData && rawData[dataIndex]) {
                                    const date = rawData[dataIndex].date;
                                    const options = {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    };
                                    return date.toLocaleDateString('en-US', options);
                                }
                            }
                            return 'EIN Processing Time';
                        },
                        label: function (context) {
                            // Don't show individual dataset labels since we'll show summary
                            return undefined;
                        },
                        afterBody: function (context) {
                            if (context.length > 0) {
                                const chart = context[0].chart;
                                const dataIndex = context[0].dataIndex;
                                // Handle null chart gracefully
                                if (!chart || !chart.data) {
                                    return [];
                                }
                                const rawData = chart.data.rawData;
                                if (rawData && rawData[dataIndex]) {
                                    const data = rawData[dataIndex];
                                    const estimate = Math.round(data.estimate);
                                    const range = `${Math.round(data.fifthPercentile)}-${Math.round(data.ninetyFifthPercentile)}`;
                                    return [
                                        `Most people receive their EIN in ${range}`,
                                        `days, with the average being ${estimate} days.`
                                    ];
                                }
                                return ['Range shows typical processing time variation']; // TODO: Default, can be removed
                            }
                            return [];
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#666666',
                        font: {
                            size: 12,
                            family: 'Roboto Mono',
                            padding: 2,
                        },
                        maxRotation: 0,
                        minRotation: 0,
                        autoSkip: false,
                        callback: function (value) {
                            const label = this.getLabelForValue(value);
                            return label || '';
                        }
                    }
                },
                y: {
                    display: true,
                    beginAtZero: true,
                    max: maxSteps,
                    grid: {
                        display: false,
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                        color: '#999999',
                        font: {
                            size: 12,
                            family: 'Roboto Mono',
                            padding: 4,
                        },
                        stepSize: stepSize,
                        callback: function (value) {
                            // Show "Days" instead of maxSteps for the last tick
                            if (value >= maxSteps) {
                                return 'Days';
                            }
                            // Handle null/undefined values gracefully
                            if (value === null || value === undefined) {
                                return String(value);
                            }
                            return value.toString();
                        }
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            },
            elements: {
                point: {
                    radius: 0,
                    hoverRadius: 6
                },
                line: {
                    tension: 0.0
                }
            }
        };
    }
}
// Export for use in other files (browser-compatible)
if (typeof window !== 'undefined') {
    window.EINDataReader = EINDataReader;
}
// Export for ES6 modules (TypeScript/Jest)

//# sourceMappingURL=data-reader.js.map