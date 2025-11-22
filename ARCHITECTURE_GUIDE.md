# Professional Trading UI - Architecture & Components

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Live Market Page                            │
│                  (pages/dashboard/livemarket.tsx)                │
└──────────────────────────┬──────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
    ┌────────┐        ┌─────────┐        ┌──────────┐
    │ Symbol │        │Timeframe│        │Left      │
    │ Tabs   │        │Selector │        │Toolbar   │
    │(Header)│        │(Header) │        │(Header)  │
    └────────┘        └─────────┘        └──────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
    ┌───────────┐      ┌──────────┐     ┌──────────┐
    │  Chart    │      │ Drawing  │     │  Order   │
    │Container  │      │  Tools   │     │  Panel   │
    │(Lightweight       │(Toolbar) │     │(Compact) │
    │ Chart)    │      │          │     │          │
    │  (500px)  │      │ (56px)   │     │ (256px)  │
    └───────────┘      └──────────┘     └──────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  Orders      │
                    │  History     │
                    │  (Bottom)    │
                    └──────────────┘
```

## Component Hierarchy

```
LiveMarketPage
├── SymbolTabs
│   ├── Symbol Buttons (BTC, ETH, XAU/USD, GBP/USD)
│   └── Add Symbol Button
│
├── LeftToolbar
│   ├── Drawing Tools (cursor, crosshair, line, etc.)
│   ├── Zoom Controls (in/out)
│   ├── Reset Button
│   └── Fullscreen Button
│
├── TimeframeSelector
│   └── Timeframe Buttons (1m, 3m, 5m, 15m, 30m, 1h, 4h, 1d)
│
├── LightweightChart
│   ├── Candlestick Series
│   └── Volume Histogram
│
├── CompactOrderPanel
│   ├── Header (Place Order)
│   ├── Content Area (scrollable)
│   │   ├── Current Price Display
│   │   ├── Wallet Balance
│   │   ├── Buy/Sell Toggle
│   │   ├── Size Input
│   │   ├── Stop Loss Input
│   │   ├── Take Profit Input
│   │   └── Error Display
│   └── Footer (Place Order Button)
│
└── OrdersHistory
    └── Orders Table
```

## Layout Grid

```
┌──────────────────────────────────────────────────────┐
│                    SYMBOL TABS ROW                   │ 48px
├──────┬────────────────────────────────────────────────┤
│      │         TIMEFRAME SELECTOR ROW                 │ 40px
│ LEFT ├────────────────────────────────────────────────┤
│ TOOL │                                            │   │
│ BAR  │            CHART AREA                      │RIG│
│      │         (Lightweight Charts)               │HT │
│ 56px │                                            │OP │
│      │                                            │RDR│
│      │                                            │RDR│
│      │                                            │PAN│
│      │                                            │L  │
│      │                                            │   │
│      │                                            │256│
├──────┼────────────────────────────────────────────────┤
│         ORDERS HISTORY SECTION (max 192px)           │
└──────┴────────────────────────────────────────────────┘
```

## Responsive Behavior

### Desktop (>1024px)

```
[Symbol Tabs] (full width)
[LEFT TOOLBAR] [CHART] [ORDER PANEL (256px)]
[ORDERS HISTORY]
```

### Tablet (768px - 1024px)

```
[Symbol Tabs] (full width)
[LEFT TOOLBAR] [CHART] [ORDER PANEL (192px)]
[ORDERS HISTORY]
```

### Mobile (<768px)

```
[Symbol Tabs] (scrollable)
[Timeframe Selector] (scrollable)
[CHART] (full width)
[ORDER PANEL] (horizontal)
[ORDERS HISTORY]
```

## Data Flow

```
WebSocket Connection
        │
        ▼
   Price Updates (Tick)
        │
   ┌────┴────┐
   │          │
   ▼          ▼
Trading    Chart
Store      Update
   │          │
   └────┬─────┘
        │
        ▼
   Current Price Display
   + Chart Candles
```

## Color Palette

| Element           | Color     | Hex     |
| ----------------- | --------- | ------- |
| Background        | Gray-900  | #111827 |
| Panels            | Gray-800  | #1f2937 |
| Borders           | Gray-700  | #374151 |
| Text Primary      | White     | #ffffff |
| Text Secondary    | Gray-300  | #d1d5db |
| Text Muted        | Gray-400  | #9ca3af |
| Active/Primary    | Blue-600  | #2563eb |
| Buy/Up Trend      | Green-600 | #16a34a |
| Sell/Down Trend   | Red-600   | #dc2626 |
| Chart Grid        | Gray-800  | #1f2937 |
| Chart Up Candle   | Teal      | #26a69a |
| Chart Down Candle | Red       | #ef5350 |

## Component Sizing

| Component            | Dimension   | Class               |
| -------------------- | ----------- | ------------------- |
| Symbol Tab Height    | 48px        | h-12                |
| Timeframe Bar Height | 40px        | h-10                |
| Left Toolbar Width   | 56px        | w-14                |
| Toolbar Button Size  | 40px × 40px | h-10 w-full         |
| Right Panel Width    | 256px       | w-64                |
| Chart Height         | 500px       | (calculated)        |
| Orders History Max   | 192px       | max-h-48            |
| Border Radius        | 4-8px       | rounded, rounded-md |

## Spacing System

| Spacing | Tailwind   | Usage                 |
| ------- | ---------- | --------------------- |
| Minimal | gap-1, p-1 | Toolbar buttons, tabs |
| Small   | gap-2, p-2 | Panel sections        |
| Medium  | gap-3, p-3 | Component sections    |
| Large   | gap-4, p-4 | Main sections         |
| Extra   | gap-6, p-6 | Page padding          |

## Typography

| Element         | Size    | Weight      | Color     |
| --------------- | ------- | ----------- | --------- |
| Section Headers | text-xs | font-bold   | gray-300  |
| Buttons         | text-xs | font-medium | white     |
| Input Labels    | text-xs | font-medium | gray-400  |
| Price Display   | text-lg | font-bold   | blue-400  |
| Wallet Balance  | text-sm | font-bold   | green-400 |
| Error Messages  | text-xs | font-normal | red-400   |

## Files Created/Modified

```
Created:
├── components/ChartToolbar/
│   ├── LeftToolbar.tsx
│   ├── SymbolTabs.tsx
│   ├── TimeframeSelector.tsx
│   └── index.ts
├── components/OrderPanel/
│   └── CompactOrderPanel.tsx
└── TRADING_UI_TRANSFORMATION.md

Modified:
├── pages/dashboard/livemarket.tsx (complete rewrite)
├── components/CandleChart/LightweightChart.tsx (styling updates)
└── styles/globals.css (added trading UI utilities)
```

---

**Status:** ✅ All components created and styled
**Error-Free:** ✅ No compilation errors
**Ready for Production:** ✅ Yes
