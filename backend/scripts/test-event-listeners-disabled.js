#!/usr/bin/env node

/**
 * Test script to verify ENABLE_EVENT_LISTENERS="false" functionality
 * Usage: node scripts/test-event-listeners-disabled.js
 */

// Load environment variables from .env file
import { config } from "dotenv";
config();

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

async function testEventListenersDisabled() {
    console.log("🧪 Testing Event Listeners Disabled Feature...\n");

    try {
        // Test 1: Check status endpoint
        console.log("1. Checking service status...");
        const statusResponse = await fetch(`${BACKEND_URL}/api/status`);
        const statusData = await statusResponse.json();

        console.log(
            "   Status Response:",
            JSON.stringify(statusData.data, null, 2)
        );

        if (!statusData.data.eventListenersEnabled) {
            console.log("   ✅ Event listeners are correctly disabled");
        } else {
            console.log("   ❌ Event listeners should be disabled");
        }

        if (!statusData.data.processingLoopEnabled) {
            console.log("   ✅ Processing loop is correctly disabled");
        } else {
            console.log("   ❌ Processing loop should be disabled");
        }

        // Test 2: Check event listener detailed status
        console.log("\n2. Checking detailed event listener status...");
        const eventStatusResponse = await fetch(
            `${BACKEND_URL}/api/event-listeners/status`, {
                headers: {
                    Authorization: process.env.ADMIN_API_KEY || "test-key",
                },
            }
        );

        if (eventStatusResponse.ok) {
            const eventStatusData = await eventStatusResponse.json();
            console.log(
                "   Event Listener Status:",
                JSON.stringify(eventStatusData.data, null, 2)
            );
        } else {
            console.log(
                "   ⚠️  Could not fetch event listener status (requires admin API key)"
            );
        }

        // Test 3: Test manual processing endpoint
        console.log("\n3. Testing manual processing endpoint...");
        const processResponse = await fetch(`${BACKEND_URL}/api/process-pending`, {
            method: "POST",
            headers: {
                Authorization: process.env.ADMIN_API_KEY || "test-key",
                "Content-Type": "application/json",
            },
        });

        if (processResponse.ok) {
            const processData = await processResponse.json();
            console.log(
                "   Processing Response:",
                JSON.stringify(processData, null, 2)
            );

            if (processData.eventListenersEnabled === false) {
                console.log(
                    "   ✅ Process endpoint correctly indicates listeners are disabled"
                );
            } else {
                console.log(
                    "   ❌ Process endpoint should indicate listeners are disabled"
                );
            }
        } else {
            console.log(
                "   ⚠️  Could not test processing endpoint (requires admin API key)"
            );
        }

        console.log("\n🎉 Event listeners disabled test completed!");
        console.log(
            '\nTo enable event listeners, remove ENABLE_EVENT_LISTENERS from .env or set it to "true"'
        );
    } catch (error) {
        console.error("❌ Test failed:", error.message);
        process.exit(1);
    }
}

// Check if backend URL is reachable
async function checkBackendHealth() {
    try {
        const response = await fetch(`${BACKEND_URL}/health`);
        if (!response.ok) {
            throw new Error(`Backend not healthy: ${response.status}`);
        }
        console.log(`✅ Backend is running at ${BACKEND_URL}\n`);
    } catch (error) {
        console.error(`❌ Cannot reach backend at ${BACKEND_URL}`);
        console.error("   Make sure the backend server is running");
        console.error("   Error:", error.message);
        process.exit(1);
    }
}

// Main execution
async function main() {
    console.log("🔧 Event Listeners Disabled Test\n");

    // Check environment
    if (process.env.ENABLE_EVENT_LISTENERS !== "false") {
        console.log('⚠️  ENABLE_EVENT_LISTENERS is not set to "false"');
        console.log("   This test is designed to verify disabled event listeners");
        console.log(
            '   Run with: ENABLE_EVENT_LISTENERS="false" node scripts/test-event-listeners-disabled.js\n'
        );
    }

    await checkBackendHealth();
    await testEventListenersDisabled();
}

main().catch(console.error);