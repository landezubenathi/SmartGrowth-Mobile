/** Pure marketplace enquiry helpers. Personal contact details are private to the
 * authenticated sender and listing owner, never published on listing cards.
 */
const short=(x,n)=>String(x??'').trim().slice(0,n);
export const enquiryDocumentId=(offerId,uid)=>`interest_${offerId}_${uid}`;
export function makeMarketEnquiry({offer,business,uid,email,name,phone='',message,intent='interest'}){
 if(!offer||!business||!uid||!email)throw Error('Sign in and select your business to contact the seller.');
 if(offer.ownerUid===uid)throw Error('You cannot enquire about your own listing.');
 if(!['interest','quotation'].includes(intent))throw Error('Choose a valid enquiry type.');
 if(!/^offer_[A-Za-z0-9_]+$/.test(offer.id||''))throw Error('Invalid marketplace listing.');
 const senderName=short(name,100),senderEmail=short(email,254).toLowerCase(),senderPhone=short(phone,30);
 const body=short(message,1000),senderBusinessName=short(business.name,90);
 if(senderName.length<2)throw Error('Enter your name.');
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(senderEmail))throw Error('Sign in with a valid email address.');
 if(senderPhone && !/^\+?[0-9\s()-]{7,25}$/.test(senderPhone))throw Error('Enter a valid contact number, or leave it blank.');
 if(body.length<10)throw Error('Enter at least 10 characters explaining what you need.');
 if(!senderBusinessName||!business.id)throw Error('Select a business before sending an enquiry.');
 const at=new Date().toISOString();
 return {
  offerId:offer.id,ownerUid:offer.ownerUid,ownerBusinessId:offer.businessId,
  offerName:short(offer.name,90),senderUid:uid,senderBusinessId:business.id,
  senderBusinessName,senderIndustry:short(business.industry||'Other',80),
  senderProvince:short(business.region||'',80),senderName,senderEmail,senderPhone,
  intent,message:body,status:'new',createdAt:at,updatedAt:at
 };
}
export function canContactOffer(offer,uid,alreadySent){return Boolean(offer&&offer.ownerUid!==uid&&!alreadySent);}
export function enquiryStatus(status){return ({new:'New enquiry',contacted:'Contacted',closed:'Closed'})[status]||'New enquiry';}
