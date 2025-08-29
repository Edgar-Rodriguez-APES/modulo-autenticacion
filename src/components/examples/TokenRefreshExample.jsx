import React, { useState, useEffect } from 'react'
import tokenManager from '../../utils/tokenManager'
import tokenRefreshManager from '../../utils/tokenRefreshManager'

/**
 * Example component to demonstrate automatic token refresh system
 */
const TokenRefreshExample = () => {
  const [tokenInfo, setTokenInfo] = useState({
    hasToken: false,
    isExpired: false,
    needsRefresh: false,
    expiresAt: null,
    refreshStatus: {}
  })

  const updateTokenInfo = () => {
    const { accessToken } = tokenManager.getTokens()
    
    if (accessToken) {
      const expiresAt = tokenManager.getTokenExpiry(accessToken)
      const isExpired = tokenManager.isTokenExpired(accessToken)
      const needsRefresh = tokenManager.needsRefresh(accessToken)
      const refreshStatus = tokenRefreshManager.getStatus()
      
      setTokenInfo({
        hasToken: true,
        isExpired,
        needsRefresh,
        expiresAt: expiresAt ? new Date(expiresAt * 1000).toLocaleString() : null,
        refreshStatus
      })
    } else {
      setTokenInfo({
        hasToken: false,
        isExpired: false,
        needsRefresh: false,
        expiresAt: null,
        refreshStatus: tokenRefreshManager.getStatus()
      })
    }
  }

  useEffect(() => {
    // Update token info initially
    updateTokenInfo()
    
    // Update every 5 seconds
    const interval = setInterval(updateTokenInfo, 5000)
    
    return () => clearInterval(interval)
  }, [])

  const testEnsureValidToken = async () => {
    try {
      const validToken = await tokenRefreshManager.ensureValidToken()
      console.log('ensureValidToken result:', validToken ? 'Valid token obtained' : 'No valid token')
      updateTokenInfo()
    } catch (error) {
      console.error('ensureValidToken error:', error)
    }
  }

  const testRefreshToken = async () => {
    try {
      const newToken = await tokenRefreshManager.refreshToken()
      console.log('refreshToken result:', newToken ? 'Token refreshed' : 'Refresh failed')
      updateTokenInfo()
    } catch (error) {
      console.error('refreshToken error:', error)
    }
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Token Refresh System Status</h2>
      
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold text-gray-700">Token Status</h3>
            <ul className="text-sm space-y-1">
              <li>Has Token: <span className={tokenInfo.hasToken ? 'text-green-600' : 'text-red-600'}>{tokenInfo.hasToken ? 'Yes' : 'No'}</span></li>
              <li>Is Expired: <span className={tokenInfo.isExpired ? 'text-red-600' : 'text-green-600'}>{tokenInfo.isExpired ? 'Yes' : 'No'}</span></li>
              <li>Needs Refresh: <span className={tokenInfo.needsRefresh ? 'text-yellow-600' : 'text-green-600'}>{tokenInfo.needsRefresh ? 'Yes' : 'No'}</span></li>
              <li>Expires At: <span className="text-gray-600">{tokenInfo.expiresAt || 'N/A'}</span></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-700">Refresh Manager Status</h3>
            <ul className="text-sm space-y-1">
              <li>Is Refreshing: <span className={tokenInfo.refreshStatus.isRefreshing ? 'text-yellow-600' : 'text-gray-600'}>{tokenInfo.refreshStatus.isRefreshing ? 'Yes' : 'No'}</span></li>
              <li>Queue Length: <span className="text-gray-600">{tokenInfo.refreshStatus.queueLength || 0}</span></li>
              <li>Retry Count: <span className="text-gray-600">{tokenInfo.refreshStatus.retryCount || 0}</span></li>
              <li>Has Timer: <span className={tokenInfo.refreshStatus.hasRefreshTimer ? 'text-green-600' : 'text-gray-600'}>{tokenInfo.refreshStatus.hasRefreshTimer ? 'Yes' : 'No'}</span></li>
            </ul>
          </div>
        </div>
        
        <div className="flex space-x-4">
          <button
            onClick={testEnsureValidToken}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Test Ensure Valid Token
          </button>
          
          <button
            onClick={testRefreshToken}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Test Refresh Token
          </button>
          
          <button
            onClick={updateTokenInfo}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Refresh Status
          </button>
        </div>
      </div>
      
      <div className="mt-4 p-4 bg-gray-50 rounded">
        <h4 className="font-semibold text-gray-700 mb-2">Implementation Details</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>✓ 5-minute refresh buffer implemented</li>
          <li>✓ Automatic token refresh on API requests</li>
          <li>✓ Request queue system for concurrent requests</li>
          <li>✓ Error handling with logout fallback</li>
          <li>✓ Exponential backoff retry logic</li>
          <li>✓ Visibility change and online event handling</li>
        </ul>
      </div>
    </div>
  )
}

export default TokenRefreshExample