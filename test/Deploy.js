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
    console.log(await tokenC.decimals())
    expect(parseInt(fromWei(await tokenC.balanceOf(owner.address)))).to.equal(1000000000000);

  });
  it('Should deploy and send me tokens and send tokens to stakingC', async function () {
    await stakingC.setReceiptAddress(receiptC.address);
    await stakingC.setPayoutTokenAddress(tokenC.address);
    await tokenC.transfer(stakingC.address, toWei('10000'));
    expect(parseInt(fromWei(await tokenC.balanceOf(stakingC.address)))).to.equal(10000);


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
    console.log(await receiptC.isController(stakingC.address));
    await console.log(await nftsC.balanceOf(owner.address));
    await nftsC.setApprovalForAll(stakingC.address, true);
    await stakingC.stakeNft(1);
    const myBal = await nftsC.balanceOf(owner.address);
    const contractBal = await nftsC.balanceOf(stakingC.address);
    expect(myBal.toNumber()).to.equal(19);
    expect(contractBal.toNumber()).to.equal(1);
  });
  it('Unstake an NFT', async function () {
    const [owner] = await ethers.getSigners();
    const ogOwner = fromWei(await tokenC.balanceOf(owner.address))
    console.log('owner', fromWei(await tokenC.balanceOf(owner.address)));
    console.log('contract', fromWei(await tokenC.balanceOf(stakingC.address)));
    //
    const ogContract = fromWei(await tokenC.balanceOf(stakingC.address));
    //
    const payBefore = await stakingC.calculatePay(1);
    console.log('payBefore', fromWei(payBefore));
    await helpers.time.increase(2592000);
    const pay = await stakingC.calculatePay(1);
    console.log('payAfter', fromWei(pay));
    await stakingC.unstakeNft(1);
   console.log(await stakingC.calculatePay(1))
    const myBal = await nftsC.balanceOf(owner.address);
    const contractBal = await nftsC.balanceOf(stakingC.address);
    expect(myBal.toNumber()).to.equal(20);
    expect(contractBal.toNumber()).to.equal(0);
    const afterContract = fromWei(await tokenC.balanceOf(stakingC.address))
    expect(parseFloat((ogContract - afterContract).toFixed(2))).to.equal(6.25);

  });
});

