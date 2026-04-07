import CommonTypes "../types/common";
import UserTypes "../types/user";
import List "mo:core/List";
import Time "mo:core/Time";
import Principal "mo:core/Principal";

module {
  public func toPublic(user : UserTypes.User) : UserTypes.UserPublic {
    {
      id = user.id;
      tier = user.tier;
      createdAt = user.createdAt;
      stripeCustomerId = user.stripeCustomerId;
    };
  };

  public func getOrCreate(
    users : List.List<UserTypes.User>,
    caller : CommonTypes.UserId,
  ) : UserTypes.UserPublic {
    switch (users.find(func(u : UserTypes.User) : Bool { Principal.equal(u.id, caller) })) {
      case (?u) { toPublic(u) };
      case null {
        let newUser : UserTypes.User = {
          id = caller;
          var tier = #FREE;
          createdAt = Time.now();
          var stripeCustomerId = null;
        };
        users.add(newUser);
        toPublic(newUser);
      };
    };
  };

  public func getUser(
    users : List.List<UserTypes.User>,
    caller : CommonTypes.UserId,
  ) : ?UserTypes.UserPublic {
    switch (users.find(func(u : UserTypes.User) : Bool { Principal.equal(u.id, caller) })) {
      case (?u) { ?toPublic(u) };
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
  ) : UserTypes.UserPublic {
    switch (users.find(func(u : UserTypes.User) : Bool { Principal.equal(u.id, caller) })) {
      case (?u) {
        u.tier := #PAID;
        toPublic(u);
      };
      case null {
        // Create user and immediately set PAID
        let newUser : UserTypes.User = {
          id = caller;
          var tier = #PAID;
          createdAt = Time.now();
          var stripeCustomerId = null;
        };
        users.add(newUser);
        toPublic(newUser);
      };
    };
  };
};
