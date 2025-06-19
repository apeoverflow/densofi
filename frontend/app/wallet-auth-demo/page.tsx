"use client";

import { useState } from 'react';
import { WalletAuthButton } from '@/components/WalletAuthButton';
import { useWalletAuth } from '@/hooks/useWalletAuth';
import { useAuthenticatedFetch } from '@/hooks/useAuthenticatedFetch';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle, AlertCircle, Clock } from 'lucide-react';

export default function WalletAuthDemo() {
  const { 
    isAuthenticated, 
    walletAddress, 
    sessionId, 
    expiresAt, 
    isWalletConnected,
    connectedAddress 
  } = useWalletAuth();
  
  const authenticatedFetch = useAuthenticatedFetch();
  const [testResult, setTestResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const testAuthenticatedEndpoint = async () => {
    setIsLoading(true);
    setTestResult(null);
    
    try {
      // Test domain verification endpoint (requires wallet auth)
      const response = await authenticatedFetch(
        `/api/domains/test.example/${connectedAddress}/verify`,
        { requireAuth: true }
      );
      
      const data = await response.json();
      setTestResult({
        success: response.ok,
        data,
        status: response.status
      });
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testPublicEndpoint = async () => {
    setIsLoading(true);
    setTestResult(null);
    
    try {
      // Test public endpoint
      const response = await authenticatedFetch('/api/auth/stats');
      const data = await response.json();
      setTestResult({
        success: response.ok,
        data,
        status: response.status
      });
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">
            Wallet Authentication Demo
          </h1>
          <p className="text-gray-300 text-lg">
            Test the wallet authentication flow and authenticated API calls
          </p>
        </div>

        {/* Authentication Section */}
        <Card className="p-6 bg-slate-800/50 border-slate-700">
          <h2 className="text-2xl font-semibold text-white mb-4">
            Authentication Status
          </h2>
          
          <div className="space-y-4">
            <WalletAuthButton className="w-full" />
            
            {/* Status Information */}
            {isWalletConnected && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="space-y-2">
                  <h3 className="font-medium text-white">Wallet Info</h3>
                  <div className="text-sm text-gray-300 space-y-1">
                    <div className="flex items-center gap-2">
                      {isWalletConnected ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span>Connected: {isWalletConnected ? 'Yes' : 'No'}</span>
                    </div>
                    {connectedAddress && (
                      <div>Address: {connectedAddress}</div>
                    )}
                  </div>
                </div>

                {isAuthenticated && (
                  <div className="space-y-2">
                    <h3 className="font-medium text-white">Auth Info</h3>
                    <div className="text-sm text-gray-300 space-y-1">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Authenticated: Yes</span>
                      </div>
                      {sessionId && (
                        <div>Session: {sessionId.slice(0, 8)}...</div>
                      )}
                      {expiresAt && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>Expires: {new Date(expiresAt).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* API Testing Section */}
        <Card className="p-6 bg-slate-800/50 border-slate-700">
          <h2 className="text-2xl font-semibold text-white mb-4">
            API Testing
          </h2>
          
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={testPublicEndpoint}
                disabled={isLoading}
                variant="outline"
                className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
              >
                Test Public Endpoint
              </Button>
              
              <Button
                onClick={testAuthenticatedEndpoint}
                // disabled={isLoading || !isAuthenticated}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Test Authenticated Endpoint
              </Button>
            </div>

            {/* Results */}
            {testResult && (
              <div className="mt-6">
                <h3 className="font-medium text-white mb-2">API Response:</h3>
                <div className={`p-4 rounded-lg ${
                  testResult.success 
                    ? 'bg-green-900/30 border border-green-700' 
                    : 'bg-red-900/30 border border-red-700'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {testResult.success ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                    <span className="font-medium text-white">
                      Status: {testResult.status}
                    </span>
                  </div>
                  <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                    {JSON.stringify(testResult.data || testResult.error, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Usage Instructions */}
        <Card className="p-6 bg-slate-800/50 border-slate-700">
          <h2 className="text-2xl font-semibold text-white mb-4">
            How to Use
          </h2>
          
          <div className="text-gray-300 space-y-2">
            <ol className="list-decimal list-inside space-y-2">
              <li>Connect your wallet using the "Connect Wallet" button</li>
              <li>Click "Authenticate Wallet" to sign a message and authenticate</li>
              <li>Test public endpoints (no authentication required)</li>
              <li>Test authenticated endpoints (requires wallet authentication)</li>
            </ol>
            
            <div className="mt-4 p-4 bg-blue-900/30 border border-blue-700 rounded-lg">
              <h4 className="font-medium text-white mb-2">Implementation Notes:</h4>
              <ul className="text-sm space-y-1">
                <li>• Authentication state persists in localStorage</li>
                <li>• Sessions expire after a set time</li>
                <li>• Wallet disconnection clears authentication</li>
                <li>• Admin API keys can override wallet authentication</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
} 