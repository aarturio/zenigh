import { useState } from 'react'
import './App.css'

function App() {
  const [marketData, setMarketData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchMarketData = async (symbol = 'AAPL') => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`http://localhost:3000/market/data/${symbol}`)
      if (!response.ok) {
        throw new Error('Failed to fetch data')
      }
      const data = await response.json()
      setMarketData(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="App">
      <h1>Zenigh - Stock Market Analysis</h1>
      
      <div className="controls">
        <button onClick={() => fetchMarketData('AAPL')} disabled={loading}>
          {loading ? 'Loading...' : 'Get AAPL Data'}
        </button>
        <button onClick={() => fetchMarketData('NVDA')} disabled={loading}>
          {loading ? 'Loading...' : 'Get NVDA Data'}
        </button>
      </div>

      {error && (
        <div className="error">
          Error: {error}
        </div>
      )}

      {marketData && (
        <div className="data-display">
          <h2>Market Data for {marketData.symbol}</h2>
          <p>Records found: {marketData.count}</p>
          
          {marketData.data && marketData.data.length > 0 && (
            <div className="latest-record">
              <h3>Latest Record:</h3>
              <pre>{JSON.stringify(marketData.data[0], null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default App
