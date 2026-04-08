import CommonTypes "../types/common";
import TradeTypes "../types/trade";
import UserTypes "../types/user";
import MetricsTypes "../types/metrics";
import TradeLib "../lib/trade";
import UserLib "../lib/user";
import MetricsLib "../lib/metrics";
import List "mo:core/List";
import Map "mo:core/Map";
import Principal "mo:core/Principal";

mixin (
  trades : List.List<TradeTypes.Trade>,
  dailyCounts : Map.Map<Text, Nat>,
  users : List.List<UserTypes.User>,
  nextTradeId : [var Nat],
  metricsCache : Map.Map<CommonTypes.UserId, MetricsTypes.PerformanceMetrics>,
  adminPrincipal : [var Principal],
) {
  /// Create a new trade entry; enforces free-tier limits (admin is exempt).
  public shared ({ caller }) func createTrade(input : TradeTypes.TradeInput) : async { #ok : TradeTypes.TradePublic; #limitReached : Text } {
    // Admin always gets PAID-equivalent unlimited access
    let tier : CommonTypes.Tier = if (Principal.equal(caller, adminPrincipal[0])) #PAID else UserLib.getTier(users, caller);
    let result = TradeLib.createTrade(trades, dailyCounts, nextTradeId[0], caller, tier, input);
    switch (result) {
      case (#ok(_)) {
        nextTradeId[0] += 1;
        MetricsLib.invalidateCache(metricsCache, caller);
      };
      case (#limitReached(_)) {};
    };
    result;
  };

  /// List trades for the calling user with optional filters.
  public shared query ({ caller }) func getTrades(filter : TradeTypes.TradeFilter) : async [TradeTypes.TradePublic] {
    TradeLib.getTrades(trades, caller, filter);
  };

  /// Get a single trade by ID.
  public shared query ({ caller }) func getTrade(tradeId : CommonTypes.TradeId) : async ?TradeTypes.TradePublic {
    TradeLib.getTrade(trades, caller, tradeId);
  };

  /// Update a trade; returns the updated trade or null if not found.
  public shared ({ caller }) func updateTrade(tradeId : CommonTypes.TradeId, input : TradeTypes.TradeInput) : async ?TradeTypes.TradePublic {
    let result = TradeLib.updateTrade(trades, caller, tradeId, input);
    switch (result) {
      case (?_) { MetricsLib.invalidateCache(metricsCache, caller) };
      case null {};
    };
    result;
  };

  /// Delete a trade by ID.
  public shared ({ caller }) func deleteTrade(tradeId : CommonTypes.TradeId) : async Bool {
    let deleted = TradeLib.deleteTrade(trades, caller, tradeId);
    if (deleted) MetricsLib.invalidateCache(metricsCache, caller);
    deleted;
  };

  /// Get the calling user's trade limit status (daily & total counts vs caps).
  public shared query ({ caller }) func getTradeLimitStatus() : async UserTypes.TierLimitStatus {
    let tier : CommonTypes.Tier = if (Principal.equal(caller, adminPrincipal[0])) #PAID else UserLib.getTier(users, caller);
    TradeLib.getLimitStatus(trades, dailyCounts, caller, tier);
  };

  /// Save/update the annotated chart image URL for a trade.
  public shared ({ caller }) func saveChartAnnotation(tradeId : CommonTypes.TradeId, imageUrl : Text) : async ?TradeTypes.TradePublic {
    TradeLib.updateChartImageUrl(trades, caller, tradeId, imageUrl);
  };
};
