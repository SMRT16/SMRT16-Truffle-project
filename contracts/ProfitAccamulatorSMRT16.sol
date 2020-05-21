pragma solidity >=0.4.25 <0.7.0;

import './ProfitSharingSMRT16.sol';

/**
 * The ProfitAccamulatorSMRT16 contract does this and that...
 */
contract ProfitAccamulatorSMRT16 {

  // Event about payable function called deposit
  event ProfitDeposit(uint amount);


  event PayableEnter(uint amount, bool canDeposit);

  ProfitSharingSMRT16 _profitSharing;
  constructor(ProfitSharingSMRT16 _profitSharingSMRT16) public {
    _profitSharing = _profitSharingSMRT16;
  }

 /**
  * @dev fallback function
  * The place where the project gather its profit
  * All the gathered ETH will be available for the SMRT16 Tokens stake holders
  * Dividends distributeed simply proportionally monthly
  */
  function () external payable {
    bool doDeposit = _profitSharing.canDepositNow();
    uint balance = address(this).balance;
    emit PayableEnter(balance, doDeposit);
    if(doDeposit) {
      _profitSharing.depositDividend.value(balance)();
      emit ProfitDeposit(balance);
    }
  }
}

