const hre = require("hardhat");
const { ethers } = hre;
async function main () {
  // We get the contract to deploy
  const Staking = await ethers.getContractFactory('NFTstaking');
  const Receipt = await ethers.getContractFactory('NFTreceipt');
  console.log('Deploying Box...');
  const box = await Staking.deploy();
  await box.deployed();
  const rec = await Receipt.deploy();
  await rec.deployed();
  console.log('Box deployed to:', box.address);
  console.log('Box deployed to:', rec.address);
}
  
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });