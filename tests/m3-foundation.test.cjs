const test = require('node:test');
const assert = require('node:assert/strict');
const { createLoader, hookRuntime } = require('./helpers/load-foundation.cjs');
const { createM3Runtime, member } = require('./helpers/load-m3.cjs');
const load = createLoader({}, { URL });
const edit = load('src/features/family/data/member-edit.ts');
const { memberToFormValues } = load('src/features/family/validation/familyValidation.ts');
const search = load('src/features/family/data/member-search.ts');
const graph = load('src/features/family/graph/family-graph.ts');
const { createFamilyQuery } = load('src/features/family/data/family-query.ts');
const { requireMember, requireMembers, requireProfile } = createLoader({'./familyApi': { familyApi: {} }})('src/features/family/api/familyDataApi.ts');
const { getFamilyStrings } = load('src/features/family/i18n/familyStrings.ts');
const plain = value => JSON.parse(JSON.stringify(value));
const hold = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { resolve, promise }; };
const original = () => member(1, { fatherId: 2, spouseId: 3, childIds: [4], horizontalRelations: [{ memberId: 5, relationType: 'sibling' }, { memberId: 6, relationType: 'legacy_custom' }], hasManagedAvatar: true, latitude: 10, longitude: 106, phoneNumber: '0123456789' });

