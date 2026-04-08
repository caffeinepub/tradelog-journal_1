import CommonTypes "common";

module {
  /// Perk types mirroring Shopify-style benefit categories
  public type CouponPerkType = {
    #upgradeToPhaid;
    #freeMonths : Nat;
    #featureUnlock : [Text];
    #custom : Text;
  };

  public type CouponCode = {
    id : Nat;
    code : Text;
    description : Text;
    perkType : CouponPerkType;
    maxUses : ?Nat;
    usedCount : Nat;
    expiresAt : ?Int;
    isActive : Bool;
    createdAt : CommonTypes.Timestamp;
  };

  public type CouponRedemption = {
    userId : CommonTypes.UserId;
    couponId : Nat;
    redeemedAt : CommonTypes.Timestamp;
  };

  /// Returned to the caller after a successful redemption
  public type CouponRedemptionResult = {
    coupon : CouponCode;
    perkApplied : Text;
  };

  /// Input type for creating a new coupon (admin only)
  public type CreateCouponInput = {
    code : Text;
    description : Text;
    perkType : CouponPerkType;
    maxUses : ?Nat;
    expiresAt : ?Int;
  };

  /// Summary stats for a coupon (admin view)
  public type CouponStats = {
    coupon : CouponCode;
    totalRedemptions : Nat;
  };
};
