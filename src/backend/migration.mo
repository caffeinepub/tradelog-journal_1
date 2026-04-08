import UserTypes "types/user";
import CouponTypes "types/coupon";
import CommonTypes "types/common";
import List "mo:core/List";
import Map "mo:core/Map";
import MetricsTypes "types/metrics";
import TradeTypes "types/trade";
import ImportTypes "types/import";
import Principal "mo:core/Principal";

module {
  // ── Old types (copied from .old/src/backend/types/) ──────────────────────
  type OldUser = {
    id : CommonTypes.UserId;
    var tier : CommonTypes.Tier;
    createdAt : CommonTypes.Timestamp;
    var stripeCustomerId : ?Text;
  };

  type OldActor = {
    users           : List.List<OldUser>;
    trades          : List.List<TradeTypes.Trade>;
    importJobs      : List.List<ImportTypes.ImportJob>;
    metricsCache    : Map.Map<CommonTypes.UserId, MetricsTypes.PerformanceMetrics>;
    dailyCounts     : Map.Map<Text, Nat>;
    nextTradeId     : [var Nat];
    nextImportJobId : [var Nat];
  };

  // ── New types ─────────────────────────────────────────────────────────────
  type NewActor = {
    users           : List.List<UserTypes.User>;
    trades          : List.List<TradeTypes.Trade>;
    importJobs      : List.List<ImportTypes.ImportJob>;
    metricsCache    : Map.Map<CommonTypes.UserId, MetricsTypes.PerformanceMetrics>;
    dailyCounts     : Map.Map<Text, Nat>;
    nextTradeId     : [var Nat];
    nextImportJobId : [var Nat];
    coupons         : List.List<CouponTypes.CouponCode>;
    redemptions     : List.List<CouponTypes.CouponRedemption>;
    nextCouponId    : [var Nat];
    adminPrincipal  : [var Principal];
  };

  public func run(old : OldActor) : NewActor {
    // Migrate each user — add paidUntil and unlockedFeatures with safe defaults
    let newUsers = old.users.map<OldUser, UserTypes.User>(
      func(u) {
        {
          id = u.id;
          var tier = u.tier;
          createdAt = u.createdAt;
          var stripeCustomerId = u.stripeCustomerId;
          var paidUntil = null;
          var unlockedFeatures = [];
        };
      }
    );

    {
      users           = newUsers;
      trades          = old.trades;
      importJobs      = old.importJobs;
      metricsCache    = old.metricsCache;
      dailyCounts     = old.dailyCounts;
      nextTradeId     = old.nextTradeId;
      nextImportJobId = old.nextImportJobId;
      coupons         = List.empty<CouponTypes.CouponCode>();
      redemptions     = List.empty<CouponTypes.CouponRedemption>();
      nextCouponId    = [var 0 : Nat];
      adminPrincipal  = [var Principal.anonymous()];
    };
  };
};
