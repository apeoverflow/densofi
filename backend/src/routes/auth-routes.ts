import express from 'express';
import { AuthController } from '../controllers/auth-controller.js';

const router = express.Router();

// Check authentication status
router.get('/auth/status', AuthController.checkAuthStatus);

// Request message to sign for wallet authentication
router.post('/auth/request-message', AuthController.requestMessage);

// Verify wallet signature and authenticate user
router.post('/auth/verify-signature', AuthController.verifySignature);

// Get wallet authentication information
router.get('/auth/wallet/:address', AuthController.getWalletInfo);

export { router as authRoutes };