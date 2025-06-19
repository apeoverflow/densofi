/**
 * Real Wallet Authentication Example
 *
 * This example shows how to integrate wallet authentication using viem
 * for real wallet signatures (as opposed to the mock testing script)
 */
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
// Configuration
const API_BASE_URL = 'http://localhost:3000';
const TEST_PRIVATE_KEY = '0x' + 'a'.repeat(64); // Replace with real private key for testing
async function makeApiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const defaultOptions = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    };
    const requestOptions = { ...defaultOptions, ...options };
    if (requestOptions.body && typeof requestOptions.body === 'object') {
        requestOptions.body = JSON.stringify(requestOptions.body);
    }
    console.log(`\n🔗 ${requestOptions.method} ${url}`);
    const response = await fetch(url, requestOptions);
    const data = await response.json();
    console.log(`✅ Status: ${response.status}`);
    console.log(`📊 Response:`, JSON.stringify(data, null, 2));
    return { response, data };
}
async function authenticateWallet() {
    try {
        console.log('🚀 === REAL WALLET AUTHENTICATION EXAMPLE ===\n');
        // 1. Create wallet client with viem
        const account = privateKeyToAccount(TEST_PRIVATE_KEY);
        const walletClient = createWalletClient({
            account,
            chain: sepolia,
            transport: http()
        });
        console.log(`👛 Wallet Address: ${account.address}`);
        // 2. Request authentication message from API
        console.log('\n📝 Step 1: Requesting authentication message...');
        const { data: messageData } = await makeApiRequest('/api/auth/request-message', {
            method: 'POST'
        });
        if (!messageData || !messageData.success) {
            throw new Error('Failed to get authentication message');
        }
        const { message, nonce, expiresAt } = messageData.data;
        console.log(`\n📄 Message to sign:\n${message}`);
        console.log(`🎲 Nonce: ${nonce}`);
        console.log(`⏰ Expires: ${expiresAt}`);
        // 3. Sign the message with the wallet
        console.log('\n✍️  Step 2: Signing message with wallet...');
        const signature = await walletClient.signMessage({
            message
        });
        console.log(`✅ Signature: ${signature}`);
        // 4. Verify signature with API
        console.log('\n🔍 Step 3: Verifying signature with API...');
        const { data: verifyData } = await makeApiRequest('/api/auth/verify-signature', {
            method: 'POST',
            body: {
                nonce,
                signature,
                walletAddress: account.address
            }
        });
        if (!verifyData.success) {
            throw new Error(`Signature verification failed: ${verifyData.error}`);
        }
        console.log('\n🎉 AUTHENTICATION SUCCESSFUL!');
        console.log('📊 Auth Result:', JSON.stringify(verifyData.data, null, 2));
        // 5. Test authenticated access to protected route
        console.log('\n🔒 Step 4: Testing protected route access...');
        await makeApiRequest(`/api/domains/example.com/${account.address}/verify`, {
            headers: {
                'X-Wallet-Address': account.address
            }
        });
        // 6. Get wallet authentication info
        console.log('\n👤 Step 5: Getting wallet info...');
        await makeApiRequest(`/api/auth/wallet/${account.address}`);
        // 7. Get authentication statistics
        console.log('\n📊 Step 6: Getting auth statistics...');
        await makeApiRequest('/api/auth/stats');
        return account.address;
    }
    catch (error) {
        console.error('\n❌ Authentication failed:', error);
        throw error;
    }
}
// Frontend React Hook Example
const frontendExample = `
/**
 * React Hook for Wallet Authentication
 * Use this in your frontend React app with wagmi
 */

import { useSignMessage, useAccount } from 'wagmi';
import { useState } from 'react';

export function useWalletAuth() {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const authenticate = async () => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    try {
      // 1. Request message to sign
      const messageResponse = await fetch('/api/auth/request-message', {
        method: 'POST'
      });
      const { data } = await messageResponse.json();
      
      if (!data.success) {
        throw new Error('Failed to get authentication message');
      }

      // 2. Sign message with wallet
      const signature = await signMessageAsync({
        message: data.data.message
      });

      // 3. Verify signature
      const verifyResponse = await fetch('/api/auth/verify-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nonce: data.data.nonce,
          signature,
          walletAddress: address
        })
      });

      const result = await verifyResponse.json();
      
      if (result.success) {
        setIsAuthenticated(true);
        // Store wallet address for authenticated requests
        localStorage.setItem('authenticatedWallet', address);
        return result.data;
      } else {
        throw new Error(result.error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const makeAuthenticatedRequest = async (endpoint: string, options: any = {}) => {
    const authenticatedWallet = localStorage.getItem('authenticatedWallet');
    
    if (!authenticatedWallet) {
      throw new Error('Not authenticated');
    }

    return fetch(endpoint, {
      ...options,
      headers: {
        ...options.headers,
        'X-Wallet-Address': authenticatedWallet
      }
    });
  };

  return {
    authenticate,
    makeAuthenticatedRequest,
    isAuthenticated,
    isLoading
  };
}

// Usage in React component:
function MyComponent() {
  const { authenticate, makeAuthenticatedRequest, isAuthenticated, isLoading } = useWalletAuth();

  const handleSignIn = async () => {
    try {
      const result = await authenticate();
      console.log('Authenticated!', result);
    } catch (error) {
      console.error('Authentication failed:', error);
    }
  };

  const testProtectedRoute = async () => {
    try {
      const response = await makeAuthenticatedRequest('/api/domains/example.com/0x.../verify');
      const data = await response.json();
      console.log('Protected route result:', data);
    } catch (error) {
      console.error('Protected route failed:', error);
    }
  };

  return (
    <div>
      <button onClick={handleSignIn} disabled={isLoading}>
        {isLoading ? 'Signing...' : 'Sign In with Wallet'}
      </button>
      
      {isAuthenticated && (
        <button onClick={testProtectedRoute}>
          Test Protected Route
        </button>
      )}
    </div>
  );
}
`;
// Usage instructions
function printUsage() {
    console.log('\n📖 === REAL WALLET AUTH EXAMPLE ===');
    console.log('This example shows how to use real wallet signatures with viem');
    console.log('\n⚠️  IMPORTANT: Replace TEST_PRIVATE_KEY with a real private key for testing');
    console.log('   (Never commit real private keys to version control!)');
    console.log('\n🔧 Setup:');
    console.log('   1. Make sure your backend server is running on localhost:3000');
    console.log('   2. Set ADMIN_API_KEY in your .env file');
    console.log('   3. Replace TEST_PRIVATE_KEY with a test wallet private key');
    console.log('   4. Run: npx tsx examples/wallet-auth-example.ts');
    console.log('\n📱 Frontend Integration:');
    console.log('   See the React hook example below for frontend integration');
}
// Main execution
async function main() {
    if (process.argv.includes('--help') || process.argv.includes('-h')) {
        printUsage();
        return;
    }
    if (TEST_PRIVATE_KEY === '0x' + 'a'.repeat(64)) {
        console.log('⚠️  WARNING: Using default test private key');
        console.log('   Replace TEST_PRIVATE_KEY with a real private key for proper testing');
        console.log('   Use --help for more information');
    }
    try {
        await authenticateWallet();
        console.log('\n✅ === EXAMPLE COMPLETED SUCCESSFULLY ===');
        console.log('\n📋 Next Steps:');
        console.log('   1. Integrate the React hook example in your frontend');
        console.log('   2. Add wallet authentication to more routes as needed');
        console.log('   3. Customize suspicious activity detection rules');
        console.log('   4. Set up proper rate limiting in production');
    }
    catch (error) {
        console.error('💥 Example failed:', error);
        process.exit(1);
    }
}
// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}
// Export for use in other files
export { authenticateWallet, makeApiRequest };
// Frontend example as a comment for reference
console.log('\n📱 === FRONTEND REACT HOOK EXAMPLE ===');
console.log(frontendExample);
