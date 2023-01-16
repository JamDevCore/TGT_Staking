const { expect } = require('chai');
const hre = require('hardhat');
const { ethers } = hre;
const helpers = require("@nomicfoundation/hardhat-network-helpers")

let stakingC;
let receiptC;
let tokenC;
let nftsC;


const toWei = ethers.utils.parseEther;
const fromWei = ethers.utils.formatEther;
// 0x5FbDB2315678afecb367f032d93F642f64180aa3
//0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512 
describe('Contract deploy', function () {
  it('Deployment should work', async function () {

    const StakingContract = await ethers.getContractFactory('NFTstaking' );
    stakingC = await StakingContract.deploy();
    const ReceiptContract = await ethers.getContractFactory('NFTreceipt');
    receiptC = await ReceiptContract.deploy();

  });
  it('Should assign receipt variable', async function () {

    await stakingC.setReceiptAddress(receiptC.address);

  });
  it('Should deploy and send me tokens', async function () {
    const [owner] = await ethers.getSigners();
    const TokenContract = await ethers.getContractFactory('GLDToken');
    tokenC = await TokenContract.deploy();
    expect(parseInt(fromWei(await tokenC.balanceOf(owner.address)))).to.equal(1000000000000);
  });
  it('Should deploy and send me tokens and send tokens to stakingC', async function () {
    await stakingC.setReceiptAddress(receiptC.address);
    await stakingC.setPayoutTokenAddress(tokenC.address);
    await tokenC.transfer(stakingC.address, toWei('10000'));
    expect(parseInt(fromWei(await tokenC.balanceOf(stakingC.address)))).to.equal(10000);


  });
  it('Should deposit tokens into contract', async function () {
    await tokenC.approve(stakingC.address, toWei('1000'))
    const prevBalContract = await tokenC.balanceOf(stakingC.address);
    await stakingC.depositTokens(toWei('1000'));
    expect(fromWei(prevBalContract) - fromWei(await tokenC.balanceOf(stakingC.address)));

  });

  it('Should withdraw payout tokens from contract', async function () {
    const prevBalContract = await tokenC.balanceOf(stakingC.address);
    await stakingC.withdrawFunds(toWei('2500'));
    const afterBal  =await tokenC.balanceOf(stakingC.address);
    expect(fromWei(prevBalContract) -fromWei(afterBal)).to.equal(2500);
  });
  it('Should deploy and mint NFTs to my wallet', async function () {
    const [owner] = await ethers.getSigners();
    const TrueGoldNFTs = await ethers.getContractFactory('TrueGoldNFTs');
    nftsC = await TrueGoldNFTs.deploy('TGT', 'TGTNFT', 'ipfs://', 'ipfs://');
    await nftsC.mint(owner.address, 20);
    await stakingC.setNftAddress(nftsC.address);
    const balance = await nftsC.balanceOf(owner.address);
    console.log('nft', balance.toNumber());
    expect(balance.toNumber()).to.equal(20);

  });
  it('Stake an NFT', async function () {
    const [owner] = await ethers.getSigners();
    await receiptC.addController(stakingC.address);
    await nftsC.setApprovalForAll(stakingC.address, true);
    await stakingC.stakeNft(1);
    const myBal = await nftsC.balanceOf(owner.address);
    const contractBal = await nftsC.balanceOf(stakingC.address);
    expect(myBal.toNumber()).to.equal(19);
    expect(contractBal.toNumber()).to.equal(1);
  });
  it('Unstake an NFT', async function () {
    const [owner] = await ethers.getSigners();
    const ogContract = fromWei(await tokenC.balanceOf(stakingC.address));
    await helpers.time.increase(2592000);
    expect(await stakingC.calculatePay(1)).to.equal('6250000000000000000');
    await stakingC.unstakeNft(1);
    const myBal = await nftsC.balanceOf(owner.address);
    const contractBal = await nftsC.balanceOf(stakingC.address);
    expect(myBal.toNumber()).to.equal(20);
    expect(contractBal.toNumber()).to.equal(0);
    const afterContract = fromWei(await tokenC.balanceOf(stakingC.address));
    expect(parseFloat((ogContract - afterContract).toFixed(2))).to.equal(6.25);

  });

  it('Stake multiple NFTs', async function () {
    const [owner] = await ethers.getSigners();
    const myIds = [1,2,3,4,5,6,7,8,9,10];
    await stakingC.bulkStake(myIds);
    const myBal = await nftsC.balanceOf(owner.address);
    const contractBal = await nftsC.balanceOf(stakingC.address);
    const myReceiptBal = await receiptC.balanceOfBatch(myIds.map(() => owner.address), myIds);
    myReceiptBal.forEach((r) => {
      expect(r.toNumber()).to.equal(1);
    });
    expect(myBal.toNumber()).to.equal(10);
    expect(contractBal.toNumber()).to.equal(10);
  });
  
  it('Unstakes multiple NFTs, calculate pay', async function () {
    const [owner] = await ethers.getSigners();
    const ogContract = fromWei(await tokenC.balanceOf(stakingC.address));
    await helpers.time.increase(2592000);
    const pay = await stakingC.bulkCalculatePay([1,2,3,4,5,6,7,8,9,10]);
    expect(fromWei(pay)).to.equal('62.5');
    await stakingC.bulkUnstake([1,2,3,4,5,6,7,8,9,10]);
    const myBal = await nftsC.balanceOf(owner.address);
    const contractBal = await nftsC.balanceOf(stakingC.address);
    expect(myBal.toNumber()).to.equal(20);
    expect(contractBal.toNumber()).to.equal(0);
    const afterContract = fromWei(await tokenC.balanceOf(stakingC.address));
    expect(parseFloat((ogContract - afterContract).toFixed(2))).to.equal((625 * [1,2,3,4,5,6,7,8,9,10].length) /100);
  });
  it('can unstake an NFT in an emegergency without receiving funds', async () => {
    const [owner] = await ethers.getSigners();
    await stakingC.stakeNft(1);
    await stakingC.emergencyWithdrawWithoutFunds(1);
    const recBalance = await receiptC.balanceOf(owner.address, 1);
    expect(recBalance.toNumber()).to.equal(0);
  });
});

