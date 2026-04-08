import CommonTypes "../types/common";
import CouponTypes "../types/coupon";
import UserTypes "../types/user";
import UserLib "../lib/user";
import CouponLib "../lib/coupon";
import List "mo:core/List";
import Time "mo:core/Time";
import Principal "mo:core/Principal";

/// User-facing mixin — profile, tier management, coupon redemption, admin check
mixin (
  users : List.List<UserTypes.User>,
  coupons : List.List<CouponTypes.CouponCode>,
  redemptions : List.List<CouponTypes.CouponRedemption>,
  adminPrincipal : [var Principal],
) {
  /// Get the calling user's profile, creating one if this is their first login.
  public shared ({ caller }) func getOrCreateUser() : async UserTypes.UserPublic {
    UserLib.getOrCreate(users, caller, adminPrincipal[0]);
  };

  /// Get the calling user's current subscription tier.
  public shared query ({ caller }) func getUserTier() : async CommonTypes.Tier {
    UserLib.getTier(users, caller);
  };

  /// Upgrade the calling user to the PAID tier.
  public shared ({ caller }) func upgradeToPaid() : async UserTypes.UserPublic {
    UserLib.upgradeToPaid(users, caller, adminPrincipal[0]);
  };

  /// Returns true if the caller is the app admin.
  public shared query ({ caller }) func isAdmin() : async Bool {
    Principal.equal(caller, adminPrincipal[0]);
  };

  /// Redeem a coupon by code; applies the perk to the calling user.
  public shared ({ caller }) func redeemCoupon(
    code : Text
  ) : async { #ok : CouponTypes.CouponRedemptionResult; #err : Text } {
    // Look up coupon
    let coupon = switch (CouponLib.findByCode(coupons, code)) {
      case (?c) { c };
      case null { return #err("Coupon code not found") };
    };

    // Validate coupon (active, not expired, usage limit)
    switch (CouponLib.validate(coupon, Time.now())) {
      case (#err(msg)) { return #err(msg) };
      case (#ok) {};
    };

    // Prevent double redemption
    if (CouponLib.hasRedeemed(redemptions, caller, coupon.id)) {
      return #err("You have already redeemed this coupon");
    };

    // Ensure user record exists
    ignore UserLib.getOrCreate(users, caller, adminPrincipal[0]);

    // Find user to apply perk (must exist after getOrCreate)
    let user = switch (users.find(func(u : UserTypes.User) : Bool { Principal.equal(u.id, caller) })) {
      case (?u) { u };
      case null { return #err("User not found") };
    };

    let now = Time.now();
    let perkApplied = CouponLib.applyPerk(user, coupon.perkType, now);

    // Record redemption and increment usedCount
    CouponLib.recordRedemption(coupons, redemptions, coupon.id, caller, now);

    // Return updated coupon (fetch again after usedCount bump)
    let updatedCoupon = switch (CouponLib.findByCode(coupons, code)) {
      case (?c) { c };
      case null { coupon }; // fallback (shouldn't happen)
    };

    #ok({ coupon = updatedCoupon; perkApplied });
  };
};
