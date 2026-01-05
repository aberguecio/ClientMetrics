
import { SavedChart, ChartData } from '@/types/charts';
import { SalesMeeting } from '@/lib/db/schema';
import { kMeans, pca } from '@/lib/math/clustering';
import { getFieldMetadata } from './field-metadata';

export interface VectorClusterData extends ChartData {
    x: number;
    y: number;
    cluster: number;
    tooltipLabel: string;
    fieldLabel: string;
    meetingId: string;
}

/**
 * Calculates vector clustering data
 * 
 * @param meetings - Array of meetings with analysis and embedding data
 * @param chart - Chart configuration
 * @returns Array of VectorClusterData
 */
export function calculateVectorClusterData(
    meetings: Array<SalesMeeting & { analysis?: any; embedding?: string | null }>,
    chart: SavedChart
): VectorClusterData[] {
    console.log('🎯 [VECTOR CALCULATOR] Starting calculation for chart:', chart.id);
    console.log('🎯 [VECTOR CALCULATOR] k_clusters:', chart.k_clusters);
    console.log('🎯 [VECTOR CALCULATOR] label_field:', chart.label_field);

    // 1. Filter meetings with valid embeddings
    const validMeetings = meetings.filter(m => m.embedding && m.embedding.trim() !== '');
    console.log(`📊 [VECTOR CALCULATOR] Found ${validMeetings.length} meetings with embeddings`);

    if (validMeetings.length === 0) {
        return [];
    }

    // 2. Parse embeddings
    const vectors: number[][] = [];
    const meetingIndices: number[] = [];

    validMeetings.forEach((m, index) => {
        try {
            const vector = JSON.parse(m.embedding!);
            if (Array.isArray(vector) && vector.length > 0) {
                vectors.push(vector);
                meetingIndices.push(index);
            }
        } catch (e) {
            console.warn(`[VECTOR CALCULATOR] Failed to parse embedding for meeting ${m.id}`);
        }
    });

    if (vectors.length < 3) {
        console.warn('[VECTOR CALCULATOR] Not enough vectors for clustering (min 3)');
        return [];
    }

    // 3. Run PCA to reduce to 2D
    console.log('🧮 [VECTOR CALCULATOR] Running PCA...');
    const reducedVectors = pca(vectors, 2);

    // 4. Run K-Means
    const k = chart.k_clusters || 3;
    console.log(`🧮 [VECTOR CALCULATOR] Running K-Means with k=${k}...`);
    const clusters = kMeans(reducedVectors, k);

    // 5. Format data
    const result: VectorClusterData[] = [];
    const labelField = chart.label_field || 'clientName';

    // Get field metadata for human-readable label
    const metadata = getFieldMetadata(labelField);
    const fieldLabel = metadata ? metadata.label : labelField;

    reducedVectors.forEach((vec, i) => {
        const originalIndex = meetingIndices[i];
        const meeting = validMeetings[originalIndex];
        const cluster = clusters[i];

        // Get label value (tooltip)
        let labelValue = 'Unknown';
        if (labelField in meeting) {
            labelValue = String((meeting as any)[labelField]);
        } else if (meeting.analysis && labelField in meeting.analysis) {
            labelValue = String(meeting.analysis[labelField]);
        } else {
            // Try nested
            if (metadata) {
                const val = metadata.path.reduce((current: any, key: string) => current?.[key], meeting.analysis);
                if (val !== undefined) labelValue = String(val);
            }
        }

        result.push({
            label: `Cluster ${cluster + 1}`, // For legend/grouping
            value: 1, // Dummy value
            x: vec[0],
            y: vec[1],
            cluster: cluster,
            tooltipLabel: labelValue,
            fieldLabel: fieldLabel,
            meetingId: meeting.id,
            fill: getClusterColor(cluster), // Helper to assign color
        });
    });

    return result;
}

// Helper to generate consistent colors for clusters
function getClusterColor(clusterIndex: number): string {
    const colors = [
        '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe',
        '#00c49f', '#ffbb28', '#ff8042', '#a4de6c', '#d0ed57'
    ];
    return colors[clusterIndex % colors.length];
}
