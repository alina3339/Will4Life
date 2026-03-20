(function(){
"use strict";

var DB = {companyName:"Estate Planner",tagline:"UK Estate Planning",logo:null,primaryColor:"#1a4a6e",darkColor:"#1a2a3a",accentColor:"#b45309",contactName:"",contactEmail:"",contactPhone:"",contactAddress:"",website:"",fca:"",sraNumber:""};
var PRESETS = [
  {n:"Navy",p:"#1a4a6e",d:"#1a2a3a",a:"#b45309"},
  {n:"Emerald",p:"#065f46",d:"#022c22",a:"#d97706"},
  {n:"Purple",p:"#5b21b6",d:"#2e1065",a:"#c2410c"},
  {n:"Slate",p:"#475569",d:"#1e293b",a:"#0891b2"},
  {n:"Burgundy",p:"#7f1d1d",d:"#450a0a",a:"#a16207"},
  {n:"Midnight",p:"#1e1b4b",d:"#0f0e2a",a:"#ca8a04"}
];
var ET = [
  {id:"details",l:"Customer Details"},{id:"will",l:"Will Writing"},
  {id:"poa",l:"Power of Attorney"},{id:"trust",l:"Trust & Probate"},
  {id:"estate",l:"Estate Planning"},{id:"iht",l:"Inheritance Tax"},
  {id:"review",l:"Review & Approve"}
];

function emptyWill(){return {personal:{},family:[],assets:[],
isMirrorWill:"",mirrorPartnerName:"",mirrorPartnerAddress:"",mirrorPartnerDOB:"",
executors:[],substituteExecutors:[],
willTrustees:[],trusteeAppointmentBasis:"",
guardians:[],
funeralType:"",flowers:"",serviceType:"",serviceLocation:"",burialLocation:"",denomination:"",ashesInstructions:"",celebrationOfLife:"",funeralWishes:"",
legacies:[],
propertyTrust:"",trustPropertyAddress:"",trustPropertyType:"",propertyTrustees:[],occupantName:"",occupantRelationship:"",lifeInterestEnd:"",
residuaryBeneficiary:"",residuaryBeneficiaryRel:"",survivorshipDays:"",
ifPrimaryFailsToChildren:"",childrenAge:"",perStirpes:"",issueAge:"",
ultimateBeneficiary:"",ultimateBeneficiaryType:"",ultimateCharityNumber:"",
hasBusinessInterests:"",businessType:"",bizCanContinue:"",bizCanSell:"",bizCanWindUp:"",bizCanAppointManagers:"",bizCanNegotiate:"",bizCanPreemption:"",bizCanClaimBPR:"",bizCanDelegate:"",bizCanAdvise:"",bizIncomeToResidue:"",
payDebts:"Yes",payFuneralCosts:"Yes",payExecutorCosts:"Yes",payTaxOnGifts:"Yes",
includeSeverability:"Yes",
executionDate:"",witness1Name:"",witness1Address:"",witness1Phone:"",witness1Occupation:"",witness2Name:"",witness2Address:"",witness2Phone:"",witness2Occupation:"",
letterOfWishes:"",digitalWishes:"",petCare:""};}function emptyPoa(){return {hwCreate:"",hwLifeSustaining:"",hwPreferences:"",hwConsult:"",pfCreate:"",pfWhen:"",pfRestrictions:"",attorneys:[],attorneyDecision:"",certProviderName:"",certProviderRel:""};}
function emptyTrust(){return {trustType:"",trustName:"",trustStart:"",trustEnd:"",trustPurpose:"",trustBeneficiaries:"",distributionTerms:"",trustees:[],trustAssets:[],probateNeeded:"",docLocations:"",executorNotes:""};}
function emptyEstate(){return {epAssets:[],liabilities:[],distributions:[]};}
function cloneObj(o){return JSON.parse(JSON.stringify(o));}

var S = {
  view:"customers",tab:"details",
  brand:cloneObj(DB),
  customerId:null,customer:null,
  wd:emptyWill(),pd:emptyPoa(),td:emptyTrust(),ed:emptyEstate(),id:{},
  dirty:false,saving:false,lastSaved:null,saveError:null,
  wf:{stage:0,sentTo:"",sentDate:null,approvedBy:"",approvedDate:null,comments:"",finalDate:null},
  subTab:{},health:null
};

var api = window.api || {};
var autoTimer = null;

function safe(fn,fb){
  if(!fn)return Promise.resolve(fb||{success:false,error:"N/A"});
  try{return fn().then(null,function(e){return fb||{success:false,error:e.message};});}
  catch(e){return Promise.resolve(fb||{success:false,error:e.message});}
}

function toast(m){var d=document.createElement("div");d.className="to";d.textContent=m;document.body.appendChild(d);setTimeout(function(){d.remove();},3000);}
function esc(s){var d=document.createElement("div");d.textContent=s||"";return d.innerHTML;}

function fld(label,name,val,type,opts){
  var o=opts||{};var req=o.req?'<span class="rq"> *</span>':"";
  var hint=o.hint?'<div class="hn">'+esc(o.hint)+'</div>':"";
  var ph=o.ph||"";
  if(type==="select"){
    var ops=(o.options||[]).map(function(op){
      var v=Array.isArray(op)?op[0]:op;var l=Array.isArray(op)?op[1]:op;
      return '<option value="'+esc(v)+'"'+(val===v?" selected":"")+'>'+esc(l)+'</option>';
    }).join("");
    return '<div><label class="fl">'+label+req+'</label>'+hint+'<select class="fi" data-field="'+name+'"><option value="">Select</option>'+ops+'</select></div>';
  }
  if(type==="textarea")return '<div><label class="fl">'+label+req+'</label>'+hint+'<textarea class="fi" data-field="'+name+'" placeholder="'+esc(ph)+'">'+esc(val||"")+'</textarea></div>';
  return '<div><label class="fl">'+label+req+'</label>'+hint+'<input class="fi" type="'+(type||"text")+'" data-field="'+name+'" value="'+esc(val||"")+'" placeholder="'+esc(ph)+'"></div>';
}

function lst(items,key,renderFn,addLabel){
  var h="";
  (items||[]).forEach(function(item,i){h+='<div class="li"><button class="rm" data-remove="'+key+'" data-idx="'+i+'">&times;</button>'+renderFn(item,i,key)+'</div>';});
  h+='<button class="ab" data-add="'+key+'">+ '+addLabel+'</button>';
  return h;
}

function pls(tabs,active,group){
  return '<div class="pl">'+tabs.map(function(t){return '<button class="'+(t===active?"a":"")+'" data-pill="'+group+'" data-val="'+t+'">'+t+'</button>';}).join("")+'</div>';
}

function nf(text,type){return '<div class="nf '+(type||"")+'">'+text+'</div>';}

// === BRANDING ===
function rBrand(){
  var b=S.brand,sub=S.subTab.brand||"Company";
  var h=pls(["Company","Logo","Colours","Preview"],sub,"brand");
  if(sub==="Company"){
    h+='<div class="cd"><h3>Company Details</h3><div class="nt">Appears on all documents and emails.</div>';
    h+='<div class="rw r2">'+fld("Company Name","brand.companyName",b.companyName,"text",{req:1})+fld("Tagline","brand.tagline",b.tagline)+'</div>';
    h+='<div class="rw r2">'+fld("Contact Name","brand.contactName",b.contactName)+fld("Email","brand.contactEmail",b.contactEmail,"email")+'</div>';
    h+='<div class="rw r2">'+fld("Phone","brand.contactPhone",b.contactPhone)+fld("Website","brand.website",b.website)+'</div>';
    h+=fld("Address","brand.contactAddress",b.contactAddress,"textarea");
    h+='<div class="rw r2">'+fld("SRA Number","brand.sraNumber",b.sraNumber)+fld("FCA Number","brand.fca",b.fca)+'</div></div>';
  }else if(sub==="Logo"){
    h+='<div class="cd"><h3>Logo</h3><div class="nt">Appears in header and documents.</div>';
    h+='<div style="display:flex;gap:20px;flex-wrap:wrap"><div style="flex:1 1 260px">';
    h+='<div id="logo-drop" style="border:2px dashed #9ca3af;border-radius:10px;padding:30px;text-align:center;cursor:pointer;background:#f9fafb"><div style="font-weight:600;margin-bottom:4px">Click to upload</div><div style="font-size:12px;color:#6b7a8d">PNG, JPG, SVG</div></div>';
    h+='<input type="file" id="logo-input" accept="image/*" style="display:none">';
    if(b.logo)h+='<button class="bt" style="margin-top:8px" data-action="remove-logo">Remove Logo</button>';
    h+='</div><div style="flex:0 0 220px"><div style="font-size:12px;color:#6b7a8d;font-weight:600;margin-bottom:6px">PREVIEW</div>';
    h+='<div style="background:'+b.darkColor+';border-radius:8px;padding:16px;display:flex;align-items:center;justify-content:center;min-height:60px;margin-bottom:8px">';
    h+=b.logo?'<img src="'+b.logo+'" style="max-height:48px;max-width:200px">':'<span style="font-size:16px;font-weight:700;color:#fff">'+esc(b.companyName)+'</span>';
    h+='</div><div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:16px;display:flex;align-items:center;justify-content:center;min-height:60px">';
    h+=b.logo?'<img src="'+b.logo+'" style="max-height:48px;max-width:200px">':'<span style="font-size:16px;font-weight:700;color:'+b.primaryColor+'">'+esc(b.companyName)+'</span>';
    h+='</div></div></div></div>';
  }else if(sub==="Colours"){
    h+='<div class="cd"><h3>Presets</h3><div class="ps">';
    PRESETS.forEach(function(p){
      h+='<div class="pe'+(b.primaryColor===p.p?' se':'')+'" data-preset="'+p.n+'">';
      h+='<div style="display:flex;gap:4px;margin-bottom:6px"><div style="width:22px;height:22px;border-radius:4px;background:'+p.d+'"></div><div style="width:22px;height:22px;border-radius:4px;background:'+p.p+'"></div><div style="width:22px;height:22px;border-radius:4px;background:'+p.a+'"></div></div>';
      h+='<div style="font-size:12px;font-weight:600">'+p.n+'</div></div>';
    });
    h+='</div></div>';
    h+='<div class="cd"><h3>Custom</h3><div class="rw r3">';
    [{k:"primaryColor",l:"Primary"},{k:"darkColor",l:"Dark"},{k:"accentColor",l:"Accent"}].forEach(function(c){
      h+='<div><label class="fl">'+c.l+'</label><div style="display:flex;gap:6px;align-items:center"><input type="color" value="'+b[c.k]+'" data-color="'+c.k+'" style="width:36px;height:36px;border:none;border-radius:6px;cursor:pointer"><input class="fi" value="'+b[c.k]+'" data-field="brand.'+c.k+'" style="font-family:monospace;font-size:13px"></div></div>';
    });
    h+='</div></div>';
  }else if(sub==="Preview"){
    h+='<div class="cd"><h3>Live Preview</h3>';
    h+='<div style="font-size:12px;color:#6b7a8d;font-weight:600;margin-bottom:6px">HEADER</div>';
    h+='<div style="background:linear-gradient(135deg,'+b.darkColor+','+b.primaryColor+');border-radius:8px;padding:16px 22px;border-bottom:3px solid '+b.accentColor+';margin-bottom:16px">';
    h+='<div style="display:flex;align-items:center;gap:12px">';
    if(b.logo)h+='<img src="'+b.logo+'" style="max-height:36px">';
    h+='<div><div style="font-size:18px;font-weight:700;color:#fff">'+esc(b.companyName)+'</div><div style="font-size:11px;color:rgba(255,255,255,.5)">'+esc(b.tagline)+'</div></div></div></div>';
    h+='<button class="bt" style="margin-top:14px" data-action="reset-brand">Reset to Defaults</button></div>';
  }
  return h;
}

// === WILL ===
function rWill(){
  var d=S.wd,p=d.personal||{},sub=S.subTab.will||"Personal";
  var tabs=["Personal","Mirror Will","Family","Executors & Trustees","Guardians","Specific Legacies","Property Trust","Residuary Estate","Business Interests","Funeral Wishes","Admin & Severability","Execution","Other Wishes"];
  var h=pls(tabs,sub,"will");

  if(sub==="Personal"){
    h+='<div class="cd"><h3>Personal Details</h3><div class="nt">Full legal details as they should appear on your will.</div>';
    h+='<div class="rw r2">'+fld("Title","wd.personal.title",p.title,"select",{req:1,options:["Mr","Mrs","Ms","Miss","Mx","Dr","Prof"]})+fld("Full Legal Name","wd.personal.fullName",p.fullName,"text",{req:1,ph:"As on passport/driving licence"})+'</div>';
    h+='<div class="rw r2">'+fld("Former / Maiden Name","wd.personal.formerName",p.formerName)+fld("Date of Birth","wd.personal.dob",p.dob,"date",{req:1})+'</div>';
    h+='<div class="rw r2">'+fld("NI Number","wd.personal.ni",p.ni,"text",{ph:"QQ 12 34 56 C"})+fld("Marital Status","wd.personal.maritalStatus",p.maritalStatus,"select",{req:1,options:["Single","Married","Civil Partnership","Divorced","Widowed","Separated"]})+'</div>';
    h+=fld("Full Address","wd.personal.address",p.address,"textarea",{req:1,ph:"Including postcode"});
    h+='<div class="rw r2">'+fld("Phone","wd.personal.phone",p.phone)+fld("Email","wd.personal.email",p.email,"email")+'</div></div>';

  }else if(sub==="Mirror Will"){
    h+='<div class="cd"><h3>Mirror Will</h3><div class="nt">A mirror will is made alongside a spouse or partner with similar terms. Either party retains the right to change or revoke independently.</div>';
    h+=fld("Is this a mirror will?","wd.isMirrorWill",d.isMirrorWill,"select",{options:["Yes","No"]});
    if(d.isMirrorWill==="Yes"){
      h+='<div class="rw r2">'+fld("Partner Full Name","wd.mirrorPartnerName",d.mirrorPartnerName,"text",{req:1})+fld("Partner DOB","wd.mirrorPartnerDOB",d.mirrorPartnerDOB,"date")+'</div>';
      h+=fld("Partner Address","wd.mirrorPartnerAddress",d.mirrorPartnerAddress,"textarea",{ph:"If same address, enter same"});
      h+=nf("Both parties have agreed that either can change or revoke their will at any time independently.");
    }
    h+='</div>';

  }else if(sub==="Family"){
    h+='<div class="cd"><h3>Family Members</h3><div class="nt">Spouse/partner, children, and dependants.</div>'+lst(d.family,"wd.family",function(f,i,k){
      return '<div class="rw r3">'+fld("Full Name",k+"."+i+".name",f.name)+fld("Relationship",k+"."+i+".relationship",f.relationship,"select",{options:["Spouse","Civil Partner","Son","Daughter","Stepchild","Grandchild","Parent","Sibling","Other"]})+fld("DOB",k+"."+i+".dob",f.dob,"date")+'</div><div class="rw r2">'+fld("Address",k+"."+i+".address",f.address)+fld("Dependant?",k+"."+i+".dependant",f.dependant,"select",{options:["Yes","No"]})+'</div>';
    },"Add family member")+'</div>';

  }else if(sub==="Executors & Trustees"){
    h+='<div class="cd"><h3>Executors</h3><div class="nt">1-4 people who carry out your will. Include DOB for identification.</div>';
    h+=lst(d.executors,"wd.executors",function(x,i,k){
      return '<div class="rw r3">'+fld("Full Name",k+"."+i+".name",x.name,null,{req:1})+fld("DOB",k+"."+i+".dob",x.dob,"date")+fld("Relationship",k+"."+i+".relationship",x.relationship)+'</div><div class="rw r2">'+fld("Full Address",k+"."+i+".address",x.address,null,{req:1})+fld("Type",k+"."+i+".type",x.type,"select",{options:["Individual","Solicitor","Bank/Trust Co"]})+'</div>';
    },"Add executor")+'</div>';

    h+='<div class="cd"><h3>Substitute Executors</h3><div class="nt">If any appointed executor is unable or unwilling to act.</div>';
    h+=lst(d.substituteExecutors,"wd.substituteExecutors",function(x,i,k){
      return '<div class="rw r3">'+fld("Full Name",k+"."+i+".name",x.name)+fld("Relationship",k+"."+i+".relationship",x.relationship)+fld("Full Address",k+"."+i+".address",x.address)+'</div>';
    },"Add substitute executor")+'</div>';

    h+='<div class="cd"><h3>Trustees</h3><div class="nt">Trustees manage any trusts created by this will. May be the same as executors or different.</div>';
    h+=fld("Trustee appointment basis","wd.trusteeAppointmentBasis",d.trusteeAppointmentBasis,"select",{options:["Named individuals below","Those executors who obtain probate"]});
    if(d.trusteeAppointmentBasis==="Named individuals below"){
      h+=lst(d.willTrustees,"wd.willTrustees",function(t,i,k){
        return '<div class="rw r3">'+fld("Full Name",k+"."+i+".name",t.name)+fld("Relationship",k+"."+i+".relationship",t.relationship)+fld("Full Address",k+"."+i+".address",t.address)+'</div>';
      },"Add trustee");
    }
    h+='</div>';

  }else if(sub==="Guardians"){
    h+='<div class="cd"><h3>Guardians</h3><div class="nt">If you have children under 18, appoint who should care for them if both parents die.</div>';
    h+=lst(d.guardians,"wd.guardians",function(g,i,k){
      return '<div class="rw r3">'+fld("Guardian Name",k+"."+i+".name",g.name,null,{req:1})+fld("Relationship",k+"."+i+".relationship",g.relationship)+fld("Full Address",k+"."+i+".address",g.address)+'</div><div class="rw r2">'+fld("Guardian for (child name)",k+"."+i+".guardianFor",g.guardianFor,null,{ph:"e.g. Sophie Grace Harrison"})+fld("Condition",k+"."+i+".condition",g.condition,"select",{options:["If spouse predeceases me","If both parents die","Other"]})+'</div><div class="rw r2">'+fld("Substitute Guardian Name",k+"."+i+".substituteName",g.substituteName)+fld("Substitute Address",k+"."+i+".substituteAddress",g.substituteAddress)+'</div>';
    },"Add guardian appointment")+'</div>';

  }else if(sub==="Specific Legacies"){
    h+='<div class="cd"><h3>Specific Legacies</h3><div class="nt">Cash gifts, specific items, and charitable donations. These are distributed before the residuary estate.</div>';
    h+=lst(d.legacies,"wd.legacies",function(l,i,k){
      return '<div class="rw r3">'+fld("Type",k+"."+i+".legacyType",l.legacyType,"select",{req:1,options:["Cash to Individual","Cash to Charity","Specific Item","Other"]})+fld("Recipient Name",k+"."+i+".recipientName",l.recipientName,null,{req:1})+fld("Recipient Type",k+"."+i+".recipientType",l.recipientType,"select",{options:["Individual","Charity"]})+'</div>'
        +'<div class="rw r2">'+fld("Amount (if cash)","wd.legacies."+i+".amount",l.amount,"number",{ph:"e.g. 5000"})+fld("Charity Number",k+"."+i+".charityNumber",l.charityNumber,null,{ph:"e.g. 1089464"})+'</div>'
        +'<div class="rw r2">'+fld("Item Description (if item)",k+"."+i+".itemDescription",l.itemDescription,null,{ph:"e.g. Gold Pocket Watch engraved To George with love"})+fld("Free of IHT?",k+"."+i+".taxFree",l.taxFree,"select",{options:["Yes","No"]})+'</div>'
        +fld("Condition",k+"."+i+".condition",l.condition,"select",{options:["Absolutely","Conditional"]});
    },"Add legacy")+'</div>';

  }else if(sub==="Property Trust"){
    h+='<div class="cd"><h3>Right to Occupy / Property Trust</h3><div class="nt">A property trust gives a named person the right to live in the property during their lifetime, after which it passes to the ultimate beneficiaries.</div>';
    h+=fld("Create a property trust?","wd.propertyTrust",d.propertyTrust,"select",{options:["Yes","No"]});
    if(d.propertyTrust==="Yes"){
      h+=fld("Property Address","wd.trustPropertyAddress",d.trustPropertyAddress,"textarea",{req:1,ph:"Full address or main residence"});
      h+=fld("Property Description","wd.trustPropertyType",d.trustPropertyType,"select",{options:["Main residence (or any replacement)","Specific named property only"]});
      h+='<div class="cd" style="margin-top:12px"><h3>Property Trustees</h3><div class="nt">Who manages the property trust.</div>';
      h+=lst(d.propertyTrustees,"wd.propertyTrustees",function(t,i,k){
        return '<div class="rw r3">'+fld("Full Name",k+"."+i+".name",t.name)+fld("DOB",k+"."+i+".dob",t.dob,"date")+fld("Full Address",k+"."+i+".address",t.address)+'</div>';
      },"Add property trustee")+'</div>';
      h+='<div class="rw r2">'+fld("Occupant (life tenant)","wd.occupantName",d.occupantName,null,{req:1,ph:"e.g. Karen Louise Harrison"})+fld("Occupant Relationship","wd.occupantRelationship",d.occupantRelationship)+'</div>';
      h+=fld("Life interest ends on","wd.lifeInterestEnd",d.lifeInterestEnd,"select",{options:["Death of life tenant","Death or remarriage","Death, remarriage or cohabitation","Specific date","Other"]});
    }
    h+='</div>';

  }else if(sub==="Residuary Estate"){
    h+='<div class="cd"><h3>Gift of Residue</h3><div class="nt">After debts, expenses, and specific legacies are paid, the remainder of your estate (the residue) is distributed as follows.</div>';
    h+='<div class="rw r2">'+fld("Primary Beneficiary","wd.residuaryBeneficiary",d.residuaryBeneficiary,null,{req:1,ph:"e.g. Karen Louise Harrison"})+fld("Relationship","wd.residuaryBeneficiaryRel",d.residuaryBeneficiaryRel)+'</div>';
    h+=fld("Survivorship Period (days)","wd.survivorshipDays",d.survivorshipDays,"number",{ph:"e.g. 30",hint:"Primary beneficiary must survive you by this many days to inherit."});
    h+='</div>';

    h+='<div class="cd"><h3>If Primary Gift Fails</h3><div class="nt">What happens if the primary beneficiary dies before you or within the survivorship period.</div>';
    h+=fld("Pass to children?","wd.ifPrimaryFailsToChildren",d.ifPrimaryFailsToChildren,"select",{options:["Yes","No"]});
    if(d.ifPrimaryFailsToChildren==="Yes"){
      h+=fld("Children must attain age","wd.childrenAge",d.childrenAge,"number",{ph:"e.g. 18",hint:"Children inherit their share upon reaching this age."});
      h+='<div class="rw r2">'+fld("Per stirpes (issue take parent share)?","wd.perStirpes",d.perStirpes,"select",{options:["Yes","No"]})+fld("Issue must attain age","wd.issueAge",d.issueAge,"number",{ph:"e.g. 18 or 21"})+'</div>';
      h+=nf("Per stirpes means if a child dies before you, their children take their parent's share in equal parts.");
    }
    h+='</div>';

    h+='<div class="cd"><h3>Ultimate Default Beneficiary</h3><div class="nt">If all the above gifts fail entirely.</div>';
    h+='<div class="rw r2">'+fld("Beneficiary Name","wd.ultimateBeneficiary",d.ultimateBeneficiary,null,{ph:"e.g. Cancer Research UK"})+fld("Type","wd.ultimateBeneficiaryType",d.ultimateBeneficiaryType,"select",{options:["Individual","Charity"]})+'</div>';
    if(d.ultimateBeneficiaryType==="Charity"){
      h+=fld("Charity Registration Number","wd.ultimateCharityNumber",d.ultimateCharityNumber,null,{ph:"e.g. 1089464"});
      h+=nf("The charity will receive the residuary estate absolutely for its general charitable purposes.");
    }
    h+='</div>';

  }else if(sub==="Business Interests"){
    h+='<div class="cd"><h3>Business Interests</h3><div class="nt">If you own a business (sole trader, partnership, or company shares), your executors need authority to deal with it.</div>';
    h+=fld("Do you have business interests?","wd.hasBusinessInterests",d.hasBusinessInterests,"select",{options:["Yes","No"]});
    if(d.hasBusinessInterests==="Yes"){
      h+=fld("Business Type","wd.businessType",d.businessType,"select",{options:["Sole Trader","Partnership","Company Shares (Director)","Company Shares (Investor)","Multiple"]});
      h+='<div class="cd" style="margin-top:12px"><h3>Executor Powers</h3><div class="nt">Authorise your executors to take the following actions with your business interests.</div>';
      var biz=[["Continue operations","bizCanContinue"],["Sell the business","bizCanSell"],["Wind up operations","bizCanWindUp"],["Appoint managers or agents","bizCanAppointManagers"],["Negotiate sale agreements","bizCanNegotiate"],["Exercise pre-emption or buyout rights","bizCanPreemption"],["Claim Business Property Relief","bizCanClaimBPR"],["Delegate powers","bizCanDelegate"],["Take professional advice","bizCanAdvise"]];
      biz.forEach(function(b){h+=fld(b[0],"wd."+b[1],d[b[1]],"select",{options:["Yes","No"]});});
      h+='</div>';
      h+=fld("Business income/proceeds to residuary estate?","wd.bizIncomeToResidue",d.bizIncomeToResidue,"select",{options:["Yes","No"]});
    }
    h+='</div>';

  }else if(sub==="Funeral Wishes"){
    h+='<div class="cd"><h3>Funeral Wishes</h3><div class="nt">Not legally binding but helps your family. Record as much detail as you wish.</div>';
    h+=fld("Burial or Cremation","wd.funeralType",d.funeralType,"select",{options:["Burial","Cremation","Green/Woodland Burial","Donation to Medical Science","No Preference"]});
    if(d.funeralType==="Cremation"){
      h+=fld("Ashes Instructions","wd.ashesInstructions",d.ashesInstructions,"textarea",{ph:"e.g. Scattered at Ladybower Reservoir in the Peak District"});
    }
    if(d.funeralType==="Burial"){
      h+='<div class="rw r2">'+fld("Burial Location","wd.burialLocation",d.burialLocation,null,{ph:"e.g. Southern Cemetery, Manchester"})+fld("Denomination","wd.denomination",d.denomination,null,{ph:"e.g. Church of England"})+'</div>';
    }
    h+='<div class="rw r2">'+fld("Service Type","wd.serviceType",d.serviceType,"select",{options:["Religious Service","Celebration of Life","Humanist","Civil","No Service","Other"]})+fld("Service Location","wd.serviceLocation",d.serviceLocation,null,{ph:"e.g. St Mary's Church, Didsbury"})+'</div>';
    h+='<div class="rw r2">'+fld("Flowers?","wd.flowers",d.flowers,"select",{options:["Yes","No","Donations in lieu"]})+fld("Celebration of life?","wd.celebrationOfLife",d.celebrationOfLife,"select",{options:["Yes","No"]})+'</div>';
    h+=fld("Other funeral wishes","wd.funeralWishes",d.funeralWishes,"textarea",{ph:"Any other specific wishes"});
    h+='</div>';

  }else if(sub==="Admin & Severability"){
    h+='<div class="cd"><h3>Administrative Provisions</h3><div class="nt">Standard provisions for estate administration. These are usually all set to Yes.</div>';
    h+='<div class="rw r2">'+fld("Pay debts","wd.payDebts",d.payDebts,"select",{options:["Yes","No"]})+fld("Pay funeral costs","wd.payFuneralCosts",d.payFuneralCosts,"select",{options:["Yes","No"]})+'</div>';
    h+='<div class="rw r2">'+fld("Pay executor/admin costs","wd.payExecutorCosts",d.payExecutorCosts,"select",{options:["Yes","No"]})+fld("Pay tax on lifetime gifts","wd.payTaxOnGifts",d.payTaxOnGifts,"select",{options:["Yes","No"]})+'</div>';
    h+='</div>';
    h+='<div class="cd"><h3>Severability</h3><div class="nt">If any provision is held invalid, it does not affect the rest of the will.</div>';
    h+=fld("Include severability clause?","wd.includeSeverability",d.includeSeverability,"select",{options:["Yes","No"]});
    h+='</div>';

  }else if(sub==="Execution"){
    h+='<div class="cd"><h3>Execution Details</h3><div class="nt">The will must be signed by the testator in the presence of two witnesses, both present at the same time.</div>';
    h+=fld("Date of Execution","wd.executionDate",d.executionDate,"date");
    h+='</div>';
    h+='<div class="cd"><h3>Witness 1</h3>';
    h+='<div class="rw r2">'+fld("Full Name","wd.witness1Name",d.witness1Name)+fld("Occupation","wd.witness1Occupation",d.witness1Occupation)+'</div>';
    h+=fld("Address","wd.witness1Address",d.witness1Address,"textarea");
    h+=fld("Phone","wd.witness1Phone",d.witness1Phone);
    h+='</div>';
    h+='<div class="cd"><h3>Witness 2</h3>';
    h+='<div class="rw r2">'+fld("Full Name","wd.witness2Name",d.witness2Name)+fld("Occupation","wd.witness2Occupation",d.witness2Occupation)+'</div>';
    h+=fld("Address","wd.witness2Address",d.witness2Address,"textarea");
    h+=fld("Phone","wd.witness2Phone",d.witness2Phone);
    h+='</div>';
    h+=nf("Witnesses must not be beneficiaries of the will or the spouse/civil partner of a beneficiary. Both must be present when the testator signs.");

  }else if(sub==="Other Wishes"){
    h+='<div class="cd"><h3>Letter of Wishes</h3><div class="nt">A personal letter to your executors with guidance. Not legally binding but helpful.</div>';
    h+=fld("Letter of Wishes","wd.letterOfWishes",d.letterOfWishes,"textarea",{ph:"Personal messages, sentimental items, distribution guidance..."});
    h+='</div>';
    h+='<div class="cd"><h3>Digital Estate</h3>';
    h+=fld("Digital estate instructions","wd.digitalWishes",d.digitalWishes,"textarea",{ph:"Social media, email accounts, subscriptions, crypto wallets..."});
    h+='</div>';
    h+='<div class="cd"><h3>Pet Care</h3>';
    h+=fld("Pet care arrangements","wd.petCare",d.petCare,"textarea",{ph:"Who should care for your pets? Any funds set aside?"});
    h+='</div>';
  }
  return h;
}

// === POA ===
function rPoa(){
  var d=S.pd,sub=S.subTab.poa||"Health";
  var h=pls(["Health","Financial","Attorneys","Certificate"],sub,"poa");
  h+=nf("A Lasting Power of Attorney lets someone you trust make decisions if you lose mental capacity.");
  if(sub==="Health"){h+='<div class="cd"><h3>Health & Welfare LPA</h3>'+fld("Create?","pd.hwCreate",d.hwCreate,"select",{req:1,options:["Yes","No","Not sure"]});if(d.hwCreate==="Yes"){h+=fld("Life-Sustaining Treatment","pd.hwLifeSustaining",d.hwLifeSustaining,"select",{req:1,options:["Yes - attorneys can decide","No"]})+fld("Preferences","pd.hwPreferences",d.hwPreferences,"textarea")+fld("People to Consult","pd.hwConsult",d.hwConsult,"textarea");}h+='</div>';}
  else if(sub==="Financial"){h+='<div class="cd"><h3>Property & Financial LPA</h3>'+fld("Create?","pd.pfCreate",d.pfCreate,"select",{req:1,options:["Yes","No","Not sure"]});if(d.pfCreate==="Yes"){h+=fld("When active?","pd.pfWhen",d.pfWhen,"select",{req:1,options:["As soon as registered","Only when lacking capacity"]})+fld("Restrictions","pd.pfRestrictions",d.pfRestrictions,"textarea");}h+='</div>';}
  else if(sub==="Attorneys"){h+='<div class="cd"><h3>Attorneys</h3>'+lst(d.attorneys,"pd.attorneys",function(a,i,k){return '<div class="rw r3">'+fld("Name",k+"."+i+".name",a.name)+fld("DOB",k+"."+i+".dob",a.dob,"date")+fld("Relationship",k+"."+i+".relationship",a.relationship)+'</div>';},"Add attorney")+fld("Decision mode","pd.attorneyDecision",d.attorneyDecision,"select",{options:["Jointly","Jointly and Severally","Mixed"]})+'</div>';}
  else if(sub==="Certificate"){h+='<div class="cd"><h3>Certificate Provider</h3><div class="nt">Confirms you understand the LPA.</div><div class="rw r2">'+fld("Name","pd.certProviderName",d.certProviderName,"text",{req:1})+fld("Relationship","pd.certProviderRel",d.certProviderRel)+'</div>'+nf("\u00a382 per LPA with the OPG.")+'</div>';}
  return h;
}

// === TRUST ===
function rTrust(){
  var d=S.td,sub=S.subTab.trust||"Setup";
  var h=pls(["Setup","Trustees","Assets","Probate"],sub,"trust");
  if(sub==="Setup"){h+='<div class="cd"><h3>Trust Configuration</h3>'+fld("Type","td.trustType",d.trustType,"select",{req:1,options:["Bare Trust","Discretionary","Life Interest","Protective Property","18-25 Trust","Other"]})+fld("Name","td.trustName",d.trustName)+'<div class="rw r2">'+fld("Start","td.trustStart",d.trustStart,"date")+fld("Duration","td.trustEnd",d.trustEnd)+'</div>'+fld("Purpose","td.trustPurpose",d.trustPurpose,"textarea")+fld("Beneficiaries","td.trustBeneficiaries",d.trustBeneficiaries,"textarea")+fld("Distribution Terms","td.distributionTerms",d.distributionTerms,"textarea")+'</div>';}
  else if(sub==="Trustees"){h+='<div class="cd"><h3>Trustees</h3>'+lst(d.trustees,"td.trustees",function(t,i,k){return '<div class="rw r3">'+fld("Name",k+"."+i+".name",t.name)+fld("Role",k+"."+i+".role",t.role,"select",{options:["Original","Replacement","Professional"]})+fld("Address",k+"."+i+".address",t.address)+'</div>';},"Add trustee")+'</div>';}
  else if(sub==="Assets"){h+='<div class="cd"><h3>Trust Assets</h3>'+lst(d.trustAssets,"td.trustAssets",function(a,i,k){return '<div class="rw r3">'+fld("Type",k+"."+i+".type",a.type,"select",{options:["Property","Cash","Investments","Business","Life Policy","Other"]})+fld("Description",k+"."+i+".description",a.description)+fld("Value",k+"."+i+".value",a.value,"number")+'</div>';},"Add asset")+'</div>';}
  else if(sub==="Probate"){h+='<div class="cd"><h3>Probate</h3>'+fld("Needed?","td.probateNeeded",d.probateNeeded,"select",{options:["Yes","No","Not sure"]})+fld("Document Locations","td.docLocations",d.docLocations,"textarea")+fld("Executor Notes","td.executorNotes",d.executorNotes,"textarea")+'</div>';}
  return h;
}

// === ESTATE ===
function rEstate(){
  var d=S.ed,sub=S.subTab.estate||"Assets";
  var tA=(d.epAssets||[]).reduce(function(s,a){return s+(parseFloat(a.value)||0);},0);
  var tL=(d.liabilities||[]).reduce(function(s,l){return s+(parseFloat(l.value)||0);},0);
  var h=pls(["Assets","Liabilities","Summary","Distribution"],sub,"estate");
  if(sub==="Assets"){h+='<div class="cd"><h3>Asset Inventory</h3>'+lst(d.epAssets,"ed.epAssets",function(a,i,k){return '<div class="rw r4">'+fld("Category",k+"."+i+".category",a.category,"select",{options:["Property","Cash","Investments","Pensions","Insurance","Business","Vehicles","Valuables","Digital","Other"]})+fld("Description",k+"."+i+".description",a.description)+fld("Value",k+"."+i+".value",a.value,"number")+fld("Ownership",k+"."+i+".ownership",a.ownership,"select",{options:["Sole","Joint","Trust"]})+'</div>';},"Add asset");if(tA>0)h+='<div style="margin-top:12px;text-align:right;font-weight:700;color:#1a4a6e">Total: \u00a3'+tA.toLocaleString()+'</div>';h+='</div>';}
  else if(sub==="Liabilities"){h+='<div class="cd"><h3>Liabilities</h3>'+lst(d.liabilities,"ed.liabilities",function(l,i,k){return '<div class="rw r3">'+fld("Type",k+"."+i+".type",l.type,"select",{options:["Mortgage","Loan","Credit Card","Other"]})+fld("Details",k+"."+i+".details",l.details)+fld("Amount",k+"."+i+".value",l.value,"number")+'</div>';},"Add liability")+'</div>';}
  else if(sub==="Summary"){h+='<div class="cd"><h3>Estate Summary</h3><div class="rw r3">';[["Assets",tA,"#059669"],["Liabilities",tL,"#dc2626"],["Net Estate",tA-tL,"#1a4a6e"]].forEach(function(x){h+='<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;text-align:center"><div style="font-size:11px;color:#6b7a8d;text-transform:uppercase;margin-bottom:4px">'+x[0]+'</div><div style="font-size:24px;font-weight:700;color:'+x[2]+'">\u00a3'+x[1].toLocaleString()+'</div></div>';});h+='</div></div>';}
  else if(sub==="Distribution"){h+='<div class="cd"><h3>Distribution Plan</h3>'+lst(d.distributions,"ed.distributions",function(x,i,k){return '<div class="rw r3">'+fld("Beneficiary",k+"."+i+".name",x.name)+fld("Share/Gift",k+"."+i+".share",x.share)+fld("Conditions",k+"."+i+".conditions",x.conditions)+'</div>';},"Add distribution")+'</div>';}
  return h;
}

// === IHT ===
function rIht(){
  var d=S.id,sub=S.subTab.iht||"Valuation";
  var ev=parseFloat(d.totalEstate)||0,nrb=325000,rnrb=d.qualifiesRNRB==="Yes"?175000:0;
  var tN=d.transferredNRB==="Yes"?nrb:0,tR=d.transferredRNRB==="Yes"?rnrb:0;
  var al=nrb+rnrb+tN+tR,ex=parseFloat(d.totalExemptions)||0,re=parseFloat(d.totalReliefs)||0;
  var tx=Math.max(0,ev-al-ex-re),rt=d.charityGift==="Yes"?0.36:0.4;
  var h=pls(["Valuation","Allowances","Estimate","Tips"],sub,"iht");
  if(sub==="Valuation"){h+='<div class="cd"><h3>Estate Valuation</h3>'+nf("Estimate only - not formal tax advice.","w")+'<div class="rw r2">'+fld("Total Estate","id.totalEstate",d.totalEstate,"number",{req:1})+fld("Total Liabilities","id.totalDebts",d.totalDebts,"number")+'</div>'+fld("Gifts in last 7 years","id.recentGifts",d.recentGifts,"textarea")+'</div>';}
  else if(sub==="Allowances"){h+='<div class="cd"><h3>Nil-Rate Bands</h3>'+nf("NRB: \u00a3325,000. RNRB: \u00a3175,000 if leaving home to direct descendants.")+'<div class="rw r2">'+fld("RNRB?","id.qualifiesRNRB",d.qualifiesRNRB,"select",{options:["Yes","No"]})+fld("Transferred NRB?","id.transferredNRB",d.transferredNRB,"select",{options:["Yes","No","N/A"]})+'</div>'+fld("Transferred RNRB?","id.transferredRNRB",d.transferredRNRB,"select",{options:["Yes","No","N/A"]})+'</div><div class="cd"><h3>Exemptions</h3><div class="rw r2">'+fld("Exemptions","id.totalExemptions",d.totalExemptions,"number")+fld("Reliefs","id.totalReliefs",d.totalReliefs,"number")+'</div>'+fld("10%+ to charity?","id.charityGift",d.charityGift,"select",{options:["Yes","No"]})+'</div>';}
  else if(sub==="Estimate"){h+='<div class="cd"><h3>IHT Estimate</h3><div class="rw r2">';[["Estate",ev],["NRB",nrb],["RNRB",rnrb],["Allowance",al],["Exemptions",ex],["Reliefs",re]].forEach(function(x){h+='<div style="display:flex;justify-content:space-between;padding:8px 12px;background:#f9fafb;border-radius:6px;font-size:13px;margin-bottom:4px"><span style="color:#6b7a8d">'+x[0]+'</span><span style="font-weight:600">\u00a3'+x[1].toLocaleString()+'</span></div>';});h+='</div><div class="rw r2" style="margin-top:12px"><div style="background:#fef2f2;border-radius:8px;padding:16px;text-align:center"><div style="font-size:11px;color:#6b7a8d;text-transform:uppercase;margin-bottom:4px">Taxable</div><div style="font-size:24px;font-weight:700;color:#dc2626">\u00a3'+tx.toLocaleString()+'</div></div><div style="background:'+(tx>0?"#fef2f2":"#f0fdf4")+';border-radius:8px;padding:16px;text-align:center"><div style="font-size:11px;color:#6b7a8d;text-transform:uppercase;margin-bottom:4px">IHT @ '+(rt*100)+'%</div><div style="font-size:24px;font-weight:700;color:'+(tx>0?"#dc2626":"#059669")+'">\u00a3'+(tx*rt).toLocaleString()+'</div></div></div></div>';}
  else if(sub==="Tips"){h+='<div class="cd"><h3>Planning Strategies</h3>';[["Annual Exemptions","\u00a33,000/yr + \u00a3250 per person."],["Normal Expenditure","Regular surplus-income gifts are immediately exempt."],["Charity","Leave 10%+ to reduce rate from 40% to 36%."],["Trusts","Control when and how assets pass."],["Business Relief","50-100% on qualifying assets."],["Life Insurance in Trust","Sits outside your estate."],["PETs","Outright gifts fully exempt after 7 years."]].forEach(function(t){h+='<div style="padding:10px 14px;background:#f9fafb;border-radius:6px;margin-bottom:8px;border-left:3px solid #b45309"><div style="font-weight:700;font-size:13px;margin-bottom:2px">'+t[0]+'</div><div style="font-size:12px;color:#4b5563;line-height:1.4">'+t[1]+'</div></div>';});h+='</div>';}
  return h;
}

// === DRAFT HTML ===
function draftHTML(){
  var b=S.brand,p=S.wd.personal||{},today=new Date().toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"});
  var h='<div style="font-family:Georgia,serif;max-width:760px;margin:0 auto;color:#222;line-height:1.6"><div style="text-align:center;border-bottom:2px solid '+b.primaryColor+';padding-bottom:16px;margin-bottom:24px">';
  if(b.logo)h+='<img src="'+b.logo+'" style="max-height:50px;margin-bottom:8px">';
  h+='<div style="font-size:20px;font-weight:700;color:'+b.primaryColor+'">'+esc(b.companyName)+'</div>';
  if(b.tagline)h+='<div style="font-size:12px;color:#888">'+esc(b.tagline)+'</div>';
  h+='<div style="font-size:18px;font-weight:700;color:'+b.primaryColor+';margin-top:12px">ESTATE PLAN - DRAFT FOR REVIEW</div>';
  h+='<div style="font-size:12px;color:#888">Prepared: '+today+'</div>';
  h+='<div style="color:'+b.accentColor+';font-weight:700;margin-top:4px">DRAFT - NOT YET APPROVED</div></div>';
  h+='<h2 style="color:'+b.primaryColor+'">1. Personal Details</h2><p><strong>'+esc((p.title||"")+" "+(p.fullName||"-"))+'</strong><br>DOB: '+esc(p.dob||"-")+' | Status: '+esc(p.maritalStatus||"-")+'</p>';
  if(S.wd.beneficiaries&&S.wd.beneficiaries.length>0){h+='<h3>Beneficiaries</h3>';S.wd.beneficiaries.forEach(function(x){h+='<p>- '+esc(x.name||"?")+': '+esc(x.details||"-")+'</p>';});}
  if(S.wd.executors&&S.wd.executors.length>0){h+='<h3>Executors</h3>';S.wd.executors.forEach(function(x){h+='<p>- '+esc(x.name||"?")+'</p>';});}
  h+='<h2 style="color:'+b.primaryColor+'">2. LPAs</h2><p>H&amp;W: '+esc(S.pd.hwCreate||"-")+' | P&amp;F: '+esc(S.pd.pfCreate||"-")+'</p>';
  if(S.td.trustType)h+='<h2 style="color:'+b.primaryColor+'">3. Trust</h2><p>'+esc(S.td.trustType)+'</p>';
  var tA=(S.ed.epAssets||[]).reduce(function(s,a){return s+(parseFloat(a.value)||0);},0);
  var tL=(S.ed.liabilities||[]).reduce(function(s,l){return s+(parseFloat(l.value)||0);},0);
  if(tA>0||tL>0)h+='<h2 style="color:'+b.primaryColor+'">4. Estate</h2><p>Assets: \u00a3'+tA.toLocaleString()+' | Net: \u00a3'+(tA-tL).toLocaleString()+'</p>';
  h+='<div style="margin-top:30px;padding-top:16px;border-top:1px solid '+b.primaryColor+';text-align:center;font-size:11px;color:#999">Prepared by '+esc(b.companyName)+'. For review only.</div></div>';
  return h;
}
function draftText(){
  var b=S.brand,p=S.wd.personal||{};
  return b.companyName+"\n\n1. "+(p.title||"")+" "+(p.fullName||"-")+"\n\n2. LPAs: "+(S.pd.hwCreate||"-")+"\n\n---\n"+b.companyName+". For review only.\n";
}

// === REVIEW ===
function rReview(){
  var sub=S.subTab.review||"Preview",wf=S.wf,si=wf.stage,b=S.brand;
  var h=pls(["Preview","Send","Approval","Final"],sub,"review");
  h+='<div class="pg">';
  ["Draft","Sent","Approved","Signed Off"].forEach(function(label,i){
    h+='<div class="st"><div class="ci '+(i<si?"dn":i===si?"cu":"")+'">'+(i<si?"\u2713":(i+1))+'</div><span class="lb'+(i<=si?" ac":"")+'">'+label+'</span></div>';
    if(i<3)h+='<div class="sl'+(i<si?" dn":"")+'"></div>';
  });
  h+='</div>';
  if(sub==="Preview"){h+='<div class="cd"><h3>Draft Preview</h3><div style="border:1px solid #e5e7eb;border-radius:8px;padding:20px;max-height:500px;overflow:auto;font-size:13px">'+draftHTML()+'</div><div style="margin-top:14px;display:flex;gap:8px"><button class="bt" data-action="copy-draft">Copy text</button><button class="bt" data-action="export-html">Export HTML</button><button class="bt p" data-action="goto-send">Proceed to send</button></div></div>';}
  else if(sub==="Send"){h+='<div class="cd"><h3>Send for Approval</h3><div class="nt">Opens a draft in your mail application.</div>';if(si>=1){h+=nf("Sent to "+esc(wf.sentTo)+" on "+(wf.sentDate?new Date(wf.sentDate).toLocaleDateString("en-GB"):"-")+".","o");}else{h+=fld("Reviewer email","wf.emailTo","","email",{req:1,ph:"solicitor@example.co.uk"})+fld("Subject","wf.emailSubject","Estate Plan Draft - Review Required")+fld("Cover message","wf.emailMsg","Please review the draft estate plan.","textarea")+nf("Creates a draft in your mail app. You review and send.");h+='<div style="display:flex;gap:8px"><button class="bt p" data-action="send-email">Create email draft</button><button class="bt" data-action="copy-email">Copy to clipboard</button></div><div id="send-result"></div>';}h+='</div>';}
  else if(sub==="Approval"){h+='<div class="cd"><h3>Record Approval</h3>';if(si<1)h+=nf("Send the draft first.","w");else if(si===1){h+=nf("Awaiting approval from "+esc(wf.sentTo)+".")+fld("Approved by","wf.approver","","text",{req:1})+fld("Comments","wf.comments","","textarea")+'<button class="bt p" data-action="record-approval">Record approval</button>';}else{h+=nf("Approved by "+esc(wf.approvedBy)+".","o");if(wf.comments)h+='<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:12px;margin-bottom:12px;font-size:13px">'+esc(wf.comments)+'</div>';h+='<button class="bt p" data-pill="review" data-val="Final">Go to final</button>';}h+='</div>';}
  else if(sub==="Final"){h+='<div class="cd"><h3>Final Document</h3>';if(si<2){h+=nf("Must be approved first.","w");}else{if(si<3)h+=nf("Approved by "+esc(wf.approvedBy)+". Review and sign off.");if(si>=3)h+=nf("Signed off. Approved by: "+esc(wf.approvedBy),"o");h+='<div style="position:relative;border:2px solid '+b.primaryColor+';border-radius:8px;padding:20px;max-height:500px;overflow:auto;font-size:13px">';if(si>=3)h+='<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-30deg);font-size:60px;font-weight:800;color:rgba(5,150,105,.06);pointer-events:none;white-space:nowrap">FINAL</div>';h+=draftHTML().replace("DRAFT FOR REVIEW",si>=3?"FINAL - SIGNED OFF":"FINAL").replace("DRAFT - NOT YET APPROVED",si>=3?"Approved: "+esc(wf.approvedBy):"Approved")+'</div>';h+='<div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap">';if(si<3)h+='<button class="bt p" data-action="sign-off">Sign off</button>';h+='<button class="bt" data-action="copy-final">Copy</button><button class="bt" data-action="export-final-html">Export HTML</button><button class="bt" data-action="email-final">Email final</button></div>';}h+='</div>';}
  return h;
}

// === CUSTOMER DETAILS ===
var PT="DATA PROTECTION NOTICE\n\nThis application processes personal data for estate planning.\nData is encrypted at rest (AES-256-GCM) and stored locally only.\n\nYour rights under UK GDPR / EU GDPR:\n- Right of Access (Art. 15)\n- Right to Rectification (Art. 16)\n- Right to Erasure (Art. 17)\n- Right to Data Portability (Art. 20)\n- Right to Object (Art. 21)\n\nLegal basis: Consent (Art. 6(1)(a)) and Legitimate Interest (Art. 6(1)(f)).";

function rCustDetails(){
  var c=S.customer;if(!c)return "";
  var h='<div class="cd"><h3>'+(S.customerId?"Customer Details":"New Customer")+'</h3>';
  h+='<div class="rw r2">'+fld("Full Name","customer.name",c.name,"text",{req:1})+fld("Email","customer.email",c.email,"email")+'</div>';
  h+='<div class="rw r2">'+fld("Phone","customer.phone",c.phone)+fld("Reference","customer.reference",c.reference)+'</div>';
  h+=fld("Address","customer.address",c.address,"textarea")+fld("Notes","customer.notes",c.notes,"textarea")+'</div>';
  h+='<div class="cd"><h3>Data Protection</h3>';
  if(c.consentGiven){h+=nf("Consent recorded: "+(c.consentDate?new Date(c.consentDate).toLocaleDateString("en-GB"):"-"),"o");}
  else{h+='<pre style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;font-size:12px;line-height:1.6;white-space:pre-wrap;max-height:260px;overflow:auto;margin-bottom:14px;font-family:inherit">'+esc(PT)+'</pre>';h+='<div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:14px"><input type="checkbox" id="cc" style="width:18px;height:18px;margin-top:2px;cursor:pointer"><label for="cc" style="font-size:13px;font-weight:600;cursor:pointer;line-height:1.5">I confirm the client consents to processing of their data.</label></div>';h+='<button class="bt p" id="cb" disabled data-action="record-consent">Record Consent</button>';}
  h+='</div>';
  if(S.customerId){h+='<div class="cd"><h3>Data Protection Actions</h3>'+nf("Supports UK GDPR and EU GDPR.")+'<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="bt" data-action="export-gdpr">Export All Data (Art. 15)</button><button class="bt d" data-action="delete-customer">Delete All Data (Art. 17)</button></div></div>';}
  h+='<button class="bt p" data-action="save-customer" style="margin-top:14px">'+(S.customerId?"Save":"Create Customer")+'</button>';
  return h;
}

// === RENDERING ===
function rHeader(){
  var b=S.brand,h='<div style="display:flex;align-items:center;gap:12px">';
  if(b.logo)h+='<img src="'+b.logo+'" style="max-height:36px;border-radius:4px">';
  h+='<div><div class="t">'+esc(b.companyName)+'</div><div class="s">'+esc(b.tagline)+'</div></div></div>';
  h+='<div class="hdr-b">';
  if(S.view==="editor"){h+='<button class="p" data-action="save-customer">'+(S.saving?"Saving...":S.dirty?"Save":"Saved")+'</button>';h+='<button data-action="back-to-customers">Back</button>';}
  h+='<button data-action="goto-branding">Branding</button><button data-action="goto-audit">Audit</button></div>';
  var el=document.getElementById("hdr");el.innerHTML=h;el.style.background="linear-gradient(135deg,"+b.darkColor+","+b.primaryColor+")";el.style.borderBottomColor=b.accentColor;
}
function rStatus(){
  var h=S.health||{},l="",r="";
  if(h.dataDir!==undefined){l+='<span class="'+(h.dataDir&&h.keystore&&h.encryption?"ok":"e")+'">'+(h.dataDir&&h.keystore&&h.encryption?"System OK":"System Error")+'</span>';l+='<span>'+(h.customerCount||0)+' customers</span>';}
  if(S.view==="editor"&&S.customer)l+='<span>Editing: '+esc(S.customer.name||"New")+'</span>';
  if(S.saveError)r+='<span class="e">'+esc(S.saveError)+'</span>';
  if(S.saving)r+='<span class="w">Saving...</span>';
  else if(S.dirty)r+='<span class="w">Unsaved changes</span>';
  else if(S.lastSaved)r+='<span>Saved '+new Date(S.lastSaved).toLocaleTimeString("en-GB")+'</span>';
  r+='<span>AES-256</span>';
  document.getElementById("statusbar").innerHTML='<div style="display:flex;gap:16px">'+l+'</div><div style="display:flex;gap:16px">'+r+'</div>';
}
function rNav(){
  var nav=document.getElementById("nav");
  if(S.view!=="editor"){nav.classList.add("hidden");return;}
  nav.classList.remove("hidden");
  nav.innerHTML=ET.map(function(t){return '<button class="'+(S.tab===t.id?"a":"")+'" data-tab="'+t.id+'">'+t.l+'</button>';}).join("");
}
function rFooter(){
  var b=S.brand;var el=document.getElementById("ftr");el.style.background=b.darkColor;
  var h=esc(b.companyName);if(b.sraNumber)h+=" &middot; SRA: "+esc(b.sraNumber);if(b.fca)h+=" &middot; FCA: "+esc(b.fca);
  h+=" &middot; Encrypted &middot; GDPR Compliant<br>For guidance only. Not legal or financial advice.";
  el.innerHTML=h;
}
function rMain(){
  var m=document.getElementById("main");
  if(S.view==="customers"){
    m.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px"><div style="font-size:20px;font-weight:700">Customers</div><div style="display:flex;gap:8px"><button class="bt p" data-action="new-customer">New Customer</button><button class="bt" data-action="refresh-list">Refresh</button></div></div><input class="fi" id="cs" placeholder="Search..." style="margin-bottom:14px"><div id="ca" style="padding:20px;text-align:center;color:#6b7a8d">Loading...</div>';
    loadCusts();
  }else if(S.view==="branding"){
    m.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px"><div style="font-size:18px;font-weight:700">Branding & Settings</div><button class="bt" data-action="back">Back</button></div>'+rBrand();
    var ld=document.getElementById("logo-drop"),li=document.getElementById("logo-input");
    if(ld&&li){ld.onclick=function(){li.click();};li.onchange=function(e){var f=e.target.files&&e.target.files[0];if(!f)return;var r=new FileReader();r.onload=function(ev){S.brand.logo=ev.target.result;if(api.brandSave)api.brandSave(S.brand);render();};r.readAsDataURL(f);};}
  }else if(S.view==="audit"){
    m.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px"><div style="font-size:18px;font-weight:700">Audit Log</div><button class="bt" data-action="back">Back</button></div><div class="cd"><h3>Last 200 Actions</h3><div id="aa" style="padding:16px;text-align:center;color:#6b7a8d">Loading...</div></div>';
    loadAudit();
  }else if(S.view==="editor"){
    if(!S.customer){m.innerHTML='<div style="padding:40px;text-align:center;color:#9ca3af">No customer loaded.</div>';return;}
    if(!S.customer.consentGiven&&S.tab!=="details"){m.innerHTML='<div class="cd"><h3>Consent Required</h3><div class="nt">Record consent first.</div><button class="bt p" data-tab="details">Go to Customer Details</button></div>';return;}
    if(S.tab==="details"){m.innerHTML=rCustDetails();var cc=document.getElementById("cc"),cb=document.getElementById("cb");if(cc&&cb){cc.onchange=function(){cb.disabled=!cc.checked;};}}
    else if(S.tab==="will")m.innerHTML=rWill();
    else if(S.tab==="poa")m.innerHTML=rPoa();
    else if(S.tab==="trust")m.innerHTML=rTrust();
    else if(S.tab==="estate")m.innerHTML=rEstate();
    else if(S.tab==="iht")m.innerHTML=rIht();
    else if(S.tab==="review")m.innerHTML=rReview();
  }
}
function render(){
  try{rHeader();rStatus();rNav();rFooter();rMain();}
  catch(e){document.getElementById("main").innerHTML='<div class="cd"><h3 style="color:#dc2626">Error</h3><pre style="background:#f9fafb;padding:12px;border-radius:8px;font-size:12px;overflow:auto">'+esc(String(e))+'</pre><button class="bt p" onclick="render()">Retry</button></div>';}
}

// === ASYNC LOADERS ===
function loadCusts(){
  safe(function(){return api.customerList();},{success:true,data:[]}).then(function(res){
    var area=document.getElementById("ca");if(!area)return;
    var cs=(res&&res.data)||[];
    var h='<div class="nf">Encrypted storage. '+cs.length+' customer(s).</div>';
    if(cs.length===0){h+='<div style="padding:30px;text-align:center;color:#9ca3af">No customers yet.</div>';}
    else{cs.forEach(function(c){
      h+='<div class="cr" data-cust-id="'+c.id+'"><div style="flex:1"><div style="font-weight:600;font-size:14px">'+esc(c.name);
      if(c.reference)h+='<span style="color:#9ca3af;font-weight:400;margin-left:8px;font-size:12px">Ref: '+esc(c.reference)+'</span>';
      h+='</div><div style="font-size:12px;color:#6b7a8d;margin-top:2px">'+esc(c.email||"");
      if(c.email&&c.phone)h+=' &middot; ';h+=esc(c.phone||"");
      if(c.updatedAt)h+='<span style="margin-left:8px">Updated: '+new Date(c.updatedAt).toLocaleDateString("en-GB")+'</span>';
      h+='</div><div style="font-size:11px;margin-top:2px">'+(c.consentGiven?'<span style="color:#059669">Consent recorded</span>':'<span style="color:#b45309">Consent pending</span>')+'</div></div>';
      h+='<div class="bs"><button style="background:#f3f4f6;border:1px solid #d1d5db" data-action="open-customer" data-id="'+c.id+'">Open</button>';
      h+='<button style="background:#eff6ff;border:1px solid #bfdbfe;color:#1a4a6e" data-action="export-customer" data-id="'+c.id+'">Export</button>';
      h+='<button style="background:#fef2f2;border:1px solid #fecaca;color:#dc2626" data-action="delete-cust" data-id="'+c.id+'">Delete</button></div></div>';
    });}
    area.innerHTML=h;
    var se=document.getElementById("cs");if(se){se.oninput=function(){var q=se.value.toLowerCase();document.querySelectorAll(".cr").forEach(function(r){r.style.display=q&&r.textContent.toLowerCase().indexOf(q)===-1?"none":"flex";});};}
  });
}
function loadAudit(){
  safe(function(){return api.auditLog();},{success:true,data:[]}).then(function(res){
    var area=document.getElementById("aa");if(!area)return;
    var es=(res&&res.data)||[];
    if(es.length===0){area.innerHTML='<div style="color:#9ca3af">No entries.</div>';return;}
    var h='<div style="max-height:400px;overflow:auto">';
    es.forEach(function(e){h+='<div style="padding:6px 10px;border-bottom:1px solid #f3f4f6;font-size:11px;display:flex;gap:10px"><span style="color:#9ca3af;min-width:130px">'+(e.ts?new Date(e.ts).toLocaleString("en-GB"):"-")+'</span><span style="font-weight:600;min-width:150px;color:#1a2a3a">'+esc(e.action||"")+'</span><span style="color:#6b7a8d;flex:1">'+esc(e.detail||"")+'</span><span style="color:#9ca3af">'+esc(e.user||"")+'</span></div>';});
    h+='</div>';area.innerHTML=h;
  });
}

// === STATE ===
function setVal(path,val){
  var parts=path.split(".");var root=parts[0];
  if(root==="brand"){var o=S.brand;for(var i=1;i<parts.length-1;i++)o=o[parts[i]]=o[parts[i]]||{};o[parts[parts.length-1]]=val;if(api.brandSave)api.brandSave(S.brand);}
  else if(root==="customer"){if(S.customer)S.customer[parts[1]]=val;S.dirty=true;}
  else{var obj=S[root];if(!obj)return;for(var j=1;j<parts.length-1;j++){var p=parts[j];if(/^\d+$/.test(p))obj=obj[parseInt(p)];else obj=obj[p]=obj[p]||{};}if(obj)obj[parts[parts.length-1]]=val;S.dirty=true;}
}
function schedAS(){if(autoTimer)clearTimeout(autoTimer);if(S.dirty&&S.customerId)autoTimer=setTimeout(function(){saveCust();},30000);}
function saveCust(){
  if(!S.customer||S.saving)return;S.saving=true;S.saveError=null;rHeader();rStatus();
  var data=cloneObj(S.customer);data.id=S.customerId;data.name=data.name||(S.wd.personal&&S.wd.personal.fullName)||"Unnamed";
  data.willData=S.wd;data.poaData=S.pd;data.trustData=S.td;data.estateData=S.ed;data.ihtData=S.id;
  safe(function(){return api.customerSave(data);},{success:false,error:"Save unavailable"}).then(function(res){
    if(res&&res.success){if(!S.customerId)S.customerId=res.id;S.dirty=false;S.lastSaved=new Date().toISOString();toast("Saved");}
    else{S.saveError=(res&&res.error)||"Save failed";}
    S.saving=false;rHeader();rStatus();
  });
}
function openCust(id){
  if(S.dirty&&!confirm("Unsaved changes will be lost. Continue?"))return;
  safe(function(){return api.customerGet(id);}).then(function(res){
    if(res&&res.success&&res.data){var c=res.data;S.customer=c;S.customerId=id;
    S.wd=c.willData||emptyWill();S.pd=c.poaData||emptyPoa();S.td=c.trustData||emptyTrust();S.ed=c.estateData||emptyEstate();S.id=c.ihtData||{};
    S.tab="will";S.view="editor";S.dirty=false;S.lastSaved=c.updatedAt;
    S.wf={stage:0,sentTo:"",sentDate:null,approvedBy:"",approvedDate:null,comments:"",finalDate:null};render();}
    else{toast("Could not load customer");}
  });
}
function newCust(){
  if(S.dirty&&!confirm("Unsaved changes will be lost. Continue?"))return;
  S.customer={name:"",email:"",phone:"",address:"",consentGiven:false,reference:"",notes:""};
  S.customerId=null;S.wd=emptyWill();S.pd=emptyPoa();S.td=emptyTrust();S.ed=emptyEstate();S.id={};
  S.tab="details";S.view="editor";S.dirty=false;
  S.wf={stage:0,sentTo:"",sentDate:null,approvedBy:"",approvedDate:null,comments:"",finalDate:null};render();
}

// === EVENTS ===
document.addEventListener("click",function(e){
  var t=e.target;
  var action=t.getAttribute("data-action")||(t.closest&&t.closest("[data-action]")&&t.closest("[data-action]").getAttribute("data-action"));
  var tab=t.getAttribute("data-tab")||(t.closest&&t.closest("[data-tab]")&&t.closest("[data-tab]").getAttribute("data-tab"));
  var pill=t.getAttribute("data-pill"),pv=t.getAttribute("data-val");
  var preset=t.getAttribute("data-preset")||(t.closest&&t.closest("[data-preset]")&&t.closest("[data-preset]").getAttribute("data-preset"));
  var rk=t.getAttribute("data-remove"),ak=t.getAttribute("data-add");
  var cid=t.getAttribute("data-id")||(t.closest&&t.closest("[data-id]")&&t.closest("[data-id]").getAttribute("data-id"));

  if(tab){S.tab=tab;render();return;}
  if(pill&&pv){S.subTab[pill]=pv;render();return;}
  if(preset){var pr=PRESETS.find(function(x){return x.n===preset;});if(pr){S.brand.primaryColor=pr.p;S.brand.darkColor=pr.d;S.brand.accentColor=pr.a;if(api.brandSave)api.brandSave(S.brand);render();}return;}
  if(rk){var idx=parseInt(t.getAttribute("data-idx"));var parts=rk.split(".");var arr=S;parts.forEach(function(p){arr=arr[p];});if(Array.isArray(arr)){arr.splice(idx,1);S.dirty=true;render();}return;}
  if(ak){var parts2=ak.split(".");var arr2=S;parts2.forEach(function(p){arr2=arr2[p];});if(Array.isArray(arr2)){arr2.push({});S.dirty=true;render();}return;}

  if(action==="new-customer")newCust();
  else if(action==="refresh-list")render();
  else if(action==="open-customer"&&cid)openCust(cid);
  else if(action==="export-customer"&&cid&&api.customerExportGDPR)api.customerExportGDPR(cid);
  else if(action==="delete-cust"&&cid&&api.customerDelete){api.customerDelete(cid).then(function(r){if(r&&r.success)render();});}
  else if(action==="save-customer")saveCust();
  else if(action==="back-to-customers"){if(S.dirty&&!confirm("Unsaved changes?"))return;S.view="customers";render();}
  else if(action==="back"){S.view=S.customerId?"editor":"customers";render();}
  else if(action==="goto-branding"){S.view="branding";render();}
  else if(action==="goto-audit"){S.view="audit";render();}
  else if(action==="remove-logo"){S.brand.logo=null;if(api.brandSave)api.brandSave(S.brand);render();}
  else if(action==="reset-brand"){S.brand=cloneObj(DB);if(api.brandSave)api.brandSave(S.brand);render();}
  else if(action==="record-consent"){if(S.customer){S.customer.consentGiven=true;S.customer.consentDate=new Date().toISOString();S.dirty=true;render();}}
  else if(action==="export-gdpr"&&S.customerId&&api.customerExportGDPR)api.customerExportGDPR(S.customerId);
  else if(action==="delete-customer"&&S.customerId&&api.customerDelete){api.customerDelete(S.customerId).then(function(r){if(r&&r.success){S.view="customers";render();}});}
  else if(action==="copy-draft"){try{navigator.clipboard.writeText(draftText());toast("Copied");}catch(ex){toast("Copy failed");}}
  else if(action==="export-html"||action==="export-final-html"){if(api.exportHTML)api.exportHTML(action==="export-final-html"?draftHTML().replace("DRAFT","FINAL"):draftHTML());}
  else if(action==="goto-send"){S.subTab.review="Send";render();}
  else if(action==="send-email"){
    var to=(document.querySelector('[data-field="wf.emailTo"]')||{}).value||"";
    var su=(document.querySelector('[data-field="wf.emailSubject"]')||{}).value||"Draft";
    var ms=(document.querySelector('[data-field="wf.emailMsg"]')||{}).value||"";
    if(!to){toast("Enter email");return;}
    safe(function(){return api.sendEmail({to:to,subject:su,bodyText:ms+"\n\n"+draftText(),bodyHtml:"<p>"+esc(ms).replace(/\n/g,"<br>")+"</p><hr>"+draftHTML()});},{success:false,message:"Email N/A"}).then(function(res){
      var el=document.getElementById("send-result");if(el)el.innerHTML=nf((res&&res.message)||"Done",(res&&res.success)?"o":"er");
      if(res&&res.success){S.wf.stage=1;S.wf.sentTo=to;S.wf.sentDate=new Date().toISOString();}
    });
  }
  else if(action==="copy-email"){
    var t2=(document.querySelector('[data-field="wf.emailTo"]')||{}).value||"";
    var s2=(document.querySelector('[data-field="wf.emailSubject"]')||{}).value||"";
    var m2=(document.querySelector('[data-field="wf.emailMsg"]')||{}).value||"";
    try{navigator.clipboard.writeText("To: "+t2+"\nSubject: "+s2+"\n\n"+m2+"\n\n"+draftText());toast("Copied");}catch(ex){}
    S.wf.stage=1;S.wf.sentTo=t2;S.wf.sentDate=new Date().toISOString();render();
  }
  else if(action==="record-approval"){
    var nm=(document.querySelector('[data-field="wf.approver"]')||{}).value||"";
    var cm=(document.querySelector('[data-field="wf.comments"]')||{}).value||"";
    if(!nm){toast("Enter approver name");return;}
    S.wf.stage=2;S.wf.approvedBy=nm;S.wf.approvedDate=new Date().toISOString();S.wf.comments=cm;render();
  }
  else if(action==="sign-off"){S.wf.stage=3;S.wf.finalDate=new Date().toISOString();render();}
  else if(action==="copy-final"){try{navigator.clipboard.writeText(draftText().replace("DRAFT","FINAL"));toast("Copied");}catch(ex){}}
  else if(action==="email-final"){safe(function(){return api.sendEmail({to:S.wf.sentTo,subject:"FINAL Estate Plan - "+S.brand.companyName,bodyText:draftText().replace("DRAFT","FINAL"),bodyHtml:draftHTML().replace("DRAFT","FINAL")});});}

  var cr=t.closest&&t.closest(".cr");
  if(cr&&!(t.closest&&t.closest(".bs"))&&!action){var ci=cr.getAttribute("data-cust-id");if(ci)openCust(ci);}
});

document.addEventListener("input",function(e){
  var f=e.target.getAttribute("data-field"),c=e.target.getAttribute("data-color");
  if(f){setVal(f,e.target.value);schedAS();}
  if(c){S.brand[c]=e.target.value;if(api.brandSave)api.brandSave(S.brand);render();}
});
document.addEventListener("keydown",function(e){if((e.ctrlKey||e.metaKey)&&e.key==="s"){e.preventDefault();saveCust();}});
window.addEventListener("beforeunload",function(e){if(S.dirty){e.preventDefault();e.returnValue="Unsaved changes.";}});
if(api.onNewCustomer)api.onNewCustomer(function(){newCust();});
if(api.onSave)api.onSave(function(){saveCust();});
if(api.onExportGDPR)api.onExportGDPR(function(){if(S.customerId&&api.customerExportGDPR)api.customerExportGDPR(S.customerId);});

// === BOOT: Show UI synchronously, load data in background ===
document.getElementById("boot").style.display="none";
document.getElementById("app").classList.remove("hidden");
render();
safe(function(){return api.brandLoad();}).then(function(r){if(r&&r.data){Object.assign(S.brand,r.data);render();}});
safe(function(){return api.healthCheck();}).then(function(h){S.health=h;rStatus();});
setInterval(function(){safe(function(){return api.healthCheck();}).then(function(h){S.health=h;rStatus();});},60000);

})();
