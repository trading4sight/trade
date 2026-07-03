# TRADING4SIGHT - TradingView Charting platform Alternative
---
# Changelog

## 2026-07-02

### Interactive Brackets Click Button Wiring Fix
* Fixed Confirm, Discard, Reverse (⇅), Close (✕), TP Cancel, and SL Cancel buttons in [activePosition.ts](src/overlays/activePosition.ts) not responding to clicks. Root cause: all buttons used `ignoreEvent: false` which allowed KlineCharts' `onPressedMoveStart` to fire on mousedown, starting an overlay drag operation that consumed the subsequent click event.
* Changed click-only button figures from `ignoreEvent: false` to `ignoreEvent: ['onPressedMoveStart', 'onPressedMoving', 'onPressedMoveEnd']`. This blocks drag initiation while still allowing `onClick`, `onMouseMove`, `onMouseEnter`, and `onMouseLeave` events to fire normally.
* Drag handles (`tp_drag_btn`, `sl_drag_btn`, `tp_line_drag_handle`, `sl_line_drag_handle`) retain `ignoreEvent: false` since they need full drag event support.
* **Fixed global hit-test interception bug**: Corrected attributes for `tp_line_drag_handle` and `sl_line_drag_handle` from `cx`/`cy` to `x`/`y`. KlineCharts canvas figure type `circle` expects `x`/`y`. Providing `cx`/`cy` caused the distance formula in `checkCoordinateOnCircle` to compute with `undefined` values yielding `NaN`, which made every click on the entire chart coordinate system register as a hit on the drag handles, capturing all clicks and preventing them from reaching `confirm_btn` or `discard_btn`.
* **Fixed bracket order overwrite issue**: When dragging or editing a single bracket (e.g. SL), the other unmodified bracket (e.g. TP) would get cancelled and lost. Corrected this by extracting `activeTPPrice` and `activeSLPrice` from current open orders in [ChartManager.ts](src/chart/ChartManager.ts), and pre-populating the unmodified projected level with the active confirmed order price in [activePosition.ts](src/overlays/activePosition.ts) during edit initialization or dragging. Both bracket levels are now correctly sent and preserved/placed on confirmation.
* **Fixed duplicate paper orders bug**: When submitting brackets on paper trading, the cancel-first step only matched parentIds starting with `pos_bracket_`, leaving brackets created during initial entry (using parent order ID format) active. Widened check in [PaperBroker.ts](src/paper/PaperBroker.ts) to match and cancel any open order containing a non-empty `parentId`, eliminating order duplication.
* **Fixed duplicate live orders bug**: In [ChartManager.ts](src/chart/ChartManager.ts), the live bracket submission handler failed to cancel existing open live orders before placing the new ones. Root cause: the code checked `Array.isArray(orderBookRes.data)` and filtered it directly, but OpenAlgo returns the order list in `orderBookRes.data.orders`. Corrected parsing to target the `.orders` array and support lowercase status strings (e.g. `"open"`).
* **Fixed order projection click buttons**: Applied the same drag-blocking `ignoreEvent` array (`['onPressedMoveStart', 'onPressedMoving', 'onPressedMoveEnd']`) to click-only buttons (`submit_btn`, `cancel_btn`, `tp_close_btn`, `sl_close_btn`) inside [orderProjection.ts](src/overlays/orderProjection.ts) to keep button clicks resilient against minor pointer drag movements.
* **Fixed chart reload bracket overlay bug**: When the chart reloaded on paper trading, active positions and open bracket orders (TP and SL) were not displayed on the chart if another tab (like Positions) was active. Root cause: the paper state events (`orders:update`) are lazy-loaded and not emitted on load, leaving `ChartManager`'s internal data empty. Fixed by loading the initial state directly from `localStorage` on chart initialization in [ChartManager.ts](src/chart/ChartManager.ts), drawing all active positions and bracket orders immediately on load.
* **Fixed orphaned bracket orders bug**: When a Stop Loss or Take Profit bracket order got filled on live/paper trading, the opposite bracket order remained open (orphaned). Added `checkAndCleanupOrphanedBrackets()` in [ChartManager.ts](src/chart/ChartManager.ts) listening to position update events. If the position quantity becomes 0 for the symbol, it automatically cancels any remaining open bracket orders (matching `parentId` for paper trading, or strategies `Trading4sight_TP`/`Trading4sight_SL` for live trading), preventing order duplication and unintended entries.
* **Fixed cancelorder strategy name mismatch**: When cancelling live orders or cleaning up orphaned brackets, the application submitted `strategy: 'Trading4sight'` to OpenAlgo's `/cancelorder` API. However, bracket orders are placed with specific strategy names (`Trading4sight_TP`, `Trading4sight_SL`). This mismatch caused OpenAlgo/brokers to reject the cancellation request, leaving old bracket orders active and resulting in duplicates. Fixed by dynamically setting the strategy parameter to match the order's strategy or type during cancel calls in [ChartManager.ts](src/chart/ChartManager.ts). Also removed redundant `symbol`/`exchange` fields from cancel payloads (unsupported by `/cancelorder` schema) and implemented a fallback cancel call using `'Trading4sight'` to guarantee cancellation regardless of where the order was originally placed.
* **Fixed paper trading execution marks bug**: On paper trading mode, execution marks did not render on the chart because the `trades:update` event emitted from the Account Manager contained date-formatted string timestamps (ambiguous between US/Indian locale standard date parsing, causing they to resolve to February 2026 and render off-chart). Resolved this by updating [ChartManager.ts](src/chart/ChartManager.ts) to always retrieve raw number-based millisecond timestamps directly from the `openchart_paper_state` trades in `localStorage` during overlay synchronization. Also updated `saveState()` in [PaperBroker.ts](src/paper/PaperBroker.ts) to automatically emit `trades:update` and trigger immediate overlay synchronization.
* **Fixed execution mark candle alignment**: Resolved a bug where execution marks would not render because trade execution timestamps (exact milliseconds of fills) did not exactly match the start timestamp of chart candles. Added a timestamp snapping helper `getChartCandleTimestamp()` inside [ChartManager.ts](src/chart/ChartManager.ts) that rounds the trade execution timestamp down to the start timestamp of its corresponding candle, allowing the charting library to correctly map and draw the execution mark overlays.
* **Fixed execution mark hover tooltip bug**: Hovering over execution marks in paper mode failed to show the tooltip. Root cause: the hover hit-tester in `handleCrosshairChange()` checked raw millisecond timestamps against the candle coordinates. Fixed by adding the same `getChartCandleTimestamp()` snapped alignment to the hover coordinates converter in [ChartManager.ts](src/chart/ChartManager.ts) so that the hover logic maps exactly to the candle coordinates.
* **Fixed execution mark reload/refresh latency**: Execution marks sometimes snapped to the start of the day or stayed misplaced on reload/refresh until another trade occurred or the Account Manager was refreshed. Root cause: when the chart asynchronously loaded or refreshed history (emitting the `chart:data` event), the overlays were never re-synchronized to match the newly loaded candles. Fixed by calling `syncTradingOverlays()` inside the `chart:data` event handler in [ChartManager.ts](src/chart/ChartManager.ts), forcing positions, orders, and execution marks to snap to their correct candles instantly as soon as history data is applied.
* **Optimized bracket updates (Unchanged Bracket Preservation)**: When submitting bracket updates, the system used to always cancel and re-place both TP and SL legs regardless of whether their prices changed. Implemented a price check comparison against currently open orders in [ChartManager.ts](src/chart/ChartManager.ts) (for live trading) and [PaperBroker.ts](src/paper/PaperBroker.ts) (for paper trading). If the price of a bracket leg (TP or SL) has not changed, the existing open order is kept untouched (no cancellation, no new placement), completely avoiding redundant order cycles and preventing active orders from being closed and replaced unnecessarily.

