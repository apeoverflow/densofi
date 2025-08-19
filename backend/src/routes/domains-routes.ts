import express from 'express';
import { DomainsController } from '../controllers/domains-controller.js';

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
router.get('/domains/:name/:walletAddress/verify', DomainsController.verifyDomainOwnership);

// Get all domain tokens (for tokens page)
router.get('/tokens', DomainsController.getAllTokens);

// Get specific domain token by name
router.get('/tokens/:name', DomainsController.getTokenByName);

export { router as domainsRoutes };