import CommonTypes "../types/common";
import UserTypes "../types/user";
import UserLib "../lib/user";
import List "mo:core/List";

mixin (users : List.List<UserTypes.User>) {
  /// Get the calling user's profile, creating one if this is their first login.
  public shared ({ caller }) func getOrCreateUser() : async UserTypes.UserPublic {
    UserLib.getOrCreate(users, caller);
  };

  /// Get the calling user's current subscription tier.
  public shared query ({ caller }) func getUserTier() : async CommonTypes.Tier {
    UserLib.getTier(users, caller);
  };

  /// Upgrade the calling user to the PAID tier.
  public shared ({ caller }) func upgradeToPaid() : async UserTypes.UserPublic {
    UserLib.upgradeToPaid(users, caller);
  };
};