## 2026-07-01

### Interactive Brackets UI Styling & Hit-Test Fix
* Root-caused the solid blue backgrounds on button labels and bracket pill texts in [activePosition.ts](src/overlays/activePosition.ts) to missing `backgroundColor: 'transparent'` on text figures. KlineCharts' default overlay text style (`backgroundColor: Color.BLUE`) was bleeding through the style merge for all 11 text figures that lacked this explicit override.
* Added `backgroundColor: 'transparent'`, `borderColor: 'transparent'`, and `borderSize: 0` to all text figures in `activePosition.ts` — Discard, Confirm, ⇅ Reverse, TP, SL button labels, and TP/SL bracket pill qty/PnL/✕ texts.
* Fixed invisible hit-test rects (`reverse_btn`, `tp_drag_btn`, `sl_drag_btn`, `confirm_btn`, `discard_btn`, `tp_cancel_btn`, `sl_cancel_btn`) from `style: 'stroke'` with `rgba(0,0,0,0)` to `style: 'stroke_fill'` with `rgba(0,0,0,0.01)` for reliable canvas pointer hit-testing.
* Added overlay-level `text`, `circle` style overrides with transparent `backgroundColor`/`borderColor` in [ChartManager.ts](src/chart/ChartManager.ts) as a safety net fallback for both `activePosition` and `activeOrder` overlays.

### Position Reverse Without Confirmation
* Removed the `confirm()` dialog from the `position:manage:reverse` event handler in [ChartManager.ts](src/chart/ChartManager.ts). Clicking the Reverse button now immediately exits the current position and places an opposite market order of the same quantity without prompting.

### Trading Execution Marks on Chart
* Implemented a new custom overlay `executionMark` in [executionMark.ts](src/overlays/executionMark.ts) (registered in [index.ts](src/overlays/index.ts)) to visualize buy/sell entries and exits on the chart.
* Designed high-visibility execution marks placed outside the candle wicks (Royal Blue vertical **UP** arrow below the low wick for BUYs; Pink/Magenta vertical **DOWN** arrow above the high wick for SELLs).
* Implemented on-the-fly chronological trade sorting and running position size reconstruction in [ChartManager.ts](src/chart/ChartManager.ts) to classify orders as either opening/increasing a position (First Order / Entry) or closing/reducing a position (Exit Order).
* Draws horizontal triangles at the execution price level: pointing **RIGHT** `▶` for First Orders (Entry) and pointing **LEFT** `◀` for Exit Orders.
* Wired dynamic crosshair-based hover detection within `handleCrosshairChange` in `ChartManager.ts`. When the crosshair moves within 20px of any execution mark's screen-coordinate, the tooltip is rendered and snapped exactly to the execution mark, ensuring 100% reliable hover activation.
* Implemented a single-line DOM execution tooltip styled to match the `.volume-cluster-tooltip` layout and dynamically colored borders, formatting trade info as requested (e.g. `65 QTY 1234.85 01 Jul 11:40:31 am`).
* Added `trades:update` and `live-trades:update` event handlers to automatically sync and display the execution marks when trade history is updated.
* Integrated the "Execution marks" and "Execution labels" toggles into the Settings modal's Trading tab in [SettingsModal.ts](src/ui/SettingsModal.ts) and configured them to automatically persist in localStorage and sync dynamically.

### Responsive Option Chain Table Layout & Auto Strike Centering
* Added a `min-width: 960px;` property to `.oa-optionchain-table` in [style.css](src/style.css) to prevent column overlapping and squishing on small mobile viewports, enabling smooth left-and-right horizontal scrolling.
* Programmed horizontal scroll auto-centering logic `centerScrollOnStrike` in [OptionChainModal.ts](src/ui/OptionChainModal.ts) using `requestAnimationFrame`. Whenever the Option Chain modal is opened or a new underlying symbol/expiry date is loaded, the horizontal scroll position of the wrapper container is automatically centered. This aligns the Strike column in the middle of the screen on mobile, saving users from manual horizontal scrolling.

### OpenAlgo WebSocket Connection & Recovery Optimizations
* Implemented tracking of the connected API key (`connectedApiKey`) in [wsClient.ts](src/openalgo/wsClient.ts) and configured the client to automatically drop and reconnect when either the WebSocket URL or the API key changes.
* Configured [SettingsModal.ts](src/ui/SettingsModal.ts) to track initial WebSocket parameters and automatically trigger a WebSocket reconnect on close if credentials or endpoints were changed.
* Updated error handling in `wsClient.ts` to call `this.socket.close()` upon errors to force-trigger the standard reconnect cycle rather than hanging silently.
* Configured the fallback JSON `ping` message processor in `wsClient.ts` to respond with `{"type": "pong", "action": "pong"}` to satisfy all variants of the OpenAlgo WebSocket server check, preventing disconnects.

### Interactive Brackets Drag-to-Add & Position Reverse
* Implemented a premium position management workflow directly on the chart’s active position line inside [activePosition.ts](src/overlays/activePosition.ts).
* Added a `Reverse (⇅)` button that prompts confirmation and triggers a market order of twice the current quantity in the opposite direction to flip the position.
* Added green `TP` and orange `SL` dashed buttons that allow dragging out Take Profit and Stop Loss levels with connector lines, handles, and real-time P&L estimates.
* Created `Confirm` and `Discard` buttons on the active position line to submit or cancel the projected brackets.
* Linked bracket submissions to the broker: submits LIMIT (TP) and STOP (SL) orders under a single `parentId` for paper trading (auto OCO), and cancels existing open orders before placing Limit (TP) and Stop Loss Market (SL-M) orders for live trading.

