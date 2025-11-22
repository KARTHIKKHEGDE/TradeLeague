import { useEffect, useRef } from 'react';
import { createChart, IChartApi, ISeriesApi, Time } from 'lightweight-charts';
import { Tick } from '../../stores/tradeStore';

interface Candle {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface LightweightChartProps {
  symbol: string;
  ticks: Tick[];
  timeframe: string;
}

export default function LightweightChart({ symbol, ticks, timeframe }: LightweightChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);

  // Initialize chart
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 400,
      layout: {
        background: { color: '#1a1a1a' },
        textColor: '#d1d5db',
      },
      grid: {
        vertLines: { color: '#2B2B43' },
        horzLines: { color: '#2B2B43' },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;

    const handleResize = () => {
      if (containerRef.current && chart) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  // Update chart data when ticks or timeframe change
  useEffect(() => {
    if (!candleSeriesRef.current || ticks.length === 0) return;

    const candles = aggregateTicksToCandles(ticks, timeframe);
    candleSeriesRef.current.setData(candles);

    // Fit content on first load or timeframe change
    // chartRef.current?.timeScale().fitContent(); 
  }, [ticks, timeframe]);

  return (
    <div
      ref={containerRef}
      className="w-full border border-gray-700 rounded bg-gray-900"
      style={{ height: '400px' }}
    />
  );
}

// Helper to aggregate ticks into candles based on timeframe
// This function floors timestamps to round figures (e.g., 08:05:00, 08:10:00)
// ensuring compatibility with historical candle data
function aggregateTicksToCandles(ticks: Tick[], timeframe: string): Candle[] {
  if (ticks.length === 0) return [];

  const timeframeSeconds = getTimeframeSeconds(timeframe);
  const candlesMap = new Map<number, Candle>();

  ticks.forEach((tick) => {
    // Floor timestamp to the nearest timeframe interval (round figure)
    // Example: If tick arrives at 08:05:37 with 1m timeframe (60s)
    // bucketStart = floor(08:05:37 / 60) * 60 = 08:05:00
    const timestamp = tick.time;
    const bucketStart = Math.floor(timestamp / timeframeSeconds) * timeframeSeconds;

    let candle = candlesMap.get(bucketStart);

    if (!candle) {
      // First tick in this time bucket - initialize the candle
      candle = {
        time: bucketStart as Time,
        open: tick.price,
        high: tick.price,
        low: tick.price,
        close: tick.price,
      };
      candlesMap.set(bucketStart, candle);
    } else {
      // Subsequent ticks - update high, low, close
      // Open price remains the first tick's price
      candle.high = Math.max(candle.high, tick.price);
      candle.low = Math.min(candle.low, tick.price);
      candle.close = tick.price;
    }
  });

  // Return sorted candles by time
  return Array.from(candlesMap.values()).sort((a, b) => (a.time as number) - (b.time as number));
}

function getTimeframeSeconds(timeframe: string): number {
  switch (timeframe) {
    case '1m': return 60;
    case '3m': return 180;
    case '5m': return 300;
    case '15m': return 900;
    case '30m': return 1800;
    case '1h': return 3600;
    default: return 60;
  }
}