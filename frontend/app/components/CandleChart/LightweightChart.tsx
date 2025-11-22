import { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, Time } from 'lightweight-charts';
import { Tick } from '../../stores/tradeStore';
import { api } from '../../services/api';

interface Candle {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

interface LightweightChartProps {
  symbol: string;
  ticks: Tick[];
  timeframe: string;
}

export default function LightweightChart({ symbol, ticks, timeframe, addMA }: LightweightChartProps & { addMA?: boolean }) {
  // MA indicator active state
  const [maActive, setMaActive] = useState(!!addMA);
  // Sync maActive with addMA prop
  useEffect(() => {
    setMaActive(!!addMA);
  }, [addMA]);
  // MA indicator state
  const [maPeriod, setMaPeriod] = useState(14); // Default Exness period
  const maSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);

  const [historicalCandles, setHistoricalCandles] = useState<Candle[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);

  const fetchHistoricalCandles = async () => {
    try {
      console.log(`Fetching 100 ${timeframe} candles for ${symbol}...`);
      const response = await api.get(`/api/candles/${symbol}?interval=${timeframe}&limit=100`);
      setHistoricalCandles(response.data);
      console.log(`Loaded ${response.data.length} historical candles`);
    } catch (error) {
      console.error('Error fetching historical candles:', error);
    }
  };

  const loadMoreHistoricalCandles = async () => {
    if (isLoadingMore || !hasMoreData || historicalCandles.length === 0) return;

    setIsLoadingMore(true);
    try {
      const oldestCandle = historicalCandles[0];
      const oldestTime = oldestCandle.time as number;

      const response = await api.get(`/api/candles/${symbol}?interval=${timeframe}&limit=100`);
      const newCandles = response.data.filter((c: Candle) => (c.time as number) < oldestTime);

      if (newCandles.length === 0) {
        setHasMoreData(false);
      } else {
        setHistoricalCandles(prev => [...newCandles, ...prev]);
      }
    } catch (error) {
      console.error('Error loading more candles:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 500,
      layout: { background: { color: '#111827' }, textColor: '#9ca3af' },
      grid: { vertLines: { color: '#1f2937' }, horzLines: { color: '#1f2937' } },
      timeScale: { timeVisible: true, secondsVisible: false },
      rightPriceScale: { autoScale: true, scaleMargins: { top: 0.15, bottom: 0.15 } },
      crosshair: { mode: 0 },
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    const volumeSeries = chart.addHistogramSeries({
      color: '#26a69a',
      priceFormat: { type: 'volume' },
      priceScaleId: '',
    });

    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.7, bottom: 0 },
    });

    // MA indicator line (only if active)
    let maSeries: ISeriesApi<'Line'> | null = null;
    if (maActive) {
      maSeries = chart.addLineSeries({
        color: '#2979FF',
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
        title: `MA (${maPeriod})`,
      });
      maSeriesRef.current = maSeries;
    } else {
      maSeriesRef.current = null;
    }

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    const handleResize = () => {
      if (containerRef.current && chart) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };

    chart.timeScale().subscribeVisibleLogicalRangeChange((logicalRange) => {
      if (!logicalRange) return;
      if (logicalRange.from < 10 && hasMoreData && !isLoadingMore) {
        loadMoreHistoricalCandles();
      }
    });

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [maPeriod, maActive]);

  useEffect(() => {
    setHistoricalCandles([]);
    setHasMoreData(true);
    fetchHistoricalCandles();
  }, [symbol, timeframe]);

  useEffect(() => {
    if (!candleSeriesRef.current || !volumeSeriesRef.current) return;

    const liveCandles = aggregateTicksToCandles(ticks as Tick[], timeframe);
    const allCandles = mergeCandles(historicalCandles, liveCandles);

    candleSeriesRef.current.setData(allCandles);

    const volumeData = allCandles.map((candle) => ({
      time: candle.time,
      value: candle.volume || 0,
      color: candle.close >= candle.open ? '#26a69a80' : '#ef535080',
    }));

    volumeSeriesRef.current.setData(volumeData);

    // MA calculation and rendering (only if active)
    if (maActive && maSeriesRef.current) {
      const maData = calculateMA(allCandles, maPeriod);
      maSeriesRef.current.setData(maData);
    }
  }, [ticks, timeframe, historicalCandles, maPeriod, maActive]);
// Exness-style MA calculation
function calculateMA(candles: Candle[], period: number): { time: Time; value: number }[] {
  if (!candles || candles.length < period) return [];
  const result: { time: Time; value: number }[] = [];
  for (let i = period - 1; i < candles.length; i++) {
    const slice = candles.slice(i - period + 1, i + 1);
    const sum = slice.reduce((acc, c) => acc + c.close, 0);
    result.push({ time: candles[i].time, value: +(sum / period).toFixed(4) });
  }
  return result;
}

  // Chart container rendering
  return (
    <div style={{ position: 'relative', width: '100%', height: '500px' }}>
      <div ref={containerRef} style={{ width: '100%', height: '500px' }} />
      {/* MA indicator top-corner display and remove button only if active */}
      {maActive && (
        <div style={{ position: 'absolute', top: 12, left: 16, zIndex: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#2979FF', fontWeight: 700 }}>MA {maPeriod}</span>
          <button
            style={{ background: 'transparent', color: '#aaa', border: 'none', fontSize: 18, cursor: 'pointer' }}
            title="Remove MA"
            onClick={() => setMaActive(false)}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

function mergeCandles(historical: Candle[], live: Candle[]): Candle[] {
  const candlesMap = new Map<number, Candle>();
  
  // Add historical candles with validation
  historical.forEach(c => {
    const timeValue = c.time as number;
    if (!isNaN(timeValue) && timeValue > 0) {
      candlesMap.set(timeValue, c);
    }
  });
  
  // Add live candles with validation (overwrite historical if same time)
  live.forEach(c => {
    const timeValue = c.time as number;
    if (!isNaN(timeValue) && timeValue > 0) {
      candlesMap.set(timeValue, c);
    }
  });
  
  return Array.from(candlesMap.values()).sort((a, b) => (a.time as number) - (b.time as number));
}

function aggregateTicksToCandles(ticks: Tick[], timeframe: string): Candle[] {
  if (ticks.length === 0) return [];

  const timeframeSeconds = getTimeframeSeconds(timeframe);
  const candlesMap = new Map<number, Candle>();

  ticks.forEach((tick) => {
    // Validate tick data
    if (!tick || typeof tick.time !== 'number' || tick.time <= 0) {
      console.warn('Invalid tick data:', tick);
      return;
    }

    const bucketStart = Math.floor(tick.time / timeframeSeconds) * timeframeSeconds;
    
    if (isNaN(bucketStart)) {
      console.warn('Invalid bucket start for tick:', tick);
      return;
    }

    let candle = candlesMap.get(bucketStart);

    if (!candle) {
      candle = {
        time: bucketStart as Time,
        open: tick.price,
        high: tick.price,
        low: tick.price,
        close: tick.price,
        volume: tick.quantity || 0,
      };
      candlesMap.set(bucketStart, candle);
    } else {
      candle.high = Math.max(candle.high, tick.price);
      candle.low = Math.min(candle.low, tick.price);
      candle.close = tick.price;
      candle.volume = (candle.volume || 0) + (tick.quantity || 0);
    }
  });

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