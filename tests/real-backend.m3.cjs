const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createM3Runtime } = require('./helpers/load-m3.cjs');
const { createLoader } = require('./helpers/load-foundation.cjs');
const base = process.env.MYLIFE_M1_API_URL; const database = process.env.MYLIFE_M1_ISOLATED;
if (!/^mylife_m1_[a-f0-9]{12}$/.test(database || '') || !base || new URL(base).hostname !== '127.0.0.1') throw Error('Disposable M3 runtime required');
const output = 'docs/review-m3/test-results/final-backend';
const checks = []; const requests = [];
const record = name => { checks.push({ name, status: 'PASS', level: 'Real Kestrel/PostgreSQL; native bridges adapted; avatar HTTP provider is test-only' }); console.log('PASS: '+name); };
const network = async (url, init) => {
  assert.equal(init.credentials, 'omit'); assert.equal(init.headers.get('X-Client-Platform'), 'mobile');
  const response = await fetch(url, init);
  assert.equal(response.headers.getSetCookie().length, 0);
  requests.push({ method: init.method || 'GET', path: new URL(url).pathname, status: response.status, multipart: init.body instanceof FormData });
  return response;
};
const pure = createLoader({}, { URL }); const edits = pure('src/features/family/data/member-edit.ts');
const { toFamilyInput, memberToFormValues } = pure('src/features/family/validation/familyValidation.ts');
const form = { fullName: 'Synthetic Member', generation: '1', gender: 'male', dateOfBirth: '', lifeStatus: 'LIVING', deathDate: '', role: '', address: '', phoneNumber: '', facebookUrl: '', instagramUrl: '', biography: '', fatherId: '', motherId: '', spouseId: '', childIds: [] };
const password = 'M3_Synthetic!23456';
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==','base64');
const pngReplacement = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4//8/AwAI/AL+X8W4AAAAAElFTkSuQmCC','base64');
function multipart(bytes=png, mime='image/png') { const body = new FormData(); body.append('file',new Blob([bytes],{type:mime}),'synthetic-avatar.png'); return body; }
function provider(flags={}) { fs.writeFileSync(process.env.MYLIFE_M3_PROVIDER_CONTROL,JSON.stringify(flags)); }
async function account(label) {
  const runtime = createM3Runtime(base,network); const email=`m3.${label}.${Date.now()}@gmail.com`;
  await runtime.auth.registerRequest({ fullName:'Mobile '+label,phoneNumber:'0912345678',gender:'Nam',dateOfBirth:'1995-05-20',email,password,confirmPassword:password });
  await runtime.context().login(email,password,false); return { runtime,email };
}
async function main() {
  const {runtime:one,email}=await account('Owner'); const {runtime:other}=await account('Other');
  const create=async(name,patch={})=>one.family.create(toFamilyInput({...form,fullName:name,...patch}));
  const elder=await create('Synthetic Elder'); const partner=await create('Synthetic Partner',{gender:'female'});
  const sibling=await create('Synthetic Sibling'); const oldChild=await create('Synthetic Existing Child',{generation:'2'});
  const newChild=await create('Synthetic Added Child',{generation:'2'});
  await one.family.update(elder.id,{...toFamilyInput(memberToFormValues(elder)),spouseId:partner.id,childIds:[oldChild.id],horizontalRelations:[{memberId:sibling.id,relationType:'sibling'},{memberId:sibling.id,relationType:'legacy-recorded-type'}]});
  let original=await one.data.get(elder.id); const aggregate=await one.data.profile(elder.id);
  assert.equal(aggregate.member.id,elder.id); assert.ok(aggregate.relatives.some(row=>row.id===partner.id)); assert.ok(aggregate.relatives.some(row=>row.id===oldChild.id)); assert.ok(Array.isArray(aggregate.timeline)); assert.ok(Array.isArray(aggregate.anniversaries));
  record('Expo create/list and actual aggregate profile contract, including related members');
  // Browser-compatible W10 cookie/origin/CSRF-header path, no native header/bearer.
  const cookies=new Map(); const origin=process.env.MYLIFE_M3_WEB_ORIGIN;
  async function web(endpoint,init={}) {
    const headers=new Headers(init.headers); headers.set('Origin',origin); headers.set('X-Requested-With','MyLife');
    if(cookies.size)headers.set('Cookie',[...cookies].map(([key,value])=>`${key}=${value}`).join('; '));
    if(init.body&&!(init.body instanceof FormData))headers.set('Content-Type','application/json');
    const response=await fetch(base+endpoint,{...init,headers});
    for(const cookie of response.headers.getSetCookie()){const pair=cookie.split(';')[0];const at=pair.indexOf('=');cookies.set(pair.slice(0,at),pair.slice(at+1));}
    return response;
  }
  const webLogin=await web('/api/login',{method:'POST',body:JSON.stringify({email,password,rememberMe:false})});assert.equal(webLogin.status,200);const webBody=await webLogin.json();assert.equal('accessToken' in webBody,false);assert.ok(cookies.size);
  const webGet=await web(`/api/family-tree/${elder.id}`);assert.equal(webGet.status,200);const webMember=(await webGet.json()).data;assert.equal(webMember.fullName,original.fullName);
  const webEdit=await web(`/api/family-tree/${elder.id}`,{method:'PUT',body:JSON.stringify({...toFamilyInput(memberToFormValues(webMember)),phoneNumber:'0901234567',horizontalRelations:webMember.horizontalRelations})});assert.equal(webEdit.status,200);
  const fromExpo=await one.data.get(elder.id);assert.equal(fromExpo.phoneNumber,'0901234567');assert.equal(fromExpo.horizontalRelations.length,2);
  record('Web cookie/origin/CSRF-compatible read/edit roundtrips into Expo with identical authoritative relationships');
  original=fromExpo;
  const newSpouse=await create('Synthetic New Spouse',{gender:'female'});
  const values={...memberToFormValues(original),spouseId:String(newSpouse.id),phoneNumber:'0907777777'};
  await one.family.update(elder.id,edits.buildMemberUpdate(original,await one.data.get(elder.id),values,original.horizontalRelations));
  let saved=await one.data.get(elder.id);assert.equal(saved.spouseId,newSpouse.id);assert.equal((await one.data.get(newSpouse.id)).spouseId,elder.id);assert.equal((await one.data.get(partner.id)).spouseId,null);assert.equal(saved.horizontalRelations.length,2);assert.equal((await one.data.get(sibling.id)).horizontalRelations.length,2);
  record('Spouse and phone changes preserve explicit siblings/custom horizontal types in both directions');
  original=saved;const childValues={...memberToFormValues(original),childIds:[...original.childIds.map(String),String(newChild.id)]};
  await one.family.update(elder.id,edits.buildMemberUpdate(original,await one.data.get(elder.id),childValues,original.horizontalRelations));
  saved=await one.data.get(elder.id);assert.deepEqual([...saved.childIds].sort((a,b)=>a-b),[oldChild.id,newChild.id].sort((a,b)=>a-b));assert.equal((await one.data.get(newChild.id)).fatherId,elder.id);
  record('Child assignment retains existing children and refetches reciprocal parent link');
  const unchanged=edits.buildMemberUpdate(saved,saved,{...memberToFormValues(saved),biography:'Only biography edited'},saved.horizontalRelations);assert.equal(Object.hasOwn(unchanged,'childIds'),false);assert.equal(Object.hasOwn(unchanged,'horizontalRelations'),false);
  await one.family.update(elder.id,unchanged);
  const foreign=(await other.family.create(toFamilyInput({...form,fullName:'Foreign Account Member'}))).id;
  for(const input of [{fatherId:elder.id},{fatherId:newChild.id},{fatherId:foreign},{spouseId:foreign},{horizontalRelations:[{memberId:foreign,relationType:'sibling'}]}]){
    const member=await one.data.get(elder.id);await assert.rejects(one.family.update(elder.id,{...toFamilyInput(memberToFormValues(member)),...input}),error=>error.status===400);
  }
  await assert.rejects(other.data.profile(elder.id),error=>error.status===404);
  for(const [method,pathSuffix,body] of [['POST','/avatar',multipart()],['DELETE','/avatar',undefined],['GET','/avatar/image',undefined]]){
    await assert.rejects(other.api.apiRequest(`/api/family-tree/${elder.id}${pathSuffix}`,{method,body}),error=>error.status===404);
  }
  record('Self-links, cycles, foreign parents/spouse/horizontal IDs and foreign profile/avatar operations are rejected');
  provider(); const upload=await one.family.uploadAvatar(elder.id,multipart());assert.equal(upload.hasManagedAvatar,true);assert.equal(upload.avatarUrl,null);
  const currentTokens=await one.storage.read(); const imageHeaders={'X-Client-Platform':'mobile',Authorization:'Bearer '+currentTokens.accessToken};
  const image=await fetch(base+`/api/family-tree/${elder.id}/avatar/image`,{headers:imageHeaders});assert.equal(image.status,200);assert.equal(image.headers.get('content-type'),'image/png');assert.match(image.headers.get('cache-control'),/private/);assert.equal(image.headers.get('x-content-type-options'),'nosniff');assert.equal(image.headers.get('location'),null);assert.ok(Buffer.from(await image.arrayBuffer()).equals(png));const etag=image.headers.get('etag');assert.ok(etag);
  const conditional=await fetch(base+`/api/family-tree/${elder.id}/avatar/image`,{headers:{...imageHeaders,'If-None-Match':etag}});assert.equal(conditional.status,304);
  const noAuth=await fetch(base+`/api/family-tree/${elder.id}/avatar/image`);assert.equal(noAuth.status,401);
  record('Multipart upload and authenticated image bytes/private caching/ETag/304 use real Backend; provider boundary is a contract adapter');
  await one.family.uploadAvatar(elder.id,multipart(pngReplacement));const tokenAfterReplace=await one.storage.read();const replacement=await fetch(base+`/api/family-tree/${elder.id}/avatar/image`,{headers:{'X-Client-Platform':'mobile',Authorization:'Bearer '+tokenAfterReplace.accessToken}});assert.equal(replacement.status,200);assert.ok(Buffer.from(await replacement.arrayBuffer()).equals(pngReplacement));assert.notEqual(replacement.headers.get('etag'),etag);
  const events=fs.readFileSync(process.env.MYLIFE_M3_PROVIDER_TRACE,'utf8').trim().split('\n').map(JSON.parse);const uploads=events.filter(event=>event.action==='upload'&&event.memberId===elder.id);assert.equal(uploads[0].id,uploads[1].id);
  record('Avatar replacement keeps provider file identity and refreshes bytes/ETag revision');
  const avatarBefore=await one.data.get(elder.id);provider({failUpload:true});await assert.rejects(one.family.uploadAvatar(elder.id,multipart()),error=>error.status===502);provider();const avatarAfter=await one.data.get(elder.id);assert.equal(avatarAfter.hasManagedAvatar,true);assert.equal(avatarAfter.updatedAt,avatarBefore.updatedAt);
  await assert.rejects(one.family.uploadAvatar(elder.id,multipart(Buffer.from('invalid'),'text/plain')),error=>error.status===400);
  await assert.rejects(one.family.uploadAvatar(elder.id,multipart(Buffer.alloc(0))),error=>error.status===400);
  await assert.rejects(one.family.uploadAvatar(elder.id,multipart(Buffer.alloc(5*1024*1024+1))),error=>error.status===400);
  provider({failDelete:true});await assert.rejects(one.family.deleteAvatar(elder.id),error=>error.status===502);provider();assert.equal((await one.data.get(elder.id)).hasManagedAvatar,true);
  record('Avatar invalid MIME/empty/oversize and storage failures preserve DB metadata; retry remains possible');
  await one.api.apiRequest(`/api/family-tree/${elder.id}/location`,{method:'PUT',body:JSON.stringify({latitude:10.25,longitude:106.75,displayName:'Synthetic manual location'})});
  original=await one.data.get(elder.id);await one.family.update(elder.id,edits.buildMemberUpdate(original,original,{...memberToFormValues(original),phoneNumber:'0903333333'},original.horizontalRelations));saved=await one.data.get(elder.id);assert.equal(saved.hasManagedAvatar,true);assert.equal(saved.latitude,original.latitude);assert.equal(saved.longitude,original.longitude);assert.equal(saved.childIds.length,2);assert.equal(saved.horizontalRelations.length,2);
  record('Unrelated scalar edit preserves managed avatar, manual coordinates, parents/spouse/children/horizontal links');
  original=saved;await one.family.update(elder.id,edits.buildMemberUpdate(original,original,memberToFormValues(original),[]));assert.equal((await one.data.get(elder.id)).horizontalRelations.length,0);assert.equal((await one.data.get(sibling.id)).horizontalRelations.length,0);
  await one.family.deleteAvatar(elder.id);assert.equal((await one.data.get(elder.id)).hasManagedAvatar,false);await assert.rejects(one.api.apiRequest(`/api/family-tree/${elder.id}/avatar/image`),error=>error.status===404);
  record('Explicit confirmed horizontal clear removes both directions; avatar removal updates profile and image becomes 404');
  const graph=pure('src/features/family/graph/family-graph.ts').buildFamilyGraph(await one.data.list());assert.ok(graph.nodes.length>=6);assert.ok(graph.edges.some(edge=>edge.kind==='parent'&&edge.to===newChild.id));assert.ok(graph.edges.some(edge=>edge.kind==='spouse'));
  await one.family.delete(elder.id);await assert.rejects(one.data.profile(elder.id),error=>error.status===404);assert.equal((await one.data.get(newChild.id)).fatherId,null);assert.equal((await one.data.get(newSpouse.id)).spouseId,null);assert.equal((await one.data.list()).some(row=>row.id===elder.id),false);
  record('Graph uses real multi-generation relationships; member deletion synchronizes list/profile and reciprocal links');
  const admin=createM3Runtime(base,network);await admin.context().login('m1.admin@gmail.com',process.env.MYLIFE_M3_ADMIN_PASSWORD,false);await assert.rejects(admin.data.profile(newChild.id),error=>error.status===403);
  record('ADMIN remains excluded from member profile and USER-only Family API');
  fs.writeFileSync(path.join(output,'m3-integration.json'),JSON.stringify({checks,requests,provider:'Test-only named HTTP adapter in real Backend process. No Google Drive access or production data.',web:'Real W10-compatible cookie/origin/X-Requested-With HTTP flow; browser UI not claimed.'},null,2));
  fs.copyFileSync(process.env.MYLIFE_M3_PROVIDER_TRACE,path.join(output,'avatar-provider-events.ndjson'));
}
main().catch(error=>{console.error(error);process.exitCode=1});
