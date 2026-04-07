import CommonTypes "../types/common";
import TradeTypes "../types/trade";
import MetricsTypes "../types/metrics";
import List "mo:core/List";
import Map "mo:core/Map";
import Time "mo:core/Time";
import Int "mo:core/Int";
import Nat "mo:core/Nat";
import Array "mo:core/Array";
import Principal "mo:core/Principal";

module {
  // ── Date helpers ───────────────────────────────────────────────────────────

  func nsToDateParts(ns : CommonTypes.Timestamp) : (Int, Int, Int) {
    let secs : Int = ns / 1_000_000_000;
    let days : Int = secs / 86400;
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
    (yr, m, d);
  };

  /// ISO week number for a day-of-year offset
  func isoWeek(ns : CommonTypes.Timestamp) : (Int, Int) {
    let secs : Int = ns / 1_000_000_000;
    let days : Int = secs / 86400;
    // Day of week: 0=Mon, 6=Sun (Mon-based ISO)
    let dow = Int.rem(days + 3, 7); // days epoch is Thu=3
    let week = (days - dow + 3) / 7 + 1;
    let (yr, m, _d) = nsToDateParts(ns);
    let year = if (m == 1 and week > 51) yr - 1
               else if (m == 12 and week == 1) yr + 1
               else yr;
    (year, week);
  };

  func weekLabel(ns : CommonTypes.Timestamp) : Text {
    let (yr, w) = isoWeek(ns);
    let wText = if (w < 10) "0" # w.toText() else w.toText();
    yr.toText() # "-W" # wText;
  };

  func monthLabel(ns : CommonTypes.Timestamp) : Text {
    let (yr, m, _) = nsToDateParts(ns);
    let mText = if (m < 10) "0" # m.toText() else m.toText();
    yr.toText() # "-" # mText;
  };

  // ── Aggregation helpers ────────────────────────────────────────────────────

  func buildPnlSeries(
    myTrades : List.List<TradeTypes.Trade>,
    labelFn : CommonTypes.Timestamp -> Text,
  ) : [MetricsTypes.PnlDataPoint] {
    // Accumulate by label using Map
    let pnlMap = Map.empty<Text, Float>();
    let countMap = Map.empty<Text, Nat>();
    myTrades.forEach(func(t : TradeTypes.Trade) {
      let lbl = labelFn(t.entryDate);
      let curPnl = switch (pnlMap.get(lbl)) { case (?v) v; case null 0.0 };
      let curCnt = switch (countMap.get(lbl)) { case (?v) v; case null 0 };
      pnlMap.add(lbl, curPnl + t.pnl);
      countMap.add(lbl, curCnt + 1);
    });
    let result = List.empty<MetricsTypes.PnlDataPoint>();
    for ((lbl, pnl) in pnlMap.entries()) {
      let cnt = switch (countMap.get(lbl)) { case (?v) v; case null 0 };
      result.add({ periodLabel = lbl; pnl; tradeCount = cnt });
    };
    result.toArray();
  };

  func buildPairStats(myTrades : List.List<TradeTypes.Trade>) : [MetricsTypes.PairStats] {
    let pnlMap = Map.empty<Text, Float>();
    let winsMap = Map.empty<Text, Nat>();
    let countMap = Map.empty<Text, Nat>();
    myTrades.forEach(func(t : TradeTypes.Trade) {
      let p = t.pair;
      let curPnl = switch (pnlMap.get(p)) { case (?v) v; case null 0.0 };
      let curWins = switch (winsMap.get(p)) { case (?v) v; case null 0 };
      let curCnt = switch (countMap.get(p)) { case (?v) v; case null 0 };
      pnlMap.add(p, curPnl + t.pnl);
      winsMap.add(p, curWins + (if (t.pnl > 0.0) 1 else 0));
      countMap.add(p, curCnt + 1);
    });
    let result = List.empty<MetricsTypes.PairStats>();
    for ((pair, totalPnl) in pnlMap.entries()) {
      let tc = switch (countMap.get(pair)) { case (?v) v; case null 0 };
      let wins = switch (winsMap.get(pair)) { case (?v) v; case null 0 };
      let winRate = if (tc == 0) 0.0 else wins.toFloat() / tc.toFloat();
      result.add({ pair; totalPnl; winRate; tradeCount = tc });
    };
    result.toArray();
  };

  func buildStrategyStats(myTrades : List.List<TradeTypes.Trade>) : [MetricsTypes.StrategyStats] {
    let pnlMap = Map.empty<Text, Float>();
    let winsMap = Map.empty<Text, Nat>();
    let countMap = Map.empty<Text, Nat>();
    myTrades.forEach(func(t : TradeTypes.Trade) {
      let tag = t.strategyTag;
      let curPnl = switch (pnlMap.get(tag)) { case (?v) v; case null 0.0 };
      let curWins = switch (winsMap.get(tag)) { case (?v) v; case null 0 };
      let curCnt = switch (countMap.get(tag)) { case (?v) v; case null 0 };
      pnlMap.add(tag, curPnl + t.pnl);
      winsMap.add(tag, curWins + (if (t.pnl > 0.0) 1 else 0));
      countMap.add(tag, curCnt + 1);
    });
    let result = List.empty<MetricsTypes.StrategyStats>();
    for ((tag, totalPnl) in pnlMap.entries()) {
      let tc = switch (countMap.get(tag)) { case (?v) v; case null 0 };
      let wins = switch (winsMap.get(tag)) { case (?v) v; case null 0 };
      let winRate = if (tc == 0) 0.0 else wins.toFloat() / tc.toFloat();
      result.add({ tag; totalPnl; winRate; tradeCount = tc });
    };
    result.toArray();
  };

  func sessionToText(s : CommonTypes.SessionTime) : Text {
    switch (s) {
      case (#ASIAN) "ASIAN";
      case (#LONDON) "LONDON";
      case (#NY) "NY";
      case (#OTHER) "OTHER";
    };
  };

  func buildSessionStats(myTrades : List.List<TradeTypes.Trade>) : [MetricsTypes.SessionStats] {
    let pnlMap = Map.empty<Text, Float>();
    let winsMap = Map.empty<Text, Nat>();
    let countMap = Map.empty<Text, Nat>();
    let sessMap = Map.empty<Text, CommonTypes.SessionTime>();
    myTrades.forEach(func(t : TradeTypes.Trade) {
      let key = sessionToText(t.sessionTime);
      let curPnl = switch (pnlMap.get(key)) { case (?v) v; case null 0.0 };
      let curWins = switch (winsMap.get(key)) { case (?v) v; case null 0 };
      let curCnt = switch (countMap.get(key)) { case (?v) v; case null 0 };
      pnlMap.add(key, curPnl + t.pnl);
      winsMap.add(key, curWins + (if (t.pnl > 0.0) 1 else 0));
      countMap.add(key, curCnt + 1);
      sessMap.add(key, t.sessionTime);
    });
    let result = List.empty<MetricsTypes.SessionStats>();
    for ((key, totalPnl) in pnlMap.entries()) {
      let tc = switch (countMap.get(key)) { case (?v) v; case null 0 };
      let wins = switch (winsMap.get(key)) { case (?v) v; case null 0 };
      let winRate = if (tc == 0) 0.0 else wins.toFloat() / tc.toFloat();
      let session = switch (sessMap.get(key)) { case (?s) s; case null #OTHER };
      result.add({ session; totalPnl; winRate; tradeCount = tc });
    };
    result.toArray();
  };

  // ── Max drawdown ────────────────────────────────────────────────────────────

  func calcMaxDrawdown(myTrades : List.List<TradeTypes.Trade>) : Float {
    // Sort trades by entryDate ascending
    let sorted = myTrades.sort(func(a : TradeTypes.Trade, b : TradeTypes.Trade) : { #less; #equal; #greater } {
      Int.compare(a.entryDate, b.entryDate)
    });
    var peak : Float = 0.0;
    var equity : Float = 0.0;
    var maxDd : Float = 0.0;
    sorted.toArray().forEach(func(t : TradeTypes.Trade) {
      equity := equity + t.pnl;
      if (equity > peak) peak := equity;
      let dd = peak - equity;
      if (dd > maxDd) maxDd := dd;
    });
    maxDd;
  };

  // ── Public API ─────────────────────────────────────────────────────────────

  public func compute(
    trades : List.List<TradeTypes.Trade>,
    userId : CommonTypes.UserId,
  ) : MetricsTypes.PerformanceMetrics {
    let myTrades = trades.filter(func(t : TradeTypes.Trade) : Bool { Principal.equal(t.userId, userId) });
    let total = myTrades.size();

    let wins = myTrades.filter(func(t : TradeTypes.Trade) : Bool { t.pnl > 0.0 }).size();
    let winRate = if (total == 0) 0.0 else wins.toFloat() / total.toFloat();

    let totalPnl = myTrades.foldLeft(0.0 : Float, func(acc : Float, t : TradeTypes.Trade) : Float { acc + t.pnl });

    let rrSum = myTrades.foldLeft(0.0 : Float, func(acc : Float, t : TradeTypes.Trade) : Float { acc + t.riskReward });
    let avgRiskReward = if (total == 0) 0.0 else rrSum / total.toFloat();

    let maxDrawdown = calcMaxDrawdown(myTrades);

    let pairStatsArr = buildPairStats(myTrades);

    // bestPair = highest totalPnl pair
    var bestPair : ?Text = null;
    var worstPair : ?Text = null;
    if (pairStatsArr.size() > 0) {
      var bestPnl = pairStatsArr[0].totalPnl;
      var worstPnl = pairStatsArr[0].totalPnl;
      bestPair := ?pairStatsArr[0].pair;
      worstPair := ?pairStatsArr[0].pair;
      pairStatsArr.forEach(func(ps : MetricsTypes.PairStats) {
        if (ps.totalPnl > bestPnl) { bestPnl := ps.totalPnl; bestPair := ?ps.pair };
        if (ps.totalPnl < worstPnl) { worstPnl := ps.totalPnl; worstPair := ?ps.pair };
      });
    };

    {
      userId;
      winRate;
      totalPnl;
      maxDrawdown;
      bestPair;
      worstPair;
      avgRiskReward;
      weeklyPnl = buildPnlSeries(myTrades, weekLabel);
      monthlyPnl = buildPnlSeries(myTrades, monthLabel);
      pnlByPair = pairStatsArr;
      pnlByStrategy = buildStrategyStats(myTrades);
      pnlBySession = buildSessionStats(myTrades);
      computedAt = Time.now();
    };
  };

  public func getOrCompute(
    trades : List.List<TradeTypes.Trade>,
    cache : Map.Map<CommonTypes.UserId, MetricsTypes.PerformanceMetrics>,
    userId : CommonTypes.UserId,
  ) : MetricsTypes.PerformanceMetrics {
    switch (cache.get(userId)) {
      case (?m) { m };
      case null {
        let m = compute(trades, userId);
        cache.add(userId, m);
        m;
      };
    };
  };

  public func invalidateCache(
    cache : Map.Map<CommonTypes.UserId, MetricsTypes.PerformanceMetrics>,
    userId : CommonTypes.UserId,
  ) : () {
    cache.remove(userId);
  };
};
