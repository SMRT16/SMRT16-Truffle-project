pragma solidity >=0.4.25 <0.7.0;

import "./MiniMeToken.sol";

/**
 * The MiniMeSMRT16Token is MiniMeToken ERC20 contract
 */
contract MiniMeSMRT16Token is MiniMeToken, MiniMeTokenFactory {

  constructor() MiniMeToken(address(this),address(0),uint256(0),"SMRT16",18,"S16")  public {
    
  }
  
}
