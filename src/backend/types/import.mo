import CommonTypes "common";

module {
  public type ImportLineError = {
    lineNumber : Nat;
    reason : Text;
  };

  public type ImportJob = {
    id : CommonTypes.ImportJobId;
    userId : CommonTypes.UserId;
    var status : CommonTypes.ImportStatus;
    var importedCount : Nat;
    var errors : [ImportLineError];
    createdAt : CommonTypes.Timestamp;
    var completedAt : ?CommonTypes.Timestamp;
  };

  // Shared-safe public type
  public type ImportJobPublic = {
    id : CommonTypes.ImportJobId;
    userId : CommonTypes.UserId;
    status : CommonTypes.ImportStatus;
    importedCount : Nat;
    errors : [ImportLineError];
    createdAt : CommonTypes.Timestamp;
    completedAt : ?CommonTypes.Timestamp;
  };
};
