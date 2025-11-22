const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("X402Escrow", function () {
  let escrow, merchant, user, backend;
  
  beforeEach(async function () {
    [merchant, user, backend] = await ethers.getSigners();
    
    const X402Escrow = await ethers.getContractFactory("X402Escrow");
    escrow = await X402Escrow.deploy(merchant.address);
    await escrow.waitForDeployment();
  });
  
  describe("Payment Creation", function () {
    it("Should create payment with correct details", async function () {
      const orderId = ethers.id("order123");
      const amount = ethers.parseEther("0.01");
      
      await expect(escrow.connect(user).createPayment(orderId, { value: amount }))
        .to.emit(escrow, "PaymentCreated")
        .withArgs(orderId, user.address, amount);
      
      const payment = await escrow.getPayment(orderId);
      expect(payment.payer).to.equal(user.address);
      expect(payment.amount).to.equal(amount);
      expect(payment.completed).to.be.false;
    });
    
    it("Should reject payment with no ETH", async function () {
      const orderId = ethers.id("order123");
      
      await expect(
        escrow.connect(user).createPayment(orderId, { value: 0 })
      ).to.be.revertedWith("Must send ETH");
    });
    
    it("Should reject duplicate order IDs", async function () {
      const orderId = ethers.id("order123");
      const amount = ethers.parseEther("0.01");
      
      await escrow.connect(user).createPayment(orderId, { value: amount });
      
      await expect(
        escrow.connect(user).createPayment(orderId, { value: amount })
      ).to.be.revertedWith("Order already exists");
    });
  });
  
  describe("Payment Confirmation", function () {
    it("Should confirm payment and send to merchant", async function () {
      const orderId = ethers.id("order123");
      const amount = ethers.parseEther("0.01");
      
      await escrow.connect(user).createPayment(orderId, { value: amount });
      
      const merchantBalanceBefore = await ethers.provider.getBalance(merchant.address);
      
      await expect(escrow.connect(backend).confirmPayment(orderId))
        .to.emit(escrow, "PaymentConfirmed")
        .withArgs(orderId, backend.address);
      
      const merchantBalanceAfter = await ethers.provider.getBalance(merchant.address);
      expect(merchantBalanceAfter - merchantBalanceBefore).to.equal(amount);
      
      const payment = await escrow.getPayment(orderId);
      expect(payment.completed).to.be.true;
    });
    
    it("Should reject confirmation of non-existent payment", async function () {
      const orderId = ethers.id("nonexistent");
      
      await expect(
        escrow.connect(backend).confirmPayment(orderId)
      ).to.be.revertedWith("Payment not found");
    });
    
    it("Should reject double confirmation", async function () {
      const orderId = ethers.id("order123");
      const amount = ethers.parseEther("0.01");
      
      await escrow.connect(user).createPayment(orderId, { value: amount });
      await escrow.connect(backend).confirmPayment(orderId);
      
      await expect(
        escrow.connect(backend).confirmPayment(orderId)
      ).to.be.revertedWith("Already completed");
    });
  });
  
  describe("Payment Refund", function () {
    it("Should refund after timeout", async function () {
      const orderId = ethers.id("order123");
      const amount = ethers.parseEther("0.01");
      
      await escrow.connect(user).createPayment(orderId, { value: amount });
      
      await expect(
        escrow.connect(user).refundExpiredPayment(orderId)
      ).to.be.revertedWith("Not expired yet");
      
      await time.increase(15 * 60);
      
      const userBalanceBefore = await ethers.provider.getBalance(user.address);
      
      const tx = await escrow.connect(user).refundExpiredPayment(orderId);
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      
      const userBalanceAfter = await ethers.provider.getBalance(user.address);
      
      expect(userBalanceAfter - userBalanceBefore + gasUsed).to.equal(amount);
      
      const payment = await escrow.getPayment(orderId);
      expect(payment.completed).to.be.true;
    });
    
    it("Should check if payment is expired", async function () {
      const orderId = ethers.id("order123");
      const amount = ethers.parseEther("0.01");
      
      await escrow.connect(user).createPayment(orderId, { value: amount });
      
      expect(await escrow.isExpired(orderId)).to.be.false;
      
      await time.increase(15 * 60);
      
      expect(await escrow.isExpired(orderId)).to.be.true;
    });
    
    it("Should not refund confirmed payment", async function () {
      const orderId = ethers.id("order123");
      const amount = ethers.parseEther("0.01");
      
      await escrow.connect(user).createPayment(orderId, { value: amount });
      await escrow.connect(backend).confirmPayment(orderId);
      
      await time.increase(15 * 60);
      
      await expect(
        escrow.connect(user).refundExpiredPayment(orderId)
      ).to.be.revertedWith("Already completed");
    });
  });
});

