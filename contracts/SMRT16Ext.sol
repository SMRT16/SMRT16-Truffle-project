pragma solidity >=0.4.25 <0.7.0;

import "./Libraries.sol";
import "./MiniMeSMRT16Token.sol";
import "./MiniMeToken.sol";




/**
* @dev This contract createsPersonal SMRT16 contracts
*/
contract SMRT16Factory {

  // ref wallet => contract
  mapping(address => address) private contracts;

  // contract => ref wallet
  mapping(address => address) private wallets;

  // Event about a Referral bonus sent successfully
  event PersonalSMRT16(address indexed referrer, address indexed smrt16contract);

  function _createPersonalContract (address payable referrer, address payable smrt16) internal {
      if (contracts[referrer] == address(0)) {
        SMRT16Personal newContract = new SMRT16Personal(referrer, smrt16);
        emit PersonalSMRT16(referrer, smrt16);
        contracts[referrer] = address(newContract);
        wallets[address(newContract)] = referrer;
      }
  }

  function getPersonalContractAddress() external view returns (address) {
    return contracts[msg.sender];
  }


  function getPersonalContractAddressOf(address wallet) external view returns (address) {
    return contracts[wallet];
  }

  function getWalletOf(address contractAddres) external view returns (address) {
    return wallets[contractAddres];
  }

}


