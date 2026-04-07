import CommonTypes "../types/common";
import TradeTypes "../types/trade";
import ImportTypes "../types/import";
import TradeLib "trade";
import List "mo:core/List";
import Map "mo:core/Map";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";

module {
  let FREE_DAILY_LIMIT : Nat = 5;
  let FREE_TOTAL_LIMIT : Nat = 25;

  public func toPublic(job : ImportTypes.ImportJob) : ImportTypes.ImportJobPublic {
    {
      id = job.id;
      userId = job.userId;
      status = job.status;
      importedCount = job.importedCount;
      errors = job.errors;
      createdAt = job.createdAt;
      completedAt = job.completedAt;
    };
  };

  public func createJob(
    jobs : List.List<ImportTypes.ImportJob>,
    nextId : Nat,
    caller : CommonTypes.UserId,
  ) : ImportTypes.ImportJobPublic {
    let job : ImportTypes.ImportJob = {
      id = nextId;
      userId = caller;
      var status = #PENDING;
      var importedCount = 0;
      var errors = [];
      createdAt = Time.now();
      var completedAt = null;
    };
    jobs.add(job);
    toPublic(job);
  };

  public func processRows(
    jobs : List.List<ImportTypes.ImportJob>,
    trades : List.List<TradeTypes.Trade>,
    dailyCounts : Map.Map<Text, Nat>,
    nextTradeId : Nat,
    jobId : CommonTypes.ImportJobId,
    caller : CommonTypes.UserId,
    tier : CommonTypes.Tier,
    rows : [TradeTypes.CsvTradeRow],
  ) : ImportTypes.ImportJobPublic {
    let jobOpt = jobs.find(func(j : ImportTypes.ImportJob) : Bool { j.id == jobId and Principal.equal(j.userId, caller) });
    let job = switch (jobOpt) {
      case (?j) { j };
      case null { Runtime.trap("Import job not found") };
    };

    job.status := #PROCESSING;

    var currentTradeId = nextTradeId;
    let errorList = List.empty<ImportTypes.ImportLineError>();
    var importedCount = 0;

    var lineNumber = 1;
    for (row in rows.values()) {
      // Row-level free-tier enforcement
      var blocked = false;
      switch (tier) {
        case (#FREE) {
          let totalCount = trades.filter(func(t : TradeTypes.Trade) : Bool { Principal.equal(t.userId, caller) }).size();
          if (totalCount >= FREE_TOTAL_LIMIT) {
            errorList.add({
              lineNumber;
              reason = "Free tier total limit reached (" # FREE_TOTAL_LIMIT.toText() # " trades)";
            });
            blocked := true;
          } else {
            let todayKey = TradeLib.dailyKey(caller, Time.now());
            let dailyCount = switch (dailyCounts.get(todayKey)) { case (?c) c; case null 0 };
            if (dailyCount >= FREE_DAILY_LIMIT) {
              errorList.add({
                lineNumber;
                reason = "Free tier daily limit reached (" # FREE_DAILY_LIMIT.toText() # " trades/day)";
              });
              blocked := true;
            };
          };
        };
        case (#PAID) {};
      };

      if (not blocked) {
        let pnl = switch (row.pnl) {
          case (?p) { p };
          case null { TradeLib.calcPnl(row.direction, row.entryPrice, row.exitPrice) };
        };
        let rr = switch (row.riskReward) {
          case (?r) { r };
          case null { 0.0 };
        };
        let now = Time.now();
        let trade : TradeTypes.Trade = {
          id = currentTradeId;
          userId = caller;
          var pair = row.pair;
          var direction = row.direction;
          var entryPrice = row.entryPrice;
          var exitPrice = row.exitPrice;
          var pnl = pnl;
          var riskReward = rr;
          var strategyTag = switch (row.strategyTag) { case (?s) s; case null "" };
          var mistakeTag = row.mistakeTag;
          var sessionTime = switch (row.sessionTime) { case (?s) s; case null #OTHER };
          var marketCondition = switch (row.marketCondition) { case (?c) c; case null #OTHER };
          var notes = switch (row.notes) { case (?n) n; case null "" };
          var chartImageUrl = row.chartImageUrl;
          entryDate = row.entryDate;
          exitDate = row.exitDate;
          createdAt = now;
          var updatedAt = now;
        };
        trades.add(trade);

        // Update daily count
        let todayKey = TradeLib.dailyKey(caller, Time.now());
        let dailyCount = switch (dailyCounts.get(todayKey)) { case (?c) c; case null 0 };
        dailyCounts.add(todayKey, dailyCount + 1);

        currentTradeId += 1;
        importedCount += 1;
      };

      lineNumber += 1;
    };

    job.importedCount := importedCount;
    job.errors := errorList.toArray();
    job.status := #COMPLETE;
    job.completedAt := ?Time.now();

    toPublic(job);
  };

  public func getJob(
    jobs : List.List<ImportTypes.ImportJob>,
    caller : CommonTypes.UserId,
    jobId : CommonTypes.ImportJobId,
  ) : ?ImportTypes.ImportJobPublic {
    switch (jobs.find(func(j : ImportTypes.ImportJob) : Bool { j.id == jobId and Principal.equal(j.userId, caller) })) {
      case (?j) { ?toPublic(j) };
      case null { null };
    };
  };
};
