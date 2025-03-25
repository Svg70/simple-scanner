"use client"

import BlockchainScanner from "./blockchain-scanner"

export default function BlockchainScannerWrapper({
  defaultAddress,
}: {
  defaultAddress?: string
}) {

  return <BlockchainScanner defaultAddress={defaultAddress} />
}

