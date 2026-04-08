import CommonTypes "../types/common";
import CouponTypes "../types/coupon";
import UserTypes "../types/user";
import CouponLib "../lib/coupon";
import List "mo:core/List";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";

/// Admin-only coupon management mixin
mixin (
  users : List.List<UserTypes.User>,
  coupons : List.List<CouponTypes.CouponCode>,
  redemptions : List.List<CouponTypes.CouponRedemption>,
  adminPrincipal : [var Principal],
  nextCouponId : [var Nat],
) {
  /// Bootstrap: set the admin principal.
  /// - If adminPrincipal is still the anonymous sentinel (aaaaa-aa), anyone can
  ///   claim admin (first-call wins).
  /// - Once set, only the current admin can transfer the role.
  public shared ({ caller }) func setAdmin(newAdmin : Principal) : async { #ok; #err : Text } {
    let sentinel = Principal.fromText("aaaaa-aa");
    if (Principal.equal(adminPrincipal[0], sentinel) or Principal.equal(caller, adminPrincipal[0])) {
      adminPrincipal[0] := newAdmin;
      #ok;
    } else {
      #err("Unauthorized");
    };
  };

  /// Create a new coupon code (admin only)
  public shared ({ caller }) func createCoupon(
    input : CouponTypes.CreateCouponInput
  ) : async CouponTypes.CouponCode {
    if (not Principal.equal(caller, adminPrincipal[0])) {
      Runtime.trap("Unauthorized");
    };
    let id = nextCouponId[0];
    nextCouponId[0] += 1;
    let coupon : CouponTypes.CouponCode = {
      id;
      code = input.code;
      description = input.description;
      perkType = input.perkType;
      maxUses = input.maxUses;
      usedCount = 0;
      expiresAt = input.expiresAt;
      isActive = true;
      createdAt = Time.now();
    };
    coupons.add(coupon);
    coupon;
  };

  /// List all coupon codes with their current state (admin only)
  public shared ({ caller }) func listCoupons() : async [CouponTypes.CouponCode] {
    if (not Principal.equal(caller, adminPrincipal[0])) {
      Runtime.trap("Unauthorized");
    };
    coupons.toArray();
  };

  /// Deactivate a coupon so it can no longer be redeemed (admin only)
  public shared ({ caller }) func deactivateCoupon(
    couponId : Nat
  ) : async { #ok; #err : Text } {
    if (not Principal.equal(caller, adminPrincipal[0])) {
      return #err("Unauthorized");
    };
    var found = false;
    coupons.mapInPlace(func(c : CouponTypes.CouponCode) : CouponTypes.CouponCode {
      if (c.id == couponId) {
        found := true;
        { c with isActive = false };
      } else { c };
    });
    if (found) #ok else #err("Coupon not found");
  };

  /// Get redemption stats for a specific coupon (admin only)
  public shared ({ caller }) func getCouponStats(
    couponId : Nat
  ) : async { #ok : CouponTypes.CouponStats; #err : Text } {
    if (not Principal.equal(caller, adminPrincipal[0])) {
      return #err("Unauthorized");
    };
    switch (coupons.find(func(c : CouponTypes.CouponCode) : Bool { c.id == couponId })) {
      case (?coupon) {
        #ok(CouponLib.buildStats(coupon, redemptions));
      };
      case null { #err("Coupon not found") };
    };
  };
};
