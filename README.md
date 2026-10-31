# YSTC Charts (Trading Chart Platform for Retail Traders)

# Changelog

## 2026-10-31

### Feature: Polymorphic Broker Architecture & Complete BrokerAdapter Unification (src/broker/, src/chart/, src/ui/, SKILL.md)

- **Polymorphic Broker Adapter Contract (`src/broker/types.ts`, `src/broker/BrokerAdapter.ts`)**: Standardized the complete 22-method platform contract on `BrokerAdapter` interface, introducing `BrokerOrderModifyRequest`, `BrokerClosePositionRequest`, and `BrokerHoldingsData`. Added optional lifecycle methods `isConnected?()`, `connectWebSocket?()`, `modifyOrder?()`, `closePosition?()`, `getTrades?()`, and `getHoldings?()`, while making tick callbacks optional for chart and depth subscribers.
- **OpenAlgo & Fyers Adapter Parity (`src/broker/adapters/OpenAlgoAdapter.ts`, `src/broker/adapters/FyersAdapter.ts`)**: Upgraded both adapters to full contract parity. Added `isConnected()` state verification, lifecycle WebSocket controls (`connectWebSocket`, `disconnectWebSocket`), symbol format parsing supporting `symbol::exchange` and standard formats in `subscribeTicks`/`unsubscribeTicks`, order modification (`modifyOrder`), position squaring (`closePosition`), trade book fetching (`getTrades`), and portfolio holdings retrieval (`getHoldings`).
- **Polymorphic Charting & Live Tick Stream Isolation (`src/chart/onlineLoader.ts`, `src/chart/chartInit.ts`, `src/chart/ChartManager.ts`)**: Eliminated raw broker client imports from charting core. Replaced broker-specific REST fetches in `onlineLoader` with `activeBroker.getHistory()`. Unified chart candle tick subscriptions in `chartInit` and `ChartManager` through `activeBroker.subscribeTicks()` and `activeBroker.unsubscribeTicks()`. Delegated on-chart overlay drag-modification, cancellation, position squaring, and state synchronization directly to `activeBroker`.
- **Zero-Branching UI Component Integration (`src/ui/OrderPanel.ts`, `src/ui/OrderModal.ts`, `src/ui/AccountManager.ts`, `src/ui/OptionChainModal.ts`, `src/ui/RightOptionChainView.ts`)**: Stripped hardcoded broker switches (`activeBroker.id === 'fyers' ? ... : ...`) and raw client imports from UI components. Delegated order ticket submissions, DOM ladder trading, market depth resubscriptions, positions/trades/orders/funds/holdings payloads, multi-quote LTP prefilling, and modal option chain tick streams directly to polymorphic `activeBroker` methods.
- **Dynamic Broker Registration & Settings UI (`src/ui/SettingsModal.ts`)**: Replaced hardcoded broker selector radio buttons and dropdowns with dynamic runtime enumeration from `brokerManager.getAllBrokers()`, automatically rendering any registered broker in settings without requiring UI modifications.
- **Comprehensive Broker Integration Skill Governance (`.agents/skills/broker-integration/SKILL.md`)**: Updated the skill documentation with the full 22-method `BrokerAdapter` interface specification and documented the zero-branching UI contract ensuring all future broker integrations plug in seamlessly by implementing `BrokerAdapter` and registering with `BrokerManager`.

### Docs: Broker Integration Skill Architecture Synchronization (SKILL.md)

- **24-Hour IndexedDB Master Cache Architecture (`.agents/skills/broker-integration/SKILL.md`)**: Replaced deprecated master file download warnings with the production 24-hour IndexedDB Symbol Master Cache pattern (`ystc_master_cache`), documenting daily public CDN CSV parsing (`NSE_CM`, `BSE_CM`, `MCX_COM`, `NSE_FO`, `BSE_FO`), calendar date-tagging, automatic expiry purges, and sub-2ms local fuzzy search.
- **Web SDK Teardown Hardening & Index Depth Guard (`.agents/skills/broker-integration/SKILL.md`)**: Codified third-party Web SDK singleton teardown stubs (`isUserClosed: true`, `interval: 0`) to prevent asynchronous interval exceptions on disconnect, and mandated automatic suppression of Level 2 market depth subscriptions for cash index tickers (`-INDEX`).
- **Commodity Contract Lot Sizing & Unit Scaling Contract (`.agents/skills/broker-integration/SKILL.md`)**: Documented authentic MCX exchange multipliers (`MCX_COMMODITY_SPECS`) and the unit-to-lot order scaling contract converting platform units to broker API lots in `placeOrder` and normalizing incoming positions back to units in `getPositions`.
- **Commodity Option Chain Underlying & Master Synthesis Fallback (`.agents/skills/broker-integration/SKILL.md`)**: Documented active near-month futures underlying resolution for commodity option chains and master-backed strike ladder synthesis fallback when REST option endpoints return empty.
- **Right Dock Option Chain & Chart Isolation (`.agents/skills/broker-integration/SKILL.md`)**: Documented polymorphic WebSocket tick streaming for the Right Dock option chain view and chart-isolated quick action Buy/Sell buttons.

## 2026-10-30

### Feature: 24-Hour IndexedDB Symbol Master Cache & AI Dynamic Symbol Search (indexedDbCache.ts, symbolMaster.ts, FyersAdapter.ts, quoteService.ts, contractHelper.ts)

- **24-Hour IndexedDB Storage Cache (`src/utils/indexedDbCache.ts`, `src/fyers/symbolMaster.ts`)**: Built browser-level IndexedDB cache manager (`ystc_master_cache`) replacing the 5MB `sessionStorage` limit. Preloads and persists all daily Fyers public CDN segments (`NSE_CM`, `BSE_CM`, `MCX_COM`, `NSE_FO`, `BSE_FO`) tagged with calendar date (`YYYY-MM-DD`). Automatically refreshes daily or upon Fyers Access Token renewal, providing instant sub-2ms local searches across 60,000+ real exchange contracts without network latency.
- **Authentic Active Contracts & Expired Purge (`src/broker/adapters/FyersAdapter.ts`, `src/fyers/contractHelper.ts`)**: Streamlined `FyersAdapter.searchSymbols()` to query official daily master records directly from `fyersSymbolMaster`. Guarantees active contracts match Fyers live web (`BANKNIFTY26NOVFUT`, `BANKNIFTY26DECFUT`, `BANKNIFTY27JANFUT`) while completely eliminating expired monthly contracts (`26OCTFUT`). Added auto-roll calendar safeguard to `contractHelper.ts` ensuring fallback generators never advance into expired dates.
- **Dynamic AI Symbol Discovery Engine (`src/scripting/ai/quoteService.ts`)**: Upgraded quote resolution with `resolveSymbolTargetDynamic()` modeled after OpenAlgo's `search_symbols`. When traders ask colloquial company or brand queries (e.g. *"what is the price of jio"*, *"quote paytm"*, *"price of tata motors"*), dynamically searches the local IndexedDB broker master across ticker symbols and official descriptions, resolving `NSE:JIOFIN-EQ` (`JIO FIN SERVICES LTD`) with verified live broker quotes and 1-click `[ ⚖️ Compare NSE vs BSE ]` button. Eliminates static hardcoded dictionaries.

### Feature: Interactive Dual-Exchange Comparison Card (NSE vs BSE) & Markdown Table Engine (quoteService.ts, AICopilotView.ts, aiTools.ts, style.css)

- **Dual-Exchange Market Parity & Arbitrage Engine (`src/scripting/ai/quoteService.ts`)**: Built `fetchDualExchangeQuote()`, `fetchBseQuote()`, and `executeDualQuote()` allowing traders to compare cash equity instruments across both National Stock Exchange (NSE) and Bombay Stock Exchange (BSE). Resolves base equity tickers, concurrently queries active broker feeds (`NSE:SYMBOL-EQ` / `BSE:SYMBOL-A` / `BSE:SYMBOL`), and computes price spread (`NSE LTP - BSE LTP`), spread percentage (`(Spread / BSE LTP) * 100`), day range divergence, and relative volume ratio (`NSE Volume / BSE Volume`). Gracefully reports un-subscribed BSE broker segments without failing primary NSE quote data.
- **Interactive Action Button Injection & Eligibility Filtering (`src/scripting/ai/quoteService.ts`)**: Implemented `isDualListableEquity()` filtering out indices, commodities, and derivatives while recognizing dual-listed equities. Appends an interactive token `[[COMPARE_EXCHANGE:<symbol>]]` to single-quote reports for dual-listable equities.
- **Client-Side Markdown Table Parser & Interactive Chip Wiring (`src/ui/AICopilotView.ts`, `src/style.css`)**: Enhanced `formatMarkdown()` with `parseMarkdownTables()` converting standard GitHub-Flavored Markdown tables into styled semantic HTML (`<table class="ai-copilot__table">`) with scrollable wrapper (`.ai-copilot__table-wrap`). Replaced the comparison token with interactive chip `<button class="ai-copilot__action-chip ai-copilot__action-chip--compare">` (⚖️ Compare NSE vs BSE) wired to `executeDualQuote()` to stream the comparison card directly into the chat conversation with zero retyping.

### Fix: Strict Live Broker Quote Enforcement, Zero Offline Mixing & Fyers/OpenAlgo Protocol Payloads (FyersAdapter.ts, OpenAlgoAdapter.ts, quoteService.ts, aiTools.ts, AICopilotView.ts)

- **Fyers API v3 Symbol Normalization (`src/broker/adapters/FyersAdapter.ts`)**: Fixed `getQuotes()` to extract exchange and symbol tokens and route all ticker requests through `toFyersSymbol()`. Prevents raw `NSE:MRF` tokens from bypassing series suffixing, guaranteeing compliant `NSE:MRF-EQ` formatting accepted by Fyers REST endpoints.
- **OpenAlgo REST Quotes Payload Conformance (`src/broker/adapters/OpenAlgoAdapter.ts`)**: Refactored `getQuotes()` from invalid bulk `{ symbols: [...] }` payload to OpenAlgo v1 specification `POST /api/v1/quotes` with `{ symbol, exchange }` object schema, parsing response data object (`ltp`, `open`, `high`, `low`, `close`, `prev_close`, `volume`, `change`). Added multi-quote fallback via `POST /api/v1/multiquotes` and parallel individual requests.
- **Strict Online/Offline Execution Isolation (`src/scripting/ai/quoteService.ts`)**: Enforced strict zero-mixing between online broker feeds and offline CSV files. When `openchart_mode === 'online'`, quotes query exclusively from the active broker (`activeBroker.getQuotes()`); if the symbol is unlisted or connection drops, returns explicit broker diagnostic error (`⚠️ Live Broker Error: Could not retrieve real-time market quote for ... from <Broker>`) instead of silently serving stale historical CSV candles. In offline mode, queries strictly local CSV datasets.
- **Exchange Bleed Prevention & Intent Recognition (`src/ui/AICopilotView.ts`, `src/scripting/ai/aiTools.ts`)**: Updated `AICopilotView.ts` to prevent the active chart's exchange (e.g. `MCX`) from bleeding into external equity quote queries. Defaulted ambiguous equity queries to `NSE` as primary liquidity benchmark, while enhancing `detectUserChartIntent()` with natural language regexes recognizing explicit venue specifications (`"on BSE"`, `"in BSE"`, `"BSE:"`).

## 2026-10-29

### Feature: Multi-Symbol Real-Time Market Quotes in AI Copilot with Broker & Local Fallback (quoteService.ts, aiTools.ts, AICopilotView.ts, AICopilotHelpModal.ts, style.css)

- **Dedicated Multi-Symbol Quote Engine (`src/scripting/ai/quoteService.ts`)**: Built `fetchSymbolQuote()` and `resolveSymbolTarget()` allowing the AI Copilot to answer real-time market price inquiries for any symbol (e.g. *"What is the price of SBIN?"*, *"LTP of NIFTY"*, *"Quote RELIANCE"*, *"Current price of BANKNIFTY"*) even when not mounted on the active chart. Normalizes ticker aliases, resolves index exchanges (`NSE_INDEX`, `BSE_INDEX`) via `detectOnlineExchange()`, and connects to the active broker adapter (`BrokerManager.getInstance().getActiveBroker().getQuotes()`) when online.
- **Offline & Local CSV Data Fallback (`src/scripting/ai/quoteService.ts`)**: Implemented automatic fallback to local historical CSV datasets (`getCachedBars()`, `findLocalSymbol()`) when running in offline mode or when broker queries return empty, returning validated LTP, OHLC, volume, and percentage change computed from the latest candles.
- **Intent Interception & Context Prompt Enrichment (`src/scripting/ai/aiTools.ts`, `src/ui/AICopilotView.ts`)**: Extended `detectUserChartIntent()` to detect quote inquiries, resolve target symbols or default to the active chart symbol, and return structured `DetectedChartIntent` (`action: 'quote'`). Enriched `buildPromptWithChartContext()` with `[EXTERNAL SYMBOL QUOTE: ...]` injection, allowing the on-device LiteRT-LM to answer conversational trader questions using verified market prices with zero hallucination. Supports zero-model mode with instant response rendering.
- **Visual Quote Timeline Pill & Help Modal Catalog Sync (`src/scripting/ai/aiTools.ts`, `src/ui/AICopilotView.ts`, `src/style.css`, `src/ui/AICopilotHelpModal.ts`)**: Added gold-themed timeline pill `.ai-tool-pill--quote` (`[TOOL: get_quote: <symbol>]` with `✓ QUOTED` badge). Documented Function 7 (*Multi-Symbol Real-Time Market Quotes*) in `AICopilotHelpModal.ts` with natural prompt examples.

### Fix: Multi-Word Indicator Name Resolution, "add bb" Alias & Space-Tolerant Tool Pill Parsing (aiTools.ts, ChartManager.ts)

- **Indicator Name Normalization & "BB" Alias (`src/scripting/ai/aiTools.ts`, `src/chart/ChartManager.ts`)**: Implemented `normalizeIndicatorName()` mapping colloquial trader shortcuts and descriptive names (`bb`, `bollinger bands`, `bollinger`) to KlineCharts' authentic internal catalog name (`BOLL`). Extended `detectUserChartIntent()` regex to immediately intercept queries like *"add bb"* or *"plot bb"* with sub-10ms zero-latency execution. Added defensive normalization in `ChartManager.ts` inside the `eventBus.on('indicator:add')` listener ensuring that any multi-word or alias indicator request mounts the correct main-pane overlay on `candle_pane`.
- **Space-Tolerant Tool Tag Parsing & UI Pill Formatting (`src/scripting/ai/aiTools.ts`)**: Upgraded `parseAndExecuteToolsInResponse()` and `formatToolPills()` regexes from strict word characters `[A-Za-z0-9_-]+` to space-tolerant `[A-Za-z0-9_\s-]+`. Resolves issue where LLM responses containing multi-word tags (e.g. `[TOOL: add_indicator: Bollinger Bands]`) failed to execute on the canvas and remained unparsed as raw text instead of rendering as `.ai-tool-pill--indicator` timeline badges.

### Feature: Directional Supply/Demand Order Blocks, Full Help Modal Intent Parity & Pattern Fixes (chartGeometry.ts, aiTools.ts, AICopilotView.ts, AICopilotHelpModal.ts)

- **Directional Order Block Engine & Session Extreme Fallbacks (`src/chart/ai/chartGeometry.ts`)**: Upgraded `detectOrderBlockZones()` with `roleFilter: 'demand' | 'supply' | 'both'`. When querying demand zones (e.g. *"highlight nearest demand zone below current price"*), prioritizes zones at or below LTP ranked by closest distance. When querying supply zones (*"active supply zones overhead"*), prioritizes zones at or above LTP ranked by proximity. Added automatic session floor (`MAJOR DEMAND (FLOOR)`) and ceiling (`MAJOR SUPPLY (CEILING)`) preservation so high-timeframe inflection zones are never starved. Balanced mode (`both`) enforces an equal 50/50 demand/supply split.
- **Full Intent Parity with Help & Capabilities Catalog (`src/scripting/ai/aiTools.ts`, `src/ui/AICopilotView.ts`)**: Expanded `detectUserChartIntent()` to guarantee 100% execution parity across all 36 natural prompt examples documented in `AICopilotHelpModal.ts`:
  1. *Supply & Demand*: Extended vocabulary with `highlight`, `map`, `spot`, `demand zones`, and `supply zones`, feeding `detectZoneRoleFilter()`.
  2. *Candlestick Patterns*: Added pattern queries beginning with natural question phrasing (*"Are there any hammer or shooting star candles near support?"*, *"Spot any reversal signals"*).
  3. *Market Analysis*: Added natural briefing phrasings (*"What is the market bias and verdict for this session?"*, *"Give me an institutional market briefing"*).
  4. *Direct Technical Indicator Mounting*: Implemented zero-latency intent interception for mounting built-in indicators (*"Add RSI to the chart"*, *"Plot MACD indicator"*, *"Add EMA"*, *"Add Bollinger Bands"*, *"Add Supertrend"*, *"Add ATR"*, *"Add Volume"*), executing via `eventBus.emit('indicator:add')` even in zero-model mode.
- **Candlestick Pattern Bug Fixes & Doji Recognition (`src/chart/ai/chartGeometry.ts`)**: Fixed boolean evaluation bug on Morning Star detection where `!prev2.close &&` previously caused the pattern to always evaluate to `false` for real price candles. Added Doji pattern recognition (`body <= span * 0.1`) indicating indecision and pivot transitions.
- **Directional Timeline Pills & Help Sync (`src/scripting/ai/aiTools.ts`, `src/ui/AICopilotHelpModal.ts`)**: Added specialized timeline execution pills (`[TOOL: draw_zones:demand]`, `[TOOL: draw_zones:supply]`, `[TOOL: add_indicator: ...]`). Synchronized Sections 5.3 and 5.4 in `AICopilotHelpModal.ts` documenting directional order block behavior and updated pattern rules.

### Feature: Directional Context Awareness, 50/50 Balanced Allocation & Session Extreme Protection in S/R Geometry Engine (chartGeometry.ts, aiTools.ts, AICopilotView.ts, AICopilotHelpModal.ts)

- **Directional Role Filtering & Extreme Backfilling (`src/chart/ai/chartGeometry.ts`)**: Enhanced `detectSupportResistance()` with `roleFilter: 'support' | 'resistance' | 'both'`. Resolved algorithmic starvation where trending higher-low moves or V-bottoms dropped 100% of swing lows due to touch-count clustering criteria (`group.length >= 2`). Implemented single-pivot backfilling from unclustered structural swing lows and highs, guaranteeing that major inflection points and the absolute session extreme (floor/ceiling) are never discarded even if touched only once.
- **50/50 Balanced Allocation & Proximity Ranking (`src/chart/ai/chartGeometry.ts`)**: In balanced mode (`both`), enforces an equal 50/50 split (e.g. 2 supports below LTP and 2 resistances above LTP for `maxLevels = 4`) sorted by proximity to the current last traded price, preventing clustered resistance levels from crowding out supports.
- **Intent Context Awareness & Directional Execution (`src/scripting/ai/aiTools.ts`, `src/ui/AICopilotView.ts`)**: Enhanced `detectUserChartIntent()` with `detectLevelRoleFilter()` to discern whether the trader is asking specifically for supports (e.g. *"find strongest support levels below current price"*, *"mark floors"*, *"demand levels"*), resistances (*"overhead resistance"*, *"ceilings"*), or balanced levels (*"draw s/r levels"*). Updated `executeDrawLevels()`, `executeIntent()`, and `handleQuickAction()` to pass `roleFilter`, emit directional tool pills (`[TOOL: draw_levels:support]`, `[TOOL: draw_levels:resistance]`), and supply LLM prompt context with the correct directional role summary.
- **Documentation Synchronization (`src/ui/AICopilotHelpModal.ts`)**: Updated Section 5.2 in the AI Copilot help modal documenting directional role filtering, adaptive touch clustering, 50/50 balanced allocation, and structural extreme preservation.

### Feature: Natural Intent Interception, Zero-Latency Chart Execution & Visual Timeline Pills (aiTools.ts, AICopilotView.ts, LiteRTLMRunner.ts, AICopilotHelpModal.ts, style.css)

- **Natural Intent Interception Engine (`src/scripting/ai/aiTools.ts`, `src/ui/AICopilotView.ts`)**: Implemented `detectUserChartIntent()` and `executeIntent()` recognizing natural trader phrasing (e.g. *"draw s/r levels"*, *"mark support and resistance"*, *"draw supply and demand zones"*, *"scan candlestick patterns"*, *"clear markup"*). Immediately executes deterministic chart calculations on KlineCharts with sub-10ms latency the instant the user presses Enter, eliminating the requirement to manually type raw `[TOOL: ...]` syntax.
- **Immediate Tool State Injection & Few-Shot Prompt Conditioning (`src/scripting/ai/aiTools.ts`, `src/scripting/ai/LiteRTLMRunner.ts`)**: Enhanced `buildPromptWithChartContext()` to inform the LLM of already-executed canvas actions (`[ACTION TAKEN: The chart tool was already executed on the canvas...]`), instructing the model to discuss technical findings directly without confusion. Enriched `YSTC_SYSTEM_PROMPT` with few-shot dialog pairs training the local Gemma model to pair natural phrasing with tool command tags. Added intent deduplication to `parseAndExecuteToolsInResponse()`.
- **Visual AI Tool Timeline Pills (`src/scripting/ai/aiTools.ts`, `src/ui/AICopilotView.ts`, `src/style.css`)**: Built `formatToolPills()` transforming raw command tags (`[TOOL: draw_levels]`, `[TOOL: draw_zones]`, `[TOOL: find_patterns]`, `[TOOL: clear_markup]`, `[TOOL: add_indicator: ...]`) into sleek UI badges (`.ai-tool-pill`) styled with CSS variables, glowing badges (`✓ EXECUTED`, `✓ APPLIED`), and descriptive labels modeled after OpenAlgo's `ToolTimeline`.
- **Documentation & User Reference Synchronization (`src/ui/AICopilotHelpModal.ts`)**: Overhauled Section 6 into a comprehensive 9-part Capabilities & Function Catalog, providing full descriptions, syntax tags, and concrete natural prompt examples across every autonomous function (S/R Levels, Supply & Demand Zones, Candlestick Patterns, Market Structure Analysis, Clear Markup, Mounting Built-in Indicators, Monaco TypeScript Indicator Synthesis, Automated Strategy Synthesis, and 1-Click Error Diagnostics).

### Documentation & Governance: On-Device AI Copilot Technical Reference Modal & Agent Maintenance Rule (AICopilotHelpModal.ts, AICopilotView.ts, AGENTS.md, style.css)

- **Comprehensive AI Copilot Technical Reference Modal (`src/ui/AICopilotHelpModal.ts`, `src/ui/AICopilotView.ts`, `src/style.css`)**: Created an extensive user-facing documentation and help reference modal (`📖 Help & Capabilities`), modeled after the Script Editor's `SDKHelpModal.ts`. Accessible via the `(?)` help icon button (`help-center`) in the AI Copilot header, providing structured sections covering:
  1. *100% On-Device & Air-Gapped Privacy*: Explaining browser-isolated execution on local GPU via Google AI Edge LiteRT-LM Web and WebGPU with zero cloud telemetry.
  2. *Currently Supported Working Models*: Detailed specifications table for the 3 active Hugging Face models (`gemma-4-E2B-it-web.litertlm` [2B, ~2.5GB, 4GB VRAM], `gemma-4-E4B-it-web.litertlm` [4B, ~3.8GB, 6GB VRAM], `gemma-4-12B-it-web.litertlm` [12B, ~5.6GB, 12GB+ VRAM]) with parameter counts, VRAM targets, and Hugging Face search guidance.
  3. *Step-by-Step User Guide*: Clear sequence for checking WebGPU acceleration, selecting the local models directory via File System Access API with IndexedDB directory handle persistence, loading weights into GPU VRAM, using instant zero-model autonomous quick actions, and streaming scripts into the Monaco Editor.
  4. *Core Architectural Invariants*: Documented the 5 system invariants (Zero blind turns via `ChartContext`, `ai:{group}:{index}` namespace isolation protecting manual trader drawings, redraw-by-replacement, theme-integrated semantic tones, and zero-hallucination deterministic math).
  5. *Deterministic Geometry Math & Formulas*: Detailed mathematical breakdowns of 3-bar fractal pivot detection with adaptive significance ladder (`[12%, 9%, 6%, 3%, 0%]`), agglomerative support/resistance clustering, order block bounding box formulas, and candlestick reversal pattern recognition.
  6. *Autonomous Tool Commands & Natural Language Prompts*: Reference table of tool command syntax (`[TOOL: draw_levels]`, `[TOOL: draw_zones]`, `[TOOL: find_patterns]`, `[TOOL: clear_markup]`, `[TOOL: add_indicator]`) with real-world prompt examples.
  7. *Monaco Script Editor Bridge*: Documentation of 1-click script insertion and the `⚡ Fix with AI` error diagnostics bridge.
- **AI Agent Governance & Documentation Rule (`AGENTS.md`)**: Enforced a strict project rule under *AI Copilot Architecture & Governance Rules* mandating that whenever On-Device AI Copilot capabilities, tools, logic, or supported models are updated or altered, `AICopilotHelpModal.ts` (`📖 Help & Capabilities`) must be updated in lockstep to keep user-facing documentation fully synchronized.

### Feature: On-Device AI Copilot with Chart Agent Surface, Deterministic Geometry & Monaco Diagnostics Bridge (chartContract.ts, chartGeometry.ts, aiTools.ts, LiteRTLMRunner.ts, AICopilotView.ts, ScriptEditorPanel.ts, ChartManager.ts, MultiChartWorkspace.ts)

- **Chart Agent Surface Contract & Drawing Isolation (`src/chart/ai/types.ts`, `src/chart/ai/chartContract.ts`)**: Built the complete Chart Agent Surface contract defining `ChartContext`, `AgentShape`, and `AgentChartCommand` specifications. Implemented the `ai:{group}:{index}` namespace isolation manager on KlineCharts v10, guaranteeing that AI-generated visual overlays (`level`, `trendline`, `zone`, `marker`) coexist safely without mutating or deleting the trader's manual drawings. Implemented group redraw-by-replacement and theme-integrated semantic tone resolution (`bullish`, `bearish`, `neutral` mapping directly to CSS variables `var(--up-color)`, `var(--down-color)`, `var(--border-strong)`).
- **Zero-I/O Deterministic Chart Geometry Engine (`src/chart/ai/chartGeometry.ts`)**: Created a pure TypeScript mathematical geometry engine ported from OpenAlgo with zero network/disk I/O. Implements 3-bar fractal pivot detection with an adaptive significance ladder (`[0.12, 0.09, 0.06, 0.03, 0.0]`), agglomerative support/resistance clustering with validated touch counts, institutional demand & supply order block extraction, multi-bar candlestick pattern recognition (Hammer, Shooting Star, Engulfing, Morning/Evening Star), and market structure trend analytics (HH/HL/LH/LL, BOS, CHoCH). All prices and coordinates strictly originate from authentic candle prints, eliminating price hallucinations.
- **Autonomous AI Tool Execution & Prompt Pipeline (`src/scripting/ai/aiTools.ts`, `src/scripting/ai/LiteRTLMRunner.ts`)**: Implemented autonomous chart tooling (`read_chart`, `draw_levels`, `draw_zones`, `find_patterns`, `clear_markup`, `add_indicator`) with offline deterministic fallback execution. Enhanced `LiteRTLMRunner` system prompt with chart tool signatures, dynamic `ChartContext` prompt injection, and response parsing to trigger visual canvas markups automatically upon model inference.
- **Active Chart Context Banner & Autonomous Quick Action Chips (`src/ui/AICopilotView.ts`, `src/style.css`)**: Enhanced `AICopilotView` with an active chart context banner (`Symbol • Timeframe • LTP`) synchronized live with `symbol:change` and `tick:update`. Added 5 quick action chips (🏛️ Analyze Structure, 🎯 Draw S/R Levels, 📦 Supply/Demand Zones, 🕯️ Find Patterns, 🧹 Clear Markup) providing instant on-chart visual analysis even when running in zero-model mode.
- **Monaco Script Editor AI Bridge & 1-Click Error Diagnostics (`src/ui/ScriptEditorPanel.ts`, `src/ui/AICopilotView.ts`)**: Integrated a 1-click `⚡ Fix with AI` button into the Monaco Script Editor console upon runtime compilation or syntax errors. Automatically dispatches the script code, exact line number, and error message to `AICopilotView` via `ai:copilot:fix-script` to stream repaired `@ystc/sdk` TypeScript code ready for 1-click re-injection.
- **Workspace & Chart Manager Event Bus Integration (`src/chart/ChartManager.ts`, `src/chart/MultiChartWorkspace.ts`)**: Exposed `getChart()`, `getChartContext()`, and `executeAgentCommand()` on `ChartManager`. Wired `ai:chart:context:request` and `ai:chart:command` listeners into `MultiChartWorkspace`, ensuring AI commands seamlessly resolve and target the active chart pane in multi-chart layouts.
- **Local Model File Name & Extension Resolution Fix (`src/scripting/ai/LocalModelDirectoryService.ts`, `src/ui/AICopilotView.ts`)**: Resolved `NotFoundError: A requested file or directory could not be found` when loading local `.litertlm` models into WebGPU. In `AICopilotView.updateModelDropdown()`, populated option values with `m.filename` containing authentic file extensions instead of bare display names. Upgraded `LocalModelDirectoryService.getModelFile()` to search across `filename`, `path`, and clean `name`, auto-scan when model list is empty, and retry path lookups with `.litertlm` appended, guaranteeing immediate resolution of loaded model files on disk.

### Fix: MCX Commodity Contract Lot Sizing, Multiplier Margins & Fyers API Lot Scaling (metadata.ts, symbolMaster.ts, FyersAdapter.ts, orders.ts)

- **MCX Commodity Specifications Registry (`src/fyers/metadata.ts`)**: Built `MCX_COMMODITY_SPECS` and `getMcxCommoditySpec()` mapping authentic exchange contract multipliers, tick sizes, and freeze limits across all standard MCX commodities (`CRUDEOIL`: 100, `CRUDEOILM`: 10, `NATURALGAS`: 1250, `NATGASMINI`: 250, `GOLD`: 100, `GOLDM`: 10, `SILVER`: 30, `SILVERM`: 5, `COPPER`: 2500, `ZINC`: 5000, `LEAD`: 5000, `ALUMINIUM`: 5000). Enhanced `getFyersSymbolMetadata()` to resolve MCX commodities against these contract specifications and auto-register them in `symbolLotSizeRegistry`.
- **Fyers Symbol Master MCX Contract Multiplier Resolution (`src/fyers/symbolMaster.ts`, `src/broker/adapters/FyersAdapter.ts`)**: Upgraded `parseCsvLine()` to resolve authentic exchange contract multipliers whenever parsing `MCX_COM.csv` records where Fyers provides raw `lotSize: 1`. Added defensive fallback in `FyersAdapter.getSymbolMetadata()` overriding cached `lotSize <= 1` records with authentic MCX commodity specifications, preventing stale session storage records from defaulting to 1.
- **Fyers API v3 Lot Conversion & Position Normalization (`src/fyers/orders.ts`)**: In `placeFyersOrder()`, automatically converts unit quantities (e.g. 100 units for 1 lot of Crude Oil) to Fyers' required API specification (`qty: Math.max(1, Math.round(order.quantity / lotSize))`) for MCX orders, ensuring full order ticket parity and real-time margin calculations (`₹1,93,800.00` for 100 units at 5x MIS leverage) while transmitting valid lot counts to Fyers without API rejections. Normalized incoming MCX net position quantities in `getFyersAccountPositions()` to contract units for consistent Account Manager lot tracking.

## 2026-10-27

### Fix: Right Dock Option Chain Floating Actions, Close Event Propagation & Socket Stream Health (RightOptionChainView.ts, RightDock.ts, wsClient.ts, style.css)

- **Side-Specific Floating Quick Actions (`src/ui/RightOptionChainView.ts`, `src/style.css`)**: Resolved visual bugs and layout jumping where Buy and Sell action buttons pushed table numbers or left hollow placeholder boxes. Encapsulated cells within `.right-optionchain__cell-inner` and anchored `.right-optionchain__quick-actions` with `display: none` by default, floating smoothly over LTP prices with `box-shadow` and `var(--bg-primary)` backgrounds strictly when hovering over the respective Call (`.cell-ce:hover`) or Put (`.cell-pe:hover`) side.
- **Right Panel Close Event & Visibility Propagation (`src/ui/RightDock.ts`, `src/ui/RightOptionChainView.ts`)**: Fixed close button failure inside the right panel header by explicitly toggling the `.hidden` class on `#right-panel` inside `RightDock`'s `right-panel:close` handler and in the close button click listener.
- **WebSocket Underlying Scope & SDK Conversion Error Filter (`src/ui/RightOptionChainView.ts`, `src/fyers/wsClient.ts`)**: Pruned invalid `underlying::NFO` socket subscription requests from option chain subscription queues, preventing Fyers Web SDK from requesting unregistered spot tickers. Filtered benign Fyers SDK internal `error converting message` console logs during socket unsubscription tear-down.

### Feature: Right Dock Option Chain Panel with Dynamic Column Customization (RightOptionChainView.ts, RightDock.ts, OrderPanel.ts, icons.ts, style.css)

- **Dedicated Right Panel Option Chain Component (`src/ui/RightOptionChainView.ts`)**: Created a compact, high-performance DOM option chain view for the right sliding sidebar. Includes live underlying tracking from active chart symbols, exchange selector (`NFO`, `BFO`, `MCX`, `CDS`), dynamic expiry dropdown, strike count selector (`5`, `10`, `15`, `20`, `All`), compact statistics summary bar (Spot with percentage change, ATM strike, PCR), live ATM scroll auto-centering, and live spot-price divider badges between adjacent strikes.
- **Dynamic Column Customization & Bar Settings Popover (`src/ui/RightOptionChainView.ts`)**: Built a column settings popover allowing users to selectively toggle active Call and Put columns (`OI`, `Vol`, `B.Qty`, `Bid`, `LTP`, `Ask`, `A.Qty`, `Spread`) to fit narrower dock layouts, defaulting to a clean 5-column layout (`CE OI`, `CE LTP` | `Strike` | `PE LTP`, `PE OI`). Added radio selectors for OI vs Volume depth bars with local persistence in `localStorage` under `oa_right_optionchain_prefs_v1`.
- **Identical Quick Action Buy/Sell & Charting Navigation (`src/ui/RightOptionChainView.ts`)**: Implemented hover-activated Buy ("B") and Sell ("S") action buttons on option strikes that dispatch `order:panel:select-symbol` to open the Order Ticket pre-filled with the option contract, action side, and live LTP without disrupting the chart's underlying view. Clicking option cells directly emits `symbol:change` to chart individual option contracts.
- **Right Dock Rail & View Switch Integration (`src/ui/RightDock.ts`, `src/ui/OrderPanel.ts`, `src/ui/icons.ts`)**: Added the `options-chain` button to `RightDock` items directly beneath Watchlist, wired `'optionchain'` view into `RightPanelView` lifecycle management within `OrderPanel`, and registered `'options-chain'` viewBox (`0 0 28 28`) in `icons.ts`. Ensured WebSocket tick subscriptions cleanly start on dock activation and detach on dock close or view switch.
- **Theme-Integrated Right Option Chain Styling (`src/style.css`)**: Styled `.right-optionchain` using pure CSS variables (`var(--token)`), including custom ITM/OTM soft shading, real-time green/red tick flashing animations on LTP updates, spot price badge markers, and sticky headers.

### Fix: Option Chain Buy/Sell Chart Isolation & Strike Quote Forwarding (OrderPanel.ts, OrderModal.ts, OptionChainModal.ts)

- **Chart Isolation on Option Strike Trading (`src/ui/OrderPanel.ts`)**: Removed unintended `eventBus.emit('symbol:change', ...)` from `order:panel:select-symbol` event handler. Clicking individual Buy ("B") or Sell ("S") buttons on option strikes in `OptionChainModal` now routes symbol and exchange directly to `order:modal:open`, preserving the active background chart on the underlying equity or commodity without switching the chart view.
- **Accurate Strike Price & Active Chart Fallback (`src/ui/OrderModal.ts`)**: Enhanced `order:modal:open` listener to accept strike-specific price data (`ltp`) when opened from option chain rows, displaying authentic option premiums and quantity/lot calculations. Preserved `activeChartSelection` state so opening the order ticket from TopBar Buy/Sell buttons automatically trades the active chart symbol rather than retaining previous derivative contracts.
- **Strike Quote Forwarding on Quick Action Buttons (`src/ui/OptionChainModal.ts`)**: Bound `row.ce?.ltp` and `row.pe?.ltp` to `data-option-ltp` on strike action buttons and passed real-time option LTP directly through `openOptionInTradePanel()`, ensuring the Order Ticket initializes with the exact strike quote.

### Fix: MCX Option Chain Underlying Resolution, Master-Backed Synthesis & Dynamic Search (optionChain.ts, symbolMaster.ts, OptionChainModal.ts)

- **MCX Near-Month Futures Underlying Resolution (`src/fyers/optionChain.ts`, `src/fyers/symbolMaster.ts`)**: Upgraded `resolveFyersUnderlying()` to resolve bare MCX commodity roots (e.g. `GOLDM`, `CRUDEOIL`) to their active near-month futures contract ticker (`MCX:GOLDM26NOVFUT`) using `fyersSymbolMaster.getNearMonthFuture()`, strictly conforming to Fyers API v3 specification that commodity option chains require an active futures underlying.
- **Master-Backed Expiry Extraction & Option Chain Synthesis (`src/fyers/optionChain.ts`, `src/fyers/symbolMaster.ts`)**: Built `getOptionExpiriesFromMaster()` and `synthesizeOptionChainFromMaster()` extracting authentic option contracts and expiries directly from cached `MCX_COM` symbol master records. Added fallback in `fetchFyersOptionExpiries()` and `fetchFyersOptionChain()` to synthesize complete Call/Put strike ladders and batch-enrich with live market quotes whenever REST API endpoints return 0 expiries or errors for commodity contracts.
- **Dynamic Underlying Autocomplete & Symbol Search Button (`src/ui/OptionChainModal.ts`)**: Replaced static 3-item list with dynamic suggestions from `fyersSymbolMaster.getUnderlyingsByExchange()`, automatically populating all active F&O equities, indices, and MCX commodities (`GOLDM`, `SILVERM`, `NATURALGAS`, `COPPER`, `TMPV`, etc.). Added dedicated search picker button (`oa-optionchain-search-btn`) opening the full 3-column Symbol Search modal.
- **Stale Option Chain State & Summary Reset (`src/ui/OptionChainModal.ts`)**: Implemented `resetSummary()` and added explicit error clearing in `refresh()` and `loadChain()`, guaranteeing stale strike rows and unrelated spot/ATM metrics are purged when switching symbols or encountering errors.

### Feature: Universal Fyers Multi-Segment Symbol Master & MCX F&O Option Chain (symbolMaster.ts, contractHelper.ts, FyersAdapter.ts, optionChain.ts, OptionChainModal.ts, SymbolSearchModal.ts)

- **Universal Multi-Segment Symbol Master Engine (`src/fyers/symbolMaster.ts`)**: Built a client-side symbol master service downloading and parsing Fyers' public CDN symbol master CSV files (`NSE_CM`, `BSE_CM`, `MCX_COM`, `BSE_FO`, `NSE_FO`) with native CORS support (`Access-Control-Allow-Origin: *`). Implemented in-memory caching and daily `sessionStorage` persistence for sub-2ms multi-token fuzzy and prefix search across ~10,000+ instruments.
- **Corporate Demerger & Alias Normalization (`src/fyers/contractHelper.ts`)**: Resolved the Tata Motors corporate demerger by replacing legacy `TATAMOTORS` with active `TMPV` (Lot: 1600, Step: 10) and `TMCV`, adding flexible space-normalized aliases (`TATA MOTOR`, `TATA MOTORS`, `TMPV`, `TMCV`) and MCX commodity specifications (`CRUDEOIL`, `GOLD`, `SILVER`, `NATURALGAS`).
- **Universal Multi-Broker Search & Authentic Metadata (`src/broker/adapters/FyersAdapter.ts`)**: Overhauled `FyersAdapter.searchSymbols()` to merge dynamic contract generation with universal symbol master results, preserving institutional hierarchy (underlying spot -> sequential 3-month futures -> ATM/near options -> commodity contracts). Updated `getSymbolMetadata()` to pull authentic exchange lot sizes and tick sizes directly from symbol master records for equities, derivatives, and MCX commodities.
- **Full MCX Option Chain Support (`src/fyers/optionChain.ts`, `src/ui/OptionChainModal.ts`)**: Enhanced `resolveFyersUnderlying()` to route MCX commodity underlyings (`CRUDEOIL`, `GOLD`, etc.) to official `MCX:` ticker formats rather than defaulting to `NSE:*-EQ`. Added commodity auto-detection in `OptionChainModal.open()` to automatically select the `MCX` exchange segment and render complete Call/Put strike ladders, bid/ask depth, and open interest for commodity options.
- **Multi-Segment UI Search Filtering (`src/ui/SymbolSearchModal.ts`)**: Extended `formatTypeMeta()` and segment tab filtering (`All`, `Stocks`, `Futures`, `Options`, `Indices`) to cleanly classify and filter MCX commodity futures (`Futures MCX`), commodity options (`Options MCX`), and spot contracts.

### Fix: Paper Broker Symbol Alias Normalization & Resilient Market LTP Lookup (PaperBroker.ts, OrderPanel.ts, OrderModal.ts)

- **Canonical Symbol LTP Storage & Multi-Variant Indexing (`src/paper/PaperBroker.ts`)**: Upgraded `updateLtp()` to index streaming ticks under raw symbol, uppercase representation, canonical live symbol via `toLiveSymbol()`, and auto-derived `-EQ` / base variants. Stored `rawSymbol` when available from broker WebSocket feeds (such as Fyers WebSocket emitting canonical ticker alongside raw broker symbol).
- **Resilient LTP Lookup & Market Order Price Fallback (`src/paper/PaperBroker.ts`)**: Built a robust `getLtp(symbol)` resolver searching direct symbol match, uppercase match, canonical live symbol (`toLiveSymbol`), plain symbol without exchange prefix, and `-EQ` variant lookups. Added fallback in `placeOrder()` to use order request captured price if real-time tick map lookup returns zero, preventing erroneous "No price quote available" rejections when placing market orders on symbols formatted with `-EQ` suffixes (e.g. `SBIN-EQ`).
- **Candle Close Price Fallback in Order Panels (`src/ui/OrderPanel.ts`, `src/ui/OrderModal.ts`)**: Enhanced `tick:update` listeners in `OrderPanel` and `OrderModal` to fall back to `payload.close` / `payload.last_price` if `payload.ltp` is not populated on incoming tick/candle objects, ensuring internal order state maintains an active, non-zero LTP across all broker feed formats.

## 2026-10-26

### Fix: Paper Trading Account Reset & Telegram Alert Deduplication (AccountManager.ts, PaperBroker.ts, telegram.ts)

- **Eliminated Duplicate Reset Event Emissions (`src/ui/AccountManager.ts`)**: Removed redundant sequential emission of both `paper-account:reset` and `paper-account:reset-funds` in `AccountManager` confirmation handler, which had previously caused the simulated broker to execute two full account resets and post duplicate summary alerts back-to-back. Corrected add-funds action to dispatch `paper-account:deposit`.
- **Broker Reset & Summary Alert Debounce (`src/paper/PaperBroker.ts`)**: Added a 1000ms debounce guard to `resetAccount()` and a 2000ms debounce guard to `sendPaperSummaryAlert()`, preventing duplicate account state modifications and ensuring only a single summary message is triggered during rapid user interactions or concurrent reset calls. Added alias handler for `paper-account:add-funds`.
- **Global Telegram Duplicate Suppression (`src/utils/telegram.ts`)**: Implemented an in-memory timestamped message hash deduplication cache within `sendTelegramMessage()`, automatically dropping identical message payloads directed to the same recipient chat ID within a 2000ms window across all notification categories (orders, rejections, summaries, price alerts, and system toasts).

### Fix: Fyers Web SDK WebSocket Teardown & Graceful Disconnect Fix (wsClient.ts)

- **Graceful Socket Teardown Stub (`src/fyers/wsClient.ts`)**: Fixed `Uncaught TypeError: Cannot read properties of null (reading 'interval')` thrown by the Fyers Web SDK (`index.min.js`) when toggling off Broker Feed (online mode). Ensured `disconnect()` preserves a safe teardown stub on `SocketConstructor.instance` (`isUserClosed: true`, `interval: 0`, `secondcountertimer: 0`) rather than prematurely nulling the constructor singleton, allowing the SDK's internal asynchronous WebSocket `onclose` handler to clear its ping/reconnect intervals cleanly without null dereferencing.
- **Duplicate Close Guard & Reconnect State Preservation (`src/fyers/wsClient.ts`)**: Prevented `index.min.js: socket already closed` console warnings by skipping duplicate `.close()` invocations on sockets already marked `isUserClosed` in both `clearFyersSdkSingleton()` and `connect()`.
- **Unhandled SDK Error Filter (`src/fyers/wsClient.ts`)**: Added an unhandled window error suppressor specifically catching legacy Fyers CDN teardown interval exceptions and duplicate close notifications during broker mode transitions.

### Feature: Multi-Broker Option Chain & Fyers Greeks Integration (BrokerAdapter.ts, FyersAdapter.ts, OpenAlgoAdapter.ts, OptionChainModal.ts, optionChain.ts, icons.svg, SKILL.md)

- **Universal Option Chain Broker Abstraction (`src/broker/types.ts`, `src/broker/BrokerAdapter.ts`)**: Extended the multi-broker interface with `getOptionExpiries?(symbol: string, exchange: string): Promise<string[]>` and `getOptionChain?(symbol: string, exchange: string, expiry?: string, strikeCount?: number): Promise<BrokerOptionChainData | null>`. Introduced normalized interfaces `BrokerOptionLeg`, `BrokerOptionChainRow`, and `BrokerOptionChainData` supporting spot price, ATM strike, PCR, total call/put OI, Greeks (Delta, Theta, Gamma, Vega, IV), and bid/ask depth.
- **Native Fyers Option Chain & Greeks Service (`src/fyers/optionChain.ts`, `src/broker/adapters/FyersAdapter.ts`)**: Built a dedicated Fyers v3 Option Chain client querying the official `data/options-chain-v3?symbol=...&strikecount=...&greeks=1` endpoint (with automatic fallback to `data/optionschain`). Resolves underlying symbols to official Fyers index format (e.g. `NSE:NIFTY50-INDEX`, `NSE:NIFTYBANK-INDEX`, `NSE:FINNIFTY-INDEX`, `BSE:SENSEX-INDEX`) and equity format (`NSE:SBIN-EQ`), probes available expiration timestamps, groups call and put strikes into unified rows, computes PCR and ATM strikes, and extracts India VIX.
- **Option Chain Active Symbol Auto-Sync & Exchange Segment Mapping (`src/ui/OptionChainModal.ts`)**: Enhanced `open()` and `syncFromActiveSymbol()` to detect active chart symbols (e.g. `SENSEX-INDEX`, `BANKNIFTY`), automatically synchronizing the underlying input and mapping BSE instruments (`BSE`, `BSE_INDEX`) to `BFO` and NSE instruments to `NFO`.
- **Fyers WebSocket Index Ticker Normalization (`src/fyers/symbolHelper.ts`)**: Normalized all index variations (`NIFTY`, `NIFTY-INDEX`, `BANKNIFTY`, `BANKNIFTY-INDEX`, `SENSEX`, `BANKEX`, `MIDCPNIFTY`) to exact official Fyers `index_dict` keys (`NSE:NIFTY50-INDEX`, `NSE:NIFTYBANK-INDEX`, `BSE:SENSEX-INDEX`, `BSE:BANKEX-INDEX`, `NSE:MIDCPNIFTY-INDEX`). Prevents Fyers Web SDK from throwing `map key not found for index Object subscribe` errors during WebSocket initialization.
- **Fyers WebSocket Index Depth Guard & Verbose Error Logging (`src/fyers/wsClient.ts`)**: Added protective check in `subscribe()` and `unsubscribe()` to automatically disable `isDepth` when subscribing to index instruments (`-INDEX`), respecting the broker constraint that market depth (Level 2 DOM) does not exist on spot cash indices. Enhanced socket error listeners to stringify error payloads in console.
- **OpenAlgo Adapter Option Chain Delegator (`src/broker/adapters/OpenAlgoAdapter.ts`)**: Implemented `getOptionExpiries` and `getOptionChain` by delegating to OpenAlgo REST `/api/v1/expiry` and `/api/v1/optionchain`, keeping 100% backward compatibility for OpenAlgo users.
- **OptionChainModal Multi-Broker Decoupling (`src/ui/OptionChainModal.ts`)**: Eliminated hardcoded OpenAlgo REST calls (`openAlgoPost`) and direct `wsClient` dependencies. Routed expiry and chain loading through `activeBroker`. Dynamically routes real-time option strike quotes through `fyersWsClient` when on Fyers and `wsClient` when on OpenAlgo. Normalized underlying symbol formatting across brokers so Buy/Sell order dispatch and Chart viewing work seamlessly for both OpenAlgo and Fyers option contracts.
- **SVG Arc Syntax Fix (`public/icons.svg`, `src/assets/icons.svg`)**: Corrected an invalid SVG arc command in the volume profile icon symbol (`0 0 0 4z` -> `0 0 0 0 4z`), eliminating browser console syntax errors on load.
- **Broker Integration Skill Codification (`.agents/skills/broker-integration/SKILL.md`)**: Updated the broker integration skill guidelines with Section 3.F detailing the Multi-Broker Option Chain & Greeks architecture, contract expectations, and error handling rules for future broker implementations.

### Feature: Institutional Fyers Symbol Search, Derivative Contract Engine & 3-Column Modal (contractHelper.ts, quotes.ts, FyersAdapter.ts, SymbolSearchModal.ts, style.css)

- **Institutional Derivative Contract & Expiry Generator (`src/fyers/contractHelper.ts`)**: Built a deterministic contract generation engine resolving Indian indices (`BANKNIFTY`, `NIFTY`, `FINNIFTY`, `MIDCPNIFTY`, `SENSEX`) and top F&O equities (`SBIN`, `RELIANCE`, `HDFCBANK`, etc.). Accurately calculates official monthly expiry dates (last Tuesday for BankNifty, last Thursday for Nifty and equities) to generate 3 sequential chronological futures (`Near`, `Next`, and `Far` month). Fetches underlying LTP in real-time to center active ATM and near-the-money options strikes (CE and PE pairs), parsing direct strike queries and batch-verifying candidates against Fyers quote endpoints to extract official exchange contract descriptions.
- **Official Broker Description & Quote Enrichment (`src/fyers/quotes.ts`, `src/broker/types.ts`)**: Extended `BrokerQuote` and `FyersRawQuoteItem.v` to capture `v.description` and `v.short_name` from Fyers `/data/quotes` API responses, populating verified official human-readable contract descriptions directly into search results.
- **Hierarchical Ordering & FyersAdapter Integration (`src/broker/adapters/FyersAdapter.ts`)**: Overhauled `FyersAdapter.searchSymbols()` to strictly enforce institutional discovery hierarchy: (1) Underlying index or equity at the top, (2) Sequential chronological futures (`Near Month` → `Next Month` → `Far Month`), (3) Active ATM and strike-filtered options pairs. Accurately tags `instrumenttype` as `INDEX`, `FUT`, `CE`, `PE`, or `EQ`.
- **TradingView/Fyers 3-Column Table Header & Row Layout (`src/ui/SymbolSearchModal.ts`, `src/style.css`)**: Replaced duplicate text and crude badges with a standard 3-column table: `SYMBOL` (bold blue accent ticker e.g. `NSE:BANKNIFTY26OCTFUT`), `DESCRIPTION` (e.g. `BANKNIFTY 27 OCT 26 FUT`), and `TYPE / EXCHANGE` (e.g. `Futures NSE`, `Options NSE`, `Index NSE`, `Stock NSE`). Expanded modal panel width to `min(680px, calc(100vw - 24px))` and updated segment pill filtering (`All`, `Stocks`, `Futures`, `Options`, `Indices`) to include `INDEX` instrument types.
- **Broker Ranking Preservation (`src/ui/SymbolSearchModal.ts`)**: Bypassed client-side alphabetical/length sorting when the active broker is Fyers, preserving the adapter's curated hierarchical ranking and preventing underlying indices from being deprioritized beneath derivative contracts.

### Feature: Universal Broker Standardization & Fyers Parity Hardening (BrokerAdapter.ts, metadata.ts, wsClient.ts, OrderPanel.ts, OrderModal.ts, AccountManager.ts, SKILL.md)

- **Universal Broker Symbol Metadata & Depth Contract (`src/broker/types.ts`, `src/broker/BrokerAdapter.ts`, `src/broker/adapters/OpenAlgoAdapter.ts`)**: Introduced `BrokerSymbolMetadata` (`lotSize`, `tickSize`, `freezeQty`) and `BrokerMarketDepth` to the core broker abstraction layer. Implemented `getSymbolMetadata()` and `getMarketDepth()` in `OpenAlgoAdapter`, delegating to `/api/v1/symbol` and `/api/v1/depth` respectively.
- **Fyers Dynamic Lot Sizing & REST Depth Engine (`src/fyers/metadata.ts`, `src/broker/adapters/FyersAdapter.ts`)**: Built a dedicated metadata resolution engine resolving exchange specifications: 1 for Equities, standard contract lot sizes and freeze limits for Index Derivatives (`NIFTY`: 25, `BANKNIFTY`: 15/30, `FINNIFTY`: 25/40, `MIDCPNIFTY`: 50, `SENSEX`: 10, `BANKEX`: 15), and stock derivatives lookup. Implemented `fetchFyersDepth()` to query `data/depth?symbol=...&ohlcv_flag=1` for initial DOM ladder pre-seeding and live tick size extraction. Automatically registers resolved lot sizes in `marginHelper.registerSymbolLotSize()`.
- **OrderPanel & Floating OrderModal Decoupling (`src/ui/OrderPanel.ts`, `src/ui/OrderModal.ts`)**: Eliminated hardcoded OpenAlgo branching and static lotSize=1 defaults. Routed both panels to `await activeBroker.getSymbolMetadata(symbol, exchange)` and pre-seeded initial order book ladders via `activeBroker.getMarketDepth()`. Fixed the critical issue where F&O order quantities were not stepped or normalized in Fyers, preventing exchange rejections.
- **Fyers WebSocket Enterprise Hardening (`src/fyers/wsClient.ts`)**: Ported OpenAlgo's reliability protections into `FyersWebSocketClient`:
  - *Reference Counting*: Implemented `refCount` per subscription stream so unmounting or closing the OrderPanel or floating modal does not kill the active chart candle stream.
  - *Active Symbol & Position Protection*: Listens to `symbol:change` and `active-symbols:update` to ensure active chart candles and open positions are never dropped or purged during cleanup.
  - *Microtask Queue Batching*: Buffered rapid `subscribe()` and `unsubscribe()` calls via `queueMicrotask()` to eliminate socket wire congestion.
  - *Inactivity Watchdog*: Added a 10-second heartbeat checking `lastMessageAt`, automatically re-subscribing if a stream falls silent for > 45 seconds during market hours.
  - *Rate-Limited Safe Polling*: Throttled polling fallback to 2000ms intervals to prevent triggering Fyers 50 req/min rate limit errors and paused polling when document is hidden.
- **Account Manager Multi-Broker Position Streaming (`src/ui/AccountManager.ts`)**: Refactored `refreshLivePositionsWs()` to dynamically route WebSocket position tick subscriptions through the active broker's client (`fyersWsClient` or `wsClient`), fixing the defect where Fyers open positions had frozen P&L and MTM.
- **Broker Integration Skill Governance (`.agents/skills/broker-integration/SKILL.md`)**: Codified mandatory reference counting, active symbol watchdog protection, universal metadata contracts, and AccountManager multi-broker wiring into the project's official skill guide for all future brokers.

### Feature: UI Broker Feed Mode Toggle with Integrated Knob Indicator (TopBar.ts, style.css)

- **Label-First Toggle Layout (`src/ui/TopBar.ts`)**: Swapped the topbar toggle hierarchy so the "Broker Feed" text label is placed on the left and the interactive toggle switch is placed on the right, adhering to standard trading terminal design ergonomics.
- **Integrated Knob Live Indicator & Breathing Pulse (`src/ui/TopBar.ts`, `src/style.css`)**: Eliminated external dot elements in favor of directly utilizing the slider knob (`.mode-toggle__slider::after`) as the live connection and market status indicator. When offline, the knob rests on the left in neutral grey/white. When connected to broker, the knob slides right and dynamically inspects market hours: renders an active pulsing green knob with a 2-second glowing aura (`@keyframes mode-knob-pulse`) during open market sessions, and a solid green knob (`.mode-toggle__slider--solid`) during after-hours/closed sessions, providing seamless at-a-glance status with zero layout clutter.
- **TopBar Divider Separation (`src/ui/TopBar.ts`)**: Inserted a vertical divider between the Option Chain action button and the Broker Feed toggle, preventing visual concatenation between adjacent controls.

### Fix: Firefox SVG Icon Rendering & Monaco Web-Safe URI Security Policy (icons.ts, icons.svg, monacoManager.ts)

- **Inlined SVG Sprite for Cross-Origin Static Hosting (`src/ui/icons.ts`, `src/assets/icons.svg`)**: Resolved an issue where all toolbar, topbar, and dock icons were completely invisible on Firefox when hosted on GitHub Pages or custom HTTPS domains (`https://trade.ystc.in/`) under relative base paths (`--base ./`). Bundled `src/assets/icons.svg` via raw text import and auto-injected a hidden sprite container (`#ystc-icons-sprite`) directly into `document.body` at bootstrap. Replaced external fragment URLs with local same-document references (`#${name}`) accompanied by the `xlink:href` namespace (`http://www.w3.org/1999/xlink`), guaranteeing 100% synchronous first-frame icon rendering across Firefox, Safari, Chrome, and Edge without external subresource requests.
- **Monaco Web-Safe URI Schemes (`src/scripting/monacoManager.ts`)**: Replaced `file:///` URI schemes (`file:///script.ts`, `file:///node_modules/...`) with web-safe `ts:filename/` URIs. Eliminates Firefox's strict origin security exception (`Security Error: Content at https://trade.ystc.in/ may not load or link to file:///...`).

### Fix: Fyers Symbol Resolution, Derivative Prefix & Dynamic Search (symbolHelper.ts, onlineLoader.ts, FyersAdapter.ts, chartInit.ts)

- **Fyers Equity Derivative Exchange Prefix Correction (`src/fyers/symbolHelper.ts`)**: Resolved an issue where equity derivatives (e.g. `BANKNIFTY26OCTFUT`, `NIFTY26OCTFUT`) failed with HTTP 422 (`-300: Invalid symbol provided`) due to sending `NFO:` prefixes. Aligned symbology with Fyers API Reference format rules by enforcing `NSE:` prefix for all equity futures and options (e.g. `NSE:BANKNIFTY26OCTFUT`), while preserving `NFO` in `fromFyersSymbol()` for internal chart exchange routing.
- **Cross-Exchange Compatibility in Chart Tick Handler (`src/chart/chartInit.ts`)**: Enhanced the real-time WebSocket tick matcher to treat `NSE` and `NFO` as compatible for derivative contracts, allowing live ticks arriving with `NSE` prefix from Fyers to update chart bars selected with `NFO`.
- **Dynamic Derivative & Future Search Expansion (`src/broker/adapters/FyersAdapter.ts`)**: Upgraded `FyersAdapter.searchSymbols()` to dynamically generate current and next month future contract tickers (e.g. `BANKNIFTY{YY}{MMM}FUT`, `NIFTY{YY}{MMM}FUT`) and validate them against Fyers quote endpoints, displaying active contracts with accurate instrument types (`FUT`, `CE`, `PE`, `INDEX`, `EQ`) and live prices.
- **Informal Symbol Alias Translation (`src/fyers/symbolHelper.ts`, `src/chart/onlineLoader.ts`)**: Built an alias resolution layer mapping informal queries to official exchange tickers (`KOTAK` -> `KOTAKBANK`, `HDFC` -> `HDFCBANK`, `SBI` -> `SBIN`, `ICICI` -> `ICICIBANK`, `AXIS` -> `AXISBANK`, `BHARTI` -> `BHARTIARTL`, `BAJAJ` -> `BAJFINANCE`, `L&T` -> `LT`).

### Fix: Fyers Live Feed Tick Streaming & Depth of Market (DOM) Integration (wsClient.ts, chartInit.ts, onlineLoader.ts, OrderPanel.ts, OrderModal.ts, types.ts)

- **Fyers Market Depth Protocol & Subscription Integration (`src/fyers/wsClient.ts`)**: Implemented native Fyers WebSocket market depth subscription (`fyersdata.subscribe([symbol], true)`) and unsubscription (`fyersdata.unsubscribe([symbol], true)`). Added `depthSubscriptions: Set<string>` to preserve active depth streams across reconnections. Built parser for Fyers `type: 'dp'` depth frames extracting 5 bid levels (`bid_price1..5`, `bid_size1..5`, `bid_order1..5`) and 5 ask levels (`ask_price1..5`, `ask_size1..5`, `ask_order1..5`), dispatching normalized `tick:depth` events via `eventBus`.
- **Live Candle Tick Streaming & Symbol Suffix Normalization (`src/chart/onlineLoader.ts`, `src/chart/chartInit.ts`, `src/fyers/wsClient.ts`)**: Resolved an issue where live chart candles were stuck at reload time due to series suffix mismatch (`SBIN-EQ` vs `SBIN`). Upgraded `toLiveSymbol()` to strip exchange prefixes (`NSE:`) and equity series suffixes (`-EQ`, `-INDEX`) canonically. Updated `chartInit.ts` tick handler to match symbols via canonical root names (`toLiveSymbol(payload.symbol) === toLiveSymbol(liveSym)`), ensuring live ticks stream into the active candle and form new candles in real time.
- **Broker-Aware OrderPanel & OrderModal DOM Wiring (`src/ui/OrderPanel.ts`, `src/ui/OrderModal.ts`)**: Decoupled `OrderPanel` and `OrderModal` from hardcoded OpenAlgo `wsClient` calls. Wired `updateSubscriptions()`, `clearSubscriptions()`, and `resubscribeDepth()` to check active broker type via `brokerManager.getActiveBrokerType()`, routing 5-level depth subscriptions directly to `fyersWsClient` when active broker is Fyers, instantly populating the DOM order book ladder. Added `rawSymbol?: string` to `BrokerQuote` in `src/broker/types.ts`.

### Feature: Dedicated Telegram Tab in Settings Modal (SettingsModal.ts, icons.svg, icons.ts)

- **Dedicated Telegram Settings Tab (`src/ui/SettingsModal.ts`, `public/icons.svg`, `src/ui/icons.ts`)**: Decoupled Telegram Bot configuration from the generic Alerts tab into a dedicated first-class **Telegram** tab in the Settings sidebar with its own custom paper-plane vector icon. Grouped the interface into two focused sections: **Telegram Bot Configuration** (Bot Token with password eye toggle, Chat ID with 1-click **🔍 Auto-Detect My Chat ID** discovery, and live connection test) and **Automated Notification Channels** (master notifications toggle, order executions/fills, order rejections & SEBI rules, system toast mirror forwarding, and drawing/price alerts).
- **Cleaned Alerts Tab Organization (`src/ui/SettingsModal.ts`)**: Streamlined the Alerts tab to focus cleanly on chart line visibility (alert lines, active alerts only), on-screen floating toast notification preferences, alert sounds, audio volume controls, and secondary bridges.

### Fix: Expired Fyers Auth Runaway 401 Polling & Dynamic Session Renewal UX (tokenHelper.ts, wsClient.ts, client.ts, main.ts, SettingsModal.ts, style.css)

- **Fyers Token Expiry & Daily 6:30 AM IST Cutoff Module (`src/fyers/tokenHelper.ts`)**: Built a client-side JWT inspector and cutoff validation engine enforcing SEBI/Fyers daily 6:30 AM IST token expiration alongside JWT `exp` claims. Created `isFyersTokenExpired()` to verify session validity, `getFyersTokenStatus()` to compute human-readable status, remaining validity duration, and badge classes, and `extractAuthCode()` to automatically clean full redirect URLs (`https://trade.fyers.in/...auth_code=...`) into isolated authorization codes.
- **Runaway 401 Polling Prevention & Circuit Breaker (`src/fyers/wsClient.ts`, `src/fyers/client.ts`)**: Resolved an infinite loop defect where an expired access token threw `Failed to decode JWT: You are passing an expired token` on WebSocket initialization, causing the fallback handler to initiate an unthrottled 1.5s interval polling `data/quotes` that returned repeated 401 and 429 rate limit errors. Added upfront `isFyersTokenExpired()` guards to abort socket and polling attempts on expired credentials, implemented automatic interval cancellation (`stopPollingFallback()`) upon token expiration or HTTP 401 responses, and broadcast `fyers:session:expired` to disconnect dangling sessions.
- **Dynamic Broker-Aware Top Warning Banner (`src/main.ts`, `src/style.css`)**: Upgraded `#offline-bar` from static offline text to a context-aware warning banner displaying `⚠️ Fyers Session Expired: Daily 6:30 AM IST token renewal required.` with a 1-click action button (`⚡ Renew Authorization Code`). Wired the button to trigger `settings:open` directly into the Brokers settings tab (`openalgo`). Added corresponding contextual warnings for OpenAlgo broker disconnection and browser network drops.
- **Settings Modal Live Status Badge & Auto-Reconnect (`src/ui/SettingsModal.ts`)**: Replaced the static `Access Token (Active)` label in the Fyers broker settings group with dynamic colored badges (`Active Session` vs `Expired (6:30 AM Cutoff)` vs `No Access Token`). Added clipboard paste interception on `authCodeInput` to parse full redirect URLs into pure auth codes, saved token generation timestamps (`fyers_token_generated_at`), and automatically triggered WebSocket reconnection (`fyersWsClient.connect()`) and chart refreshes (`chart:refresh`) upon successful token exchange.
- **GET Request Header Optimization & Preflight Error Messaging (`src/fyers/client.ts`, `src/broker/adapters/FyersAdapter.ts`)**: Avoided attaching redundant `Content-Type: application/json` headers on bodyless GET requests to eliminate browser preflight failures, and refined Connection Test error messaging to clearly diagnose CORS/invalid session rejections instead of displaying raw browser fetch errors.

## 2026-10-25

### Fix: Fyers DataSocket Singleton Lifecycle & Reconnection Protection (wsClient.ts)

- **Fyers DataSocket Singleton Re-Instantiation Protection (`src/fyers/wsClient.ts`)**: Resolved the critical reconnect failure (`Error: Only one instance of DataSocket is allowed. Use getInstance() instead.`) encountered when toggling from Offline mode back to Online mode or during automatic WebSocket reconnection. Built `clearFyersSdkSingleton()` to reset the Fyers Web SDK's internal static singleton cache (`SocketConstructor.instance = null`, `_instance = null`) upon disconnect, and wrapped socket instantiation in `connect()` with fallback to `SocketConstructor.getInstance(fullToken)`.
- **Dynamic inWS Readiness & Ping Loop Elimination (`src/fyers/wsClient.ts`)**: Replaced the static `{ readyState: WebSocket.OPEN }` getter on `window.inWS` with dynamic evaluation of the active underlying socket (`FyersWebSocketClient.getInstance().getActiveRawSocket()`). When the socket closes, `window.inWS` returns `null`, enabling Fyers SDK's internal `pingFunction` to stop attempting transmissions on closed sockets and execute its internal `clearInterval` instead of spamming console errors (`WebSocket is already in CLOSING or CLOSED state`).


### Feature: Chart Toast Notification Controls & Telegram Rejection Alert Forwarding (telegram.ts, SettingsModal.ts, ToastManager.ts, PaperBroker.ts, OrderPanel.ts)

- **Toast Notifications & Sound Controls (`src/ui/SettingsModal.ts`, `src/ui/ToastManager.ts`, `src/utils/telegram.ts`)**: Added independent user configuration toggles in the Settings modal under **Notifications** (`Show on-screen toast notifications` via `ystc_toasts_enabled` and `Play toast & alert sounds` via `ystc_toast_sounds_enabled`), giving users the choice to turn off floating on-screen toast banners or mute audio chimes across all market events.
- **Telegram Order Rejection Alerts (`src/paper/PaperBroker.ts`, `src/ui/OrderPanel.ts`, `src/utils/telegram.ts`, `src/ui/SettingsModal.ts`)**: Added dedicated `ystc_telegram_notify_rejections` setting (`Notify on Order Rejections & SEBI Cutoff Rules`) defaulting to `true`. Centralized paper trading order rejection checkpoints into `rejectOrder()`, ensuring that SEBI intraday cutoffs (CAS equity 3:05 PM, F&O 3:25 PM), pre-open auction restrictions (09:00–09:15 AM), CAS transition windows, insufficient margin failures, and market-closed rejections are reliably formatted and dispatched to Telegram with exact reasons. Wired live order and DOM ladder failure paths in `OrderPanel.ts` to dispatch `sendOrderAlert` with `status: 'REJECTED'`.
- **System Warning & Toast Forwarding to Telegram (`src/ui/ToastManager.ts`, `src/utils/telegram.ts`, `src/ui/SettingsModal.ts`)**: Built `sendSystemToastAlert()` and added `ystc_telegram_notify_toasts` setting (`Forward System Warning & Error Toasts to Telegram`), allowing users to optionally mirror system warnings, broker connection errors, and status notifications directly to their Telegram chat.


### Fix: Settings Modal Viewport Centering & Sticky Footer Scroll Containment (style.css)

- **Modal Centering & Height Containment (`src/style.css`)**: Switched `.settings-modal` to a flexbox container with `display: flex; align-items: center; justify-content: center; padding: 16px;`. Replaced hardcoded `top: 60px` and `min-height: 640px` on `.settings-modal__panel` with `position: relative; height: min(760px, calc(100vh - 32px)); max-height: calc(100vh - 32px); min-height: 0; grid-template-rows: 100%;`, preventing dialogs from exceeding viewport height on laptop screens or under OS scaling.
- **Independent Body Scroll & Pinned Footer (`src/style.css`)**: Constrained `.settings-modal__main` to `height: 100%; max-height: 100%; overflow: hidden;` with `flex: 1 1 0%; min-height: 0; overflow-y: auto;` on `.settings-modal__body`. Locked `.settings-modal__header` and `.settings-modal__footer` with `flex-shrink: 0;`, ensuring that the `Template`, `Cancel`, and `Ok` action buttons remain permanently pinned, fully visible, and clickable while the settings body scrolls smoothly.
- **Overlay & Drawing Dialogs Alignment (`src/style.css`)**: Aligned `.vp-settings-modal__panel` to `top: 50%; transform: translate(-50%, -50%); max-height: min(calc(100vh - 48px), 820px);`, eliminating bottom cutoff across all drawing tool and indicator settings dialogs.

### Feature: Native Broker-Agnostic Telegram Bot Notifications (telegram.ts, SettingsModal.ts, PaperBroker.ts, ChartManager.ts, OrderPanel.ts)

- **Native Telegram Bot Service (`src/utils/telegram.ts`)**: Built a zero-dependency client-side Telegram notification service communicating directly with Telegram Bot API (`https://api.telegram.org/bot<token>/sendMessage`) via browser fetch, completely disconnecting reliance on OpenAlgo's backend Python notification daemon. Supports HTML-formatted order fill alerts (`sendOrderAlert`), price crossing notifications (`sendPriceAlert`), account/funds summary alerts (`sendAccountSummaryAlert`), and interactive connection verification (`testTelegramConnection`).
- **Telegram Settings UI & Verification Panel (`src/ui/SettingsModal.ts`)**: Upgraded the Alerts tab with a dedicated **Telegram Bot Notifications (Broker-Agnostic)** configuration group featuring persistent Bot Token input with show/hide password visibility toggle, Chat ID / Channel ID input, granular notification toggles (Order Executions & Fills, Price & Drawing Alerts), and an interactive **"⚡ Test Telegram Notification"** button executing live `getMe` Bot validation and test messaging. Updated OpenAlgo username hint to reflect multi-user setup instead of Telegram notifications.
- **1-Click Auto-Detect My Chat ID (`src/utils/telegram.ts`, `src/ui/SettingsModal.ts`)**: Built `detectTelegramChatId()` querying Telegram's `getUpdates` API to inspect recent messages sent to the bot (such as `/start`), extracting the sender's numerical `chat.id` and name/handle. Added a prominent **`🔍 Auto-Detect My Chat ID`** button in the Settings Alerts panel that discovers and saves the user's Chat ID with one click, eliminating manual ID lookups.
- **Paper Trading Engine Telegram Integration (`src/paper/PaperBroker.ts`)**: Replaced `openAlgoPost('telegram/notify')` calls with `sendOrderAlert()` and `sendAccountSummaryAlert()`, delivering rich simulated order fills, rejections, modifications, cancellations, and account funds/P&L summaries to Telegram even when OpenAlgo is completely offline or stopped.
- **Chart Price Alert Notifications (`src/chart/ChartManager.ts`)**: Replaced OpenAlgo telegram calls with native `sendPriceAlert()`, broadcasting live drawing ray crossings and price threshold triggers directly to the user's Telegram chat.
- **Live Broker Trading Alerts (`src/ui/OrderPanel.ts`)**: Wired live order placement and DOM quick-order submissions for Fyers (`track: 'fyers'`) and OpenAlgo (`track: 'openalgo'`) to dispatch immediate Telegram alerts upon successful order routing.

### Architecture: Broker Integration Skill (.agents/skills/broker-integration/SKILL.md, AGENTS.md)

- **Standardized Broker Integration Architecture (`.agents/skills/broker-integration/SKILL.md`)**: Created comprehensive developer and agent skill detailing the end-to-end process of integrating any third-party broker (REST and WebSocket) into YSTC Charts. Codifies frozen documentation storage under `doc/Broker-Integration-docs/<Broker>-broker-API/`, standalone `src/<broker>/` engine design (`config.ts`, `auth.ts`, `client.ts`, `history.ts`, `quotes.ts`, `orders.ts`, `wsClient.ts`, `symbolHelper.ts`), WebSocket 20s keepalive ping/pong heartbeat requirements, status-guarded subscription queueing, `BrokerAdapter` implementation patterns, UI wiring across `SettingsModal`, `SymbolSearchModal`, `OrderPanel`, `AccountManager`, `ChartManager`, and `onlineLoader`, and strict zero-regression guarding for existing brokers.
- **Agent Skill Registry Updates (`AGENTS.md`)**: Added `broker-integration` to the Active Agent Skills table and registered `src/broker/` and `src/fyers/` in the platform key paths table.

### Architecture: Broker Integration Documentation Consolidation (AGENTS.md, doc/)

- **Unified Broker Documentation Hierarchy (`doc/Broker-Integration-docs/`)**: Relocated OpenAlgo documentation from `doc/OpenAlgo/` to `doc/Broker-Integration-docs/OpenAlgo-broker-API/`, consolidating all broker reference documentation under a unified hierarchy alongside `doc/Broker-Integration-docs/Fyers-broker-API/`.
- **Documentation Source of Truth Realignment (`AGENTS.md`)**: Updated `AGENTS.md` frozen local source of truth rules and reference documentation table to point to `doc/Broker-Integration-docs/OpenAlgo-broker-API/` and registered Fyers API v3 reference documents.

### Fix: Fyers WebSocket Startup Stability & 20s Keepalive Heartbeat Protection (wsClient.ts)

- **Active Raw WebSocket Interception & Ping Heartbeat (`src/fyers/wsClient.ts`)**: Implemented transparent `window.WebSocket` constructor hooking to capture the underlying active socket instance connecting to `wss://socket.fyers.in/hsm/v1-5/prod`. Added `startPingHeartbeat()` running every 20 seconds to transmit Fyers HSM binary keepalive ping frames (`new Uint8Array([0, 1, 11])`) and text pings, preventing the 120-second remote server idle timeout from terminating the WebSocket connection.
- **Fyers Web SDK Unbound Ping Scope Fix (`src/fyers/wsClient.ts`)**: Registered a global `window.inWS` getter fallback evaluating `readyState === WebSocket.OPEN`, resolving the Fyers Web SDK v3 (`index.min.js`) scoping defect where `this.inWS?.readyState` evaluates unbound inside `setInterval` and self-destructs the SDK's internal timer on the first 30s tick.
- **Startup Connection State Guarding & Subscription Queuing (`src/fyers/wsClient.ts`)**: Updated `subscribe()` and `unsubscribe()` to verify `this.isSocketConnected && this.socketInstance.isConnected()` before invoking socket methods, queuing symbols in `this.activeSubscriptions` while connecting and flushing them in a single batch on `on('connect')`. Eliminates startup console errors (`socket is disconnected Object subscribe / unsubscribe`) and initial connection race failures.

### Feature: Fyers Plan Tier Detection & Adaptive Rate-Limiting Protection (config.ts, planHelper.ts, client.ts, quotes.ts, history.ts, FyersAdapter.ts, types.ts, SettingsModal.ts)

- **Dynamic Plan Tier Configuration (`src/fyers/config.ts`)**: Introduced `FyersPlanSetting` (`'auto' | 'standard' | 'prime'`) and `FyersPlanTier` (`'standard' | 'prime'`) with `getFyersPlanSetting()`, `setFyersPlanSetting()`, `getFyersPlanTier()`, `setFyersPlanTier()`, and `isFyersPrime()` helper utilities to support automatic detection while allowing manual user overrides.
- **Auto-Detection Probing Engine (`src/fyers/planHelper.ts`)**: Built `detectFyersPlanTier()` performing non-intrusive JWT payload inspection and active 5-second historical resolution probing (`resolution=5S`) against `GET /data/history`. Standard accounts reject seconds resolutions, safely identifying Standard vs Prime status without causing account warnings.
- **Adaptive Rate-Limiting & 60s Sliding-Window Account Protection (`src/fyers/client.ts`)**: Configured dynamic request pacing interval and sliding-window request counting based on active plan tier:
  - Standard Plan: Enforces 205ms interval (≤ 5 req/s) and a hard cap of 48 requests/min (under Fyers' 50 req/min limit).
  - Prime Plan: Enforces 100ms interval (10 req/s) and a sliding-window cap of 490 requests/min (under Fyers' 500 req/min limit).
  - Protects user accounts from Fyers' severe 3-strike rule (exceeding per-minute limits > 3 times permanently blocks the account for the entire trading day).
- **Multi-Quote Batch Chunking (`src/fyers/quotes.ts`)**: Added batch chunking in `fetchFyersQuotes()` respecting plan-tier symbol limits (50 symbols per batch on Standard, up to 1,000 on Prime), fetching batches sequentially through `scheduleRequest` to eliminate 422/429 errors.
- **Seconds Resolution Fallback (`src/fyers/history.ts`)**: Added automatic resolution fallback from seconds (`5S`..`45S`) to 1-minute (`1`) with informative warnings when running on Standard accounts where seconds data is restricted by Fyers.
- **Connection Test Plan Tier Integration (`src/broker/adapters/FyersAdapter.ts`, `src/broker/types.ts`)**: Extended `ConnectionTestResult` details with `plan` metadata and updated `testConnection()` to trigger plan auto-detection and report detected tier in status messages (`Connected to Fyers (... - Standard Plan / Prime Plan)`).
- **Brokers Settings UI Plan Selector & Live Badge (`src/ui/SettingsModal.ts`)**: Added an **API Plan Tier & Rate Limits** selector in the Fyers API configuration card supporting `Auto-Detect Plan Tier (Recommended)`, `Standard Plan (Free)`, and `Prime Plan (Pro)` with a live status badge (`[STANDARD (FREE)]` vs `[PRIME (PRO)]`) that updates immediately on test connection or tier selection.

### Fix: Fyers API 429 Rate Limiting, Request Pacing Queue & Query Deduplication (client.ts, AccountManager.ts, ChartManager.ts)

- **Fyers API Rate-Limiting Queue & Request Pacing (`src/fyers/client.ts`)**: Built a serial scheduling queue (`scheduleRequest`) enforcing a minimum 160ms interval between outgoing requests (< 6 requests/second), keeping platform request bursts safely within Fyers API's 10 req/sec limit and preventing HTTP 429 (Too Many Requests) errors on bulk table refreshes.
- **In-Flight Request Deduplication & GET Response Caching (`src/fyers/client.ts`)**: Implemented in-flight promise sharing and a 2-second short-lived response cache for GET endpoints (`funds`, `positions`, `orders`, `holdings`, `tradebook`). Concurrent calls to the same endpoint now share a single network request rather than spamming duplicate requests. Any mutating POST/PUT/DELETE order action immediately purges the cache. Added automatic exponential backoff retry on HTTP 429 responses.
- **Engine Switch Duplicate Query Mitigation (`src/ui/AccountManager.ts`, `src/chart/ChartManager.ts`)**: Removed redundant `handleEngineChange()` and `render()` invocations in `AccountManager.ts` engine badge click handler which was executing simultaneously with the `trading:engine:change` event listener. Prevented duplicate live state fetching in `ChartManager.ts` on engine switch when Fyers is active since `AccountManager` already fetches and broadcasts `live-orders:update` and `live-positions:update` directly to chart overlays.

### Fix: Multi-Broker Live Trading Routing & Bad Gateway Resolution (orders.ts, AccountManager.ts, ChartManager.ts, OrderModal.ts, OrderPanel.ts)

- **Fyers Account Management Engine (`src/fyers/orders.ts`)**: Added comprehensive normalized query methods `getFyersAccountPositions()`, `getFyersAccountOrders()`, `getFyersAccountTrades()`, `getFyersAccountHoldings()`, `getFyersAccountFunds()`, and `modifyFyersOrder()`. Normalized Fyers API responses into standard platform shapes for positions (calculating LTP, value, and P&L %), order book (mapping Fyers numeric statuses to standard statuses like `COMPLETE`, `CANCELLED`, `OPEN`), trade book, holdings with overall portfolio statistics, and fund limits (`availablecash`, `utiliseddebits`, `m2mrealized`).
- **Account Manager Multi-Broker Routing (`src/ui/AccountManager.ts`)**: Routed table data loaders (`fetchPositionsPayload()`, `fetchOrdersPayload()`, `fetchTradesPayload()`, `fetchHoldingsPayload()`, `fetchFundsPayload()`) to query Fyers API v3 when Fyers is the active broker. Guarded `fetchEndpointPayload()` against calling OpenAlgo REST endpoints when active broker is not OpenAlgo, eliminating 502 Bad Gateway errors on `positionbook`, `orderbook`, `tradebook`, `holdings`, and `funds`. Upgraded `prefillLiveLtpWithMultiquotes()` to use `fetchFyersQuotes()` for multi-symbol quote lookups and guarded `fetchLotSizeForExit()` with registered lot size fallback. Wired position exit (`placeFyersOrder`), order modification (`modifyFyersOrder`), and order cancellation (`cancelFyersOrder`) to Fyers API v3 endpoints.
- **Chart Manager Live State & Bracket Guarding (`src/chart/ChartManager.ts`)**: Enhanced `fetchLiveStateForOverlays()` to query Fyers order and position endpoints directly when Fyers is active, updating chart live trading overlays and emitting `live-orders:update` and `live-positions:update`. Guarded `checkAndCleanupOrphanedBrackets('live')` against non-OpenAlgo brokers and routed chart-level drag order modification (`order:manage:modify`) and cancellation (`order:manage:cancel`) directly to Fyers.
- **Order Modal & Panel Live Execution Routing (`src/ui/OrderModal.ts`, `src/ui/OrderPanel.ts`)**: Guarded `updateEstimatedMargin()` and `updateMarginAndLtp()` to compute margin client-side using `calculateMargin()` when active broker is Fyers (or in Paper mode), eliminating 502 Bad Gateway errors on `POST /api/v1/margin`. Guarded symbol precision lookups to prevent invalid OpenAlgo `/api/v1/symbol` requests. Routed order placement in both OrderModal and OrderPanel (including DOM order actions) to `activeBroker.placeOrder()`, supporting direct live order execution through Fyers API v3.

### Fix: Fyers Secret Key Persistence, Data URL Routing, & Broker-Scoped Background Endpoints (SettingsModal.ts, config.ts, client.ts, history.ts, wsClient.ts, marketHours.ts, TopBar.ts, OrderPanel.ts)

- **Persistent Secret Key Storage (`src/ui/SettingsModal.ts`)**: Removed `fyers_secret_key`, `fyers_app_id`, `fyers_access_token`, `fyers_user_id`, and `ystc_active_broker` from `SNAPSHOT_STORAGE_KEYS` to prevent modal close/cancel actions (`cancelAndClose()`) from wiping user-entered credentials. Added input, change, and blur event bindings on credential inputs and synced `performExchange()` directly with input field values.
- **Fyers Market Data URL Routing (`src/fyers/config.ts`, `src/fyers/client.ts`, `src/fyers/history.ts`)**: Configured `FYERS_DATA_BASE_URL = 'https://api-t1.fyers.in/data'`. Updated `fyersFetch()` to route `data/*` requests (`data/history`, `data/quotes`, `data/depth`) directly to `FYERS_DATA_BASE_URL` without the `/api/v3/` prefix, resolving the 404 Not Found error on historical candle retrieval. Added date range clamping in `fetchFyersHistory()` to respect Fyers API limits (360 days for daily/weekly/monthly; 99 days for intraday minutes).
- **Fyers Symbology Standardization (`src/fyers/symbolHelper.ts`, `src/chart/onlineLoader.ts`)**: Enhanced `toFyersSymbol` to guarantee required series suffixes (`-EQ` for NSE/BSE equities like `NSE:SBIN-EQ`, `-INDEX` for indexunderlyings like `NSE:NIFTY50-INDEX`, and `NFO:` for derivatives) regardless of whether input symbols are passed as `SBIN` or `SBIN-EQ`, resolving the Fyers 422 `Invalid symbol provided` error. Updated `onlineLoader.ts` to pass the canonical symbol to Fyers.
- **OpenAlgo REST Call Scoping (`src/utils/marketHours.ts`, `src/ui/TopBar.ts`, `src/ui/OrderPanel.ts`)**: Guarded `fetchAndCacheTimings()`, `fetchSupportedIntervals()`, and `loadSymbolMetadata()` to execute OpenAlgo `/api/v1/market/timings`, `/api/v1/intervals`, and `/api/v1/symbol` / `/api/v1/depth` calls only when `activeBroker.id === 'openalgo'`, eliminating 502 Bad Gateway console errors when operating under Fyers.
- **Live Tick Streaming & Official CDN Alignment (`src/fyers/wsClient.ts`)**: Updated the CDN URL to the official documentation source (`https://cdn.fyers.in/js/sdk/1.3.0/fyers-web-sdk-v3/index.min.js`), expanded `SocketConstructor` resolution across all window namespaces, deduplicated script injection via an in-flight loading promise, and streamlined quote streaming logging to eliminate duplicate warnings in the browser console.
- **Broker-Aware Offline Warning Banner (`src/main.ts`, `src/fyers/wsClient.ts`)**: Updated `updateOfflineBar()` in `main.ts` to evaluate the active broker's real connection state (`fyersWsClient.isConnected()` and `getFyersAccessToken()` when using Fyers, instead of OpenAlgo's `wsClient.isAuth()`), wired `broker:change` event listener, and added `ws:authenticated`/`ws:disconnected` event emissions in `FyersWebSocketClient` to hide the top "You're offline" warning bar when Fyers is connected and streaming.
- **Account Manager Live Status Badge Alignment (`src/ui/AccountManager.ts`)**: Replaced hardcoded `wsClient.isAuth()` checks in `refreshLivePositionsWs()` and `build()` with `isBrokerConnected()`, dynamically inspecting active broker connection state (`fyersWsClient.isConnected()` and `getFyersAccessToken()` for Fyers; `wsClient.isAuth()` for OpenAlgo). Wired `broker:change` event listener to ensure the bottom dock status badge displays `Live` instead of `Connecting` when Fyers is connected.

### Feature: Fyers Broker API v3 Integration & Modular Multi-Broker Architecture (types.ts, BrokerAdapter.ts, OpenAlgoAdapter.ts, FyersAdapter.ts, BrokerManager.ts, auth.ts, history.ts, quotes.ts, orders.ts, wsClient.ts, SettingsModal.ts, onlineLoader.ts, TopBar.ts, SymbolSearchModal.ts, ChartManager.ts, chartInit.ts)

- **Broker Abstraction Layer (`src/broker/types.ts`, `src/broker/BrokerAdapter.ts`, `src/broker/BrokerManager.ts`)**: Built a modular multi-broker architecture decoupling chart rendering and data pipelines from specific brokers. Defined `BrokerAdapter` interface standardizing connection testing, historical candle loading, multi-symbol quotes, symbol search, tick subscriptions, order management, and account queries. Implemented `BrokerManager` singleton managing active adapter selection (`localStorage.getItem('ystc_active_broker')`) and dispatching `broker:change` events across `eventBus`.
- **OpenAlgo Broker Adapter (`src/broker/adapters/OpenAlgoAdapter.ts`)**: Encapsulated existing OpenAlgo REST and WebSocket integrations into `OpenAlgoAdapter` implementing `BrokerAdapter` to maintain full backward compatibility for local OpenAlgo setups.
- **Zero-Dependency Fyers API v3 Integration (`src/fyers/`)**: Implemented direct integration with Fyers API v3 without adding external npm dependencies:
  - **Client & Config (`src/fyers/config.ts`, `src/fyers/client.ts`)**: Built authenticated `fetch()` client managing `fyers_app_id`, `fyers_secret_key`, `fyers_access_token`, and `fyers_user_id` with rate-limit backoff (429 retry handling) and standard authorization headers (`${appId}:${accessToken}`).
  - **In-Chart OAuth2 Auth Code Validation (`src/fyers/auth.ts`)**: Built `validateFyersAuthCode()` using native Web Crypto API (`crypto.subtle.digest('SHA-256')`) to compute `appIdHash` and exchange authorization codes copied from Fyers official redirect URI for daily access tokens via `POST /api/v3/validate-authcode`.
  - **Symbol Translation (`src/fyers/symbolHelper.ts`)**: Built bidirectional mapping between YSTC symbol formats (`SBIN-EQ`, `NSE_INDEX:NIFTY50-INDEX`, `NFO:BANKNIFTY...`) and Fyers symbology (`NSE:SBIN-EQ`, `NSE:NIFTY50-INDEX`, `NFO:BANKNIFTY...`).
  - **Historical Market Data (`src/fyers/history.ts`)**: Implemented `fetchFyersHistory()` querying `GET /api/v3/data/history` across all timeframe resolutions (minute resolutions `1..240`, second resolutions `5S..45S`, `D`, `W`, `M`) and converting epoch arrays into KlineCharts `KLineData`.
  - **Market Quotes & Trading (`src/fyers/quotes.ts`, `src/fyers/orders.ts`)**: Implemented multi-symbol quotes fetching via `GET /data/quotes`, account profile and fund balance retrieval, position tracking with P&L, order book synchronization, order placement (`POST /orders/sync`), and order cancellation (`DELETE /orders/sync`).
  - **Real-Time WebSocket Data Socket (`src/fyers/wsClient.ts`)**: Implemented `FyersWebSocketClient` loading the official Fyers Web SDK dynamically via CDN on-demand, maintaining persistent bidirectional connections to `wss://socket.fyers.in/trade/v3` with auto-reconnection, multi-symbol subscription reference counting, and emitting normalized ticks to `tick:update`.
  - **Fyers Adapter Implementation (`src/broker/adapters/FyersAdapter.ts`)**: Glued all Fyers modules into `FyersAdapter` implementing `BrokerAdapter`.
- **Multi-Broker Settings UI (`src/ui/SettingsModal.ts`)**: Upgraded the settings modal by renaming the tab to **"Brokers"** and adding an **Active Broker** selector dropdown (`OpenAlgo` vs `Fyers API v3`). When Fyers is selected, renders a configuration panel with persistent App ID and Secret Key fields, a 1-click **"Login with Fyers"** OAuth launcher, an authorization code paste field with instant token exchange, active Access Token field, Test Connection button with KYC/profile verification, and direct links to Fyers MyAPI Dashboard.
- **Chart & App Pipeline Integration (`src/chart/onlineLoader.ts`, `src/ui/TopBar.ts`, `src/ui/SymbolSearchModal.ts`, `src/chart/ChartManager.ts`, `src/chart/chartInit.ts`)**:
  - Routed historical candle loading through `BrokerManager.getActiveBroker().getHistory()` while retaining local session candle caching and gap auto-healing.
  - Updated online mode toggle in `TopBar.ts` to validate active broker credentials using `activeBroker.testConnection()`.
  - Routed online symbol search in `SymbolSearchModal.ts` through active broker search.
  - Wired KlineCharts DataLoader `subscribeBar` and `unsubscribeBar` in `chartInit.ts` and `ChartManager.ts` to dynamically dispatch subscriptions to the active broker's WebSocket feed (`wsClient` or `fyersWsClient`) and seamlessly switch streams upon `broker:change`.

## 2026-10-22

### Feature: Unified Chronological Chart Legend Stack & Elimination of Canvas Watermark Badges (IndicatorLegend.ts, ChartManager.ts, objectTreeTypes.ts, vsaPlotter.ts, volumeSpreadAnalysis.ts, sessionVolumeProfile.ts, volumeCluster.ts, tpoProfile.ts)

- **Unified Chronological Legend Stacking (`src/ui/IndicatorLegend.ts`, `src/chart/ChartManager.ts`)**: Enhanced the top-left chart legend to interleave indicators and analytical drawing overlays (`vsaPlotter`, `volumeSpreadAnalysis`, `sessionVolumeProfile`, `tpoProfile`, `fixedRangeTpoProfile`, `fixedRangeVolumeProfile`, `volumeCluster`, `anchoredVwap`) in chronological addition order ("first come, first served") using `appliedObjectsOrder`. Clicking an overlay row in the legend automatically selects it on the chart canvas (`objects:overlay:select`).
- **Complete Hover Actions for Overlays & Indicators (`src/ui/IndicatorLegend.ts`)**: Equipped overlay legend rows with all 4 controls: Eye (visibility toggle via `objects:overlay:visibility`), Lock (lock state toggle via `objects:overlay:lock` with `SVG_LOCK`/`SVG_UNLOCK` state icons), Settings (opens overlay configuration dialog via `objects:overlay:configure`), and Delete (removes overlay via `objects:overlay:remove`).
- **Legend Layout Sync & Zero-Indicator Pane Protection (`src/chart/ChartManager.ts`, `src/ui/IndicatorLegend.ts`)**: Fixed `flushIndicatorLegendLayouts` to always register `candle_pane` and active analytical overlay panes even when 0 technical indicators are applied on chart, preventing the legend from becoming empty or marked hidden. Added resilient fallback layout for `candle_pane` in `IndicatorLegend.ts` and automated layout synchronization whenever overlay objects are added or removed.
- **Elimination of Colliding Canvas Watermark Text Figures (`src/overlays/vsaPlotter.ts`, `src/overlays/volumeSpreadAnalysis.ts`, `src/overlays/sessionVolumeProfile.ts`, `src/overlays/volumeCluster.ts`, `src/overlays/tpoProfile.ts`)**: Removed hardcoded canvas watermark text badges (`vsa_plotter_header_badge` at y:42, `vsa_header_badge` at y:42, `session-vp-summary` at y:42, and `volume-cluster-summary` at y:66), and restricted TPO Profile canvas summary rendering to `summaryPlacement === 'local'`, preventing badge overlaps when applying multiple institutional and profile overlays simultaneously.
- **Display Name Alignment (`src/chart/objectTreeTypes.ts`)**: Updated `volumeSpreadAnalysis` display name to `'Volume Spread Analysis (MVPSA)'` in `OVERLAY_DISPLAY_NAMES`, aligning the legend title with the full tool nomenclature.
- **VSA Bar Color Cleanup on Delete and Hide (`src/chart/ChartManager.ts`)**: Implemented `handleOverlayRemoved()` to clear cached bar colors (`clearVsaPlotterOverlayData`, `clearVsaOverlayData`) and invoke `applyCurrentChartSettings()` when overlays are deleted from the legend or cleared from chart. Updated `hasVsaOverlay` and `hasVsaPlotterOverlay` checks to respect overlay visibility (`ov.visible !== false`), ensuring that hiding or deleting the overlays immediately reverts candlesticks and OHLC bars back to standard chart colors.
- **Offline Mode Market Timings Fetch Guard (`src/utils/marketHours.ts`)**: Guarded `fetchAndCacheTimings` and `initMarketTimingsSync` to strictly check for `openchart_mode === 'online'` before querying OpenAlgo's `market/timings` endpoint. Prevents 502 Bad Gateway console network errors when operating in offline mode with OpenAlgo server disconnected.

### Polish: VSA Plotter (MVPSA) Full Settings Wiring, Double-Click Dialog Trigger, & Split-Candle Customization (vsaPlotter.ts, VSAPlotterModal.ts, ChartManager.ts)

- **Double-Click & Header Watermark Modal Trigger (`src/chart/ChartManager.ts`, `src/overlays/vsaPlotter.ts`)**: Enhanced `onDoubleClick` event listener in `ChartManager` to automatically trigger `openOverlaySettingsFromContext` for overlays excluded from floating drawing toolbars (`vsaPlotter`, `volumeSpreadAnalysis`). Enabled interactive pointer events (`ignoreEvent: false`) and registered `onClick` on the `vsa_plotter_header_badge` figure so double-clicking the overlay or clicking its top-left watermark pill badge directly opens `VSAPlotterModal`.
- **Half-Blue & Half-White Two-Tone Anomaly Palette Customization (`src/overlays/vsaPlotter.ts`, `src/ui/VSAPlotterModal.ts`)**: Resolved `halfBlueColor` and `halfWhiteColor` from `VsaPlotterSettings` across all candlestick body halves, OHLC spines, and tick figures instead of using hardcoded defaults. Added color swatch pickers for `Half-Blue Split Top Color` and `Half-White Split Bottom Color` under the `Candle Palette` section in the Visual Styles tab.
- **Complete Inputs Field Coverage (`src/ui/VSAPlotterModal.ts`)**: Added UI controls for `Show Gap Lines` toggle and `Bar Size Lookback (10 SMA)` number input to the Inputs tab in `VSAPlotterModal`, ensuring all 24 schema fields in `VsaPlotterSettings` are exposed with real-time chart preview and localStorage persistence.

## 2026-10-21

### Feature: VSA Plotter 100% Parity with VOFAplotter Source Truth (vsaPlotter.ts, vsaPlotterSettings.ts, vsaPlotter.ts overlay, VSAPlotterModal.ts)

- **Wyckoff On-Candle Signal Dots Engine (`src/utils/vsaPlotter.ts`, `src/overlays/vsaPlotter.ts`)**: Implemented all 10 Wyckoff institutional signal dot conditions decoded from `VOFAplotter`: No Demand (`HotPink` #FF69B4 above high), Supply Test (`Blue` #0000FF below low), Supply Test in Uptrend (`SkyBlue` #87CEEB below low), Stopping Volume (`Green` #4CAF50 below low), Pseudo UpThrust (`White` #FFFFFF above high), Selling Climax (`DeepPink` #FF1493 below low), Selling Climax Reversal Confirmation (`Cyan` #00FFFF below low), Yellow Exhaustion Dot (`Yellow` #FFFF00 on 3rd contracting ultra-volume bar), Green Buying Anchor Dot (`Green` #00E676), Red Distribution Dot (`Red` #FF1744), and Red Trigger Dot (`Red` #D50000). Renders circular figures with high-contrast white halo outlines on the price candles.
- **Complete 19-Rule EVR Disparity Matrix & Exponential Decay Baseline (`src/utils/vsaPlotter.ts`)**: Upgraded PaleVioletRed Effort vs. Result anomaly detection to match the complete 19-formula disparity matrix from `VOFAplotter`. Replaced flat SMA with rolling exponential volume decay baseline ($\alpha = 10/255 \approx 0.0392$) with square-root variance subtraction ($\text{threshold} = \text{baseline} - 0.5 \times \sqrt{\text{baseline}}$).
- **20-Bar Indigo Breakout & Trap Confirmation Engine (`src/utils/vsaPlotter.ts`)**: Added 20-bar tracking window following Indigo bars ($\ge 2.0\times \text{SMA}_{30}$ vol and $> 1.5\times \text{SMA}_{20}$ spread). Detects high-spread ($> 2.2\times \text{SMA}_{20}$) lower-volume breakouts as Cyan confirmation bars, and catches next-bar Gray traps generating institutional 1:3 R:R Long/Short setup signals.
- **Dynamic 10-Day S/R Color Inheritance & Blue Bar FSYBHL Rays (`src/utils/vsaPlotter.ts`, `src/overlays/vsaPlotter.ts`)**: Upgraded 10-day session High/Low levels to inherit candidate bar colors (`Indigo`, `PaleVioletRed`, `Orange`, `SaddleBrown`, `DarkOliveGreen`) with first-touch price freezing and pierce termination. Re-anchored FSYBHL 30-day rays to the first Ultra Blue bar ($\ge 2.8\times$) of each session, extending forward 30 trading days.
- **Primary & Secondary Bulge Zones & SLS Next-Day Trade Setups (`src/utils/vsaPlotter.ts`, `src/overlays/vsaPlotter.ts`)**: Implemented Primary and Secondary Bulge Zones with touch termination and color-shift to `#4682B4`. Built SLS Next-Day Opening Auction 1:3 R:R trade setups (`BUY-02`, `SELL-02`) calculating risk/reward ticks and entry instructions.
- **Settings Schema, Modal UI & Toggle Persistence (`src/overlays/vsaPlotterSettings.ts`, `src/ui/VSAPlotterModal.ts`)**: Added `showSignalDots`, `dotRadius`, `showSLSSetups`, and `showIndigoBreakouts` toggles to `VsaPlotterSettings` schema and `localStorage` persistence. Added interactive UI controls in the `Inputs` tab of `VSAPlotterModal` with live preview and reset handling.

### Fix: MVPSA Volume Histogram Spacing, Candle Exhaustion Dots Rendering, and TradingView Settings Modal Chrome (mvpsaVolume.ts, mvpsaVolumeSettings.ts, mvpsaVolumeDots.ts, MVPSAVolumeModal.ts, ChartManager.ts)

- **Auto Dynamic Histogram Bar Width (`src/indicators/mvpsaVolume.ts`, `src/indicators/mvpsaVolumeSettings.ts`)**: Changed default `barWidth` to `0` (auto) in settings schema and defaults. Integrated dynamic bar width calculation matching `volumeYSTC.ts` (`barSpace.bar - 1`) so volume bars automatically scale with chart zoom level, horizontal panning, and candle body width instead of crowding at a fixed 8px width.
- **Wyckoff Exhaustion Candle Dots Overlay Coordinate Conversion & Lifecycle Sync (`src/overlays/mvpsaVolumeDots.ts`, `src/chart/ChartManager.ts`)**: Corrected KlineCharts v10 coordinate projection by converting `{ timestamp, value }` point arrays via `chart.convertToPixel` to locate candle midpoints on the main `candle_pane`. Passed non-interactive anchor points to `chart.createOverlay` to prevent drawing-mode lock. Added companion overlay synchronization inside `applyCurrentChartSettings` to ensure dots overlay renders reliably on initial load and chart refreshes.
- **TradingView-Standard Indicator Settings Modal Styling (`src/ui/MVPSAVolumeModal.ts`)**: Refactored modal DOM hierarchy to strictly adhere to platform `indicator-settings-modal` design tokens and conventions. Integrated tab bar with active indicator underline, standardized rows with labels and right-aligned inputs/toggles, and replaced standard HTML color pickers with `createColorSwatch` popover color pickers and opacity sliders.

### Feature: Volume (MVPSA) by YSTC — Sub-Pane Indicator, 4-Tier Volume Classification, Dynamic Threshold Clouds, and Wyckoff Exhaustion Overlay (mvpsaVolume.ts, mvpsaVolumeEngine.ts, mvpsaVolumeSettings.ts, mvpsaVolumeDots.ts, MVPSAVolumeModal.ts, catalog.ts, ChartManager.ts)

- **Mathematical Calculation Engine (`src/utils/mvpsaVolumeEngine.ts`)**: Built the complete reverse-engineered computation engine from `referance_use_only/VOFAvol/MVPSA-Vol-Complete-Logic.md`. Implemented rolling Volume Moving Average ($\text{VMA}_{30}$) and 4 dynamic activity thresholds: $\text{VeryHigh} = 2.0 \times \text{VMA}$, $\text{High} = 1.5 \times \text{VMA}$, $\text{Normal} = 1.0 \times \text{VMA}$, and $\text{Low} = 0.5 \times \text{VMA}$. Implemented memoized volume series classification and Wyckoff drying-volume pattern detection on 3-bar historical sequences.
- **4-Tier Institutional Volume Bars & Dynamic Background Cloud Ribbons (`src/indicators/mvpsaVolume.ts`)**: Authored `MVPSA_VOL` `IndicatorTemplate` operating in a dedicated lower volume sub-pane (`pane: 'sub'`). Renders 4-tier volume bars classified as Ultra Volume (Red `#E20E0E` for $V > 2.0\times\text{VMA}$), High Volume (Yellow `#E0E41C` for $1.5\times < V \le 2.0\times\text{VMA}$), Normal Volume (Dark Green `#0C3302` for $0.5\times < V \le 1.5\times\text{VMA}$), and Ultra-Low Volume (Deep Navy Blue `#170558` for $V \le 0.5\times\text{VMA}$). Rendered 4 Direct2D-equivalent shaded background polygon ribbon bands: Dark Bronze (`#6D3304` for $1.5\times \to 2.0\times$), White (`#FFFFFF` for $1.0\times \to 1.5\times$), Slate Cyan (`#236C8D` for $0.5\times \to 1.0\times$), and semi-transparent White for ($0.0 \to 0.5\times$), plus a 3px vibrant Magenta VMA line (`#B11ADF`).
- **Main-Pane Wyckoff Exhaustion Dots Companion Overlay (`src/overlays/mvpsaVolumeDots.ts`)**: Implemented `MVPSA_VOL_DOTS` overlay mounting directly on `candle_pane`. Renders 12px circular signal markers with 1.2px white halo borders at candle midpoint $\frac{\text{High} + \text{Low}}{2}$ for Bearish Selling Exhaustion / No Supply (Cyan `#00FFFF`) and Bullish Buying Exhaustion / No Demand (Magenta `#FF00FF`).
- **Indicator Lifecycle Synchronization (`src/chart/ChartManager.ts`)**: Synchronized lifecycle between sub-pane `MVPSA_VOL` indicator and main-pane `MVPSA_VOL_DOTS` overlay. Automatically creates companion dots overlay on `candle_pane` upon adding the indicator, mirrors visibility toggle states, and tears down the companion overlay when the indicator is removed.
- **Dedicated 4-Tab Settings Modal & Persistence (`src/indicators/mvpsaVolumeSettings.ts`, `src/ui/MVPSAVolumeModal.ts`, `src/ui/IndicatorSettingsModal.ts`)**: Built pure DOM `MVPSAVolumeModal` with `Inputs` (VMA period, bar width, toggles), `Bar Style` (4-tier volume colors, VMA line styling), `Clouds` (4-band colors and opacities), and `Dots` (bearish/bullish dot colors, radius, and halo outline) with `localStorage` persistence (`ystc_mvpsa_volume_settings`). Intercepted `indicator:settings:open` in `IndicatorSettingsModal` to route `MVPSA_VOL` directly to `MVPSAVolumeModal`.
- **Indicator Catalog & App Shell Registration (`src/indicators/catalog.ts`, `src/indicators/index.ts`, `src/overlays/index.ts`, `src/main.ts`)**: Added "Volume (MVPSA) by YSTC" to `INDICATOR_CATALOG` under category `'Script name'` with interactive tooltip features, registered templates during application startup, and mounted modal container in the main HTML shell.

### Feature: YSTC Script Editor Drawing Tools & Technical Indicator Parity (@ystc/sdk, Monaco, ChartManager, IndicatorSettingsModal, IndicatorModal)

- **Expanded `@ystc/sdk` API & Math Engine (`src/scripting/sdk/ystc-sdk.d.ts`, `src/scripting/sdk/sdk.ts`, `src/scripting/sdk/ystc-sdk-raw.ts`)**: Implemented sliding-window technical math functions (`atr`, `wma`, `vwap`, `crossover`, `crossunder`, `stoch`) with null safety and lookback guards. Introduced `ScriptInputType` (`number`, `boolean`, `string`, `color`, `select`, `source`, `opacity`), `ScriptInputCondition`, and declarative `inputs` dictionary on `IndicatorConfig` and `OverlayConfig`. Extended `OverlayContext` with `convertToPixel(points)`, `convertFromPixel(coords)`, `dataList`, and `bar`.
- **Dynamic Catalog Registration & KlineChartsBridge Routing (`src/indicators/catalog.ts`, `src/scripting/runtime/KlineChartsBridge.ts`, `src/chart/ChartManager.ts`)**: Auto-registered dynamic custom indicators into the catalog upon compilation, resolving defaults from `inputs` into `calcParams`. Routed indicators with `series: 'price'` directly to `candle_pane`, while oscillators route to dedicated subpanes with `DEFAULT_INDICATOR_PANE_HEIGHT`. Armed drawing tool cursor for dynamic overlay scripts upon `[> Add to chart]` via `activeOverlaySelection` and `createOverlayCreate()`, and resolved display names to Title Case (`resolveOverlayDisplayName`).
- **Reactive Dynamic Inputs & Auto-Generated Figure Styles Tab (`src/ui/IndicatorSettingsModal.ts`)**: Added automated `Style` tab for custom indicators from `config.figures` featuring visibility switches, color pickers, and line style selectors (`createLineStylePicker` with 1–4px width and solid/dashed/dotted line styles). Added `buildDynamicScriptInputsTab` supporting reactive inputs, `inline` horizontal grouping, `group` section headers, `tooltip` hints, and dynamic condition evaluation (`visibleWhen`, `activeWhen`).
- **"My Scripts" Category & Filter Tabs in Indicator Dialog (`src/ui/IndicatorModal.ts`)**: Added filter tabs `[ All ]`, `[ Built-in ]`, and `[ My Scripts ]` with dynamic count badge. Integrated dynamic catalog entries and user scripts from `ScriptStore` with single-click chart addition, automated runtime compilation, and an empty state guiding users to the Script Editor dock.
- **Monaco Editor Typings, In-Memory Worker & Debounced Draft Persistence (`src/scripting/monacoManager.ts`, `src/ui/ScriptEditorPanel.ts`, `src/scripting/templates.ts`, `src/ui/SDKHelpModal.ts`)**: Synchronized Monaco's in-memory TypeScript language worker (`addExtraLib`) via `ystc-sdk-raw.ts` and added code snippets for all math functions. Implemented debounced draft persistence (`ystc_script_draft_${id}`) on model content changes with restoration on load. Upgraded built-in starter templates (`templates.ts`) to comprehensively showcase Bollinger Bands (multi-line figures, line styles, `inline` layout, section headers, reactive conditions), Target Channel (multi-step overlay geometry with `polygon` shading), and MA+RSI Strategy, aligning with the interactive documentation in `SDKHelpModal.ts`.

## 2026-10-20

### Feature: Native Dynamic Candle Bar Recoloring for VSA & 50% High-Low Two-Tone Anomaly Split (chartSettings.ts, ChartManager.ts, volumeSpreadAnalysis.ts, vsaPlotter.ts)

- **KlineCharts Native Dynamic Candle Bar Callback (`src/chart/chartSettings.ts`)**: Integrated KlineCharts v10.1.0's native dynamic `candle.bar` callback via `DynamicBarColorResolver`. Replaced synthetic overlay candle/spine/wick figure redraws with native engine styling (`color`, `borderColor`, `wickColor`), ensuring 100% pixel-accurate rendering across all chart types (`candle_solid`, `candle_stroke`, `candle_up_stroke`, `candle_down_stroke`, and `ohlc`) with zero z-index fighting or canvas ghosting.
- **Dynamic Color Orchestration & State Lifecycle (`src/chart/ChartManager.ts`)**: Wired `applyCurrentChartSettings` to evaluate active `volumeSpreadAnalysis` and `vsaPlotter` overlays, resolving timestamps to their respective VSA diagnostic colors. Registered `vsa:bar-colors:update` eventBus listener to re-evaluate candle styles whenever overlays compute, update, or clear.
- **VSA Bar Color Publication & Overlay Figure Simplification (`src/overlays/volumeSpreadAnalysis.ts`)**: Exported `getActiveVsaBarColors()` and updated `clearVsaOverlayData()`. Dispatched `vsa:bar-colors:update` when calculations complete or change. Removed all synthetic candle body/wick/OHLC figures from the overlay figure loop, retaining only true overlays (Bulge Zones, FSYBHL forward projection rays, S/R lines, Gap zones, Value Area lines, and interactive Signal Dots).
- **50% High-Low Two-Tone Anomaly Split for `halfBlueWhite` (`src/overlays/vsaPlotter.ts`)**: Re-architected the `halfBlueWhite` Effort-Without-Result anomaly figure to split precisely at the 50% High-Low range midpoint ($\text{midY} = \frac{\text{highY} + \text{lowY}}{2}$). In OHLC mode, renders upper spine in solid blue and lower spine in bordered white with ticks assigned to their respective half; in Candlestick mode, renders upper wick in blue, lower wick in bordered white, and splits the body at `midY` into upper blue and lower white fill with a high-contrast border stroke for light-theme visibility. Single-color bars (Ultra Blue, Purple, PaleVioletRed EVR, Yellow, Cyan, Gray) are routed 100% natively via `getActiveVsaPlotterBarColors()`.

### Fix: Dynamic OHLC & Hollow Candle Styling for VSA Overlays (vsaPlotter.ts, volumeSpreadAnalysis.ts)

- **Dynamic Candle Style Adaptation in VSA Plotter (`src/overlays/vsaPlotter.ts`)**: Integrated runtime style inspection (`chart.getStyles()?.candle?.type`) inside `createPointFigures`. When `candleType === 'ohlc'` (or `'area'`), generates native OHLC tick figures (vertical spine from High to Low with horizontal left Open and right Close ticks) instead of solid rectangles. Added two-tone OHLC rendering for `halfBlueWhite` bars (solid blue top half, dashed blue bottom half for contrast). When in hollow candle modes (`candle_stroke`, `candle_up_stroke`, `candle_down_stroke`), dynamically sets rectangular body figure style to `stroke` or `fill` depending on bar direction.
- **Dynamic Candle Style Adaptation in MVPSA (`src/overlays/volumeSpreadAnalysis.ts`)**: Integrated runtime candle style detection in the bar recoloring loop. When `candleType === 'ohlc'` or `'area'`, renders full OHLC spine and ticks in the active VSA diagnostic color (`blue`, `purple`, `cyan`, `yellow`, `evr`, `gray`) while preserving `_vsaDot` figure attachment and hit-testing coordinates for the institutional diagnostic modal. Supports hollow `stroke` bodies for bullish bars under hollow candle display modes.
- **Institutional Dot Hit-Testing & Modal Trigger Fix (`src/overlays/volumeSpreadAnalysis.ts`)**: Corrected truthy guard `hasCandleDot = Boolean(barAnalysis.candleDotInfo)` to properly populate `visibleDots` for canvas hit-testing and attach `_vsaDot` metadata to recolored figures. Added `vsa_ohlc_` key prefix matching inside overlay `onClick` to reliably dispatch `vsa:dot:click` and display `VSADotAnalysisModal` across both Candlestick and OHLC bar rendering modes.

## 2026-10-19

### Feature: VSA Plotter (MVPSA) by YSTC — Mathematical Engine, Overlay Figures, & Interactive Modal (vsaPlotter.ts, vsaPlotterSettings.ts, VSAPlotterModal.ts, ChartManager.ts, ToolBar.ts, main.ts)

- **Mathematical Calculation Engine (`src/utils/vsaPlotter.ts`)**: Built the complete VSA Plotter analysis engine reverse-engineered from `VOFAplotter`. Implements rolling SMAs for Volume (14, 30), Spread (20), and Bar Size (10). Features 7-color candle classification: Ultra Blue (`2.8x`), Above-Average Purple (`1.5x`), Half-Blue/Half-White split body (effort without result anomaly), PaleVioletRed (multi-ratio EVR disparity matrix), Yellow (bullish/bearish trap reversal & 3-bar contracting ultra-volume sequence), Cyan (shakeout & spring confirmation), and Gray (consecutive volume decay).
- **10-Day Dynamic S/R & FSYBHL Forward Rays (`src/utils/vsaPlotter.ts`, `src/overlays/vsaPlotter.ts`)**: Implemented dynamic 10-day Resistance (with $\ge 3\%$ confirmed pullback) and Support (with $\ge 3\%$ confirmed rally) lines extending forward until pierced, plus First Swing High/Low of day (FSYBHL) 30-day forward projection rays and shaded Bulge Zone corridors.
- **Bar 1 / Bar 2 Trade Setup Engine & Exact 1:3 R:R (`src/utils/vsaPlotter.ts`)**: Implemented institutional Bar 1 / Bar 2 trade setup generators. Generates exact Entry, Stop Loss, and strict **1:3 Risk-to-Reward Targets** ($\text{Entry} \pm 3.0 \times \text{Risk}$) for BUY (`BUY-01` Absorption Trap) and SELL (`SELL-01` Distribution Trap) opportunities.
- **KlineCharts Overlay Figures & Interactive Hit-Testing (`src/overlays/vsaPlotter.ts`, `src/chart/ChartManager.ts`)**: Built `vsaPlotterOverlay` generating candle recoloring (`line` and `rect`), split half-blue/half-white candle bodies, horizontal ray lines, and shaded bulge zones. Generates on-chart clickable `[▲ BUY]` / `[▼ SELL]` signal badges and setup tags. Recorded screen bounding boxes for pointerdown hit-testing (`findVsaPlotterTradeSignalHit`). Clicking any badge dispatches `vsa:tradesignal:click`, opening the interactive `VSATradeSignalModal` with institutional metrics, R:R calculation, and 1-click order execution.
- **Settings Schema & Unified Modal Chrome (`src/overlays/vsaPlotterSettings.ts`, `src/ui/VSAPlotterModal.ts`, `src/main.ts`, `src/ui/ToolBar.ts`)**: Implemented `VsaPlotterSettings` schema and localStorage persistence (`ystc_vsa_plotter_settings`). Re-architected `VSAPlotterModal` strictly conforming to the `ui-component` skill specification using unified modal chrome (`vp-settings-modal`, `buildModalHeader`, `buildModalFooter`), tab navigation (`Inputs` vs. `Visual Styles`), standardized form fields (`vp-settings-toggle--tv`, `vp-settings-range__input`), accessible color pickers with real-time preview, and `attachModalKeyNav` keyboard focus trapping. Wired toolbar right-click/contextmenu and chart overlay settings triggers to `vsaPlotter:settings:toggle`.
- **VSA Plotter Settings Live Preview & Dynamic Overlay Synchronization (`src/ui/VSAPlotterModal.ts`, `src/chart/ChartManager.ts`, `src/overlays/vsaPlotter.ts`)**: Wired real-time `vsaPlotter:settings:apply` event dispatching to `emitPreview()`, `handleSave()`, `handleCancel()`, and `handleReset()` in `VSAPlotterModal`. Connected `ChartManager` to listen to `vsaPlotter:settings:apply` and dynamically update active `vsaPlotter` overlays using `chart.overrideOverlay({ id, extendData })`. Added strict overlay visibility guards in `vsaPlotter.ts` for S/R rays (`settings.showSupportResistance`), FSYBHL forward projection rays (`settings.showFSYBHLRays`), trade signal badges (`settings.showSignalsOnChart`), and wired configurable colors for ultra-blue, purple, EVR, yellow, cyan, gray, S/R, and FSYBHL rays. Registered `vsaPlotter` in `PERSISTABLE_OVERLAYS` and `DRAWING_SYNC_EXCLUDED_OVERLAYS`.
- **Candle Rendering Fidelity, Black Color Fix & Header Watermark Badge (`src/overlays/vsaPlotter.ts`, `src/overlays/vsaPlotterSettings.ts`, `src/ui/VSAPlotterModal.ts`)**: Aligned candlestick geometry with native KlineCharts bar spacing (`chart.getBarSpace().gapBar`, `candleHalfWidth * 2`, `Math.min(openY, closeY)`). Resolved Canvas 2D default-to-black issue caused by raw `var(...)` CSS variable strings in overlay figures by sanitizing default palette to explicit hex values (`#2196F3`, `#9C27B0`, `#E91E63`, `#FFEB3B`, `#00BCD4`, `#9E9E9E`, `#00BFFF`) and wrapping all figure color assignments in `resolveOverlayColor()`. Added stroke border around the white lower half of `halfBlueWhite` institutional anomaly candles to prevent visual severing on light chart backgrounds. Repositioned and styled the header watermark pill badge at `(x: 10, y: 42)` (`VSA Plotter (MVPSA) by YSTC`) with high-contrast text and border chrome.

### Upgrade: KlineCharts v10.1.0 & Local API Documentation Sync (package.json, AGENTS.md, chartSettings.ts)

- **KlineCharts Dependency Upgrade (`package.json`, `package-lock.json`)**: Upgraded `klinecharts` from `^10.0.4` to `^10.1.0`. Incorporates core upstream improvements including hierarchical time tick caching for smoother axis scrolling, pointer-leave drag continuity on X and Y axes, rapid click sequence recognition, logarithmic Y-axis coordinate conversion fixes, and multi-axis overlay label rendering deduplication.
- **Architectural Documentation Synchronization (`AGENTS.md`)**: Updated the official frozen local source of truth path from `doc/klinecharts-v10.0.3/` to `doc/klinecharts-v10.1.0/` across architecture rules, indicator/overlay references, and documentation tables.
- **Last Price Mark Typings Synchronization (`src/chart/chartSettings.ts`)**: Added `color: null` and `backgroundColor: null` configurations to `CandleLastPriceMarkStyle` (`line`, `text`, `extendTexts`) conforming to v10.1.0's dynamic color callback typings while maintaining current theme styling and countdown formatting.

### Fix: MVPSA Buy/Sell Trade Signal Marker Click & Info Modal Dispatch (ChartManager.ts, overlays/volumeSpreadAnalysis.ts)

- **Trade Signal Screen Coordinate Tracking & Hit-Testing (`src/overlays/volumeSpreadAnalysis.ts`)**: Added `VsaVisibleTradeSignal` interface and `activeVisibleTradeSignalsByChartId` map. Recorded precise hit-test bounding boxes encompassing `▲ BUY` / `▼ SELL` badge text and setup ID labels across visible candles during `createPointFigures`. Exported `findVsaTradeSignalHit()` with bounding box containment and proximity tolerance, and added `clearVsaOverlayData()` for cache lifecycle teardown.
- **Pointerdown Interception & Overlay Callback Delegation (`src/chart/ChartManager.ts`)**: Wired `handleChartStagePointerDown` to hit-test trade signal coordinates before generic canvas interactions. Clicking a signal badge immediately emits `vsa:tradesignal:click` with trade parameters, cursor coordinates, and symbol/timeframe context, triggering `VSATradeSignalModal`. Restored `value.onClick?.(event)` delegation inside the overlay registration wrapper (`createOverlayCreate`) so custom overlay figure click handlers are not shadowed by floating drawing toolbar handlers.

## 2026-10-17

### Object Tree & Layers Manager (ObjectTreeView.ts, objectTreeTypes.ts, ChartManager.ts, OrderPanel.ts, RightDock.ts, ChartContextMenu.ts, style.css)

- **Object Tree & Layers Side Panel (`src/ui/ObjectTreeView.ts`, `src/chart/objectTreeTypes.ts`)**: Built a pure DOM hierarchical layers manager component. Provides real-time listing of active chart indicators (main pane and sub-panes) and on-chart user drawings with human-readable nomenclature (Trend Line, Horizontal Ray, Rectangle, Fibonacci Retracement, MVPSA Analysis, etc.). Features collapsible accordion sections, item counts, symbol/timeframe context badge, and row selection highlighting.
- **Per-Item Layer Controls (`src/ui/ObjectTreeView.ts`, `src/chart/ChartManager.ts`)**: Added interactive action buttons for each layer row: visibility toggle (`👁`), lock toggle (`🔒`), settings modal launcher (`⚙`), and deletion (`🗑`). Clicking an item row highlights and selects the drawing directly on the chart canvas and triggers the floating drawing toolbar.
- **Global Batch Drawing Actions (`src/ui/ObjectTreeView.ts`, `src/chart/ChartManager.ts`)**: Implemented global "Hide All / Show All", "Lock All / Unlock All", and a two-step confirmation "Clear All Drawings" action toolbar for bulk drawing layer management.
- **Decoupled EventBus Synchronization Contract (`src/chart/ChartManager.ts`, `src/utils/eventBus.ts`)**: Implemented `objects:request` and `objects:sync` protocols. `ChartManager` automatically broadcasts active indicator and overlay snapshots on drawing history recordings, indicator mutations, drawing persistence loads, and symbol/timeframe switches, filtering out internal system execution overlays. Added dedicated handlers for `objects:overlay:*`, `objects:indicator:*`, and `objects:drawings:*`.
- **RightDock & Context Menu Navigation (`src/ui/RightDock.ts`, `src/ui/OrderPanel.ts`, `src/ui/ChartContextMenu.ts`)**: Expanded `RightPanelView` union to include `'objects'`. Added an isometric stacked layers button to `RightDock` and an "Object Tree..." entry to `ChartContextMenu`. Wired `OrderPanel.build()` to mount `ObjectTreeView` under `view === 'objects'`.
- **White Theme Design Token Styling (`src/style.css`)**: Styled `.object-tree-panel`, headers, badges, accordions, and hover/active states using CSS design variables (`var(--token)`) without hardcoded hex values.

## 2026-10-16

### Floating Drawing Toolbar Dismissal & Option D Starred Drawing Favorites Bar (FloatingDrawingToolbar.ts, ChartManager.ts, DrawingFavoritesBar.ts, ToolBar.ts, main.ts, style.css)

- **Comprehensive Floating Toolbar Outside Click & Lifecycle Dismissal (`src/ui/FloatingDrawingToolbar.ts`)**: Added a global `pointerdown` listener on `document` with microtask show-time protection to dismiss the floating drawing toolbar whenever the user clicks outside the toolbar or active modals/swatches. Extended dismissal event bindings across `overlay:select`, `overlay:cancel`, `symbol:change`, `timeframe:change`, and `replay:toggle`.
- **Chart Stage Deselection & Keyboard Escape Synchronization (`src/chart/ChartManager.ts`, `src/ui/FloatingDrawingToolbar.ts`)**: Wired `handleChartStagePointerDown` to detect empty-canvas clicks via microtask overlay hit tracking, automatically resetting `selectedOverlayId = null` and emitting `overlay:floating-toolbar:hide`. Added `onClick` and `onPressedMoveStart` figure listeners to retain overlay selection during interaction. Synchronized `Escape` key event handling in `FloatingDrawingToolbar` to broadcast `overlay:floating-toolbar:hide` and clear `selectedOverlayId` in `ChartManager`, preventing unintended drawing deletions on subsequent `Backspace`/`Delete` key presses.
- **In-Canvas Starred Drawing Tools Floating Favorites Bar (`src/ui/DrawingFavoritesBar.ts`, `src/main.ts`, `src/style.css`)**: Implemented a pure DOM draggable floating favorites dock (`.drawing-favorites-bar`) directly on the chart canvas. Supports viewport-boundary drag-and-drop with persistent coordinates (`ystc_drawing_favorites_pos`), active tool highlighting synced with chart overlay selections, and a dismiss button (`✕`) with persistence (`ystc_drawing_favorites_visible`). Preconfigured defaults to Trendline, Horizontal Ray, Fib Retracement, and Rectangle.
- **Left Rail Star Affordance & Dynamic Favorites Bar Toggle (`src/ui/ToolBar.ts`, `src/ui/DrawingFavoritesBar.ts`, `src/style.css`)**: Added hover and active star toggle buttons (`.tool-btn__star`) across all drawing tool icons in the left rail. Clicking the star toggles tool presence in `localStorage` (`ystc_drawing_favorites`) and broadcasts `drawing:favorites:update` without activating drawing mode. Added a dynamic star toggle button to the utility section of the tool rail that shines filled golden yellow (`var(--accent-star, #f5a623)`) when the favorites bar is active/visible, and switches to neutral uncolored outline (`currentColor`) when hidden.


### MVPSA Settings Wiring, Cache Key Synchronization & Interactive Styles (volumeSpreadAnalysis.ts, overlays/volumeSpreadAnalysis.ts, VolumeSpreadAnalysisModal.ts)

- **Comprehensive Memoization Cache Key Invalidation (`src/utils/volumeSpreadAnalysis.ts`)**: Expanded `getVsaCalculationSettingsKey()` to include all functional parameters (lookbacks, multipliers, thresholds, calibration modes, and color tokens). Changes to any parameter immediately invalidate the calculation cache and trigger recalculation without returning stale entries.
- **Dynamic Calculation Multipliers & Lookbacks (`src/utils/volumeSpreadAnalysis.ts`)**: Replaced hardcoded moving average periods and volume thresholds with user-configured settings: `blueLookbackBars` / `highVolumeLookback` for 14-bar SMA baseline, `purpleLookbackBars` / `indigoVolumeLookback` for 30-bar SMA baseline, `spreadAvgLookback` / `yellowBarSizeLookback` for rolling spread, and dynamic volume surge multipliers (`blueVolumeMultiplier`, `purpleVolumeMultiplier`, `yellowVolumeMultiplier`).
- **Master `VSAOnlyMode` Structural Gating (`src/utils/volumeSpreadAnalysis.ts`, `src/overlays/volumeSpreadAnalysis.ts`)**: Enforced `vsaOnlyMode !== false` gating across all structural and contextual lines and zones (10-day swing S/R, climactic event S/R, FSYBHL yellow rays, 15-minute opening range boundaries, bulge zones, gap projection zones, and cyan value area levels).
- **Horizontal Structural Zones Ground Truth Engine (`src/utils/volumeSpreadAnalysis.ts`, `src/overlays/volumeSpreadAnalysis.ts`)**: Implemented Primary ($3.0\times$ spread and volume) and Secondary ($1.0\times$ spread and $4.5\times$ volume) institutional supply and demand zones based on 30-period prior moving averages for bars closing in the outer 30% of their range. Extended zones until price contact or breach, rendering shaded rectangles with configurable `zoneTransparency`.
- **Interactive Visual Style Color Pickers (`src/ui/VolumeSpreadAnalysisModal.ts`)**: Replaced read-only hex swatches in Visual Styles tab with interactive HTML5 color inputs bound directly to `settings.blueBarColor`, `settings.stoppingVolumeColor`, `settings.supportLineColor`, etc., with live `emitPreview()` updates. Synchronized primary lookback/multiplier inputs with their legacy alias counterparts.
- **Hybrid Support & Resistance Engine Default (`src/overlays/volumeSpreadAnalysisSettings.ts`, `src/ui/VolumeSpreadAnalysisModal.ts`)**: Set `srDetectionMode` default and normalizer fallback to `'both'` (Recommended Hybrid: combining 10-session 3% swing pullback lines with automated climactic event lines at Blue Bars, Climaxes, and Upthrusts), while keeping `'tenDayPullback'` (pure ground truth) and `'climacticEvents'` fully selectable in the Levels & Zones settings tab.
- **Shakeout Dot Color & Modal Title (Deep Charcoal `#212121`) (`src/overlays/volumeSpreadAnalysis.ts`, `src/overlays/volumeSpreadAnalysisSettings.ts`, `src/ui/VolumeSpreadAnalysisModal.ts`, `src/ui/VSADotAnalysisModal.ts`)**: Configured default `shakeoutColor` to `#212121` (Deep Charcoal / Pitch Black), acting as the true neutral inverse of NinjaTrader's white dot on light-themed charts without green or blue color confusion. Added normalizer migration for legacy `#FFFFFF`, `#F5F5F5`, and `#546E7A` localStorage entries, and set `VSADotAnalysisModal` header title color to `#212121` for Shakeout bars to ensure unified, high-contrast typography.
- **Settings Modals Keyboard Ergonomics & Focus Trapping (`src/ui/modalChrome.ts`, `src/ui/FibonacciModal.ts`, `src/ui/RectangleModal.ts`, `src/ui/HorizontalRayModal.ts`, `src/ui/IndicatorSettingsModal.ts`, `src/ui/BrushModal.ts`, `src/ui/TextModal.ts`, `src/ui/CircleModal.ts`, `src/ui/VolumeSpreadAnalysisModal.ts`, `src/style.css`)**: Implemented non-destructive keyboard accessibility helpers (`keepTabInside`, `attachModalKeyNav`). Pressing `Tab` cycles focus strictly inside the dialog without leaking onto background charts, `Escape` safely cancels and dismisses the modal, and `ArrowLeft` / `ArrowRight` smoothly navigates across modal tabs. Added high-contrast `:focus-visible` styling for color popover swatches and navigation tabs.

### MVPSA Ground-Truth Mathematical Calibration & Origin Date Transparency (volumeSpreadAnalysis.ts, volumeSpreadAnalysisSettings.ts, VolumeSpreadAnalysisModal.ts, VSADotAnalysisModal.ts, style.css)

- **FSYBHL First Blue Bar Anchor Calibration (`src/utils/volumeSpreadAnalysis.ts`, `src/overlays/volumeSpreadAnalysisSettings.ts`)**: Added `fsybhlAnchorMode` ('blueOnly' default ground truth vs 'anyHighVolume') and `fsybhlRaySides` ('highOnly' default ground truth vs 'highAndLow') configurations. When in 'blueOnly' mode, yellow rays anchor strictly to the session's first Blue Bar (`vol >= 2.8 * SMA14`).
- **10-Day Multi-Session 3.0% Pullback Support & Resistance Engine (`src/utils/volumeSpreadAnalysis.ts`)**: Implemented rolling 10-session extreme tracker (`completedSessions`). Confirms Support Lines when price rallies $\ge +3.0\%$ from the 10-day session low and Resistance Lines when price declines $\ge -3.0\%$ from the 10-day session high. Added `srDetectionMode` ('both', 'tenDayPullback', 'climacticEvents') setting.
- **No Supply & No Demand 5-Bar Preceding Context & Fresh Session Low (`src/utils/volumeSpreadAnalysis.ts`)**: Enforced 5-bar preceding lookback window requiring an Ultra-High Volume bar (`vol >= 2.8 * SMA14`) or Wide Spread bar (`spread >= 1.25 * avgSpread20`). Added `noSupplyRequireSessionLow` filter requiring No Supply bars to test a fresh low of the session with lower-half close.
- **Stopping Volume Step-Down Progression (`src/utils/volumeSpreadAnalysis.ts`)**: Added strict step-down progression requiring a lower low than previous bar within the 5-bar window alongside $1.5\times \text{EMA}_{14}(\text{Volume})$ threshold and upper-half close.
- **Origin Date Transparency & Confluence Badges (`src/utils/volumeSpreadAnalysis.ts`, `src/ui/VSADotAnalysisModal.ts`, `src/style.css`)**: Enhanced `VsaConfluenceFactor` and `detectConfluences` to track `originTimestamp`, `originDateStr`, and `ageBars` across all institutional reference levels (FSYBHL lines, Support/Resistance rays, Value Area levels). Added monospace origin date badges (`.vsa-dot-modal__origin-badge`) and dynamic modal height budgeting (+60px for VA, +70px for Supply Test, +80px for dual confluences).
- **Settings Controls & Modal Tabs (`src/ui/VolumeSpreadAnalysisModal.ts`)**: Added dropdown pickers and toggles for Yellow Line Anchor Mode, Yellow Line Ray Projection, Support & Resistance Engine, Confluence Origin Date Transparency, and No Supply Fresh Session Low requirement.

## 2026-10-14

### On-Device AI Copilot & Local Directory Model Loading (LiteRTLMRunner.ts, LocalModelDirectoryService.ts, AICopilotView.ts, OrderPanel.ts, RightDock.ts, ScriptEditorHeader.ts, ScriptEditorPanel.ts, style.css, vite.config.mjs)

- **Local Model Directory Scanner (`src/scripting/ai/LocalModelDirectoryService.ts`)**: Implemented File System Access API scanner (`showDirectoryPicker()`) with recursive asynchronous generator to auto-discover local `.litertlm` model weights. Added IndexedDB directory handle persistence (`ystc_ai_storage`) and session permission queries (`queryPermission`) to remember and restore user model folders automatically across browser reloads.
- **WebGPU On-Device LLM Runner (`src/scripting/ai/LiteRTLMRunner.ts`)**: Integrated Google AI Edge's `@litert-lm/core` engine with hardware-accelerated WebGPU inference. Configured quantitative trading system prompt with strict `@ystc/sdk` authoring boundaries (`indicator`, `overlay`, `strategy`, `ctx.math`), asynchronous token generator streaming (`sendMessageStreaming()`), and GPU memory de-allocation (`engine.delete()`).
- **Interactive Copilot UI Component (`src/ui/AICopilotView.ts`)**: Created pure DOM AI Copilot slide-over view featuring WebGPU hardware detection badge, local folder picker button, dynamic model dropdown with formatted file sizes (GB), scrollable chat stream, starter prompts, and formatted code cards with one-click copy and Monaco script injection.
- **Right Dock & Panel Integration (`src/ui/RightDock.ts`, `src/ui/OrderPanel.ts`)**: Added `'copilot'` view to `RightPanelView`. Wired Gemma-4 star button in `RightDock` to toggle the right panel into the copilot view with active state indicators, and updated `OrderPanel.build()` to mount `AICopilotView`.
- **Script Editor Injection & Action Buttons (`src/ui/ScriptEditorHeader.ts`, `src/ui/ScriptEditorPanel.ts`)**: Added a `"✨ Copilot"` quick-access button to the Monaco editor toolbar. Wired `script:insert` event to automatically inject AI-generated `@ystc/sdk` code into the active Monaco editor tab and trigger script auto-saving.
- **Vite Chunking Isolation (`vite.config.mjs`)**: Configured `manualChunks` to split `@litert-lm/core` and `@litertjs/` into a dedicated `litert-lm` asset bundle, preserving lean startup performance.
- **Copilot UI Design Tokens (`src/style.css`)**: Styled `.ai-copilot-view` and child components with CSS variable tokens for chat bubbles, status indicators, directory picker rows, and code blocks adhering strictly to the white theme design system.

### MVPSA Volume Source Hardening, Dynamic Fallback & Unified Cache Lifecycle (volumeSpreadAnalysis.ts, overlays/volumeSpreadAnalysis.ts, VolumeSpreadAnalysisModal.ts, ChartManager.ts, fixedRangeVolumeProfile.ts)

- **Volume Source Cache Invalidation (`src/utils/volumeSpreadAnalysis.ts`)**: Appended `vpSourceMode`, `vpSourceSymbol`, and `vpCalculationMethod` into `getVsaCalculationSettingsKey()`, ensuring cache entries invalidate immediately whenever volume sources or calculation methods are changed or reverted back to chart volume.
- **Dynamic Chart Symbol Fallback (`src/overlays/volumeSpreadAnalysis.ts`)**: Replaced static `'SBIN-EQ'` 5-minute fallback with dynamic resolution from active chart symbol metadata (`chart.getSymbol()?.ticker` and exchange), eliminating invalid instrument requests on index or non-equity charts.
- **Pending Load Lifecycle Management (`src/overlays/volumeSpreadAnalysis.ts`)**: Added `clearVsaOverlayPendingLoads()` to reset active asynchronous volume source fetch tracking keys upon chart reloads and symbol switches.
- **Non-Disruptive Settings Preview (`src/ui/VolumeSpreadAnalysisModal.ts`)**: Removed redundant `eventBus.emit('chart:refresh')` calls from `emitPreview()`, `handleCancel()`, and `handleSave()`, allowing overlay figures to re-render via `overrideOverlay` without resetting chart data or dropping cached candles.
- **Unified Cache Eviction on Mode & Symbol Change (`src/chart/ChartManager.ts`)**: Implemented `clearOverlayAnalysisCaches()` to flush `clearVsaAnalysisCache()`, `clearVsaOverlayPendingLoads()`, `clearTpoProfileCaches()`, `clearFixedRangeProfileCache()`, `clearVolumeClusterRenderCache()`, and `clearVolumeClusterRequestVersions()` across `symbol:change`, `mode:change`, and manual `chart:refresh`.
- **Fixed Range VP Cache Eviction (`src/overlays/fixedRangeVolumeProfile.ts`)**: Exported `clearFixedRangeProfileCache()` to purge memoized volume profiles and in-flight source load requests across symbol transitions.

### Settings Modals Cancel Rollback, Live Preview & Anchored VWAP Tab Styling (style.css, IndicatorSettingsModal.ts, SessionVolumeProfileModal.ts, FixedRangeVolumeProfileModal.ts, AnchoredVwapModal.ts, CircleModal.ts)

- **Anchored VWAP & Circle Modal Tab Styles (`src/style.css`)**: Added `.vp-settings-modal__tabs` and `.vp-settings-modal__tab` selectors with active bottom underline, hover transitions, and typography tokens matching `.rectangle-settings-modal__tabs`, restoring TradingView-style tab navigation for Anchored VWAP (`Inputs`, `Style`, `Visibility`) and Circle modals.
- **Indicator Settings Cancel Rollback (`src/ui/IndicatorSettingsModal.ts`)**: Added pre-modal snapshot caching (`initialSource`, `initialVolumeYSTCSourceSettings`, `initialVolumeYSTCStyleSettings`) upon opening. Wired Cancel, header close, and backdrop clicks to `handleCancel()`, rolling back draft parameter edits, styles, and visibility, re-emitting original parameters to the chart, and closing cleanly without dirty state leaks.
- **Session Volume Profile Cancel Rollback & Live Preview (`src/ui/SessionVolumeProfileModal.ts`)**: Separated real-time live preview (`emitPreview()`) from permanent disk persistence (`applyAndSave()`). Added `initialSettings` snapshot on open; wired Cancel, header close, and backdrop to restore the snapshot and broadcast rollback to the chart; removed premature `localStorage` writes from `onReset` so defaults can be previewed without committing.
- **Fixed Range Volume Profile Cancel Rollback & Live Preview (`src/ui/FixedRangeVolumeProfileModal.ts`)**: Added `initialSettings` snapshot on open; separated `emitPreview()` from `applyAndSave()`; wired Cancel, header close, and backdrop clicks to `handleCancel()` to rollback overlay or default settings; deferred `localStorage` writes on reset until OK is confirmed.
- **Anchored VWAP Cancel Rollback & Live Preview (`src/ui/AnchoredVwapModal.ts`)**: Added `initialSettings` snapshot on open, live preview emission (`emitPreview()`) on all calculation mode, band multiplier, source, color, and band toggle changes, rollback on Cancel/backdrop/close, and deferred reset persistence until OK is clicked.
- **Circle Modal Cancel Rollback & Live Preview (`src/ui/CircleModal.ts`)**: Added `initialSettings` snapshot on open, live preview emission (`emitPreview()`) on border color, border size, border style, and background fill toggles, rollback on Cancel/backdrop/close, and deferred reset persistence.

### MVPSA Settings Modal Cancel Rollback & Live Preview Lifecycle (VolumeSpreadAnalysisModal.ts, ChartManager.ts)

- **Initial State Snapshot & Guaranteed Rollback (`src/ui/VolumeSpreadAnalysisModal.ts`)**: Implemented pre-modal snapshotting (`initialSettings`) on open. Clicking **Cancel**, the header close button, or backdrop cleanly rolls back all draft modifications, restores `this.settings = structuredClone(this.initialSettings)`, broadcasts rollback apply and sync events to the chart, and triggers an immediate canvas redraw without saving draft edits to `localStorage`.
- **Live Preview on Input Change (`src/ui/VolumeSpreadAnalysisModal.ts`)**: Added `emitPreview()` to all checkbox toggles, dropdown selectors, volume source pickers, and numeric inputs, providing instantaneous visual feedback on the chart canvas while the settings modal is active.
- **Deferred Reset Persistence (`src/ui/VolumeSpreadAnalysisModal.ts`)**: Removed premature `localStorage` writes from `handleReset()`, allowing users to preview default settings live with the ability to revert back to their customized snapshot via **Cancel** or commit via **OK**.
- **Context Open Settings Propagation (`src/chart/ChartManager.ts`)**: Updated `openOverlaySettingsFromContext()` to pass the target overlay's current `extendData` settings when opening the MVPSA modal from an on-chart overlay instance.

### MVPSA Levels & Zones Default Display Settings (volumeSpreadAnalysisSettings.ts)

- **Default State Updates for Structural Lines (`src/overlays/volumeSpreadAnalysisSettings.ts`)**: Updated `showSessionLines` and `showGapLines` defaults from `true` to `false` in `createDefaultVolumeSpreadAnalysisSettings()`, disabling Session & 15m Range Lines and Gap Projection Lines by default to reduce initial canvas clutter while keeping both options configurable via the Levels & Zones settings tab.

## 2026-10-13

### MVPSA Individual Signal Dot Filtering & Session Profile Cache Key Hardening (volumeSpreadAnalysis.ts)

- **Individual Signal Dot Gating (`src/utils/volumeSpreadAnalysis.ts`)**: Wired settings modal toggles (`enableStoppingVolume`, `enableSellingClimax`, `enableBuyingClimax`, `enableUpThrust`, `enableShakeout`, `enableNoSupply`, `enableNoDemand`) to respective signal sweep conditions, allowing users to selectively filter individual dot types on chart.
- **Session Profile Cache Key Hardening (`src/utils/volumeSpreadAnalysis.ts`)**: Incorporated session opening price into `computeSessionValueArea()` memoization cache key (`${firstTs}|${lastTs}|${openPrice}|...`), preventing cross-symbol Value Area cache collisions when switching between instruments sharing identical intraday timestamps and tick sizes.

### MVPSA Trade Signal Badge Display Gating & Cache Key Invalidation (volumeSpreadAnalysis.ts, overlays/volumeSpreadAnalysis.ts)

- **Trade Message Display Gating (`src/overlays/volumeSpreadAnalysis.ts`)**: Wired `settings.showTradeMessages` to conditionally gate automated trade signal badge figure generation (`vsa_tradesig_arrow_`), allowing users to toggle off `▲ BUY` / `▼ SELL` badge clutter from the Settings modal.
- **Cache Key Invalidation (`src/utils/volumeSpreadAnalysis.ts`)**: Added `showTradeMessages`, `showSignalsOnChart`, and all structural view toggles (`showCyanVALevels`, `showYellowLines`, `showSupportLines`, `showResistanceLines`, `showGapLines`, `showBulgeZones`, `showHorizontalZones`) to `getVsaCalculationSettingsKey()`, ensuring instant live canvas redraw when settings are toggled.

### MVPSA Diagnostic Checklist & Invalidation Text Blueprint Parity (volumeSpreadAnalysis.ts)

- **Exact Blueprint Text Parity for Signal Diagnostics (`src/utils/volumeSpreadAnalysis.ts`)**:
  - Restored full 5-item verification checklist and complete invalidation clause for UpThrust (`upThrust`) and Pseudo UpThrust (`pseudoUpThrust`) per Section 9.3 Modal 4, including single-bar ultra-high volume distribution guidance and Value Area proximity context.
  - Added missing Gray bar ultra-low volume absence confirmation (Checklist Item 3) to the Supply Test (`supplyTest`) diagnostic checklist per Section 9.3 Modal 9.
  - Appended full explanatory invalidation and weakening rationale to Stopping Volume (`stoppingVolume`), Selling Climax (`sellingClimax`), and Buying Climax (`buyingClimax`), detailing institutional absorption and distribution failure conditions.
  - Standardized complete phrasing across No Demand (`noDemand`) checklist items detailing institutional non-follow-through and resistance denial.

### MVPSA Visual Session Lines, Candle-Click Modals & Level Retest Dots (volumeSpreadAnalysis.ts, volumeSpreadAnalysisSettings.ts, VSADotAnalysisModal.ts)

- **Visual Session Lines & 15-Minute Opening Range (`src/utils/volumeSpreadAnalysis.ts`, `src/overlays/volumeSpreadAnalysis.ts`)**:
  - Implemented `VsaSessionLine` model tracking Session High, Session Low, and 15-minute Opening Range boundaries (`open15mHigh`, `open15mLow`) established across distinct intraday trading sessions (Section 6.6).
  - Extended levels forward horizontally across sessions, terminating upon full bar close breaches (`bar.close > price` for overhead lines; `bar.close < price` for underlying lines).
  - Integrated active session line prices directly into `blockingLevels` for `isSessionLineBlockingTrade()`, enforcing trade clearance gating when levels lie within 0.5% in the path of entry.
  - Added on-chart canvas ray rendering with dynamic labels (`Session High`, `Session Low`, `15m Open High`, `15m Open Low`) toggled by `settings.showSessionLines`.
- **Candle-Click Diagnostic Modals for Blue & EVR Bars (`src/utils/volumeSpreadAnalysis.ts`, `src/overlays/volumeSpreadAnalysis.ts`, `src/ui/VSADotAnalysisModal.ts`)**:
  - Attached `candleDotInfo` metadata to all Blue Bars (`candleColor === 'blue'`) for Modal 8 (`MVPSA — Sellers Being Absorbed`), capturing climactic absorption metrics, collapsed spread context, institutional line drawing, and multi-factor confluences (Section 9.3).
  - Attached `candleDotInfo` metadata to all EVR Bars (`candleColor === 'evr'`) for Modal 10 (`MVPSA — Strong EVR Bar`), capturing dynamic volume surge and spread contraction ratios, absorption direction (`selling pressure` / `buying pressure`), and Value Area confluences (Section 9.3).
  - Configured canvas hit-testing on candle body rects (`vsa_body_${i}`) and candle center coordinates, opening the interactive non-blocking diagnostic tool window on candle click.
- **Support, Resistance & Bulge Zone Retest Dots (`src/utils/volumeSpreadAnalysis.ts`, `src/ui/VSADotAnalysisModal.ts`)**:
  - Implemented Modal 11 level retest termination engine: generates Green Retest Dots (`#1D9E75`) at `bar.low - tickSize` when a pullback tests an active Support Line and closes in the upper 40% of its range, and Red Retest Dots (`#C0392B`) at `bar.high + tickSize` when a rally tests an active Resistance Line and closes in the lower 40% of its range.
  - Implemented Modal 12 Bulge Zone retest engine: generates Green/Red Retest Dots when pullbacks into P-profile or b-profile zones defend or reject, terminating zone extension and presenting the 6-step verification checklist.
  - Updated `VSADotAnalysisModal` banner accent styling and context field mappings for `lineRetest`, `zoneRetest`, `blueBarAbsorption`, and `evrBar` dot types.

### MVPSA Settings Modal Bottom Reset & Defaults Wiring (VolumeSpreadAnalysisModal.ts)

- **Template Footer Action Wiring (`src/ui/VolumeSpreadAnalysisModal.ts`)**: Added `handleReset()` and wired both `onReset` and `onDefaults` callbacks to `buildModalFooter()`, restoring full functionality to the bottom Template menu's "Reset" and "Apply defaults" actions by persisting default settings, re-rendering modal input fields, and broadcasting live sync and apply events to the chart.

### MVPSA Lower-Timeframe (1m) & Multi-Source Performance Optimization (volumeSpreadAnalysis.ts)

- **Master Engine Memoization Cache (`src/utils/volumeSpreadAnalysis.ts`)**: Implemented multi-entry cache (`vsaAnalysisCacheEntries`) in `buildVolumeSpreadAnalysis()` keyed by chart bars, source bars, settings hash (`getVsaCalculationSettingsKey`), and tick size, returning cached analysis results in 0.001 ms on pan, zoom, hover, and crosshair interaction frames to ensure steady 60 FPS responsiveness.
- **Session Value Area Profile Cache (`src/utils/volumeSpreadAnalysis.ts`)**: Added `vsaSessionProfileCache` to `computeSessionValueArea()` keyed by session timestamp bounds, bar count, and VP configuration, eliminating redundant lower-timeframe profile builds across historical days and running sessions.
- **WeakMap Multi-Source Aggregation & Day Slicing (`src/utils/volumeSpreadAnalysis.ts`)**: Wrapped `aggregateSourceVolumeToChartBars()` with `WeakMap<KLineData[], WeakMap<KLineData[], KLineData[]>>` and `buildSourceBarsBySessionDay()` with `WeakMap<KLineData[], Map<number, KLineData[]>>`, eliminating linear re-aggregation and daily partitioning of 40,000+ 1m source bars across redraws.
- **Guarded Intra-Session Running Value Area (`src/utils/volumeSpreadAnalysis.ts`)**: Enforced a minimum bar length guard (`runningVABars.length >= 5`) in `detectConfluences()`, preventing micro-slice profile builds while reusing memoized intraday value areas.

### MVPSA Calculation Method & Volume Source Parity Alignment (VolumeSpreadAnalysisModal.ts, volumeSpreadAnalysisSettings.ts)

- **Identical Calculation Method Dropdown & Dynamic Timeframes (`src/ui/VolumeSpreadAnalysisModal.ts`)**:
  - Aligned calculation method options and labels verbatim with Session Volume Profile: `Chart TF` (`same_tf`), `Free 5k bars` (`tv_style`), `Essential 10k bars` (`essential_10k`), `Plus 20k bars` (`plus_20k`), `Premium 40k bars` (`premium_40k`).
  - Added dynamic lower-timeframe source resolution via `getLowerVolumeProfileSourceFileCodes()`, automatically appending available granular timeframes (e.g., `1m`, `2m`, `3m` for a 5m chart) as `source_tf:<fileCode>`.
  - Added `calculationMethodHelpText()` providing contextual tooltip documentation for each selected method.
- **Shared Volume Source Selection (`src/ui/VolumeSpreadAnalysisModal.ts`)**:
  - Replaced manual text input with the platform-standard `getSourceSymbolOptions()` dropdown, providing the main chart symbol, discovered local symbols (e.g. active Futures), and the `Search symbol...` modal trigger.
- **Strict Calculation Method Normalization (`src/overlays/volumeSpreadAnalysisSettings.ts`)**:
  - Added `normalizeCalculationMethod()` to validate standard tiered calculation methods, fixed lower-timeframe formats (`isFixedTimeframeVolumeProfileMethod`), and fallback safely to `same_tf`.

### MVPSA Phase 4: Unified Session VP Engine & Multi-Source Institutional Volume Resolution (volumeProfile.ts, volumeSpreadAnalysis.ts, volumeSpreadAnalysisSettings.ts, VolumeSpreadAnalysisModal.ts, ChartManager.ts)

- **Unified Session Value Area Mathematical Engine (`src/utils/volumeSpreadAnalysis.ts`, `src/utils/volumeProfile.ts`)**:
  - Replaced internal coarse-bucket approximation with the exact platform-standard `buildVolumeProfile()` engine, matching on-chart Session Volume Profile overlay geometry out-of-the-box (`vpRowLayout: 'number_of_rows'`, `vpRowSize: 24`, `vpValueAreaPercent: 70%`, `tickSize: 0.05`).
  - Aligned session grouping to IST day boundaries via `getIstDayKey(timestamp)`, ensuring identical daily bar partitions across chart overlays.
  - Integrated lower-timeframe session source slicing (`sourceBarsByDay`) so Value Area VAH, VAL, and VPOC levels compute with granular sub-bar precision when multi-source data is active.
- **Complete-Indicator Multi-Source Institutional Volume Ingestion (`src/overlays/volumeSpreadAnalysis.ts`, `src/utils/volumeSpreadAnalysis.ts`, `src/chart/ChartManager.ts`)**:
  - Implemented external volume source ingestion (`vpSourceMode: 'chart' | 'symbol'`, `vpSourceSymbol`, `vpCalculationMethod`) across the entire MVPSA suite.
  - Added `aggregateSourceVolumeToChartBars` and `requestResolvedVsaSourceBars` pipeline: enables spot cash indices (e.g., `NIFTYBANK-INDEX`, `NIFTY 50`) with zero native volume to ingest volume directly from corresponding active Futures contracts (e.g., `BANKNIFTY26MARFUT`) across all 18 automated trade setups, VSA candlestick coloring, stopping volume, climaxes, and structural lines.
  - Added `syncVolumeSpreadAnalysisSourceSelection` in `ChartManager.ts` to seamlessly re-evaluate and re-fetch source bars whenever chart symbol or timeframe transitions.
- **Dedicated "Volume Source & Value Area" Settings Tab (`src/ui/VolumeSpreadAnalysisModal.ts`, `src/overlays/volumeSpreadAnalysisSettings.ts`)**:
  - Added dedicated 5th tab ("Volume & Profile") to the MVPSA Settings Modal with controls for Volume Source Mode (`Active Chart Symbol` vs `External Symbol`), Source Symbol text input (`BANKNIFTY26MARFUT`), Calculation Method dropdown (`same_tf`, `tv_style`, `essential_10k`, `plus_20k`, `premium_40k`, `secs_tf`), Rows Layout (`number_of_rows` / `ticks_per_row`), Row Size (`24`), Value Area % (`70%`), Confluence Tolerance (`12 ticks`), and High-Volume Session Multiplier (`5.0x`).

### MVPSA Phase 3: Trade Signal Execution Modal & Specialized Diagnostics (VSATradeSignalModal.ts, volumeSpreadAnalysis.ts, main.ts, style.css)

- **Automated Trade Signal Execution Modal (`src/ui/VSATradeSignalModal.ts`, `src/style.css`)**:
  - Implemented Modal 13 (`ShowTradeSignalPopup`) as a non-blocking, draggable floating tool window opening upon clicking any `▲ BUY` or `▼ SELL` automated setup marker (`vsa:tradesignal:click`).
  - Standardized 5-zone vertical card layout:
    - Directional header banner (`#1D9E75` for BUY, `#C0392B` for SELL) displaying setup ID, setup name, formatted timestamp, active symbol, and timeframe.
    - Institutional Trade Parameters card displaying 2-column metrics: Entry Trigger (`Buy Above` / `Sell Below`), Stop Loss, Target Price & Type, Risk:Reward ratio (`1 : {RR}`), Risk in ticks & points, and Potential Reward in ticks & points.
    - Directionally styled Execution Instructions callout box (`"Enter long above {Entry}. Stop below {SL}. Target {TP} [{TargetType}]."`).
    - Smart Money Context & Trigger Logic narrative explaining why the pattern formed.
    - Actionable 4-step execution and trade management checklist (candle close confirmation, bracket order entry, 1.0R breakeven stop trailing, target exit/scale out).
- **Specialized Setup Diagnostics Panel — Modal 14 (`src/ui/VSATradeSignalModal.ts`, `src/utils/volumeSpreadAnalysis.ts`)**:
  - Populated specialized institutional metrics for complex setups:
    - `PBW_Sell`: Displays Bar 1 High/Low range, Bar 2 Low, Bar 2 High, and 2.0R target ratio.
    - `SBar2YellowWeakness`: Displays Prev Day VAH, Low vs VAH % clearance ($\le 0.5\%$), and Yellow Bar High/Low.
    - `ZoneResistSell`: Displays Bulge Zone High/Low, rejection high, and close in lower 40%.
- **Application Bootstrap & DOM Mounting (`src/main.ts`)**:
  - Mounted `#vsa-trade-signal-modal-root` container and instantiated `VSATradeSignalModal` alongside `VSADotAnalysisModal`.

### MVPSA Phase 2: 18 Automated Trade Setups & Execution Filters (volumeSpreadAnalysis.ts, volumeSpreadAnalysisOverlay.ts)

- **18 Automated Institutional Trade Setups (`src/utils/volumeSpreadAnalysis.ts`)**:
  - Implemented full evaluation engine for 10 Bullish Trade Setups:
    - `STLine_Buy`: Support line retest + supply test confirmation.
    - `Bar2_Buy`: Opening bar absorption with high-volume rejection.
    - `SOP_Buy`: Shakeout pattern + next-bar bullish confirmation.
    - `SC_YB_Buy`: Selling climax bottoming + yellow line confluence.
    - `WSWS_Buy`: Wide-spread downbar absorption + reversal.
    - `BBYLST_Buy`: Blue bulge zone + yellow line + supply test confluence.
    - `BBA_Buy`: Bulge zone bottom absorption (fixed 1.1R target).
    - `GraySupplyTest`: Gray supply test bar with low volume in value area.
    - `CSOP_Buy`: Climax shakeout pivot confirmation.
    - `Reversal_Buy`: Multi-bar VSA stopping volume reversal structure.
  - Implemented full evaluation engine for 8 Bearish Trade Setups:
    - `OBR_Sell`: Resistance line retest + upthrust rejection.
    - `BC_Weakness_Sell`: Buying climax topping structure with heavy distribution.
    - `PBW_Sell`: Pseudo upthrust + next-bar weakness confirmation.
    - `SBar2YellowWeakness`: Bar 2 session failure testing yellow resistance line.
    - `ZoneResistSell`: Bulge resistance zone rejection.
    - `SOYLR_Sell`: Sell off yellow line resistance retest.
    - `CyanVA_Sell`: Cyan VA line rejection from historical high-volume level.
    - `BBWS_Sell`: Bearish bulge zone breakdown with expanding spread.
- **Institutional Execution & Safety Filters (`src/utils/volumeSpreadAnalysis.ts`)**:
  - `isRRAcceptable`: Default $0.8R$ minimum Risk:Reward threshold with zero-risk distance guard ($1.1R$ fixed setups like `BBA_Buy` safely clear).
  - `checkSellAboveVAHRestriction`: Rejects short trades triggered within $< 0.5\%$ distance above previous day VAH due to institutional bounce risk.
  - `isSessionLineBlockingTrade`: Verifies that no active structural support/resistance or Cyan VA level lies within $0.5\%$ of entry in the direction of the trade.
- **Chart Figure Rendering & Event Routing (`src/overlays/volumeSpreadAnalysis.ts`)**:
  - Renders directional entry badges (`▲ BUY` in forest green `#2E7D32` and `▼ SELL` in crimson `#C62828`) positioned above/below trigger candles with setup ID caption.
  - Registered click detection routing via `eventBus.emit('vsa:tradesignal:click', signal)` to trigger execution popups.

### MVPSA Phase 1: Institutional Structural Lines & Extensions (volumeSpreadAnalysis.ts, volumeSpreadAnalysisOverlay.ts)

- **Dynamic Support & Resistance Tracking (`src/utils/volumeSpreadAnalysis.ts`)**:
  - Implemented dynamic support line engine anchored at swing lows of Selling Climaxes, Stopping Volume, and Blue Absorption bars (`VsaSupportLine`). Extends lines horizontally forward until a bearish breakdown close (`Close[i] < LinePrice`), locking as a fixed historical line segment upon termination.
  - Implemented dynamic resistance line engine anchored at swing highs of Buying Climaxes and Upthrust bars (`VsaResistanceLine`). Extends lines horizontally forward until a bullish breakout close (`Close[i] > LinePrice`), locking as a fixed historical line segment upon termination.
- **Cyan Value Area Level Forward Extensions (`src/utils/volumeSpreadAnalysis.ts`)**:
  - Implemented High-Volume Session gating ($V > 5.0 \times \text{priorSMA}_{14}$). Historical session VAH and VAL levels for qualifying sessions are projected forward as Cyan lines (`VsaCyanVALine`) until terminated upon the first bar touch or penetration (`Low[i] <= LinePrice <= High[i]`).
- **Session Open Gap Detection & Rectangles (`src/utils/volumeSpreadAnalysis.ts`)**:
  - Implemented opening session gap engine tracking price voids between session bar 1 and prior session close (`VsaGapZone`). Extends shaded gap rectangles and boundary lines until price trades into and fills the gap.
- **Second-Last Session Settlement Dots (`src/utils/volumeSpreadAnalysis.ts`)**:
  - Implemented settlement positioning dots (`secondLastSession`, `#E91E63`) placed on bar $N-1$ of daily sessions at High + 1T (`SLS_B2_H_`) and Low - 1T (`SLS_B2_L_`) to track overnight inventory bias.
- **KlineCharts Figures Rendering (`src/overlays/volumeSpreadAnalysis.ts`)**:
  - Renders Support Lines (solid green/indigo ray, dashed upon termination), Resistance Lines (solid red/indigo ray, dashed upon termination), Cyan VA Lines (cyan `#00BCD4`), and Gap Rectangles (translucent fill with dashed boundary lines).
  - Wired into existing visibility toggles (`showSupportLines`, `showResistanceLines`, `showCyanVALevels`, `showGapLines`).

### MVPSA Platform Branding & Architecture Persistence (volumeSpreadAnalysis.ts, ToolBar.ts, VolumeSpreadAnalysisModal.ts, AGENTS.md)

- **Proprietary MVPSA Architecture & Nomenclature (`src/utils/volumeSpreadAnalysis.ts`, `AGENTS.md`)**:
  - Rebranded analysis suite from legacy external references (VOFA) to proprietary acronym **MVPSA** (Market & Volume Profile Spread Analysis):
    - **MVP**: Market Profile (Time distribution, Value Area, Initial Balance) + Volume Profile (VPOC, High/Low Volume Nodes, Volume distribution).
    - **SA**: Spread Analysis (Bar-by-bar spread, Effort vs. Result, Supply/Demand tests).
  - Synchronized all 9 signal dot titles: `MVPSA — Stopping Volume`, `MVPSA — Selling Climax`, `MVPSA — Buying Climax`, `MVPSA — Upthrust Bar`, `MVPSA — Pseudo Upthrust`, `MVPSA — Shakeout Bar`, `MVPSA — No Supply Bar`, `MVPSA — No Demand Bar`, and `MVPSA — Supply Test Bar`.
  - Updated institutional confluence titles: `⚡ NEAR MVPSA SUPPORT LINE — Institutional Level` and `⚡ NEAR MVPSA RESISTANCE LINE — Institutional Level`.
  - Added architectural governance guidelines in `AGENTS.md` and prominent code comments across all MVPSA modules prohibiting regression or reversion to VOFA in future iterations.

- **UI & Canvas Labels Synchronization (`src/ui/ToolBar.ts`, `src/ui/VolumeSpreadAnalysisModal.ts`, `src/overlays/volumeSpreadAnalysis.ts`)**:
  - Updated left toolbar action tooltip and label to `Volume Spread Analysis (MVPSA) by YSTC`.
  - Updated settings modal window header to `Volume Spread Analysis (MVPSA) by YSTC`.
  - Updated chart canvas overlay watermark badge to `Volume Spread Analysis (MVPSA) by YSTC`.

### VSA Dynamic Confluence Factor Engine & NinjaTrader VOFA Color Scheme (volumeSpreadAnalysis.ts, VSADotAnalysisModal.ts, style.css)

- **Dynamic Multi-Factor Confluence Detection Engine (`src/utils/volumeSpreadAnalysis.ts`)**:
  - Implemented session-level Value Area tracking (`computeSessionValueArea`) calculating historical and running session VAH, VAL, and VPOC (POC) with `MM DD` calendar dating.
  - Implemented proximity-based confluence evaluation (`detectConfluences`) testing four institutional dimensions within a configurable 12-tick / 0.15% threshold:
    - Value Area Confluence: Triggers `⚠ VALUE AREA CONFLUENCE — VAH/VAL/VPOC FROM MM DD` with directional reaction rationale (support test, absorption, or rejection).
    - FSYBHL Confluence: Triggers `⚡ NEAR YELLOW LINE (FSYBHL) — Institutional Level` when testing active 30-day structural highs or lows.
    - Support / Resistance Confluence: Triggers `⚡ NEAR VOFA SUPPORT/RESISTANCE LINE` when reacting against prior climax / stopping volume structural turning points.
    - Trend Exhaustion Confluence: Triggers `⭐ AFTER PROLONGED DOWNTREND/UPTREND — Classic Exhaustion` after $\ge 5$ consecutive lower lows (bullish) or higher highs (bearish).
  - Integrated dynamic confluence evaluation across all 9 signal dot types (`stoppingVolume`, `sellingClimax`, `buyingClimax`, `upThrust`, `pseudoUpThrust`, `shakeout`, `noSupply`, `noDemand`, `supplyTest`).

- **NinjaTrader VOFA Color Theming & Layout Architecture (`src/ui/VSADotAnalysisModal.ts`, `src/style.css`)**:
  - Formatted "WHAT THIS BAR MEANS" as clean, unbordered narrative text followed by a subtle 1px divider line (`.vsa-dot-modal__divider`).
  - Standardized "SIGNAL CONTEXT" into a 2x2 grid followed by a divider line.
  - Styled Confluence Factor callouts:
    - Institutional lines (Yellow FSYBHL / Support / Resistance / Exhaustion) rendered in gold callout cards (`#FEF9E7`, border-left `3px solid #D4AC0D`).
    - Value Area confluences rendered in dual-layer containers featuring a vibrant orange header banner (`#F39C12`) with warning icon and cream body text (`#5D4037`).
  - Directionally styled "WHAT TO WATCH FOR":
    - Bullish signals: Light sage green background (`#EAF3DE`), green border (`#D5E8D4`), solid green left accent (`border-left: 3px solid #639922`), dark forest checklist text (`#1E3A1A`), and deep green invalidation callout (`#274E13`).
    - Bearish signals: Light rose background (`#FDF2F2`), rose border (`#FADBD8`), solid red left accent (`border-left: 3px solid #C0392B`), dark crimson checklist text (`#4A1515`), and deep burgundy invalidation callout (`#900C3F`).

### VSA Diagnostic Modal & Drawing Toolbar Fixes (VSADotAnalysisModal.ts, ChartManager.ts, style.css, volumeSpreadAnalysis.ts)

- **Draggable Diagnostic Tool Window (`src/ui/VSADotAnalysisModal.ts`, `src/style.css`)**:
  - Converted the VSA diagnostic modal into a non-blocking floating tool window matching NinjaTrader's VOFA specification.
  - Eliminated full-screen backdrops (`.vsa-dot-modal__backdrop`); set `#vsa-dot-analysis-modal-root` to `pointer-events: none` and modal card to `pointer-events: auto`, ensuring the underlying chart canvas remains 100% interactive (panning, wheel zooming, and crosshairs) while inspecting signals.
  - Implemented interactive window dragging on `.vsa-dot-modal__header` using pointer capture (`setPointerCapture`) and viewport coordinate clamping, preserving user-selected window screen positions across subsequent dot clicks.
  - Integrated a dedicated vertical scrollbar (`overflow-y: scroll`) inside `.vsa-dot-modal__body` with custom WebKit scrollbar styling to display complete institutional analysis without layout truncation.

- **Floating Drawing Toolbar Suppression (`src/chart/ChartManager.ts`, `src/overlays/volumeSpreadAnalysis.ts`, `src/ui/FloatingDrawingToolbar.ts`, `src/ui/VSADotAnalysisModal.ts`)**:
  - Filtered `DRAWING_SYNC_EXCLUDED_OVERLAYS` (including `volumeSpreadAnalysis`) across `ChartManager.ts` event hooks (`handleDrawEnd`, `onSelected`, and `onDoubleClick`) to prevent the drawing tool floating toolbar from appearing when clicking or selecting VSA overlays.
  - Dispatched `overlay:floating-toolbar:hide` across VSA dot click handlers in `ChartManager.ts`, `volumeSpreadAnalysis.ts`, and `VSADotAnalysisModal.ts` to immediately dismiss any open drawing toolbars when inspecting signal dots.

- **Complete VOFA Institutional Narrative & Checklists (`src/utils/volumeSpreadAnalysis.ts`)**:
  - Synchronized `pseudoUpThrust`, `shakeout`, `noSupply`, `noDemand`, and `supplyTest` signal dots with full reverse-engineered NinjaTrader VOFA logic: 2-column key-value signal context (Pattern type, Volume, Status, Bias), multi-step 1–3 bar confirmation checklists, and explicit invalidation criteria.

### Volume Spread Analysis by YSTC (volumeSpreadAnalysis.ts, ChartManager.ts, modals)

- **Master VSA Mathematical Engine (`src/utils/volumeSpreadAnalysis.ts`)**:
  - Implemented IEEE 754 Banker's rounding (`roundHalfToEven`) to eliminate 1-tick price bucket drift across high-frequency tick aggregations.
  - Implemented `priorSMA(14/30)` lookback offset strictly evaluating bars $i=1..N$ excluding bar 0 to isolate prior baseline conditions from the current bar's volume spike.
  - Implemented 6-branch EVR (Effort vs. Result) divergence logic:
    - Normal Expansion (`Spread >= AvgSpread` & `Vol >= AvgVol`)
    - Absorption Divergence (`Spread < AvgSpread` & `Vol >= 1.5 * AvgVol`)
    - Weakness Divergence (`Spread < AvgSpread` & `Vol >= AvgVol`)
    - Exhaustion Divergence (`Spread >= 1.5 * AvgSpread` & `Vol < AvgVol`)
    - Low-Volume Drift (`Spread >= AvgSpread` & `Vol < AvgVol`)
    - Normal Contraction (`Spread < AvgSpread` & `Vol < AvgVol`)
  - Integrated 6-tier candle color classification: Blue (High Volume Bullish), Purple (High Volume Bearish), Cyan (Ultra-High Volume / Climax), Yellow (Low Volume / No Demand / No Supply), EVR / Pink (Effort vs Result Divergence), and Gray (Standard baseline).
  - Integrated 9 signal dot rules with full NinjaTrader diagnostic metadata: Stopping Volume, Selling Climax, Buying Climax, UpThrust, Pseudo UpThrust, Shakeout, No Supply, No Demand, and Supply Test.
  - Implemented FSYBHL horizontal ray projection tracking 30-day structural highs/lows with active session break suppression, and uniform session Bulge Zone profiles with volume-at-price accumulation.

- **VSA Canvas Overlay Rendering (`src/overlays/volumeSpreadAnalysis.ts`)**:
  - Authored `volumeSpreadAnalysisOverlay` template generating high-performance KlineCharts figures.
  - Renders custom candle bodies (`rect`) and wicks (`line`) directly replacing standard candle colors without sub-pane layout dependencies.
  - Projects translucent Bulge Zones (`rect`) and FSYBHL yellow rays horizontally past the last bar into the right canvas edge (`bounding.width`).
  - Draws signal dots (`circle`) above or below candle wicks and registers screen coordinates into `activeVisibleDotsByChartId` for viewport hit-testing.

- **Floating Diagnostic Modal (`src/ui/VSADotAnalysisModal.ts`)**:
  - Built floating 440px diagnostic card dialog matching the NinjaTrader VOFA layout.
  - Features dynamic directional header banner (`#1D9E75` Bullish / `#C0392B` Bearish), timestamp, symbol, and timeframe metadata.
  - Renders "WHAT THIS BAR MEANS" narrative, a 2x2 "SIGNAL CONTEXT" grid (Background Trend, Close Position, Volume Ratio, EVR State), and a "WHAT TO WATCH FOR" callout box with confirmation checklist and invalidation criteria.

- **VSA Settings Modal (`src/ui/VolumeSpreadAnalysisModal.ts`, `src/overlays/volumeSpreadAnalysisSettings.ts`)**:
  - Built 4-tab configuration modal (`Inputs`, `Visual Styles`, `Levels & Zones`, `Trade Setups`) with full `localStorage` persistence (`ystc_vsa_settings`).
  - Supports toggling Bar Coloring Mode, VSA Only Mode, Signal Dots, FSYBHL Yellow Rays, Shaded Bulge Zones, Cyan VA Levels, Gap Lines, and zone transparency.

- **Settings UI & Diagnostic Modal Interaction Fixes (`VolumeSpreadAnalysisModal.ts`, `VSADotAnalysisModal.ts`, `style.css`, `volumeSpreadAnalysis.ts`, `ChartManager.ts`)**:
  - Restructured `VolumeSpreadAnalysisModal` to mount inside standard `.vp-settings-modal` chrome with dimming `.vp-settings-modal__backdrop`, centered 500px `.vp-settings-modal__panel`, `.tpo-settings-tabs`, and native `.vp-settings-field` / `.vp-settings-toggle` design tokens.
  - Resolved immediate auto-close defect on `VSADotAnalysisModal`: added click timestamp thresholding and a fixed modal backdrop to prevent the triggering click from instantly dismissing the newly rendered card.
  - Enabled native figure click routing on `volumeSpreadAnalysisOverlay`: attached `_vsaDot` to circle figures, expanded click radius to 5px, and added `onClick` handler emitting `vsa:dot:click`.
  - Upgraded `ChartManager.ts` fallback hit-testing to measure coordinates directly from `#chart-container` canvas bounds with a 22px tolerance.

### Drawing Tools / Toolbar (ToolBar.ts, icons.svg)

- **Volume Spread Analysis by YSTC Toolbar Action (`src/ui/ToolBar.ts`, `public/icons.svg`)**:
  - Registered `<symbol id="volume-spread-analysis" viewBox="0 0 28 28">` in `public/icons.svg`.
  - Positioned the "Volume Spread Analysis by YSTC" tool directly above "Volume Cluster" in the left drawing toolbar with active selection state binding.

### Upgraded Dependencies (package.json)

- **Monaco Editor Engine Upgrade (`package.json`)**: Upgraded `monaco-editor` from `0.56.0` to `0.57.0`. Integrates upstream security, dependency maintenance, and build tooling updates while maintaining full compatibility with the project's selective Hybrid Chunking strategy (`monaco-core`, `monaco-typescript`) and custom TypeScript worker architecture (`editor.worker.ts`, `ts.worker.ts`).
- **KlineCharts Engine Upgrade (`package.json`)**: Upgraded `klinecharts` from `10.0.3` to `10.0.4`. Incorporates upstream engine optimizations and fixes:
  - Coalesces indicator recalculations triggered across consecutive data updates in the same event loop, eliminating duplicate computation overhead during high-frequency realtime batch updates.
  - Fixes inaccurate indicator update detection caused by comparing figures only by reference.
  - Fixes external reference sharing for `calcParams` and figures on indicator overrides, preventing unintentional mutation of options.
  - Rounds pane heights after dragging separators to prevent subpixel dimensions from causing continuous full repaints.
  - Automatically cleans up data loader subscriptions when a chart instance is destroyed.
  - Resolves canvas y-axis width jitter on dynamic realtime labels and fixes edge values in `binarySearchNearest`.

## 2026-09-28

### Fix: Prevent Search Input Squeezing in Symbol & Indicator Modals (style.css)

- **Search Bar Flex Geometry Protection (`src/style.css`)**:
  - Added `flex-shrink: 0` and explicit `min-height: 38px` to `.symbol-search-modal__search` and `.indicator-modal__search`.
  - Added `flex-shrink: 0` to `.symbol-search-modal__header`, `.symbol-search-modal__filters`, and `.symbol-search-modal__import-status`.
  - Prevents flexbox compression from squishing the search input field flat when search results expand to fill the modal panel.

### Fix: Multi-Chart Layout Dropdown Alignment, Inner Padding, and Preset Grid (TopBar.ts, style.css)

- **Dropdown Viewport & Anchor Positioning (`src/ui/TopBar.ts`)**:
  - Enhanced `resolveMenuPosition` to accept an `align: 'left' | 'right'` parameter, aligning right-side utility menus (`align: 'right'`) flush with the trigger button's right edge (`rect.right - menuWidth`) rather than forcing left-side coordinates.
  - Corrected layout menu target width from `432px` to `316px`, aligning coordinate calculation with the actual CSS card width.
- **Edge Padding & Spacing Containment (`src/style.css`)**:
  - Added `padding: 12px 14px` on `.layout-menu` (replacing `padding: 6px 0`), preventing preset tiles and sync sliders from colliding with or bleeding against the outer card borders.
  - Added subtle modern box shadow `0 4px 16px rgba(0, 0, 0, 0.12)` with `border-radius: var(--menu-radius, 6px)`.
- **Layout Preset Tile Grid Modernization (`src/ui/TopBar.ts`, `src/style.css`)**:
  - Eliminated numeric row labels (`1, 2, 3...`) and redundant horizontal dividing lines between every row.
  - Converted `.layout-menu__row` to flex layout with `gap: 6px` and interactive `30px × 26px` preset cards with smooth hover states and active accent borders (`var(--accent-blue)`).
  - Added `.layout-menu__divider` separating the preset grid from the synchronization settings.
- **Sync in Layout Controls (`src/ui/TopBar.ts`, `src/style.css`)**:
  - Replaced separate `?` text spans with clean native `title` tooltip attributes on each sync item row.
  - Restyled sync items with comfortable row padding (`padding: 4px 6px`), hover highlights, and smooth TradingView blue toggle sliders (`var(--accent-blue)`) with 14px circular knobs.

### Fix: Order Ticket LTP Display, Duplicate Depth Rows, and DOM Price Synchronization (OrderModal.ts, OrderPanel.ts, chartInit.ts, onlineLoader.ts)

- **Order Ticket LTP Display & Real-Time Sync (`src/ui/OrderModal.ts`)**:
  - Replaced incorrect `Number(tick.close ?? ...)` extraction with `Number(tick.ltp ?? tick.last_price ?? tick.price ?? 0)`, preventing broker live quote packets from stamping previous day close (`8847.00`) as the active trade price.
  - Subscribed to both `tick:ltp` and `chart:data` in `OrderModal.ts` to guarantee immediate initialization from active chart bar data upon modal open.
- **Resting Depth Price Aggregation (`src/ui/OrderModal.ts`, `src/ui/OrderPanel.ts`)**:
  - Implemented `aggregateDepth` bucket summing (aligned with `openalgo-charts-v2.5.7` `buildRows` pattern) to merge multiple resting orders at identical price levels into a single row.
  - Resolved duplicate row rendering (`9216.00` showing twice with quantities 6 and 9), combining them into a single price row with quantity 15 and correct order counts.
  - Fixed `OrderPanel.ts` DOM ladder to display aggregated resting liquidity rather than dropping subsequent order lots via `.find()`.
- **Chart Tick LTP Sanitization & Session Cache Cleansing (`src/chart/chartInit.ts`, `src/chart/onlineLoader.ts`)**:
  - Removed `payload.close` fallback in `chartInit.ts` `subscribeBar`, strictly requiring valid positive `payload.ltp` or `payload.last_price` to prevent previous day close prices from mutating live candle closes.
  - Added session bar sanitization in `getLiveSessionBars()` to automatically purge any stale off-tick fractional bars from `localStorage` on whole-point commodity contracts (such as MCX CRUDEOIL).

### Fix: DOM Depth of Market & Chart Price Synchronization (wsClient.ts, OrderPanel.ts, OrderModal.ts)

- **Eliminated Synthetic Midpoint LTP Fabrication (`src/openalgo/wsClient.ts`)**:
  - Removed artificial `(bestBid + bestAsk) / 2` midpoint calculation previously triggered when Mode 3 (Depth) packets arrived without `ltp`.
  - Level 2 market depth updates now emit strictly to `tick:depth`; `tick:ltp` and `tick:update` are only emitted when an authentic executed trade price (`data.ltp` or `data.last_price`) is present.
  - Prevents non-traded decimal prices (e.g. `719.48` on a 0.05 NSE tick schedule) from contaminating chart candle close values and desynchronizing the chart price line from the DOM price ladder.
- **Wire Subscription Compatibility (`src/openalgo/wsClient.ts`)**:
  - Configured `executeSubscribe` for Mode 3 to send both `depth` and `depth_level` keys in the subscription payload, matching `openalgo-charts-v2.5.7` protocol standards across all proxy versions.
- **Defensive Market Depth Schema Normalization (`src/openalgo/wsClient.ts`, `src/ui/OrderPanel.ts`, `src/ui/OrderModal.ts`)**:
  - Normalized depth structures to provide both `buy`/`sell` and `bids`/`asks` aliases with uniform `price`, `quantity` (supporting both `quantity` and `qty`), and `orders` fields.
  - Eliminated false triggers of mock depth fallbacks that occurred when upstream brokers or REST endpoints returned `bids`/`asks` arrays.
- **Initial Depth Seeding & Tick-Snapped Row Highlighting (`src/ui/OrderPanel.ts`)**:
  - Added REST `/api/v1/depth` query inside `fetchSymbolMetadata()` to immediately seed the DOM ladder with real broker book depth upon symbol switch or panel open without waiting for subsequent WebSocket packets.
  - Added `chart:data` event listener in `OrderPanel.ts` to immediately seed `this.ltp` from the active chart's last bar close if uninitialized.
  - Snapped `this.ltp` comparison against ladder row prices using `Math.round(this.ltp / tickSize) * tickSize` to prevent floating-point precision mismatch on LTP row highlights.
  - Preferred official `totalbuyqty` and `totalsellqty` fields from depth payloads in the DOM ladder totals bar.

### Fix: Y-Axis Last Value Mark Boundary Clamping (chartInit.ts)

- **Sub-Pane & Axis Boundary Badge Clamping (`src/chart/chartInit.ts`)**:
  - Implemented `patchYAxisNicePixel(chart)` overriding `YAxisImp.prototype.convertToNicePixel` with a fixed safe badge margin (`badgeMargin = 10px`).
  - Replaced KlineCharts' default percentage-based clamping (`height * 0.98`), which only provided $2\text{px}$–$2.6\text{px}$ clearance in sub-panes and caused centered $17\text{px}$ tall badges to overflow $\sim 6.5\text{px}$ below the pane divider into the time axis.
  - Near-zero volume labels (such as `4.31K`) and low-scale indicator badges now sit cleanly bounded inside the pane with their bottom edge $1.5\text{px}$ above the divider line, eliminating bleed across pane borders.
  - Automatically protects all present and future panes and indicator last value badges.

### Fix: Eliminated Sub-Pane Bottom Dead Space for Volume Histogram Indicators (ChartManager.ts)

- **Sub-Pane Y-Axis Gap Optimization (`src/chart/ChartManager.ts`)**:
  - Implemented `configureSubPaneYAxes()` automatically configuring sub-pane Y-axes based on active indicator types.
  - Detected volume histogram indicators (`series === 'volume'`, `minValue === 0`, `VolumeYSTC`, `VOL`, and bar figures with `baseValue === 0`).
  - Overrode sub-pane Y-axis gap with `gap: { top: 0.15, bottom: 0 }`, eliminating KlineCharts default `0.1` (10%) bottom padding that previously extended non-negative volume scales into artificial negative values.
  - Volume histogram bars now sit 100% flush against the bottom divider line/time axis without empty dead space, matching 1:1 TradingView behavior while preserving 15% top headroom for indicator legends and titles.
  - Wired `configureSubPaneYAxes()` across `applyCurrentChartSettings()`, `indicator:add`, and custom indicator registration events.

### Feature: 2px Panel Grid Gutter & Rounded Card Layout (1:1 TradingView System)

- **Layout Grid & 2px Gutter Architecture (`src/style.css`)**:
  - Introduced `--panel-gutter: 2px`, `--panel-gutter-bg: #ebebeb`, and `--panel-card-radius: 4px` CSS design tokens in `:root`.
  - Configured `.app-container` and `.workspace` with `background: var(--panel-gutter-bg, #ebebeb)` to create crisp neutral channel separation between panels.
  - Added 2px gutter margins and gap layouts across `.top-bar`, `.workspace`, `.center-column`, and `.right-column`.
  - Preserved 100% flush outer screen perimeter (`padding: 0` on `.workspace`), maximizing chart viewable area while keeping gutters strictly internal.
- **Card-Enclosure Borders (`src/style.css`, `src/main.ts`)**:
  - Implemented `.chart-card` container enclosing `.main-area`, `#replay-modal-root`, and `#chart-footer` with continuous `1px solid var(--border-color)` and `border-radius: var(--panel-card-radius, 4px)`.
  - Upgraded `#tool-bar`, `#account-manager`, `.right-rail`, and `.right-panel` to perimeter-flush card containers with 4px border-radius and 1px border framing facing inward toward internal gutters.
- **UI Component Skill Synchronization (`.agents/skills/ui-component/SKILL.md`)**:
  - Documented layout tokens `--panel-gutter`, `--panel-gutter-bg`, and `--panel-card-radius`.
  - Added Section 6 "Panel Grid Gutter & Rounded Card Layout (1:1 TradingView System)" specifying flush perimeter boundaries, card enclosure standards, and DOM hierarchy.

### Feature: Standardized 3-Column Modal Form Controls, Circle Modal, and Floating Drawing Toolbar

- **Standardized Modal Form Controls (`src/ui/formControls.ts`)**:
  - Implemented TradingView-standard 3-column form grid system (`.modal-form-row`: label left, control center, aux/inputs right).
  - Built custom color swatch button (`createColorSwatch`) with 24x24px rounded frame, subtle checkerboard backdrop, focus ring, and popover palette picker with opacity slider.
  - Added reusable helper factories: `createFormRow`, `createColorPairRow`, `createLineStylePicker`, `createNumberStepper`, and `createSelect`.
  - Added dedicated styling tokens in `src/style.css` (`.modal-form-row`, `.modal-form-swatch`, `.modal-color-popover`, `.modal-form-input`, `.modal-form-select`).
- **Indicator Settings Modal Form Modernization (`src/ui/IndicatorSettingsModal.ts`)**:
  - Upgraded `buildField`, `buildStyleToggleRow`, and `buildColorControl` to use pure DOM `formControls.ts`.
  - Unifies 100% of platform indicators (RSI, MACD, Bollinger Bands, Stochastics, Moving Averages, etc.) with custom color swatches, opacity popovers, number steppers, and styled selects.
- **Anchored VWAP Modal Modernization (`src/ui/AnchoredVwapModal.ts`)**:
  - Refactored from raw template strings and browser-native `<input type="color">` to clean, typed DOM controls.
- **Circle Drawing Tool & Dedicated Settings Modal**:
  - Added dynamic configuration and persistence in [`src/overlays/circleSettings.ts`](src/overlays/circleSettings.ts).
  - Upgraded [`src/overlays/circle.ts`](src/overlays/circle.ts) to dynamically render border color, border thickness, line style, and background fill with opacity from `extendData`.
  - Created [`src/ui/CircleModal.ts`](src/ui/CircleModal.ts) providing dedicated styling controls for circle drawings.
  - Wired into `ChartManager.ts`, `main.ts`, and context menu / ToolBar settings triggers.
- **In-Canvas Floating Drawing Toolbar (`src/ui/FloatingDrawingToolbar.ts`)**:
  - Built interactive floating toolbar mounted directly above selected drawing overlays.
  - Controls: drag handle (`⋮⋮`), line/border color swatch with opacity, fill color swatch (shapes), line width dropdown (`1px`–`4px`), line style dropdown (`Solid`, `Dashed`), lock/unlock toggle (`🔒`/`🔓`), quick settings gear modal trigger (`⚙`), and delete button (`🗑`).
  - Auto-calculates overlay bounding box via KlineCharts coordinate projection (`convertToPixel`) and positions itself centered above drawings within chart viewport bounds.
  - Fully wired into `ChartManager` overlay lifecycle (`onSelected`, `onDoubleClick`, `onDeselected`, `handleDrawEnd`, `overlay:clear`, and context-menu deletion).
  - Emits `overlay:drawing:modified` to automatically trigger history recording and localStorage persistence.
- **UI Component Skill Documentation (`.agents/skills/ui-component/SKILL.md`)**:
  - Updated design guidelines with the 3-column form layout specification, swatch guidelines, and floating toolbar integration rules.

## 2026-09-27

### Feature: Standardized Modal Chrome for Indicator and Drawing Tool Settings Modals

- **Context & Design Unification**:
  - Aligned all 10 drawing tool modals and indicator settings modals to a unified TradingView design language.
  - Standardized modal dimensions: 400px fixed width (`min(400px, calc(100vw - 32px))`).
  - Standardized header chrome: 14px semibold title with inline edit/rename pencil icon for drawing tools and close (`✕`) button.
  - Standardized tab underline: clean near-black indicator (`var(--text-primary)`) replacing legacy accent blue.
  - Standardized footer chrome: `Template ▾` dropdown popover (`Set as default`, `Apply defaults`, `Reset` for drawing tools; `Apply defaults`, `Save as template` for indicators; plus custom preset actions for Fib retracement), secondary `Cancel` button, and prominent near-black `Ok` primary action button (`var(--overlay-strong)` / `#111111`).
- **Shared Chrome Utility**:
  - Created [`src/ui/modalChrome.ts`](src/ui/modalChrome.ts) exporting `buildModalHeader()` and `buildModalFooter()` to eliminate duplicate DOM boilerplate across modals.
  - Supported optional `showPencil` (omitted for indicators) and optional `customTemplateItems` (preserving custom preset management in `FibonacciModal`).
- **Modals Migrated**:
  - [`RectangleModal.ts`](src/ui/RectangleModal.ts)
  - [`TextModal.ts`](src/ui/TextModal.ts)
  - [`HorizontalRayModal.ts`](src/ui/HorizontalRayModal.ts)
  - [`FibonacciModal.ts`](src/ui/FibonacciModal.ts)
  - [`BrushModal.ts`](src/ui/BrushModal.ts)
  - [`AnchoredVwapModal.ts`](src/ui/AnchoredVwapModal.ts)
  - [`FixedRangeVolumeProfileModal.ts`](src/ui/FixedRangeVolumeProfileModal.ts)
  - [`SessionVolumeProfileModal.ts`](src/ui/SessionVolumeProfileModal.ts)
  - [`TpoProfileModal.ts`](src/ui/TpoProfileModal.ts)
  - [`VolumeClusterModal.ts`](src/ui/VolumeClusterModal.ts)
  - [`IndicatorSettingsModal.ts`](src/ui/IndicatorSettingsModal.ts)
- **CSS System & Layout**:
  - Updated [style.css](src/style.css) with shared `vp-settings-modal__*` classes (`__title-edit`, `__btn--template`, `__template-popover`, `__template-option`, `48px` footer height, `32px` button height).

### Fix: Sub-Pane Indicator Legend Position Displacement on Dock Toggle

- **Bug**: Opening or closing the Script Editor / Account Manager bottom dock caused the indicator status bar (legend row) for sub-pane indicators — Volume, MACD, RSI — to render at the wrong vertical position. Main candle-pane indicators were unaffected because their `top` offset is near zero.
- **Root Cause**: `AccountManager` fired `window.dispatchEvent(new Event('resize'))` immediately after triggering a DOM layout change. `ChartManager` received this via `window.addEventListener('resize', ...)` and called `scheduleChartResize()`, which enqueued `flushIndicatorLegendLayouts()` in a `requestAnimationFrame`. At that point the dock was still mid-transition, so `paneDom.getBoundingClientRect()` returned incorrect (partially-animated) `top` values for sub-panes. The legend `section.style.top` was then set to a stale value with no subsequent correction.
- **Fix**:
  - [`ChartManager.ts`](src/chart/ChartManager.ts): Replaced `window.addEventListener('resize', handleViewportResize)` with a `ResizeObserver` on `chartStageEl`. `ResizeObserver` only fires after the browser has finished laying out the observed element, guaranteeing that `getBoundingClientRect()` returns correct values. Mobile orientation / visual-viewport listeners retained on `window`.
  - [`AccountManager.ts`](src/ui/AccountManager.ts): Removed all 7 `window.dispatchEvent(new Event('resize'))` calls from tab-click, close-button, and drag-resize handlers — now redundant since the `ResizeObserver` triggers automatically and correctly.

## 2026-09-26

### Fix: Chart Visual State Persistence, Cancel Revert, and Template Management
- **Chart Visual Settings Persistence**:
  - Implemented `normalizeChartSettings()`, `loadChartSettings()`, and `saveChartSettings()` in [chartSettings.ts](src/chart/chartSettings.ts) using `localStorage` key `'ystc_chart_settings'`.
  - Safely normalizes nested objects (`symbol`, `scales`, `canvas`, `statusLine`, `events`, `trading`) with defaults fallback.
  - Wired [ChartManager.ts](src/chart/ChartManager.ts), [SettingsModal.ts](src/ui/SettingsModal.ts), [SeriesLegend.ts](src/ui/SeriesLegend.ts), and [MultiChartWorkspace.ts](src/chart/MultiChartWorkspace.ts) to initialize from and persist to `localStorage`. Candle styles, colors, wicks, borders, timezone, and session breaks now persist across page reloads.
- **Modal "Cancel" Button Revert**:
  - Implemented initial state snapshotting (`beforeOpenSettings` and `beforeOpenStorage`) in [SettingsModal.ts](src/ui/SettingsModal.ts) when opening the modal.
  - Clicking **Cancel**, the close button (`×`), or the backdrop now restores the original visual settings and re-emits `settings:apply` to immediately revert the chart canvas, preventing unconfirmed preview changes from sticking.
  - Clicking **Ok** commits the settings and writes them to `localStorage`.
- **Footer Template Dropdown & Preset Management**:
  - Replaced the static, dummy `<select>` template element with an interactive TradingView-style Template dropdown popover in [SettingsModal.ts](src/ui/SettingsModal.ts).
  - Added **"Save as..."** to prompt for a template name and save custom presets to `localStorage` (`'ystc_chart_settings_templates'`).
  - Added **"Apply defaults"** to quickly restore standard chart defaults.
  - Added saved templates list with single-click preset application and individual preset deletion with a trash button.

## 2026-09-23

### Optimization: Monaco Hybrid Chunking Strategy & Unused Worker Pruning
- **Optimization**:
  - Configured `manualChunks` in [vite.config.mjs](vite.config.mjs) to consolidate Monaco Editor's fragmented UI widgets and language contributions into logical domain chunks (`monaco-core`, `monaco-typescript`).
  - Pruned unused background workers (`json.worker`, `css.worker`, `html.worker`) from [monacoManager.ts](src/scripting/monacoManager.ts) since YSTC user scripts exclusively evaluate TypeScript/JavaScript.
- **Results**:
  - Total files in `dist/assets/` reduced from **92 files down to 12 clean files** (an **87% reduction** in file count).
  - Saved **~2.2 MB** in production bundle weight by eliminating unused language workers.
  - Eliminated the 60+ parallel HTTP micro-requests when opening Script Editor on local/gh-pages servers while maintaining 100% feature parity with dev (IntelliSense, hover tooltips, parameter hints, minimap, syntax highlighting, and chart rendering).

### Fix: Monaco Script Editor Minimap Default & Settings Persistence
- **Root cause**: `monacoManager.ts` defaulted `options.minimap ?? false` on editor initialization, causing the minimap to start hidden. Meanwhile, `ScriptEditorPanel.ts` passed empty `{}` on editor creation and when opening the Settings modal. Because `ScriptEditorModals.ts` checked `currentOptions.minimap !== false`, the checkbox appeared checked (ON) even though the editor had it disabled (OFF). Furthermore, editor options were not persisted to `localStorage`.
- **Fix**:
  - Updated `monacoManager.ts` to default `minimap: { enabled: options.minimap ?? true }` in both `createEditor` and `updateOptions`.
  - Added `getEditorOptions()` and `saveEditorOptions()` in `ScriptEditorPanel.ts` reading from and saving to `localStorage` key `'ystc_editor_options'`.
  - Passed persisted options to `createEditor` on load and to `ScriptEditorModals.showSettingsModal`, saving changes whenever the user modifies editor settings.

### Fix: Monaco Script Editor IntelliSense Suggest Dropdown & UI Controller Contributions
- **Root cause**: When disabling the 70+ unnecessary programming languages to reduce bundle size, the project imported `monaco-editor/editor/editor.api.js` directly. In Monaco's architecture, `editor.api.js` provides only the bare headless text rendering engine and excludes all UI controllers and popup widgets. Specifically, `suggestController.js` (which manages the autocomplete/suggest dropdown menu), `hoverContribution.js`, `parameterHints.js`, and `snippetController2.js` were never imported. As a result, even though the background TypeScript worker generated autocompletions, no visual suggest dropdown was registered to render in the DOM.
- **Fix**:
  - Selectively imported the essential editor UI controller contributions (`suggestController.js`, `suggestInlineCompletions.js`, `hoverContribution.js`, `parameterHints.js`, `snippetController2.js`, `contextmenu.js`, `findController.js`, `folding.js`, `formatActions.js`, `goToCommands.js`) into `loadMonaco()` in [monacoManager.ts](src/scripting/monacoManager.ts).
  - Maintained complete exclusion of all 70+ non-essential programming languages (Python, Java, Rust, C#, etc.), keeping bundle size minimal while restoring full editor interactivity.

## 2026-09-22

### Fix: Monaco Script Editor TypeScript IntelliSense & SDK Type Resolution
- **Root cause 1 (Language Contribution Disconnect)**: When loading the slim custom Monaco bundle (`monaco-editor/editor/editor.api.js`) to exclude 70+ unnecessary languages, `monaco.contribution.js` was imported dynamically but never assigned to `(loaded.languages as any).typescript`. As a result, `(this.monaco.languages as any).typescript` remained `undefined`, causing `configureTypeScriptCompiler()` to exit immediately without configuring compiler options or registering extraLibs.
- **Root cause 2 (Ambient Syntax Error TS1038)**: Inside `ystc-sdk-raw.ts`, function declarations inside `declare module "@ystc/sdk"` used `export declare function`, triggering TypeScript syntax error TS1038 (`A 'declare' modifier cannot be used in an already ambient context`) which silently invalidated the ambient declaration block.
- **Root cause 3 (Module Resolution & URI Scheme Mismatch)**: The script model was parsed under `file:///script.ts`, whereas typings were registered under `'ts:filename/ystc-sdk.d.ts'`. Under TypeScript's `NodeJs` module resolution, non-relative package imports (`import ... from "@ystc/sdk"`) only look inside `node_modules` under matching URI schemes.
- **Fix**:
  - Attached `tsContribution` directly to `(loaded.languages as any).typescript` in `loadMonaco()`, restoring access to `typescriptDefaults`.
  - Removed illegal `declare` modifiers from function declarations inside `SDK_DTS_CONTENT` in `ystc-sdk-raw.ts`.
  - Registered canonical Node module declarations (`package.json`, direct `index.d.ts`, ambient `ystc-sdk.d.ts`) with `typeRoots: ['node_modules/@types']` and explicit compiler `paths` mapping.
  - Added full JSDoc hover documentation and parameter hints across all math utilities and SDK interfaces.

### Fix: Top Bar Font Size Too Large
- **Root cause**: `--chrome-top-font` was set to `14px` in `:root` (line 11 of `style.css`), making all TopBar elements (symbol chip, timeframe buttons, action labels) render 2px larger than the `body` base font (`12px`), causing the top bar to appear visually heavier than the rest of the UI.
- **Fix**: Changed `--chrome-top-font: 14px` → `--chrome-top-font: 12px` to align with TradingView's top bar standard and the app's base font size.
- **Skill gap closed**: `--chrome-top-font` and the other `--chrome-*` tokens (`--chrome-footer-font`, `--chrome-meta-font`, `--chrome-top-hit`, `--chrome-top-icon-hit`, `--chrome-side-hit`, `--chrome-icon`, `--chrome-icon-strong`, `--chrome-hover-bg`, `--chrome-soft-line`) were missing from the `ui-component` skill's documented token table. Added all with descriptions to prevent accidental wrong values in future.

## 2026-09-21

### Drawing Tool & Indicator Settings Modal UI: 1:1 TradingView Standardization
- **Header & Title Hierarchy**: Replaced makeshift inline edit pencil buttons with clean TradingView bold 16px title headers across all drawing dialogs (`RectangleModal`, `HorizontalRayModal`, `FibonacciModal`, `BrushModal`, `TextModal`). In `IndicatorSettingsModal`, separated title row (`48px` height) from tab bar for clear hierarchical distinction.
- **TradingView 28px SVG Close Buttons**: Replaced crude raw text `&times;` and oversize 32px close buttons with standard `28px x 28px` rounded buttons with crisp 14px SVG cross icons (`iconEl('close', 14)`), subtle hover background, and proper aria accessibility across all modal headers (`IndicatorModal`, `IndicatorSettingsModal`, `RectangleModal`, `HorizontalRayModal`, `FibonacciModal`, `BrushModal`, `TextModal`).
- **Flush Tab Bar Alignment**: Standardized modal tab headers to `38px` height with `14px` font (`500` weight, `600` active) and flush `2px` TV Blue (`#2962ff`) bottom underlines sitting directly on the `1px` border line (`bottom: -1px`), eliminating disconnected floating underlines.
- **18px x 18px TV Blue Checkboxes**: Replaced oversized 28px black checkboxes with standard TradingView `18px x 18px` boxes (`border-radius: 3px`, subtle gray border). When checked, checkboxes transition to solid TV Blue (`#2962ff`) with a crisp centered white checkmark across all drawing tool toggles and extend boxes.
- **28px Framed Color Swatches & Property Controls**: Standardized color swatches and line property controls (`.settings-swatch`, `.settings-swatch__button`, `.rectangle-settings-modal__property-btn`) to `28px` height with 1px border framing and 4px radius, replacing oversized and unframed buttons.
- **TradingView Standard Modal Footers**: Replaced solitary black "Done" buttons across all drawing dialogs with standard TradingView footers: `Reset` / `Template` on the left, and paired `Cancel` (ghost/outline) + `Ok` (solid TV Blue `#2962ff`, `34px` height, `6px` radius) on the right.

### UI Design Language Standardization: 1:1 TradingView Alignment (Phase 1)
- **Dimensional & Metric Standards**: Aligned layout variables with TradingView reference standards (`--topbar-h: 38px`, `--toolbar-w: 52px`, `--side-rail-w: 52px`, `--footer-h: 32px`, `--accountmgr-h: 316px`). Standardized chrome hit targets (`--chrome-top-hit: 28px`, `--chrome-side-hit: 34px`) and dividers (`22px x 1px` with `margin: auto 4px`).
- **Unified 2-Column Settings Dialogs**: Standardized modal panels (`.indicator-settings-modal__panel`, `.vp-settings-modal__panel`, `.rectangle-settings-modal__panel`, `.fib-settings-modal__panel`) to `max-width: 550px`, `10px` border-radius, strict `auto 1fr` 2-column grid layout with capitalized labels, full-bleed dividers (`margin: 8px -20px`), and `44px` tabs with 2px solid TV Blue (`#2962ff`) active underlines.
- **Dropdowns & Context Menu System**: Aligned dropdown containers (`.timeframe-menu`, `.chart-type-menu`, `.layout-menu`, `.chart-context-menu__panel`) to `border-radius: 6px`, `box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15)`, and `padding: 6px 0`. Standardized desktop menu items to `32px` height, `14px` font, and `28px x 28px` icon slots with TV Blue active states.
- **Color Swatches & Palette Popover**: Standardized swatch buttons to `15px x 15px` with `:after` focus/hover rings highlighting in blue, hosted inside a compact `224px` popover box.
- **Mobile View & Responsive Breakpoints**: Implemented formal breakpoint system (`TabletSmall: 440px`, `TabletNormal: 768px`). At `(max-width: 440px)`, dialogs switch to full-screen mode, popups/menus convert into bottom slide-up sheets (`border-radius: 16px 16px 0 0`), touch targets scale to `44px` (`16px` font), and the TopBar supports smooth horizontal scrolling with gradient edge masks.
- **Architecture & Skill Synchronization**: Updated [`AGENTS.md`](AGENTS.md) layout specifications and enshrined the complete 1:1 design rules into [`.agents/skills/ui-component/SKILL.md`](.agents/skills/ui-component/SKILL.md).

### Documentation Modernization: SETUP.md Alignment with Workspace & Active Skills
- **Workspace & Folder Modernization (`SETUP.md`)**: Replaced outdated directory references (`klinecharts-v10.0.0/`) with the official project root `ystc-charts/`.
- **7 Active Agent Skills Synchronization**: Updated the configuration file tree and quick reference table to reflect the 7 active skills, removing references to retired skills (`swing-highlow`, `volume-profile`, `tpo-indicator`).
- **Milestone & Prompt Alignment**: Updated Task 5 prompt prefix to `$custom-indicator $custom-overlay` and documented Task 8 (YSTC Script Editor & Developer SDK) milestone.

### Documentation Modernization: AGENTS.md Alignment with Skills & Architecture
- **Active Skills Catalog Integration (`AGENTS.md`)**: Documented the 7 active agent skills (`csv-loader`, `custom-indicator`, `custom-overlay`, `paper-trading`, `openalgo-rest`, `openalgo-websocket`, `ui-component`) with their primary architectural domains and contracts.
- **Build Order Cleanup**: Replaced obsolete references to deleted skills (`$volume-profile`, `$tpo-indicator`, `$swing-highlow`) in the Build Order section with `$custom-overlay`.
- **Expanded EventBus Signatures**: Documented all cross-component event signatures including paper trading namespaced events (`paper-order:submit`, `paper-order:cancel`, `paper-position:close`), overlay actions, and navigation events.
- **Production CSS Variables & Layout Metrics**: Synchronized `--topbar-h: 37px`, `--toolbar-w: 53px`, `--side-rail-w: 53px`, `--rightpanel-w: 320px`, `--accountmgr-h: 316px`, and `--font-ui`.
- **Project Root Correction**: Updated root identifier to workspace root `ystc-charts/`.

### Skill Modernization: UI Component Alignment with DOM Hierarchy & Production Architecture
- **UI Component Skill Modernization (`.agents/skills/ui-component/SKILL.md`)**: Updated the skill documentation to reflect the production DOM shell architecture created dynamically in `src/main.ts` inside `<div id="app">` (including `#offline-bar`, 16 dedicated modal portal roots, `.workspace`, `#tool-bar`, `.center-column` multi-chart layout, `#chart-footer`, `#account-manager`, `#right-dock`, and `#right-panel`).
- **Production CSS Design Tokens & Metrics**: Aligned layout dimension variables with `src/style.css` (`--topbar-h: 37px`, `--toolbar-w: 53px`, `--side-rail-w: 53px`, `--rightpanel-w: 320px`, `--accountmgr-h: 316px`, `--font-ui: 'Trebuchet MS', ...`), documenting panels, controls, and surface tokens.
- **BaseComponent Lifecycle & Input Focus Retention**: Documented `BaseComponent.ts` features: caret selection preservation across DOM re-renders without jumping or flickering, `afterRender()` teardown cleanup hooks, `bindScrollAffordance()` scroll shadows, and typed `btn()` helpers.
- **Accurate ToolBar & Overlay Identifiers**: Replaced outdated drawing tool names with real KlineCharts overlay templates (`segment`, `horizontalStraightLine`, `horizontalRightRay`, `verticalStraightLine`, `fibonacciLine`, `rect`, `arrow`, `text`, `brush`, `circle`, `fixedRangeVolumeProfile`, `sessionVolumeProfile`, `fixedRangeTpoProfile`, `tpoProfile`, `volumeCluster`, `anchoredVwap`, `datePriceRange`, `gannBox`, `weak-magnet`, `strong-magnet`).
- **Complete TopBar, Docks & Footer Coverage**: Documented multi-chart layout presets, responsive timeframe favorites, Right Dock & Right Panel (`watchlist`, `alerts`, `trade` DOM/Order forms with margin calculation), bottom dock navigation rules (`[ Paper / Live ]`, `[ DOM ]`, `[ Script Editor ]`), and ChartFooter (time range buttons, live timezone clock, `RTH`/`ADJ` badges).

### Skill Modernization: OpenAlgo REST & WebSocket Alignment with Codebase & KlineCharts v10
- **OpenAlgo REST Skill Modernization (`.agents/skills/openalgo-rest/SKILL.md`)**: Documented production client features (`ngrok-skip-browser-warning` headers, HTTP 429 backoff), strict Marshmallow schema validation warnings, full 14-exchange constants (including `MCX_INDEX` and `CRYPTO`), and accurate endpoint signatures (`positionbook`, `funds`, `placeorder`, `telegram`, `whatsapp`).
- **OpenAlgo WebSocket Skill Modernization (`.agents/skills/openalgo-websocket/SKILL.md`)**: Replaced deprecated `chart.updateData()` calls with KlineCharts v10's canonical `DataLoader.subscribeBar` / `unsubscribeBar` contract. Documented enterprise `OpenAlgoWsClient` architecture (subscription reference counting, watchdog active-symbol protection, microtask batching, and `order_updates`).

### Skill Maintenance: Retired volume-profile and tpo-indicator Skills
- **Retired Specialized Skills (`.agents/skills/volume-profile/`, `.agents/skills/tpo-indicator/`)**: Removed obsolete starter skill folders. Overlay authoring and KlineCharts figure standards are comprehensively governed by [.agents/skills/custom-overlay/SKILL.md](.agents/skills/custom-overlay/SKILL.md), while the Volume Profile and TPO subsystems remain fully documented and maintained in [AGENTS.md](AGENTS.md) and production code (`src/overlays/`, `src/utils/`).

### Skill Maintenance: Retired Redundant swing-highlow Skill
- **Retired Redundant Skill (`.agents/skills/swing-highlow/`)**: Removed obsolete starter skill folder. Custom indicator authoring and architecture are now standardized under [.agents/skills/custom-indicator/SKILL.md](.agents/skills/custom-indicator/SKILL.md), while the production indicator remains active in `src/indicators/swingHighLow.ts`.

### Skill Modernization: Paper Trading Alignment with Engine Architecture & Chart Overlays
- **Paper Trading Skill Modernization (`.agents/skills/paper-trading/SKILL.md`)**: Replaced deprecated monolithic stubs with the decoupled event-driven architecture implemented in `src/paper/PaperBroker.ts`.
- **Namespaced EventBus Protocol**: Documented exact event contracts (`paper-order:submit`, `paper-order:cancel`, `paper-order:modify`, `paper-position:close`, `paper-brackets:submit`, and account lifecycle events).
- **Interactive KlineCharts Overlays**: Documented chart canvas integration for `activeOrder` and `activePosition` overlays, including on-chart drag-to-modify orders, live P&L pills, and bracket handles.
- **Multi-Symbol LTP & Margin Engine**: Documented multi-symbol price dispatching via `Map<string, number>()`, pre-trade margin checks, and realistic brokerage fee simulation across presets (`fyers`, `zerodha`, `flattrade`, etc.).

### Skill Modernization: Custom Overlay Alignment with KlineCharts v10 & Codebase
- **Custom Overlay Skill Modernization (`.agents/skills/custom-overlay/SKILL.md`)**: Updated the skill documentation to use `OverlayTemplate<E>` and `OverlayFigure` matching KlineCharts v10 specifications.
- **Native Magnet Snapping**: Replaced fabricated manual distance calculations with native KlineCharts magnet configurations (`mode: 'normal' | 'weak_magnet' | 'strong_magnet'`, `modeSensitivity`) and documented dynamic `Ctrl` key snapping.
- **CSS Design Tokens & Shared Helpers**: Replaced hardcoded hex colors with `cssVar()`, `colorWithAlpha()`, and shared figure generators from `src/overlays/shared.ts`.
- **Overlay Stacking & `fixedZLevel`**: Documented overlay stacking rules (`zLevel`, `fixedZLevel`) to guarantee interactive trading overlays remain accessible above background drawings.
- **Accurate Tool Registry & File Mapping**: Aligned all drawing tool names and file references with the real `src/overlays/` implementation (`rect.ts`, `fibonacciLine.ts`, `horizontalRayLine.ts`, etc.).

### Skill Modernization: Custom Indicator Alignment with KlineCharts v10 & Codebase
- **Custom Indicator Skill Modernization (`.agents/skills/custom-indicator/SKILL.md`)**: Replaced deprecated v9 patterns with the official KlineCharts v10 `IndicatorTemplate<D, C, E>` signature.
- **Design Tokens & Theme Consistency**: Documented dynamic styling via `cssVar('--token', fallback)` to eliminate hardcoded hex strings across indicator figures.
- **Interactive Tooltip Action Features**: Documented `createIndicatorTooltipFeatures()` from `catalog.ts` for TradingView-style pane buttons (visibility, settings gear, close).
- **Catalog & Parameter Drawer Wiring**: Documented registration in `INDICATOR_CATALOG` (`catalog.ts`) for seamless integration with the Indicators modal and parameter settings drawer.
- **Custom Figures & Accurate File Structure**: Documented custom canvas figures (`registerFigure`) and corrected directory references to match `src/indicators/`.

### Skill Modernization: CSV Loader Alignment with KlineCharts v10 & Codebase
- **CSV Loader Skill Modernization (`.agents/skills/csv-loader/SKILL.md`)**: Fully updated the skill documentation to eliminate references to deprecated KlineCharts v9 APIs (`applyNewData`, `updateData`).
- **KlineCharts v10 `DataLoader` Integration**: Documented the canonical `chart.setDataLoader({ getBars })` contract matching official v10 docs and project implementation in `src/chart/chartInit.ts`.
- **Sliding-Window Pagination & In-Memory Cache**: Documented the active caching mechanism (`cache`, `pendingLoads`) and sliding-window pagination (`getPagedBars`, `DataLoadMore`) implemented in `src/chart/csvLoader.ts`.
- **Reactive Symbol/Timeframe Switching**: Updated the recommended symbol and period switching patterns to use `chart.setSymbol(...)` and `chart.setPeriod(...)` via `eventBus.on('symbol:change')`.

## 2026-09-19

### Fix: Online Source Data Fetch Range for Fixed TF Calculation Methods
- **Chart-Range-Aware Source Fetching (`onlineLoader.ts`)**: Added optional `FetchDateRange` parameter to `fetchCachedBars()` and `getOnlineCachedBars()`. When provided, the OpenAlgo history API call uses the explicit start/end dates instead of the generic default duration (`getFetchDurationDays()`), ensuring the fetched data covers the chart's loaded date range.
- **Bidirectional Cache Coverage & Pending Duration (`onlineLoader.ts`)**: Enhanced cache validation to verify both start and end timestamps against the requested `dateRange` (preventing truncation at either boundary). Updated `onlinePendingDurationDays` registration and pending de-duplication to correctly compute effective duration from `dateRange`.
- **FRVP Source Resolution (`fixedRangeVolumeProfile.ts`)**: When the Calculation method is a fixed timeframe (`source_tf:X` — e.g. 1m, 5m, 15m) or a custom volume source symbol is selected, `requestResolvedSourceBars()` derives the chart's loaded data range from `chart.getDataList()` and passes it to the data fetcher. This ensures lower-TF and custom volume source bars cover the full chart range.
- **Session Volume Profile (`sessionVolumeProfile.ts`)**: In `requestResolvedSourceBars()`, `chartDateRange` is now derived from `chart.getDataList()` and supplied whenever a fixed timeframe method or custom volume source symbol is selected, aligning with FRVP.
- **Volume Cluster Historical Anchoring (`volumeCluster.ts`)**: Fixed an issue where 5S data requests in online mode anchored to `new Date()` (today). In `requestResolvedSourceBars()` and `requestResolvedVolumeSourceBars()`, `chartDateRange` is now anchored to the chart's loaded end timestamp (`allBars[allBars.length - 1].timestamp`) and bounded by `historyRange`, ensuring 5S cluster events accurately match historical candles when navigating back in time.
- **TPO Source Resolution (`tpoProfile.ts`)**: `requestResolvedTpoSourceBars()` passes the chart's loaded data range when fetching TPO letter source bars (resolved from block size). `requestResolvedTpoVolumeSourceBars()` passes the chart range when the volume Calculation method is a fixed timeframe or a custom volume source is selected.
- **Fixed Range TPO & Session TPO**: Both inherit the fix automatically via the shared TPO source resolution functions.
- **Scope**: Threshold-based methods (`tv_style`, `essential_10k`, `plus_20k`, `premium_40k`) remain threshold-driven. Fixed timeframe methods, Volume Cluster, and custom volume sources now reliably cover historical chart dates.

## 2026-09-10

### KlineCharts v10.0.3 Lifecycle Cleanup & fixedZLevel Alignment
- **Official Lifecycle Disposal (`ChartManager.ts`, `MultiChartWorkspace.ts`)**: Replaced non-existent `chart.destroy?.()` calls with KlineCharts' official `dispose(containerId)` unmount API. Container IDs are now systematically tracked and freed upon chart destruction, preventing canvas listener leaks and eliminating container identification collisions during multi-chart layout re-renders.
- **Overlay Stacking & `fixedZLevel` Priority (`activeOrder.ts`, `activePosition.ts`)**: Configured `zLevel: 100` and `fixedZLevel: true` on `activeOrder` and `activePosition` overlay templates. Order lines, drag handles, P&L pills, and close buttons now reliably remain above background drawings (such as rectangles and volume profiles) when hovered.
- **Multi-Chart Drawing Snapshot Synchronization (`ChartManager.ts`)**: Extended `OverlaySnapshot` and `snapshotOverlay()` to preserve `fixedZLevel` across multi-chart drawing synchronizations.
- **YSTC Developer SDK & Bridge Support (`ystc-sdk.d.ts`, `KlineChartsBridge.ts`, `SDKHelpModal.ts`)**: Exposed optional `zLevel?: number` and `fixedZLevel?: boolean` in `@ystc/sdk`'s `OverlayConfig` interface, forwarded them through `KlineChartsBridge.registerCustomOverlay()`, and documented usage in `SDKHelpModal.ts`.

### Legacy Documentation Retirement (`docs/broker` Cleanup)
- **Deleted `docs/broker/` and Retired `docs/` Root**: Removed obsolete `docs/broker/` directory tree, completing the project-wide consolidation of all frozen reference documentation into `doc/`.
- **Updated Key Paths Specification**: Updated project root key paths table in [AGENTS.md](AGENTS.md) to formally designate `doc/` as the single source of truth for reference docs.

### Frozen Documentation Architecture: Indicators & UI Migration
- **Relocated Indicators & UI Documentation to `doc/`**: Moved `docs/Indicators/` and `docs/UI/` to [doc/Indicators/](doc/Indicators/) and [doc/UI/](doc/UI/) as part of unifying all frozen documentation into the `doc/` repository.
- **Cross-Project References Updated**: Aligned all documentation links in [AGENTS.md](AGENTS.md), [SETUP.md](SETUP.md), and developer skills ([volume-profile](.agents/skills/volume-profile/SKILL.md), [swing-highlow](.agents/skills/swing-highlow/SKILL.md), [tpo-indicator](.agents/skills/tpo-indicator/SKILL.md), [ui-component](.agents/skills/ui-component/SKILL.md), [openalgo-websocket](.agents/skills/openalgo-websocket/SKILL.md)).

### OpenAlgo v1 Protocol Alignment & Endpoint Fixes
- **Corrected Positionbook Sync Endpoint (`ChartManager.ts`)**: Fixed typo in `refreshLiveTradingState()` from invalid `POST /api/v1/positions` to the official OpenAlgo endpoint `POST /api/v1/positionbook`, resolving HTTP 404 errors during live position synchronization.
- **Telegram & WhatsApp Single-Recipient Alignment (`ChartManager.ts`, `PaperBroker.ts`)**: Updated notification payload construction to strictly adhere to OpenAlgo Utilities API rules where exactly one recipient mode is permitted (`self`, `username`, `phone`, or `phones`). Resolved bug where `self: true` took precedence over specified custom usernames.
- **Expanded Online Exchange Recognition (`symbols.ts`)**: Enhanced `detectOnlineExchange()` to support `MCX_INDEX` (e.g. `BULLDEX`, `ENRGDEX`), `CRYPTO` (e.g. `BTCUSDT`, `ETHUSDT`), and explicit exchange prefixes (`MCX:`, `NFO:`, `BFO:`, `CDS:`, `CRYPTO:`) matching the 14 `VALID_EXCHANGES` constants.

### OpenAlgo Documentation Architecture Migration to `doc/OpenAlgo/`
- **Designated `doc/OpenAlgo/` as Official Frozen Source of Truth**: Established [doc/OpenAlgo/](doc/OpenAlgo/) as the official frozen documentation source of truth for OpenAlgo REST, WebSocket, Order Constants, Portfolio, and Strategy RMS APIs. Retired legacy `docs/OpenAlgo/`.
- **API Coverage Expanded to 71 Endpoints**: Documented Portfolio Analytics API (`/api/v1/portfolio/*`), Strategy RMS Engine API (`/api/v1/strategy/*`), SIP Analytics (`/api/v1/sip/*`), explicit Marshmallow schema validation (`HTTP 400` on undeclared fields), and updated exchange constants (`MCX_INDEX`, `CRYPTO`).
- **Architectural Rules & Skills Aligned**: Updated documentation rules and references in [AGENTS.md](AGENTS.md) and developer skills ([openalgo-rest](.agents/skills/openalgo-rest/SKILL.md), [openalgo-websocket](.agents/skills/openalgo-websocket/SKILL.md)).

### KlineCharts v10.0.3 Upgrade & Frozen Documentation Architecture
- **Dependency Upgraded to `klinecharts@10.0.3`**: Upgraded `klinecharts` from `^10.0.2` to `^10.0.3` in [package.json](package.json). Gained upstream backward pagination fix in `DataLoader`, default indicator style parsing calculation optimizations, and support for the `fixedZLevel?: boolean` overlay property.
- **Designated `doc/` as Official Frozen Documentation Source of Truth**: Established `doc/klinecharts-v10.0.3/` as the primary frozen local source of truth for KlineCharts v10 APIs. Retired legacy `docs/klinecharts-v10.0.0/` and updated architectural documentation rules and reference tables in [AGENTS.md](AGENTS.md).

### Project Configuration & Workspace Structure
- **Excluded `doc/` Folder from Git (`.gitignore`)**: Created local `doc/` directory in project root and added `doc/` to `.gitignore` to keep local documentation and notes excluded from version control tracking.

## 2026-08-18

### Dedicated Flattrade Broker Pricing Model (`marginHelper.ts`, `AccountManager.ts`)
- **1:1 Flattrade Schedule Integration**: Added dedicated `'flattrade'` broker template to the Paper Trading engine with **₹0 Brokerage** across all segments (Equity Delivery CNC, Intraday MIS, Equity Futures & Options, MCX Commodities, and Currency).
- **Exact Exchange & Statutory Schedules**: Implemented Flattrade-specific exchange transaction charges (NSE Futures `0.00183%`, Options `0.03553%`, BSE `0%` Futures, MCX Futures `0.0021%`, MCX Options `0.041%`) and exact segment IPFT fees (Equity `₹10/Cr`, Options `₹50/Cr`, Currency Options `₹200/Cr`).
- **Dropdown Option Added**: Added clean `"Flattrade"` option to the Paper Brokerage Charges dropdown in [AccountManager.ts](src/ui/AccountManager.ts).

### Chart Watermark Logo Rebrand to "YSTC Charts"
- **Watermark Typography Scaled & Fully Bold (`public/icons.svg`, `style.css`)**: Scaled the brand watermark text to a prominent `52px` bold font for both **YSTC** and **Charts** (`font-weight="700"`), updated viewBox to `0 0 480 72`, and expanded hover reveal width to `190px` for optimal optical balance with the circular trading mark.
- **Watermark Interaction Preserved (`ChartWatermark.ts`)**: Maintained collapsed-to-expanded hover-reveal behavior (compact 32px icon mark expanding to 190px on hover/focus).
- **Branding Metadata & Component Integration (`icons.ts`, `ChartWatermark.ts`)**: Added `ystcChartsLogoEl` export for unified canvas branding. Updated title to `'YSTC Charts - Start your trading journey'` and accessibility attributes while preserving destination link `https://ystc.in/start-your-trading-journey`.

## 2026-08-14

### Order Surfaces Targeted & Dynamic Freeze Limit Fetching
- **Scoped Freeze Limit Fetching on Order Surfaces**: Confined freeze limit requests exclusively to the two order execution surfaces: the Floating Order Ticket Modal ([OrderModal.ts](src/ui/OrderModal.ts)) and the DOM / Right Order Panel ([OrderPanel.ts](src/ui/OrderPanel.ts)). General charting, watchlist browsing, alerts, indicators, and user scripts do not trigger freeze queries.
- **Clean Freeze Limit State Resets**: Ensured `this.freezeQty` is strictly initialized to `0` at the start of `fetchSymbolMetadata()` and `refreshLotSize()`, on modal hide/close, on non-success API responses, in offline mode, and in catch blocks. Eliminates stale freeze limits carrying over across symbol switches.
- **Order Panel View Activation Trigger**: Added dynamic `fetchSymbolMetadata()` invocation when opening or switching into the Right Panel `'trade'` view (`right-panel:view`), guaranteeing fresh broker lot size, tick size, and freeze limit state on demand.
- **Lot-Size Fallback Scaling**: Enhanced `OrderPanel.ts` and `OrderModal.ts` to query `getRegisteredSymbolLotSize()` as a fallback if API metadata does not provide a lot size > 1 for derivative instruments before calculating scaled freeze limits.

## 2026-08-13

### Live Volume Calculation & Indicator Y-Axis Badge Fixes
- **Intra-Candle Tick Volume Baseline Preserved (`chartInit.ts`)**: Refactored `calculateLiveCandleVolume()` in [chartInit.ts](src/chart/chartInit.ts) to track `lastCumulativeVolume` across incoming WebSocket ticks. When a new candle bucket starts, `cumulativeVolumeBaseline` transitions to the final cumulative volume of the previous candle bucket instead of overwriting baseline on the new candle's first tick. Intra-candle volume updates now accumulate monotonically in real-time without shrinking or collapsing mid-candle.
- **FYERS 1:1 Indicator Y-Axis Live Value Badge (`chartSettings.ts`)**: Enabled `indicator.lastValueMark` in [chartSettings.ts](src/chart/chartSettings.ts) to render live value badge pills on indicator sub-pane Y-axes matching FYERS 1:1.
- **`VolumeYSTC` Live Refresh & MA Badge Suppression (`volumeYSTC.ts`)**: Added `tick:update` event listener in [volumeYSTC.ts](src/indicators/volumeYSTC.ts) to invalidate secondary symbol cache on incoming live ticks. Updated `buildResults()` and `draw()` to pass `rawAvgMA` to `getPaletteColor()`, keeping canvas volume bar colors 100% active and vibrant whether MA is ON or OFF, while setting display `avgMA = undefined` when MA is OFF (`showMAV: false`) to suppress the `Vol MA` Y-axis badge.

## 2026-08-08

### ChargesPopover Layer Elevation Fix
- **`Charges:` Popover `z-index` Elevated to `10100`**: Updated inline `cssText` in [ChargesPopover.ts](src/ui/ChargesPopover.ts) from `z-index: 10000` to `z-index: 10100`. The itemized charges breakdown popover (opened by clicking `Charges: ₹X.XX` inside the floating Order Ticket) now renders above both the floating Order Ticket (`z-index: 10050`) and the floating Option Chain window (`z-index: 10000`), preventing it from being hidden behind the Option Chain when both windows are open simultaneously.

## 2026-08-07

#### Floating Option Chain Window & FYERS 1:1 Summary Header Redesign
- **TopBar Quick Trade Button Position & Order Realignment**: Moved the `Buy` / `Sell` quick order cluster in [TopBar.ts](src/ui/TopBar.ts) to sit directly between `Indicators` and `Replay` in the main top bar toolbar, and reordered the buttons to `Buy` first (Green) then `Sell` second (Red) matching user preference.
- **FYERS 1:1 Compact Bold Option Chain Header Bar**: Reduced `.oa-optionchain-header` height from `48px` to `36px` in [style.css](src/style.css) and updated the `Option Chain` title to prominent 16px bold (`font-weight: 700`) typography matching FYERS 1:1, eliminating all wasted vertical padding.
- **FYERS 1:1 Equal Distance Columns & Vertical Dividers**: Updated `.option-detl` in [style.css](src/style.css) with `flex: 1 1 0px` to distribute all 6 stat columns across 100% of the bar width with equal horizontal distance. Added subtle vertical divider lines (`border-right: 1px solid var(--border-color)`) between each column matching FYERS 1:1.
- **Fixed Stale CSS Grid Overrides for Option Chain Summary Bar**: Discovered and removed duplicate `.oa-optionchain-summary` rules (lines 10052 & 10411) in [style.css](src/style.css) that forced a 4-column CSS grid (`repeat(4, minmax(0, 1fr))`) and caused items to stretch with huge gaps and wrap to 2 lines. All 6 FYERS stat items now render on **1 single compact horizontal row** with zero line wrapping or huge gaps.
- **FYERS 1:1 Inspect Code Option Summary Header Bar**: Replaced card boxes with FYERS `.option-detl` inline list structure in [OptionChainModal.ts](src/ui/OptionChainModal.ts) and [style.css](src/style.css). Formats all readouts (`SPOT`, `PREV CLOSE`, `ATM STRIKE`, `PCR`, `TOTAL OI`, `EXPIRY`) into a single borderless horizontal strip matching FYERS 1:1, featuring dynamic spot price change calculations (`390.75 -3.25 (-0.82%)`) with zero cards or empty space gaps.
- **Non-Modal Draggable Floating Option Chain Window**: Converted Option Chain window into a 100% non-blocking floating window in [OptionChainModal.ts](src/ui/OptionChainModal.ts) and [style.css](src/style.css). Backdrop is updated to transparent `pointer-events: none;`, allowing mouse clicks to pass straight through to the chart canvas (drawings, toolbars, DOM panel) while the Option Chain is open. Added mouse drag event listeners on `.oa-optionchain-header` for smooth window movement with session coordinate memory.

### Floating Order Ticket Modal (`OrderModal.ts`) Redesign
- **Floating Order Ticket Layer Elevation Above Option Chain (`z-index: 10050`)**: Increased `z-index` of [OrderModal.ts](src/ui/OrderModal.ts) and `.order-modal-backdrop` in [style.css](src/style.css) to `10050` (higher than Option Chain's `10000`). Clicking BUY or SELL on any option contract in the Option Chain table pops up the floating Order Ticket directly on top of the Option Chain, completely unblocked.
- **360px Container Width & 1-Row FYERS Summary Grid**: Set floating Order Ticket width to `360px` in [OrderModal.ts](src/ui/OrderModal.ts) and aligned all 3 summary readouts (`Charges: ₹73.42` link on left, `Margin: ₹1,47,540.00 (5x)` in middle, `Avail: ₹10,00,000.00` on right) across 1 single space-between row matching FYERS 1:1.
- **Shortened Margin Label & Live Available Balance Readout**: Shortened `"Required Margin:"` to `"Margin:"` and added live account balance readout (`Avail: ₹10,00,000.00`), updated in real-time based on selected product and paper/live trading engine.
- **Dynamic Live `Charges: ₹X.XX` Link Readout**: Updated bottom charges link in [OrderModal.ts](src/ui/OrderModal.ts) from static text `"Price breakup"` to dynamic real-time estimated charges (e.g. **`Charges: ₹0.46`**). Updates live as Quantity, Price, Side, or Product changes, opening the detailed itemized charges popover on click.
- **Dynamic Leverage Multiplier Badges (`1x`, `5x`)**: Added dynamic product leverage multiplier badges to the Margin readout in [OrderModal.ts](src/ui/OrderModal.ts) (`5x` for MIS intraday equity/futures, `1x` for CNC delivery/NRML futures), matching FYERS 1:1.
- **100% Zerodha Charges Alignment (`zerodha.com/charges`)**: Updated Zerodha exchange transaction charge rates 1:1 with official Zerodha schedule in [zerodhaCharges.ts](src/paper/zerodhaCharges.ts) (NSE Equity delivery `0.00297%`, intraday `0.00297%`, Futures `0.00173%`, Options `0.03503%`).
- **1:1 DOM Order Alignment with Floating Order Ticket**: Updated `placeDomOrder()` and DOM footer in [OrderPanel.ts](src/ui/OrderPanel.ts) so quantity input operates in **Lots** when `lotSize > 1` (e.g. typing `5` for MCX `CRUDEOIL` sends `500 units = 5 lots`), matching [OrderModal.ts](src/ui/OrderModal.ts) 1:1. Updated DOM position badge to display open position quantity in lots (`+5` lots).
- **Restored August 3 Freeze Quantity Lot-Scaling Fix**: Restored `(rawFreeze > 0 && rawFreeze < this.lotSize) ? rawFreeze * this.lotSize : rawFreeze` in `fetchSymbolMetadata()` of [OrderPanel.ts](src/ui/OrderPanel.ts) and `fetchSymbolInfo()` of [OrderModal.ts](src/ui/OrderModal.ts). When OpenAlgo or broker APIs return `freeze_qty` in lots (`freeze_qty < lotSize`, e.g. `1` for MCX `CRUDEOIL` with `lotSize = 100`), the limit is correctly scaled to unit quantity (`100 units = 1 lot`), preventing false freeze limit rejections when ordering 1 lot in both the right panel and floating Order Ticket modal. Added `registerSymbolLotSize()` registration upon metadata load.
- **Live OpenAlgo `tick_size` Metadata Fetch**: Added `fetchSymbolMetadata()` in [OrderPanel.ts](src/ui/OrderPanel.ts) to query OpenAlgo `POST /api/v1/symbol` on symbol switch in online mode. Retrieves exact exchange/broker `tick_size`, `lotsize`, and `freeze_qty` dynamically without guessing or hardcoding.
- **Dynamic Symbol Tick Multiplier Menu (Dhan/FYERS 1:1)**: Redesigned Price Step menu in [OrderPanel.ts](src/ui/OrderPanel.ts) and [SettingsModal.ts](src/ui/SettingsModal.ts) to generate options based on base tick multipliers (`1x`, `2x`, `5x`, `10x`, `20x`, `50x`, `100x`). For **CRUDEOIL** (`1.00`), menu displays `1.00 Default`, `2.00`, `5.00`, `10.00`, `20.00`, `50.00`, `100.00` matching Dhan/FYERS screenshots 1:1. For **SBIN/RELIANCE** (`0.10`), menu displays `0.10 Default`, `0.20`, `0.50`, `1.00`, `2.00`, `5.00`, `10.00`.
- **Permanent 120-Row Continuous DOM Price Grid**: Expanded price ladder generation to 60 ticks above & 60 ticks below LTP (121 continuous price rows) in [OrderPanel.ts](src/ui/OrderPanel.ts). Permanently guarantees 100% vertical viewport fill across all monitor screen resolutions (1080p, 1440p, 4K) with zero whitespace gap at the bottom.
- **100% Vertical Viewport Height Fill**: Updated DOM level filtering in [OrderPanel.ts](src/ui/OrderPanel.ts) to ensure continuous price rows fill 100% of the vertical panel height edge-to-edge. Toggling DOM settings will NEVER collapse the ladder into a small 4-row box or create an empty whitespace void.
- **FYERS-Parity Best Bid/Ask Gap Filtering**: Refined `"Show prices between the best bid/ask"` logic in [OrderPanel.ts](src/ui/OrderPanel.ts) to hide ONLY the empty price gap level(s) strictly between the best bid and best ask (e.g. hiding `7,422` between `7,423` Ask and `7,421` Bid), preserving 50 rows above and below matching FYERS 1:1.
- **Fix DOM Setting Event Listener Freeze**: Moved `eventBus.on('dom:setting:change')` to the `OrderPanel` constructor in [OrderPanel.ts](src/ui/OrderPanel.ts). Prevents duplicate event listener accumulation inside `buildDomView()`, completely eliminating browser tab freezes when toggling DOM settings.
- **WebSocket `updateDepth` Console Log Deduplication**: Scoped `console.log("wsClient.updateDepth: ...")` inside `if (existing.depth !== targetDepth)` in [wsClient.ts](src/openalgo/wsClient.ts). Logs now trigger strictly when depth levels actually change (e.g. 5 → 20 → 50), eliminating continuous per-tick log spam during real-time DOM rendering.
- **DOM Header `•••` Settings Dropdown Popup**: Added floating `.dom-settings-popup` menu in [OrderPanel.ts](src/ui/OrderPanel.ts) and [style.css](src/style.css) triggered by the `•••` button in DOM header with outside-click dismissal.
- **`Show zero trade volume prices` Option**: Added toggle option to show/hide zero volume prices, accessible from DOM header `•••` popup and **Settings > Trading > Market Depth & DOM Settings**.
- **`Show prices between the best bid/ask` Option**: Added toggle option to show/hide empty price levels between best bid and best ask, accessible from DOM header `•••` popup and **Settings > Trading > Market Depth & DOM Settings**.
- **DOM Price Step Setting (`Settings > Trading`)**: Added DOM Price Step selection dropdown (`0.10`, `0.05`, `0.20`, `0.50`, `1.00`, `2.00`, `5.00`, `10.00`, `Auto`) in [SettingsModal.ts](src/ui/SettingsModal.ts) matching FYERS & Dhan.
- **Hidden Scrollbar & Mousewheel Scrolling**: Completely hidden the vertical scrollbar visually (`scrollbar-width: none; ::-webkit-scrollbar { display: none; }`) while preserving smooth mousewheel scrolling in [style.css](src/style.css).
- **Standard Continuous `0.10` Price Tick Steps**: Enforced standard `0.10` price tick steps (`1,087.10` → `1,087.00` → `1,086.90` → `1,086.80`) in [OrderPanel.ts](src/ui/OrderPanel.ts) so every single price tick is listed without skipping.
- **Borderless White Panel Background**: Removed the outer grey card border from `.dom-ladder-container` so the centered 180px table sits seamlessly on a clean white background matching FYERS 1:1.
- **180px Centered Price Ladder Table**: Restricted the DOM price ladder table to `180px` width and centered it (`margin: 0 auto`), leaving ~65px outer side margins matching FYERS 1:1.
- **3 Fixed Columns (`50px | 80px | 50px`)**: Set fixed column widths for Bid Vol (`50px`), Price (`80px`), and Ask Vol (`50px`) with vertical dividers.
- **Outer Margin Hover Limit Order Chips**: Positioned `Limit` buy/sell chips as floating overlay badges in the 65px outer margins (`left: -52px` and `right: -52px`) outside the 180px table on row hover.
- **FYERS Vertical & Horizontal Grid Dividers**: Added clean vertical divider lines between columns (`Bid` | `Price` | `Ask`) and horizontal lines between rows in [style.css](src/style.css).
- **Blue Dashed Price Hover Focus Box**: Added crisp blue dashed outline box (`outline: 1px dashed #2962ff`) around the target 80px price level cell on row hover.
- **50 Continuous Price Ticks & 100% Viewport Fill**: Expanded price ladder generation to 25 ticks above & 25 ticks below LTP (51 total rows) to fill 100% of the vertical viewport space, completely eliminating empty whitespace gaps at the bottom.
- **Auto LTP Scroll Centering**: Implemented automatic scroll centering in [OrderPanel.ts](src/ui/OrderPanel.ts) to keep the active LTP row perfectly centered vertically in the viewport on render and symbol changes.
- **Color-Coded Prices**: Color-coded Ask prices above LTP in Red (`#ef5350`) and Bid prices below LTP in Blue (`#2962ff`), with full-width highlighted row background on active LTP.
- **Totals & Cancel Shortcuts Bar**: Integrated Cancel Bids `[✕]` (left), Total Bids pill, Re-center `[⟳]`, Total Asks pill, and Cancel Asks `[✕]` (right) into a unified totals bar.
- **Dynamic Position Row & 2-Row Action Grid**: Automatically hides the position status bar while flat (0 position); updated bottom control buttons to a clean 2-row Fyers layout (`Flatten | CXL All | Reverse` top row, `Buy Mkt | Qty Input | Sell Mkt` bottom row).
- **Fyers DOM CSS Suite**: Added full Fyers DOM styling rules to [style.css](src/style.css).

### DOM Panel Header & Market Depth Settings Streamlining
- **Removed Header Depth Pill Selector**: Removed the `Auto`, `5D`, `20D`, `50D` depth pill selector bar from the DOM panel header in [OrderPanel.ts](src/ui/OrderPanel.ts) to reclaim vertical layout height for price ladder rows.
- **Removed Static Status Bar**: Removed the legacy `"Connected config"` (`.oa-status`) status text bar from the top of the DOM panel in [OrderPanel.ts](src/ui/OrderPanel.ts). Order status and error notifications stream directly via the global floating Toast Notification system (`ToastManager`).
- **Default Auto Subscription**: Retained market depth subscription control via **Settings > Trading > Market Depth Level** (defaulting to `'auto'`) with automatic WebSocket level-3 depth streaming.
- **CSS Cleanup**: Removed obsolete `.dom-depth-pills` styling from [style.css](src/style.css).

### KlineCharts Library Upgrade to v10.0.2
- **Dependency Version Update**: Upgraded `klinecharts` package dependency from `10.0.1` to `10.0.2` in [package.json](package.json).
- **Patch Stability & Build Verification**: Verified clean TypeScript compilation and Vite obfuscated production build output with 0 errors. Retained 100% backward and forward compatibility with local v10 reference documentation and `@ystc/sdk` chart runtime bridges.

### Live Margin Initial Load & CNC Upfront Cash Calculation Fixes
- **Immediate Initial Live Margin Load**: Reset `_lastMarginCacheKey = ''` inside `show()` and `build()` in [OrderModal.ts](src/ui/OrderModal.ts). Opening the Floating Order Ticket clears stale cache keys and forces an immediate fresh `/margin` REST API request on first render without needing to change quantity.
- **CNC Upfront Cash Display**: For `CNC` (Longterm Delivery) orders, if OpenAlgo's `/margin` API returns `0` or an error (since CNC is full delivery, not leveraged), automatically falls back to displaying 100% upfront cash required (`Price × Quantity`).

### Real-Time WebSocket Market Depth (DOM) Synchronization
- **`tick:depth` Event Bus Alignment**: Updated event subscription in [OrderModal.ts](src/ui/OrderModal.ts) from `depth:update` to `tick:depth` with `toLiveSymbol()` symbol normalization. Level-3 market depth ticks stream live into the bottom 5-level grid of the Floating Order Ticket.
- **Right DOM Panel Live Streaming Fix**: Removed legacy sub-tab guards (`this.activeTab === 'DOM'`) in `updateRealtimeDepth()` in [OrderPanel.ts](src/ui/OrderPanel.ts) and reset `subscribedSymbol = null` on `symbol:change`. Incoming WebSocket depth ticks (`tick:depth`) render live on the main right DOM panel without requiring manual refresh.

### Non-Modal Draggable Floating Order Ticket Window (Fyers Parity)
- **100% Non-Blocking & Transparent Overlay**: Updated `.order-modal-backdrop` in [style.css](src/style.css) to `pointer-events: none; background: transparent; backdrop-filter: none;`. The dark blur backdrop overlay is removed, allowing mouse clicks to pass straight through to the chart canvas, drawings, toolbars, and right DOM panel while the Order Ticket stays open.
- **Draggable Window Header**: Added mouse drag handling (`mousedown`, `mousemove`, `mouseup`) to the Order Ticket header in [OrderModal.ts](src/ui/OrderModal.ts). Dragging the header moves the window smoothly across the screen within viewport bounds, with `grab` / `grabbing` cursor indicators.
- **Session Position Memory**: Preserves user-dragged coordinates (`windowX`, `windowY`) when opening or re-opening the window during the active session.

### Floating Order Ticket Modal Trading Engine & Network Alignment
- **Dynamic Mode & Engine Hydration**: Updated [OrderModal.ts](src/ui/OrderModal.ts) to dynamically read `openchart_mode` (`'offline'` / `'online'`) and `openchart_trading_engine` (`'paper'` / `'live'`) from `localStorage` in constructor init, `updateRealtimeLtp()`, and `show()`. Engine badge (`[PAPER]` / `[LIVE]`) and submit routes dynamically mirror Account Manager and TopBar state without stale defaults.
- **Restored Paper & Live Order Pipelines**: Aligned order placement in [OrderModal.ts](src/ui/OrderModal.ts) 100% with the 04-08-2026 `OrderPanel.ts` reference:
  - **Paper Mode**: Submits via `eventBus.emit('paper-order:submit', payload)` to trigger full `PaperBroker` margin checks, position tracking, Toast popups, and audio alerts (`pop.mp3`/`raven.mp3`).
  - **Live Mode**: Validates `openchart_mode === 'online'`, checks `openalgo_apikey`, resolves `toLiveSymbol` & `resolveCanonicalExchange`, and POSTs to `/placeorder` with `strategy: 'YSTC_Charts'` payload.
- **WebSocket Market Depth Feed (`resubscribeDepth`)**: Re-introduced `resubscribeDepth()` to [OrderModal.ts](src/ui/OrderModal.ts) to stream real-time depth ticks (`wsClient.updateDepth`) from OpenAlgo when in Online mode.
- **Engine-Aware Margin Calculation**: In Paper mode, calculates required margin locally using `calculateMargin()`. In Live mode, fetches live required margin from OpenAlgo REST `/margin` POST endpoint.

## 2026-08-06

### Centered Floating Order Ticket Modal & Dedicated Fyers-Style DOM Panel
- **Floating Order Ticket Modal (`OrderModal.ts`)**: Created standalone centered floating order ticket modal component in [OrderModal.ts](src/ui/OrderModal.ts) styled after `OptionChainModal.ts` and Toast Notifications. Preserves 100% of order form inputs (`Buy`/`Sell` side toggle, `MARKET`/`LIMIT`/`SL`/`SL-M` chips, `Qty`, `Product`, `Price`, `Trigger Price`, `Margin`, `[PAPER/LIVE] Submit`, and bottom 5-level Bid/Ask depth grid).
- **5-Level Market Depth Grid & Volume Bars Restoration**: Restored 100% of the original 5-level market depth grid into [OrderModal.ts](src/ui/OrderModal.ts), including `.oa-dom-bid-bar` green volume depth bars, `.oa-dom-ask-bar` red volume depth bars, centered LTP badge row (`.oa-dom-ltp-badge`), and aggregate `.oa-dom-totals` buy/sell totals bar.
- **Active Symbol & Real Market Price Sync**: Connected active chart symbol selection (`getDefaultSymbolSelection()`) to [OrderModal.ts](src/ui/OrderModal.ts). Symbol header title (e.g. `CRUDEOILM19AUG26FUT - MCX`), exchange badge, and depth ladder prices dynamically update to active market prices (e.g. `7376.00`).
- **Modal Popup Backdrop & Visibility Controls**: Added `.order-modal-backdrop` overlay styling with backdrop blur in [style.css](src/style.css) and `.hidden` toggle logic in [OrderModal.ts](src/ui/OrderModal.ts). Backdrop click, `Escape` key, or `✕` close button dismisses the popup window.
- **Strict Bottom Dock Tab Ordering**: Updated bottom dock tab bar header in [AccountManager.ts](src/ui/AccountManager.ts) strictly to `[ Account Manager ]` | `[ DOM ]` | `[ Script Editor ]`. Clicking `[ DOM ]` toggles the right sidebar Depth of Market panel open/closed.
- **Dedicated Fyers-Style Right DOM Sidebar**: Dedicated the right sidebar panel in [OrderPanel.ts](src/ui/OrderPanel.ts) strictly to Depth of Market (DOM) matching Fyers inspect layout: header `${symbol}, Trading` with Settings (`⚙`) and Close (`✕`), full-height depth ladder with Ask/Bid size bars and LTP highlight, and bottom controls (`Flatten`, `CXL All`, `Reverse`, `Buy Mkt`, Qty Stepper, `Sell Mkt`).
- **TopBar & Chart Context Menu Triggers**: Wired TopBar `Buy` and `Sell` buttons as well as Chart Context Menu order items to open the centered floating `OrderModal`.

### Order Panel & Chart Trading Streamlining
- **Removed Pre-Submission `orderProjection` Overlay**: Selecting `LIMIT`, `SL`, or `SL-M` order types in [OrderPanel.ts](src/ui/OrderPanel.ts) no longer projects draft blue lines (`LIMIT BUY 10 7340.00 Submit | Cancel`) onto the chart. Entry and trigger prices are configured directly via numerical inputs in the Order Panel. Submitted active orders immediately appear as live, draggable dashed **`activeOrder` overlay lines** on the chart.
- **Removed Take Profit & Stop Loss Fields from Pending Order Forms**: Completely removed the Take Profit (`Take profit price`) and Stop Loss (`Stop loss price`) input rows from [OrderPanel.ts](src/ui/OrderPanel.ts). Order forms now present a clean, compact layout: `Order Side` → `Order Type` → `Quantity` → `Product` → `Limit/Trigger Price` → `Submit Button`.
- **Removed Redundant `Cancel Last` Row & Reclaimed Space**: Completely removed the `Cancel Last` button row and `handleCancelLastOrder()` from [OrderPanel.ts](src/ui/OrderPanel.ts). Reclaimed vertical layout space to bring the 5-level Market Depth (DOM ladder) up higher on screen directly below the main submit button.
- **Preserved Active Position TP & SL Controls**: Take Profit and Stop Loss target lines and drag handles on active open positions (`activePosition` overlay) remain 100% untouched and fully functional on the chart canvas.

## 2026-08-04

### Order & System Audio Notifications Suite (pop.mp3, raven.mp3, offline.mp3 & jackpot.mp3)
- **Full Platform Audio Sound System**: Expanded [audio.ts](src/utils/audio.ts) sound helpers and connected triggers to [ToastManager.ts](src/ui/ToastManager.ts) and [main.ts](src/main.ts):
  - **`pop.mp3`**: Plays for successful order placement, execution, fill, and price/quantity modification alerts.
  - **`raven.mp3`**: Plays for order rejections, insufficient funds, freeze limit violations, and execution failures.
  - **`offline.mp3`**: Plays strictly when the top warning bar (*"You’re offline. The markets aren’t. Don’t miss your move."*) appears on screen during Online mode connection drops. Switching to normal Offline CSV charting mode does not trigger offline audio.
  - **`jackpot.mp3`**: Copied `Jackpot.mp3` from `referance_use_only/` to `public/jackpot.mp3`. Plays when a Take Profit (Target Hit) order fills. Placing a Take Profit order plays the standard `pop.mp3`.
  - **Online Connected Chime**: Web Audio C-E-G major tri-tone rising chime plays when switching to online mode or when OpenAlgo WebSocket authenticates.
  - **Order Cancelled Tone**: Soft double-pulse tone plays when an order is cancelled.
- **Customizable Sound Settings Toggles**: Added interactive ON/OFF sound setting checkboxes to [SettingsModal.ts](src/ui/SettingsModal.ts) under Trading tab with `localStorage` persistence. Added `isSoundEnabled()` helper in [audio.ts](src/utils/audio.ts) to verify master and granular sound switches (`sound_master_enabled`, `sound_execution_enabled`, `sound_rejection_enabled`, `sound_target_enabled`, `sound_cancel_enabled`, `sound_online_enabled`, `sound_offline_enabled`). All sounds remain enabled (`true`) by default.
- **Premature Submission Notification Removal**: Removed unvalidated pre-submission notification broadcasts in [OrderPanel.ts](src/ui/OrderPanel.ts). Order submission toasts and sound triggers are now strictly emitted by [PaperBroker.ts](src/paper/PaperBroker.ts) after margin validation, ensuring rejected orders fire only `raven.mp3` and never play a false `pop.mp3` sound.

### Global Floating Toast Notification System (ToastManager)
- **Top Floating Toast System**: Created a unified global notification toast system in [ToastManager.ts](src/ui/ToastManager.ts) and mounted in [main.ts](src/main.ts). Automatically handles popups for all `trading:status:notify` and `ui:toast` events (order submissions, fills, paper trading alerts, error messages, and watchlist updates).
- **Responsive Viewport Popups**: Displays top-center popups (`top: 12px`, `left: 50%`, `transform: translateX(-50%)`) on mobile screens ($\le 768\text{px}$) and top-right popups (`top: 48px`, `right: 16px`) on desktop, featuring smooth pop-in/pop-out animations, color-coded badges (`✓`, `⚠️`, `⚡`, `ℹ️`), auto-dismiss timer, and close button (`×`).
- **Account Manager Listener Cleanup**: Removed redundant `trading:status:notify` event listener in [AccountManager.ts](src/ui/AccountManager.ts) that was double-invoking toast creation. Clean architectural fix without masking symptoms via buffer guards.

### Account Manager Mobile Bottom Dock Responsiveness Fix
- **Mobile Header Overlap Fix**: Resolved mobile layout issue where Account Manager header tabs (`Account Manager`, `Script Editor`), status indicators, status pills (`Live`, `Paper`), and dock action buttons (`↻`, `⚙`, `📲`, `⌃`) overlapped or squished onto multiple lines on small viewports ($\le 768\text{px}$).
- **Single-Line Tab Layout**: Enforced `white-space: nowrap` and `flex-shrink: 0` on dock tabs in [AccountManager.ts](src/ui/AccountManager.ts) and added horizontal touch scrolling (`overflow-x: auto`) for header elements in [style.css](src/style.css).
- **Responsive Status Badges & Summary Grid**: Hid non-essential metadata (`lastRefreshLabel`) on mobile screens, scaled down pill badges, and converted `.oa-account-summary` from fixed 5-column layout to auto-fit grid (`repeat(auto-fit, minmax(90px, 1fr))`) to keep financial metrics legible on mobile devices.

## 2026-08-03

### Fyers-Style Timezone Selector & Live Clock
- **Full Fyers Timezone Master List**: Expanded `CHART_TIMEZONES` in [chartSettings.ts](src/chart/chartSettings.ts) with the full 94-item standard timezones matching Fyers / TradingView inspect structure (e.g. `(UTC+5:30) Kolkata`, `Exchange`, `UTC`, `(UTC-4) New York`, `(UTC+1) London`, `(UTC+9) Tokyo`, etc.). Added `resolveIanaTimezone()` to ensure 100% safe, non-breaking IANA timezone formatting for KlineCharts without runtime `Intl.DateTimeFormat` exceptions.
- **Live Footer Clock & Interactive Timezone Popup**: Replaced static dummy string in [ChartFooter.ts](src/ui/ChartFooter.ts) with a live 1-second ticking clock button (`HH:mm:ss UTC+5:30`). Styled with high-contrast `12px font-weight: 600` primary text on a prominent pill badge (`var(--bg-secondary)`), and upgraded left range buttons (`1D 5D 1M 3M 6M YTD 1Y 5Y All` + `goto` calendar picker button with crisp 18px icon centering) to primary text (`var(--text-primary)`) matching Fyers chart footer metrics. Clicking opens an interactive, scrollable Fyers-style timezone menu (`chart-tz-menu-popup`) with active checkmark indicators (`✓`) and instant eventBus synchronization with KlineCharts and Main Settings.

### Dynamic Symbol Lot Size Registry (No Hardcoded Symbols)
- **Zero-Hardcoding Symbol Lot Registry**: Replaced fallback hardcoded symbol string checks (`GOLD`, `CRUDEOIL`, `NIFTY`, etc.) in [marginHelper.ts](src/utils/marginHelper.ts) with `symbolLotSizeRegistry` and `registerSymbolLotSize()`. [OrderPanel.ts](src/ui/OrderPanel.ts) automatically populates the registry upon fetching symbol metadata from OpenAlgo REST API, ensuring exact lot sizes for all contracts (including Mini contracts like `GOLDM`, `SILVERM`, `SILVERMIC`) are resolved dynamically without hardcoding.

### Lot Count UI Display in Order Panel & Account Manager
- **Dynamic Order Panel Lot Header**: Updated `syncQuantityUiMeta()` in [OrderPanel.ts](src/ui/OrderPanel.ts) to dynamically display lot count badges (e.g. `Quantity (1 Lot)`, `Quantity (2 Lots)`) alongside unit quantity whenever `lotSize > 1`.
- **Lot Formatting in Account Manager Tables**: Added `formatQuantityWithLots()` in [marginHelper.ts](src/utils/marginHelper.ts) and connected to [AccountManager.ts](src/ui/AccountManager.ts). Trades, Orders, Positions, and Holdings tables format F&O and Commodity quantities as `100 (1 Lot)` or `200 (2 Lots)`.

### MCX & F&O Freeze Limit Lot/Unit Scaling Fix
- **Scaled Freeze Limit by Lot Size**: Updated `refreshLotSize()` and order validation in [OrderPanel.ts](src/ui/OrderPanel.ts) to scale `freezeQty` by `lotSize` when OpenAlgo / broker metadata returns `freeze_qty` in lots (`freeze_qty < lotSize`). Allows ordering 1 lot of MCX commodities (e.g. 100 units for `CRUDEOIL`) without triggering false client-side freeze limit rejections, while correctly capping multi-lot orders above the exchange freeze limit.

### KlineCharts Version Upgrade
- **Upgraded KlineCharts to ^10.0.1**: Upgraded `klinecharts` dependency in [package.json](package.json) from `^10.0.0` to `^10.0.1` and updated `package-lock.json`. Incorporates mobile gesture fixes, area animation lifecycle improvements, canvas DPR scaling enhancements, color parser fixes, and TypeScript `.d.ts` declaration fixes.

### OpenAlgo End Date Parameter Fix & In-Flight Request Deduplication
- **Exact Current IST Date for OpenAlgo History Requests**: Updated `endDateObj` calculation in [onlineLoader.ts](src/chart/onlineLoader.ts) to use `new Date()` (exact current date) instead of adding +24 hours, eliminating OpenAlgo server warnings (`Warning: End date is in the future. Adjusting to current date`).
- **In-Flight Request Deduplication on WS Authenticated**: Added `isOnlineLoadPending()` and `hasOnlineCache()` checks to `ws:authenticated` listener in [ChartManager.ts](src/chart/ChartManager.ts) to avoid purging online cache and firing duplicate HTTP POST history requests when a fetch is already in flight.

### Microtask WebSocket Command Batching & AGENTS.md Architecture Protection
- **Microtask WebSocket Array Batching**: Implemented microtask (`queueMicrotask`) array command batching in [wsClient.ts](src/openalgo/wsClient.ts) for OpenAlgo WebSocket subscriptions and unsubscriptions. Rapid individual `subscribe()` / `unsubscribe()` calls during tab switches or symbol selections are automatically combined into single JSON array payloads (`{ action: 'subscribe', symbols: [...] }`), eliminating socket queue backpressure, payload fragmentation, and Fyers API v3 rate-limiting dropouts.
- **Enterprise Enhancements Protection Rule**: Added protective guidelines to [AGENTS.md](AGENTS.md) safeguarding client-side enterprise enhancements (microtask WebSocket batching, active symbol watchdog protection, local session candle persistence, and SEBI 2026 CAS segment scoping) from accidental deletion or reversion. Added mandatory implementation plan prerequisite rule.


### WebSocket Watchdog Active Symbol Protection
- **Protected Active Chart & Position Symbols**: Updated `startWatchdog()` in [wsClient.ts](src/openalgo/wsClient.ts) to prevent the watchdog from purging subscriptions for the active chart symbol (`getActiveChartSymbol()`) or open Account Manager positions/holdings (`this.activePositionSymbols`). If an illiquid option contract (e.g. `SBIN25AUG261040PE.NFO`) or quiet symbol has no trade ticks for 45 seconds, the watchdog now maintains a keep-alive re-subscribe loop without deleting the subscription key, ensuring live feeds for open charts and positions never get cut off.

### SEBI 2026 Closing Auction Session (CAS), Pre-Open & F&O Product Rules
- **CAS & F&O Market Hours**: Updated `getMarketStatus()` and `MarketStatus` interface in [marketHours.ts](src/utils/marketHours.ts) to model the SEBI 2026 Closing Auction Session (`03:15 PM – 03:35 PM IST`) for Equity Cash (`NSE`/`BSE`), while keeping Derivatives (`NFO`/`BFO`) continuous trading active until **`03:40 PM IST`**.
- **F&O NRML vs MIS & Pre-Open / CAS Order Validation**: Enforced 100% circular compliance across order placement, modification (`modifyOrder`), and cancellation (`cancelOrder`) in [PaperBroker.ts](src/paper/PaperBroker.ts):
  - **Pre-Open Auction Window (`09:00 AM – 09:15 AM IST`)**: Rejects Stop-Loss (`STOP`, `STOP_LIMIT`) orders (`09:00 – 09:10 AM`); rejects Market orders placed, modified, or cancelled after `09:05 AM` (`09:05 – 09:10 AM`); blocks all order actions during Pre-Open matching & transition (`09:10 – 09:15 AM`).
  - **CAS Transition Window (`03:15 PM – 03:20 PM IST`)**: Rejects all order placement, modification, and cancellation for Equity Cash during transition.
  - **CAS Order Entry & Matching (`03:20 PM – 03:35 PM IST`)**: Rejects Stop-Loss orders; rejects Market orders placed, modified, or cancelled after `03:25 PM` (`03:25 – 03:30 PM`); blocks all order actions during CAS single price matching (`03:30 – 03:35 PM`). Derivatives (`NFO`/`BFO`) trade continuously up to `03:40 PM` without CAS locks.
  - **Revised MIS Cutoffs**: F&O Intraday (`MIS`) auto-squared off at **`03:25 PM IST`** (NRML overnight continues to `03:40 PM`); CAS Equity (`MIS`) auto-squared off at **`03:05 PM IST`** (only `CNC` delivery thereafter); Non-CAS Equity (`MIS`) auto-squared off at **`03:20 PM IST`**.

### Live Session Candle Caching & IST Date Parsing
- **Local Session Bar Persistence**: Implemented `saveLiveSessionBar()` and `getLiveSessionBars()` in [onlineLoader.ts](src/chart/onlineLoader.ts) and connected to `subscribeBar` in [chartInit.ts](src/chart/chartInit.ts). Live WebSocket candles are automatically stored in `localStorage` (`ystc_online_session_bars_*`) and merged with OpenAlgo REST history on page reloads (F5), preserving intraday candles even when broker REST servers lag during live market hours.
- **IST Date & Timestamp Parsing**: Updated `getISTDateString()` and `parseOpenAlgoTimestampMs()` in [onlineLoader.ts](src/chart/onlineLoader.ts) to format history requests (`start_date`, `end_date`) using `Asia/Kolkata` timezone, set `end_date` to tomorrow's date for live market history requests to ensure broker API connectors include today's intraday candles (`09:15 AM` to current minute), parse numeric string timestamps (`/^\d+$/`) directly into milliseconds, and append explicit `+05:30` IST offsets to bare date-time strings, preventing UTC date/timestamp shifts and bar filtering.

### JavaScript Obfuscator Upgrade
- **Upgraded javascript-obfuscator to ^5.5.0**: Updated `javascript-obfuscator` devDependency in [package.json](package.json) from `^5.4.3` to `^5.5.0` and validated post-build JS obfuscation pipeline.

### Vite Dependency Upgrade
- **Upgraded Vite to ^8.2.0**: Updated `vite` devDependency in [package.json](package.json) from `^8.0.4` to `^8.2.0` and updated `package-lock.json`.

## 2026-08-02

### Git Repository & Data Directory Tracking Exclude
- **Ignored `data/` & `referance_use_only/` Directories**: Added `data/` and `referance_use_only/` to `.gitignore` to exclude local market CSV data files and reference folders from Git tracking.
- **Untracked Staged Files**: Removed `data/` and `referance_use_only/` index tracking via `git rm -r --cached` while preserving all local files on disk.

## 2026-07-31

### P&L-Aware Position Exit & Bracket Order Status Notifications (git: 1469106)
- **P&L-Aware Position Exit Badges**: Added real-time status notifications in [PaperBroker.ts](src/paper/PaperBroker.ts) dynamically colored by realized trade P&L upon position close/reduction (🟢 Green Profit `+₹P&L`, 🔴 Red Loss `-₹P&L`, 🔵 Blue Breakeven `₹0.00`).
- **TP/SL Bracket Order Notifications**: Added real-time status notifications for Take Profit placement (🔵 Blue), Stop Loss placement (🟠 Orange), order modifications (🔵 Blue), and order cancellations (🔵 Blue).

### Notification Layout & System-Wide EventBus Centralization (git: 0435912, 9ba462b)
- **Notification Pill Margin & Flex Sizing Fix**: Adjusted `headerStatusEl` CSS in [AccountManager.ts](src/ui/AccountManager.ts) to `flex: 0 1 auto; width: max-content; max-width: 100%; margin-right: 12px;`. Prevents notification pill badges from stretching across empty header space and touching or overlapping the right-docked `Live`/`Paper` account controls.
- **High-Contrast 4-Tier Pill Badges**: Upgraded `showHeaderStatus()` in [AccountManager.ts](src/ui/AccountManager.ts) to render high-contrast, soft-tinted pill badges with semantic icons (`✓`, `⚠️`, `⚡`, `ℹ️`) and `13px 600 weight` typography across 4 notification tiers (`success` green, `error` red, `warning` amber, `info` blue) with smart severity timeouts (6s for error, 4s for warning/success, 3s for info).
- **Dual Notification & Centralization**: Updated `setStatus()` in [OrderPanel.ts](src/ui/OrderPanel.ts) and [OptionChainModal.ts](src/ui/OptionChainModal.ts) to preserve local status boxes while emitting `trading:status:notify` simultaneously. 100% of order input validation checks, quantity warnings, limit/trigger tick size checks, broker failure messages, and cancel notices stream directly to the central bottom dock Status Notification.

### Paper Trading Order Store Correction & Zero-LTP Quote Guard (git: e5f19e7)
- **Rejected Order Routing Correction**: Updated [PaperBroker.ts](src/paper/PaperBroker.ts) to push all rejected orders (`REJECTED`) to `this.state.orders` instead of `this.state.trades`. Emits `orders:update` so rejected orders appear cleanly in the **Orders** tab (Order Book) with their red rejection reason badge, leaving the **Trades** tab strictly reserved for completed fills (`FILLED`).
- **Zero-LTP Quote Execution Guard**: Removed dummy fallback price `1000.00` from [PaperBroker.ts](src/paper/PaperBroker.ts) and added zero-LTP guards in [OrderPanel.ts](src/ui/OrderPanel.ts). If an order is placed when `ltp === 0` (e.g. immediately after switching symbols before WebSocket ticks arrive), order placement is blocked/rejected with notification: *"No price quote available for [SYMBOL] yet. Please wait a moment for market data to stream."*

### Non-Tradable Index Trading Restrictions & Dock Header Redesign (git: 938e254, 09b8c22, 8506d72)
- **Bottom Dock Header 2-Group Layout Redesign**: Restructured `oa-account-dock-header` in [AccountManager.ts](src/ui/AccountManager.ts) into two clean flex groups (`headerLeft` and `headerRight`). Status notification text now starts immediately after the dock tabs on the left with flexible width (`flex: 1`, removing 300px max-width cap), while account badges (`Live/Paper`), timestamp, action buttons, and dock toggle button (`^`/`−`) are docked to the far right edge (`margin-left: auto`).
- **Lightweight Rule-Based Index Guard**: Implemented `isIndexSymbol()` helper in [marginHelper.ts](src/utils/marginHelper.ts) to detect non-tradable indices (`NSE_INDEX`, `BSE_INDEX`, `GLOBAL_INDEX`, `-INDEX` suffixes, and index base names like `NIFTY`, `BANKNIFTY`, `FINNIFTY`, `MIDCPNIFTY`, `SENSEX`).
- **Paper Trading Order Rejection**: Updated [PaperBroker.ts](src/paper/PaperBroker.ts) `placeOrder()` to reject order placement on index symbols with error message: *"Indices are non-tradable! You can try trading in Futures or Options of this Index instead."*
- **Removal of Native Browser Alert Popups**: Purged all blocking browser `alert()` popups across [OrderPanel.ts](src/ui/OrderPanel.ts), [TopBar.ts](src/ui/TopBar.ts), and [PaperBroker.ts](src/paper/PaperBroker.ts). Replaced with non-intrusive, real-time in-app trading status notifications (`trading:status:notify`) and inline status text so trading workflow is never interrupted.

## 2026-07-29

### Paper Trading Itemized Charges Breakdown & UI Enhancements
- **Fyers-Styled Itemized Charges Breakdown Popover**: Authored standalone UI component [ChargesPopover.ts](src/ui/ChargesPopover.ts) rendering detailed itemized tax popups (Brokerage, Exchange/Clearing fee, CTT/STT, GST 18%, SEBI fees, Stamp Duty, and NSE IPFT). Integrated clickable `Price breakup` link in [OrderPanel.ts](src/ui/OrderPanel.ts) and interactive `charges` cell popovers in [AccountManager.ts](src/ui/AccountManager.ts).
- **Product Column in Account Manager Tables**: Added explicit `product` column (`CNC` | `MIS` | `NRML`) to Orders and Trades tables in [AccountManager.ts](src/ui/AccountManager.ts) to instantly differentiate Delivery, Intraday, and F&O carryforward trades.
- **Shoonya Finvasia Brokerage Charge Template**: Added `'shoonya'` template preset (`Flat ₹5 / 0.03% / Delivery ₹0`) to [types.ts](src/paper/types.ts), [marginHelper.ts](src/utils/marginHelper.ts), and [AccountManager.ts](src/ui/AccountManager.ts). Implemented Shoonya's zero brokerage rules for Equity Delivery (`CNC`), capped ₹5 / 0.03% for Intraday (`MIS`) & Futures, flat ₹5 for Options, and exact NSE exchange charges (0.03503% options premium / 0.0030699% equity) with zero clearing member markup.
- **Paper Account Reset Event Alignment**: Added event alias listeners (`paper-account:reset` and `paper-account:reset-funds`) in [PaperBroker.ts](src/paper/PaperBroker.ts) and updated [AccountManager.ts](src/ui/AccountManager.ts). Resetting account funds now explicitly clears orders, trades, positions, holdings, and used margin in `PaperStore`, and emits `paper-account:send-summary` and `order:filled` to trigger immediate UI re-rendering of all dock tabs (Positions, Orders, Holdings, Trades).
- **Strategy Execution Dynamic Symbol Resolution**: Updated [StrategyExecutor.ts](src/scripting/runtime/StrategyExecutor.ts) to resolve active chart symbol (`openchart_last_selection`, e.g. `SBIN-EQ`) dynamically instead of hardcoding `STRATEGY_TEST`.
- **Silent Console Warning for Telegram/WhatsApp Order Alerts**: Updated [PaperBroker.ts](src/paper/PaperBroker.ts) so Telegram and WhatsApp notification failures for paper orders log silently to console (`console.warn`) without emitting UI header status popups, preventing order rejection toasts (such as Insufficient Margin) from being overwritten.
- **Complete KlineCharts v10 Built-In Indicator Catalog**: Expanded [catalog.ts](src/indicators/catalog.ts) to include all 27 built-in KlineCharts v10 indicators (`SMA`, `BBI`, `KDJ`, `BIAS`, `BRAR`, `CR`, `PSY`, `DMA`, `TRIX`, `VR`, `WR`, `MTM`, `EMV`, `AO`, `ROC`, `PVT`, `AVP` alongside `VOL`, `MA`, `EMA`, `BOLL`, `MACD`, `RSI`, `CCI`, `DMI`, `OBV`, `SAR`), providing complete built-in indicator coverage in the Indicators Modal UI.

### OpenAlgo WebSocket & Order Panel Depth Fixes
- **WebSocket Subscription RefCount Leak Fix**: Added `updateDepth()` method to [wsClient.ts](src/openalgo/wsClient.ts) and updated `resubscribeDepth()` in [OrderPanel.ts](src/ui/OrderPanel.ts). Reconfiguring market depth settings via DOM pills (`Auto`, `5D`, `20D`, `50D`) now updates target depth and sends WebSocket frames to OpenAlgo without redundantly incrementing subscription `refCount`.
- **Dynamic Symbol Exchange Resolution for Depth Subscriptions**: Updated `updateSubscriptions()` and `resubscribeDepth()` in [OrderPanel.ts](src/ui/OrderPanel.ts) to resolve canonical symbol exchange metadata (`NSE`, `NFO`, `BSE`, `BFO`, `CDS`, `MCX`, etc.) rather than forcing order form dropdown product selections. Eliminates invalid broker symbol errors (`KOTAKBANK@NFO`) and watchdog re-subscription warnings.
- **Stale Subscription Purging & Watchdog Retry Limit**: Updated [wsClient.ts](src/openalgo/wsClient.ts) to handle broker error acknowledgements by immediately purging invalid subscription keys from memory, capped Watchdog re-subscription retries to 3 attempts for unresponsive symbols, and resolved canonical exchange metadata in [chartInit.ts](src/chart/chartInit.ts). Completely prevents infinite Watchdog re-subscription loops.
- **Multi-Exchange Symbol Exchange Preservation (`MCX`, `BSE`, `BFO`, `CDS`)**: Exported `resolveCanonicalExchange()` helper in [symbols.ts](src/config/symbols.ts) and integrated into [OrderPanel.ts](src/ui/OrderPanel.ts) and [chartInit.ts](src/chart/chartInit.ts). Preserves explicit non-NSE exchanges (`MCX`, `BSE`, `CDS`, `BFO`) so commodity futures (`CRUDEOIL19AUG26FUT`) correctly subscribe on exchange **`MCX`** instead of being forced to `NFO`.

- **Targeted Monaco TypeScript & JavaScript Language Registration & Rollup Sanitization**: Updated [monacoManager.ts](src/scripting/monacoManager.ts) to register targeted TypeScript (`definitions/typescript/register.js`) and JavaScript (`definitions/javascript/register.js`) language modules alongside `editor.api.js`. Added `sanitizeFileName` and `chunkFileNames` to [vite.config.mjs](vite.config.mjs) to strip leading underscores (`^_+`) from generated chunks (`contribution-*.js`), fixing production web server (`trade.ystc.in`) 404 errors while eliminating 68+ unused language chunks (dropping asset count from 107 to 25 files, saving 5.10 MB, total dist size 15.40 MB).

## 2026-07-28

### YSTC Script Editor & Developer SDK (@ystc/sdk)
- **Monaco Editor Integration**: Installed `monaco-editor` (`^0.56.0`) in [package.json](package.json). Built embedded code editor manager ([monacoManager.ts](src/scripting/monacoManager.ts)) with inline TypeScript autocompletion, type diagnostics, parameter hints, and hover tooltips.
- **Monaco Advanced Features & Keyboard Shortcuts**: Registered custom `ystc-light` theme, keyboard shortcuts (`Ctrl+Enter` to Add to Chart, `Ctrl+S` to Save, `Ctrl+Shift+H` for SDK Help), custom `@ystc/sdk` autocomplete snippets (`indicator`, `strategy`, `overlay`, `sma`, `ema`, `rsi`), and runtime error model markers in [monacoManager.ts](src/scripting/monacoManager.ts) and [ScriptEditorPanel.ts](src/ui/ScriptEditorPanel.ts).
- **YSTC Developer SDK**: Authored typed SDK interfaces ([ystc-sdk.d.ts](src/scripting/sdk/ystc-sdk.d.ts), [ystc-sdk-raw.ts](src/scripting/sdk/ystc-sdk-raw.ts), [sdk.ts](src/scripting/sdk/sdk.ts)) supporting 3 core script types (`indicator`, `overlay`, `strategy`) with clean default export syntax (`import { indicator } from "@ystc/sdk"`). Included built-in math functions (`sma`, `ema`, `rsi`, `macd`, `stdDev`, `highest`, `lowest`).
- **Script Runtime Engine**: Built browser transpilation, sandboxing, loading, unloading, and registration pipeline ([ScriptRuntime.ts](src/scripting/runtime/ScriptRuntime.ts), [KlineChartsBridge.ts](src/scripting/runtime/KlineChartsBridge.ts), [StrategyExecutor.ts](src/scripting/runtime/StrategyExecutor.ts)) for dynamic indicators, overlays, and automated strategies.
- **Local Persistence & Export**: Created local script store ([scriptStore.ts](src/scripting/scriptStore.ts)) with `localStorage` sync, starter template generation ([templates.ts](src/scripting/templates.ts)), and local TypeScript `.ts` file export.
- **SDK Documentation & Modals**: Built interactive SDK documentation modal ([SDKHelpModal.ts](src/ui/SDKHelpModal.ts)) synchronized with Monaco keyboard shortcuts (`Ctrl+Enter`, `Ctrl+S`, `Ctrl+Shift+H`) and Tab snippets, along with template selection dialogs and Monaco compiler options dialogs ([ScriptEditorModals.ts](src/ui/ScriptEditorModals.ts)).
- **Monaco Web Workers Standalone Bundling**: Created dedicated Vite worker wrappers ([src/scripting/workers/](src/scripting/workers/)) for all 5 Monaco services (`editor.worker`, `ts.worker`, `json.worker`, `css.worker`, `html.worker`) and configured `MonacoEnvironment` in [monacoManager.ts](src/scripting/monacoManager.ts). Ensures standalone production worker chunk generation without Blob URL resolution errors.
- **On-Demand Lazy Loading & Bundle Optimization**: Converted `monaco-editor` static imports to dynamic imports (`await import('monaco-editor')`) in [monacoManager.ts](src/scripting/monacoManager.ts) and [ScriptEditorPanel.ts](src/ui/ScriptEditorPanel.ts). Monaco Editor and its Web Workers now load lazily only when the `[ Script Editor ]` tab is opened, reducing initial page bundle size by 76% (9.7 MB → 2.2 MB obfuscated).
- **Production Console Logging Preservation**: Updated [obfuscate.mjs](scripts/obfuscate.mjs) (`disableConsoleOutput: false`) to preserve real-time browser console logging for WebSocket ticks, DOM actions, and Option Chain updates on `trade.ystc.in`.

### Bottom Dock Workspace & Layout Integration
- **Docked Bottom Tab Bar**: Integrated [ScriptEditorPanel.ts](src/ui/ScriptEditorPanel.ts) directly into the bottom drawer container alongside [AccountManager.ts](src/ui/AccountManager.ts).
- **Tab Header Navigation**: Added `[ Account Manager ]` | `[ Script Editor ]` tab buttons to the bottom dock header, eliminating floating popups over the chart canvas.
- **Smart 1st-Click Switch & 2nd-Click Toggle Rules**: Updated tab click behavior in [AccountManager.ts](src/ui/AccountManager.ts). Clicking an inactive tab switches tab and opens/expands the dock; clicking an active tab toggles (expands/minimizes) the dock drawer.
- **TopBar Toolbar Streamlining**: Cleaned up [TopBar.ts](src/ui/TopBar.ts) by removing redundant top bar buttons to preserve chart space.

### Custom Indicators, Overlays & Strategy Execution
- **Custom Indicator Legend Sync & Toolbar Controls**: Wired `indicator:custom:registered` event in [ChartManager.ts](src/chart/ChartManager.ts) to trigger `syncIndicatorLegend()`. Custom indicators placed on chart automatically display pane action buttons (Show/Hide 👁️, Settings ⚙️, Delete 🗑️).
- **Custom Indicator Settings Backdrop Fallback**: Implemented fallback catalog resolution in [catalog.ts](src/indicators/catalog.ts) and [IndicatorSettingsModal.ts](src/ui/IndicatorSettingsModal.ts) for custom user indicators (`USER_*`), preventing unrendered modal backdrops from locking screen clicks.
- **Strategy Add-to-Chart & Signal Annotations**: Connected active chart candle data (`KLineData[]`) to [ScriptEditorPanel.ts](src/ui/ScriptEditorPanel.ts) and [StrategyExecutor.ts](src/scripting/runtime/StrategyExecutor.ts). Executing a strategy evaluates trade signals across candles, dispatches orders to Paper or Live OpenAlgo broker, and renders `BUY` / `SELL` annotation badges on chart candles in [ChartManager.ts](src/chart/ChartManager.ts).
- **Anchored VWAP & Gann Box Overlay Tools**: Created custom drawing overlays ([anchoredVwap.ts](src/overlays/anchoredVwap.ts), [gannBox.ts](src/overlays/gannBox.ts)) registered in [index.ts](src/overlays/index.ts). Added `anchored-vwap` SVG symbol to [icons.svg](public/icons.svg) and placed Anchored VWAP right after Volume Cluster and Gann Box right after Date & Price Range in [ToolBar.ts](src/ui/ToolBar.ts).
- **TradingView-Style Anchored VWAP Settings Modal**: Built interactive settings dialog ([AnchoredVwapModal.ts](src/ui/AnchoredVwapModal.ts), [anchoredVwapSettings.ts](src/overlays/anchoredVwapSettings.ts)) with Inputs, Style, and Visibility tabs matching TradingView. Supports Bands Calculation Mode (Standard Deviation / Percentage), Band Multipliers #1, #2, #3, custom source price options (High, Low, Close, Open, hl2, hlc3, ohlc4), per-band line color & fill toggles, and live chart overlay synchronization in [ChartManager.ts](src/chart/ChartManager.ts).
- **Circle Drawing Overlay Tool**: Implemented custom 2-step Circle drawing overlay ([circle.ts](src/overlays/circle.ts)) registered in [index.ts](src/overlays/index.ts) with center point anchor, dynamic pixel radius calculation, stroke border, and background polygon fill (`rgba(41, 98, 255, 0.12)`).
- **Indicator Modal UI Padding Fix**: Increased bottom padding in `.indicator-modal__list` in [style.css](src/style.css) from `8px` to `18px`, preventing bottom search items (e.g. SAR) from flush truncation against card corners.

## 2026-07-24

### Dynamic Market Depth & 50D/20D DOM Engine
- **Hybrid Auto-Detect Market Depth**: Implemented dynamic market depth level selection across [wsClient.ts](src/openalgo/wsClient.ts), [SettingsModal.ts](src/ui/SettingsModal.ts), [OrderPanel.ts](src/ui/OrderPanel.ts), and [style.css](src/style.css). OpenAlgo WebSocket Mode 3 subscriptions now support requested depth targets (`5`, `20`, `50`, or `auto`).
- **DOM Panel Depth Header Pills**: Added `[Auto]`, `[5D]`, `[20D]`, and `[50D]` interactive depth selector buttons on top of the DOM ladder panel. Clicking a pill updates user preference, re-subscribes WebSocket mode 3 depth with OpenAlgo, and scales the price ladder dynamically.
- **50-Level Depth & FYERS v3 TBT Support**: Fully aligned with FYERS API v3 TBT WebSocket (`Tbtws`) 50-level depth feed and Zerodha 20-level feed. If the active broker supports 20 or 50 depth, the DOM ladder populates all 20 or 50 bid & ask levels in real-time. If the broker supports 5 depth, the engine gracefully auto-detects and displays the maximum 5 levels without blank space gaps.
- **Dynamic Simulated / Offline Depth Scaling**: Updated mock depth generator in [OrderPanel.ts](src/ui/OrderPanel.ts) (`buildDomView` and `renderDomGrid`). When paper trading or testing offline, mock bid and ask quantities scale dynamically to fill the selected 20D or 50D level ladder instead of capping at 5 items.
- **Dhan / TradingView DOM Layout Alignment**: Added `dom-sub-header` (`Bid size` | `Price` | `Ask size`) in [OrderPanel.ts](src/ui/OrderPanel.ts) and [style.css](src/style.css), and updated `formatQtyLabel()` for 1:1 compact quantity formatting (`1.02 K`, `3.45 K`, `2.72 K`, `450.05 K`, `255.46 K`), matching Dhan and TradingView DOM layouts.
- **DOM Ladder Scroll Position Preservation & Auto-Centering Fix**: Fixed `.dom-ladder-container` query selector mismatch in [OrderPanel.ts](src/ui/OrderPanel.ts). Saved `domScrollTop` position is now preserved across incoming WebSocket ticks so live ticks no longer interrupt or reset user scrolling. Auto-centering now positions the active LTP row in the exact center of the DOM viewport on load and on `⟳` (Center DOM) button clicks.
- **Fixed DOM Panel Shell & Inner Ladder Scroll Isolation**: Configured `.oa-panel-body:has(.trade-panel__dom)` and `.trade-panel__dom` in [style.css](src/style.css) to `height: 100%; overflow: hidden;`. Side panel headers, depth pills, sub-headers, totals bar, and 3x3 control buttons are now 100% stationary and permanently visible. Only the middle price ladder table (`.dom-ladder-container`) scrolls vertically inside its fixed flex viewport, matching Dhan and TradingView 1:1.
- **Fixed Trade Form Inline 5-Level DOM Preview Isolation**: Updated `renderDomGrid()` in [OrderPanel.ts](src/ui/OrderPanel.ts) to strictly enforce 5-level row depth (`depthSize = 5`) for the inline preview grid under the `Trade` tab. Selected 20D or 50D depth settings now apply exclusively to the full `DOM` tab, preventing the `Trade` order entry form from being stretched by extended price level rows.
- **Compact Side Panel Header Height**: Reduced `.trade-panel__header` height in [style.css](src/style.css) from `50px` to `26px` (50% reduction) and scaled title text and header action icons (`22px`) to optimize vertical space for chart and panel views.

## 2026-07-23

### Live Candle Real-Time Volume Calculation
- **OpenAlgo Chart Reference Algorithm Alignment**: Updated `calculateLiveCandleVolume()` in [chartInit.ts](src/chart/chartInit.ts) to match the reference implementation from `referance_use_only/openalgo-chart` (`ChartComponent.tsx:L2394-2434`). On initial connection or mid-candle reload, `cumulativeVolumeBaseline` estimates $\text{Math.max}(0, \text{tickVolume} - \text{existingCandle.volume})$. On candle bucket transition, `perCandleVolume` calculates from cumulative day volume and updates baseline $\text{cumulativeVolumeBaseline} = \text{tickVolume}$.
- **OpenAlgo REST Timestamp ISO Formatting**: Added `parseOpenAlgoTimestampMs()` in [onlineLoader.ts](src/chart/onlineLoader.ts) to replace spaces with `T` separators in string timestamps (`"2026-07-23 09:15:00+05:30"` -> `"2026-07-23T09:15:00+05:30"`), ensuring history bars parse valid timestamps.
- **Unlatched Live Candle Volume Update**: Removed the `Math.max(prevVol, computedVolume)` volume latch in [chartInit.ts](src/chart/chartInit.ts) which permanently locked candle volume to inflated cumulative values if an early tick arrived with un-subtracted day volume.
- **Volume Indicator Cache Flush**: Added cache clearing (`sourceCache.clear()`) in [volumeYSTC.ts](src/indicators/volumeYSTC.ts) and [chartInit.ts](src/chart/chartInit.ts) on `symbol:change` and `mode:change` events to prevent stale history cache from persisting in memory across live sessions.

### Stream Logging & Console Cleanup
- **WebSocket Active Symbols Log Deduplication**: Deduplicated active position/holding symbol logging in [wsClient.ts](src/openalgo/wsClient.ts). `active-symbols:update` events now log to console only when the set of active symbols actually changes, eliminating continuous per-tick log spam during real-time P&L updates.
- **Telegram & WhatsApp Notification Payload Alignment**: Updated `sendPaperAlert()` in [PaperBroker.ts](src/paper/PaperBroker.ts) and [ChartManager.ts](src/chart/ChartManager.ts) to include `self: true` in both Telegram and WhatsApp notification payloads per OpenAlgo Utilities API standard (`docs/OpenAlgo/04 OpenAlgo Utilities API.md`). Paper trade alerts now successfully reach the paired Telegram bot and WhatsApp bot device without requiring external user mapping.

### Rich Paper Trade & TP/SL Notification Formatter
- **MachineAlgo Standard Notification Templates**: Updated `sendPaperAlert()` in [PaperBroker.ts](src/paper/PaperBroker.ts) to match the 1:1 exact MachineAlgo / OpenAlgo live alert format for all order events (`Order Placed`, `Order Executed`, `Order Cancelled`, `Order Modified`, `Order Rejected`). Includes `Strategy` (`YSTC_Charts`, `YSTC_Charts_TP`, `YSTC_Charts_SL`), `🔬 PAPER MODE - Simulated Order` header, clean order IDs, action (`BUY`/`SELL`), quantity, price type (`MARKET`, `LIMIT`, `SL`, `SL-M`), fill prices, and local `HH:MM:SS` timestamps.
- **Paper Account Funds & Summary Dispatcher**: Added `sendPaperSummaryAlert()` in [PaperBroker.ts](src/paper/PaperBroker.ts) and a `📱` button in [AccountManager.ts](src/ui/AccountManager.ts). Formats and dispatches real-time simulated Paper Funds (Available Cash, Initial Capital, Realized & Unrealized P&L, Used Margin, Open Positions Count) directly to Telegram and WhatsApp.
- **TP/SL Bracket Dragging & Line Reversion Fix**: Fixed TP/SL overlay line shifting in [PaperBroker.ts](src/paper/PaperBroker.ts), [ChartManager.ts](src/chart/ChartManager.ts), [activeOrder.ts](src/overlays/activeOrder.ts), and [activePosition.ts](src/overlays/activePosition.ts). Added `isDragging` interaction flags to overlay templates (`onPressedMoving`, `onPressedMoveEnd`) and updated `syncTradingOverlays()` in `ChartManager.ts` to skip `overrideOverlay()` while an overlay line is actively being dragged. Aligned live broker bracket submission in `ChartManager.ts` so modifying single TP/SL brackets in Live Mode leaves the opposite bracket untouched. Streaming WebSocket live ticks now update chart P&L silently without interrupting or resetting active TP/SL line dragging in both Paper and Live engines.
- **Live Trading Automatic Overlay Refresh**: Added `fetchLiveStateForOverlays()` in [ChartManager.ts](src/chart/ChartManager.ts) and updated `onOrderUpdatedBridge` in [AccountManager.ts](src/ui/AccountManager.ts). Entering/exiting trades and submitting/modifying TP/SL brackets in Live Mode now automatically fetches live `/orderbook` and `/positions` from OpenAlgo and renders position and bracket lines instantly on the chart canvas without requiring a manual Account Manager refresh (`↻`).
- **Position Chart Line Real-Time P&L Sync**: Fixed position P&L calculation in [activePosition.ts](src/overlays/activePosition.ts) and [ChartManager.ts](src/chart/ChartManager.ts). Chart position line overlays now prioritize the active chart candle close / tick price (`chartLtp`) over static initial fill prices (`pos.currentLtp`), dynamically computing `(currentLtp - avgPrice) * qty`. Position line P&L badges now match real-time position P&L 1:1 in both Paper Trading and Live Trading across all asset classes (Stocks, Futures, Forex, Crypto).

### Live Intraday Candle Timestamp Session Alignment
- **Live Candle Timestamp Alignment**: Fixed live WebSocket tick-to-bar timestamp calculation in [chartInit.ts](src/chart/chartInit.ts). Replaced generic `00:00 UTC` epoch flooring (`Math.floor(rawMs / durationMs) * durationMs`) with session-start aware alignment (`getBarTimestamp`). Live ticks on 30m, 15m, 45m, and hourly timeframes now align perfectly to market session open (`09:15 AM IST`) and update the active candle instead of erroneously creating premature bars (e.g. 09:30 AM).

### Off-Market Watchdog & Auto-Heal Loop Prevention
- **Watchdog Market Hours Check**: Updated `wsClient.ts` watchdog to bypass tick-frequency staleness checks whenever market status is NOT `open` (`status !== 'open'`). This prevents constant 15-second re-subscription cycles during `pre-market` and `closed` states.
- **Intra-Session Auto-Heal Guard**: Restricted chart data auto-heal in `chartInit.ts` to trigger exclusively during `open` market hours and for intra-session gaps (<12 hours). Overnight and pre-market gaps no longer clear local cache or trigger redundant REST history refetches.

### Paper Trading Alerts Default Alignment
- **Alert Default State**: Updated `paper_alerts_enabled` and `paper_alerts_telegram` in [PaperBroker.ts](src/paper/PaperBroker.ts), [ChartManager.ts](src/chart/ChartManager.ts), and [SettingsModal.ts](src/ui/SettingsModal.ts) to evaluate `!== 'false'`. Paper Trading Alerts and Telegram dispatch are now **enabled by default** (`ON`), while WhatsApp alerts remain disabled by default (`OFF`) unless explicitly turned on by the user in Settings.

## 2026-07-20

### Margin Calculation Fixes
- **Index Spot Margin Bypass**: Added a check in [src/ui/OrderPanel.ts](/src/ui/OrderPanel.ts) to skip querying the OpenAlgo live API for margin requirements when the active symbol is a spot index indicator (whose exchange matches `*INDEX`), preventing `400 Bad Request` network warnings in the browser console.

### Fyers Prime Brokerage Charges Preset
- **Brokerage Presets**: Added the **Fyers Prime** template option, supporting discounted flat/capped brokerage of **₹15** (options flat ₹15, futures/intraday/delivery capped at ₹15) while keeping statutory taxes identical.
- **Fyers Standard Renaming**: Renamed the default "Fyers" user-facing dropdown label to "Fyers Standard".

### UI Visual Consistency & Design Token Alignment
- **Modal Backdrops**: Standardized backdrop overlay opacity to `rgba(19, 23, 34, 0.08)` across all dialogs, correcting the lighter 4% opacity in Go-To Date Modal and the darker 20% slate overlay in Option Chain Modal.
- **Option Chain Modal Layout**: Standardized card border, border radius, header height, and box shadow using semantic CSS variables (`var(--panel-border-strong)`, `var(--panel-radius-lg)`, `var(--panel-header-h)`, and `var(--panel-shadow)`), replacing hardcoded visual values.
- **CSS Variable Compliance**: Cleaned up hardcoded hex values in [style.css](/src/style.css) for settings input backgrounds (`#f4f5f7`), mode slider (`#d8dce6`), trade panel tabs (`#e9edf6`), buy/sell quote backgrounds, and top bar buy/sell hover colors. Hover transitions now dynamically adjust using `filter: brightness(0.9)`.
- **DOM Trading Buttons**: Standardized DOM grid buy, sell, reverse, and flatten buttons to use theme variables (`var(--accent-blue)`, `var(--bear-color)`, `var(--accent-orange)`) and dynamically scaled hover brightness instead of hardcoded hex colors.
- **Settings Info Helper Bubbles**: Standardized info bubbles (`.settings-field__info`) to exactly match `.vp-settings-field__info` dimensions (`16px`), background (`var(--bg-tertiary)`), color (`var(--text-secondary)`), font-weight, and added standard cursor-help pointers.
- **Search Input Alignment**: Unified the Symbol Search input text size to `13px` to match the Indicator Modal search bar.

## 2026-07-16

### Paper Trading Alignment with Live Intraday (MIS), Longterm (CNC), and Overnight (NRML)
- **Product Type Compatibility Checks**: Restricted product selections in paper trading to match live broker rules. `CNC` is strictly for `EQUITY` symbols; `NRML` is strictly for derivatives (`FUTURE` / `OPTION`); and `MIS` is allowed for all. Incompatible options are rejected at the broker stage with descriptive messages.
- **CNC Holdings Selling Logic**: Enhanced paper trading `updatePosition` to prevent short positions when selling CNC. CNC sell orders now first reduce/close today's active long CNC position (intraday long), and then reduce any remaining quantity from the user's `holdings` (realizing P&L and recording journal/balance history entries).
- **Dynamic Order Panel Product Dropdown**: Updated [OrderPanel.ts](src/ui/OrderPanel.ts) to dynamically render product dropdown options based on the symbol type: showing only `Intraday (MIS)` and `Longterm (CNC)` for equities, and `Intraday (MIS)` and `Overnight (NRML)` for derivatives. It also auto-adjusts selected values when switching between symbol types.
- **Dynamic Margin Preview**: Integrated the local margin calculation helper into the Order Panel's pre-trade margin preview for paper trading, ensuring the displayed margin reflects the exact leverage settings for MIS, CNC, and NRML before submission.
- **Synchronous Reject Notification Fix**: Swapped event emission ordering in [OrderPanel.ts](src/ui/OrderPanel.ts) to resolve a race condition where the generic "Paper order submitted" notification immediately overwrote the synchronous "Order Rejected: Insufficient Margin" error message returned by the broker.
- **Live API Order Type Alignment**: Standardized live position exit payloads in [AccountManager.ts](src/ui/AccountManager.ts) to send `quantity`, `price`, `trigger_price`, and `disclosed_quantity` as strings (e.g. `String(reqQty)`, `'0'`) to comply with strict OpenAlgo API schema validations and avoid potential `400 Bad Request` rejections.
- **Bracket Order Cancel ID Fallback Fix**: Updated the order ID mapping in the bracket order cancel routine inside [ChartManager.ts](src/chart/ChartManager.ts) to resolve order ID using `order.orderid ?? order.order_id ?? order.id`. This prevents `undefined` values that occurred because of broker-specific field naming variations, resolving the `400 Bad Request` errors returned by OpenAlgo's strict schema validator.
- **Broker Name Badge Display**: Configured the execution engine badges in [AccountManager.ts](src/ui/AccountManager.ts) and [OrderPanel.ts](src/ui/OrderPanel.ts) to display the specific connected broker name (e.g., ZERODHA, UPSTOX, FYERS) instead of the generic "Live" or "LIVE" text when connected. The broker name is persisted to localStorage on connection pings and WebSocket auth successes and refreshed dynamically in the UI.
- **Online Status Badge Rendering Fix**: Fixed a state-desync bug where the connection status badge in [AccountManager.ts](src/ui/AccountManager.ts) was initialized to hardcoded `'Offline'` upon every `render()` call. It now dynamically checks and matches the connection state returned by `wsClient.isAuth()` to prevent temporary UI status drops during manual/auto updates.
- **Account Manager UI Render Throttling**: Implemented a `250ms` throttle window for the sub-table rendering inside [AccountManager.ts](src/ui/AccountManager.ts) during real-time tick updates (live and paper). Throttling prevents DOM table reconstructions 10-20 times per second, resolving high CPU loads, visual stutters, and user interaction freezes while preserving instant rendering (`immediate = true`) for manual actions like sub-tab clicks, query searching, settings adjustments, and order actions.
- **Paper Trading Account Reset Crash Fix**: Resolved a `TypeError: Cannot read properties of undefined (reading 'template')` crash inside [PaperBroker.ts](src/paper/PaperBroker.ts) when submitting paper orders after a funds reset. The crash occurred because `resetAccount` re-assigned a clean state object without copying or restoring the active `chargeSettings` configuration. Updated `resetAccount()` to capture and preserve `chargeSettings` across resets, and moved the `carryCncPositionsToHoldings()` execution in the constructor to run after defaults are established to prevent initialization-order overrides.

## 2026-07-15

### WebSocket Protocol Alignment with Updated OpenAlgo Docs
- **Fix Depth Subscribe Field**: Renamed `depth_level` → `depth` in the Mode 3 (Depth) subscription payload inside [wsClient.ts](src/openalgo/wsClient.ts) to match the updated OpenAlgo WebSocket API specification. The previous field name could silently fail on newer server versions that validate field names.
- **Real-Time Order Updates Stream**: Implemented `subscribe_orders` / `order_update` / `unsubscribe_orders` WebSocket order update handling in [wsClient.ts](src/openalgo/wsClient.ts). After successful authentication, the client automatically subscribes to account-level order status push updates (fills, partial fills, rejections, cancellations). Incoming `order_update` messages are deduplicated on `orderid + order_status + filled_quantity` (with a 5-second TTL) to handle duplicate postback/WebSocket deliveries, then emitted as `ws:order-update` events on the eventBus.
- **AccountManager Fast-Path Refresh**: Added a `ws:order-update` listener in [AccountManager.ts](src/ui/AccountManager.ts) that triggers the existing debounced REST refresh (`onOrderUpdatedBridge`) immediately when a live order status change is pushed, instead of waiting for the 30-second polling cycle. The polling safety net is preserved.
- **ChartManager Overlay Sync**: Added a `ws:order-update` listener in [ChartManager.ts](src/chart/ChartManager.ts) that refreshes chart trading overlays (active orders, positions, execution marks) immediately when a live order update is received.
- **Robust WebSocket Market Data Parsing**: Upgraded `market_data` message extraction in [wsClient.ts](src/openalgo/wsClient.ts) to check both top-level and nested `data` properties for `symbol` and `exchange`, resolving potential type crashes when `data.symbol` is omitted in broker-specific formats.
- **WebSocket URL Comparison Normalization**: Normalized trailing slashes in WebSocket connection URL checks to prevent redundant reconnect loops when configuration inputs vary by a trailing slash.

### Upgrade to Stable KlineCharts v10.0.0
- **Package Update**: Upgraded `klinecharts` dependency to `^10.0.0` in [package.json](file:///d:/Devs/codetest-og/klinecharts-v10.0.0-beta3/package.json).
- **v10.0.0 API Adaptations**: Updated [ChartManager.ts](file:///d:/Devs/codetest-og/klinecharts-v10.0.0-beta3/src/chart/ChartManager.ts) to comply with the stable v10.0.0 signature for `createIndicator`, where the `pane` options parameter was simplified back to the boolean `isStack`, requiring the pane ID to be passed directly on the indicator configuration object (`paneId: 'candle_pane'`) or configured post-creation via `setPaneOptions`.

### Optimize OpenAlgo WebSocket Reconnections
- **Backoff Reset Safeguard**: Moved the WebSocket connection backoff reset (`reconnectDelay = 1000`) in [wsClient.ts](file:///d:/Devs/codetest-og/klinecharts-v10.0.0-beta3/src/openalgo/wsClient.ts) from `handleOpen` to the successful authentication event block. This prevents rapid, close-proximity reconnect loops (flooding the OpenAlgo server) if the connection opens successfully but immediately fails authentication due to an incorrect or missing API key.

### Implement Precise Fyers Brokerage & Transaction Charges
- **Precise Transaction Mappings**: Updated the charge calculation engine in [marginHelper.ts](src/utils/marginHelper.ts) to calculate precise Fyers and Custom preset transaction charges. This includes matching Fyers' combined Exchange Transaction Charges and Clearing Member (CM) fees (e.g. 0.0445299% for NSE options, 0.0918% for MCX options), tiny NSE IPFT charges, MCX options CTT of 0.05% on premium, and correct per-side rounding to the nearest whole rupee for STT and Stamp Duty.

### Fix Real-time Account Manager Updates & CORS Margin Errors
- **String Price in Margin API**: Updated the pre-trade margin lookup payload inside [OrderPanel.ts](src/ui/OrderPanel.ts) to format option/equity prices as strings (e.g. `String(price)`). This resolves the `POST /api/v1/margin 400 (Bad Request)` errors returned by OpenAlgo's strict schema validator.
- **Fyers Market Order LimitPrice Validation**: Corrected the price payload parameter to be exactly `'0'` for market orders during pre-trade margin calculations (matching live order placement behavior). This resolves the Fyers API validation error `Fyers API Error (Code -50): limitPrice does not match: 0` that occurred because the platform mistakenly passed the non-zero market LTP. It also prevents network call flooding on every tick since the cache key for market orders now remains constant.
- **Optimized UI Tick Update Frequency**: Removed high-frequency `localStorage` reads (`this.loadPaperState()`) from `positions:update`, `holdings:update`, and `orders:update` handlers inside [AccountManager.ts](src/ui/AccountManager.ts). Real-time websocket ticks now update the in-memory state directly without being choked or overwritten by disk reads, enabling smooth live Unrealized P&L and LTP updates.

### Fix Paper Position Exit Margin Check
- **Zero Margin for Exits**: Updated the paper trading broker's order validation in [PaperBroker.ts](src/paper/PaperBroker.ts) to bypass or offset the required margin calculation for exit or risk-reducing orders (selling existing long positions/holdings, or buying back short positions). This resolves the issue where closing a position mistakenly calculated option-writing or new position margin and blocked the user with an "Insufficient Margin" error.

### Fix Chart Freeze on Position Exit
- **Preserve Reconnection Subscriptions**: Added a `clearSubs` parameter to `disconnect()` in [wsClient.ts](src/openalgo/wsClient.ts) and set it to `false` during target URL/API key changes in `connect()`. This prevents the client subscriptions map from being wiped out during initial startup or socket parameters re-evaluation, ensuring the chart's Mode 2 subscription remains in the tracker.
- **Active Chart Symbol Fallback**: Added a fallback in `wsClient.ts` to retrieve the active chart symbol from `localStorage` (`openchart_last_selection`) if the in-memory `activeChartSymbol` is not yet populated by events. This guarantees that `unsubscribe` calls from the Account Manager when closing positions never reduce the active chart's subscription reference count below `1`.
- **Misleading Offline Badge**: Corrected the connection state badge logic in [AccountManager.ts](src/ui/AccountManager.ts) to check the general `openchart_mode` instead of the active position subscriptions count, preventing the pill from visually displaying "Offline" when the user has no active trades.
- **Removed Watchdog Console Spam**: Cleaned up the diagnostic console logs in [wsClient.ts](src/openalgo/wsClient.ts) so that the watchdog checks are silent during normal operation, only outputting connection/status changes, warnings, and errors.

### OpenAlgo Endpoints & Alerts Integration
- **Connection Validation via REST Ping**: Added connectivity verification before toggling Online mode inside `TopBar.ts`, and a visual "Test Connection" diagnostics check in the `SettingsModal.ts` OpenAlgo tab.
- **Precise Dynamic Margins**: Integrated dynamic margins in `OrderPanel.ts` for F&O derivative contracts using the `POST /api/v1/margin` endpoint.
- **Symbol Metadata Constraints**: Added support for fetching lot size, tick size, and freeze limits via `POST /api/v1/symbol` to dynamically configure price snapping steps and enforce validation constraints inside `OrderPanel.ts`.
- **AccountManager Batch Quotes**: Integrated batch quote fetching via `POST /api/v1/multiquotes` upon initial position/holding load in `AccountManager.ts` to populate true P&L before live socket ticks are received.
- **Telegram & WhatsApp Paper Trading Alerts**: Integrated optional paper trade alerts triggered on simulated fills inside `PaperBroker.ts` using the OpenAlgo `POST /api/v1/telegram/notify` and `POST /api/v1/whatsapp/notify` endpoints.
- **Horizontal Line Price Alerts**: Integrated price crossing alerts on horizontal line overlays in `ChartManager.ts`. Active alerts draw a 🔔 icon adjacent to lines, play an audio warning tone, show a status toast, and dispatch Telegram/WhatsApp notifications.

## 2026-07-13

### Fix Paper Trading Realized P&L Withdrawal Distortion
- **Initial Balance Adjustments**: Fixed a bug where withdrawing funds from a paper trading account incorrectly decreased the account's Realized P&L by the withdrawn amount. In [PaperBroker.ts](src/paper/PaperBroker.ts), updated `withdrawAccount` to subtract the withdrawn amount from `initialBalance` alongside the balance reduction, matching the deposit logic. This ensures Realized P&L (calculated as `balance - initialBalance`) continues to measure only trading performance.

### Fix Realized P&L and Balance Refresh Latency on Paper Exits & Fills
- **Event Dispatch Ordering**: Resolved a race condition where the Account Manager reloaded the paper state before the Paper Broker wrote changes to `localStorage` (due to `order:filled`/`order:cancelled` events being emitted before `this.saveState()`). Moved all event dispatches to execute *after* `this.saveState()` in [PaperBroker.ts](src/paper/PaperBroker.ts).
- **Automatic State Reloading**: Configured event listeners for `positions:update`, `orders:update`, and `holdings:update` in [AccountManager.ts](src/ui/AccountManager.ts) to explicitly trigger `this.loadPaperState()` in paper mode. This ensures the summary header (Realized P&L, Available Cash, Used Margin) always updates instantly and synchronously on all background fills (limit/stop/bracket orders) without requiring manual refresh or tab switching.

### Add Margin, Leverage, and Order Constraint Rules to Paper Trading
- **Dynamic Margin Checking**: Created a unified helper [marginHelper.ts](src/utils/marginHelper.ts) to calculate required margins across equities (CNC: 100%, MIS: 20%), futures (MIS: 20%, NFO NRML: 10%), option buyers (100% premium), and option writers (strike * quantity * leverage factor plus premium). Placed orders that exceed available balance are now flagged as `REJECTED` in [PaperBroker.ts](src/paper/PaperBroker.ts).
- **Short Selling Restrictions**: Enforced a rule in [PaperBroker.ts](src/paper/PaperBroker.ts) blocking new equity short sales under CNC/NRML (delivery) modes unless the stock is owned by the user.
- **Intraday Auto-Squareoff (MIS)**: Added a market-close auto-liquidation routine inside `simulateNextDay()` in [PaperBroker.ts](src/paper/PaperBroker.ts). When the overnight transition is triggered, all open MIS positions are automatically squared off at current LTP, logged to the trades history ledger, and all open MIS orders are cancelled.
- **Dynamic UI Sync**: Integrated margin calculation helper into [AccountManager.ts](src/ui/AccountManager.ts) to ensure the funds bar (available cash, used margin) aligns exactly with the broker's internally computed balances.

### Add Fyers-Style Brokerage Charges & Custom Overrides to Paper Trading
- **Transaction Charges Engine**: Implemented a comprehensive `calculateTradeCharges()` function in [marginHelper.ts](src/utils/marginHelper.ts) that computes Brokerage, STT/CTT, Exchange Transaction Charges, SEBI Fee (₹10/crore), Stamp Duty (buy-side only), and GST (18%) for all Indian market segments (Equity CNC/MIS, F&O Futures/Options, Commodity, Currency).
- **Broker Presets**: Added three built-in pricing templates — **Fyers** (0.3%/₹20 CNC, 0.03%/₹20 MIS/FUT, flat ₹20 Options), **Zerodha** (₹0 CNC, 0.03%/₹20 MIS/FUT, flat ₹20 Options), and **Zero Brokerage** (only statutory taxes, no brokerage).
- **Full Custom Overrides**: Added a "Custom Override Rates" option with separate editable fields for Equity CNC (% + cap), Equity MIS/FUT (% + cap), Options (flat ₹), and Commodity/Currency (% + cap) in the Account Manager settings popover.
- **Charge Settings Types**: Extended [types.ts](src/paper/types.ts) with `ChargeSettings`, `CustomCharges` interfaces and added `charges?: number` to `PaperOrder` and `JournalEntry`.
- **Auto-Deduction on Fills**: Updated [PaperBroker.ts](src/paper/PaperBroker.ts) to compute and deduct charges on every market order fill, limit/stop trigger, and MIS auto-squareoff. Each charge deduction is logged as a separate balance history row.
- **Settings UI**: Added a "Paper Brokerage Charges" section in the Account Manager settings popover in [AccountManager.ts](src/ui/AccountManager.ts) with an ON/OFF toggle, preset dropdown, and expandable custom fields. Settings persist via `localStorage` and sync to the broker engine via eventBus.
- **Trades Column**: Fixed the Trades tab to display actual computed charges per trade instead of hardcoded zero.

## 2026-07-11

### Fix Crypto WebSocket Connections & Streaming
- **Market Hours Integration**: Added explicit 24/7 continuous trading support for the `CRYPTO` exchange inside [marketHours.ts](src/utils/marketHours.ts). This bypasses weekends and holidays, ensuring that the WebSocket watchdog client stays active and the chart displays the correct "Market open 24/7" status in the legend.
- **Casing Normalization**: Updated [wsClient.ts](src/openalgo/wsClient.ts) to convert symbol and exchange subscription keys to uppercase to prevent matching mismatches from casing differences in incoming broker payloads.
- **Mode 1 (LTP) Fallback Support**: 
  - Subscribed to Mode 1 (LTP) alongside Mode 2 (Quote) and Mode 3 (Depth) **exclusively for the `CRYPTO` exchange** in both [chartInit.ts](src/chart/chartInit.ts) and [OrderPanel.ts](src/ui/OrderPanel.ts).
  - Programmed [wsClient.ts](src/openalgo/wsClient.ts) to map and emit Mode 1 (LTP) ticks as `tick:update` events if the exchange is `CRYPTO`. This ensures the chart draws candles and updates the Order Panel LTP field in real-time, even if the crypto broker's WebSocket feed only streams LTP updates.
  - Preserved full isolation for NSE/BSE markets to guarantee zero impact on standard Indian trading indices and equities.
- **Case-Insensitive Event Matching**: Updated [chartInit.ts](src/chart/chartInit.ts) and [OrderPanel.ts](src/ui/OrderPanel.ts) tick event handlers to compare symbol and exchange strings case-insensitively using `.toUpperCase()`.
- **Order Book Fallback LTP**: Implemented automatic fallback LTP calculation inside [wsClient.ts](src/openalgo/wsClient.ts) for Mode 3 (Depth Mode) events. If `data.ltp` is missing or `0` (which occurs initially when the Python adapter's ticker cache isn't populated), the client extracts and averages the best bid and best ask directly from the depth book levels, streaming a valid non-zero LTP.
- **Order Panel Defensive Filtering**: Updated [OrderPanel.ts](src/ui/OrderPanel.ts) real-time tick listeners to explicitly ignore any incoming tick where LTP is `0` or less, preventing valid states from being overwritten.
- **Case-Insensitive Unsubscribe Safeguard**: Updated the WebSocket client's `unsubscribe` handler inside [wsClient.ts](src/openalgo/wsClient.ts) to execute case-insensitive matching for active chart and position symbols, preventing accidental stream drops.
- **Watchdog Loop & Re-subscription Fixes**:
  - Configured the WebSocket's `subscribe` handler in [wsClient.ts](src/openalgo/wsClient.ts) to reset the `lastMessageAt` timestamp to the current time when incrementing an existing subscription's `refCount`. This prevents the watchdog from evaluating newly updated subscriptions as stale and triggering infinite re-subscription cycles.
  - Programmed the client to update `lastMessageAt` for **all three modes** (LTP, Quote, Depth) of a symbol whenever any real-time feed message is received for it. This prevents sparse data feeds from starving the watchdog and triggering broker disconnections.
- **Diagnostics**: Added raw WebSocket payload logging (`wsClient: Received WS message:`) to [wsClient.ts](src/openalgo/wsClient.ts) during debugging, which has now been removed for optimal performance.

### DOM Ladder Auto-Refresh & Price Realignment
- **DOM Ladder Grid Alignment**:
  - Rounded the DOM's `basePrice` to the nearest `tickSize` multiple in [OrderPanel.ts](src/ui/OrderPanel.ts) to align scrollable price levels precisely with the order book's round price tick levels.
  - Snapped individual order book bid and ask prices to the nearest `tickSize` multiple when executing cell quantity searches, preventing exact-match misses caused by fractional ticks and successfully displaying the order book depth in DOM columns.
- **DOM Ladder Auto-Refresh & Focus Preservation**:
  - Wired the scrollable DOM ladder to automatically trigger `render()` inside real-time `tick:ltp`, `tick:update`, and `tick:depth` event handlers if the active tab is `DOM`. This ensures prices, bid/ask quantities, and highlighted LTP lines auto-refresh in real-time.
  - Added focus-preservation checks in the `render` lifecycle to prevent user typing interruptions or focus loss inside the DOM's Quantity input field.
  - Cleaned up unused private fields `domGridEl` and `domLtpEl` to comply with TS strict lint rules.

### Persist Chart Drawing Layouts in Browser Storage
- **Automatic Drawings Persistence**: Implemented an automatic drawing layout persistence engine in [ChartManager.ts](src/chart/ChartManager.ts) using browser `localStorage` keyed per symbol and exchange (`openchart_drawings_<EXCHANGE>:<SYMBOL>`).
- **Drawing Tool Whitelisting**: Whitelisted the 16 user drawing tools for persistence (Trendline, Horizontal Line/Ray, Vertical Line, Fibonacci Line, Rectangle, Arrow, Brush, Circle, Text, Date/Price Range, TPO, Volume Profiles, Volume Cluster) while strictly excluding broker-managed system overlays (active orders, positions, projections, and execution marks).
- **Workspace Event Integration**: Programmed drawings to load automatically on chart mount and symbol change events, and auto-save on drawing completions, moves, deletions, and Undo/Redo history events.

### Improve Symbol Search Usability
- **Search Input Auto-Focus**: Added an `afterRender()` lifecycle override inside [SymbolSearchModal.ts](src/ui/SymbolSearchModal.ts) that automatically focuses the search input field as soon as the modal is opened. This eliminates the requirement to manually click inside the input box, allowing the user to start typing to filter symbols immediately.
- **Typing Focus Maintenance**: Configured the auto-focus logic to place the selection range at the end of the current text value, ensuring typing focus and cursor position are perfectly preserved across real-time list re-renders.

### Mode-Switch Symbol Selection Isolation
- **Mode Selection Persistence**: Added `openchart_last_online_selection` and `openchart_last_offline_selection` states inside [ChartManager.ts](src/chart/ChartManager.ts) to isolate active symbols between online and offline modes.
- **Smart Restorations**: Switching from offline to online mode automatically restores the user's last viewed live broker symbol (e.g. `BTCUSDFUT` or `NIFTY`). Switching to offline mode restores their last viewed local symbol (e.g. `SBIN-EQ`).
- **Empty Local State Safety Guard**: Added a safety check in the offline mode transition. If no CSV folders have been imported, it resets the chart canvas to blank, displays the helper status banner prompting to import a CSV folder, and automatically triggers the Symbol Search modal.

### Custom Paper Trading Account Balance
- **Custom Balance Select Option**: Added a "Custom Amount..." option inside the Paper Trading Reset dropdown select menu in [AccountManager.ts](src/ui/AccountManager.ts).
- **Dynamic Custom Balance Input**: Implemented a numeric input field styled in accordance with vanilla CSS that automatically displays when "Custom Amount..." is selected in the settings popover, allowing the user to enter any positive customized funds amount.
- **Account Balance Reset**: Integrated input validation and confirmation checks to fully wipe trade records and reset the Account Manager summary fields (Available Margin, Unrealized P&L, etc.) to the user's customized amount.

### Add & Withdraw Paper Trading Funds
- **Add / Withdraw Control Panel**: Integrated an "Add / Withdraw Funds" section inside the settings popover in [AccountManager.ts](src/ui/AccountManager.ts).
- **Funds Adjuster Actions**: Added click listeners for Add and Withdraw buttons that parse positive input amounts and emit `paper-account:deposit` / `paper-account:withdraw` events.
- **Cash-Trade Transaction Recording**: Implemented `depositAccount` and `withdrawAccount` handlers in [PaperBroker.ts](src/paper/PaperBroker.ts) that update the paper trading account cash balance, update its ledger history (`balanceHistory`), and record a simulated transaction as a cash trade (on the `CASH` exchange with `BUY` for deposits and `SELL` for withdrawals). This lists deposits and withdrawals directly under the **Trades** tab for a completely realistic paper-trading ledger experience.

## 2026-07-10

### Persist Active Chart Symbol and Timeframe Selection
- Added automatic browser `localStorage` persistence for the active chart symbol selection (symbol, exchange, and timeframe/fileCode).
- Registered a global `symbol:change` event listener inside [main.ts](src/main.ts) that automatically saves active selection changes to `openchart_last_selection`.
- Updated `getDefaultSymbolSelection` inside [symbols.ts](src/config/symbols.ts) to retrieve and initialize the chart workspace with this saved selection on startup, ensuring the exact same chart state is restored upon page reload or reopening.

### Restrict Timeframe Selection to Broker Supported Intervals
- Restructured the top bar timeframe selection in [TopBar.ts](src/ui/TopBar.ts) to display only timeframe intervals supported by the connected broker.
- Added `fetchSupportedIntervals` to [TopBar.ts](src/ui/TopBar.ts) to query the OpenAlgo `/intervals` endpoint when the app boots, switches to online mode, or when the WebSocket connection is authenticated (`ws:authenticated`).
- Mapped OpenAlgo interval formats (seconds, minutes, hours, days, weeks, months) to the project's internal `FileCode` structure, with built-in auto-sorting and a fallback mechanism to prevent invalid active timeframes.

### Fix WebSocket Disconnection on Active Chart Symbol & Active Positions
- Fixed real-time WebSocket data streaming freezing for the chart and other panels when a paper position exits or is closed, and ensured active positions/holdings are never unsubscribed from Mode 2 (Quote) so the Account Manager can continuously calculate unrealized P&L and metrics (LTP, P&L, P&L %).
- Emitted the `active-symbols:update` event from [AccountManager.ts](src/ui/AccountManager.ts) containing all active positions and holdings symbols (both paper and live).
- Added `activePositionSymbols` tracking and constructor listener in [wsClient.ts](src/openalgo/wsClient.ts) for `active-symbols:update`.
- Modified the `unsubscribe` method in [wsClient.ts](src/openalgo/wsClient.ts) to prevent the subscription refCount for the active chart symbol (Mode 2 & 3) and active position/holding symbols (Mode 2) from dropping below 1. This ensures they are never unsubscribed from the WebSocket server while active, preserving tick streams for chart, order, and account components.

### Fix Execution Mark Hover Crash & Correct Paper Exit Times
- Fixed an uncaught `TypeError: Cannot read properties of undefined (reading 'clientX')` in `Custom.onMouseEnter` inside [executionMark.ts](src/overlays/executionMark.ts) that crashed chart rendering when hovering over trade execution marks. Corrected lookup to access `clientX`/`clientY` directly from the event parameter object.
- Fixed paper trading exit trades incorrectly displaying the entry/placement timestamp in the trade log table instead of the actual fill/exit execution time. Updated `checkFills()` inside [PaperBroker.ts](src/paper/PaperBroker.ts) to set `o.timestamp = Date.now()` when pending limit/stop orders are transitioned to `FILLED` status. This aligns the execution exit marks with their correct candles.

### Fix Live Stream Updates & Watchdog Warning Starvation
- Fixed WebSocket watchdog timing out with `No ticks received for ... Mode 2` warnings when the Trading Panel is opened. Root cause: subscribing to Mode 3 (Depth Mode) suppresses Mode 2 (Quote Mode) messages from the broker, starving the watchdog and chart listeners of Quote updates.
- Updated [wsClient.ts](src/openalgo/wsClient.ts) to automatically update the `lastMessageAt` timestamp of both Mode 1 (LTP) and Mode 2 (Quote) subscriptions whenever a Mode 3 message is received.
- Enhanced `handleMessage` in [wsClient.ts](src/openalgo/wsClient.ts) to forward price updates from Mode 3 messages, emitting `tick:ltp` and `tick:update` events to keep the chart candles streaming and the Order Panel LTP field displaying live numeric values instead of `--`.
- Removed debug console logs in [wsClient.ts](src/openalgo/wsClient.ts) to keep the terminal and browser console clean.

## 2026-07-02

### Interactive Brackets Click Button Wiring Fix
- Fixed Confirm, Discard, Reverse (⇅), Close (✕), TP Cancel, and SL Cancel buttons in [activePosition.ts](src/overlays/activePosition.ts) not responding to clicks. Root cause: all buttons used `ignoreEvent: false` which allowed KlineCharts' `onPressedMoveStart` to fire on mousedown, starting an overlay drag operation that consumed the subsequent click event.
- Changed click-only button figures from `ignoreEvent: false` to `ignoreEvent: ['onPressedMoveStart', 'onPressedMoving', 'onPressedMoveEnd']`. This blocks drag initiation while still allowing `onClick`, `onMouseMove`, `onMouseEnter`, and `onMouseLeave` events to fire normally.
- Drag handles (`tp_drag_btn`, `sl_drag_btn`, `tp_line_drag_handle`, `sl_line_drag_handle`) retain `ignoreEvent: false` since they need full drag event support.
- **Fixed global hit-test interception bug**: Corrected attributes for `tp_line_drag_handle` and `sl_line_drag_handle` from `cx`/`cy` to `x`/`y`. KlineCharts canvas figure type `circle` expects `x`/`y`. Providing `cx`/`cy` caused the distance formula in `checkCoordinateOnCircle` to compute with `undefined` values yielding `NaN`, which made every click on the entire chart coordinate system register as a hit on the drag handles, capturing all clicks and preventing them from reaching `confirm_btn` or `discard_btn`.
- **Fixed bracket order overwrite issue**: When dragging or editing a single bracket (e.g. SL), the other unmodified bracket (e.g. TP) would get cancelled and lost. Corrected this by extracting `activeTPPrice` and `activeSLPrice` from current open orders in [ChartManager.ts](src/chart/ChartManager.ts), and pre-populating the unmodified projected level with the active confirmed order price in [activePosition.ts](src/overlays/activePosition.ts) during edit initialization or dragging. Both bracket levels are now correctly sent and preserved/placed on confirmation.
- **Fixed duplicate paper orders bug**: When submitting brackets on paper trading, the cancel-first step only matched parentIds starting with `pos_bracket_`, leaving brackets created during initial entry (using parent order ID format) active. Widened check in [PaperBroker.ts](src/paper/PaperBroker.ts) to match and cancel any open order containing a non-empty `parentId`, eliminating order duplication.
- **Fixed duplicate live orders bug**: In [ChartManager.ts](src/chart/ChartManager.ts), the live bracket submission handler failed to cancel existing open live orders before placing the new ones. Root cause: the code checked `Array.isArray(orderBookRes.data)` and filtered it directly, but OpenAlgo returns the order list in `orderBookRes.data.orders`. Corrected parsing to target the `.orders` array and support lowercase status strings (e.g. `"open"`).
- **Fixed order projection click buttons**: Applied the same drag-blocking `ignoreEvent` array (`['onPressedMoveStart', 'onPressedMoving', 'onPressedMoveEnd']`) to click-only buttons (`submit_btn`, `cancel_btn`, `tp_close_btn`, `sl_close_btn`) inside [orderProjection.ts](src/overlays/orderProjection.ts) to keep button clicks resilient against minor pointer drag movements.
- **Fixed chart reload bracket overlay bug**: When the chart reloaded on paper trading, active positions and open bracket orders (TP and SL) were not displayed on the chart if another tab (like Positions) was active. Root cause: the paper state events (`orders:update`) are lazy-loaded and not emitted on load, leaving `ChartManager`'s internal data empty. Fixed by loading the initial state directly from `localStorage` on chart initialization in [ChartManager.ts](src/chart/ChartManager.ts), drawing all active positions and bracket orders immediately on load.
- **Fixed orphaned bracket orders bug**: When a Stop Loss or Take Profit bracket order got filled on live/paper trading, the opposite bracket order remained open (orphaned). Added `checkAndCleanupOrphanedBrackets()` in [ChartManager.ts](src/chart/ChartManager.ts) listening to position update events. If the position quantity becomes 0 for the symbol, it automatically cancels any remaining open bracket orders (matching `parentId` for paper trading, or strategies `YSTC Charts_TP`/`YSTC Charts_SL` for live trading), preventing order duplication and unintended entries.
- **Fixed cancelorder strategy name mismatch**: When cancelling live orders or cleaning up orphaned brackets, the application submitted `strategy: 'YSTC Charts'` to OpenAlgo's `/cancelorder` API. However, bracket orders are placed with specific strategy names (`YSTC Charts_TP`, `YSTC Charts_SL`). This mismatch caused OpenAlgo/brokers to reject the cancellation request, leaving old bracket orders active and resulting in duplicates. Fixed by dynamically setting the strategy parameter to match the order's strategy or type during cancel calls in [ChartManager.ts](src/chart/ChartManager.ts). Also removed redundant `symbol`/`exchange` fields from cancel payloads (unsupported by `/cancelorder` schema) and implemented a fallback cancel call using `'YSTC Charts'` to guarantee cancellation regardless of where the order was originally placed.
- **Fixed paper trading execution marks bug**: On paper trading mode, execution marks did not render on the chart because the `trades:update` event emitted from the Account Manager contained date-formatted string timestamps (ambiguous between US/Indian locale standard date parsing, causing they to resolve to February 2026 and render off-chart). Resolved this by updating [ChartManager.ts](src/chart/ChartManager.ts) to always retrieve raw number-based millisecond timestamps directly from the `openchart_paper_state` trades in `localStorage` during overlay synchronization. Also updated `saveState()` in [PaperBroker.ts](src/paper/PaperBroker.ts) to automatically emit `trades:update` and trigger immediate overlay synchronization.
- **Fixed execution mark candle alignment**: Resolved a bug where execution marks would not render because trade execution timestamps (exact milliseconds of fills) did not exactly match the start timestamp of chart candles. Added a timestamp snapping helper `getChartCandleTimestamp()` inside [ChartManager.ts](src/chart/ChartManager.ts) that rounds the trade execution timestamp down to the start timestamp of its corresponding candle, allowing the charting library to correctly map and draw the execution mark overlays.
- **Fixed execution mark hover tooltip bug**: Hovering over execution marks in paper mode failed to show the tooltip. Root cause: the hover hit-tester in `handleCrosshairChange()` checked raw millisecond timestamps against the candle coordinates. Fixed by adding the same `getChartCandleTimestamp()` snapped alignment to the hover coordinates converter in [ChartManager.ts](src/chart/ChartManager.ts) so that the hover logic maps exactly to the candle coordinates.
- **Fixed execution mark reload/refresh latency**: Execution marks sometimes snapped to the start of the day or stayed misplaced on reload/refresh until another trade occurred or the Account Manager was refreshed. Root cause: when the chart asynchronously loaded or refreshed history (emitting the `chart:data` event), the overlays were never re-synchronized to match the newly loaded candles. Fixed by calling `syncTradingOverlays()` inside the `chart:data` event handler in [ChartManager.ts](src/chart/ChartManager.ts), forcing positions, orders, and execution marks to snap to their correct candles instantly as soon as history data is applied.
- **Optimized bracket updates (Unchanged Bracket Preservation)**: When submitting bracket updates, the system used to always cancel and re-place both TP and SL legs regardless of whether their prices changed. Implemented a price check comparison against currently open orders in [ChartManager.ts](src/chart/ChartManager.ts) (for live trading) and [PaperBroker.ts](src/paper/PaperBroker.ts) (for paper trading). If the price of a bracket leg (TP or SL) has not changed, the existing open order is kept untouched (no cancellation, no new placement), completely avoiding redundant order cycles and preventing active orders from being closed and replaced unnecessarily.

## 2026-07-01

### Interactive Brackets UI Styling & Hit-Test Fix
- Root-caused the solid blue backgrounds on button labels and bracket pill texts in [activePosition.ts](src/overlays/activePosition.ts) to missing `backgroundColor: 'transparent'` on text figures. KlineCharts' default overlay text style (`backgroundColor: Color.BLUE`) was bleeding through the style merge for all 11 text figures that lacked this explicit override.
- Added `backgroundColor: 'transparent'`, `borderColor: 'transparent'`, and `borderSize: 0` to all text figures in `activePosition.ts` — Discard, Confirm, ⇅ Reverse, TP, SL button labels, and TP/SL bracket pill qty/PnL/✕ texts.
- Fixed invisible hit-test rects (`reverse_btn`, `tp_drag_btn`, `sl_drag_btn`, `confirm_btn`, `discard_btn`, `tp_cancel_btn`, `sl_cancel_btn`) from `style: 'stroke'` with `rgba(0,0,0,0)` to `style: 'stroke_fill'` with `rgba(0,0,0,0.01)` for reliable canvas pointer hit-testing.
- Added overlay-level `text`, `circle` style overrides with transparent `backgroundColor`/`borderColor` in [ChartManager.ts](src/chart/ChartManager.ts) as a safety net fallback for both `activePosition` and `activeOrder` overlays.

### Position Reverse Without Confirmation
- Removed the `confirm()` dialog from the `position:manage:reverse` event handler in [ChartManager.ts](src/chart/ChartManager.ts). Clicking the Reverse button now immediately exits the current position and places an opposite market order of the same quantity without prompting.

### Trading Execution Marks on Chart
- Implemented a new custom overlay `executionMark` in [executionMark.ts](src/overlays/executionMark.ts) (registered in [index.ts](src/overlays/index.ts)) to visualize buy/sell entries and exits on the chart.
- Designed high-visibility execution marks placed outside the candle wicks (Royal Blue vertical **UP** arrow below the low wick for BUYs; Pink/Magenta vertical **DOWN** arrow above the high wick for SELLs).
- Implemented on-the-fly chronological trade sorting and running position size reconstruction in [ChartManager.ts](src/chart/ChartManager.ts) to classify orders as either opening/increasing a position (First Order / Entry) or closing/reducing a position (Exit Order).
- Draws horizontal triangles at the execution price level: pointing **RIGHT** `▶` for First Orders (Entry) and pointing **LEFT** `◀` for Exit Orders.
- Wired dynamic crosshair-based hover detection within `handleCrosshairChange` in `ChartManager.ts`. When the crosshair moves within 20px of any execution mark's screen-coordinate, the tooltip is rendered and snapped exactly to the execution mark, ensuring 100% reliable hover activation.
- Implemented a single-line DOM execution tooltip styled to match the `.volume-cluster-tooltip` layout and dynamically colored borders, formatting trade info as requested (e.g. `65 QTY 1234.85 01 Jul 11:40:31 am`).
- Added `trades:update` and `live-trades:update` event handlers to automatically sync and display the execution marks when trade history is updated.
- Integrated the "Execution marks" and "Execution labels" toggles into the Settings modal's Trading tab in [SettingsModal.ts](src/ui/SettingsModal.ts) and configured them to automatically persist in localStorage and sync dynamically.

### Responsive Option Chain Table Layout & Auto Strike Centering
- Added a `min-width: 960px;` property to `.oa-optionchain-table` in [style.css](src/style.css) to prevent column overlapping and squishing on small mobile viewports, enabling smooth left-and-right horizontal scrolling.
- Programmed horizontal scroll auto-centering logic `centerScrollOnStrike` in [OptionChainModal.ts](src/ui/OptionChainModal.ts) using `requestAnimationFrame`. Whenever the Option Chain modal is opened or a new underlying symbol/expiry date is loaded, the horizontal scroll position of the wrapper container is automatically centered. This aligns the Strike column in the middle of the screen on mobile, saving users from manual horizontal scrolling.

### OpenAlgo WebSocket Connection & Recovery Optimizations
- Implemented tracking of the connected API key (`connectedApiKey`) in [wsClient.ts](src/openalgo/wsClient.ts) and configured the client to automatically drop and reconnect when either the WebSocket URL or the API key changes.
- Configured [SettingsModal.ts](src/ui/SettingsModal.ts) to track initial WebSocket parameters and automatically trigger a WebSocket reconnect on close if credentials or endpoints were changed.
- Updated error handling in `wsClient.ts` to call `this.socket.close()` upon errors to force-trigger the standard reconnect cycle rather than hanging silently.
- Configured the fallback JSON `ping` message processor in `wsClient.ts` to respond with `{"type": "pong", "action": "pong"}` to satisfy all variants of the OpenAlgo WebSocket server check, preventing disconnects.

### Interactive Brackets Drag-to-Add & Position Reverse
- Implemented a premium position management workflow directly on the chart’s active position line inside [activePosition.ts](src/overlays/activePosition.ts).
- Added a `Reverse (⇅)` button that prompts confirmation and triggers a market order of twice the current quantity in the opposite direction to flip the position.
- Added green `TP` and orange `SL` dashed buttons that allow dragging out Take Profit and Stop Loss levels with connector lines, handles, and real-time P&L estimates.
- Created `Confirm` and `Discard` buttons on the active position line to submit or cancel the projected brackets.
- Linked bracket submissions to the broker: submits LIMIT (TP) and STOP (SL) orders under a single `parentId` for paper trading (auto OCO), and cancels existing open orders before placing Limit (TP) and Stop Loss Market (SL-M) orders for live trading.

### Interactive Control Handle Highlight Readability & Hit-Test Fix
- Resolved an issue where interactive handles (`reverse_btn`, `tp_drag_btn`, `sl_drag_btn`, `confirm_btn`, `discard_btn` in [activePosition.ts](src/overlays/activePosition.ts) and `tp_close_btn`, `sl_close_btn` in [orderProjection.ts](src/overlays/orderProjection.ts)) were overridden with solid blue backgrounds by KlineCharts' native pointer highlights.
- Overrode default overlay `rect` and `point` styles to `transparent` inside [ChartManager.ts](src/chart/ChartManager.ts) for `orderProjection`, `activeOrder`, and `activePosition` overlays, preventing selected/active highlighting from painting them blue.
- Switched the color of transparent target interactive rects from `'transparent'` to `'rgba(0, 0, 0, 0.01)'`. This ensures the canvas renderer does not optimize them out, making them fully hit-testable and clickable under all states.
- Fixed a bug in [OrderPanel.ts](src/ui/OrderPanel.ts) where the `'order:projection:change'` event handler failed to call `this.updateOrderProjection()` after updating input fields. This ensures that clicking the `✕` close button on the TP/SL order projection tag pills directly on the chart immediately updates/clears the Order Panel draft states and removes the dashed projection lines from the chart.

### Position Overlays Contiguous Buttons Layout (TradingView Style)
- Redesigned active position buttons (`Reverse`, `TP`, `SL`, `Confirm`, `Discard`) in [activePosition.ts](src/overlays/activePosition.ts) to render as contiguous segments of the unified main position pill, matching the clean contiguous treatment of `LONG 100` and `Avg/P&L` segments.
- Aligned segments side-by-side using a 1px boundary overlap (`curX += width - 1`) to share borders and eliminate double-thick lines and gaps.
- Configured custom corner rounding for individual segments: leftmost segment gets rounded left corners (`[4, 0, 0, 4]`), middle segments get straight corners (`[0, 0, 0, 0]`), and the rightmost segment gets rounded right corners (`[0, 4, 4, 0]`).
- Removed the `key` property from visual backgrounds and labels so that KlineCharts' selection engine does not paint over their white, green, red, or blue custom borders and text.
- Added transparent event-capturing overlay rects with `key` and `ignoreEvent: false` styled with `color: 'transparent'`, `borderColor: 'transparent'`, `borderSize: 0` (omitting `style: 'stroke_fill'`). This prevents the engine from drawing highlight backgrounds, keeping them completely invisible while capturing clicks and drag actions flawlessly.

### Paper Trading Available Balance & Holding Capital Calculations Fix
- Fixed an issue where open holdings or active positions did not deduct from the **AVAILABLE** balance in paper trading.
- Implemented a dynamic used-margin calculation method (`recalculateUsedMargin`) in [PaperBroker.ts](src/paper/PaperBroker.ts) that aggregates blocked capital for positions/holdings depending on their product type (CNC blocks 100%, MIS blocks 20%, NRML blocks 10%).
- Centralized state persistence in `PaperBroker.ts` under a new `saveState` helper to ensure the calculated used margin is always kept in sync and saved to `localStorage`.
- Updated [AccountManager.ts](src/ui/AccountManager.ts) to dynamically calculate used margin and deduct it from the account's cash balance when rendering paper trading funds, updating both **AVAILABLE** and **USED** fields correctly.

## 2026-06-30

### Chart Data Gap Auto-Healing & Offline Warning Banner
- Implemented automatic background data catch-up when the WebSocket reconnects, triggered by the `ws:authenticated` event.
- Added a dynamic tick-gap detector that calculates the time difference between incoming live ticks and the chart's last completed candle. If a gap greater than `1.5 * timeframe_duration` is identified (e.g. 90 seconds on a 1-minute chart), it automatically pulls missing candles in the background.
- Configured a thread-safe reload lock (`isReloading` flag) to prevent concurrent overlapping history requests to OpenAlgo on rapid tick updates, preserving server rate limits.
- Added a custom offline notice bar (`offlineBar-VQqbCElH`) matching TradingView styling, injected above the Top Bar. It appears when connection is lost (or the socket drops) in Online Mode and vanishes immediately upon reconnection.
- Modified the historical data cache utility (`clearOnlineCache`) in `src/chart/onlineLoader.ts` to support optional selective parameter clearing.
- Added manual **Refresh** action buttons in both the desktop Top Bar control header and the mobile dropdown options menu.
- Deactivated WebSocket watchdog checks and re-subscription tasks during off-market hours (`status === 'closed'`) in `src/openalgo/wsClient.ts`, avoiding continuous API disconnect/reconnect loops to the broker server.
- Implemented conditional visibility rules for the price axis countdown to bar close: disabled on closed markets for intraday timeframes, but active 24/7 on Daily (D), Weekly (W), and Monthly (M) timeframes.
- Optimized the chart reflow loop in `src/chart/ChartManager.ts` by skipping periodic `chart.resize()` redraw ticks when the countdown is hidden, lowering CPU footprint.
- Restored mobile access to the Watchlist and Alerts panel overlay by adding dedicated toggle triggers within the Top Bar's mobile options menu (ellipsis `...`), routing them to open the full-screen layout drawer since the right dock is hidden on small screens.
- Elevated z-index values of dialog modals (Indicator, Goto, Settings, Volume Profile, and Symbol Search) in `src/style.css` (ranging from `2100` to `2140`) to ensure they open in front of the fixed mobile watchlist container (`z-index: 2000`), allowing seamless symbol search additions.

### Production JavaScript Obfuscation Pipeline
- Integrated a decoupled post-build JavaScript Obfuscation step for production builds using the programmatic API of the official `javascript-obfuscator` library.
- Created [scripts/obfuscate.mjs](scripts/obfuscate.mjs) to parse compiled assets in `dist/assets/` post-bundling.
- Added configurable domain locking using the environment variable `OBFUSCATION_DOMAIN_LOCK` (falling back to standard local/GitHub Pages domains if undefined).
- Implemented double-obfuscation prevention by prepending an official production banner comment and optimized the detection using `startsWith(BANNER)` matching to skip file corruption on repeat builds.
- Created [scripts/clean_assets.mjs](scripts/clean_assets.mjs) to safely clear stale assets inside `dist/assets/` before every build, preserving custom data in `dist/data/` untouched.
- Excluded small runtime files (size < 5 KB) and Web Worker scripts (using regex `/\.worker(?:-[a-zA-Z0-9_-]+)?\.js$/`) to minimize performance and runtime overhead.
- Disabled source map generation (`sourcemap: false`) in [vite.config.mjs](vite.config.mjs) to prevent exposing the original source code.
- Configured script execution inside the `build` and `build:static` tasks in [package.json](package.json).
- Added targeted build exception rules to halt deployment with exit code 1 if the main chunk fails to obfuscate, but output warnings for other minor files.

### Frictionless Order Execution (Confirmation Removal)
- Removed all browser-blocking browser-native `alert(...)` and `window.confirm(...)` popups during order placement, modification, reversing, flattening, and cancellation in both paper and live execution modes.
- Implemented a new non-blocking status notification label (`this.headerStatusEl`) in the Account Manager dock header (`oa-account-dock-header`) in [AccountManager.ts](src/ui/AccountManager.ts) listening to `'trading:status:notify'` events.
- Routed all order success confirmations and warnings/errors to the Account Manager header status line (color-coded green for success, red/orange for errors) and to the local Order Panel status bar, ensuring high-speed trading is never interrupted by blocking browser alerts.

### Collapsible Watchlist Groups & Pure Data Details Panel
- Implemented collapsible group headers (`INDICES`, `STOCKS`, `FUTURES`, `FOREX`) in [OrderPanel.ts](src/ui/OrderPanel.ts) allowing users to expand or collapse sections dynamically.
- Added expand/collapse carets with smooth `-90deg` rotation transitions defined in [style.css](src/style.css), caching collapse preferences in `localStorage` under `ystc-charts_watchlist_collapsed_groups`.
- Pre-populated the default watchlist with the exact list of index, equity, futures, and currency pairs matching the reference: `SPX`, `NDQ`, `DJI`, `VIX`, `DXY` (Indices); `AAPL`, `TSLA`, `NFLX` (Stocks); `USOIL`, `GOLD`, `SILVER` (Futures); and `EURUSD`, `GBPUSD`, `USDJPY` (Forex).
- Added group-level deletion controls (hover-visible trashcan SVG buttons next to group headers) that bulk-remove all child symbols and clean up active WebSocket subscriptions instantly.
- Replaced the text character close buttons (`✕`) in individual row columns with premium TV-style trashcan SVG icons.
- Redesigned the bottom details card to display only live, data-backed fields populated from OpenAlgo quotes (Logo initials, Ticker, Exchange name, manifest description, LTP, currency, Real-time badge, and colored change/change% metrics), stripping all mock statistics, profile tables, and news sections.
- Maintained micro-DOM patching inside `updateWatchlistDom(...)` to update both table rows and the details panel on live ticks without layout reflows.
- **Watchlist Column Spacing Alignment**: Added grid child overrides (`nth-child`) in [style.css](src/style.css) to align headers and numeric fields (`Last`, `Chg`, `Chg%`) to the right, aligning columns cleanly.
- **Dynamic Option Symbol Formatting**: Added `parseSymbolDisplayName` and `parseOptionDescription` to parse raw option contracts (e.g. `BANKNIFTY28JUL2632500CE` into `BANKNIFTY 28Jul 32500 CE`) dynamically, preventing text truncation in columns and displaying clean, human-readable labels.
- **Dynamic Market Hours Indicators & Status Dots**: Replaced the static online mode logic with the target exchange's timing rules from [marketHours.ts](src/utils/marketHours.ts). Standardized the watchlist row and card indicator dots to show dynamic status: green for Open, grey for Closed, orange for Pre-market, and blue for Post-market based on real-time IST clock timings.
- **Option Charting and LTP Integration**: Verified and ensured option symbol selection works seamlessly, loading option charts dynamically and subscribing to real-time LTP ticks when clicked from the watchlist.
- **Watchlist WebSocket Subscription Symbol Correction**: Corrected the symbol parameter inside `addSymbolToWatchlist()` to pass the raw broker symbol code (`toLiveSymbol(symbol)`) to `wsClient.subscribe()` instead of the human-readable formatted label string. This resolves token converter mapping warning anomalies and feed subscription delays.
- **Separated Online/Offline Watchlists & OpenAlgo Symbol Alignment**: Separated watchlist localStorage keys (`ystc-charts_watchlist_items_online` and `ystc-charts_watchlist_items_offline`) and symbol sets for Online vs Offline modes. In Online mode, the defaults are populated with valid OpenAlgo standard symbol formats (e.g. `BANKNIFTY`, `SBIN`, `BANKNIFTY26MAR26FUT`), eliminating chart chunk history fetch errors and token conversion errors. Mode transitions dynamically unsubscribe, reload, and re-subscribe symbols.

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
