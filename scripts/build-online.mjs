import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {readdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';

const serverRequire=createRequire(new URL('../homow-server/server.mjs',import.meta.url));
for(const dependency of ['ws','pg']){
 await import(pathToFileURL(serverRequire.resolve(dependency)).href);
 console.log('Runtime dependency OK: '+dependency);
}
const sources=readdirSync('.').filter(name=>name.endsWith('.js'));
sources.push(...readdirSync('homow-server').filter(name=>name.endsWith('.mjs')&&!name.endsWith('.test.mjs')&&name!=='test.mjs').map(name=>'homow-server/'+name));
for(const file of sources){
 const result=spawnSync(process.execPath,['--check',file],{stdio:'inherit'});
 if(result.status!==0)process.exit(result.status||1);
}
const result=spawnSync(process.execPath,['--test','homow-server/test.mjs'],{stdio:'inherit'});
if(result.status!==0)process.exit(result.status||1);
console.log('HoMoW build passed: client/server syntax and online simulation.');
