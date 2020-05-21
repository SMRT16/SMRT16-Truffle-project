pragma solidity >=0.4.25 <0.7.0;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/SMRT16Ext.sol";

contract TestSMRT16 {

// These all together consumes too much gas:
// MiniMeTokenFactory  _tokenFactory = new MiniMeTokenFactory();
// MiniMeSMRT16 _token = new MiniMeSMRT16(address(_tokenFactory));
// ProfitSharingSMRT16 _profitSharing = new ProfitSharingSMRT16(address(_token));
// SMRT16 smrt16 = new SMRT16(address(_tokenFactory),address(_token),address(_profitSharing));


  

  function testInitialDeployedContract() public {
    SMRT16Ext smrt16 = SMRT16Ext(DeployedAddresses.SMRT16Ext());
    Assert.equal(address(smrt16)==address(0), false, "Should be able to get deplyed contract address");
  }


  function testName() public {
    SMRT16Ext smrt16 = SMRT16Ext(DeployedAddresses.SMRT16Ext());
    Assert.equal(smrt16.name(), "SMRT16", "Should have SMRT16 name");
  }


  function testSymbol() public {
    SMRT16Ext smrt16 = SMRT16Ext(DeployedAddresses.SMRT16Ext());
    Assert.equal(smrt16.symbol(), "S16", "Should have S16 Symbol");
  }

  function testDecimals() public {
    SMRT16Ext smrt16 = SMRT16Ext(DeployedAddresses.SMRT16Ext());
    Assert.equal(smrt16.decimals()==uint8(18), true, "Should have 18 decimals");
  }

  function testMaxSupply() public {
    SMRT16Ext smrt16 = SMRT16Ext(DeployedAddresses.SMRT16Ext());
    Assert.equal(smrt16.maxSupply(), uint(160 * 10**6 * 10**18), "Should have 160 millions");
  }


  function testPrice() public {
    SMRT16Ext smrt16 = SMRT16Ext(DeployedAddresses.SMRT16Ext());
    Assert.equal(smrt16.price()==uint8(100), true, "Should be x100");
  }




}
