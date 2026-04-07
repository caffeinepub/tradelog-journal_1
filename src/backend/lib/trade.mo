import CommonTypes "../types/common";
import TradeTypes "../types/trade";
import UserTypes "../types/user";
import List "mo:core/List";
import Map "mo:core/Map";
import Time "mo:core/Time";
import Int "mo:core/Int";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";

module {
  // ── Helpers ────────────────────────────────────────────────────────────────

  /// Build the daily-count map key: "<principalText>:<YYYY-MM-DD>"
  public func dailyKey(userId : CommonTypes.UserId, dateNs : CommonTypes.Timestamp) : Text {
    // Convert nanoseconds to seconds for date math
    let secs : Int = dateNs / 1_000_000_000;
    // Days since Unix epoch (1970-01-01)
    let days : Int = secs / 86400;
    // Gregorian calendar calculation
    let z = days + 719468;
    let era = (if (z >= 0) z else z - 146096) / 146097;
    let doe = z - era * 146097;
    let yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365;
    let y = yoe + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = doy - (153 * mp + 2) / 5 + 1;
    let m = mp + (if (mp < 10) 3 else -9);
    let yr = y + (if (m <= 2) 1 else 0);

    let yText = yr.toText();
    let mText = if (m < 10) "0" # m.toText() else m.toText();
    let dText = if (d < 10) "0" # d.toText() else d.toText();

    userId.toText() # ":" # yText # "-" # mText # "-" # dText;
  };

  /// P&L: LONG = exit - entry, SHORT = entry - exit (in price units)
  public func calcPnl(direction : CommonTypes.Direction, entryPrice : Float, exitPrice : Float) : Float {
    switch (direction) {
      case (#LONG) { exitPrice - entryPrice };
      case (#SHORT) { entryPrice - exitPrice };
    };
  };

  /// Risk/Reward: |PnL| / risk.  If stopLoss not provided, returns 0.
  public func calcRiskReward(pnl : Float, stopLoss : ?Float, entryPrice : Float) : Float {
    switch (stopLoss) {
      case (?sl) {
        let risk = if (entryPrice > sl) entryPrice - sl else sl - entryPrice;
        if (risk == 0.0) 0.0 else (if (pnl >= 0.0) pnl else -pnl) / risk;
      };
      case null { 0.0 };
    };
  };

  public func toPublic(trade : TradeTypes.Trade) : TradeTypes.TradePublic {
    {
      id = trade.id;
      userId = trade.userId;
      pair = trade.pair;
      direction = trade.direction;
      entryPrice = trade.entryPrice;
      exitPrice = trade.exitPrice;
      pnl = trade.pnl;
      riskReward = trade.riskReward;
      strategyTag = trade.strategyTag;
      mistakeTag = trade.mistakeTag;
      sessionTime = trade.sessionTime;
      marketCondition = trade.marketCondition;
      notes = trade.notes;
      chartImageUrl = trade.chartImageUrl;
      entryDate = trade.entryDate;
      exitDate = trade.exitDate;
      createdAt = trade.createdAt;
      updatedAt = trade.updatedAt;
    };
  };

  // ── Limits ─────────────────────────────────────────────────────────────────

  let FREE_DAILY_LIMIT : Nat = 5;
  let FREE_TOTAL_LIMIT : Nat = 25;

  public func getLimitStatus(
    trades : List.List<TradeTypes.Trade>,
    dailyCounts : Map.Map<Text, Nat>,
    caller : CommonTypes.UserId,
    tier : CommonTypes.Tier,
  ) : UserTypes.TierLimitStatus {
    let totalCount = trades.filter(func(t : TradeTypes.Trade) : Bool { Principal.equal(t.userId, caller) }).size();
    let todayKey = dailyKey(caller, Time.now());
    let dailyCount = switch (dailyCounts.get(todayKey)) {
      case (?c) { c };
      case null { 0 };
    };
    let (dailyLimit, totalLimit) = switch (tier) {
      case (#FREE) { (FREE_DAILY_LIMIT, FREE_TOTAL_LIMIT) };
      case (#PAID) { (999999, 999999) };
    };
    {
      dailyCount;
      totalCount;
      tier;
      dailyLimit;
      totalLimit;
      dailyLimitReached = dailyCount >= dailyLimit;
      totalLimitReached = totalCount >= totalLimit;
    };
  };

  // ── CRUD ───────────────────────────────────────────────────────────────────

  public func createTrade(
    trades : List.List<TradeTypes.Trade>,
    dailyCounts : Map.Map<Text, Nat>,
    nextId : Nat,
    caller : CommonTypes.UserId,
    tier : CommonTypes.Tier,
    input : TradeTypes.TradeInput,
  ) : { #ok : TradeTypes.TradePublic; #limitReached : Text } {
    // Enforce free-tier limits
    switch (tier) {
      case (#FREE) {
        let totalCount = trades.filter(func(t : TradeTypes.Trade) : Bool { Principal.equal(t.userId, caller) }).size();
        if (totalCount >= FREE_TOTAL_LIMIT) {
          return #limitReached("Free tier total trade limit of " # FREE_TOTAL_LIMIT.toText() # " reached. Upgrade to Pro for unlimited trades.");
        };
        let todayKey = dailyKey(caller, Time.now());
        let dailyCount = switch (dailyCounts.get(todayKey)) {
          case (?c) { c };
          case null { 0 };
        };
        if (dailyCount >= FREE_DAILY_LIMIT) {
          return #limitReached("Free tier daily limit of " # FREE_DAILY_LIMIT.toText() # " trades reached. Upgrade to Pro for unlimited daily trades.");
        };
        // Increment daily count
        dailyCounts.add(todayKey, dailyCount + 1);
      };
      case (#PAID) {
        // Also track daily count for PAID (stats purposes) but don't block
        let todayKey = dailyKey(caller, Time.now());
        let dailyCount = switch (dailyCounts.get(todayKey)) {
          case (?c) { c };
          case null { 0 };
        };
        dailyCounts.add(todayKey, dailyCount + 1);
      };
    };

    let pnl = calcPnl(input.direction, input.entryPrice, input.exitPrice);
    let rr = calcRiskReward(pnl, input.stopLoss, input.entryPrice);
    let now = Time.now();

    let trade : TradeTypes.Trade = {
      id = nextId;
      userId = caller;
      var pair = input.pair;
      var direction = input.direction;
      var entryPrice = input.entryPrice;
      var exitPrice = input.exitPrice;
      var pnl = pnl;
      var riskReward = rr;
      var strategyTag = input.strategyTag;
      var mistakeTag = input.mistakeTag;
      var sessionTime = input.sessionTime;
      var marketCondition = input.marketCondition;
      var notes = input.notes;
      var chartImageUrl = input.chartImageUrl;
      entryDate = input.entryDate;
      exitDate = input.exitDate;
      createdAt = now;
      var updatedAt = now;
    };
    trades.add(trade);
    #ok(toPublic(trade));
  };

  public func getTrades(
    trades : List.List<TradeTypes.Trade>,
    caller : CommonTypes.UserId,
    filter : TradeTypes.TradeFilter,
  ) : [TradeTypes.TradePublic] {
    trades
      .filter(func(t : TradeTypes.Trade) : Bool {
        if (not Principal.equal(t.userId, caller)) return false;
        switch (filter.pair) {
          case (?p) { if (t.pair != p) return false };
          case null {};
        };
        switch (filter.strategyTag) {
          case (?s) { if (t.strategyTag != s) return false };
          case null {};
        };
        switch (filter.mistakeTag) {
          case (?m) {
            switch (t.mistakeTag) {
              case (?tm) { if (tm != m) return false };
              case null { return false };
            };
          };
          case null {};
        };
        switch (filter.sessionTime) {
          case (?sess) {
            if (not variantEqual(t.sessionTime, sess)) return false
          };
          case null {};
        };
        switch (filter.dateFrom) {
          case (?df) { if (t.entryDate < df) return false };
          case null {};
        };
        switch (filter.dateTo) {
          case (?dt) { if (t.entryDate > dt) return false };
          case null {};
        };
        true;
      })
      .map<TradeTypes.Trade, TradeTypes.TradePublic>(func(t : TradeTypes.Trade) : TradeTypes.TradePublic { toPublic(t) })
      .toArray();
  };

  public func getTrade(
    trades : List.List<TradeTypes.Trade>,
    caller : CommonTypes.UserId,
    tradeId : CommonTypes.TradeId,
  ) : ?TradeTypes.TradePublic {
    switch (trades.find(func(t : TradeTypes.Trade) : Bool { t.id == tradeId and Principal.equal(t.userId, caller) })) {
      case (?t) { ?toPublic(t) };
      case null { null };
    };
  };

  public func updateTrade(
    trades : List.List<TradeTypes.Trade>,
    caller : CommonTypes.UserId,
    tradeId : CommonTypes.TradeId,
    input : TradeTypes.TradeInput,
  ) : ?TradeTypes.TradePublic {
    switch (trades.find(func(t : TradeTypes.Trade) : Bool { t.id == tradeId and Principal.equal(t.userId, caller) })) {
      case (?t) {
        let pnl = calcPnl(input.direction, input.entryPrice, input.exitPrice);
        let rr = calcRiskReward(pnl, input.stopLoss, input.entryPrice);
        t.pair := input.pair;
        t.direction := input.direction;
        t.entryPrice := input.entryPrice;
        t.exitPrice := input.exitPrice;
        t.pnl := pnl;
        t.riskReward := rr;
        t.strategyTag := input.strategyTag;
        t.mistakeTag := input.mistakeTag;
        t.sessionTime := input.sessionTime;
        t.marketCondition := input.marketCondition;
        t.notes := input.notes;
        t.chartImageUrl := input.chartImageUrl;
        t.updatedAt := Time.now();
        ?toPublic(t);
      };
      case null { null };
    };
  };

  public func deleteTrade(
    trades : List.List<TradeTypes.Trade>,
    caller : CommonTypes.UserId,
    tradeId : CommonTypes.TradeId,
  ) : Bool {
    switch (trades.findIndex(func(t : TradeTypes.Trade) : Bool { t.id == tradeId and Principal.equal(t.userId, caller) })) {
      case (?_idx) {
        let filtered = trades.filter(func(t : TradeTypes.Trade) : Bool { not (t.id == tradeId and Principal.equal(t.userId, caller)) });
        trades.clear();
        trades.addAll(filtered.values());
        true;
      };
      case null { false };
    };
  };

  public func updateChartImageUrl(
    trades : List.List<TradeTypes.Trade>,
    caller : CommonTypes.UserId,
    tradeId : CommonTypes.TradeId,
    imageUrl : Text,
  ) : ?TradeTypes.TradePublic {
    switch (trades.find(func(t : TradeTypes.Trade) : Bool { t.id == tradeId and Principal.equal(t.userId, caller) })) {
      case (?t) {
        t.chartImageUrl := ?imageUrl;
        t.updatedAt := Time.now();
        ?toPublic(t);
      };
      case null { null };
    };
  };

  // ── Private helpers ────────────────────────────────────────────────────────

  func variantEqual(a : CommonTypes.SessionTime, b : CommonTypes.SessionTime) : Bool {
    switch (a, b) {
      case (#ASIAN, #ASIAN) true;
      case (#LONDON, #LONDON) true;
      case (#NY, #NY) true;
      case (#OTHER, #OTHER) true;
      case _ false;
    };
  };
};
