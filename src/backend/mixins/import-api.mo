import CommonTypes "../types/common";
import TradeTypes "../types/trade";
import ImportTypes "../types/import";
import UserTypes "../types/user";
import MetricsTypes "../types/metrics";
import CsvImportLib "../lib/csvImport";
import UserLib "../lib/user";
import MetricsLib "../lib/metrics";
import List "mo:core/List";
import Map "mo:core/Map";
import Principal "mo:core/Principal";

mixin (
  importJobs : List.List<ImportTypes.ImportJob>,
  trades : List.List<TradeTypes.Trade>,
  dailyCounts : Map.Map<Text, Nat>,
  users : List.List<UserTypes.User>,
  nextImportJobId : [var Nat],
  nextTradeId : [var Nat],
  metricsCache : Map.Map<CommonTypes.UserId, MetricsTypes.PerformanceMetrics>,
  adminPrincipal : [var Principal],
) {
  /// Start a bulk CSV import job; processes all rows and returns job status.
  public shared ({ caller }) func bulkImportTrades(rows : [TradeTypes.CsvTradeRow]) : async ImportTypes.ImportJobPublic {
    // Admin always gets unlimited (PAID) access
    let tier : CommonTypes.Tier = if (Principal.equal(caller, adminPrincipal[0])) #PAID else UserLib.getTier(users, caller);
    // Create the job record
    let _ = CsvImportLib.createJob(importJobs, nextImportJobId[0], caller);
    let jobId = nextImportJobId[0];
    nextImportJobId[0] += 1;
    let result = CsvImportLib.processRows(
      importJobs, trades, dailyCounts, nextTradeId[0],
      jobId, caller, tier, rows,
    );
    nextTradeId[0] += result.importedCount;
    MetricsLib.invalidateCache(metricsCache, caller);
    result;
  };

  /// Get the status of a previously started import job.
  public shared query ({ caller }) func getImportJob(jobId : CommonTypes.ImportJobId) : async ?ImportTypes.ImportJobPublic {
    CsvImportLib.getJob(importJobs, caller, jobId);
  };
};
