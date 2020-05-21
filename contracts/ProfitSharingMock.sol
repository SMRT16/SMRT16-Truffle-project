pragma solidity >=0.4.25 <0.7.0;

import './ProfitSharingSMRT16.sol';
import './MiniMeSMRT16Token.sol';

contract ProfitSharingMock is ProfitSharingSMRT16 {

  event MockNow(uint _now, uint8 currentMonth, uint8 monthNow);

  uint mock_now = 4;

  constructor(MiniMeSMRT16Token _miniMeToken) ProfitSharingSMRT16(_miniMeToken) public {

  }

  function getNow() internal view returns (uint) {
      return mock_now;
  }

  function setMockedNow(uint _b) public {
      mock_now = _b;
      emit MockNow(_b,getCurrentMonth(),getMonthNow());
  }

}
