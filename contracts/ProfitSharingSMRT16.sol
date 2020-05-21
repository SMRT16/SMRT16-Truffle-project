pragma solidity >=0.4.25 <0.7.0;


import './MiniMeToken.sol';
import "./Libraries.sol";
import "./DateRoutine.sol";

contract ProfitSharingSMRT16 is Ownable, DateRoutine {
  using SafeMath for uint;

  // Events notifiying about operations with dividends
  event DividendDeposited(address indexed _depositor, uint256 _blockNumber, uint256 _amount, uint256 _totalSupply, uint256 _dividendIndex);
  event DividendClaimed(address indexed _claimer, uint256 _dividendIndex, uint256 _claim);
  event DividendRecycled(address indexed _recycler, uint256 _blockNumber, uint256 _amount, uint256 _totalSupply, uint256 _dividendIndex);

  event DividendClaimTry(address indexed _claimer, uint256 _dividendIndex, uint256 _claim, uint256 balance, uint256 supply);

  // Proportionally to the stakes of this token
  MiniMeToken public miniMeToken;

  uint8 private _currentMonth;

  constructor(MiniMeToken _miniMeToken) public {
    miniMeToken = _miniMeToken;
    _currentMonth = getMonth(getNow());
  }




  modifier whenCanDeposit() { 
    if(canDepositNow()) {
      _; 
      _currentMonth = getMonth(getNow());
    }
  }



  modifier validDividendIndex(uint _dividendIndex) {
    require(_dividendIndex < dividends.length);
    _;
  }

  struct Dividend {
    uint256 blockNumber;
    uint256 timestamp;
    uint256 amount;
    uint256 claimedAmount;
    uint256 totalSupply;
    mapping (address => bool) claimed;
  }

  Dividend[12] public dividends;

  mapping (address => uint256) dividendsClaimed;


  function depositDividend() whenCanDeposit public payable
  {
    uint256 blockNumber = block.number;//SafeMath.sub(block.number, 1);
    uint256 currentSupply = miniMeToken.totalSupplyAt(blockNumber);

    Dividend storage record = dividends[_currentMonth-1];
    if(record.blockNumber==0) {
      record.amount = msg.value;
    } else {
      // @notice Transfer not claimed amount to the new record, recycle 
      // So, dont not forget to claim your dividends at least once per year
      uint256 oldValue = SafeMath.sub(record.amount,record.claimedAmount);
      record.amount = SafeMath.add(oldValue,msg.value);
      emit DividendRecycled(msg.sender, blockNumber, oldValue, currentSupply, _currentMonth);
    }

    record.blockNumber = blockNumber;
    record.timestamp = getNow();
    record.claimedAmount = 0;
    record.totalSupply = currentSupply;

    emit DividendDeposited(msg.sender, blockNumber, record.amount, currentSupply, _currentMonth);
  }

  /**
  * @dev call this function to get you part of the profit
  * 
  */
  function claimDividend(uint256 _dividendIndex) public
  validDividendIndex(_dividendIndex)
  {
    Dividend storage dividend = dividends[_dividendIndex];
    require (_dividendIndex!=_currentMonth);
    if(dividend.blockNumber!=0) {
      revert();
      require(dividend.claimed[msg.sender] == false);
      uint256 balance = miniMeToken.balanceOfAt(msg.sender, dividend.blockNumber);
      uint256 claim = balance.mul(dividend.amount).div(dividend.totalSupply);
      dividend.claimed[msg.sender] = true;
      dividend.claimedAmount = SafeMath.add(dividend.claimedAmount, claim);
      emit DividendClaimTry(msg.sender, _dividendIndex, claim, balance, dividend.totalSupply);
      if (claim > 0) {
        msg.sender.transfer(claim);
        emit DividendClaimed(msg.sender, _dividendIndex, claim);
      }
    } 
  }

  /**
  * @dev fallback function
  * ETH paid to this account will be returned
  */
  function () external payable {
    claimDividendAll();
    msg.sender.transfer(msg.value);
  }

  

  /**
  * @dev call this function to get all your available dividends
  */
  function claimDividendAll() public {
    for (uint i = 0; i < dividends.length; i++) {
      if(dividends[i].blockNumber!=0) {
        if(i==_currentMonth) continue;
        if ((dividends[i].claimed[msg.sender] == false)) {
          claimDividend(i);
        }
      }
    }
  }

  /**
  * @dev Getter on the smart contract current month state
  */
  function getCurrentMonth () public view returns(uint8) {
    return _currentMonth;
  }

  /**
  * @dev Getter of the current month on the blockchain
  */
  function getMonthNow() public view returns(uint8) {
    return getMonth(getNow());
  }
  
  /**
  * @dev True if smart contracts current month is not equal to current blockchain month
  * happens because of the time goes
  */
  function canDepositNow() public view returns(bool) {
    return _currentMonth != getMonth(getNow());
  }


  //Function is mocked for tests
  function getNow() internal view returns (uint256) {
    return now;
  }



}


