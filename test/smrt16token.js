const SMRT16 = artifacts.require("SMRT16Ext");
const ProfitSharingMock = artifacts.require("ProfitSharingMock");
//const ProfitAccamulatorSMRT16  = artifacts.require("ProfitAccamulatorSMRT16");
const ProfitAccamulatorMock =  artifacts.require("ProfitAccamulatorMock");

const ONEETHER  = 1000000;
const TWOETHER  = 2000000;
const THREETHER = 3000000;
const YEAR = 86400 * 366;
const MONTH = 86400 * 30;
const gasPrice = 10;

contract('SMRT16', (accounts) => {
  it('buy 100 SMRT16 for 1ETH', async () => {
    const SMRT16Instance = await SMRT16.deployed();
    var totalSupplyBefore = await SMRT16Instance.totalSupply.call({from:accounts[0]});
    var balanceBefore = await SMRT16Instance.balanceOf.call(accounts[0]);
    await SMRT16Instance.sendTransaction({from: accounts[0], value: ONEETHER});
    var balance = await SMRT16Instance.balanceOf.call(accounts[0]);
    var totalSupplyAfter = await SMRT16Instance.totalSupply.call({from:accounts[0]});

    assert.equal(balance.valueOf().toNumber(), balanceBefore.valueOf().toNumber()+100*ONEETHER, "100.0S16 wasn't in the first account");
    assert.equal(totalSupplyAfter.valueOf().toNumber(), totalSupplyBefore.valueOf().toNumber()+100*ONEETHER, "100.0S16 wasn't in the first account");
  });


  it('buy 200 SMRT16 for 2ETH', async () => {
    const SMRT16Instance = await SMRT16.deployed();
    var totalSupplyBefore = await SMRT16Instance.totalSupply.call({from:accounts[1]});
    var balanceBefore = await SMRT16Instance.balanceOf.call(accounts[1]);
    await SMRT16Instance.sendTransaction({from: accounts[1], value: TWOETHER, data:accounts[0]});
    var totalSupplyAfter = await SMRT16Instance.totalSupply.call({from:accounts[1]});
    var balance = await SMRT16Instance.balanceOf.call(accounts[1]);

    assert.equal(totalSupplyAfter.valueOf().toNumber(), totalSupplyBefore.valueOf().toNumber()+200*ONEETHER, "100.0S16 wasn't in the first account");
    assert.equal(balance.valueOf().toNumber(), balanceBefore.valueOf().toNumber()+200*ONEETHER, "100.0S16 wasn't in the first account");
  });

  it('should send tokens correctly', async () => {
    const SMRT16Instance = await SMRT16.deployed();

    // Setup 2 accounts.
    const accountOne = accounts[0];
    const accountTwo = accounts[1];

    SMRT16Instance.sendTransaction({from: accounts[0], value: THREETHER});

    // Get initial balances of first and second account.
    const accountOneStartingBalance = (await SMRT16Instance.balanceOf.call(accountOne)).toNumber();
    const accountTwoStartingBalance = (await SMRT16Instance.balanceOf.call(accountTwo)).toNumber();

    // Make transaction from first account to second.
    const amount = 10000;
    await SMRT16Instance.transfer(accountTwo, amount, { from: accountOne });

    // Get balances of first and second account after the transactions.
    const accountOneEndingBalance = (await SMRT16Instance.balanceOf.call(accountOne)).toNumber();
    const accountTwoEndingBalance = (await SMRT16Instance.balanceOf.call(accountTwo)).toNumber();


    assert.equal(accountOneEndingBalance, accountOneStartingBalance - amount, "Amount wasn't correctly taken from the sender");
    assert.equal(accountTwoEndingBalance, accountTwoStartingBalance + amount, "Amount wasn't correctly sent to the receiver");
  });


  it('should pay bonuses correctly', async () => {
    const SMRT16Instance = await SMRT16.deployed();
    var balancesBefore = [];
    var balancesAfter = [];
    var gasCost = [];


    // remember the balances before the control transfer
    balancesBefore[0] = await web3.eth.getBalance(accounts[0]);
    balancesBefore[1] = await web3.eth.getBalance(accounts[1]);
    balancesBefore[2] = await web3.eth.getBalance(accounts[2]);
    balancesBefore[3] = await web3.eth.getBalance(accounts[3]);
    balancesBefore[4] = await web3.eth.getBalance(accounts[4]);
    balancesBefore[5] = await web3.eth.getBalance(accounts[5]);
    balancesBefore[6] = await web3.eth.getBalance(accounts[6]);

    // 1st user buys and he is his ref hisself
    gasCost[0]=(await SMRT16Instance.sendTransaction({from: accounts[0], value: ONEETHER, data:accounts[0], gasPrice: gasPrice})).receipt.gasUsed * gasPrice;
    balancesAfter[0] = (await web3.eth.getBalance(accounts[0]));
    assert.equal((Number(balancesAfter[0])-Number(balancesBefore[0])-Number(gasCost[0]))<10000, true, "all the transfers in this case goes to the root");
    balancesBefore[0] = await web3.eth.getBalance(accounts[0]);

    // 2nd user buys and have 1st as his ref
    gasCost[1]=(await SMRT16Instance.sendTransaction({from: accounts[1], value: ONEETHER, data:accounts[0], gasPrice: gasPrice})).receipt.gasUsed * gasPrice;
    balancesAfter[0] = (await web3.eth.getBalance(accounts[0]));
    balancesAfter[1] = (await web3.eth.getBalance(accounts[1]));
    assert.equal((Number(balancesAfter[0])-Number(balancesBefore[0])-Number(gasCost[0]) - ONEETHER)<10000, true, "Root gets now all the level bonuses");
    assert.equal((Number(balancesAfter[1])-Number(balancesBefore[1])-Number(gasCost[1]) + ONEETHER)<10000, true, "Second is just spender now");
    balancesBefore[0] = await web3.eth.getBalance(accounts[0]);
    balancesBefore[1] = await web3.eth.getBalance(accounts[1]);

    // 3d user case: 2nd is his ref
    gasCost[2]=(await SMRT16Instance.sendTransaction({from: accounts[2], value: ONEETHER, data:accounts[1], gasPrice: gasPrice})).receipt.gasUsed * gasPrice;
    balancesAfter[0] = (await web3.eth.getBalance(accounts[0]));
    balancesAfter[1] = (await web3.eth.getBalance(accounts[1]));
    balancesAfter[2] = (await web3.eth.getBalance(accounts[2]));
    assert.equal((Number(balancesAfter[0])-Number(balancesBefore[0])-Number(gasCost[0]) - ONEETHER/2)<10000, true, "Root gets now all 1/2 the rest level bonuses");
    assert.equal((Number(balancesAfter[1])-Number(balancesBefore[1])-Number(gasCost[1]) - ONEETHER/2)<10000, true, "Second gets 1/2");
    assert.equal((Number(balancesAfter[2])-Number(balancesBefore[2])-Number(gasCost[2]) + ONEETHER)<10000, true, "Third is just spender now");
    balancesBefore[0] = await web3.eth.getBalance(accounts[0]);
    balancesBefore[1] = await web3.eth.getBalance(accounts[1]);
    balancesBefore[2] = await web3.eth.getBalance(accounts[2]);

    // 4th gets 3rd
    gasCost[3]=(await SMRT16Instance.sendTransaction({from: accounts[3], value: ONEETHER, data:accounts[2], gasPrice: gasPrice})).receipt.gasUsed * gasPrice;
    balancesAfter[0] = (await web3.eth.getBalance(accounts[0]));
    balancesAfter[1] = (await web3.eth.getBalance(accounts[1]));
    balancesAfter[2] = (await web3.eth.getBalance(accounts[2]));
    balancesAfter[3] = (await web3.eth.getBalance(accounts[3]));
    assert.equal((Number(balancesAfter[0])-Number(balancesBefore[0])-Number(gasCost[0]) - ONEETHER/4)<10000, true, "Root gets now 1/4 all the rest level bonuses");
    assert.equal((Number(balancesAfter[1])-Number(balancesBefore[1])-Number(gasCost[1]) - ONEETHER/4)<10000, true, "2nd gets 1/4");
    assert.equal((Number(balancesAfter[2])-Number(balancesBefore[2])-Number(gasCost[2]) - ONEETHER/2)<10000, true, "3rd gets 1/2");
    assert.equal((Number(balancesAfter[3])-Number(balancesBefore[3])-Number(gasCost[3]) + ONEETHER)<10000, true, "4th is just spender now");
    balancesBefore[0] = await web3.eth.getBalance(accounts[0]);
    balancesBefore[1] = await web3.eth.getBalance(accounts[1]);
    balancesBefore[2] = await web3.eth.getBalance(accounts[2]);
    balancesBefore[3] = await web3.eth.getBalance(accounts[3]);


    // 5th gets 4th
    gasCost[4]=(await SMRT16Instance.sendTransaction({from: accounts[4], value: ONEETHER, data:accounts[3], gasPrice: gasPrice})).receipt.gasUsed * gasPrice;
    balancesAfter[0] = (await web3.eth.getBalance(accounts[0]));
    balancesAfter[1] = (await web3.eth.getBalance(accounts[1]));
    balancesAfter[2] = (await web3.eth.getBalance(accounts[2]));
    balancesAfter[3] = (await web3.eth.getBalance(accounts[3]));
    balancesAfter[4] = (await web3.eth.getBalance(accounts[4]));
    assert.equal((Number(balancesAfter[0])-Number(balancesBefore[0])-Number(gasCost[0]) - ONEETHER/8)<10000, true, "Root gets now 1/8 all the rest level bonuses");
    assert.equal((Number(balancesAfter[1])-Number(balancesBefore[1])-Number(gasCost[1]) - ONEETHER/8)<10000, true, "2nd gets 1/8");
    assert.equal((Number(balancesAfter[2])-Number(balancesBefore[2])-Number(gasCost[2]) - ONEETHER/4)<10000, true, "3rd gets 1/4");
    assert.equal((Number(balancesAfter[3])-Number(balancesBefore[3])-Number(gasCost[3]) - ONEETHER/2)<10000, true, "4th gets 1/2");
    assert.equal((Number(balancesAfter[4])-Number(balancesBefore[4])-Number(gasCost[4]) + ONEETHER)<10000, true, "5th is just spender now");
    balancesBefore[0] = await web3.eth.getBalance(accounts[0]);
    balancesBefore[1] = await web3.eth.getBalance(accounts[1]);
    balancesBefore[2] = await web3.eth.getBalance(accounts[2]);
    balancesBefore[3] = await web3.eth.getBalance(accounts[3]);
    balancesBefore[4] = await web3.eth.getBalance(accounts[4]);

  
    // 6th gets 5th
    gasCost[5]=(await SMRT16Instance.sendTransaction({from: accounts[5], value: ONEETHER, data:accounts[4], gasPrice: gasPrice})).receipt.gasUsed * gasPrice;
    balancesAfter[0] = (await web3.eth.getBalance(accounts[0]));
    balancesAfter[1] = (await web3.eth.getBalance(accounts[1]));
    balancesAfter[2] = (await web3.eth.getBalance(accounts[2]));
    balancesAfter[3] = (await web3.eth.getBalance(accounts[3]));
    balancesAfter[4] = (await web3.eth.getBalance(accounts[4]));
    balancesAfter[5] = (await web3.eth.getBalance(accounts[5]));
    assert.equal((Number(balancesAfter[0])-Number(balancesBefore[0])-Number(gasCost[0]) - ONEETHER/16)<10000, true, "Root gets now 1/16 all the rest level bonuses");
    assert.equal((Number(balancesAfter[1])-Number(balancesBefore[1])-Number(gasCost[1]) - ONEETHER/16)<10000, true, "2nd gets 1/16");
    assert.equal((Number(balancesAfter[2])-Number(balancesBefore[2])-Number(gasCost[2]) - ONEETHER/8)<10000, true, "3rd gets 1/8");
    assert.equal((Number(balancesAfter[3])-Number(balancesBefore[3])-Number(gasCost[3]) - ONEETHER/4)<10000, true, "4th gets 1/4");
    assert.equal((Number(balancesAfter[4])-Number(balancesBefore[4])-Number(gasCost[4]) - ONEETHER/2)<10000, true, "5th gets 1/2");
    assert.equal((Number(balancesAfter[5])-Number(balancesBefore[5])-Number(gasCost[5]) + ONEETHER)<10000, true, "6th is just spender now");
    balancesBefore[0] = await web3.eth.getBalance(accounts[0]);
    balancesBefore[1] = await web3.eth.getBalance(accounts[1]);
    balancesBefore[2] = await web3.eth.getBalance(accounts[2]);
    balancesBefore[3] = await web3.eth.getBalance(accounts[3]);
    balancesBefore[4] = await web3.eth.getBalance(accounts[4]);
    balancesBefore[5] = await web3.eth.getBalance(accounts[5]);

    // 7th gets 6th
    gasCost[6]=(await SMRT16Instance.sendTransaction({from: accounts[6], value: ONEETHER, data:accounts[5], gasPrice: gasPrice})).receipt.gasUsed * gasPrice;
    balancesAfter[0] = (await web3.eth.getBalance(accounts[0]));
    balancesAfter[1] = (await web3.eth.getBalance(accounts[1]));
    balancesAfter[2] = (await web3.eth.getBalance(accounts[2]));
    balancesAfter[3] = (await web3.eth.getBalance(accounts[3]));
    balancesAfter[4] = (await web3.eth.getBalance(accounts[4]));
    balancesAfter[5] = (await web3.eth.getBalance(accounts[5]));
    balancesAfter[6] = (await web3.eth.getBalance(accounts[6]));
    assert.equal((Number(balancesAfter[0])-Number(balancesBefore[0])-Number(gasCost[0]) - ONEETHER/16)<10000, true, "Root gets 1/16 all the rest level bonuses");
    assert.equal((Number(balancesAfter[1])-Number(balancesBefore[1]))<1, true, "2nd gets nothing");
    assert.equal((Number(balancesAfter[2])-Number(balancesBefore[2])-Number(gasCost[2]) - ONEETHER/16)<10000, true, "3rd gets 1/16");
    assert.equal((Number(balancesAfter[3])-Number(balancesBefore[3])-Number(gasCost[3]) - ONEETHER/8)<10000, true, "4th gets 1/8");
    assert.equal((Number(balancesAfter[4])-Number(balancesBefore[4])-Number(gasCost[4]) - ONEETHER/4)<10000, true, "5th gets 1/4");
    assert.equal((Number(balancesAfter[5])-Number(balancesBefore[5])-Number(gasCost[5]) - ONEETHER/2)<10000, true, "6th gets 1/2");
    assert.equal((Number(balancesAfter[6])-Number(balancesBefore[6])-Number(gasCost[6]) + ONEETHER)<10000, true, "7th is just spender now");

  });

  it('dividends deposit logic', async () => {
    const ProfitSharing = await ProfitSharingMock.deployed();
    const ProfitAccamulator = await ProfitAccamulatorMock.deployed();

    // two years of dividens deposits
    for (var i = 1; i < YEAR*2; i+=(MONTH/2)) {
      var mockedTime = Number(i);
      await ProfitSharing.setMockedNow(mockedTime);
      var getCurrentMonth = Number(await ProfitSharing.getCurrentMonth.call({from: accounts[3]}));
      var getMonthNow =  Number(await ProfitSharing.getMonthNow.call({from: accounts[3]}));
      console.log(i+". getCurrentMonth:"+getCurrentMonth+", getMonthNow:"+getMonthNow);
      if(getCurrentMonth!=getMonthNow) {
        console.log("Change");
        var canDepositNow = await ProfitSharing.canDepositNow.call({from: accounts[3]});
        assert.equal(canDepositNow, true, "We can deposit dividends now");
        var balanceProfitSharingBefore = await web3.eth.getBalance(ProfitSharing.address);
        var balanceProfitAccamulatorBefore = await web3.eth.getBalance(ProfitAccamulator.address);
        // if not equal then lets deposit a dividend and it should make it equal
        await ProfitAccamulator.sendTransaction({from: accounts[1], value: ONEETHER});
        var balanceProfitAccamulatorAfter = await web3.eth.getBalance(ProfitAccamulator.address);
        var balanceProfitSharingAfter = await web3.eth.getBalance(ProfitSharing.address);
        assert.equal(Number(balanceProfitAccamulatorAfter), 0, "Should be 0 after deposit");
        assert.equal(Number(balanceProfitSharingAfter) 
          - Number(balanceProfitSharingBefore)
          - Number(balanceProfitAccamulatorBefore), ONEETHER, "Should be 1 ETH difference");
      } else {
        console.log("Same");
        assert.equal(getCurrentMonth, getMonthNow, "Equal on the start");
        var canDepositNow = await ProfitSharing.canDepositNow.call({from: accounts[3]});
        assert.equal(canDepositNow, false, "We can not deposit dividends now");
        var balanceProfitAccamulatorBefore = await web3.eth.getBalance(ProfitAccamulator.address);
        // if not equal then lets deposit a dividend and it should make greater
        await ProfitAccamulator.sendTransaction({from: accounts[1], value: ONEETHER});
        var balanceProfitAccamulatorAfter = await web3.eth.getBalance(ProfitAccamulator.address);
        assert.equal(Number(balanceProfitAccamulatorAfter)-Number(balanceProfitAccamulatorBefore), ONEETHER, "Should be on 1 ETH greater");
      }
    }
  });

  it('should pay dividends correctly', async () => {
    const SMRT16Instance = await SMRT16.deployed();
    const ProfitSharing = await ProfitSharingMock.deployed();
    const ProfitAccamulator = await ProfitAccamulatorMock.deployed();

    SMRT16Instance.setProfitAddress.call(ProfitAccamulator.address,{from: accounts[0]});

    var balance = [];
    var curMonth = await ProfitSharing.getCurrentMonth.call({from:accounts[9]});


  
    //what is total supply now
    for (var i = 0; i < 9; i++) {
      var balanceBefore = await SMRT16Instance.balanceOf.call(accounts[i]);
      var eths = Number(ONEETHER*(i+1));
      await SMRT16Instance.sendTransaction({from: accounts[i], value: eths});
      balance[i] = await SMRT16Instance.balanceOf.call(accounts[i]);
      assert.equal(balanceBefore.valueOf().toNumber()+eths*100, balance[i].valueOf().toNumber(), "Tokens to be on the balance");
    }

    var month = 1;
    while(true) {
      await ProfitSharing.setMockedNow(MONTH*(month++));
      if(await ProfitSharing.canDepositNow.call()==true) break;
    }

    // Insure there is amount to be shared by dividends
    await ProfitAccamulator.sendTransaction({from: accounts[9], value: ONEETHER});

    //TODO: before switch we can not claim the same month!

    //Let's shift the time to make dividends deposited, trigger the switch
    await ProfitSharing.setMockedNow(MONTH*(month*2));
    await ProfitAccamulator.sendTransaction({from: accounts[9], value: ONEETHER});


  

    //var nextMonth = await ProfitSharing.getCurrentMonth.call({from:accounts[9]});

    var sumOfBalances = Number(0);
    for (var i = 0; i < 9; i++) {
      sumOfBalances += balance[i].valueOf().toNumber();
    }

    var dividends = await ProfitSharing.dividends.call(curMonth-1);
    var totalSupply = dividends.totalSupply.valueOf().toNumber();
    var totalAmount = dividends.amount.valueOf().toNumber();
    assert.equal(totalSupply,sumOfBalances,"Total supply is a sum of all balances in that month");

    var ethsBefore = [];
    var ethsAfter = [];

    for(var i=0;i<9;i++) {
      ethsBefore[i] = await web3.eth.getBalance(accounts[i]);
      var tx = await ProfitSharing.claimDividendAll.call({from:accounts[i]});
      ethsAfter[i] = await web3.eth.getBalance(accounts[i]);

      var delta = Number(ethsAfter[i])-Number(ethsBefore[i]);
      var percent1  = balance[i]/sumOfBalances;
      var percent2  = delta/totalAmount;
      console.log(curMonth+": "+ethsAfter[i]+","+ethsBefore[i]+". Compare: "+percent1+" & "
        +percent2+". "+delta+" = "+(totalAmount*percent1) );

    }
    

  });



  
});
