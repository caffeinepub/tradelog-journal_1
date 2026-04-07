module {
  public type UserId = Principal;
  public type Timestamp = Int; // nanoseconds from Time.now()
  public type TradeId = Nat;
  public type ImportJobId = Nat;

  public type Tier = {
    #FREE;
    #PAID;
  };

  public type Direction = {
    #LONG;
    #SHORT;
  };

  public type SessionTime = {
    #ASIAN;
    #LONDON;
    #NY;
    #OTHER;
  };

  public type MarketCondition = {
    #TRENDING;
    #RANGING;
    #VOLATILE;
    #CHOPPY;
    #OTHER;
  };

  public type ImportStatus = {
    #PENDING;
    #PROCESSING;
    #COMPLETE;
    #FAILED;
  };
};
