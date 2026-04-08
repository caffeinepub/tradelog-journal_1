import CommonTypes "types/common";
import UserTypes "types/user";
import TradeTypes "types/trade";
import MetricsTypes "types/metrics";
import ImportTypes "types/import";
import CouponTypes "types/coupon";
import Migration "migration";

import UserApiMixin "mixins/user-api";
import TradeApiMixin "mixins/trade-api";
import MetricsApiMixin "mixins/metrics-api";
import ImportApiMixin "mixins/import-api";
import AdminApiMixin "mixins/admin-api";

import List "mo:core/List";
import Map "mo:core/Map";
import Principal "mo:core/Principal";

(with migration = Migration.run)
actor {
  // ── Stable state ──────────────────────────────────────────────────────────
  let users           = List.empty<UserTypes.User>();
  let trades          = List.empty<TradeTypes.Trade>();
  let importJobs      = List.empty<ImportTypes.ImportJob>();
  let metricsCache    = Map.empty<CommonTypes.UserId, MetricsTypes.PerformanceMetrics>();

  // dailyCounts key = "<principalText>:<YYYY-MM-DD>"
  let dailyCounts     = Map.empty<Text, Nat>();

  // Coupon state
  let coupons         = List.empty<CouponTypes.CouponCode>();
  let redemptions     = List.empty<CouponTypes.CouponRedemption>();

  // Mutable counters wrapped in single-element arrays so mixins can mutate them
  let nextTradeId     = [var 0 : Nat];
  let nextImportJobId = [var 0 : Nat];
  let nextCouponId    = [var 0 : Nat];

  // Admin principal — defaults to the anonymous sentinel (aaaaa-aa).
  // The first caller of setAdmin() claiming admin rights bootstraps the role.
  // After that, only the current admin can transfer the role.
  let adminPrincipal  = [var Principal.fromText("aaaaa-aa")];

  // ── Mixin composition ─────────────────────────────────────────────────────
  include UserApiMixin(users, coupons, redemptions, adminPrincipal);
  include TradeApiMixin(trades, dailyCounts, users, nextTradeId, metricsCache, adminPrincipal);
  include MetricsApiMixin(trades, metricsCache);
  include ImportApiMixin(importJobs, trades, dailyCounts, users, nextImportJobId, nextTradeId, metricsCache, adminPrincipal);
  include AdminApiMixin(users, coupons, redemptions, adminPrincipal, nextCouponId);
};
