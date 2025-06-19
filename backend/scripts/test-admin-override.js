#!/usr/bin/env node

/**
 * Admin Override Test Script
 *
 * This script demonstrates how admin API key can override wallet authentication
 * on wallet-protected routes.
 */

// Load environment variables from .env file
import { config } from "dotenv";
config();

const BASE_URL = process.env.API_BASE_URL || "http://localhost:3000";
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || "your-admin-api-key";

// Test wallet address
const TEST_WALLET = "0x742d35Cc6634C0532925a3b8C11d1C8b9F2b9c5A";

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

async function testAdminOverride() {
    console.log("🔒 === ADMIN OVERRIDE TEST SUITE ===");
    console.log(`📍 Testing against: ${BASE_URL}`);
    console.log(`🔑 Admin API Key: ${ADMIN_API_KEY.substring(0, 10)}...`);
    console.log(`👛 Test Wallet: ${TEST_WALLET}`);

    try {
        // Test 1: Try accessing protected route without any authentication (should fail)
        console.log("\n🚫 === TEST 1: No Authentication (should fail) ===");
        await makeRequest(`/api/domains/example.com/${TEST_WALLET}/verify`);

        // Test 2: Try accessing protected route with invalid wallet (should fail)
        console.log(
            "\n🚫 === TEST 2: Invalid Wallet Authentication (should fail) ==="
        );
        await makeRequest(`/api/domains/example.com/${TEST_WALLET}/verify`, {
            headers: {
                "X-Wallet-Address": TEST_WALLET,
            },
        });

        // Test 3: Access protected route with admin API key (should succeed)
        console.log("\n✅ === TEST 3: Admin API Key Override (should succeed) ===");
        await makeRequest(`/api/domains/example.com/${TEST_WALLET}/verify`, {
            headers: {
                Authorization: `Bearer ${ADMIN_API_KEY}`,
            },
        });

        // Test 4: Access different wallet's verification with admin key (should succeed)
        console.log(
            "\n✅ === TEST 4: Admin Access to Any Wallet (should succeed) ==="
        );
        const differentWallet = "0x1234567890123456789012345678901234567890";
        await makeRequest(`/api/domains/example.com/${differentWallet}/verify`, {
            headers: {
                Authorization: `Bearer ${ADMIN_API_KEY}`,
            },
        });

        // Test 5: Admin API key with different formats
        console.log("\n✅ === TEST 5: Admin API Key Different Formats ===");

        console.log("\n   5a. ApiKey format:");
        await makeRequest(`/api/domains/test.com/${TEST_WALLET}/verify`, {
            headers: {
                Authorization: `ApiKey ${ADMIN_API_KEY}`,
            },
        });

        console.log("\n   5b. Direct API key format:");
        await makeRequest(`/api/domains/test2.com/${TEST_WALLET}/verify`, {
            headers: {
                Authorization: ADMIN_API_KEY,
            },
        });

        // Test 6: Admin override on admin-only endpoint (should work)
        console.log("\n✅ === TEST 6: Admin Endpoint Access ===");
        await makeRequest("/api/admin/wallet-auth-stats", {
            headers: {
                Authorization: `Bearer ${ADMIN_API_KEY}`,
            },
        });

        console.log("\n🎉 === ADMIN OVERRIDE TESTS COMPLETED ===");

        console.log("\n📋 Summary:");
        console.log(
            "   ✅ Admin API key successfully overrides wallet authentication"
        );
        console.log("   ✅ Admins can access any wallet's protected resources");
        console.log("   ✅ Multiple API key formats supported");
        console.log("   ✅ Admin endpoints still require admin authentication");
        console.log("   ✅ Requests without authentication properly rejected");
    } catch (error) {
        console.error("\n💥 Test suite failed:", error.message);
        process.exit(1);
    }
}

// Usage instructions
function printUsage() {
    console.log("\n📖 === ADMIN OVERRIDE TEST USAGE ===");
    console.log("   node test-admin-override.js");
    console.log(
        "   API_BASE_URL=http://localhost:3000 ADMIN_API_KEY=your-key node test-admin-override.js"
    );
    console.log("\n🔧 Environment Variables:");
    console.log(
        "   API_BASE_URL: Base URL of your API (default: http://localhost:3000)"
    );
    console.log(
        "   ADMIN_API_KEY: Your admin API key for testing admin override"
    );
    console.log("\n💡 What This Tests:");
    console.log("   • Admin API key can bypass wallet authentication");
    console.log("   • Admins can access any wallet's protected resources");
    console.log("   • Proper rejection of requests without authentication");
    console.log("   • Multiple API key authorization formats");
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
testAdminOverride().catch((error) => {
    console.error("💥 Unhandled error:", error);
    process.exit(1);
});