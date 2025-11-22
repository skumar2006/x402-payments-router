export const escrowABI = [
  {
    inputs: [{ internalType: "address", name: "_merchantWallet", type: "address" }],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "bytes32", name: "orderId", type: "bytes32" },
      { indexed: false, internalType: "address", name: "confirmer", type: "address" },
    ],
    name: "PaymentConfirmed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "bytes32", name: "orderId", type: "bytes32" },
      { indexed: false, internalType: "address", name: "payer", type: "address" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "PaymentCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "bytes32", name: "orderId", type: "bytes32" },
    ],
    name: "PaymentRefunded",
    type: "event",
  },
  {
    inputs: [],
    name: "TIMEOUT",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "orderId", type: "bytes32" }],
    name: "confirmPayment",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "orderId", type: "bytes32" }],
    name: "createPayment",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "orderId", type: "bytes32" }],
    name: "getPayment",
    outputs: [
      { internalType: "address", name: "payer", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
      { internalType: "uint256", name: "timestamp", type: "uint256" },
      { internalType: "bool", name: "completed", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "orderId", type: "bytes32" }],
    name: "isExpired",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "merchantWallet",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    name: "payments",
    outputs: [
      { internalType: "address", name: "payer", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
      { internalType: "uint256", name: "timestamp", type: "uint256" },
      { internalType: "bool", name: "completed", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "orderId", type: "bytes32" }],
    name: "refundExpiredPayment",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

