
/**
 * Calculates the Euclidean distance between two vectors
 */
function euclideanDistance(a: number[], b: number[]): number {
    return Math.sqrt(a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0));
}

/**
 * K-Means Clustering Algorithm
 * 
 * @param vectors - Array of vectors (must be same dimension)
 * @param k - Number of clusters
 * @param maxIterations - Maximum number of iterations
 * @returns Array of cluster indices corresponding to input vectors
 */
export function kMeans(vectors: number[][], k: number, maxIterations: number = 100): number[] {
    if (vectors.length === 0 || k <= 0) return [];
    if (k >= vectors.length) return vectors.map((_, i) => i);

    const dimension = vectors[0].length;

    // Initialize centroids randomly from existing points
    let centroids = new Array(k).fill(0).map(() => {
        const idx = Math.floor(Math.random() * vectors.length);
        return [...vectors[idx]];
    });

    let assignments = new Array(vectors.length).fill(-1);
    let iterations = 0;
    let changed = true;

    while (changed && iterations < maxIterations) {
        changed = false;
        iterations++;

        // Assign points to nearest centroid
        for (let i = 0; i < vectors.length; i++) {
            let minDist = Infinity;
            let clusterIdx = -1;

            for (let c = 0; c < k; c++) {
                const dist = euclideanDistance(vectors[i], centroids[c]);
                if (dist < minDist) {
                    minDist = dist;
                    clusterIdx = c;
                }
            }

            if (assignments[i] !== clusterIdx) {
                assignments[i] = clusterIdx;
                changed = true;
            }
        }

        // Update centroids
        const newCentroids = new Array(k).fill(0).map(() => new Array(dimension).fill(0));
        const counts = new Array(k).fill(0);

        for (let i = 0; i < vectors.length; i++) {
            const clusterIdx = assignments[i];
            if (clusterIdx === -1) continue;

            counts[clusterIdx]++;
            for (let d = 0; d < dimension; d++) {
                newCentroids[clusterIdx][d] += vectors[i][d];
            }
        }

        for (let c = 0; c < k; c++) {
            if (counts[c] > 0) {
                for (let d = 0; d < dimension; d++) {
                    centroids[c][d] = newCentroids[c][d] / counts[c];
                }
            } else {
                // Re-initialize empty cluster to a random point
                const idx = Math.floor(Math.random() * vectors.length);
                centroids[c] = [...vectors[idx]];
            }
        }
    }

    return assignments;
}

/**
 * Principal Component Analysis (PCA) for Dimensionality Reduction
 * Simplified implementation using Power Iteration method for top components
 * 
 * @param vectors - Array of vectors
 * @param targetDim - Target dimension (default 2)
 * @returns Array of reduced vectors
 */
export function pca(vectors: number[][], targetDim: number = 2): number[][] {
    if (vectors.length === 0) return [];
    const sourceDim = vectors[0].length;
    if (sourceDim <= targetDim) return vectors;

    // 1. Center the data
    const mean = new Array(sourceDim).fill(0);
    for (const v of vectors) {
        for (let i = 0; i < sourceDim; i++) mean[i] += v[i];
    }
    for (let i = 0; i < sourceDim; i++) mean[i] /= vectors.length;

    const centered = vectors.map(v => v.map((val, i) => val - mean[i]));

    // 2. Compute Covariance Matrix (simplified approach for PCA)
    // Instead of full eigen decomposition, we project onto random vectors and optimize
    // For strictly 2D visualization, we can use a simpler projection if full PCA is too heavy
    // But let's try a basic Power Iteration to find dominant eigenvectors

    const components: number[][] = [];

    // Find top 'targetDim' components
    let currentData = centered; // We subtract projected variance as we go

    for (let d = 0; d < targetDim; d++) {
        let eigenVector = new Array(sourceDim).fill(0).map(() => Math.random() - 0.5);
        // Normalize
        let len = Math.sqrt(eigenVector.reduce((s, x) => s + x * x, 0));
        eigenVector = eigenVector.map(x => x / len);

        // Power iteration
        for (let iter = 0; iter < 20; iter++) {
            const newVector = new Array(sourceDim).fill(0);

            // Multiply Covariance Matrix by Vector: C * v = (X^T * X) * v = X^T * (X * v)
            // X is (N x D), v is (D x 1)

            // 1. X * v
            const Xv = new Array(currentData.length).fill(0);
            for (let i = 0; i < currentData.length; i++) {
                for (let j = 0; j < sourceDim; j++) {
                    Xv[i] += currentData[i][j] * eigenVector[j];
                }
            }

            // 2. X^T * (Xv)
            for (let j = 0; j < sourceDim; j++) {
                for (let i = 0; i < currentData.length; i++) {
                    newVector[j] += currentData[i][j] * Xv[i];
                }
            }

            // Normalize
            len = Math.sqrt(newVector.reduce((s, x) => s + x * x, 0));
            if (len > 0) {
                eigenVector = newVector.map(x => x / len);
            }
        }

        components.push(eigenVector);

        // Deflate: remove variance of this component
        // X_new = X - X * v * v^T
        const nextData = currentData.map(row => {
            const dot = row.reduce((sum, val, idx) => sum + val * eigenVector[idx], 0);
            return row.map((val, idx) => val - dot * eigenVector[idx]);
        });
        currentData = nextData;
    }

    // Project data onto components
    return centered.map(v => {
        return components.map(comp => {
            return v.reduce((sum, val, i) => sum + val * comp[i], 0);
        });
    });
}
