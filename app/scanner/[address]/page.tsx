import { Suspense } from "react"
import BlockchainScannerWrapper from "@/components/blockchain-scanner-wrapper"

export default function AddressScannerPage({ params }: { params: { address: string } }) {
  return (
    <div className="container mx-auto py-8">
      <Suspense fallback={<div className="text-center py-12">Loading scanner...</div>}>
        <BlockchainScannerWrapper defaultAddress={params.address} />
      </Suspense>
    </div>
  )
}