### Interactive Control Handle Highlight Readability & Hit-Test Fix
* Resolved an issue where interactive handles (`reverse_btn`, `tp_drag_btn`, `sl_drag_btn`, `confirm_btn`, `discard_btn` in [activePosition.ts](src/overlays/activePosition.ts) and `tp_close_btn`, `sl_close_btn` in [orderProjection.ts](src/overlays/orderProjection.ts)) were overridden with solid blue backgrounds by KlineCharts' native pointer highlights.
* Overrode default overlay `rect` and `point` styles to `transparent` inside [ChartManager.ts](src/chart/ChartManager.ts) for `orderProjection`, `activeOrder`, and `activePosition` overlays, preventing selected/active highlighting from painting them blue.
* Switched the color of transparent target interactive rects from `'transparent'` to `'rgba(0, 0, 0, 0.01)'`. This ensures the canvas renderer does not optimize them out, making them fully hit-testable and clickable under all states.
* Fixed a bug in [OrderPanel.ts](src/ui/OrderPanel.ts) where the `'order:projection:change'` event handler failed to call `this.updateOrderProjection()` after updating input fields. This ensures that clicking the `✕` close button on the TP/SL order projection tag pills directly on the chart immediately updates/clears the Order Panel draft states and removes the dashed projection lines from the chart.

### Position Overlays Contiguous Buttons Layout (TradingView Style)
* Redesigned active position buttons (`Reverse`, `TP`, `SL`, `Confirm`, `Discard`) in [activePosition.ts](src/overlays/activePosition.ts) to render as contiguous segments of the unified main position pill, matching the clean contiguous treatment of `LONG 100` and `Avg/P&L` segments.
* Aligned segments side-by-side using a 1px boundary overlap (`curX += width - 1`) to share borders and eliminate double-thick lines and gaps.
* Configured custom corner rounding for individual segments: leftmost segment gets rounded left corners (`[4, 0, 0, 4]`), middle segments get straight corners (`[0, 0, 0, 0]`), and the rightmost segment gets rounded right corners (`[0, 4, 4, 0]`).
* Removed the `key` property from visual backgrounds and labels so that KlineCharts' selection engine does not paint over their white, green, red, or blue custom borders and text.
* Added transparent event-capturing overlay rects with `key` and `ignoreEvent: false` styled with `color: 'transparent'`, `borderColor: 'transparent'`, `borderSize: 0` (omitting `style: 'stroke_fill'`). This prevents the engine from drawing highlight backgrounds, keeping them completely invisible while capturing clicks and drag actions flawlessly.

### Paper Trading Available Balance & Holding Capital Calculations Fix
* Fixed an issue where open holdings or active positions did not deduct from the **AVAILABLE** balance in paper trading.
* Implemented a dynamic used-margin calculation method (`recalculateUsedMargin`) in [PaperBroker.ts](src/paper/PaperBroker.ts) that aggregates blocked capital for positions/holdings depending on their product type (CNC blocks 100%, MIS blocks 20%, NRML blocks 10%).
* Centralized state persistence in `PaperBroker.ts` under a new `saveState` helper to ensure the calculated used margin is always kept in sync and saved to `localStorage`.
* Updated [AccountManager.ts](src/ui/AccountManager.ts) to dynamically calculate used margin and deduct it from the account's cash balance when rendering paper trading funds, updating both **AVAILABLE** and **USED** fields correctly.

## 2026-06-30

### Chart Data Gap Auto-Healing & Offline Warning Banner
* Implemented automatic background data catch-up when the WebSocket reconnects, triggered by the `ws:authenticated` event.
* Added a dynamic tick-gap detector that calculates the time difference between incoming live ticks and the chart's last completed candle. If a gap greater than `1.5 * timeframe_duration` is identified (e.g. 90 seconds on a 1-minute chart), it automatically pulls missing candles in the background.
* Configured a thread-safe reload lock (`isReloading` flag) to prevent concurrent overlapping history requests to OpenAlgo on rapid tick updates, preserving server rate limits.
* Added a custom offline notice bar (`offlineBar-VQqbCElH`) matching TradingView styling, injected above the Top Bar. It appears when connection is lost (or the socket drops) in Online Mode and vanishes immediately upon reconnection.
* Modified the historical data cache utility (`clearOnlineCache`) in `src/chart/onlineLoader.ts` to support optional selective parameter clearing.
* Added manual **Refresh** action buttons in both the desktop Top Bar control header and the mobile dropdown options menu.
* Deactivated WebSocket watchdog checks and re-subscription tasks during off-market hours (`status === 'closed'`) in `src/openalgo/wsClient.ts`, avoiding continuous API disconnect/reconnect loops to the broker server.
* Implemented conditional visibility rules for the price axis countdown to bar close: disabled on closed markets for intraday timeframes, but active 24/7 on Daily (D), Weekly (W), and Monthly (M) timeframes.
* Optimized the chart reflow loop in `src/chart/ChartManager.ts` by skipping periodic `chart.resize()` redraw ticks when the countdown is hidden, lowering CPU footprint.
* Restored mobile access to the Watchlist and Alerts panel overlay by adding dedicated toggle triggers within the Top Bar's mobile options menu (ellipsis `...`), routing them to open the full-screen layout drawer since the right dock is hidden on small screens.
* Elevated z-index values of dialog modals (Indicator, Goto, Settings, Volume Profile, and Symbol Search) in `src/style.css` (ranging from `2100` to `2140`) to ensure they open in front of the fixed mobile watchlist container (`z-index: 2000`), allowing seamless symbol search additions.

### Production JavaScript Obfuscation Pipeline
* Integrated a decoupled post-build JavaScript Obfuscation step for production builds using the programmatic API of the official `javascript-obfuscator` library.
* Created [scripts/obfuscate.mjs](scripts/obfuscate.mjs) to parse compiled assets in `dist/assets/` post-bundling.
* Added configurable domain locking using the environment variable `OBFUSCATION_DOMAIN_LOCK` (falling back to standard local/GitHub Pages domains if undefined).
* Implemented double-obfuscation prevention by prepending an official production banner comment and optimized the detection using `startsWith(BANNER)` matching to skip file corruption on repeat builds.
* Created [scripts/clean_assets.mjs](scripts/clean_assets.mjs) to safely clear stale assets inside `dist/assets/` before every build, preserving custom data in `dist/data/` untouched.
* Excluded small runtime files (size < 5 KB) and Web Worker scripts (using regex `/\.worker(?:-[a-zA-Z0-9_-]+)?\.js$/`) to minimize performance and runtime overhead.
* Disabled source map generation (`sourcemap: false`) in [vite.config.mjs](vite.config.mjs) to prevent exposing the original source code.
* Configured script execution inside the `build` and `build:static` tasks in [package.json](package.json).
* Added targeted build exception rules to halt deployment with exit code 1 if the main chunk fails to obfuscate, but output warnings for other minor files.

