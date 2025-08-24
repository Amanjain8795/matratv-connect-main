/**
 * Clean error handling utility to prevent console pollution
 */

// Global error handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  // Prevent the default console error for known issues
  if (event.reason?.message?.includes('information_schema') ||
      event.reason?.message?.includes('process_referral_rewards') ||
      event.reason?.message?.includes('Admin fetch error')) {
    event.preventDefault()
    console.warn('🔧 Handled known system check error:', event.reason?.message)
  }
})

// Clean console error handler
const originalConsoleError = console.error
console.error = (...args) => {
  const message = args.join(' ')
  
  // Filter out known system check errors
  if (message.includes('Error checking functions') ||
      message.includes('Admin fetch error') ||
      message.includes('Referral system not ready')) {
    console.warn('🔧 Filtered known system error:', message)
    return
  }
  
  // Let other errors through
  originalConsoleError.apply(console, args)
}

export const cleanupErrors = () => {
  console.log('✅ Error cleanup utility loaded')
}
