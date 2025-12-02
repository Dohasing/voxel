import salesJson from '@assets/lists/sales.json'

export interface SalesItem {
  id: number
  sales: number
}

interface SalesData {
  [assetId: string]: number
}

// Create a Map for O(1) lookups by ID
const salesMap = new Map<number, SalesItem>()

// Initialize the map from the JSON data
const data = salesJson as SalesData
for (const [assetIdStr, sales] of Object.entries(data)) {
  const assetId = parseInt(assetIdStr, 10)
  if (!isNaN(assetId)) {
    salesMap.set(assetId, {
      id: assetId,
      sales: sales
    })
  }
}

export function getSalesData(assetId: number): SalesItem | null {
  return salesMap.get(assetId) ?? null
}

export function hasSalesData(assetId: number): boolean {
  return salesMap.has(assetId)
}

export function formatNumber(num: number): string {
  return num.toLocaleString()
}