### Frictionless Order Execution (Confirmation Removal)
* Removed all browser-blocking browser-native `alert(...)` and `window.confirm(...)` popups during order placement, modification, reversing, flattening, and cancellation in both paper and live execution modes.
* Implemented a new non-blocking status notification label (`this.headerStatusEl`) in the Account Manager dock header (`oa-account-dock-header`) in [AccountManager.ts](src/ui/AccountManager.ts) listening to `'trading:status:notify'` events.
* Routed all order success confirmations and warnings/errors to the Account Manager header status line (color-coded green for success, red/orange for errors) and to the local Order Panel status bar, ensuring high-speed trading is never interrupted by blocking browser alerts.

### Collapsible Watchlist Groups & Pure Data Details Panel
* Implemented collapsible group headers (`INDICES`, `STOCKS`, `FUTURES`, `FOREX`) in [OrderPanel.ts](src/ui/OrderPanel.ts) allowing users to expand or collapse sections dynamically.
* Added expand/collapse carets with smooth `-90deg` rotation transitions defined in [style.css](src/style.css), caching collapse preferences in `localStorage` under `trading4sight_watchlist_collapsed_groups`.
* Pre-populated the default watchlist with the exact list of index, equity, futures, and currency pairs matching the reference: `SPX`, `NDQ`, `DJI`, `VIX`, `DXY` (Indices); `AAPL`, `TSLA`, `NFLX` (Stocks); `USOIL`, `GOLD`, `SILVER` (Futures); and `EURUSD`, `GBPUSD`, `USDJPY` (Forex).
* Added group-level deletion controls (hover-visible trashcan SVG buttons next to group headers) that bulk-remove all child symbols and clean up active WebSocket subscriptions instantly.
* Replaced the text character close buttons (`✕`) in individual row columns with premium TV-style trashcan SVG icons.
* Redesigned the bottom details card to display only live, data-backed fields populated from OpenAlgo quotes (Logo initials, Ticker, Exchange name, manifest description, LTP, currency, Real-time badge, and colored change/change% metrics), stripping all mock statistics, profile tables, and news sections.
* Maintained micro-DOM patching inside `updateWatchlistDom(...)` to update both table rows and the details panel on live ticks without layout reflows.
* **Watchlist Column Spacing Alignment**: Added grid child overrides (`nth-child`) in [style.css](src/style.css) to align headers and numeric fields (`Last`, `Chg`, `Chg%`) to the right, aligning columns cleanly.
* **Dynamic Option Symbol Formatting**: Added `parseSymbolDisplayName` and `parseOptionDescription` to parse raw option contracts (e.g. `BANKNIFTY28JUL2632500CE` into `BANKNIFTY 28Jul 32500 CE`) dynamically, preventing text truncation in columns and displaying clean, human-readable labels.
* **Dynamic Market Hours Indicators & Status Dots**: Replaced the static online mode logic with the target exchange's timing rules from [marketHours.ts](src/utils/marketHours.ts). Standardized the watchlist row and card indicator dots to show dynamic status: green for Open, grey for Closed, orange for Pre-market, and blue for Post-market based on real-time IST clock timings.
* **Option Charting and LTP Integration**: Verified and ensured option symbol selection works seamlessly, loading option charts dynamically and subscribing to real-time LTP ticks when clicked from the watchlist.
* **Watchlist WebSocket Subscription Symbol Correction**: Corrected the symbol parameter inside `addSymbolToWatchlist()` to pass the raw broker symbol code (`toLiveSymbol(symbol)`) to `wsClient.subscribe()` instead of the human-readable formatted label string. This resolves token converter mapping warning anomalies and feed subscription delays.
* **Separated Online/Offline Watchlists & OpenAlgo Symbol Alignment**: Separated watchlist localStorage keys (`trading4sight_watchlist_items_online` and `trading4sight_watchlist_items_offline`) and symbol sets for Online vs Offline modes. In Online mode, the defaults are populated with valid OpenAlgo standard symbol formats (e.g. `BANKNIFTY`, `SBIN`, `BANKNIFTY26MAR26FUT`), eliminating chart chunk history fetch errors and token conversion errors. Mode transitions dynamically unsubscribe, reload, and re-subscribe symbols.

## 2026-06-29

### OpenAlgo Connection Optimization
- Implemented WebSocket subscription reference counting inside `src/openalgo/wsClient.ts`. When multiple components (e.g. Chart, Option Chain, Account Manager) subscribe to the same symbol, the WebSocket client increments a reference count and only issues a socket unsubscribe command once all subscribers release it. This prevents components from accidentally killing active data feeds for other parts of the platform.
- Exposed a `ws:authenticated` and `ws:disconnected` event path on the global event bus, allowing components to dynamically react to changes in WebSocket connection/authentication status.
- Eliminated the redundant secondary WebSocket connection (`positionWs`) in `src/ui/AccountManager.ts`, saving browser and server resources.
- Optimized the Account Manager to delegate position and holding symbol subscriptions to the shared global `wsClient` instance, maintaining background updates and P&L tracking even when the Account Manager dock is collapsed.

### Mobile Chart HUD UI Optimization
- Added mobile override styles for `.chart-series-legend` to wrap elements dynamically on smaller device screen widths (preventing clipping of OHLC and price change stats).

### Chart Trading Overlays Redesign (TradingView Style)
- Redesigned active positions, active orders, and order projection overlays to render as unified, gap-free, professional contiguous pills, matching TradingView's visual appearance.
- Replaced separated badge rectangles and close/cancel buttons with carefully overlapped segments utilizing left/right corner straighteners and dynamic text-based segment width calculations.
- Centralized alignment of text inside all overlay badges using `align: 'center'` and `baseline: 'middle'`.
- Made the bracket connector brace line on order projections position itself dynamically relative to the console's horizontal starting position.
- Refined styling to keep line and pill borders as solid side colors (LONG/BUY/SHORT/SELL) while dynamically color-coding only the Unrealized P&L text (green for profit, red for loss) inside the white-background segment.
- Split position and order details segments into left-aligned (e.g., Average Price, Quantity) and right-aligned (P&L, target details) parts for a highly polished, premium UI presentation.
- Implemented fully interactive, clickable close buttons (`✕`) directly on the Take Profit (TP) and Stop Loss (SL) order projection tag pills, automatically updating the Order Panel draft checkboxes/states on click.

