import express from 'express';
import { DomainsController } from '../controllers/domains-controller.js';
import { requireWalletAuth } from '../middleware/wallet-auth.js';

const router = express.Router();

// Get all domains
router.get('/domains', DomainsController.getAllDomains);

// Get domain by name
router.get('/domains/:name', DomainsController.getDomainByName);

// Check if domain is registered
router.get('/domains/:name/status', DomainsController.getDomainStatus);

// Get NFTs owned by an address
router.get('/nfts/:address', DomainsController.getNFTsByAddress);

// Verify domain ownership via DNS
router.get('/domains/:name/:walletAddress/verify', requireWalletAuth, DomainsController.verifyDomainOwnership);

export { router as domainsRoutes };