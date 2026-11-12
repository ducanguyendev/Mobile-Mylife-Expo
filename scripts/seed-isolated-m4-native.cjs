// Synthetic records only, guarded by the disposable harness metadata. Never production.
const fs=require('node:fs');
const {createM3Runtime}=require('../tests/helpers/load-m3.cjs');
const runtime=JSON.parse(fs.readFileSync('.tmp/m3-runtime.json','utf8'));
if(!/^mylife_m1_[a-f0-9]{12}$/.test(runtime.database)||new URL(runtime.api).hostname!=='127.0.0.1')throw Error('Disposable loopback runtime required');
async function main(){
 const one=createM3Runtime(runtime.api),email=`m4.native.${Date.now()}@gmail.com`,password='Map_QA!23456';
 await one.auth.registerRequest({fullName:'Synthetic Map Tester',phoneNumber:'0912345678',gender:'Nam',dateOfBirth:'1995-05-20',email,password,confirmPassword:password});
 await one.context().login(email,password,false);
 const map=one.load('src/features/family/map/map-api.ts').familyMapApi;
 const {toFamilyInput}=one.load('src/features/family/validation/familyValidation.ts');const members=[];
 for(let i=0;i<112;i++){
  const row=await one.family.create(toFamilyInput({fullName:i===111?'Nguyễn Đặng Gia Đình Thử Nghiệm Có Tên Rất Dài':`Synthetic Map Member ${String(i+1).padStart(3,'0')}`,generation:String(1+Math.floor(i/40)),gender:i===1?'female':'male',dateOfBirth:'',lifeStatus:'LIVING',deathDate:'',role:'',address:i<8?'M4 synthetic native address':'',phoneNumber:'',facebookUrl:'',instagramUrl:'',biography:'Synthetic map QA only',fatherId:i>=40&&i<80?String(members[0].id):'',motherId:'',spouseId:i===1?String(members[0].id):'',childIds:[]}));
  members.push(row);
  if(i<6)await map.update(row.id,{latitude:[10.123456,16.123456,21.123456][i%3],longitude:[106.123456,108.123456,105.123456][i%3],displayName:`Địa điểm tổng hợp thử nghiệm ${i%3+1}`});
 }
 const snapshot=await map.get();fs.writeFileSync('.tmp/m4-native-user.json',JSON.stringify({email,password,api:runtime.api,members:members.map(m=>m.id)}));
 fs.mkdirSync('docs/review-m4/test-results/native',{recursive:true});
 fs.writeFileSync('docs/review-m4/test-results/native/synthetic-data.json',JSON.stringify({syntheticOnly:true,totalMembers:snapshot.totalMembers,locatedMembers:snapshot.locatedMembers,groups:snapshot.locations.length,memberIds:members.map(m=>m.id)},null,2));
 console.log(`Created ${snapshot.totalMembers} synthetic members, ${snapshot.locations.length} Backend groups. Credentials are ignored, not report artifacts.`);
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