test('Phone-only edit omits children/horizontal writes and excludes avatar/location/server fields', () => {
  const before = original(); const values = { ...memberToFormValues(before), phoneNumber: '0987654321' };
  const result = edit.buildMemberUpdate(before, before, values, before.horizontalRelations);
  assert.equal(result.phoneNumber, values.phoneNumber); assert.equal(result.fatherId, 2); assert.equal(result.spouseId, 3);
  for (const key of ['childIds','horizontalRelations','avatarUrl','hasManagedAvatar','latitude','longitude','updatedAt','createdAt','id']) assert.equal(Object.hasOwn(result,key),false,key);
});
test('Spouse edit preserves unknown horizontal types and concurrent phone changes', () => {
  const before = original(); const latest = { ...before, phoneNumber:'new server phone' };
  const result = edit.buildMemberUpdate(before,latest,{...memberToFormValues(before),spouseId:'9'},before.horizontalRelations);
  assert.equal(result.spouseId,9); assert.equal(result.phoneNumber,'new server phone'); assert.equal(Object.hasOwn(result,'horizontalRelations'),false);
});
test('Concurrent edits to the same scalar fail closed instead of overwriting', () => {
  const before=original(); assert.throws(()=>edit.buildMemberUpdate(before,{...before,phoneNumber:'server'}, {...memberToFormValues(before),phoneNumber:'local'},before.horizontalRelations),/FAMILY_EDIT_CONFLICT/);
  assert.throws(()=>edit.buildMemberUpdate(before,member(99),memberToFormValues(before),before.horizontalRelations),/FAMILY_EDIT_CONFLICT/);
});
test('Intentional child additions and removals retain unseen concurrent children', () => {
  const before=original(); const latest={...before,childIds:[4,8]};
  assert.deepEqual(plain(edit.buildMemberUpdate(before,latest,{...memberToFormValues(before),childIds:['4','7']},before.horizontalRelations).childIds),[4,8,7]);
  assert.deepEqual(plain(edit.buildMemberUpdate(before,latest,{...memberToFormValues(before),childIds:[]},before.horizontalRelations).childIds),[8]);
});
test('Horizontal delta retains custom/concurrent rows; explicit clearing produces [] only intentionally', () => {
  const before=original(); const latest={...before,horizontalRelations:[...before.horizontalRelations,{memberId:8,relationType:'other'}]};
  const desired=[before.horizontalRelations[1]];
  assert.deepEqual(plain(edit.buildMemberUpdate(before,latest,memberToFormValues(before),desired).horizontalRelations),[before.horizontalRelations[1],{memberId:8,relationType:'other'}]);
  assert.deepEqual(plain(edit.buildMemberUpdate(before,before,memberToFormValues(before),[]).horizontalRelations),[]);
});
test('Concurrent horizontal type change is a conflict and create omits unchosen horizontal rows', () => {
  const before=original(); assert.throws(()=>edit.buildMemberUpdate(before,{...before,horizontalRelations:[{memberId:5,relationType:'cousin'},before.horizontalRelations[1]]},memberToFormValues(before),[{memberId:5,relationType:'other'},before.horizontalRelations[1]]),/FAMILY_EDIT_CONFLICT/);
  assert.equal(Object.hasOwn(edit.buildMemberCreate(memberToFormValues(member(1)),[]),'horizontalRelations'),false);
});
test('Localized validation rejects self, same parents, direct parent-child cycles and invalid dates', () => {
  const values=memberToFormValues(original()); const copy=getFamilyStrings('en');
  assert.ok(edit.validateMemberEdit({...values,fatherId:'1'},[],copy,1).fatherId);
  assert.ok(edit.validateMemberEdit({...values,fatherId:'2',motherId:'2'},[],copy,1).motherId);
  assert.ok(edit.validateMemberEdit({...values,childIds:['2']},[],copy,1).form);
  assert.ok(edit.validateMemberEdit({...values,dateOfBirth:'2026-02-30'},[],copy,1).dateOfBirth);
  assert.ok(edit.validateMemberEdit(values,[{memberId:1,relationType:'sibling'}],copy,1).form);
});
test('Accent-insensitive search reaches the 150th member with combined generation/life/gender filters', () => {
  const rows=Array.from({length:150},(_,i)=>member(i+1,{generation:i===149?3:1,fullName:i===149?'Đặng Thị Ánh Nguyễn':'Other '+i,gender:i===149?'Nữ':'male',lifeStatus:i===149?'DECEASED':'LIVING'}));
  assert.deepEqual(plain(search.filterMembers(rows,{query:'dang thi anh',generation:'3',lifeStatus:'DECEASED',gender:'female'}).map(m=>m.id)),[150]);
  assert.equal(search.filterMembers(rows,{...search.emptyFilters,query:'absent'}).length,0);
  assert.equal(search.filterMembers(rows,search.emptyFilters).length,150);
  assert.equal(search.normalizeGender('nu'),'unknown'); // Matches actual backend child-assignment rules.
});
test('Inferred siblings need a shared known parent; unrelated missing parents never match', () => {
  assert.equal(search.sharedParentSiblings(member(1),[member(2),member(3)]).length,0);
  assert.deepEqual(plain(search.sharedParentSiblings(member(1,{fatherId:9}),[member(1,{fatherId:9}),member(2,{fatherId:9}),member(3)]).map(m=>m.id)),[2]);
});
test('Contact links reject executable schemes, URL credentials and USSD strings', () => {
  for(const url of ['javascript:alert(1)','http://example.com','https://user:secret@example.com','file:///private']) assert.equal(search.safeSocialUrl(url),null);
  assert.equal(search.safeSocialUrl('https://example.com/person'),'https://example.com/person');
  assert.equal(search.phoneUrl('*123#'),null);assert.equal(search.phoneUrl('+84 (123) 456'),'tel:+84123456');
});
test('Member/profile mapping accepts empty aggregates and rejects malformed collections/identity', () => {
  const profile={member:member(1),relatives:[],timeline:[],anniversaries:[],libraryMemberLinkAvailable:false};
  assert.equal(requireProfile(profile,1),profile);assert.deepEqual(plain(requireMembers([])),[]);
  for(const bad of [null,{},[member(1),member(1)]]) assert.throws(()=>requireMembers(bad));
  for(const patch of [{childIds:null},{horizontalRelations:[{memberId:0,relationType:'sibling'}]},{updatedAt:'bad'},{hasManagedAvatar:'yes'},{childNames:[{}]}]) assert.throws(()=>requireMember(member(1,patch)));
  for(const patch of [{relatives:null},{timeline:[{id:1,title:'bad'}]},{anniversaries:[{id:1,title:'bad'}]}]) assert.throws(()=>requireProfile({...profile,...patch},1));
  assert.throws(()=>requireProfile(profile,2));
});
test('Focus/refresh bursts coalesce and failed reload drops stale data before retry', async () => {
  const deferred=hold();let calls=0;let fails=false;
  const query=createFamilyQuery(async()=>{calls++;await deferred.promise;if(fails)throw Error('offline');return [member(1)];});
  const a=query.load(),b=query.load();await Promise.resolve();assert.equal(calls,1);deferred.resolve();await Promise.all([a,b]);
  fails=true;await query.load();assert.equal(query.getSnapshot().status,'error');assert.equal(query.getSnapshot().data,undefined);
  fails=false;await query.load();assert.equal(query.getSnapshot().status,'ready');assert.equal(calls,3);
});
test('Aborted old-account responses cannot populate a new account or replace a refocused query', async () => {
  const deferred=hold();let calls=0;let signal;
  const one=createFamilyQuery(async value=>{signal=value;return ++calls===1?deferred.promise:[member(2)];});
  const old=one.load();await Promise.resolve();one.cancel();assert.equal(signal.aborted,true);
  const two=createFamilyQuery(async()=>[member(200)]);await two.load();await one.load();deferred.resolve([member(1)]);await old;
  assert.equal(one.getSnapshot().data[0].id,2);assert.equal(two.getSnapshot().data[0].id,200);
});
function pickerRuntime(props={}) {
  const h=hookRuntime();const alerts=[];
  const componentMocks=Object.fromEntries(['@/design-system/components/app-text','@/design-system/components/fields','@/design-system/components/buttons','@/components/feedback/states'].map(key=>[key,new Proxy({},{get:(_,name)=>String(name)})]));
  const loader=createLoader({...componentMocks,react:h.hooks,'react/jsx-runtime':{jsx:h.jsx,jsxs:h.jsx},'react-native':{Modal:'Modal',View:'View',FlatList:'FlatList',Pressable:'Pressable',Alert:{alert:(...args)=>alerts.push(args)},Keyboard:{dismiss(){}},StyleSheet:{create:x=>x}},'react-native-safe-area-context':{SafeAreaView:'SafeAreaView'},'@/theme/theme-provider':{useAppTheme:()=>({colors:{},reducedMotion:true})},'../i18n/use-family-strings':{useFamilyStrings:()=>({copy:getFamilyStrings('en')})}});
  const {RelationshipPicker}=loader('src/features/family/components/RelationshipPicker.tsx');let confirmed, canceled=0;
  const input={title:'Children',members:Array.from({length:150},(_,i)=>member(i+1,{fullName:i===149?'Đặng Ánh':`Member ${i+1}`})),selected:['2'],selfId:1,multiple:true,onConfirm:ids=>{confirmed=ids;},onCancel:()=>{canceled++;},...props};
  const nodes=node=>!node||typeof node!=='object'?[]:[node,...[node.props?.children].flat(Infinity).flatMap(nodes)];
  const render=()=>h.render(RelationshipPicker,input);
  return {render,nodes,find:(tree,p)=>nodes(tree).find(p),alerts,input,get confirmed(){return confirmed;},get canceled(){return canceled;}};
}
test('Native picker virtualizes all 149 non-self candidates and searches beyond eight without losing selection', () => {
  const p=pickerRuntime();let tree=p.render();let list=p.find(tree,n=>n.type==='FlatList');assert.equal(list.props.data.length,149);assert.equal(list.props.data[0].id,2);assert.ok(list.props.windowSize<=5);
  p.find(tree,n=>n.type==='MyLifeSearchField').props.onChangeText('dang anh');tree=p.render();list=p.find(tree,n=>n.type==='FlatList');assert.equal(list.props.data[0].id,150);
  const row=list.props.renderItem({item:list.props.data[0]});row.props.onPress();tree=p.render();p.find(tree,n=>n.props?.title==='Confirm').props.onPress();assert.deepEqual(plain(p.confirmed),['2','150']);
});
test('Picker cancel/Android Back discard draft; clearing requires separate destructive confirmation', () => {
  const p=pickerRuntime({selected:['2','999']});let tree=p.render();p.find(tree,n=>n.props?.title==='Clear selection').props.onPress();tree=p.render();tree.props.onRequestClose();assert.equal(p.canceled,1);assert.equal(p.confirmed,undefined);assert.deepEqual(p.input.selected,['2','999']);
  p.find(tree,n=>n.props?.title==='Confirm').props.onPress();assert.equal(p.confirmed,undefined);assert.equal(p.alerts.length,1);p.alerts[0][2][1].onPress();assert.deepEqual(plain(p.confirmed),[]);
});
test('Picker retains missing selected members and disables confirm during loading/error', () => {
  const p=pickerRuntime({selected:['999'],loading:true});const tree=p.render();assert.equal(p.find(tree,n=>n.props?.title==='Confirm').props.disabled,true);
  const text=JSON.stringify(tree);assert.match(text,/999/);assert.deepEqual(p.input.selected,['999']);
});
test('Graph derives directed parents and distinct deduplicated spouse/horizontal edges, never null-parent cliques', () => {
  const members=[member(1,{spouseId:2}),member(2,{spouseId:1}),member(3,{generation:2,fatherId:1,motherId:2,horizontalRelations:[{memberId:4,relationType:'sibling'}]}),member(4,{generation:2,horizontalRelations:[{memberId:3,relationType:'SIBLING'}]}),member(5)];
  const g=graph.buildFamilyGraph(members);assert.equal(g.edges.length,4);assert.equal(g.edges.filter(e=>e.kind==='parent').length,2);assert.equal(g.edges.filter(e=>e.kind==='spouse').length,1);assert.equal(g.warnings,0);
  assert.equal(g.edges.some(e=>e.from===5||e.to===5),false);assert.deepEqual(plain(g.generations.map(r=>r.generation)),[1,2]);
});
test('Malformed cycles/missing/self links warn without recursion or fabricated links', () => {
  const g=graph.buildFamilyGraph([member(1,{fatherId:2,spouseId:999}),member(2,{fatherId:1,motherId:2})]);
  assert.ok(g.warnings>=3);assert.equal(g.edges.length,2);assert.ok(g.edges.every(e=>e.from!==e.to));
});
test('Large-family graph culls offscreen nodes and fit/anchor zoom stay finite with recorded generation gaps', () => {
  const rows=Array.from({length:500},(_,i)=>member(i+1,{generation:i<250?1:20,fullName:'Long name '.repeat(20),fatherId:i>=250?i-249:null}));
  const start=performance.now();const g=graph.buildFamilyGraph(rows,1.3);const ms=performance.now()-start;assert.ok(ms<2000,`500-node layout ${ms}ms`);
  assert.equal(g.nodes.length,500);assert.deepEqual(plain(g.generations.map(r=>r.generation)),[1,20]);
  const fit=graph.fitViewport(g,360,450);assert.ok(fit.scale>0);assert.equal(graph.visibleGraphNodes(g,fit,360,450).length,500);
  assert.ok(graph.visibleGraphNodes(g,{scale:1,x:0,y:0},360,450).length<20);
  const next=graph.zoomViewport({scale:1,x:20,y:30},2,100,100);assert.equal((100-next.x)/next.scale,80);assert.equal((100-next.y)/next.scale,70);
});
test('Native gesture controller supports pan, pinch anchor and finger-count transition without jumps', () => {
  const loader=createLoader({'react-native':{PanResponder:{create:handlers=>({panHandlers:handlers})}}});
  const {createGraphGestures}=loader('src/features/family/graph/graph-gestures.ts');let view;
  const c=createGraphGestures({scale:1,x:0,y:0},v=>{view=v;});const p=c.panHandlers;const event=touches=>({nativeEvent:{touches}});
  p.onPanResponderGrant(event([{pageX:10,pageY:10}]));p.onPanResponderMove(event([{pageX:30,pageY:40}]));assert.deepEqual(plain(view),{scale:1,x:20,y:30});
  p.onPanResponderMove(event([{pageX:0,pageY:0},{pageX:100,pageY:0}]));p.onPanResponderMove(event([{pageX:0,pageY:0},{pageX:200,pageY:0}]));assert.equal(view.scale,2);
  const before=plain(view);p.onPanResponderMove(event([{pageX:500,pageY:500}]));assert.deepEqual(plain(view),before);
});
function avatarRuntime(overrides={}) {
  const values=new Map();const image={launchImageLibraryAsync:async()=>({canceled:true}),getPendingResultAsync:async()=>null,...overrides};
  const loader=createLoader({'@react-native-async-storage/async-storage':{getItem:async key=>values.get(key)??null,setItem:async(key,value)=>{values.set(key,value);},removeItem:async key=>{values.delete(key);}},'expo-image-picker':image,'@/config/env':{appEnv:{apiBaseUrl:'https://api.example.test'}},'@/features/auth/storage/authTokenStorage':{authTokenStorage:{read:async()=>({accessToken:'secret'})}},'@/api/apiClient':{apiRequest:async()=>({})}},{URL});
  return {values,image,picker:loader('src/features/family/avatar/avatar-picker.ts'),transport:loader('src/features/family/avatar/avatar-transport.ts')};
}
test('Authenticated avatar source stays on configured origin; cache identity contains no Bearer secret', () => {
  const {transport}=avatarRuntime();const source=transport.managedAvatarSource('https://api.example.test',1,2,'revision ?#','secret');
  assert.equal(new URL(source.uri).origin,'https://api.example.test');assert.equal(source.headers.Authorization,'Bearer secret');assert.equal(source.cacheKey.includes('secret'),false);
  for(const base of ['https://user:secret@example.test','https://example.test?redirect=1','file:///private',null])assert.throws(()=>transport.managedAvatarSource(base,1,2,'v','secret'));
});
test('Avatar validates local URIs, exact MIME and positive 5MiB bound; cancel/permission stay safe', async () => {
  const a=avatarRuntime();const asset={uri:'file:///photo.png',mimeType:'image/png',fileSize:5*1024*1024};assert.equal(a.transport.validPickedAvatar(asset),true);
  for(const patch of [{uri:'https://untrusted.test/x'},{mimeType:'image/svg+xml'},{fileSize:0},{fileSize:5*1024*1024+1}])assert.equal(a.transport.validPickedAvatar({...asset,...patch}),false);
  assert.equal(await a.picker.pickMemberAvatar(1,2),null);assert.equal(a.values.size,0);
  a.image.launchImageLibraryAsync=async()=>{throw {code:'E_PERMISSION_DENIED'};};await assert.rejects(a.picker.pickMemberAvatar(1,2),error=>error.reason==='permission');
});
test('Old photo-picker completion cannot clear a newer account target or recover its image', async () => {
  const first=hold(),second=hold();let calls=0;const a=avatarRuntime({launchImageLibraryAsync:()=>++calls===1?first.promise:second.promise});
  const one=a.picker.pickMemberAvatar(1,2);await new Promise(r=>setImmediate(r));const two=a.picker.pickMemberAvatar(3,4);await new Promise(r=>setImmediate(r));
  first.resolve({canceled:true});await one;assert.equal(JSON.parse([...a.values.values()][0]).accountId,3);
  assert.equal(await a.picker.recoverMemberAvatar(1,2),null);assert.equal(a.values.size,1);
  second.resolve({canceled:true});await two;assert.equal(a.values.size,0);
});
test('Android pending-photo recovery accepts only same fresh target and rejects expired context', async () => {
  const a=avatarRuntime({getPendingResultAsync:async()=>({canceled:false,assets:[{uri:'content://photo/1',mimeType:'image/png',fileSize:50}]})});
  const key='mylife.family.avatar.picker-context.v1';a.values.set(key,JSON.stringify({accountId:1,memberId:2,at:Date.now()}));assert.equal((await a.picker.recoverMemberAvatar(1,2)).uri,'content://photo/1');assert.equal(a.values.size,0);
  a.values.set(key,JSON.stringify({accountId:1,memberId:2,at:Date.now()-11*60_000}));assert.equal(await a.picker.recoverMemberAvatar(1,2),null);
});
test('Multipart transport leaves boundary to native fetch while preserving Bearer/mobile/omit cookies', async () => {
  let request;const runtime=createM3Runtime('https://api.example.test',async(url,init)=>{request={url,init};return Response.json({success:true,data:member(1)});});
  await runtime.storage.write({accessToken:'synthetic',refreshToken:'refresh',accessTokenExpiresIn:300,refreshTokenExpiresIn:600});const body=new FormData();body.append('file',new Blob(['bytes'],{type:'image/png'}),'photo.png');await runtime.family.uploadAvatar(1,body);
  assert.equal(request.init.body,body);assert.equal(new Headers(request.init.headers).has('Content-Type'),false);assert.equal(new Headers(request.init.headers).get('Authorization'),'Bearer synthetic');assert.equal(request.init.credentials,'omit');
});
test('M3 dictionaries share all keys and provide separate English/Vietnamese safety copy', () => {
  const en=getFamilyStrings('en'),vi=getFamilyStrings('vi');assert.deepEqual(Object.keys(en).sort(),Object.keys(vi).sort());assert.notEqual(en.removeLinksMessage,vi.removeLinksMessage);assert.notEqual(en.selfRelation,vi.selfRelation);
});
test('SDK58 avatar body uses a real file/blob part readable by expo/fetch, never a legacy URI object', async () => {
  const photo={uri:'file:///cache/picked.png',mimeType:'image/png',fileSize:4};let opened;
  class DeviceFile extends Blob { constructor(uri){super(['test'],{type:'image/png'});opened=uri;this.exists=true;} }
  const loader=createLoader({'expo-file-system':{File:DeviceFile},'react-native':{Platform:{OS:'android'}},'./avatar-picker':{AvatarPickError:class extends Error{}},'./avatar-transport':{avatarMaxBytes:5*1024*1024,validPickedAvatar:()=>true}},{FormData,Blob});
  const body=loader('src/features/family/avatar/avatar-body.ts').createAvatarBody(photo);const part=body.get('file');assert.equal(opened,photo.uri);assert.ok(part instanceof Blob);assert.equal(part.type,'image/png');assert.equal(await part.text(),'test');
});
test('Unknown picker file size is checked against the actual local file before native upload', () => {
  class DeviceFile { exists=true;size=5*1024*1024+1; }
  const loader=createLoader({'expo-file-system':{File:DeviceFile},'react-native':{Platform:{OS:'android'}},'./avatar-picker':{AvatarPickError:class extends Error{}},'./avatar-transport':{avatarMaxBytes:5*1024*1024,validPickedAvatar:()=>true}},{FormData,Blob});
  assert.throws(()=>loader('src/features/family/avatar/avatar-body.ts').createAvatarBody({uri:'file:///large.png',mimeType:'image/png'}));
});
