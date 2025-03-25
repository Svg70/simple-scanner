"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { UniqueIndexer } from "@unique-nft/sdk"

export default function BlockchainScanner() {
  const searchParams = useSearchParams()
  const address = searchParams.get("address") || "5Cnx9ZfNaSo9DeMNgjvFSqk9XiVpQ1ofX8Fourj6r5yLAtpv"

  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const indexerClient = UniqueIndexer({
          baseUrl: "https://api-unique.uniquescan.io/v2",
        })

        // Fetch transactions for the address
        const extrinsics = await indexerClient.extrinsics({
          signerIn: [address],
        })

        // Process the transactions
        const processedTransactions = extrinsics.items.map((item) => {
          // Find the relevant event for the amount
          const stakeEvent = item.events?.find((event) => event.section === "appPromotion" && event.method === "Stake")

          // Get amount from the event data
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

        setTransactions(processedTransactions)
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [address])

  // Filter transactions based on active tab
  const filteredTransactions =
    activeTab === "all"
      ? transactions
      : activeTab === "staking"
        ? transactions.filter((tx) => tx.section === "appPromotion" && tx.method === "stake")
        : transactions.filter((tx) => tx.section === "balances" && tx.method === "transfer_keep_alive")

  // Format hash for display
  const formatHash = (hash: string) => {
    if (hash.length > 20) {
      return `${hash.substring(0, 6)}...${hash.substring(hash.length - 6)}`
    }
    return hash
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toISOString().replace("T", " ").substring(0, 19) + " (UTC)"
  }

  // Format amount for display (convert from wei to a more readable format)
  const formatAmount = (amountString: string) => {
    try {
      const amount = BigInt(amountString)
      const divisor = BigInt(10 ** 18) // Assuming 18 decimals
      const whole = amount / divisor
      return whole.toString()
    } catch (error) {
      return "0"
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto bg-white rounded-lg shadow-sm border">
      <div className="px-6 py-4 border-b">
        <h2 className="text-xl font-semibold text-gray-900">Transaction Scanner</h2>
        <p className="text-sm text-gray-500 mt-1">Address: {address}</p>
      </div>
      <div className="p-6">
        <div className="w-full">
          <div className="flex space-x-1 rounded-lg bg-muted p-1 mb-6">
            <button
              className={`flex-1 justify-center rounded-md px-3 py-1.5 text-sm font-medium ${
                activeTab === "all"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-background/50"
              }`}
              onClick={() => setActiveTab("all")}
            >
              All Transactions ({transactions.length})
            </button>
            <button
              className={`flex-1 justify-center rounded-md px-3 py-1.5 text-sm font-medium ${
                activeTab === "staking"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-background/50"
              }`}
              onClick={() => setActiveTab("staking")}
            >
              Staking History (
              {transactions.filter((tx) => tx.section === "appPromotion" && tx.method === "stake").length})
            </button>
            <button
              className={`flex-1 justify-center rounded-md px-3 py-1.5 text-sm font-medium ${
                activeTab === "transfers"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-background/50"
              }`}
              onClick={() => setActiveTab("transfers")}
            >
              Transfers (
              {transactions.filter((tx) => tx.section === "balances" && tx.method === "transfer_keep_alive").length})
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No transactions found for this address</div>
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
                  {filteredTransactions.map((tx, index) => (
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
        </div>
      </div>
    </div>
  )
}

