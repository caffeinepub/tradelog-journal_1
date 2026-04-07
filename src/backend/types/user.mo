import CommonTypes "common";

module {
  public type User = {
    id : CommonTypes.UserId;
    var tier : CommonTypes.Tier;
    createdAt : CommonTypes.Timestamp;
    var stripeCustomerId : ?Text;
  };

  // Shared-safe public type (no var fields)
  public type UserPublic = {
    id : CommonTypes.UserId;
    tier : CommonTypes.Tier;
    createdAt : CommonTypes.Timestamp;
    stripeCustomerId : ?Text;
  };

  public type TierLimitStatus = {
    dailyCount : Nat;
    totalCount : Nat;
    tier : CommonTypes.Tier;
    dailyLimit : Nat;
    totalLimit : Nat;
    dailyLimitReached : Bool;
    totalLimitReached : Bool;
  };
};
