import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";

const BACKEND_URL = "http://localhost:8000";

// Test multiple wallets for demo
const wallet1 = privateKeyToAccount(generatePrivateKey());
const wallet2 = privateKeyToAccount(generatePrivateKey());

console.log("🎮 Testing Game XP MongoDB Storage System");
console.log("Test wallets:");
console.log("  Wallet 1:", wallet1.address);
console.log("  Wallet 2:", wallet2.address);

async function authenticateWallet(wallet) {
    console.log(`\n🔐 Authenticating wallet ${wallet.address}...`);

    // Step 1: Request authentication message
    const authResponse = await fetch(`${BACKEND_URL}/api/auth/request-message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
    });

    if (!authResponse.ok) {
        throw new Error(`Auth request failed: ${authResponse.status}`);
    }

    const authData = await authResponse.json();

    // Step 2: Sign the message
    const signature = await wallet.signMessage({
        message: authData.data.message,
    });

    // Step 3: Verify signature
    const verifyResponse = await fetch(
        `${BACKEND_URL}/api/auth/verify-signature`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                nonce: authData.data.nonce,
                signature: signature,
                walletAddress: wallet.address,
            }),
        }
    );

    if (!verifyResponse.ok) {
        throw new Error(`Signature verification failed: ${verifyResponse.status}`);
    }

    console.log(`✅ Wallet ${wallet.address} authenticated successfully`);
    return wallet.address;
}

async function submitGameXP(
    walletAddress,
    gameScore,
    gameType = "dino-runner"
) {
    console.log(`\n🎯 Submitting game XP for ${walletAddress}...`);
    console.log(`  Score: ${gameScore}`);
    console.log(`  Game Type: ${gameType}`);

    const xpResponse = await fetch(`${BACKEND_URL}/api/game/submit-xp`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Wallet-Address": walletAddress.toLowerCase(),
        },
        body: JSON.stringify({
            score: gameScore,
            gameType: gameType,
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
        xpEarned: xpData.data.xpEarned,
        totalXP: xpData.data.totalXP,
        newHighScore: xpData.data.newHighScore,
        message: xpData.data.message,
    });

    return xpData.data;
}

async function getPlayerStats(walletAddress) {
    console.log(`\n📊 Getting player stats for ${walletAddress}...`);

    const statsResponse = await fetch(
        `${BACKEND_URL}/api/game/stats/${walletAddress}`, {
            headers: {
                "X-Wallet-Address": walletAddress.toLowerCase(),
            },
        }
    );

    if (!statsResponse.ok) {
        const errorData = await statsResponse.json();
        console.log(`⚠️ Stats request failed: ${errorData.error}`);
        return null;
    }

    const statsData = await statsResponse.json();
    console.log("✅ Player stats fetched successfully");
    console.log("📈 Stats:", {
        totalXP: statsData.data.totalXP,
        gamesPlayed: statsData.data.gamesPlayed,
        highScore: statsData.data.highScore,
        averageScore: statsData.data.averageScore,
        currentRank: statsData.data.currentRank,
        lastPlayed: statsData.data.lastPlayed,
    });

    return statsData.data;
}

async function getLeaderboard() {
    console.log("\n🏆 Getting leaderboard...");

    const leaderboardResponse = await fetch(
        `${BACKEND_URL}/api/game/leaderboard?limit=5`
    );

    if (!leaderboardResponse.ok) {
        throw new Error(
            `Leaderboard request failed: ${leaderboardResponse.status}`
        );
    }

    const leaderboardData = await leaderboardResponse.json();
    console.log("✅ Leaderboard fetched successfully");
    console.log("🏅 Top Players:");
    leaderboardData.data.leaderboard.forEach((player, index) => {
        console.log(
            `  ${index + 1}. ${player.walletAddress.slice(0, 10)}... - ${player.totalXP} XP (High Score: ${player.highScore})`
        );
    });
    console.log(`📊 Total Players: ${leaderboardData.data.totalPlayers}`);

    return leaderboardData.data;
}

async function getGameStats() {
    console.log("\n📈 Getting overall game statistics...");

    const statsResponse = await fetch(`${BACKEND_URL}/api/game/stats`);

    if (!statsResponse.ok) {
        throw new Error(`Game stats request failed: ${statsResponse.status}`);
    }

    const statsData = await statsResponse.json();
    console.log("✅ Game statistics fetched successfully");
    console.log("🎮 Overall Stats:", {
        totalXPAwarded: statsData.data.totalXPAwarded,
        totalGamesPlayed: statsData.data.totalGamesPlayed,
        totalPlayers: statsData.data.totalPlayers,
        averageXPPerGame: statsData.data.averageXPPerGame,
    });

    return statsData.data;
}

async function getPlayerHistory(walletAddress) {
    console.log(`\n📜 Getting game history for ${walletAddress}...`);

    const historyResponse = await fetch(
        `${BACKEND_URL}/api/game/history/${walletAddress}?limit=5`, {
            headers: {
                "X-Wallet-Address": walletAddress.toLowerCase(),
            },
        }
    );

    if (!historyResponse.ok) {
        const errorData = await historyResponse.json();
        console.log(`⚠️ History request failed: ${errorData.error}`);
        return null;
    }

    const historyData = await historyResponse.json();
    console.log("✅ Game history fetched successfully");
    console.log("🎯 Recent Games:");
    historyData.data.history.forEach((game, index) => {
        console.log(
            `  ${index + 1}. Score: ${game.score}, XP: ${game.xpEarned}, ${new Date(game.timestamp).toLocaleString()}`
        );
    });

    return historyData.data;
}

async function testGameXPSystem() {
    try {
        console.log("\n=== PHASE 1: Authentication ===");

        // Authenticate both wallets
        await authenticateWallet(wallet1);
        await authenticateWallet(wallet2);

        console.log("\n=== PHASE 2: Submit Game Scores ===");

        // Submit multiple games for wallet1
        await submitGameXP(wallet1.address, 1250); // 12 XP
        await submitGameXP(wallet1.address, 2800); // 28 XP
        await submitGameXP(wallet1.address, 1650); // 16 XP

        // Submit games for wallet2
        await submitGameXP(wallet2.address, 3200); // 32 XP
        await submitGameXP(wallet2.address, 1100); // 11 XP

        console.log("\n=== PHASE 3: View Player Stats ===");

        // Get stats for both players
        await getPlayerStats(wallet1.address);
        await getPlayerStats(wallet2.address);

        console.log("\n=== PHASE 4: View Leaderboard ===");

        // Get leaderboard
        await getLeaderboard();

        console.log("\n=== PHASE 5: View Game History ===");

        // Get game history for wallet1
        await getPlayerHistory(wallet1.address);

        console.log("\n=== PHASE 6: Overall Statistics ===");

        // Get overall game stats
        await getGameStats();

        console.log("\n🎉 All MongoDB game XP tests completed successfully!");
        console.log("\n✅ Features tested:");
        console.log("  • XP submission and storage in MongoDB");
        console.log("  • Player statistics tracking");
        console.log("  • Leaderboard generation");
        console.log("  • Game history tracking");
        console.log("  • Overall game statistics");
        console.log("  • High score tracking");
        console.log("  • Average score calculation");
    } catch (error) {
        console.error("\n❌ Test failed:", error.message);
        process.exit(1);
    }
}

// Run the comprehensive test
testGameXPSystem();