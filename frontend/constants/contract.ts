export const CONTRACT_ADDRESS = "0x7C1bF65D5ec86b526680ec0f195C115c17a90797";

export const CONTRACT_ABI = [
  {
    inputs: [],
    name: "retrieve",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "num",
        type: "uint256"
      }
    ],
    name: "store",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  }
];