### Paper Trading and Account Manager Alignment
- Enabled the order **Modify** button for paper orders in the Account Manager Orders tab.
- Modified the `modifyOrder` function and the `'paper-order:modify'` event in the Paper Broker to support updating both limit price and trigger price on paper orders.
- Fixed the paper position **Exit** confirm action to submit a proper limit or trigger paper order (incorporating quantity, order type, price, trigger price) rather than executing a default full-size market order.
- Filtered paper trade records inside the Account Manager Trades tab to only show actual executions (`FILLED` orders), hiding cancelled orders.
- Enabled live WebSocket client connection and subscriptions in paper trading mode when online, subscribing to all symbols with active paper positions to update valuations and unrealized P&L in real time.
- Integrated the paper WebSocket listener to emit `'tick:ltp'` events, allowing the Paper Broker to update position LTPs and trigger real-time UI refreshes in the Account Manager and inside the Exit Position confirmation modal.
- Implemented a **Reset Funds** dropdown selector and button in the Account Manager settings popover, supporting resetting simulation accounts with custom starting balances (1 Lakh, 5 Lakhs, 10 Lakhs, 25 Lakhs, 50 Lakhs, 1 Crore).
- Registered the `'paper-account:reset'` channel in the Paper Broker to clear balances, positions, orders, and trade records upon user confirmation.
- Fixed a bug where Realized P&L showed incorrect values after reset by adding `initialBalance` state tracking to `PaperAccountState` and computing paper P&L relative to the chosen starting capital instead of a hardcoded 10 Lakhs.
- Fixed a bug where real-time LTP and Unrealized P&L were stuck in the paper positions table by bypassing state reloads from `localStorage` on ticks (preventing stale values from overwriting in-memory updates), and incorporating `toLiveSymbol` to correctly resolve option and equity contract ticks.
- Fixed a bug where Stop Loss Market (`SL-M` and `STOP`) order lines were drawn at price `0` (making them invisible and non-modifiable on the chart) due to truthy evaluation of `"0.00"` limit price strings; restructured active order overlays in the chart manager and custom templates to check for non-zero limit prices and fall back to the trigger price.
- Aligned live broker modification parameters to send limit price as `'0'` for `SL-M` modifications, avoiding API rejection errors during chart order line drags.
- Added support for displaying `(trigger)` text on paper stop/trigger (`STOP`) orders on the chart active order overlays.
- Replaced the browser-native `window.confirm` modal with a custom HTML/CSS inline confirmation block within the settings popover, ensuring it bypasses Chrome's strict iframe dialog suppression and cross-origin security blocks (such as those in Gemini Code Assist preview tools).
- Implemented a self-healing **WebSocket Stream Watchdog** inside `wsClient.ts`. The watchdog runs a background check every 5 seconds; if an active real-time data subscription (mode 2 or 3) goes 15 seconds without receiving a tick message (e.g., due to silent server-side subscription pool downgrades when secondary connections disconnect), it automatically dispatches a silent unsubscribe/subscribe sequence to upgrade the pool and restore the live chart update stream.
- Implemented **Paper Trading Holdings** and overnight carryover simulation:
  - Added a `holdings` array to `PaperAccountState` and tracked `openedDate` (YYYY-MM-DD) on positions.
  - Automatically transfers equity `CNC` positions opened on previous days to the Holdings tab upon application load/init.
  - Wired live WebSocket and LTP quote updates to compute unrealized P&L in real time for paper holdings.
  - Added an **Exit** button inside the Holdings tab which triggers a paper exit order (reducing holdings quantity upon execution).
  - Added a **Simulate Next Day (Overnight)** button to the settings popover, allowing users to instantly roll positions over to the next day for test-driving holdings and overnight settlement flows.

## 2026-06-26

### Responsive Mobile UI Support
- Prevented `.right-panel` (OrderPanel) from squeezing the main chart area by styling it as a fixed-position full-width overlay drawer below the top bar on mobile screens (< 768px).
- Refactored the left-hand drawing `.tool-bar` to behave as a collapsible floating FAB (pencil icon) on mobile viewports. The toolbar expands horizontally to scroll on touch, and automatically collapses when any tool is selected or cancelled.
- Collapsed secondary desktop top-bar icons (Indicators, Replay, Undo, Redo, Layouts, Settings, Online Mode toggle) into a unified vertical "More options" ellipsis dropdown menu (`indicator-more`) on mobile viewports to prevent overflow clipping.
- Simplified Account Manager tables on mobile screens to show only essential columns (Symbol, Qty, P&L/Status) and implemented an expand caret (`▸`/`▼`) to toggle sub-rows displaying hidden attributes (Exchange, Product, avg price, etc.).
- Enhanced Account Manager expanded height to dynamically scale up to 60% of the viewport height (with a minimum of 200px) on mobile viewports, and implemented touch-drag event handlers for responsive resizing on touch devices.

### Chart Trading Overlays Refinement
- Enhanced `orderProjection`, `activeOrder`, and `activePosition` overlays to align closely with TradingView's visual design.
- Implemented a vertical bracket connector brace line with ticks on the left side of the order projection labels to visually group Entry, TP, and SL lines together.
- Redesigned active positions, active orders, and order projection console boxes to use a double-badge (pill-style) layout, dividing solid color-coded type/side badges and white bordered details/price/ratio badges.
- Integrated exchange-aware dynamic currency formatting (₹ for Indian exchanges, $ otherwise) and tick distance calculations inside active position, active order, and order projection tags.
- Fixed strict TypeScript compiler warnings by resolving potential null-pointer checks for the active symbol selection ref inside closures.
- Dynamic Position Color: Colored the average price line and the P&L badge border dynamically green/red based on positive or negative position P&L.
- Stop Order Trigger labels: Formatted active order tags for Stop Loss orders (SL/SL-M) to show explicit order types and `@ [price] (trigger)` suffixes, widening the badges to prevent clipping.

## 2026-06-25

