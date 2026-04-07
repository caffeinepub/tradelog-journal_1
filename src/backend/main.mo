import CommonTypes "types/common";
import UserTypes "types/user";
import TradeTypes "types/trade";
import MetricsTypes "types/metrics";
import ImportTypes "types/import";

import UserApiMixin "mixins/user-api";
import TradeApiMixin "mixins/trade-api";
import MetricsApiMixin "mixins/metrics-api";
import ImportApiMixin "mixins/import-api";

import List "mo:core/List";
import Map "mo:core/Map";

actor {
  // ── Stable state ──────────────────────────────────────────────────────────
  let users           = List.empty<UserTypes.User>();
  let trades          = List.empty<TradeTypes.Trade>();
  let importJobs      = List.empty<ImportTypes.ImportJob>();
  let metricsCache    = Map.empty<CommonTypes.UserId, MetricsTypes.PerformanceMetrics>();

  // dailyCounts key = "<principalText>:<YYYY-MM-DD>"
  let dailyCounts     = Map.empty<Text, Nat>();

  // Mutable counters wrapped in single-element arrays so mixins can mutate them
  let nextTradeId     = [var 0 : Nat];
  let nextImportJobId = [var 0 : Nat];

  // ── Mixin composition ─────────────────────────────────────────────────────
  include UserApiMixin(users);
  include TradeApiMixin(trades, dailyCounts, users, nextTradeId, metricsCache);
  include MetricsApiMixin(trades, metricsCache);
  include ImportApiMixin(importJobs, trades, dailyCounts, users, nextImportJobId, nextTradeId, metricsCache);
};
