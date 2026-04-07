import CommonTypes "common";

module {
  public type PnlDataPoint = {
    periodLabel : Text;   // "2024-W01" or "2024-01"
    pnl : Float;
    tradeCount : Nat;
  };

  public type PairStats = {
    pair : Text;
    totalPnl : Float;
    winRate : Float;
    tradeCount : Nat;
  };

  public type StrategyStats = {
    tag : Text;
    totalPnl : Float;
    winRate : Float;
    tradeCount : Nat;
  };

  public type SessionStats = {
    session : CommonTypes.SessionTime;
    totalPnl : Float;
    winRate : Float;
    tradeCount : Nat;
  };

  public type PerformanceMetrics = {
    userId : CommonTypes.UserId;
    winRate : Float;
    totalPnl : Float;
    maxDrawdown : Float;
    bestPair : ?Text;
    worstPair : ?Text;
    avgRiskReward : Float;
    weeklyPnl : [PnlDataPoint];
    monthlyPnl : [PnlDataPoint];
    pnlByPair : [PairStats];
    pnlByStrategy : [StrategyStats];
    pnlBySession : [SessionStats];
    computedAt : CommonTypes.Timestamp;
  };
};
