import CommonTypes "../types/common";
import CouponTypes "../types/coupon";
import UserTypes "../types/user";
import List "mo:core/List";
import Principal "mo:core/Principal";

module {
  /// Look up a coupon by its code text (case-insensitive)
  public func findByCode(
    coupons : List.List<CouponTypes.CouponCode>,
    code : Text,
  ) : ?CouponTypes.CouponCode {
    let upper = code.toUpper();
    coupons.find(func(c : CouponTypes.CouponCode) : Bool { c.code.toUpper() == upper });
  };

  /// Validate that a coupon can still be redeemed (active, not expired, under use limit)
  public func validate(
    coupon : CouponTypes.CouponCode,
    now : Int,
  ) : { #ok; #err : Text } {
    if (not coupon.isActive) return #err("Coupon is not active");
    switch (coupon.expiresAt) {
      case (?exp) {
        if (now > exp) return #err("Coupon expired");
      };
      case null {};
    };
    switch (coupon.maxUses) {
      case (?max) {
        if (coupon.usedCount >= max) return #err("Coupon usage limit reached");
      };
      case null {};
    };
    #ok;
  };

  /// Apply a perk to a user and return a human-readable description of what was applied
  public func applyPerk(
    user : UserTypes.User,
    perkType : CouponTypes.CouponPerkType,
    now : Int,
  ) : Text {
    switch (perkType) {
      case (#upgradeToPhaid) {
        user.tier := #PAID;
        user.paidUntil := null;
        "Upgraded to Pro (permanent)";
      };
      case (#freeMonths(months)) {
        user.tier := #PAID;
        // months * 30 days * 24h * 60m * 60s * 1_000_000_000 ns
        let durationNs : Int = months * 30 * 24 * 60 * 60 * 1_000_000_000;
        let base : Int = switch (user.paidUntil) {
          case (?existing) { if (existing > now) existing else now };
          case null { now };
        };
        user.paidUntil := ?(base + durationNs);
        months.toText() # " free month(s) of Pro added";
      };
      case (#featureUnlock(features)) {
        // Deduplicate: append only features not already unlocked
        let existing = user.unlockedFeatures;
        let newFeatures = features.filter(func(f : Text) : Bool {
          existing.find(func(e : Text) : Bool { e == f }) == null
        });
        user.unlockedFeatures := existing.concat(newFeatures);
        "Features unlocked: " # newFeatures.foldLeft("", func(acc : Text, f : Text) : Text {
          if (acc == "") f else acc # ", " # f
        });
      };
      case (#custom(description)) {
        description;
      };
    };
  };

  /// Record a redemption and increment the coupon's usedCount
  public func recordRedemption(
    coupons : List.List<CouponTypes.CouponCode>,
    redemptions : List.List<CouponTypes.CouponRedemption>,
    couponId : Nat,
    userId : CommonTypes.UserId,
    now : Int,
  ) : () {
    redemptions.add({
      userId;
      couponId;
      redeemedAt = now;
    });
    // Increment usedCount on the coupon record in-place
    coupons.mapInPlace(func(c : CouponTypes.CouponCode) : CouponTypes.CouponCode {
      if (c.id == couponId) { { c with usedCount = c.usedCount + 1 } } else { c }
    });
  };

  /// Check whether a user has already redeemed a specific coupon
  public func hasRedeemed(
    redemptions : List.List<CouponTypes.CouponRedemption>,
    userId : CommonTypes.UserId,
    couponId : Nat,
  ) : Bool {
    switch (redemptions.find(func(r : CouponTypes.CouponRedemption) : Bool {
      Principal.equal(r.userId, userId) and r.couponId == couponId
    })) {
      case (?_) { true };
      case null { false };
    };
  };

  /// Build per-coupon stats for admin view
  public func buildStats(
    coupon : CouponTypes.CouponCode,
    redemptions : List.List<CouponTypes.CouponRedemption>,
  ) : CouponTypes.CouponStats {
    let totalRedemptions = redemptions.filter(func(r : CouponTypes.CouponRedemption) : Bool {
      r.couponId == coupon.id
    }).size();
    { coupon; totalRedemptions };
  };
};
