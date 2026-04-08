import CommonTypes "../types/common";
import UserTypes "../types/user";
import List "mo:core/List";
import Time "mo:core/Time";
import Principal "mo:core/Principal";

module {
  public func toPublic(user : UserTypes.User, adminPrincipal : Principal) : UserTypes.UserPublic {
    {
      id = user.id;
      tier = user.tier;
      createdAt = user.createdAt;
      stripeCustomerId = user.stripeCustomerId;
      paidUntil = user.paidUntil;
      unlockedFeatures = user.unlockedFeatures;
      isAdmin = Principal.equal(user.id, adminPrincipal);
    };
  };

  public func getOrCreate(
    users : List.List<UserTypes.User>,
    caller : CommonTypes.UserId,
    adminPrincipal : Principal,
  ) : UserTypes.UserPublic {
    switch (users.find(func(u : UserTypes.User) : Bool { Principal.equal(u.id, caller) })) {
      case (?u) { toPublic(u, adminPrincipal) };
      case null {
        let newUser : UserTypes.User = {
          id = caller;
          var tier = #FREE;
          createdAt = Time.now();
          var stripeCustomerId = null;
          var paidUntil = null;
          var unlockedFeatures = [];
        };
        users.add(newUser);
        toPublic(newUser, adminPrincipal);
      };
    };
  };

  public func getUser(
    users : List.List<UserTypes.User>,
    caller : CommonTypes.UserId,
    adminPrincipal : Principal,
  ) : ?UserTypes.UserPublic {
    switch (users.find(func(u : UserTypes.User) : Bool { Principal.equal(u.id, caller) })) {
      case (?u) { ?toPublic(u, adminPrincipal) };
      case null { null };
    };
  };

  public func getTier(
    users : List.List<UserTypes.User>,
    caller : CommonTypes.UserId,
  ) : CommonTypes.Tier {
    switch (users.find(func(u : UserTypes.User) : Bool { Principal.equal(u.id, caller) })) {
      case (?u) { u.tier };
      case null { #FREE };
    };
  };

  public func upgradeToPaid(
    users : List.List<UserTypes.User>,
    caller : CommonTypes.UserId,
    adminPrincipal : Principal,
  ) : UserTypes.UserPublic {
    switch (users.find(func(u : UserTypes.User) : Bool { Principal.equal(u.id, caller) })) {
      case (?u) {
        u.tier := #PAID;
        toPublic(u, adminPrincipal);
      };
      case null {
        // Create user and immediately set PAID
        let newUser : UserTypes.User = {
          id = caller;
          var tier = #PAID;
          createdAt = Time.now();
          var stripeCustomerId = null;
          var paidUntil = null;
          var unlockedFeatures = [];
        };
        users.add(newUser);
        toPublic(newUser, adminPrincipal);
      };
    };
  };
};
