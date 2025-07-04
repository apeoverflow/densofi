#!/usr/bin/env node

/**
 * Wallet Authentication Test Suite
 *
 * This script tests the complete wallet authentication flow including:
 * - Message generation
 * - Signature verification (mocked)
 * - Wallet info retrieval
 * - Admin endpoints
 * - Protected route access
 */

// Load environment variables from .env file
import { config } from "dotenv";
config();

const BASE_URL = process.env.API_BASE_URL || "http://localhost:3000";
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || "your-admin-api-key";

// Mock wallet data for testing
const TEST_WALLETS = [{
        address: "0x742d35Cc6634C0532925a3b8C11d1C8b9F2b9c5A",
        privateKey: "mock-private-key-1",
    },
    {
        address: "0x1234567890123456789012345678901234567890",
        privateKey: "mock-private-key-2",
    },
];

// Helper function to make HTTP requests
async function makeRequest(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;

    const defaultOptions = {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    };

    const requestOptions = {...defaultOptions, ...options };

    // Add body for non-GET requests
    if (requestOptions.body && typeof requestOptions.body === "object") {
        requestOptions.body = JSON.stringify(requestOptions.body);
    }

    console.log(`\n🔗 ${requestOptions.method} ${url}`);
    if (requestOptions.headers.Authorization) {
        console.log(
            `   🔑 Auth: ${requestOptions.headers.Authorization.substring(0, 20)}...`
        );
    }
    if (requestOptions.headers["X-Wallet-Address"]) {
        console.log(`   👛 Wallet: ${requestOptions.headers["X-Wallet-Address"]}`);
    }

    try {
        const response = await fetch(url, requestOptions);
        const data = await response.json();

        console.log(`   ✅ Status: ${response.status}`);
        console.log(`   📊 Response:`, JSON.stringify(data, null, 2));

        return { response, data };
    } catch (error) {
        console.error(`   ❌ Error:`, error.message);
        return { error };
    }
}

// Mock signature generation (in real usage, this would be done by wallet)
function generateMockSignature(message, walletAddress) {
    // This is a mock signature - in reality this would be generated by the wallet
    const mockSignature = `0x${"a".repeat(130)}`; // 130 char hex string
    return mockSignature;
}

// Test functions
async function testHealthCheck() {
    console.log("\n🏥 === HEALTH CHECK ===");
    await makeRequest("/health");
}

async function testGenerateAuthMessage() {
    console.log("\n📝 === GENERATE AUTH MESSAGE ===");
    const { data } = await makeRequest("/api/auth/request-message", {
        method: "POST",
    });

    if (data && data.success) {
        return data.data;
    }

    throw new Error("Failed to generate auth message");
}

async function testVerifySignature(authData, walletAddress) {
    console.log("\n✅ === VERIFY SIGNATURE ===");

    // Generate mock signature
    const signature = generateMockSignature(authData.message, walletAddress);

    const { data } = await makeRequest("/api/auth/verify-signature", {
        method: "POST",
        body: {
            nonce: authData.nonce,
            signature,
            walletAddress,
        },
    });

    return data;
}

async function testWalletInfo(walletAddress) {
    console.log("\n👛 === GET WALLET INFO ===");
    await makeRequest(`/api/auth/wallet/${walletAddress}`);
}

async function testAuthStats() {
    console.log("\n📊 === GET AUTH STATS ===");
    await makeRequest("/api/auth/stats");
}

async function testProtectedRoute(walletAddress) {
    console.log("\n🔒 === TEST PROTECTED ROUTE (should fail without auth) ===");
    await makeRequest(`/api/domains/example.com/${walletAddress}/verify`);

    console.log("\n🔓 === TEST PROTECTED ROUTE (with wallet auth) ===");
    await makeRequest(`/api/domains/example.com/${walletAddress}/verify`, {
        headers: {
            "X-Wallet-Address": walletAddress,
        },
    });
}

async function testAdminEndpoints() {
    console.log("\n👑 === ADMIN ENDPOINTS ===");

    const adminHeaders = {
        Authorization: `Bearer ${ADMIN_API_KEY}`,
    };

    console.log("\n🔍 Admin Wallet Stats:");
    await makeRequest("/api/admin/wallet-auth-stats", { headers: adminHeaders });

    console.log("\n📋 Admin Wallet List:");
    await makeRequest("/api/admin/wallets?page=1&limit=10", {
        headers: adminHeaders,
    });

    // Test detailed wallet info for first test wallet
    console.log("\n🔬 Admin Wallet Details:");
    await makeRequest(`/api/admin/wallets/${TEST_WALLETS[0].address}`, {
        headers: adminHeaders,
    });
}

