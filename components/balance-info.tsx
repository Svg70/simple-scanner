"use client"

import { useState, useEffect } from "react"
import { UniqueIndexer } from "@unique-nft/sdk"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { Loader2, AlertCircle, ExternalLink } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface BalanceData {
  address: string;
  locked: string;
  available: string;
  free: string;
  total: string;
  reserved: string;
  staked: string;
  unstaked: string;
  canstake: string;
  createdAtBlockNumber: number;
  updatedAtBlockNumber: number;
  createdAt: Date;
  updatedAt: Date;
  fetchedAtBlockNumber: number;
}

interface BalanceInfoProps {
  address?: string
}

const DEFAULT_ADDRESS = "5Cnx9ZfNaSo9DeMNgjvFSqk9XiVpQ1ofX8Fourj6r5yLAtpv"

export default function BalanceInfo({ address: propAddress }: BalanceInfoProps) {
  const address = propAddress || DEFAULT_ADDRESS

  const [balanceData, setBalanceData] = useState<BalanceData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function fetchBalanceData() {
      if (!isMounted) return

      setLoading(true)
      try {
        console.log(`Fetching balance for address: ${address}`)

        const indexerClient = UniqueIndexer({
          baseUrl: "https://api-unique.uniquescan.io/v2",
        })

        const bal = await indexerClient.coinBalance({ address: address })
        console.log("Balance data:", bal)

        if (isMounted) {
          setBalanceData(bal as BalanceData)
        }
      } catch (error) {
        console.error("Error fetching balance:", error)
        if (isMounted) {
          setBalanceData(null)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchBalanceData()

    return () => {
      isMounted = false
    }
  }, [address])

  const formatNumber = (num: string) => {
    try {
      const bigNum = BigInt(num)
      const divisor = BigInt(10 ** 18)
      const whole = bigNum / divisor
      return whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    } catch (error) {
      return "0"
    }
  }

  //TO_DO add decimals var
  const stringToNumber = (str: string): number => {
    try {
      const bigNum = BigInt(str)
      const divisor = BigInt(10 ** 18)
      return Number(bigNum / divisor)
    } catch (error) {
      return 0
    }
  }

  const formatAddress = (addr: string) => {
    if (addr.length > 20) {
      return `${addr.substring(0, 6)}...${addr.substring(addr.length - 6)}`
    }
    return addr
  }

  const getChartData = () => {
    if (!balanceData) return []

    const available = stringToNumber(balanceData.available)
    const staked = stringToNumber(balanceData.staked)
    const locked = stringToNumber(balanceData.locked)

    if (staked > 0) {
      return [
        { name: "Available", value: available, color: "#10b981" },
        { name: "Staked", value: staked, color: "#3b82f6" },
      ].filter((item) => item.value > 0)
    }

    else if (locked > 0) {
      return [
        { name: "Available", value: available, color: "#10b981" },
        { name: "Locked", value: locked, color: "#f43f5e" },
      ].filter((item) => item.value > 0)
    }

    else {
      return [{ name: "Available", value: available, color: "#10b981" }].filter((item) => item.value > 0)
    }
  }

  const chartData = balanceData ? getChartData() : []

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-md shadow-md p-2 text-xs">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.payload.color }} />
              <span>
                {entry.name}: {entry.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-lg font-medium">Balance Information</CardTitle>
          <div className="flex items-center mt-1 text-sm text-muted-foreground">
            <a
              href={`https://unique.subscan.io/account/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center hover:text-primary hover:underline"
            >
              {formatAddress(address)}
              <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center space-x-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          </div>
        ) : balanceData ? (
          <div className="space-y-6">
            <div className="h-48">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">No balance data to display</p>
                </div>
              )}
            </div>

            {/* Balance details */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-[#6b7280]" />
                <span className="text-sm font-medium">Total:</span>
                <span className="text-sm ml-auto">{formatNumber(balanceData.total)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-[#10b981]" />
                <span className="text-sm font-medium">Available:</span>
                <span className="text-sm ml-auto">{formatNumber(balanceData.available)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-[#3b82f6]" />
                <span className="text-sm font-medium">Staked:</span>
                <span className="text-sm ml-auto">{formatNumber(balanceData.staked)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-[#f43f5e]" />
                <span className="text-sm font-medium">Locked:</span>
                <span className="text-sm ml-auto">{formatNumber(balanceData.locked)}</span>
              </div>
            </div>
          </div>
        ) : (
          <Alert variant="destructive" className="bg-destructive/10 border-destructive/20">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Unable to load balance data. Please check the address and try again.</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}

