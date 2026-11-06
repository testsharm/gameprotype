import * as THREE from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
const templates=new Map();
export const TRAFFIC_COLORS=[0xd84735,0x3579d2,0x45a66a,0xeac345,0xf0eee6,0xa8b2bd,0x313d50,0xea8b36,0x8664bb,0x35aab4];
export const TRAFFIC_TYPES=['SEDAN','HATCHBACK','SUV','PICKUP','VAN','BUS','FLATBED'];
const mats=new Map(),geos=new Map();
function mat(c){if(!mats.has(c))mats.set(c,new THREE.MeshStandardMaterial({color:c,roughness:.62,metalness:.12}));return mats.get(c);}
function boxGeo(w,h,d){const k=[w,h,d].join(',');if(!geos.has(k))geos.set(k,new THREE.BoxGeometry(w,h,d));return geos.get(k);}
export function createTrafficModel(index,color=TRAFFIC_COLORS[index%10]){
 const kind=((index%7)+7)%7,key=kind+'/'+color;if(templates.has(key))return templates.get(key).clone(true);const g=new THREE.Group(),wheels=[],lens=0xa6cad6,black=0x202a36;const box=(w,h,d,c,x,y,z)=>{const m=new THREE.Mesh(boxGeo(w,h,d),mat(c));m.position.set(x,y,z);m.castShadow=true;g.add(m);return m;};
 const specs=[[2.1,1.7,4.7],[2,1.7,3.7],[2.4,2.25,5.1],[2.35,2,5.6],[2.4,2.7,5.3],[2.7,3.1,9.4],[2.6,2.6,7.4]], [w,h,len]=specs[kind];
 box(w,.65,len,color,0,.7,0);box(w+.1,.3,.4,black,0,.45,len/2);box(w+.1,.3,.4,black,0,.45,-len/2);
 if(kind<3){const roofLen=kind===0?2.45:kind===1?2.6:3.5,roofY=kind===2?1.8:1.45;box(w-.25,.85,roofLen,lens,0,roofY,-.25);box(w-.18,.32,roofLen+.15,color,0,roofY+.5,-.25);for(const x of [-w/2+.12,w/2-.12])for(const z of [-roofLen/2,0,roofLen/2])box(.3,1,.3,color,x,roofY,z-.25);}
 if(kind===3){box(w-.25,1.05,2.3,lens,0,1.55,1);box(w,.3,2.5,color,0,2.15,1);box(w,.35,2.5,black,0,1.05,-1.45);for(const x of [-w/2+.15,w/2-.15])box(.3,.7,2.5,color,x,1.35,-1.45);box(w,.7,.3,color,0,1.35,-2.65);}
 if(kind===4){box(w,h-1,len-.3,color,0,1.7,-.1);box(w-.35,1.1,.35,lens,0,2,len/2-.05);for(const x of [-w/2,w/2])box(.3,1,1.6,lens,x,2,1.2);box(.35,1.8,.35,black,0,1.6,-len/2-.08);}
 if(kind===5){box(w,2.2,len-.2,color,0,1.85,0);box(w-.3,1.25,.35,lens,0,2.15,len/2);for(const x of [-w/2,w/2])for(let z=-3.5;z<4;z+=1.4)box(.35,1.15,1.1,lens,x,2.2,z);box(w,.3,len,black,0,3.15,0);}
 if(kind===6){box(w,1.8,2.6,color,0,1.55,2);box(w-.4,1,.35,lens,0,1.9,3.35);box(w+.2,.4,4.5,0x667382,0,1,-1.55);for(const x of [-w/2,w/2])box(.3,.4,4.5,black,x,1.4,-1.55);}
 for(const x of [-w*.36,w*.36]){box(.42,.35,.35,0xfff0bb,x,.9,len/2+.12);box(.4,.35,.35,0xe84c39,x,.9,-len/2-.12);box(.4,.35,.4,black,Math.sign(x)*(w/2+.15),1.55,len*.22);}
 const r=kind===5||kind===6?.52:.4;const wheelGeo=new THREE.CylinderGeometry(r,r,.35,16);wheelGeo.rotateZ(Math.PI/2);
 for(const z of [len*.31,-len*.31,...(kind>4?[-len*.15]:[])])for(const x of [-w/2,w/2]){const wh=new THREE.Mesh(wheelGeo,mat(0x161c22));wh.position.set(x,r,z);wh.castShadow=true;g.add(wh);const rim=new THREE.Mesh(new THREE.CylinderGeometry(r*.55,r*.55,.38,12).rotateZ(Math.PI/2),mat(0x9aa5b3));rim.position.copy(wh.position);g.add(rim);wheels.push(wh);}
 const groups=new Map();for(const m of [...g.children]){m.updateMatrix();const geo=m.geometry.clone().applyMatrix4(m.matrix);if(!groups.has(m.material))groups.set(m.material,[]);groups.get(m.material).push(geo);g.remove(m);}for(const [material,parts] of groups){const geo=mergeGeometries(parts);parts.forEach(p=>p.dispose());const m=new THREE.Mesh(geo,material);m.castShadow=true;g.add(m);}wheels.length=0;
 g.userData={trafficType:TRAFFIC_TYPES[kind],color,width:w+.4,height:h,length:len+.5,wheels};templates.set(key,g.clone(true));return g;
}
