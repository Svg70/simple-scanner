"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { UniqueIndexer } from "@unique-nft/sdk"
import BalanceInfo from "./balance-info"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface BlockchainScannerProps {
  defaultAddress?: string
}

export default function BlockchainScanner({ defaultAddress }: BlockchainScannerProps) {
  const searchParams = useSearchParams()
  const address = searchParams.get("address") || defaultAddress || "5Cnx9ZfNaSo9DeMNgjvFSqk9XiVpQ1ofX8Fourj6r5yLAtpv"

  const [activeTab, setActiveTab] = useState("staking")
  const [stakingLoading, setStakingLoading] = useState(true)
  const [transfersLoading, setTransfersLoading] = useState(true)
  const [stakingTransactions, setStakingTransactions] = useState<any[]>([])
  const [transferTransactions, setTransferTransactions] = useState<any[]>([])

  useEffect(() => {
    let isMounted = true

    async function fetchStakingData() {
      if (!isMounted) return

      setStakingLoading(true)

      try {
        console.log(`Fetching staking transactions for address: ${address}`)

        const indexerClient = UniqueIndexer({
          baseUrl: "https://api-unique.uniquescan.io/v2",
        })

        const extrinsics = await indexerClient.extrinsics({
          signerIn: [address],
          methodIn: ["stake"],
          sectionIn: ["appPromotion"],
        })

        if (!isMounted) return

        const processedTransactions = extrinsics.items.map((item) => {
          const stakeEvent = item.events?.find((event) => event.section === "appPromotion" && event.method === "Stake")

          let amount = "0"
          if (stakeEvent && stakeEvent.data) {
            amount = stakeEvent.data["1"] || "0"
          }

          return {
            hash: item.hash,
            blockNumber: item.blockNumber,
            section: item.section,
            method: item.method,
            createdAt: item.createdAt,
            amount: amount,
          }
        })

        if (isMounted) {
          setStakingTransactions(processedTransactions)
          setStakingLoading(false)
        }
      } catch (error) {
        console.error("Error fetching staking transactions:", error)
        if (isMounted) {
          setStakingTransactions([])
          setStakingLoading(false)
        }
      }
    }

    fetchStakingData()

    return () => {
      isMounted = false
    }
  }, [address])

  // Fetch transfer transaction data
  useEffect(() => {
    let isMounted = true

    async function fetchTransferData() {
      if (!isMounted) return

      setTransfersLoading(true)

      try {
        console.log(`Fetching transfer transactions for address: ${address}`)

        const indexerClient = UniqueIndexer({
          baseUrl: "https://api-unique.uniquescan.io/v2",
        })

        const balanceTransfers = await indexerClient.balanceTransfers({
          fromIn: [address],
        })

        console.log("Balance transfers data:", balanceTransfers)

        if (!isMounted) return

        const processedTransactions = balanceTransfers.items.map((item) => {
          if (!item || !item.event) return
          return {
            hash: item.event.extrinsicHash,
            blockNumber: item.event.blockNumber,
            section: item.event.extrinsic.section,
            method: item.event.extrinsic.method,
            createdAt: new Date(Date.now()).toISOString(), // API doesn't provide timestamp
            amount: item.amount,
            from: item.from,
            to: item.to,
          }
        })

        if (isMounted) {
          setTransferTransactions(processedTransactions)
          setTransfersLoading(false)
        }
      } catch (error) {
        console.error("Error fetching transfer transactions:", error)
        if (isMounted) {
          setTransferTransactions([])
          setTransfersLoading(false)
        }
      }
    }

    fetchTransferData()

    return () => {
      isMounted = false
    }
  }, [address])


  const formatHash = (hash: string) => {
    if (hash.length > 20) {
      return `${hash.substring(0, 6)}...${hash.substring(hash.length - 6)}`
    }
    return hash
  }

  const formatAddress = (addr: string) => {
    if (addr.length > 20) {
      return `${addr.substring(0, 6)}...${addr.substring(addr.length - 6)}`
    }
    return addr
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toISOString().replace("T", " ").substring(0, 19) + " (UTC)"
  }

  const formatAmount = (amountString: string) => {
    try {
      const amount = BigInt(amountString)
      const divisor = BigInt(10 ** 18)
      const whole = amount / divisor
      return whole.toString()
    } catch (error) {
      return "0"
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="md:col-span-1">
          <BalanceInfo address={address} />
        </div>

        <div className="md:col-span-2 bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Transaction Scanner</h2>
            <p className="text-sm text-gray-500 mt-1">Address: {address}</p>
          </div>

          <div className="p-6">
            <Tabs defaultValue="staking" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-2 mb-6">
                <TabsTrigger value="staking">Staking History ({stakingTransactions.length})</TabsTrigger>
                <TabsTrigger value="transfers">Transfers ({transferTransactions.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="staking">
                {stakingLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  </div>
                ) : stakingTransactions.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">No staking transactions found for this address</div>
                ) : (
                  <div className="w-full overflow-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Block</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Hash</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Time</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Method</th>
                          <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stakingTransactions.map((tx, index) => (
                          <tr key={index} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{tx.blockNumber}</td>
                            <td className="px-4 py-3 text-sm font-mono">
                              <a
                                href={`https://unique.subscan.io/extrinsic/${tx.hash}?tab=event`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 hover:underline"
                              >
                                {formatHash(tx.hash)}
                              </a>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">{formatDate(tx.createdAt)}</td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
                                Success
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm text-gray-700">
                                {tx.section} ({tx.method})
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-sm text-gray-900">
                              {formatAmount(tx.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="transfers">
                {transfersLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  </div>
                ) : transferTransactions.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">No transfer transactions found for this address</div>
                ) : (
                  <div className="w-full overflow-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Block</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Hash</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">To</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Method</th>
                          <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transferTransactions.map((tx, index) => (
                          <tr key={index} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{tx.blockNumber}</td>
                            <td className="px-4 py-3 text-sm font-mono">
                              <a
                                href={`https://unique.subscan.io/extrinsic/${tx.hash}?tab=event`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 hover:underline"
                              >
                                {formatHash(tx.hash)}
                              </a>
                            </td>
                            <td className="px-4 py-3 text-sm font-mono">
                              <a
                                href={`https://unique.subscan.io/account/${tx.to}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 hover:underline"
                              >
                                {formatAddress(tx.to)}
                              </a>
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
                                Success
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm text-gray-700">
                                {tx.section} ({tx.method})
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-sm text-gray-900">
                              {formatAmount(tx.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}