async function testIPWalletAssociations() {
    console.log("\n🌐 === IP WALLET ASSOCIATIONS ===");

    // This will show wallets associated with the current IP
    await makeRequest("/api/auth/ip/127.0.0.1/wallets");
}

async function testAuthenticationFlow() {
    console.log("\n🔄 === COMPLETE AUTHENTICATION FLOW ===");

    const wallet = TEST_WALLETS[0];

    try {
        // 1. Generate auth message
        const authData = await testGenerateAuthMessage();

        // 2. Verify signature (mock)
        const verifyResult = await testVerifySignature(authData, wallet.address);

        if (!verifyResult || !verifyResult.success) {
            console.log(
                "⚠️  Signature verification failed (expected with mock signature)"
            );
            console.log(
                "   In a real environment, you would use a proper wallet signature"
            );

            // For testing purposes, let's simulate successful authentication
            // by directly calling the service (this is only for testing!)
            console.log("\n🧪 === SIMULATING SUCCESSFUL AUTH (TEST ONLY) ===");
            return wallet.address;
        }

        return wallet.address;
    } catch (error) {
        console.error("❌ Authentication flow failed:", error.message);
        return wallet.address; // Return wallet for other tests
    }
}

async function testSuspiciousActivityDetection() {
    console.log("\n🚨 === SUSPICIOUS ACTIVITY DETECTION ===");

    // Test multiple wallets from same IP
    for (let i = 0; i < TEST_WALLETS.length; i++) {
        const wallet = TEST_WALLETS[i];
        try {
            const authData = await testGenerateAuthMessage();
            await testVerifySignature(authData, wallet.address);
        } catch (error) {
            console.log(`   ⚠️  Expected failure for wallet ${i + 1}`);
        }
    }
}

async function runAllTests() {
    console.log("🚀 === WALLET AUTHENTICATION TEST SUITE ===");
    console.log(`📍 Testing against: ${BASE_URL}`);
    console.log(`🔑 Admin API Key: ${ADMIN_API_KEY.substring(0, 10)}...`);

    try {
        // Basic connectivity
        await testHealthCheck();

        // Authentication flow
        const authenticatedWallet = await testAuthenticationFlow();

        // Test individual endpoints
        await testWalletInfo(authenticatedWallet);
        await testAuthStats();
        await testIPWalletAssociations();

        // Test protected routes
        await testProtectedRoute(authenticatedWallet);

        // Test suspicious activity detection
        await testSuspiciousActivityDetection();

        // Test admin endpoints (requires API key)
        await testAdminEndpoints();

        console.log("\n🎉 === TEST SUITE COMPLETED ===");
        console.log("\n📝 NOTES:");
        console.log(
            "   • Signature verification tests use mock signatures and will fail"
        );
        console.log("   • In production, use real wallet signatures");
        console.log("   • Admin endpoints require valid ADMIN_API_KEY");
        console.log("   • Protected routes require wallet authentication");
    } catch (error) {
        console.error("\n💥 Test suite failed:", error.message);
        process.exit(1);
    }
}

// Usage instructions
function printUsage() {
    console.log("\n📖 === USAGE ===");
    console.log("   node test-wallet-auth.js");
    console.log(
        "   API_BASE_URL=http://localhost:3000 ADMIN_API_KEY=your-key node test-wallet-auth.js"
    );
    console.log("\n🔧 Environment Variables:");
    console.log(
        "   API_BASE_URL: Base URL of your API (default: http://localhost:3000)"
    );
    console.log(
        "   ADMIN_API_KEY: Your admin API key for testing admin endpoints"
    );
    console.log("\n⚡ Real Wallet Testing:");
    console.log(
        "   For real wallet testing, use the frontend or tools like wagmi/viem"
    );
    console.log("   This script demonstrates the API flow with mock signatures");
}

// Check if fetch is available (Node.js 18+)
if (typeof fetch === "undefined") {
    console.error("❌ This script requires Node.js 18+ (for fetch API)");
    console.log("   Alternatively, install node-fetch: npm install node-fetch");
    process.exit(1);
}

// Command line argument handling
if (process.argv.includes("--help") || process.argv.includes("-h")) {
    printUsage();
    process.exit(0);
}

// Run the tests
runAllTests().catch((error) => {
    console.error("💥 Unhandled error:", error);
    process.exit(1);
});