/** Whitelist the exact PUBLIC fields that users consent to publishing. */
export function marketDocumentId(uid,listingId){
 if(!/^[a-zA-Z0-9_-]{3,150}$/.test(uid)||!/^[a-zA-Z0-9_-]{3,150}$/.test(listingId))throw Error('Invalid marketplace identifier.');
 return `${uid}_${listingId}`;
}
export function publicListingPayload(uid,business,listing){
 marketDocumentId(uid,listing?.id);
 const result={
  ownerUid:uid,businessId:String(business?.id||''),
  businessName:String(business?.name||'').trim().slice(0,90),
  industry:String(business?.industry||'').slice(0,60),region:String(business?.region||'').slice(0,60),
  name:String(listing?.name||'').trim().slice(0,90),
  description:String(listing?.description||'').trim().slice(0,500),
  price:Number(listing?.price),published:true,
  createdAt:String(listing?.createdAt||new Date().toISOString()).slice(0,32)
 };
 if(!/^[A-Za-z0-9_-]{3,150}$/.test(result.businessId)||!result.businessName||!result.name||!result.description||!Number.isFinite(result.price)||result.price<=0||result.price>100000000)throw Error('A valid business profile, listing, description and price are required.');
 return result;
}
