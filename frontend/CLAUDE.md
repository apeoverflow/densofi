# Densofi Project Overview

## Project Purpose
Densofi is a platform for unlocking price discovery and liquidity for domain names through fractional tokenization.

## Key Features
- Convert domain names into ERC20 tokens for fractional ownership
- Create liquidity pools for domain tokens
- NFT to ERC20 support
- Subdomain registration for utility
- Launchpad mechanics for token launches

## Frontend Structure

### Pages
- **Landing Page** (`/app/client-page.tsx`): 
  - Project introduction with dino mascot
  - "Get Started" and "View Launched Tokens" CTAs
  - "How It Works" section explaining key features
  - Featured Tokens section showcasing existing tokens

- **Tokens Page** (`/app/tokens/page.tsx`):
  - Grid display of all available domain tokens
  - Clickable token cards linking to individual token pages

- **Token Detail Page** (`/app/tokens/[id]/page.tsx`):
  - Dynamic routing based on token ID
  - Detailed view of a specific tokenized domain

### Components
- `GlassCard`: Glassmorphic UI component used throughout the application
- `WalletConnectButton`: Integration with Web3 wallet connection
- `StorageInterface`: Contract interaction component from previous version

### Visual Design
- Consistent dark theme with gradient backgrounds
- Glassmorphic UI elements with subtle animations
- Animated Dino mascot as a brand element
- Decorative background gradients and blur effects

## Tech Stack
- Next.js for frontend framework
- React for UI components
- Tailwind CSS for styling
- Wagmi/RainbowKit for wallet connections
- Sepolia testnet for contract interactions

## Future Improvements
- Implement actual token creation functionality
- Add token trading features
- Implement subdomain registration
- Create governance features for token holders
- Add analytics dashboards for tokens

## Commands
- Development: `npm run dev`