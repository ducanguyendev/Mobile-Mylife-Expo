// Reproducible Android UI evidence; fixed isolated serial/AVD, no personal device.
const fs=require('node:fs'),cp=require('node:child_process');
const adb='C:/Users/admin/AppData/Local/Android/Sdk/platform-tools/adb.exe';
const serial='emulator-5584';
const run=(...args)=>cp.execFileSync(adb,['-s',serial,...args],{encoding:'utf8',timeout:30000,maxBuffer:16*1024*1024});
function nodes(xml){return [...xml.matchAll(/<node\s+([^>]+)>?/g)].map((match,index)=>{const row={index};for(const attr of match[1].matchAll(/([\w-]+)="([^"]*)"/g))row[attr[1]]=attr[2].replaceAll('&amp;','&').replaceAll('&quot;','"');return row;});}
function dump(){
 run('shell','rm','-f','/sdcard/m4-ui.xml');
 const result=run('shell','uiautomator','dump','/sdcard/m4-ui.xml');
 if(!result.includes('dumped to'))throw Error('No fresh UI hierarchy');
 const xml=run('shell','cat','/sdcard/m4-ui.xml');
 if(!xml.includes('<hierarchy'))throw Error('Invalid UI hierarchy');
 return xml;
}
function tap(node){const values=node.bounds.match(/\d+/g).map(Number);run('shell','input','tap',String(Math.round((values[0]+values[2])/2)),String(Math.round((values[1]+values[3])/2)));}
async function main(){
 const runtime=JSON.parse(fs.readFileSync('.tmp/m3-runtime.json','utf8'));
 if(!/^mylife_m1_[a-f0-9]{12}$/.test(runtime.database)||!run('emu','avd','name').includes('MyLife_M4'))throw Error('Not isolated');
 const [action,arg,value,evidenceName]=process.argv.slice(2);const fileName=evidenceName||value||arg||'snapshot';
 if(action==='tap'){const candidates=nodes(dump()).filter(n=>n.text===arg||n['content-desc']===arg);const clickable=candidates.filter(n=>n.clickable==='true');const matches=clickable.length?clickable:candidates;if(matches.length!==1)throw Error('Ambiguous action');tap(matches[0]);}
 else if(action==='fill'){
  const fields=nodes(dump()).filter(n=>n.class==='android.widget.EditText');const field=fields[Number(arg)];if(!field)throw Error('Field not visible');tap(field);
  run('shell','input','keyevent','123');
  if(field.text)run('shell','input','keyevent',...Array(Math.min(field.text.length,500)).fill('67'));
  const credential=value==='email'||value==='password'?JSON.parse(fs.readFileSync('.tmp/m4-native-user.json','utf8'))[value]:value;
  run('shell','input','text',credential.replaceAll(' ','%s'));
 }
 else if(action==='back')run('shell','input','keyevent','4');
 else if(action!=='snapshot')throw Error('Unknown action');
 await new Promise(r=>setTimeout(r,800));let xml=dump();
 xml=xml.replace(/<node\s+[^>]*password="true"[^>]*>/g,tag=>tag.replace(/text="[^"]*"/,'text="[redacted]"'));
 const safeName=fileName.replace(/[^a-zA-Z0-9_-]/g,'_');const dir='docs/review-m4/test-results/native';fs.mkdirSync(dir,{recursive:true});
 fs.writeFileSync(`${dir}/${safeName}.xml`,xml);const rows=nodes(xml).filter(n=>n.text||n['content-desc']);fs.writeFileSync(`${dir}/${safeName}.json`,JSON.stringify(rows,null,2));
 run('shell','screencap','-p','/sdcard/m4-screen.png');run('pull','/sdcard/m4-screen.png',`${dir}/${safeName}.png`);
 console.log(JSON.stringify({totalNodes:rows.length,preview:rows.slice(0,50).map(n=>({label:n['content-desc']||n.text,bounds:n.bounds,clickable:n.clickable}))},null,2));
}
main().catch(()=>{console.error('Isolated native QA action failed; inspect the latest device state before retrying.');process.exitCode=1;});
