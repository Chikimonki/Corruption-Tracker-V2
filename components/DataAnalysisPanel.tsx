import React, { useState } from 'react';
import { MLAnomalyDetector, AnomalyResult } from '../services/mlAnomaly';
import { AlertCircle, CheckCircle2, Download } from 'lucide-react';

export const DataAnalysisPanel: React.FC = () => {
  const [results, setResults] = useState<AnomalyResult[]>([]);
  const [analysed, setAnalysed] = useState(false);

  // Sample Sefton Council data (first 20 rows)
  const sampleData = [
    { supplier: 'Abbegale Lodge (2006) Li', amount: 34378.82 },
    { supplier: 'Accomodating Care', amount: 30290.81 },
    { supplier: 'Anchor Trust', amount: 27687.80 },
    { supplier: 'Supplier Name Redacted', amount: 27524.00 },
    { supplier: 'Supplier Name Redacted', amount: 26700.00 },
    { supplier: 'Avalon Resid\'L Homes Ltd', amount: 26042.48 },
    { supplier: 'Locharwoods N H', amount: 25882.17 },
    { supplier: 'Laburnum House (Shaw) Ltd', amount: 22803.86 },
  ];

  const runAnalysis = () => {
    const detector = new MLAnomalyDetector();
    const results = detector.detectAll(sampleData);
    setResults(results);
    setAnalysed(true);
  };

  const exportResults = () => {
    const csv = [
      'Supplier,Amount,Z-Score,Risk Level',
      ...results.map(r => `${r.supplier},${r.amount},${r.zScore.toFixed(2)},${r.riskLevel}`),
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'anomaly_report.csv';
    a.click();
  };

  return (
    <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
      <h3 className="text-sm font-semibold mb-3">📊 ML Anomaly Detection</h3>
      
      <button
        onClick={runAnalysis}
        className="px-3 py-1.5 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
      >
        Run ML Analysis
      </button>

      {analysed && (
        <>
          <div className="mt-3 space-y-2">
            {results.map((r, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                {r.isAnomaly ? (
                  <AlertCircle className="w-3 h-3 text-red-400" />
                ) : (
                  <CheckCircle2 className="w-3 h-3 text-green-400" />
                )}
                <span className="flex-1">{r.supplier}</span>
                <span className="text-gray-400">£{r.amount.toFixed(2)}</span>
                <span className={`font-semibold ${
                  r.riskLevel === 'CRITICAL' ? 'text-red-400' :
                  r.riskLevel === 'HIGH' ? 'text-orange-400' :
                  r.riskLevel === 'MEDIUM' ? 'text-yellow-400' :
                  'text-green-400'
                }`}>
                  {r.riskLevel}
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={exportResults}
            className="mt-3 px-3 py-1.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors flex items-center gap-1"
          >
            <Download className="w-3 h-3" />
            Export CSV
          </button>
        </>
      )}
    </div>
  );
};
