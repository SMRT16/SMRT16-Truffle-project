const ProfitSharingSMRT16 = artifacts.require("ProfitSharingSMRT16");
const ProfitAccamulatorSMRT16 = artifacts.require("ProfitAccamulatorSMRT16");
const SMRT16 = artifacts.require("SMRT16Ext");
const ProfitSharingMock = artifacts.require("ProfitSharingMock");
const ProfitAccamulatorMock = artifacts.require("ProfitAccamulatorMock");

module.exports = async function(deployer) {

    await deployer.deploy(SMRT16);

    await deployer.deploy(ProfitSharingSMRT16, SMRT16.address);
    await deployer.deploy(ProfitSharingMock, SMRT16.address);

  	await deployer.deploy(ProfitAccamulatorSMRT16, ProfitSharingSMRT16.address);
  	await deployer.deploy(ProfitAccamulatorMock, ProfitSharingMock.address);

  	
};