### Chart Trading: Order Projection and Order Management
- Implemented visual chart trading components using custom KlineCharts v10 overlays: `orderProjection`, `activeOrder`, and `activePosition`.
- Registered overlays in `src/overlays/index.ts` and wired sync and event handling in `src/chart/ChartManager.ts`.
- Integrated two-way syncing between the Order Panel inputs and the Order Projection overlay, allowing dragging chart lines to update form values and vice versa.
- Added bracket order support to the Paper Broker: submitting a parent order with Take Profit and Stop Loss values now automatically schedules limit/stop bracket orders upon parent fill, linked with OCO cancellation logic.
- Supported direct drag-to-modify and one-click cancel/close buttons on active order and position overlays without modal confirmations.
- Aligned details labels and buttons on active position, active order, and order projection overlays to the right side of the chart pane, near the price scale, to match TradingView styling.
- Switched active position tags to use solid backgrounds (green for Long, red for Short) with bold white text for high contrast and legibility.
- Hidden selection point handles (radius: 0) on overlays and blocked default click selection to prevent overlays from turning blue when clicked/hovered.
- Fixed TypeScript compiler checks across all new overlays and paper broker integrations.

### OpenAlgo Option Chain Popup Modal
- Implemented a standalone Option Chain popup modal dialog (`OptionChainModal` extending `BaseComponent`) mimicking the layout, styling, and behavior of the `chartspire-v0.6.1` project.
- Configured the modal to open on top of the screen as a popup (`.oa-optionchain-modal`) when clicking "Option Chain" in the top bar, bypassing and removing all sidebar-based mock Option Chain views.
- Subscribed to real-time tick and depth WebSocket streams from the global `wsClient` to update option contract Bid/Ask prices, quantities, spreads, volumes, and open interest in the table dynamically.
- Configured Option Chain quick-action Buy/Sell (**B** / **S**) buttons to populate the symbol, exchange, and side in the Order Panel and open/show the side panel, while keeping the Option Chain modal dialog open in the foreground.
- Added support for Option Chain settings persistence (`localStorage.getItem('oa_optionchain_popup_prefs_v1')`) including visible columns toggles, custom column ordering, strikes count, and visual style (solid vs gradient bar indicators).

### OpenAlgo Trading Panel Integration
- Replaced the buy/sell panel layout and logic in [OrderPanel.ts](src/ui/OrderPanel.ts) and [style.css](src/style.css) with the OpenAlgo Trading Panel design from the reference project.
- Implemented the segmented Buy/Sell buttons (`.oa-segment`) and order type chips (`MARKET`, `LIMIT`, `SL`, `SL-M`) in the Trade view.
- Integrated the quantity stepper (`.oa-stepper`) with auto-snapping multiples derived from the `/api/v1/search` endpoint via OpenAlgo REST POST requests for F&O exchanges (`NFO`, `MCX`, `BFO`, `CDS`, `BCD`), defaulting to 1 for cash exchanges.
- Added a conditional input visibility layout where Limit Price is visible only for `LIMIT`/`SL` type orders and Trigger Price is visible only for `SL`/`SL-M` type orders.
- Implemented an inline 5-level DOM grid inside the Trade view showing real-time bids/asks and quantities.
- Built a standalone DOM view containing a full 11-level depth ladder with column headers, total buy/sell volumes, overall volume, OI, and high/low values. Added Pause/Resume auto-refresh controls and a Refresh button.
- Preserved dual-track execution support: paper trading orders are routed via `paper-order:submit` and `paper-order:cancel` event bus channels, while live orders are routed via REST endpoint calls with safety confirmations (`window.confirm`).
- Added CSS styles for all `.oa-` trading panel and DOM layout selectors to [style.css](src/style.css).
- Disabled confirmation prompt dialogs (`window.confirm`) during standard order form and DOM ladder order placement actions to ensure instant execution.

## 2026-06-19

### Fyers-Style Depth of Market (DOM) Price Ladder
- Rebuilt [OrderPanel.ts](src/ui/OrderPanel.ts) and [style.css](src/style.css) to emulate the layout, density, and functional capabilities of the Fyers web trading ladder interface.
- Removed the grid column headers (`Bid Qty`, `Price`, `Ask Qty`) to maximize vertical space and centered the ladder around the Last Traded Price (LTP) with bold weights and custom row highlights.
- Aligned Bid quantities to the right and Ask quantities to the left (snug against the center price border), with volume histogram fills that grow outwards from the center price axis.
- Added a position-aware **Position Status Row** displaying the active symbol's current position size (color-highlighted green for long, red for short) and average price, integrated with both paper and live execution brokers.
- Reorganized bottom action controls into a compact 3x3 grid for Buy/Sell Market, Units Input, Flatten, CXL All, and Reverse, and implemented targeted Cancel Bids and Cancel Asks buttons mapping to both simulation and live REST APIs.
- Modified [AccountManager.ts](src/ui/AccountManager.ts) to broadcast `live-positions:update` events, allowing real-time synchronization between the broker state and DOM position stats.

### Account Manager & Paper Trading Engine
- Implemented the core paper trading engine in [types.ts](src/paper/types.ts), [PaperStore.ts](src/paper/PaperStore.ts), and [PaperBroker.ts](src/paper/PaperBroker.ts) supporting simulated market, limit, stop, and stop-limit orders with local storage persistence and real-time tick calculations.
- Integrated order execution routing in [OrderPanel.ts](src/ui/OrderPanel.ts) with a prominent `PAPER` vs `LIVE` execution badge. Added safety confirmations (`window.confirm`) and validation constraints (CORS headers, API keys, online checks) for live broker executions via OpenAlgo.
- Rebuilt [AccountManager.ts](src/ui/AccountManager.ts) to display dynamic balance metrics (Account Balance, Equity, Realized P&L, Unrealized P&L, Available Funds) and tab-based logs (Positions, Orders, History, Journal, Balance/Ledger ledger).
- Integrated live polling of OpenAlgo accounts endpoints (`/funds`, `/positionbook`, `/orderbook`, `/tradebook`) when the trading engine is set to `live`, alongside real-time tick-update bindings for P&L tracking.
- Added interactive UI exit controls directly in the Account Manager table to cancel pending orders and close active positions at market in both simulated and live modes.
- Added a vertical resize handle (`.account-manager-resizer`) at the top border of the Account Manager, enabling dynamic vertical mouse resizing with smooth transitions disabled during drag operations (`.account-manager--resizing`), height clamping boundaries (38px to 80% window height), and persistence of custom height and expansion states in `localStorage`.
- Wired the header `maximize` button to toggle the panel height between 80% of window and default expanded height of 316px, triggering standard window resize events for automatic chart fit recalculation.
- Wired module boots in [main.ts](src/main.ts) to initialize the paper broker singleton at startup.

## 2026-06-17

