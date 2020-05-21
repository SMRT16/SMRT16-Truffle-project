pragma solidity >=0.4.25 <0.7.0;

import './ProfitAccamulatorSMRT16.sol';
import './ProfitSharingMock.sol';

/**
 * The ProfitAccamulatorSMRT16 contract does this and that...
 */
contract ProfitAccamulatorMock is ProfitAccamulatorSMRT16  {

  ProfitSharingSMRT16 _profitSharing;
  constructor(ProfitSharingMock _profitSharingSMRT16) ProfitAccamulatorSMRT16( ProfitSharingSMRT16(_profitSharingSMRT16)) public {

  }
}


