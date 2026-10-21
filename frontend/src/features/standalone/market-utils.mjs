export const listingId=()=>`offer_${Date.now()}_${Math.random().toString(36).slice(2,11)}`;
export function listingPayload(b,listing,uid){
 if(!uid||!b?.id)throw Error('Sign into your cloud account to publish.');
 const name=String(listing.name||'').trim().slice(0,90),description=String(listing.description||'').trim().slice(0,500),price=Number(listing.price);
 if(!name||!description||!Number.isFinite(price)||price<=0||price>1e8)throw Error('Enter a valid offer, description and positive price.');
 return {ownerUid:uid,businessId:b.id,businessName:String(b.name||'').trim().slice(0,90),industry:String(b.industry||'Other').slice(0,80),province:String(b.region||'').slice(0,80),name,description,price,status:'published',createdAt:String(listing.createdAt||new Date().toISOString())};
}
