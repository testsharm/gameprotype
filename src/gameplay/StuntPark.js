import * as THREE from 'three';

// Independent 200m sandbox. All rewards come from real chassis/ring contact.
export const PARK_CENTER={x:0,z:4000};
export default class StuntPark {
  constructor(scene,world,R){Object.assign(this,{scene,world,R});this.group=new THREE.Group();this.group.name='stuntPark';this.group.position.set(0,0,PARK_CENTER.z);this.group.visible=false;scene.add(this.group);this.bodies=[];this.colliders=[];this.rings=[];this.cones=[];this.pads=[];this.coins=0;this.maxCoins=150;this.bestAir=0;this._airT=0;this._t=0;this.digs=0;this._mats=new Map();this.drawCalls=0;}
  onCoin(fn){this._onCoin=fn;}
  mat(c,extra={}){const key=c+JSON.stringify(extra);if(!this._mats.has(key))this._mats.set(key,new THREE.MeshStandardMaterial({color:c,roughness:.85,...extra}));return this._mats.get(key);}
  add(geo,c,x,y,z,extra={}){const m=new THREE.Mesh(geo,this.mat(c,extra));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;this.group.add(m);this.drawCalls++;return m;}
  box(w,h,d,c,x,y,z){return this.add(new THREE.BoxGeometry(w,h,d),c,x,y,z);}
  fixedBox(x,y,z,hx,hy,hz,q){const d=this.R.RigidBodyDesc.fixed().setTranslation(x,y,PARK_CENTER.z+z);if(q)d.setRotation(q);const b=this.world.createRigidBody(d);const c=this.world.createCollider(this.R.ColliderDesc.cuboid(hx,hy,hz).setFriction(1.4),b);this.bodies.push(b);this.colliders.push(c);return b;}
  label(txt,x,y,z){const c=document.createElement('canvas');c.width=512;c.height=96;const g=c.getContext('2d');g.fillStyle='#172335';g.fillRect(0,0,512,96);g.strokeStyle='#fbbf24';g.lineWidth=8;g.strokeRect(4,4,504,88);g.fillStyle='#fbbf24';g.font='bold 42px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(txt,256,50);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const m=new THREE.Sprite(new THREE.SpriteMaterial({map:t}));m.scale.set(10,1.875,1);m.position.set(x,y,z);this.group.add(m);}
  build(){if(this._built)return;this._built=true;
    // Ground has a genuine hole occupied by the deformable heightfield.
    const shape=new THREE.Shape();shape.moveTo(-100,-100);shape.lineTo(100,-100);shape.lineTo(100,100);shape.lineTo(-100,100);shape.closePath();const hole=new THREE.Path();hole.moveTo(20,30);hole.lineTo(20,60);hole.lineTo(60,60);hole.lineTo(60,30);hole.closePath();shape.holes.push(hole);const ground=this.add(new THREE.ShapeGeometry(shape),0x567849,0,.1,0);ground.rotation.x=-Math.PI/2;
    for(const [x,z,hx,hz] of [[-40,0,60,100],[80,0,20,100],[40,-80,20,20],[40,35,20,65]])this.fixedBox(x,-.2,z,hx,.3,hz);
    // Spawn pad and straight runway put every activity in the forward hemisphere.
    this.box(30,.35,26,0x3b4656,0,-.06,83);this.label('STUNT PARK',0,5,71);
    for(const [x,h] of [[-45,1],[0,2],[45,3.5]]){const length=Math.hypot(18,h),pitch=Math.atan2(h,18),q=new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch,0,0));const m=this.box(12,.4,length,0x8d9ca8,x,h/2+.06,0);m.quaternion.copy(q);this.fixedBox(x,h/2+.06,0,6,.2,length/2,q);this.box(11,h,.7,0x334155,x,h/2,-8.6);this.label(h+'m RAMP',x,h+3,-7);}
    // Rotating solid cylinder, exactly twenty degrees per second.
    this.turntable=this.add(new THREE.CylinderGeometry(8,8,.6,40),0x344b68,-51,.4,-37);this.tableBody=this.world.createRigidBody(this.R.RigidBodyDesc.kinematicPositionBased().setTranslation(-51,.4,PARK_CENTER.z-37));this.bodies.push(this.tableBody);this.colliders.push(this.world.createCollider(this.R.ColliderDesc.cylinder(.3,8).setFriction(2),this.tableBody));
    const arrow=this.box(10,.35,.8,0xfbbf24,-51,.88,-37);this.group.remove(arrow);this.turntable.add(arrow);arrow.position.set(0,.48,0);this.label('20° / SECOND',-51,4,-37);
    this._buildField();
    // Ten independent physics cones, each base and cone move together.
    for(let i=0;i<10;i++){const x=-73+i*6,z=28+(i%2?5:-5);const b=this.world.createRigidBody(this.R.RigidBodyDesc.dynamic().setTranslation(x,.9,PARK_CENTER.z+z).setLinearDamping(1).setAngularDamping(2));this.bodies.push(b);this.colliders.push(this.world.createCollider(this.R.ColliderDesc.cone(.7,.5).setMass(.6),b));this.colliders.push(this.world.createCollider(this.R.ColliderDesc.cuboid(.6,.1,.6).setTranslation(0,-.7,0).setMass(.4),b));const g=new THREE.Group(),cone=new THREE.Mesh(new THREE.ConeGeometry(.5,1.4,12),this.mat(0xff791b)),base=new THREE.Mesh(new THREE.BoxGeometry(1.2,.2,1.2),this.mat(0x263244));base.position.y=-.7;g.add(cone,base);this.group.add(g);this.cones.push({body:b,mesh:g});}
    const pond=this.add(new THREE.CircleGeometry(12,40),0x278bab,-77,.13,-7,{roughness:.3,metalness:.2});pond.rotation.x=-Math.PI/2;this.label('POND',-77,3,-7);
    this._buildHill();
    const spots=[[0,70],[0,57],[0,44],[-45,16],[0,15],[45,16],[-45,-14],[0,-14],[45,-14],[-64,49],[-45,49],[-25,49],[25,49],[45,49],[65,49],[-75,66],[-50,66],[-25,66],[25,66],[50,66],[75,66],[-60,-52],[-42,-65],[-22,-87],[0,-91],[25,-85],[66,-76],[75,-50],[73,-25],[60,7]];
    const geo=new THREE.TorusGeometry(2.1,.35,10,28);for(const [x,z] of spots){const m=this.add(geo,0xfbbf24,x,2.5,z,{emissive:0xa55a08,emissiveIntensity:.5,metalness:.5});this.rings.push({mesh:m,x,z:PARK_CENTER.z+z,taken:false});}
    // Four continuous fence rails and thick posts, all physically solid.
    for(const x of [-100,100]){this.box(.5,2.6,200,0x344b57,x,1.3,0);this.fixedBox(x,1.3,0,.25,1.3,100);}
    for(const z of [-100,100]){this.box(200,2.6,.5,0x344b57,0,1.3,z);this.fixedBox(0,1.3,z,100,1.3,.25);}
    for(let t=-100;t<=100;t+=10)for(const [x,z] of [[-100,t],[100,t],[t,-100],[t,100]])this.box(.7,3.2,.7,0xc5ccbf,x,1.6,z);
  }
  _buildField(){this.heights=new Float32Array(41*31);const verts=new Float32Array(41*31*3),indices=[];for(let x=0;x<=40;x++)for(let z=0;z<=30;z++){const i=x*31+z,h=.15+.06*Math.sin(x*.5)*Math.cos(z*.4);this.heights[i]=h;verts.set([x-20,h,z-15],i*3);if(x<40&&z<30){const a=i,b=i+31;indices.push(a,a+1,b,b,a+1,b+1);}}
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(verts,3));geo.setIndex(indices);geo.setAttribute('color',new THREE.BufferAttribute(new Float32Array(verts.length).fill(1),3));geo.computeVertexNormals();this.field=this.add(geo,0x93683f,40,.1,-45);this.field.material.vertexColors=true;this.fieldBody=this.world.createRigidBody(this.R.RigidBodyDesc.fixed().setTranslation(40,.1,PARK_CENTER.z-45));this.bodies.push(this.fieldBody);this._fieldCollider();
    for(const z of [-60,-30])this.box(40,.35,.4,0xfbbf24,40,.35,z);for(const x of [20,60])this.box(.4,.35,30,0xfbbf24,x,.35,-45);this.label('40 × 30m DIG FIELD',40,4,-60);
  }
  _fieldCollider(){if(this.fieldCollider)this.world.removeCollider(this.fieldCollider,true);this.fieldCollider=this.world.createCollider(this.R.ColliderDesc.heightfield(30,40,this.heights,{x:40,y:1,z:30}).setFriction(1.3),this.fieldBody);}
  dig(bp){const x=bp.x-40,z=bp.z-PARK_CENTER.z+45;if(Math.abs(x)>20||Math.abs(z)>15)return false;let changed=0;const pos=this.field.geometry.attributes.position;for(let i=0;i<this.heights.length;i++){const dx=pos.getX(i)-x,dz=pos.getZ(i)-z,d=Math.hypot(dx,dz);if(d<4.8){this.heights[i]=Math.max(-2.8,this.heights[i]-.95*(1-d/4.8));pos.setY(i,this.heights[i]);const shade=1-.6*Math.min(1,Math.max(0,-this.heights[i])/1.5);this.field.geometry.attributes.color.setXYZ(i,shade,shade,shade);changed++;}}if(!changed)return false;pos.needsUpdate=true;this.field.geometry.attributes.color.needsUpdate=true;this.field.geometry.computeVertexNormals();this._fieldCollider();this.digs++;return true;}
  _buildHill(){const hx=0,hz=-65;this.add(new THREE.ConeGeometry(24,12,48),0x8c7955,hx,6,hz);const hillBody=this.world.createRigidBody(this.R.RigidBodyDesc.fixed().setTranslation(0,6,PARK_CENTER.z+hz));this.bodies.push(hillBody);this.colliders.push(this.world.createCollider(this.R.ColliderDesc.cone(6,24),hillBody));
    const points=[];for(let i=0;i<=80;i++){const t=i/80,a=Math.PI/2+t*Math.PI*4,r=27-17*t;points.push(new THREE.Vector3(Math.cos(a)*r,12*t+.12,hz+Math.sin(a)*r));}
    for(let i=0;i<80;i++){const a=points[i],b=points[i+1],dir=b.clone().sub(a),len=dir.length(),mid=a.clone().add(b).multiplyScalar(.5),q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1,0,0),dir.normalize()),m=this.box(len+.25,.4,5,0x697f59,mid.x,mid.y,mid.z);m.quaternion.copy(q);this.fixedBox(mid.x,mid.y,mid.z,(len+.25)/2,.2,2.5,q);if(i%8===0&&mid.y>1){this.box(.8,mid.y,.8,0x6e7467,mid.x,mid.y/2,mid.z);this.fixedBox(mid.x,mid.y/2,mid.z,.4,mid.y/2,.4);}}
    this.add(new THREE.CylinderGeometry(11,11,.5,40),0x677d56,0,12.1,hz);const cap=this.world.createRigidBody(this.R.RigidBodyDesc.fixed().setTranslation(0,12.1,PARK_CENTER.z+hz));this.bodies.push(cap);this.colliders.push(this.world.createCollider(this.R.ColliderDesc.cylinder(.25,11),cap));this.box(.4,4,.4,0xf1f5f9,0,14.3,hz);this.box(3,1.7,.35,0xffbc24,1.5,15.2,hz);this.label('12m SPIRAL HILL',0,17,hz);
  }
  show(){this.build();this.group.visible=true;}
  hide(){this.group.visible=false;}
  reset(){for(const r of this.rings){r.taken=false;r.mesh.visible=true;}}
  update(dt,vehicle){if(!this.group.visible||!vehicle)return null;this._t+=dt;this.turntable.rotation.y=this._t*Math.PI/9;this.tableBody.setNextKinematicRotation({x:0,y:Math.sin(this._t*Math.PI/18),z:0,w:Math.cos(this._t*Math.PI/18)});for(const c of this.cones){const p=c.body.translation(),q=c.body.rotation();c.mesh.position.set(p.x,p.y,p.z-PARK_CENTER.z);c.mesh.quaternion.copy(q);}
    const p=vehicle.chassisBody.translation();for(const label of this.group.children)if(label.isSprite)label.visible=Math.hypot(p.x-label.position.x,p.z-PARK_CENTER.z-label.position.z)>12;for(const r of this.rings)if(!r.taken){r.mesh.rotation.y+=dt;r.mesh.position.y=2.5+Math.sin(this._t*2+r.x)*.2;if(Math.hypot(p.x-r.x,p.z-r.z)<3.4&&Math.abs(p.y-1.2)<4){r.taken=true;r.mesh.visible=false;const give=Math.min(5,this.maxCoins-this.coins);if(give>0){this.coins+=give;this._onCoin?.(give);}}}
    const grounded=[0,1,2,3].some(i=>vehicle.vehicleController.wheelIsInContact(i));if(!grounded&&p.y>1.6){this._airT+=dt;this.bestAir=Math.max(this.bestAir,this._airT);}else this._airT=0;
    if(p.y<-8||Math.abs(p.x)>110||Math.abs(p.z-PARK_CENTER.z)>110)this.respawn(vehicle);
    return this.info();
  }
  respawn(v){v.chassisBody.setTranslation({x:0,y:1.3,z:PARK_CENTER.z+85},true);v.chassisBody.setRotation({x:0,y:1,z:0,w:0},true);v.chassisBody.setLinvel({x:0,y:0,z:0},true);v.chassisBody.setAngvel({x:0,y:0,z:0},true);v.mesh.position.set(0,1.3,PARK_CENTER.z+85);v.mesh.quaternion.set(0,1,0,0);v.resetInterpolation?.();}
  info(){return {coins:this.coins,bestAir:this.bestAir,air:this._airT,rings:this.rings.filter(r=>r.taken).length,totalRings:this.rings.length,digs:this.digs,minHeight:this.heights?Math.min(...this.heights):0,maxHeight:this.heights?Math.max(...this.heights):0,turnDegrees:this._t*20};}
  drawMap(ctx,v){ctx.clearRect(0,0,180,180);ctx.fillStyle='#314842';ctx.fillRect(10,10,160,160);ctx.strokeStyle='#dbe5d4';ctx.strokeRect(10,10,160,160);ctx.fillStyle='#93683f';ctx.fillRect(106,42,32,24);ctx.fillStyle='#278bab';ctx.beginPath();ctx.arc(28,84,9,0,Math.PI*2);ctx.fill();ctx.fillStyle='#8c7955';ctx.beginPath();ctx.arc(90,38,19,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fbbf24';for(const r of this.rings)if(!r.taken){ctx.beginPath();ctx.arc(90+r.x*.8,90+(r.z-PARK_CENTER.z)*.8,2,0,Math.PI*2);ctx.fill();}const p=v.mesh.position;ctx.save();ctx.translate(90+p.x*.8,90+(p.z-PARK_CENTER.z)*.8);ctx.rotate(Math.PI-new THREE.Euler().setFromQuaternion(v.mesh.quaternion,'YXZ').y);ctx.fillStyle='white';ctx.beginPath();ctx.moveTo(0,-6);ctx.lineTo(4,5);ctx.lineTo(-4,5);ctx.closePath();ctx.fill();ctx.restore();}
  dispose(){for(const b of this.bodies)this.world.removeRigidBody(b);this.bodies=[];this.scene.remove(this.group);}
}
