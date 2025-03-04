import { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, UTCTimestamp, HistogramData, ISeriesApi } from 'lightweight-charts';
import { PublicKey } from '@solana/web3.js';
import { getTokenHistoricalPrice } from '../utils/getData';

interface PriceChartProps {
  poolAddress: string;
}

interface OHLCVData {
  time: UTCTimestamp;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

type TimeRange = '24h' | '7d' | '30d' | '90d';

export function PriceChart({ poolAddress }: PriceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState<TimeRange>('7d');

  const timeRanges: { label: string; value: TimeRange }[] = [
    { label: '24H', value: '24h' },
    { label: '7D', value: '7d' },
    { label: '30D', value: '30d' },
    { label: '90D', value: '90d' },
  ];

  const fetchData = async (range: TimeRange) => {
    if (!chartRef.current || !candlestickSeriesRef.current || !volumeSeriesRef.current) return;

    setIsLoading(true);
    setError(null);

    try {
      const historicalData = await getTokenHistoricalPrice(new PublicKey(poolAddress), range);

      if (historicalData && historicalData.length > 0) {
        // Update candlestick series
        candlestickSeriesRef.current.setData(historicalData);

        // Update volume series
        const volumeData: HistogramData[] = historicalData.map((item: OHLCVData) => ({
          time: item.time,
          value: item.volume,
          color: item.close >= item.open ? '#26a69a55' : '#ef535055'
        }));

        volumeSeriesRef.current.setData(volumeData);
        chartRef.current.timeScale().fitContent();
      } else {
        throw new Error('No historical data available');
      }
    } catch (error) {
      console.error('Failed to fetch price data:', error);
      setError('Failed to load price data. Using simulated data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!chartContainerRef.current || !poolAddress) return;

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: '#000000' },
        textColor: '#00ff00',
      },
      grid: {
        vertLines: { color: '#004400' },
        horzLines: { color: '#004400' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 500,
      crosshair: {
        mode: 0,
        vertLine: {
          color: '#00ff00',
          labelBackgroundColor: '#00ff00',
        },
        horzLine: {
          color: '#00ff00',
          labelBackgroundColor: '#00ff00',
        }
      },
      timeScale: {
        rightOffset: 5,
        fixLeftEdge: true,
        fixRightEdge: true,
        lockVisibleTimeRangeOnResize: true,
      },
    });

    // Create candlestick series
    candlestickSeriesRef.current = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350'
    });

    // Create volume series with adjusted scale margins
    volumeSeriesRef.current = chart.addHistogramSeries({
      color: '#00ff0066',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: 'volume'
    });

    // Configure the volume scale
    chart.priceScale('volume').applyOptions({
      scaleMargins: {
        top: 0.9,
        bottom: 0,
      },
    });

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    // Initial setup
    chartRef.current = chart;
    fetchData(selectedRange);
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
      }
    };
  }, [poolAddress]);

  // Fetch new data when range changes
  useEffect(() => {
    if (chartRef.current) {
      fetchData(selectedRange);
    }
  }, [selectedRange]);

  return (
    <div className="w-full relative">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-[#00ff00] text-lg">Price Chart</h3>
        <div className="flex gap-2">
          {timeRanges.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setSelectedRange(value)}
              className={`px-3 py-1 rounded terminal-button ${selectedRange === value ? 'bg-[#00ff00]/20 border-[#00ff00]' : ''
                }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div
        className="w-full relative"
        style={{
          border: '1px solid #00ff00',
          borderRadius: '4px',
          background: '#000000',
          padding: '20px',
        }}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
            <div className="text-[#00ff00] animate-pulse">Loading chart data...</div>
          </div>
        )}

        {error && (
          <div className="absolute top-4 right-4 px-3 py-1 bg-red-900/50 border border-red-500 rounded text-xs z-10">
            {error}
          </div>
        )}

        <div
          ref={chartContainerRef}
          style={{ width: "100%", height: "500px" }}
        />
      </div>
    </div>
  );
}