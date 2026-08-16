// ML Anomaly Detection for Corruption Tracker V2
// Runs entirely in the browser - no server needed

export interface AnomalyResult {
  supplier: string;
  amount: number;
  zScore: number;
  isAnomaly: boolean;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export class MLAnomalyDetector {
  private data: number[] = [];
  private mean: number = 0;
  private stdDev: number = 0;

  // Fit the model to the data
  fit(amounts: number[]): void {
    this.data = amounts;
    
    // Calculate mean
    this.mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    
    // Calculate standard deviation
    const variance = amounts.reduce((a, b) => a + Math.pow(b - this.mean, 2), 0) / amounts.length;
    this.stdDev = Math.sqrt(variance);
  }

  // Detect anomalies using Z-score
  detect(supplier: string, amount: number): AnomalyResult {
    const zScore = this.stdDev > 0 ? Math.abs((amount - this.mean) / this.stdDev) : 0;
    
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    if (zScore > 3.0) riskLevel = 'CRITICAL';
    else if (zScore > 2.0) riskLevel = 'HIGH';
    else if (zScore > 1.0) riskLevel = 'MEDIUM';
    else riskLevel = 'LOW';

    return {
      supplier,
      amount,
      zScore,
      isAnomaly: riskLevel !== 'LOW',
      riskLevel,
    };
  }

  // Batch detect
  detectAll(transactions: Array<{ supplier: string; amount: number }>): AnomalyResult[] {
    const amounts = transactions.map(t => t.amount);
    this.fit(amounts);
    
    return transactions.map(t => this.detect(t.supplier, t.amount));
  }
}
