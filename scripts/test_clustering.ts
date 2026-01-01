
import { calculateVectorClusterData } from '../src/lib/charts/vector-calculator';
import { kMeans, pca } from '../src/lib/math/clustering';

// Mock data
const mockMeetings = [
    { id: '1', clientName: 'Client A', embedding: JSON.stringify([1, 1, 1]), analysis: { sector: 'Tech' } },
    { id: '2', clientName: 'Client B', embedding: JSON.stringify([1, 1.1, 0.9]), analysis: { sector: 'Tech' } },
    { id: '3', clientName: 'Client C', embedding: JSON.stringify([5, 5, 5]), analysis: { sector: 'Finance' } },
    { id: '4', clientName: 'Client D', embedding: JSON.stringify([5.1, 4.9, 5]), analysis: { sector: 'Finance' } },
    { id: '5', clientName: 'Client E', embedding: JSON.stringify([10, 10, 10]), analysis: { sector: 'Health' } },
];

const mockChart = {
    id: 'test-chart',
    name: 'Test Cluster',
    chart_type: 'vector_cluster',
    x_axis: 'embedding',
    y_axis: 'count',
    group_by: '',
    k_clusters: 3,
    label_field: 'clientName',
    aggregation: 'count',
    created_at: new Date(),
    updated_at: new Date(),
};

async function runTests() {
    console.log('🧪 Running Clustering Tests...');

    // 1. Test Math Utilities
    console.log('\n1. Testing Math Utilities (PCA & K-Means)');
    const vectors = [
        [1, 1, 1], [1, 1.1, 0.9], // Cluster 1
        [5, 5, 5], [5.1, 4.9, 5], // Cluster 2
        [10, 10, 10]              // Cluster 3
    ];

    const reduced = pca(vectors, 2);
    console.log('PCA Reduced (first 2):', reduced.slice(0, 2));
    if (reduced[0].length === 2) console.log('✅ PCA output dimension is 2');
    else console.error('❌ PCA output dimension is incorrect');

    const clusters = kMeans(vectors, 3);
    console.log('K-Means Clusters:', clusters);
    // Expect 0,0, 1,1, 2 (or permutation)
    if (clusters[0] === clusters[1] && clusters[2] === clusters[3] && clusters[0] !== clusters[2]) {
        console.log('✅ K-Means correctly grouped similar vectors');
    } else {
        console.warn('⚠️ K-Means grouping might be unstable or incorrect (check logs)');
    }

    // 2. Test Vector Calculator
    console.log('\n2. Testing Vector Calculator');
    // @ts-ignore
    const result = calculateVectorClusterData(mockMeetings, mockChart);
    console.log(`Generated ${result.length} data points`);

    if (result.length === 5) console.log('✅ Correct number of data points');
    else console.error('❌ Incorrect number of data points');

    const sample = result[0];
    console.log('Sample Data Point:', JSON.stringify(sample, null, 2));

    if (sample.x !== undefined && sample.y !== undefined && sample.cluster !== undefined && sample.tooltipLabel) {
        console.log('✅ Data point structure is correct');
    } else {
        console.error('❌ Data point structure is missing fields');
    }

    // Check labels
    if (result.some(r => r.tooltipLabel === 'Client A')) {
        console.log('✅ Tooltip labels are correct');
    } else {
        console.error('❌ Tooltip labels are incorrect');
    }
}

runTests().catch(console.error);