/**
* @dev main proxy smart contract
*/
contract SMRT16Ext is MiniMeSMRT16Token, Ownable, SMRT16Factory {

    
    // limit possible Supply of this token, 160 millions tokens
    uint constant internal _maxSupply = 160 * 10**6 * 10**18; 

    //  The price is constant untill the end of the token offering: 100 Tokens x 1 ETH
    uint constant internal _price = 100;

    //  Remember all the referrers
    mapping(address => address payable) private referrers;

    // Event about a Referral bonus sent successfully
    event Bonus(address indexed from, address indexed to, uint256 value);

    // the smrt16 companies address for bonuses
    address payable private _root;


    /**
    * @dev Constructor accept addresses of other smart contracts of the project
    * It could not be cteated striaght here due to amount of gas needed
    */
    constructor ()  public {
        _root = msg.sender;
    }

    /**
     * @dev Getter for the token price.
     */
    function price() pure public returns(uint) {
        return _price;
    }

    /**
     * @dev Getter for the token maxSupply.
     */
    function maxSupply() pure public returns(uint) {
        return _maxSupply;
    }  

 


    /*
    * @dev this function will be called after the SMRT16 smart contract deployed 
    * to pass its address here
    */
    function setProfitAddress (address payable _profitAddress) onlyOwner public {
        _root = _profitAddress;
    }
    
    /**
    * @dev Getter to check the profit gathering address
    */
    function profitAddress() view public returns (address) {
        return _root;
    }


    /**
     * @dev because the situation with empty referrer will cause a crash during giving bonuses
     * by default the address of the wallet will be used.
     * @param query the address to get referrer of
     **/
    function getReferrer(address query) public view returns (address payable) {
      if (referrers[query]==address(0)) {
          // cant have no referrer
          return _root;
      }
      return referrers[query];
    }


    /**
    * @dev fallback function
    * You supposed to put the referrer address into msg.data
    * Avoid to use this function for it's complexity, easier to use the Personal smart contracts
    * But if referrer is there from previous purchase, it is safe to use without msg.data
    */
    function () external payable {
        buyTokens(msg.sender, _bytesToAddress(bytes(msg.data)));
    }

    /**
    * @dev Token sales function
    */
    function buyTokens(address payable buyer, address payable referrer) public payable {
        require(buyer != address(0));

        uint _tokenAmount = msg.value*_price;

        _setReferrer(referrer);
        _createPersonalContract(buyer, address(this));
        _applyBonuses();
        _mint(buyer, _tokenAmount);

    }

    /**
    * @dev owner access to _mint
    */
    function mint(address _beneficiary, uint _tokenAmount) onlyOwner public {
        _mint(_beneficiary, _tokenAmount);
    }

    
    /**
    * @dev Minting the tokens
    */
    function _mint(address _owner, uint _amount)  internal {
        uint curTotalSupply = getValueAt(totalSupplyHistory, block.number);
        require (curTotalSupply + _amount <= _maxSupply); // Check for maxSupply
        updateValueAtNow(totalSupplyHistory, curTotalSupply + _amount);
        uint previousBalanceTo = balanceOf(_owner);
        require (previousBalanceTo + _amount > previousBalanceTo); // Check for overflow
        updateValueAtNow(balances[_owner], previousBalanceTo + _amount);
        emit Transfer(address(0), _owner, _amount);
    }

    /**
    * @dev simple routine function, returns minimum between two given uint256 numbers
    */
    function _min(uint256 a, uint256 b) internal pure returns(uint256) {
        if(a>b) return b;
        return a;
    }

    /**
     * @dev sets the referrer who will receive the bonus
     * @param _referrer where address must have non zero balance
     **/
    function _setReferrer(address payable _referrer) internal returns (address) {
      // let it set but not change
      if(referrers[msg.sender]==address(0)) {
        // referrer should be already a one who has non-zero balance
        if(balanceOf(_referrer)>uint(0)) {
            referrers[msg.sender] = _referrer;
        }
      }
      return referrers[msg.sender];
    }

    
    
    /**
    * @dev The function which does the actual referrals payments 
    * Logic: 1st receives 50%, 2nd - 25%, 3rd - 12.5%, 4th - 6.125%
    * Emits Bonus event, notifiying about bonuses payed
    **/
    function _applyBonuses() internal {
        // Amount of tokens to be sent for the price
        uint256 d16 = msg.value*_price;

        // The amount is too small to generate any bonuses (less than 16 Weis)
        if(d16<16) return;

        uint256 d8 = d16 / 2; 
        uint256 d4 = d8 / 2;
        uint256 d2 = d4 / 2;
        uint256 d1 = d2 / 2;


        address payable r1 = getReferrer(msg.sender);
        uint r1d8 = _min(d8, balanceOf(r1)/2)/_price;  
        if(r1.send(r1d8)==true) {
            emit Bonus(address(this), r1, r1d8);
        }
        address payable r2 = getReferrer(r1);
        uint r2d4 = _min(d4, balanceOf(r2)/4)/_price;
        if(r2.send(r2d4)==true) {
            emit Bonus(address(this), r2, r2d4);
        }
        address payable r3 = getReferrer(r2);
        uint r3d2 = _min(d2, balanceOf(r3)/8)/_price;
        if(r3.send(r3d2)==true) {
            emit Bonus(address(this), r3, r3d2);
        }
        address payable r4 = getReferrer(r3);
        uint r4d1 = _min(d1, balanceOf(r4)/16)/_price;
        if(r4.send(r4d1)==true) {
            emit Bonus(address(this), r4, r4d1);
        }
    }

    /**
    * @dev transfer to profit gathering account, for the case if something remain
    * to perform a manual clearence 
    */
    function withdraw(uint256 amount) onlyOwner public returns(bool) {
      _root.transfer(amount);
      return true;
    }


    /**
    * @dev converts string in bytes of the address to address data type
    * @param b is a string in bytes to be converted
    **/
    function _bytesToAddress(bytes memory b) internal pure returns (address payable) {
      uint result = 0;
      for (uint i = b.length-1; i+1 > 0; i--) {
        uint c = uint(uint8(b[i]));
        uint to_inc = c * ( 16 ** ((b.length - i-1) * 2));
        result += to_inc;
      }
      return address(result);
    }
  
}


/**
* @dev the main bone which makes referral program easy 
*/
contract SMRT16Personal {
  // address of the guy who invated you
  address payable private _referrer;

  // reference to the parent smart contract
  SMRT16Ext private _smrt16;

  // Event which notifies about new Personal Smart contract created
  event CreatedSMRT16Personal(address indexed addr);

  /**
  * @dev every participant of the project will have his own smart contract
  * which he will be able to share to his referrals
  * this smart contract does proxy sales of the tokens 
  * and unsure that the referrals structure is right
  */
  constructor(address payable referrer, address payable smrt16) public {
    _referrer = referrer;
    _smrt16 = SMRT16Ext(smrt16);
    emit CreatedSMRT16Personal(address(this));
  }

  

  /**
  * @dev fallback function
  */
  function () external payable {
      _smrt16.buyTokens.value(msg.value)(msg.sender, _referrer);
  }
    
}
