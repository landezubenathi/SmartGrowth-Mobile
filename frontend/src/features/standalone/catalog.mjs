// Static, fictional sample catalogue. These are NOT tenders, grants or verified suppliers.
export const INDUSTRIES = [
  {id:'Catering',icon:'🍲',example:'Community catering',sale:'Lunch packages',expense:'Ingredients'},
  {id:'Retail',icon:'🛒',example:'Neighbourhood shop',sale:'Daily retail sales',expense:'Stock purchases'},
  {id:'Agriculture',icon:'🌱',example:'Fresh produce business',sale:'Vegetable orders',expense:'Seeds and transport'},
  {id:'Construction',icon:'🧱',example:'Building and maintenance',sale:'Repair contract',expense:'Materials'},
  {id:'Technology',icon:'💻',example:'Digital services studio',sale:'Website delivery',expense:'Internet and hosting'},
  {id:'Services',icon:'🛠️',example:'Cleaning and repairs',sale:'Monthly service',expense:'Equipment'},
  {id:'Manufacturing',icon:'🏭',example:'Small maker business',sale:'Product orders',expense:'Raw materials'},
  {id:'Beauty & Wellness',icon:'✂️',example:'Hair and beauty studio',sale:'Hair appointments',expense:'Products and supplies'},
  {id:'Transport',icon:'🚚',example:'Delivery service',sale:'Delivery jobs',expense:'Fuel'},
  {id:'Education',icon:'📚',example:'Tutoring centre',sale:'Tutoring sessions',expense:'Teaching materials'},
  {id:'Other',icon:'✨',example:'My own business',sale:'Customer order',expense:'Operating costs'}
];
export const PROVINCES = ['Eastern Cape','Free State','Gauteng','KwaZulu-Natal','Limpopo','Mpumalanga','North West','Northern Cape','Western Cape'];
export const OFFICIAL_SOURCES = [
 {id:'cipc',name:'CIPC BizPortal',category:'Registration',url:'https://www.bizportal.gov.za/',detail:'Official company registration services. Not every informal or sole-owner business must form a company.'},
 {id:'sars',name:'SARS — Starting a business and tax',category:'Tax guidance',url:'https://www.sars.gov.za/businesses-and-employers/small-businesses-taxpayers/starting-a-business-and-tax/',detail:'Learn about business forms and applicable tax obligations.'},
 {id:'csd',name:'Central Supplier Database',category:'Supplier readiness',url:'https://secure.csd.gov.za/',detail:'Official government supplier registration service.'},
 {id:'etenders',name:'National Treasury eTender Portal',category:'Live procurement website',url:'https://www.etenders.gov.za/',detail:'Search current published tenders on the official portal. Listings below are practice examples.'}
];
export const DEMO_OPPORTUNITIES = INDUSTRIES.filter(i=>i.id!=='Other').map((i,index)=>({
 id:`SAMPLE-${String(index+1).padStart(3,'0')}`,industry:i.id,
 title:`Example request for ${i.sale.toLowerCase()}`,buyer:'Fictional Community Enterprise Hub',
 value:5000+(index+1)*3200,region:PROVINCES[index%PROVINCES.length],
 description:`Practice brief only: prepare a quotation for ${i.sale.toLowerCase()}. This is NOT a published tender.`,sample:true
}));
export const DOC_ITEMS = [
 {id:'registration',name:'Registration evidence, if applicable',url:OFFICIAL_SOURCES[0].url},
 {id:'tax',name:'Relevant tax records or compliance evidence',url:OFFICIAL_SOURCES[1].url},
 {id:'bank',name:'Business banking records',url:''},
 {id:'identity',name:'Owner identification (self-declared)',url:''}
];
export const FRAUD_RULES = [
 ['Requests advance payment', /upfront|processing fee|registration fee|pay first|deposit to (release|unlock)/i],
 ['Pressures an urgent decision', /urgent|act now|immediately|last chance|within 24 hours|today only/i],
 ['Requests passwords or one-time codes', /\botp\b|password|banking pin|\bcvv\b|one.time pin/i],
 ['Claims guaranteed funding', /guaranteed (funding|loan|grant)|100% approved|no checks/i],
 ['Unverified contact or shortened link', /bit\.ly\/|tinyurl\.com|telegram|whatsapp only|crypto wallet/i]
];