### OpenAlgo CORS & WebSocket Deployment Fixes
- Added the `ngrok-skip-browser-warning` header to all OpenAlgo REST API POST requests in [client.ts](src/openalgo/client.ts) to bypass the ngrok warning screen and prevent CORS blocks when deployed to remote environments (e.g. GitHub Pages).
- Fixed the WebSocket URL formatter in [wsClient.ts](src/openalgo/wsClient.ts) to use `ws://` instead of `wss://` for local loopback addresses (like `127.0.0.1` or `localhost`). This allows browsers on HTTPS origins to successfully connect to the local WebSocket server since loopback is exempt from mixed-content blocking.
- Fixed a bug where the application got stuck on "Loading chart..." when deployed to remote/static environments (like GitHub Pages) due to the symbols manifest being empty. The check in `mountChartIfReady()` inside [main.ts](src/main.ts) was updated to allow chart mounting to proceed in online mode regardless of the presence of local CSV symbols.
- Fixed a bug in [onlineLoader.ts](src/chart/onlineLoader.ts) where scroll-back paging was broken in online mode. Corrected the loader checks to use the `forward` load type rather than `backward` (since KlineCharts represents scroll-back as `forward`), and implemented `onlineHasMoreMap` to track server-side historical data availability. This ensures `more.forward` correctly triggers subsequent historical fetches past the initial 90-day page until server-side data is fully exhausted.
- Fixed a bug where the Volume Cluster overlay plotted for only 1-2 days on lower-TF charts (e.g. 5m chart) even when "History Range" was set to "6 months". Added `customDurationDays` parameters to `getOnlineCachedBars()` and `fetchCachedBars()` in [onlineLoader.ts](src/chart/onlineLoader.ts) to request the full settings range duration. Updated [volumeCluster.ts](src/overlays/volumeCluster.ts) to check the resolved source history range and trigger a new fetch when settings are updated to a wider range.
- Added a built-in HTTP proxy router in the production distribution server template inside [vite.config.mjs](vite.config.mjs) so that running the built app locally (via `node dist/server.mjs` or `npm run serve:dist`) automatically forwards `/api` requests to the local OpenAlgo backend on port 5000, eliminating CORS issues for production builds.

## 2026-06-16

### TradingView Market Status & Timings Popover
- Implemented an interactive TradingView-style market status indicator next to symbol details in the legend using precise SVG icons (provided by the user) for pre-market, open, and closed states.
- Created `marketHours.ts` utility to compute market statuses ('open', 'pre-market', 'closed') and holiday schedules (2025-2026) for Indian exchanges (`NSE`, `BSE`, `NFO`, `BFO`, `CDS`, `BCD`, `MCX`).
- Designed a custom DOM component `SeriesLegend` to overlay the chart stage showing the symbol details, OHLC metrics, and an interactive status dot.
- Built a timezone-aware, responsive timings popover containing a visual timeline with markers (`Pre-open`, `Open`, `Close`), a real-time cursor indicator (when open), and support for both ticking countdowns (when open/pre-market) and static notifications (when closed). Updated the popover header to display the corresponding SVG status icon matching the current market state.
- Configured `symbolTitle` and `symbolValues` status line settings to default to `true` inside `createDefaultChartSettings()`, enabling the SeriesLegend overlay automatically on initial startup.
- Wired `SeriesLegend` into `ChartManager` and `MultiChartWorkspace` to support multi-pane charts and live hover coordinate updates.
- Added comprehensive styles in `style.css` supporting the white theme, status dot color variations, popover card design, and timeline tracks. Updated CSS rules to size the SVG icons at 18px, remove borders, and apply status colors.
- Modified the popover logic to conditionally close during component re-render only if the status dot element is not found in the DOM (e.g. legend hidden or component destroyed), resolving flickering on real-time chart ticks.

### Volume Source Selection via Search in Online Mode
- Implemented search-callback support in [SymbolSearchModal.ts](src/ui/SymbolSearchModal.ts) via a custom `onSelect` callback payload to allow selecting any symbol from online search without changing the active chart symbol.
- Integrated search capability into [getSourceSymbolOptions](src/config/symbols.ts) by displaying the currently active custom symbol and offering a "Search online symbol..." trigger dropdown option when in online mode.
- Wired search trigger and selection callbacks into the volume source select fields of all drawing overlay settings modals: [SessionVolumeProfileModal.ts](src/ui/SessionVolumeProfileModal.ts), [FixedRangeVolumeProfileModal.ts](src/ui/FixedRangeVolumeProfileModal.ts), [TpoProfileModal.ts](src/ui/TpoProfileModal.ts), and [VolumeClusterModal.ts](src/ui/VolumeClusterModal.ts).
- Integrated search triggers into [IndicatorSettingsModal.ts](src/ui/IndicatorSettingsModal.ts) for indicator volume source selection (e.g., Volume YSTC) to fully support selecting alternate symbols via search in online mode.
- Fixed z-index layering in [style.css](src/style.css) by increasing `.symbol-search-modal` z-index to `50` so that it renders in front of settings modals (z-index `45`/`46`) instead of behind them.
- Fixed exchange resolution in [symbols.ts](src/config/symbols.ts) for online-only derivatives (NFO/BFO) and indices (NSE_INDEX/BSE_INDEX) by implementing a smart `detectOnlineExchange` parser, preventing the "Volume source data unavailable" error on non-equity selections.
- Added missing `applySettings()` calls to `onSelect` callback triggers across all four technical overlay settings modals ([FixedRangeVolumeProfileModal.ts](src/ui/FixedRangeVolumeProfileModal.ts), [SessionVolumeProfileModal.ts](src/ui/SessionVolumeProfileModal.ts), [TpoProfileModal.ts](src/ui/TpoProfileModal.ts), and [VolumeClusterModal.ts](src/ui/VolumeClusterModal.ts)), ensuring custom online source symbol updates save and apply to the active overlays immediately.

### Online Historical Paging & Date Navigation
- Fixed a bug in [onlineLoader.ts](src/chart/onlineLoader.ts)'s cache logic where backward paging requests short-circuited when any bar older than the requested timestamp was found. It now only short-circuits if we have at least 100 bars older than the requested timestamp in cache, allowing scroll-paging to load earlier history seamlessly.
- Fixed a bug in [GoToDateModal.ts](src/ui/GoToDateModal.ts) where selected dates outside the currently loaded bar range were clamped to the earliest/latest loaded bar boundaries. It now allows returning the raw selected timestamp if it falls outside the range, triggering a new chart data window fetch to load older history from the server.

