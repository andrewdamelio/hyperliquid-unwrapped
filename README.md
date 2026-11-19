# Hyper Unwrapped

**Your Hyperliquid trading, unwrapped.** Paste any Hyperliquid address and get shareable PnL cards.

**Live:** https://andrewdamelio.github.io/hyper-unwrapped/

## Cards

- **All-time PnL** with return on deposits and a PnL chart
- **Trader archetype** (Liquidation Speedrunner, Memecoin Mercenary, Fee Donor, Sniper…)
- **Best trade** and **worst trade**
- **Money printers** and **cursed assets**: top and bottom coins by PnL
- **Biggest miss**: what you'd have made holding 30 days past your exit
- **Current bags**: open positions and unrealized PnL
- **The receipts**: volume, fees, builder fees, funding, liquidations, favorite hour

The look scales with performance: rockets and gold for a generational run, confetti when you're up, rain when you're down bad, skulls when you're fully rekt.

## How it works

A single static page. It calls Hyperliquid's public Info API straight from the browser (`userFillsByTime`, `userFunding`, `portfolio`, `clearinghouseState`, `candleSnapshot`), rebuilds each position from your fills, and draws the cards on a canvas so they save and share as PNGs. Nothing is stored or sent anywhere else.

Hyperliquid serves an account's most recent 10,000 fills, so very active accounts are recapped from those.

Not financial advice. Independent fan tool, not affiliated with Hyperliquid.
