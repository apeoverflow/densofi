import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";

const BACKEND_URL = "http://localhost:8000";

// Test wallet for demo
const privateKey = generatePrivateKey();
const testWallet = privateKeyToAccount(privateKey);
console.log("🎮 Testing Game XP Submission");
console.log("Test wallet:", testWallet.address);

async function testGameXP() {
    try {
        // Step 1: Request authentication message
        console.log("\n1. Requesting authentication message...");
        const authResponse = await fetch(
            `${BACKEND_URL}/api/auth/request-message`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            }
        );

        if (!authResponse.ok) {
            throw new Error(`Auth request failed: ${authResponse.status}`);
        }

        const authData = await authResponse.json();
        console.log("✅ Auth message received");

        // Step 2: Sign the message
        console.log("\n2. Signing authentication message...");
        const signature = await testWallet.signMessage({
            message: authData.data.message,
        });
        console.log("✅ Message signed");

        // Step 3: Verify signature
        console.log("\n3. Verifying signature...");
        const verifyResponse = await fetch(
            `${BACKEND_URL}/api/auth/verify-signature`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nonce: authData.data.nonce,
                    signature: signature,
                    walletAddress: testWallet.address,
                }),
            }
        );

        if (!verifyResponse.ok) {
            throw new Error(
                `Signature verification failed: ${verifyResponse.status}`
            );
        }

        const verifyData = await verifyResponse.json();
        console.log("✅ Wallet authenticated successfully");

        // Step 4: Submit game XP
        console.log("\n4. Submitting game XP...");
        const gameScore = 1250; // Test score that should give 12 XP

        const xpResponse = await fetch(`${BACKEND_URL}/api/game/submit-xp`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Wallet-Address": testWallet.address.toLowerCase(),
            },
            body: JSON.stringify({
                score: gameScore,
                gameType: "dino-runner",
                difficulty: "normal",
            }),
        });

        if (!xpResponse.ok) {
            const errorData = await xpResponse.json();
            throw new Error(
                `XP submission failed: ${errorData.error || xpResponse.status}`
            );
        }

        const xpData = await xpResponse.json();
        console.log("✅ XP submitted successfully!");
        console.log("📊 Results:", {
            walletAddress: xpData.data.walletAddress,
            score: xpData.data.score,
            xpEarned: xpData.data.xpEarned,
            gameType: xpData.data.gameType,
            message: xpData.data.message,
        });

        // Step 5: Test leaderboard endpoint
        console.log("\n5. Testing leaderboard endpoint...");
        const leaderboardResponse = await fetch(
            `${BACKEND_URL}/api/game/leaderboard`
        );

        if (!leaderboardResponse.ok) {
            throw new Error(
                `Leaderboard request failed: ${leaderboardResponse.status}`
            );
        }

        const leaderboardData = await leaderboardResponse.json();
        console.log("✅ Leaderboard fetched successfully");
        console.log("🏆 Top players:", leaderboardData.data.leaderboard.length);

        // Step 6: Test player stats endpoint
        console.log("\n6. Testing player stats endpoint...");
        const statsResponse = await fetch(`${BACKEND_URL}/api/game/stats`, {
            headers: {
                "X-Wallet-Address": testWallet.address.toLowerCase(),
            },
        });

        if (!statsResponse.ok) {
            const errorData = await statsResponse.json();
            console.log(
                "⚠️ Stats request failed (expected for new wallet):",
                errorData.error
            );
        } else {
            const statsData = await statsResponse.json();
            console.log("✅ Player stats fetched");
            console.log("📈 Stats:", statsData.data);
        }

        console.log("\n🎉 All tests completed successfully!");
    } catch (error) {
        console.error("\n❌ Test failed:", error.message);
        process.exit(1);
    }
}

// Run the test
testGameXP();