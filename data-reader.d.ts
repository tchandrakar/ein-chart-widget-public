interface DataRow {
    Date: string;
    Estimate: string;
    '5th Percentile': string;
    '95th Percentile': string;
    [key: string]: string;
}
interface ProcessedDataItem {
    date: Date;
    estimate: number;
    fifthPercentile: number;
    ninetyFifthPercentile: number;
}
interface ChartDataset {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    borderWidth: number;
    fill: boolean | string;
    tension: number;
    pointRadius: number;
    pointHoverRadius: number;
    pointHoverBackgroundColor?: string;
    pointHoverBorderColor?: string;
    pointHoverBorderWidth?: number;
    pointBackgroundColor?: string;
    pointBorderColor?: string;
    order: number;
}
interface ChartData {
    labels: string[];
    datasets: ChartDataset[];
    rawData: ProcessedDataItem[];
}
interface ChartOptions {
    responsive: boolean;
    maintainAspectRatio: boolean;
    plugins: any;
    scales: any;
    interaction: any;
    elements: any;
    [key: string]: any;
}
declare class EINDataReader {
    private sheetId;
    private gid;
    private csvUrl;
    private corsProxies;
    private maxSteps;
    private stepSize;
    private estimateTitleText;
    private fifthPercentileTitleText;
    private ninetyFifthPercentileTitleText;
    constructor(sheetId: string, gid?: number);
    /**
     * Fetch data from Google Sheets using CORS proxy
     * @returns Promise<DataRow[]> Array of data rows
     */
    fetchData(): Promise<DataRow[]>;
    /**
     * Parse CSV text into array of objects
     * @param csvText - Raw CSV text
     * @returns Parsed data
     */
    private parseCSV;
    /**
     * Parse a single CSV line handling quoted values
     * @param line - CSV line
     * @returns Array of values
     */
    private parseCSVLine;
    /**
     * Get sample data as fallback
     * @returns Sample data
     */
    private getSampleData;
    /**
     * Process data for Chart.js
     * @param rawData - Raw data from CSV
     * @returns Processed data for Chart.js
     */
    processDataForChart(rawData: DataRow[]): ChartData;
    /**
     * Initialize custom tooltip positioner for Chart.js
     */
    private initializeCustomTooltipPositioner;
    /**
     * Get chart options
     * @returns Chart.js options
     */
    getChartOptions(): ChartOptions;
}
export default EINDataReader;
//# sourceMappingURL=data-reader.d.ts.map