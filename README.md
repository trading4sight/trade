# YSTC Charts (Trading Chart Platform for Retail Traders)

# Changelog

## 2026-11-05

### Documentation & Roadmap: AI Architecture Renewal & EmbeddingGemma 2 RAG (ROADMAP.md)

- **AI Architecture Roadmap Renewal (`ROADMAP.md`)**: Updated the roadmap to formalize all shipped on-device capabilities (Phase 3 Core: WebGPU inference, local directory streaming, autonomous tools, 1-click Add to Chart, stop button, hardware telemetry, context mode snapshot guard, Web Speech voice interaction, and thinking accordion) and removed stale prospective backlog items.
- **Next-Gen AI & Local RAG Architecture Specification (`ROADMAP.md`)**: Added Phase 3.5 outlining zero-hallucination `@ystc/sdk` RAG via `litert-community/embeddinggemma-2-740m-litert-lm` (~0.5 GB `.litertlm` on `@litert-lm/core`'s native `EmbeddingEngine`), conceptual semantic search for the Indicator & Overlay catalog, TradingView Pine Script v5 transpilation, air-gapped standalone speech models (Kokoro TTS / Qwen3-ASR), and visual technical pattern matching. Updated the recommended model tiers table with EmbeddingGemma 2 740M.
