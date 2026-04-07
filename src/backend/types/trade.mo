import CommonTypes "common";

module {
  public type Trade = {
    id : CommonTypes.TradeId;
    userId : CommonTypes.UserId;
    var pair : Text;
    var direction : CommonTypes.Direction;
    var entryPrice : Float;
    var exitPrice : Float;
    var pnl : Float;            // auto-calculated
    var riskReward : Float;     // auto-calculated
    var strategyTag : Text;
    var mistakeTag : ?Text;
    var sessionTime : CommonTypes.SessionTime;
    var marketCondition : CommonTypes.MarketCondition;
    var notes : Text;
    var chartImageUrl : ?Text;
    entryDate : CommonTypes.Timestamp;
    exitDate : CommonTypes.Timestamp;
    createdAt : CommonTypes.Timestamp;
    var updatedAt : CommonTypes.Timestamp;
  };

  // Shared-safe public type (no var fields)
  public type TradePublic = {
    id : CommonTypes.TradeId;
    userId : CommonTypes.UserId;
    pair : Text;
    direction : CommonTypes.Direction;
    entryPrice : Float;
    exitPrice : Float;
    pnl : Float;
    riskReward : Float;
    strategyTag : Text;
    mistakeTag : ?Text;
    sessionTime : CommonTypes.SessionTime;
    marketCondition : CommonTypes.MarketCondition;
    notes : Text;
    chartImageUrl : ?Text;
    entryDate : CommonTypes.Timestamp;
    exitDate : CommonTypes.Timestamp;
    createdAt : CommonTypes.Timestamp;
    updatedAt : CommonTypes.Timestamp;
  };

  public type TradeInput = {
    pair : Text;
    direction : CommonTypes.Direction;
    entryPrice : Float;
    exitPrice : Float;
    stopLoss : ?Float;          // used for R:R calculation
    takeProfit : ?Float;        // used for R:R calculation
    strategyTag : Text;
    mistakeTag : ?Text;
    sessionTime : CommonTypes.SessionTime;
    marketCondition : CommonTypes.MarketCondition;
    notes : Text;
    chartImageUrl : ?Text;
    entryDate : CommonTypes.Timestamp;
    exitDate : CommonTypes.Timestamp;
  };

  public type TradeFilter = {
    pair : ?Text;
    strategyTag : ?Text;
    mistakeTag : ?Text;
    sessionTime : ?CommonTypes.SessionTime;
    dateFrom : ?CommonTypes.Timestamp;
    dateTo : ?CommonTypes.Timestamp;
  };

  public type CsvTradeRow = {
    pair : Text;
    direction : CommonTypes.Direction;
    entryPrice : Float;
    exitPrice : Float;
    pnl : ?Float;
    riskReward : ?Float;
    strategyTag : ?Text;
    mistakeTag : ?Text;
    sessionTime : ?CommonTypes.SessionTime;
    marketCondition : ?CommonTypes.MarketCondition;
    notes : ?Text;
    chartImageUrl : ?Text;
    entryDate : CommonTypes.Timestamp;
    exitDate : CommonTypes.Timestamp;
  };
};
