// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract X402Escrow {
    address public merchantWallet;
    uint256 public constant TIMEOUT = 15 minutes;
    
    struct Payment {
        address payer;
        uint256 amount;
        uint256 timestamp;
        bool completed;
    }
    
    mapping(bytes32 => Payment) public payments;
    
    event PaymentCreated(bytes32 indexed orderId, address payer, uint256 amount);
    event PaymentConfirmed(bytes32 indexed orderId, address confirmer);
    event PaymentRefunded(bytes32 indexed orderId);
    
    constructor(address _merchantWallet) {
        merchantWallet = _merchantWallet;
    }
    
    function createPayment(bytes32 orderId) external payable {
        require(msg.value > 0, "Must send ETH");
        require(payments[orderId].amount == 0, "Order already exists");
        
        payments[orderId] = Payment({
            payer: msg.sender,
            amount: msg.value,
            timestamp: block.timestamp,
            completed: false
        });
        
        emit PaymentCreated(orderId, msg.sender, msg.value);
    }
    
    function confirmPayment(bytes32 orderId) external {
        Payment storage payment = payments[orderId];
        require(payment.amount > 0, "Payment not found");
        require(!payment.completed, "Already completed");
        
        payment.completed = true;
        
        (bool success, ) = merchantWallet.call{value: payment.amount}("");
        require(success, "Transfer failed");
        
        emit PaymentConfirmed(orderId, msg.sender);
    }
    
    function refundExpiredPayment(bytes32 orderId) external {
        Payment storage payment = payments[orderId];
        require(payment.amount > 0, "Payment not found");
        require(!payment.completed, "Already completed");
        require(block.timestamp >= payment.timestamp + TIMEOUT, "Not expired yet");
        
        payment.completed = true;
        
        (bool success, ) = payment.payer.call{value: payment.amount}("");
        require(success, "Refund failed");
        
        emit PaymentRefunded(orderId);
    }
    
    function getPayment(bytes32 orderId) external view returns (
        address payer,
        uint256 amount,
        uint256 timestamp,
        bool completed
    ) {
        Payment memory p = payments[orderId];
        return (p.payer, p.amount, p.timestamp, p.completed);
    }
    
    function isExpired(bytes32 orderId) external view returns (bool) {
        Payment memory p = payments[orderId];
        return block.timestamp >= p.timestamp + TIMEOUT && !p.completed;
    }
}

