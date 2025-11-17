import { useState, useEffect } from 'react';
import '../../css/SalesChart.css';

const API_URL = 'http://localhost:5000/api/admin';

function SalesChart() {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [chartType, setChartType] = useState('line'); // 'line' or 'bar'
  const [groupBy, setGroupBy] = useState('daily'); // 'daily', 'weekly', 'monthly'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Set default date range (last 30 days)
  useEffect(() => {
    const end = new Date();
    const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    setEndDate(end.toISOString().split('T')[0]);
    setStartDate(start.toISOString().split('T')[0]);
  }, []);

  // Fetch sales data whenever filters change
  useEffect(() => {
    if (startDate && endDate) {
      fetchSalesData();
    }
  }, [startDate, endDate, groupBy]);

  const fetchSalesData = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      
      const params = new URLSearchParams({
        startDate,
        endDate,
        groupBy
      });

      const response = await fetch(`${API_URL}/sales-chart?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setChartData(data.data);
      } else {
        setError(data.message || 'Failed to fetch sales data');
      }
    } catch (err) {
      setError(err.message || 'Error fetching sales data');
    } finally {
      setLoading(false);
    }
  };

  const renderChart = () => {
    if (!chartData || !chartData.dailySales || chartData.dailySales.length === 0) {
      return <div className="no-data">No sales data available for the selected period</div>;
    }

    const maxSales = Math.max(...chartData.dailySales.map(d => d.totalSales));
    const chartHeight = 300;
    const barWidth = Math.max(20, 400 / chartData.dailySales.length);

    if (chartType === 'bar') {
      return (
        <div className="chart-container">
          <svg viewBox={`0 0 ${barWidth * chartData.dailySales.length + 100} ${chartHeight + 100}`} className="bar-chart">
            {/* Y-axis */}
            <line x1="50" y1="20" x2="50" y2={chartHeight + 20} stroke="#ccc" strokeWidth="2" />
            {/* X-axis */}
            <line x1="50" y1={chartHeight + 20} x2={barWidth * chartData.dailySales.length + 50} y2={chartHeight + 20} stroke="#ccc" strokeWidth="2" />

            {/* Y-axis labels */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => (
              <g key={`y-label-${idx}`}>
                <line x1="45" y1={chartHeight + 20 - chartHeight * ratio} x2="50" y2={chartHeight + 20 - chartHeight * ratio} stroke="#ccc" strokeWidth="1" />
                <text x="35" y={chartHeight + 25 - chartHeight * ratio} textAnchor="end" fontSize="12" fill="#666">
                  ₱{Math.round(maxSales * ratio).toLocaleString()}
                </text>
              </g>
            ))}

            {/* Bars */}
            {chartData.dailySales.map((item, idx) => {
              const barHeight = (item.totalSales / maxSales) * chartHeight;
              const x = 60 + idx * barWidth;
              const y = chartHeight + 20 - barHeight;

              return (
                <g key={`bar-${idx}`}>
                  <rect
                    x={x}
                    y={y}
                    width={barWidth - 10}
                    height={barHeight}
                    fill="#3b82f6"
                    className="bar"
                  />
                  <text
                    x={x + (barWidth - 10) / 2}
                    y={chartHeight + 50}
                    textAnchor="middle"
                    fontSize="11"
                    fill="#666"
                    transform={`rotate(45 ${x + (barWidth - 10) / 2} ${chartHeight + 50})`}
                  >
                    {item._id}
                  </text>
                  <title>{`${item._id}: ₱${item.totalSales.toLocaleString()}`}</title>
                </g>
              );
            })}
          </svg>
        </div>
      );
    } else {
      // Line chart
      const points = chartData.dailySales.map((item, idx) => {
        const x = 50 + (idx / (chartData.dailySales.length - 1 || 1)) * 400;
        const y = chartHeight + 20 - (item.totalSales / maxSales) * chartHeight;
        return { x, y, data: item };
      });

      const pathData = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

      return (
        <div className="chart-container">
          <svg viewBox="0 0 550 400" className="line-chart">
            {/* Y-axis */}
            <line x1="50" y1="20" x2="50" y2="320" stroke="#ccc" strokeWidth="2" />
            {/* X-axis */}
            <line x1="50" y1="320" x2="480" y2="320" stroke="#ccc" strokeWidth="2" />

            {/* Y-axis labels */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => (
              <g key={`y-label-${idx}`}>
                <line x1="45" y1={320 - 300 * ratio} x2="50" y2={320 - 300 * ratio} stroke="#ccc" strokeWidth="1" />
                <text x="35" y={325 - 300 * ratio} textAnchor="end" fontSize="12" fill="#666">
                  ₱{Math.round(maxSales * ratio).toLocaleString()}
                </text>
              </g>
            ))}

            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => (
              <line
                key={`grid-${idx}`}
                x1="50"
                y1={320 - 300 * ratio}
                x2="480"
                y2={320 - 300 * ratio}
                stroke="#f0f0f0"
                strokeWidth="1"
              />
            ))}

            {/* Line */}
            <path d={pathData} stroke="#3b82f6" strokeWidth="2" fill="none" />

            {/* Points */}
            {points.map((p, idx) => (
              <g key={`point-${idx}`}>
                <circle cx={p.x} cy={p.y} r="4" fill="#3b82f6" className="data-point" />
                <text
                  x={p.x}
                  y="340"
                  textAnchor="middle"
                  fontSize="11"
                  fill="#666"
                  transform={`rotate(45 ${p.x} 340)`}
                >
                  {p.data._id}
                </text>
                <title>{`${p.data._id}: ₱${p.data.totalSales.toLocaleString()}`}</title>
              </g>
            ))}
          </svg>
        </div>
      );
    }
  };

  const totalSales = chartData?.dailySales?.reduce((sum, item) => sum + item.totalSales, 0) || 0;
  const totalOrders = chartData?.dailySales?.reduce((sum, item) => sum + item.totalOrders, 0) || 0;
  const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

  return (
    <div className="sales-chart-container">
      <h2>Sales Analytics</h2>

      {/* Filters */}
      <div className="chart-filters">
        <div className="filter-group">
          <label>Start Date:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="date-input"
          />
        </div>

        <div className="filter-group">
          <label>End Date:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="date-input"
          />
        </div>

        <div className="filter-group">
          <label>Group By:</label>
          <select value={groupBy} onChange={(e) => setGroupBy(e.target.value)} className="select-input">
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Chart Type:</label>
          <select value={chartType} onChange={(e) => setChartType(e.target.value)} className="select-input">
            <option value="line">Line Chart</option>
            <option value="bar">Bar Chart</option>
          </select>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="stats-summary">
        <div className="stat-card">
          <h4>Total Sales</h4>
          <p className="stat-value">₱{totalSales.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
        </div>
        <div className="stat-card">
          <h4>Total Orders</h4>
          <p className="stat-value">{totalOrders}</p>
        </div>
        <div className="stat-card">
          <h4>Average Order Value</h4>
          <p className="stat-value">₱{avgOrderValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
        </div>
      </div>

      {/* Main Chart */}
      {loading && <div className="loading">Loading chart data...</div>}
      {error && <div className="error-message">{error}</div>}
      {!loading && !error && renderChart()}

      {/* Product Sales Table */}
      {chartData?.productSales && chartData.productSales.length > 0 && (
        <div className="product-sales-section">
          <h3>Top 10 Products by Revenue</h3>
          <table className="products-table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Quantity Sold</th>
                <th>Total Revenue</th>
              </tr>
            </thead>
            <tbody>
              {chartData.productSales.map((product, idx) => (
                <tr key={idx}>
                  <td>{product.productName}</td>
                  <td>{product.totalQuantity}</td>
                  <td>₱{product.totalRevenue.toLocaleString('en-US', { maximumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Revenue by Status */}
      {chartData?.revenueByStatus && chartData.revenueByStatus.length > 0 && (
        <div className="revenue-status-section">
          <h3>Revenue by Order Status</h3>
          <div className="status-cards">
            {chartData.revenueByStatus.map((status, idx) => (
              <div key={idx} className="status-card">
                <h4>{status._id.charAt(0).toUpperCase() + status._id.slice(1)}</h4>
                <p>Orders: {status.count}</p>
                <p>Revenue: ₱{status.revenue.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default SalesChart;
