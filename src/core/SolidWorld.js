import * as THREE from 'three';
import {createTrafficModel} from './Vehicles.js';
export default class SolidWorld{
 constructor(world,R,onImpact){Object.assign(this,{world,R,onImpact});this.colliders=[];this.names=new Map();this.hits={};this.practice=[];this.t=0;this.cool=0;}
 clear(){for(const c of this.colliders)this.world.removeCollider(c,true);this.colliders=[];this.names.clear();this.practice=[];}
 add(size,pos,q,name){const d=this.R.ColliderDesc.cuboid(size.x/2,size.y/2,size.z/2).setTranslation(pos.x,pos.y,pos.z).setRotation(q||{x:0,y:0,z:0,w:1}).setFriction(.85).setRestitution(.15);const c=this.world.createCollider(d);this.colliders.push(c);this.names.set(c.handle,name);return c;}
 rebuild(stage,level,site){this.clear();if(!stage)return;stage.updateMatrixWorld(true);
  stage.traverse(m=>{if(m.userData.trafficType){const b=new THREE.Box3().setFromObject(m),size=b.getSize(new THREE.Vector3()),pos=b.getCenter(new THREE.Vector3());this.add(size,pos,null,'parked-car');return;}if(m.parent?.userData.trafficType||!m.isMesh||m.geometry?.type!=='BoxGeometry')return;const sz=m.geometry.parameters;if(sz.height<.5||sz.width>100||sz.depth>100)return;const add=matrix=>{const p=new THREE.Vector3(),q=new THREE.Quaternion(),scale=new THREE.Vector3();matrix.decompose(p,q,scale);this.add(new THREE.Vector3(sz.width*scale.x,sz.height*scale.y,sz.depth*scale.z),p,q,'site-prop');};if(m.isInstancedMesh){const a=new THREE.Matrix4();for(let i=0;i<m.count;i++){m.getMatrixAt(i,a);add(new THREE.Matrix4().multiplyMatrices(m.matrixWorld,a));}}else add(m.matrixWorld);});
  if(level.job.id!==1)return;
  const mat=c=>new THREE.MeshStandardMaterial({color:c,roughness:.8}),box=(g,w,h,d,c,x,y,z)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(c));m.position.set(x,y,z);m.castShadow=true;g.add(m);};
  for(const [i,name] of ['barrier','fence','container','pile-edge','parked-car'].entries()){const x=site.pile.x-12+i*12,z=site.pile.z+20,g=new THREE.Group();g.name='solid-'+name;g.position.set(x,0,z);level.group.add(g);
   if(i===0){box(g,6,1.4,1.2,0xeac345,0,.7,0);for(let k=-2;k<=2;k++)box(g,.5,1.4,1.3,0x263244,k,.7,0);}
   if(i===1){for(const xx of [-4,0,4])box(g,.4,2.6,.5,0x586b72,xx,1.3,0);for(const yy of [.8,2])box(g,8,.35,.4,0xb8c9c8,0,yy,0);}
   if(i===2){box(g,8,4,4,0x477a91,0,2,0);for(let k=-3.5;k<=3.5;k++)box(g,.3,3.8,.3,0x315b70,k,2,-2);}
   if(i===3){const m=new THREE.Mesh(new THREE.ConeGeometry(5,3,20),mat(0x795339));m.position.y=1.5;g.add(m);}
   if(i===4)g.add(createTrafficModel(2,0xeac345));
   g.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(g),size=b.getSize(new THREE.Vector3()),pos=b.getCenter(new THREE.Vector3());if(i===3){const c=this.world.createCollider(this.R.ColliderDesc.cone(1.5,5).setTranslation(x,1.5,z).setFriction(1.4).setRestitution(.1));this.colliders.push(c);this.names.set(c.handle,name);}else this.add(size,pos,null,name);this.practice.push({name,x,z,width:size.x,depth:size.z});
  }
 }
 contact(vehicle,dt,before){this.t+=dt;const chassis=vehicle.chassisBody.collider(0);if(!chassis)return;this.world.contactPairsWith(chassis,c=>{const name=this.names.get(c.handle);if(!name||this.t<this.cool||Math.hypot(before.x,before.z)<1)return;this.cool=this.t+1.2;this.hits[name]=(this.hits[name]||0)+1;const mass=vehicle.chassisBody.mass();vehicle.chassisBody.applyImpulse({x:-before.x*mass*.2,y:0,z:-before.z*mass*.2},true);this.onImpact?.(name);});}
 info(){return {colliders:this.colliders.length,practice:this.practice,hits:this.hits};}
}
