'use client' // Required for Next.js

import { ReactNode, useEffect } from 'react'
import { MiniKit } from '@worldcoin/minikit-js'

export default function MiniKitProvider({ children }: { children: ReactNode }) {
	useEffect(() => {
		// Passing appId in the install is optional
		// but allows you to access it later via `window.MiniKit.appId`
		MiniKit.install("app_331c58bd7c9ad2387f5babdaa2ba56aa");
	}, [])

	return <>{children}</>
}

