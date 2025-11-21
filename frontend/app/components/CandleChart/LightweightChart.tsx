import { useEffect, useRef } from 'react';
import { createChart, IChartApi, ISeriesApi } from 'lightweight-charts';

interface Candle {
  time: string;  // ✅ FIXED - must be string
  open: number;
  high: number;
  low: number;
  close: number;
}

interface LightweightChartProps {
  symbol: string;
  ticks: number[]; // Array of prices (latest price at end)
}

export default function LightweightChart({ symbol, ticks }: LightweightChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const candlesRef = useRef<Map<string, Candle>>(new Map());  // ✅ Key is now string

  useEffect(() => {
    if (!containerRef.current) return;

    // Create chart
    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 400,
      layout: {
        background: { color: '#1a1a1a' },
        textColor: '#d1d5db',
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

    // Handle window resize
    const handleResize = () => {
      if (containerRef.current && chart) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);
    chart.timeScale().fitContent();

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  // Update chart with new ticks
  useEffect(() => {
    if (!candleSeriesRef.current || ticks.length === 0) return;

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const candleTimeStr = `${year}-${month}-${day}`; // Format: yyyy-mm-dd
    const lastPrice = ticks[ticks.length - 1];

    let candle = candlesRef.current.get(candleTimeStr);  // Use date string as key

    if (!candle) {
      candle = {
        time: candleTimeStr,  // lightweight-charts expects yyyy-mm-dd format
        open: lastPrice,
        high: lastPrice,
        low: lastPrice,
        close: lastPrice,
      };
      candlesRef.current.set(candleTimeStr, candle);
    } else {
      candle.high = Math.max(candle.high, lastPrice);
      candle.low = Math.min(candle.low, lastPrice);
      candle.close = lastPrice;
    }

    const candlesArray = Array.from(candlesRef.current.values());
    candleSeriesRef.current.setData(candlesArray);
    chartRef.current?.timeScale().fitContent();
  }, [ticks]);

  return (
    <div
      ref={containerRef}
      className="w-full border border-gray-700 rounded bg-gray-900"
      style={{ height: '400px' }}
    />
  );
}