### Default Online Mode & NIFTY50-INDEX Startup
- Configured the application to default to `'online'` mode on initial boot in [main.ts](src/main.ts) when no mode is present in `localStorage`.
- Set the default symbol selection to `NIFTY` on the `NSE_INDEX` exchange with the `D` (Daily) timeframe in online mode in [symbols.ts](src/config/symbols.ts).
- Modified the main entry point's CSV checking logic in [main.ts](src/main.ts) to only require local CSV file imports when starting in offline mode, allowing online mode to initialize and run perfectly on empty setups.
- Mapped `NIFTY50` to the correct OpenAlgo live symbol `NIFTY` in `toLiveSymbol` in [onlineLoader.ts](src/chart/onlineLoader.ts) to resolve the Nifty 50 Index correctly and avoid the Symbol 'NIFTY50' not found error on startup.

### Online Mode Timezone Fix
- Removed the `IST_OFFSET_SECONDS` (+5:30 hours) addition from online history bars in [onlineLoader.ts](src/chart/onlineLoader.ts) and live tick timestamps in [chartInit.ts](src/chart/chartInit.ts).
- OpenAlgo returns proper UTC epoch timestamps; KlineCharts already applies the configured `Asia/Kolkata` timezone for display via `chart.setTimezone()`. The IST offset was double-shifting timestamps, causing online candles to appear 5.5 hours ahead of correct market times.
- Online mode now shows timestamps consistent with offline CSV mode.

### OpenAlgo WebSocket Real-time Integration
- Implemented a unified OpenAlgo WebSocket Client in [wsClient.ts](src/openalgo/wsClient.ts) to connect, authenticate with API keys, reply to heartbeats (`ping`/`pong`), auto-reconnect with exponential backoff, and manage subscriptions dynamically.
- Integrated WebSocket subscriptions with the chart data loader's `subscribeBar` and `unsubscribeBar` callbacks in [chartInit.ts](src/chart/chartInit.ts) to route live quotes (`tick:update`) to the active chart.
- Aligned real-time tick timestamps to current timeframe bar boundaries using UTC epoch milliseconds, consistent with how KlineCharts displays dates via `setTimezone('Asia/Kolkata')`.
- Wired WebSocket state transitions into [ChartManager.ts](src/chart/ChartManager.ts) to establish connection on startup or mode changes.
- Integrated real-time market data into the Order Panel in [OrderPanel.ts](src/ui/OrderPanel.ts), dynamically updating bid/ask prices on action/submit buttons and showing a premium, 5-row Depth of Market (DOM) table with relative volume bar backgrounds in the `DOM` tab.
- Added premium CSS grid styling and background relative bar gradient fills in [style.css](src/style.css) for the DOM table.

### Countdown to Bar Close
- Implemented the "Countdown to bar close" setting in [SettingsModal.ts](src/ui/SettingsModal.ts) as a dynamic checkbox bound to scales configuration.
- Added a `formatExtendText` callback in `buildChartFormatter` inside [chartSettings.ts](src/chart/chartSettings.ts) to compute the remaining duration for the current candlestick.
- Verified that countdown calculates correctly using UTC epoch timestamps in online mode, updates dynamically every second, and respects visibility toggles.

### WebSocket Subscription Cleanup (Ghost Candles & Daily Stats Fix)
- Implemented a local `activeSubscriptions` Map in [chartInit.ts](src/chart/chartInit.ts) to track the exact subscription parameters (exchange, fileCode) associated with a symbol ticker and timeframe.
- Updated `unsubscribeBar` inside `createDataLoader` to retrieve the correct parameters from `activeSubscriptions` and unsubscribe the event handler from `eventBus` and the feed from `wsClient`, resolving the timing mismatch where active selections updated before unsubscribe events occurred.
- Modified the real-time quote tick processor inside `subscribeBar` to calculate timeframe-specific candle bounds incrementally from the chart's current candles (`chart.getDataList()`) instead of mapping open/high/low to the broker's daily session statistics.
- Added a `mode:change` listener in [chartInit.ts](src/chart/chartInit.ts) to cleanly unsubscribe event handlers and clear local state maps when switching to offline mode.
- Modified `wsClient.disconnect()` in [wsClient.ts](src/openalgo/wsClient.ts) to clear the active subscriptions map, preventing stale subscriptions from reconnecting when returning online.

### Search Modal UI & Focus
- Fixed focus and selection cursor loss in the Symbol Search Modal and Indicator Modal by adding focus and text selection preservation logic across state re-renders in [BaseComponent](src/ui/BaseComponent.ts).
- Added the search icon to the SVG sprite sheet in [icons.svg](public/icons.svg) and registered `'search'` in [icons.ts](src/ui/icons.ts).
- Redesigned the search input in the [SymbolSearchModal](src/ui/SymbolSearchModal.ts) and [IndicatorModal](src/ui/IndicatorModal.ts) to be a modern floating search bar with rounded corners, a subtle background, active focus transitions, and highlight effects.

## 2026-06-15

### Symbol Search & Chart Fixes
- Added a timezone offset (`IST_OFFSET_SECONDS = 19800`) to incoming timestamps from the OpenAlgo REST API `/history` endpoint in online mode to correctly display candles in Indian Standard Time (IST).
- Refactored `getFetchDurationDays` to implement dynamic historical lookback range rules (e.g. 10 years for weekly/monthly, 2 years for daily, 180 days for hourly, and 15 or 90 days for minute intervals).
- Implemented `safeParseFloat` utility to prevent NaN propagation on history OHLCV values, and filtered out non-finite candle data, sorted candles, and removed duplicates.
- Refactored `SymbolSearchModal` to map broker search response fields robustly and sorted matches prioritizing exact matches, starts-with prefixes, Nifty 50 matches, and shorter symbol lengths.
- Added interactive filter tabs (All, Stocks, Futures, Options, Indices) to both online and offline symbol search modes, and styled the tabs using variables from the white theme.

### Online Mode
- Added a new "OpenAlgo" tab to the main Settings modal for configuring the Host URL, API Key (with show/hide eye toggle), WebSocket URL, and OpenAlgo Username.
- Persisted OpenAlgo connection parameters directly to `localStorage` on-the-fly.
- Persisted Online/Offline Mode selection in `localStorage` under `openchart_mode` and updated TopBar and Symbol Search Modal to initialize from it.
- Connected Symbol Search to OpenAlgo REST API `/search` in Online Mode, debouncing input queries by 300ms.
- Connected Chart historical data loading to OpenAlgo REST API `/history` in Online Mode, mapping timeframe codes to OpenAlgo interval strings, fetching date pages dynamically on chart scroll, and caching/merging bars.
- Enabled all standard timeframe intervals in online mode.
- Handled `mode:change` event in `ChartManager` to reset chart data and force-reload when switching modes.

### Volume Cluster
- Updated the default Volume Cluster marker colors to `#00E5FF` for bull markers and `#FFB300` for bear markers through the existing customizable color settings.
