/**
 * Web Vitals Hook
 * Monitors Core Web Vitals in production
 */

import { useEffect } from 'react'

/**
 * Hook to monitor Core Web Vitals
 * @param {Function} callback - Function to call with metrics
 */
export const useWebVitals = (callback = null) => {
  useEffect(() => {
    // Only run in production
    if (process.env.NODE_ENV !== 'production' && !callback) {
      return
    }

    const metrics = {
      lcp: null,
      fid: null,
      cls: null,
      fcp: null,
      ttfb: null,
    }

    // LCP (Largest Contentful Paint)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((entryList) => {
          const lastEntry = entryList.getEntries().pop()
          metrics.lcp = lastEntry.renderTime || lastEntry.loadTime
          reportMetric('LCP', metrics.lcp, 'Good')
          callback?.('lcp', metrics.lcp)
        })
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
      } catch (e) {
        console.warn('LCP observer failed:', e)
      }

      // CLS (Cumulative Layout Shift)
      try {
        const clsObserver = new PerformanceObserver((entryList) => {
          let clsValue = 0
          for (const entry of entryList.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value
            }
          }
          metrics.cls = clsValue
          reportMetric('CLS', metrics.cls, metrics.cls < 0.1 ? 'Good' : 'Needs Improvement')
          callback?.('cls', metrics.cls)
        })
        clsObserver.observe({ entryTypes: ['layout-shift'] })
      } catch (e) {
        console.warn('CLS observer failed:', e)
      }

      // FID (First Input Delay)
      try {
        const fidObserver = new PerformanceObserver((entryList) => {
          const fidEntry = entryList.getEntries()[0]
          metrics.fid = fidEntry.processingDuration
          reportMetric('FID', metrics.fid, metrics.fid < 100 ? 'Good' : 'Needs Improvement')
          callback?.('fid', metrics.fid)
        })
        fidObserver.observe({ entryTypes: ['first-input'] })
      } catch (e) {
        console.warn('FID observer failed:', e)
      }
    }

    // FCP (First Contentful Paint)
    if ('PerformanceObserver' in window) {
      try {
        const fcpObserver = new PerformanceObserver((entryList) => {
          const fcpEntry = entryList.getEntries().find(entry => entry.name === 'first-contentful-paint')
          if (fcpEntry) {
            metrics.fcp = fcpEntry.startTime
            reportMetric('FCP', metrics.fcp, 'Info')
            callback?.('fcp', metrics.fcp)
          }
        })
        fcpObserver.observe({ entryTypes: ['paint'] })
      } catch (e) {
        console.warn('FCP observer failed:', e)
      }
    }

    // Cleanup observers
    return () => {
      if (window.PerformanceObserver) {
        PerformanceObserver.prototype.disconnect?.()
      }
    }
  }, [callback])
}

/**
 * Report metric to console in development
 */
const reportMetric = (name, value, status) => {
  if (process.env.NODE_ENV === 'development') {
    const formattedValue = typeof value === 'number' ? value.toFixed(2) : value
    console.log(`⚡ ${name}: ${formattedValue}ms [${status}]`)
  }
}

/**
 * Get performance metrics
 * @returns {Object} - Performance metrics
 */
export const getPerformanceMetrics = () => {
  if (!window.performance) return null

  const navigation = performance.getEntriesByType('navigation')[0] || {}
  const paint = performance.getEntriesByType('paint') || []

  return {
    // Navigation timing
    dns: navigation.domainLookupEnd - navigation.domainLookupStart,
    tcp: navigation.connectEnd - navigation.connectStart,
    ttfb: navigation.responseStart - navigation.requestStart,
    download: navigation.responseEnd - navigation.responseStart,
    dom: navigation.domInteractive - navigation.responseEnd,
    load: navigation.loadEventStart - navigation.domInteractive,
    // Paint timing
    fcp: paint.find(e => e.name === 'first-contentful-paint')?.startTime,
    lcp: null, // Set by LCP observer
    // Total times
    pageLoad: performance.timing.loadEventEnd - performance.timing.navigationStart,
    tti: performance.timing.loadEventStart - performance.timing.navigationStart,
  }
}

/**
 * Mark performance checkpoint
 * @param {string} name - Checkpoint name
 */
export const markPerformance = (name) => {
  if (window.performance?.mark) {
    performance.mark(`${name}-start`)
  }
}

/**
 * Measure performance between two marks
 * @param {string} name - Measurement name
 * @param {string} startMark - Start mark name
 * @param {string} endMark - End mark name
 */
export const measurePerformance = (name, startMark, endMark) => {
  if (window.performance?.measure) {
    try {
      performance.measure(name, `${startMark}-start`, `${endMark}-start`)
      const measure = performance.getEntriesByName(name)[0]
      console.log(`⏱️  ${name}: ${measure?.duration.toFixed(2)}ms`)
      return measure?.duration
    } catch (e) {
      console.warn(`Failed to measure ${name}:`, e)
    }
  }
}

export default useWebVitals
