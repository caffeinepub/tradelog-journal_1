import CommonTypes "../types/common";
import TradeTypes "../types/trade";
import MetricsTypes "../types/metrics";
import MetricsLib "../lib/metrics";
import List "mo:core/List";
import Map "mo:core/Map";

mixin (
  trades : List.List<TradeTypes.Trade>,
  metricsCache : Map.Map<CommonTypes.UserId, MetricsTypes.PerformanceMetrics>,
) {
  /// Compute fresh performance metrics for the caller and cache the result.
  public shared ({ caller }) func computeMetrics() : async MetricsTypes.PerformanceMetrics {
    let m = MetricsLib.compute(trades, caller);
    metricsCache.add(caller, m);
    m;
  };

  /// Get cached metrics, or return null if no cache exists yet.
  public shared query ({ caller }) func getMetrics() : async ?MetricsTypes.PerformanceMetrics {
    metricsCache.get(caller);
  };
};
