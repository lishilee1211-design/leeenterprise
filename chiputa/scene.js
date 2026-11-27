// Chiputa link-slab + pool — WebGL2 scene (M/s Lee Enterprise)
// Datum: y = 0 is GF finished floor (plinth top). Natural ground = -0.45. Link slab FFL = +3.00.
(function(){
const V=[],T=[]; // opaque, transparent vertex lists: x y z nx ny nz r g b m
function push(arr,p,n,c,m){arr.push(p[0],p[1],p[2],n[0],n[1],n[2],c[0],c[1],c[2],m);}
function tri(arr,a,b,c,col,m){const u=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],v=[c[0]-a[0],c[1]-a[1],c[2]-a[2]];
 let n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];const l=Math.hypot(...n)||1;n=n.map(x=>x/l);
 push(arr,a,n,col,m);push(arr,b,n,col,m);push(arr,c,n,col,m);}
function quad(arr,a,b,c,d,col,m){tri(arr,a,b,c,col,m);tri(arr,a,c,d,col,m);}
function box(x0,x1,y0,y1,z0,z1,col,m=0,arr=V){
 const p=[[x0,y0,z0],[x1,y0,z0],[x1,y1,z0],[x0,y1,z0],[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]];
 quad(arr,p[0],p[3],p[2],p[1],col,m);quad(arr,p[4],p[5],p[6],p[7],col,m);
 quad(arr,p[0],p[4],p[7],p[3],col,m);quad(arr,p[1],p[2],p[6],p[5],col,m);
 quad(arr,p[3],p[7],p[6],p[2],col,m);quad(arr,p[0],p[1],p[5],p[4],col,m);}
function cyl(x,z,y0,y1,r,col,m=0,seg=24,arr=V){
 for(let i=0;i<seg;i++){const a0=i/seg*Math.PI*2,a1=(i+1)/seg*Math.PI*2;
  const p0=[x+r*Math.cos(a0),y0,z+r*Math.sin(a0)],p1=[x+r*Math.cos(a1),y0,z+r*Math.sin(a1)];
  const p2=[p1[0],y1,p1[2]],p3=[p0[0],y1,p0[2]];
  const na=[Math.cos(a0),0,Math.sin(a0)],nb=[Math.cos(a1),0,Math.sin(a1)];
  push(arr,p0,na,col,m);push(arr,p3,na,col,m);push(arr,p2,nb,col,m);
  push(arr,p0,na,col,m);push(arr,p2,nb,col,m);push(arr,p1,nb,col,m);
  tri(arr,[x,y1,z],p2,p3,col,m);tri(arr,[x,y0,z],p0,p1,col,m);}}
function rod(a,b,r,col,m=9,seg=12,arr=V){ // cylinder between points (axis mostly horizontal)
 const d=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],L=Math.hypot(...d),w=d.map(x=>x/L);
 let up=Math.abs(w[1])<.9?[0,1,0]:[1,0,0];
 let u=[w[1]*up[2]-w[2]*up[1],w[2]*up[0]-w[0]*up[2],w[0]*up[1]-w[1]*up[0]];const ul=Math.hypot(...u);u=u.map(x=>x/ul);
 const v=[w[1]*u[2]-w[2]*u[1],w[2]*u[0]-w[0]*u[2],w[0]*u[1]-w[1]*u[0]];
 for(let i=0;i<seg;i++){const t0=i/seg*Math.PI*2,t1=(i+1)/seg*Math.PI*2;
  const n0=[0,1,2].map(k=>u[k]*Math.cos(t0)+v[k]*Math.sin(t0)),n1=[0,1,2].map(k=>u[k]*Math.cos(t1)+v[k]*Math.sin(t1));
  const p0=a.map((q,k)=>q+n0[k]*r),p1=a.map((q,k)=>q+n1[k]*r),p2=b.map((q,k)=>q+n1[k]*r),p3=b.map((q,k)=>q+n0[k]*r);
  push(arr,p0,n0,col,m);push(arr,p1,n1,col,m);push(arr,p2,n1,col,m);push(arr,p0,n0,col,m);push(arr,p2,n1,col,m);push(arr,p3,n0,col,m);}}
let seed=7;function rnd(){seed=(seed*16807)%2147483647;return seed/2147483647;}
function blob(x,y,z,r,col,m=8){ // smooth noisy foliage clump (2x subdivided icosphere)
 const t=(1+Math.sqrt(5))/2;let vs=[[-1,t,0],[1,t,0],[-1,-t,0],[1,-t,0],[0,-1,t],[0,1,t],[0,-1,-t],[0,1,-t],[t,0,-1],[t,0,1],[-t,0,-1],[-t,0,1]].map(p=>{const l=Math.hypot(...p);return p.map(v=>v/l);});
 let f=[[0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],[1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],[3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],[4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]];
 for(let it=0;it<2;it++){const cache={},nf=[];const mid=(a,b)=>{const k=a<b?a+'_'+b:b+'_'+a;if(cache[k]!==undefined)return cache[k];const p=vs[a].map((v,i)=>v+vs[b][i]),l=Math.hypot(...p);vs.push(p.map(v=>v/l));return cache[k]=vs.length-1;};
  f.forEach(([a,b,c])=>{const ab=mid(a,b),bc=mid(b,c),ca=mid(c,a);nf.push([a,ab,ca],[b,bc,ab],[c,ca,bc],[ab,bc,ca]);});f=nf;}
 const ph=[rnd()*6,rnd()*6,rnd()*6];
 const P=vs.map(p=>{const d=1+0.16*Math.sin(p[0]*5+ph[0])*Math.sin(p[1]*4+ph[1])+0.12*Math.sin(p[2]*6+ph[2])+0.06*Math.sin((p[0]+p[2])*11);
  return [x+p[0]*r*d,y+p[1]*r*d*0.82,z+p[2]*r*d];});
 f.forEach(q=>q.forEach(k=>push(V,P[k],vs[k],col,m)));}
function tree(x,z,h,r){cyl(x,z,-0.45,h*0.55,0.12+r*0.03,[0.35,0.25,0.16],0,8);
 const g=[0.20+0.08*rnd(),0.36+0.1*rnd(),0.14];blob(x,h*0.7,z,r,g);blob(x+r*0.5,h*0.62,z-r*0.3,r*0.7,g);blob(x-r*0.4,h*0.8,z+r*0.3,r*0.65,g);}
function shrub(x,z,r){blob(x,-0.45+r*0.6,z,r,[0.22+0.1*rnd(),0.42+0.1*rnd(),0.16]);}

// ---------- palette ----------
const WHITE=[0.92,0.91,0.87],CONC=[0.72,0.71,0.68],GREYW=[0.80,0.78,0.74],DARKGL=[0.10,0.13,0.15],
 WOOD=[0.50,0.31,0.17],GRAN=[0.20,0.20,0.22],STEEL=[0.72,0.74,0.76],TILE=[0.80,0.76,0.68],
 WALKT=[0.60,0.54,0.46],POOLT=[0.30,0.68,0.80],WATER=[0.10,0.52,0.66],GLASS=[0.70,0.86,0.88],
 WARM=[1.0,0.78,0.48],ROOF=[0.30,0.37,0.45],STONE=[0.56,0.50,0.43],GRASS=[0.30,0.44,0.18],SOIL=[0.55,0.47,0.36];

// ===== SITE AS PER DRONE SURVEY (Tam Tari, Chiputa) =====
// x: across (W->E, perpendicular to buildings, bearing ~65°), z: along buildings toward SSE (bearing ~155°), y: up.
// Left (white) bldg 24.4 m long, Right (blue-roof) bldg ~21.4 m; centres aligned. Link aligned with wide door of left bldg.
const LZ0=-12.2,LZ1=12.2, LW=-1.225, LXW=LW-9.4;           // left bldg east wall x=-1.225, FF balcony to x=-0.025
const RZ0=-10.4,RZ1=11.0, RS=10.820, RW=12.225, RE=21.2;     // right bldg FF slab edge 10.825, GF wall 12.225
const SZ0=-4.5,SZ1=-0.5,SX0=0,SX1=10.8,CX=[0.9,3.9,6.9,9.9],CZ=[SZ0+0.15,SZ1-0.15];
const PX0=0.4,PX1=10.4,PZ0=0.6,PZ1=6.6;                     // pool 10 x 6 (placeholder)
const DZ0=-5.0,DZ1=7.6;                                      // GF walkway / pool deck at +-0.000
// ground: natural (as photo: soil, debris, green growth)
box(-300,300,-0.50,-0.45,-300,300,GRASS,4);
box(-14,26,-0.449,-0.447,-40,-25.4,SOIL,4);                  // open yard / parking outside entry
// ---- GF walkway + pool deck at +-0.000 between the buildings ----
box(LW,RW,-0.45,0,DZ0,PZ0,TILE,5);box(LW,RW,-0.45,0,PZ1,DZ1,TILE,5);
box(LW,PX0,-0.45,0,PZ0,PZ1,TILE,5);box(PX1,RW,-0.45,0,PZ0,PZ1,TILE,5);
box(SX0,SX1,0,0.006,SZ0,SZ1,WALKT,5);
box(3.4,7.4,-0.45,-0.15,DZ0-0.3,DZ0,TILE,0);box(3.4,7.4,-0.45,-0.30,DZ0-0.6,DZ0-0.3,TILE,0);
// ---- swimming pool 10 x 6 ----
box(PX0,PX1,-1.60,-1.50,PZ0,PZ1,POOLT,5);
box(PX0,PX1,-1.5,0,PZ0,PZ0+0.2,POOLT,5);box(PX0,PX1,-1.5,0,PZ1-0.2,PZ1,POOLT,5);
box(PX0,PX0+0.2,-1.5,0,PZ0,PZ1,POOLT,5);box(PX1-0.2,PX1,-1.5,0,PZ0,PZ1,POOLT,5);
box(PX0-0.3,PX1+0.3,0,0.04,PZ0-0.3,PZ0,WHITE,0);box(PX0-0.3,PX1+0.3,0,0.04,PZ1,PZ1+0.3,WHITE,0);
box(PX0-0.3,PX0,0,0.04,PZ0,PZ1,WHITE,0);box(PX1,PX1+0.3,0,0.04,PZ0,PZ1,WHITE,0);
box(PX0+0.25,PX1-0.25,-0.12,-0.119,PZ0+0.25,PZ1-0.25,WATER,2,T);
for(let i=0;i<4;i++)box(PX0+0.2,PX0+1.6,-1.5,-1.5+(i+1)*0.3,PZ0+0.2+i*0.3,PZ0+0.2+(i+1)*0.3,POOLT,5);
// ---- LEFT building (existing, white G+1, as photo) ----
box(LXW-0.1,LW+0.1,-0.45,0,LZ0-0.1,LZ1+0.1,CONC,0);
box(LXW,LW,0,6.0,LZ0,LZ1,WHITE,0);
box(LXW-0.6,LW+0.6,6.0,6.15,LZ0-0.6,LZ1+0.6,CONC,0);                    // roof slab with projection
box(LW,-0.020,2.85,3.0,LZ0,LZ1,CONC,0);                                 // FF cantilever balcony 1.2 m (east)
box(LW,-0.020,2.78,2.85,LZ0,LZ1,[0.55,0.55,0.53],0);
for(let i=0;i<8;i++)rod([LW+0.4,6.15,LZ0+1+i*3.2],[LW+0.4,6.9,LZ0+1+i*3.2],0.01,[0.45,0.3,0.2],0,5);   // starter bars
function winE(y0,y1,z0,z1){box(LW,LW+0.03,y0,y1,z0,z1,DARKGL,9);box(LW,LW+0.06,y0-0.06,y0,z0-0.05,z1+0.05,[0.2,0.2,0.2],0);}
[LZ0+1.2,LZ0+6.2,1.6,5.6,9.4].forEach(z=>{winE(0.9,2.1,z,z+1.5);winE(3.9,5.1,z,z+1.5);});
// wide door openings (GF + FF) = link position
box(LW,LW+0.05,0,2.4,SZ0+0.25,SZ1-0.25,WOOD,6);box(LW,LW+0.05,3.0,5.4,SZ0+0.25,SZ1-0.25,[0.42,0.27,0.15],6);
for(let k=0;k<7;k++){const z=SZ0+0.25+k*0.58;box(LW+0.05,LW+0.09,3.0,5.4,z,z+0.06,[0.3,0.2,0.12],0);box(LW+0.05,LW+0.09,0,2.4,z,z+0.06,[0.3,0.2,0.12],0);}
[SZ0+0.1,SZ1-0.1].forEach(z=>box(LW,LW+0.12,0,6.0,z-0.15,z+0.15,[0.95,0.94,0.91],0));   // existing RCC columns flanking the wide door
// steel staircase on east balcony (south part) to roof
(function(){const x0=LW+0.15,x1=LW+1.05;for(let i=0;i<16;i++){const z=6.0+i*0.25,y=3.0+i*0.19;box(x0,x1,y,y+0.03,z,z+0.25,[0.45,0.25,0.15],9);}
 rod([x0,3.9,6.0],[x0,6.95,10.0],0.02,[0.45,0.25,0.15]);rod([x1,3.9,6.0],[x1,6.95,10.0],0.02,[0.45,0.25,0.15]);})();
// ---- RIGHT building (existing: grey GF, FF veranda with striped columns, bamboo-mat walls, blue hip roof) ----
box(RW-0.1,RE+0.1,-0.45,0,RZ0-0.1,RZ1+0.1,CONC,0);
box(RW,RE,0,2.85,RZ0,RZ1,[0.66,0.66,0.64],0);                           // unplastered GF
[[RZ0+1.0,2.0],[RZ0+6.0,2.4],[3.0,2.0],[7.0,2.8]].forEach(([z,w])=>box(RW-0.02,RW,0.6,2.3,z,z+w,[0.12,0.12,0.12],0)); // GF openings
box(RS,RE,2.85,3.0,RZ0,RZ1,CONC,0);                                     // FF slab, 1.4 m cantilever west
box(RW+0.4,RE,3.0,6.0,RZ0+0.4,RZ1-0.4,[0.62,0.50,0.32],7);              // bamboo-mat walls (set back)
[RZ0+0.2,SZ0-0.35-3.6,SZ0-0.35,SZ1,SZ1+3.6,SZ1+7.2,SZ1+10.8].forEach(z=>{
 box(RS+0.1,RS+0.45,3.0,6.1,z,z+0.35,[0.86,0.85,0.82],0);
 for(let k=0;k<20;k++)box(RS+0.095,RS+0.455,3.05+k*0.15,3.1+k*0.15,z-0.005,z+0.355,[0.55,0.55,0.55],0);});  // striped tiles
box(RS,RS+0.12,3.0,3.9,RZ0,SZ0-0.35,[0.66,0.66,0.64],0);box(RS,RS+0.12,3.0,3.9,SZ1+0.35,RZ1,[0.66,0.66,0.64],0); // parapet; entry gap between columns
(function(){const x0=RS-0.5,x1=RE+0.6,z0=RZ0-0.6,z1=RZ1+0.6,ye=6.15,yr=8.0,xc=(x0+x1)/2,hw=(x1-x0)/2;
 const a=[x0,ye,z0],b=[x1,ye,z0],c=[x1,ye,z1],d=[x0,ye,z1],r0=[xc,yr,z0+hw],r1=[xc,yr,z1-hw];
 quad(V,a,d,r1,r0,ROOF,9);quad(V,c,b,r0,r1,ROOF,9);tri(V,b,a,r0,ROOF,9);tri(V,d,c,r1,ROOF,9);
 box(x0,x1,6.0,6.15,z0,z1,[0.55,0.42,0.28],6);})();
cyl(RE-2.0,RZ0+1.6,6.15,8.6,0.5,[0.12,0.32,0.70],9,18);cyl(RE-3.1,RZ0+1.6,6.15,8.6,0.5,[0.12,0.32,0.70],9,18);
// ---------- NEW RCC LINK SLAB 10.8 x 4.0 m on 8 round columns ----------
CX.forEach(x=>CZ.forEach(z=>{
 cyl(x,z,0,0.05,0.29,GRAN,9,28);cyl(x,z,0.05,0.45,0.24,GRAN,9,28);cyl(x,z,0.45,0.47,0.205,WARM,3,28);
 cyl(x,z,0.45,2.55,0.15,WHITE,0,28);[1.85,1.97,2.09].forEach(y=>cyl(x,z,y,y+0.025,0.157,[0.30,0.30,0.30],0,28));
 cyl(x,z,2.33,2.36,0.205,WOOD,6,28);cyl(x,z,2.36,2.55,0.19,WHITE,0,28);}));
box(SX0,SX1,2.55,2.875,SZ0,SZ0+0.23,CONC,0);box(SX0,SX1,2.55,2.875,SZ1-0.23,SZ1,CONC,0);
CX.forEach(x=>box(x-0.115,x+0.115,2.55,2.875,SZ0,SZ1,CONC,0));
box(SX0,SX0+0.23,2.55,2.875,SZ0,SZ1,CONC,0);box(SX1-0.23,SX1,2.55,2.875,SZ0,SZ1,CONC,0);
box(SX0,SX1,2.875,2.98,SZ0,SZ1,[0.86,0.85,0.82],0);box(SX0,SX1,2.98,3.0,SZ0,SZ1,[0.56,0.38,0.24],6);
[2.4,5.4,8.4].forEach(x=>[SZ0+1.3,SZ1-1.3].forEach(z=>box(x-0.06,x+0.06,2.868,2.874,z-0.06,z+0.06,WARM,3)));
box(SX0,SX1,2.48,3.0,SZ0-0.04,SZ0,WOOD,6);box(SX0,SX1,2.48,3.0,SZ1,SZ1+0.04,WOOD,6);
box(SX0,SX1,2.46,2.48,SZ0-0.04,SZ0+0.05,WARM,3);box(SX0,SX1,2.46,2.48,SZ1-0.05,SZ1+0.04,WARM,3);
box(-0.020,0.08,3.0,3.006,SZ0,SZ1,STEEL,9);box(10.72,10.820,3.0,3.006,SZ0,SZ1,STEEL,9);
[SZ0+0.06,SZ1-0.06].forEach(z=>{box(SX0+0.03,SX1-0.03,3.0,3.12,z-0.05,z+0.05,[0.55,0.57,0.6],9);
 const n=12,w=(SX1-SX0-0.06)/n;for(let i=0;i<n;i++)box(SX0+0.03+i*w+0.01,SX0+0.03+(i+1)*w-0.01,3.10,4.05,z-0.006,z+0.006,GLASS,1,T);
 rod([SX0+0.05,4.08,z],[SX1-0.05,4.08,z],0.025,STEEL,9);});
// glass shed on 8 MS posts (100x100 SHS) over the RCC columns, mono-pitch 1:20 (high north), gutter + 2 downpipes south
(function(){const DG=[0.22,0.23,0.25],ZN=SZ0-0.3,ZS=SZ1+0.3,yAt=z=>5.90+(5.70-5.90)*(z-ZN)/(ZS-ZN);
 CX.forEach(x=>[SZ0+0.12,SZ1-0.12].forEach(z=>{box(x-0.05,x+0.05,3.0,yAt(z)-0.1,z-0.05,z+0.05,DG,9);box(x-0.125,x+0.125,3.0,3.012,z-0.125,z+0.125,DG,9);}));
 [SZ0+0.12,SZ1-0.12].forEach(z=>box(0.05,10.75,yAt(z)-0.1,yAt(z),z-0.05,z+0.05,DG,9));
 [0.08,...CX,10.72].forEach(x=>{const a=yAt(ZN),b=yAt(ZS);
  quad(V,[x-0.025,a,ZN],[x+0.025,a,ZN],[x+0.025,b,ZS],[x-0.025,b,ZS],DG,9);quad(V,[x-0.025,a-0.1,ZN],[x-0.025,a,ZN],[x-0.025,b,ZS],[x-0.025,b-0.1,ZS],DG,9);
  quad(V,[x+0.025,a-0.1,ZN],[x+0.025,b-0.1,ZS],[x+0.025,b,ZS],[x+0.025,a,ZN],DG,9);quad(V,[x-0.025,a-0.1,ZN],[x-0.025,b-0.1,ZS],[x+0.025,b-0.1,ZS],[x+0.025,a-0.1,ZN],DG,9);});
 [ZN+0.05,SZ0+1.0,SZ0+2.0,SZ0+3.0,ZS-0.05].forEach(z=>box(0.05,10.75,yAt(z),yAt(z)+0.05,z-0.025,z+0.025,DG,9));
 for(let i=0;i<6;i++){const x0=0.06+i*1.78,x1=x0+1.76;quad(T,[x0,yAt(ZN)+0.06,ZN],[x1,yAt(ZN)+0.06,ZN],[x1,yAt(ZS)+0.06,ZS],[x0,yAt(ZS)+0.06,ZS],[0.62,0.80,0.84],1);}
 box(0.05,10.75,yAt(ZS)-0.08,yAt(ZS)+0.04,ZS,ZS+0.15,STEEL,9);                                  // SS gutter
 const PV=[0.55,0.56,0.58];[0.9,9.9].forEach(x=>{rod([x,yAt(ZS)-0.08,ZS+0.075],[x,3.05,ZS+0.075],0.05,PV,9);     // 100 dia downpipes
  rod([x,3.05,ZS+0.075],[x,0.05,ZS+0.075],0.05,PV,9);box(x-0.08,x+0.08,2.94,3.0,SZ1-0.2,SZ1-0.04,[0.3,0.3,0.3],9);});})();   // slab floor trap
// ---------- surface drainage at GF: 300 wide RCC drains with MS gratings -> collector -> soak pit near gate ----------
(function(){const GR=[0.20,0.21,0.22];
 box(LW+0.05,LW+0.35,0,0.008,-12.8,DZ1,GR,9);box(RW-0.35,RW-0.05,0,0.008,-12.8,DZ1,GR,9);       // along both building faces
 box(PX0-0.6,PX1+0.6,0,0.008,PZ1+0.45,PZ1+0.65,GR,9);                                          // pool deck linear drain
 box(LW+0.05,RW-0.05,-0.40,-0.392,-13.1,-12.8,GR,9);                                           // collector along north ends
 box(RW-0.35,RW-0.05,-0.40,-0.392,-24.0,-13.1,GR,9);                                            // to soak pit
 cyl(RW-0.2,-24.8,-0.45,-0.38,0.7,[0.55,0.55,0.53],0,24);cyl(RW-0.2,-24.8,-0.38,-0.37,0.6,GR,9,24);})();
// ---------- GARDEN + CENTRAL ENTRY on the NORTH (slab side) ----------
const EX=5.4,GA=-5.6,GB=-12.8,GC=-24.0;   // GA: foot of steps, GB: north end of buildings, GC: gate line
box(LW,RW,-0.449,-0.40,GB,GA,[0.33,0.52,0.20],4);box(-11,22,-0.449,-0.40,GC,GB,[0.33,0.52,0.20],4);   // lawn
box(EX-1.0,EX+1.0,-0.40,-0.36,GC-1.0,GA,[0.70,0.64,0.55],5);                  // central entry path 2.0 m
[EX-1.6,EX+1.6].forEach(x=>{box(x-0.3,x+0.3,-0.45,1.8,GC-1.3,GC-0.7,STONE,7);box(x-0.35,x+0.35,1.8,1.9,GC-1.35,GC-0.65,CONC,0);box(x-0.12,x+0.12,1.9,2.2,GC-1.12,GC-0.88,WARM,3);});
for(let z=GC+0.6;z<GA-0.5;z+=1.0){[EX-1.35,EX+1.35].forEach(x=>blob(x,-0.15,z,0.42,[0.18,0.40,0.15]));}
const FL=[[0.92,0.30,0.55],[0.95,0.75,0.20],[0.85,0.20,0.25],[0.98,0.55,0.70],[0.95,0.95,0.92]];
seed=23;
for(let i=0;i<140;i++){const x=-10.5+rnd()*32,z=GC+0.6+rnd()*(GA-GC-1.2);if(Math.abs(x-EX)<2.2)continue;if(z>GB-0.3&&(x<LW+0.3||x>RW-0.3))continue;
 if(rnd()<0.55)blob(x,-0.25,z,0.26,FL[Math.floor(rnd()*FL.length)],10);}
function flowerTree(x,z,h,r,c){cyl(x,z,-0.45,h*0.5,0.1,[0.38,0.27,0.18],0,8);rod([x,h*0.4,z],[x+r*0.5,h*0.62,z-r*0.3],0.05,[0.38,0.27,0.18],0,6);rod([x,h*0.4,z],[x-r*0.45,h*0.75,z+r*0.3],0.05,[0.38,0.27,0.18],0,6);blob(x,h*0.7,z,r,c,10);blob(x+r*0.5,h*0.62,z-r*0.3,r*0.72,c,10);blob(x-r*0.45,h*0.8,z+r*0.3,r*0.7,c,10);blob(x+0.2,h*0.86,z+0.1,r*0.6,c,10);}
[[EX-3.2,-8.6,4.0,1.3,FL[0]],[EX+3.2,-8.6,4.0,1.3,FL[1]],[EX-3.2,-12.6,4.5,1.5,FL[2]],[EX+3.2,-12.6,4.5,1.5,FL[3]],
 [EX-3.2,-16.6,4.3,1.4,FL[4]],[EX+3.2,-16.6,4.3,1.4,FL[2]],[EX-3.2,-20.8,4.0,1.3,FL[1]],[EX+3.2,-20.8,4.0,1.3,FL[0]],
 [-6,-16.0,4.6,1.6,FL[3]],[-8,-21,5,1.7,FL[2]],[17,-16.0,4.6,1.6,FL[0]],[19,-21,5,1.7,FL[1]]].forEach(t=>flowerTree(...t));
// ---------- existing surroundings (as photo): trees and bush ----------
seed=11;
[[-16,-14,8,2.8],[-17,2,9,3],[26,-12,9,3],[27,4,8,2.8],[4,-38,10,3.5],[18,-36,9,3.2],[-16,-30,8,3],[32,-28,10,3.4],[-22,26,10,3.5],[36,30,9,3],[6,22,9,3.2],[-6,18,8,3]].forEach(t=>tree(t[0],t[1],t[2],t[3]));
for(let i=0;i<30;i++)shrub(-14+rnd()*6,-10+rnd()*30,0.5+rnd()*0.6);
for(let i=0;i<30;i++)shrub(23+rnd()*6,-10+rnd()*30,0.5+rnd()*0.6);
(function(){const N=96;for(let i=0;i<N;i++){const a0=i/N*Math.PI*2,a1=(i+1)/N*Math.PI*2;
 const h=a=>55+38*Math.sin(a*3+1)+22*Math.sin(a*7+2)+12*Math.sin(a*13);const R=260,R2=200;
 const p=(a,r,y)=>[5+r*Math.cos(a),y,r*Math.sin(a)];
 const c=[0.22,0.33,0.24],nn=a=>[-Math.cos(a)*0.35,0.94,-Math.sin(a)*0.35];
 const q=[[p(a0,R2,-0.5),nn(a0)],[p(a1,R2,-0.5),nn(a1)],[p(a1,R,h(a1)),nn(a1)],[p(a0,R,h(a0)),nn(a0)]];
 [0,1,2,0,2,3].forEach(k=>push(V,q[k][0],q[k][1],c,4));}})();
window.CHIPUTA_GEOM={opaque:new Float32Array(V),trans:new Float32Array(T)};
})();

// ===================== renderer =====================
window.ChiputaRenderer=function(canvas){
const gl=canvas.getContext('webgl2',{antialias:true,preserveDrawingBuffer:true});
if(!gl)throw new Error('WebGL2 not available');
const VS=`#version 300 es
layout(location=0)in vec3 p;layout(location=1)in vec3 n;layout(location=2)in vec3 c;layout(location=3)in float m;
uniform mat4 uVP,uL;out vec3 vW,vN,vC;out float vM;out vec4 vLS;
void main(){vW=p;vN=n;vC=c;vM=m;vLS=uL*vec4(p,1.);gl_Position=uVP*vec4(p,1.);}`;
const FS=`#version 300 es
precision highp float;precision highp sampler2DShadow;
in vec3 vW,vN,vC;in float vM;in vec4 vLS;out vec4 o;
uniform vec3 uSun,uEye,uSky,uHor;uniform float uTime;uniform sampler2DShadow uSh;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float nz(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+1.),f.x),f.y);}
vec3 aces(vec3 x){return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.);}
void main(){int M=int(vM+.5);vec3 N=normalize(vN);vec3 col=vC;float al=1.,sp=.08,sh=10.;
 if(M==3){o=vec4(pow(aces(col*2.2),vec3(1./2.2)),1.);return;}
 if(M==4){float k=nz(vW.xz*.7)*.5+nz(vW.xz*3.1)*.3+nz(vW.xz*14.)*.2;col*=.72+.55*k;}
 if(M==5){vec2 g=abs(fract(vW.xz/.6+.5)-.5);vec2 g2=abs(fract(vW.zy/.3+.5)-.5);
   float l=(abs(N.y)>.5)?min(g.x,g.y):min(abs(fract((N.x!=0.?vW.z:vW.x)/.3+.5)-.5),g2.y);col*=mix(.82,1.,smoothstep(.0,.03,l));col*=.95+.1*h(floor(vW.xz/.6));}
 if(M==6){float s=(abs(N.y)>.5)?vW.x*5.:vW.y*14.;col*=.85+.2*nz(vec2(s,vW.z*.4+vW.x*.1)*vec2(1.,3.));col*=mix(.8,1.,smoothstep(0.,.04,abs(fract(s)-.5)));sp=.15;}
 if(M==7){float r=abs(fract(vW.y/.18)-.5);col*=mix(.75,1.,smoothstep(0.,.08,r))*(.88+.2*h(floor(vec2(vW.x+vW.z,vW.y)/vec2(.45,.18))));}
 if(M==9){sp=.6;sh=60.;}
 if(M==8||M==10){vec3 q=vW*7.;float n=nz(q.xz+q.y*1.7)*.6+nz(q.zy*1.3+q.x)*.4;
   vec3 g=(M==8)?col:vec3(.20,.36,.13);g*=.45+.85*n;
   if(M==10){float fl=smoothstep(.58,.72,nz(vW.xz*26.+vW.y*19.)*.6+nz(vW.zy*31.+vW.x*17.)*.4);g=mix(g,col*(.85+.3*n),fl*.85);}
   col=g;sp=.05;}
 if(M==2){vec2 q=vW.xz;float w=sin(q.x*3.1+uTime*1.3)+sin(q.y*2.3-uTime*1.1)+.6*sin((q.x+q.y)*5.+uTime*2.);
   N=normalize(vec3(.06*cos(q.x*3.1+uTime*1.3)+.04*cos((q.x+q.y)*5.+uTime*2.),1.,.05*cos(q.y*2.3-uTime*1.1)));
   col=mix(col,vec3(.3,.8,.9),.25+.1*w);sp=1.4;sh=120.;al=.82;}
 if(M==1){sp=1.;sh=90.;al=.10;}
 vec3 L=normalize(uSun),Vv=normalize(uEye-vW),H=normalize(L+Vv);
 vec3 ls=vLS.xyz/vLS.w*.5+.5;float s=0.;
 if(ls.x>0.&&ls.x<1.&&ls.y>0.&&ls.y<1.&&ls.z<1.){for(int i=-1;i<=1;i++)for(int j=-1;j<=1;j++)s+=texture(uSh,vec3(ls.xy+vec2(i,j)/2048.,ls.z-.0015));s/=9.;}else s=1.;
 float d=max(dot(N,L),0.)*s;if(M==8||M==10)d+=.35*max(dot(-N,L),0.)*s+.15;
 vec3 amb=mix(vec3(.26,.24,.20),uSky*.9,N.y*.5+.5)*.42;
 vec3 sun=vec3(1.30,1.12,.90);
 vec3 c2=col*(amb+sun*d)+sun*sp*pow(max(dot(N,H),0.),sh)*s;
 if(M==1||M==2){float f=pow(1.-max(dot(N,Vv),0.),4.);c2+=uSky*f*.25;al=min(1.,al+f*.3);}
 float dist=length(uEye-vW);float fg=1.-exp(-dist*.0022);c2=mix(c2,uHor,fg*.7);c2*=.9;
 o=vec4(pow(aces(c2),vec3(1./2.2)),al);}`;
const SVS=`#version 300 es
layout(location=0)in vec3 p;uniform mat4 uL;void main(){gl_Position=uL*vec4(p,1.);}`;
const SFS=`#version 300 es
precision mediump float;void main(){}`;
const KVS=`#version 300 es
out vec2 uv;void main(){vec2 v=vec2((gl_VertexID<<1)&2,gl_VertexID&2);uv=v;gl_Position=vec4(v*2.-1.,1.,1.);}`;
const KFS=`#version 300 es
precision highp float;in vec2 uv;out vec4 o;uniform mat4 uIVP;uniform vec3 uSun,uSky,uHor;
vec3 aces(vec3 x){return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.);}
void main(){vec4 a=uIVP*vec4(uv*2.-1.,1.,1.),b=uIVP*vec4(uv*2.-1.,-1.,1.);vec3 d=normalize(a.xyz/a.w-b.xyz/b.w);
 float t=clamp(d.y,0.,1.);vec3 c=mix(uHor,uSky,pow(t,.55));float s=max(dot(d,normalize(uSun)),0.);c+=vec3(1.,.8,.55)*(pow(s,300.)*6.+pow(s,8.)*.35);
 o=vec4(pow(aces(c),vec3(1./2.2)),1.);}`;
function prog(vs,fs){const p=gl.createProgram();[[gl.VERTEX_SHADER,vs],[gl.FRAGMENT_SHADER,fs]].forEach(([t,s])=>{const sh=gl.createShader(t);gl.shaderSource(sh,s);gl.compileShader(sh);
 if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(sh));gl.attachShader(p,sh);});gl.linkProgram(p);
 if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));return p;}
const P=prog(VS,FS),PS=prog(SVS,SFS),PK=prog(KVS,KFS);
function vao(data){const v=gl.createVertexArray();gl.bindVertexArray(v);const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);
 [[0,3,0],[1,3,12],[2,3,24],[3,1,36]].forEach(([i,n,o])=>{gl.enableVertexAttribArray(i);gl.vertexAttribPointer(i,n,gl.FLOAT,false,40,o);});gl.bindVertexArray(null);return {v,n:data.length/10};}
const G=window.CHIPUTA_GEOM,VO=vao(G.opaque),VT=vao(G.trans),KV=gl.createVertexArray();
const SH=2048,shTex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,shTex);
gl.texStorage2D(gl.TEXTURE_2D,1,gl.DEPTH_COMPONENT24,SH,SH);
gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_COMPARE_MODE,gl.COMPARE_REF_TO_TEXTURE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_COMPARE_FUNC,gl.LEQUAL);
gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
const fb=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,fb);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.TEXTURE_2D,shTex,0);gl.bindFramebuffer(gl.FRAMEBUFFER,null);
// math
const M4={mul(a,b){const o=new Float32Array(16);for(let i=0;i<4;i++)for(let j=0;j<4;j++){let s=0;for(let k=0;k<4;k++)s+=a[k*4+j]*b[i*4+k];o[i*4+j]=s;}return o;},
 persp(f,a,n,fa){const t=1/Math.tan(f/2),o=new Float32Array(16);o[0]=t/a;o[5]=t;o[10]=(fa+n)/(n-fa);o[11]=-1;o[14]=2*fa*n/(n-fa);return o;},
 ortho(l,r,b,t,n,f){const o=new Float32Array(16);o[0]=2/(r-l);o[5]=2/(t-b);o[10]=-2/(f-n);o[12]=-(r+l)/(r-l);o[13]=-(t+b)/(t-b);o[14]=-(f+n)/(f-n);o[15]=1;return o;},
 look(e,c,u){const z=norm(sub(e,c)),x=norm(cross(u,z)),y=cross(z,x);return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,e),-dot(y,e),-dot(z,e),1]);},
 inv(m){const a=m,o=new Float32Array(16);const b00=a[0]*a[5]-a[1]*a[4],b01=a[0]*a[6]-a[2]*a[4],b02=a[0]*a[7]-a[3]*a[4],b03=a[1]*a[6]-a[2]*a[5],b04=a[1]*a[7]-a[3]*a[5],b05=a[2]*a[7]-a[3]*a[6],
 b06=a[8]*a[13]-a[9]*a[12],b07=a[8]*a[14]-a[10]*a[12],b08=a[8]*a[15]-a[11]*a[12],b09=a[9]*a[14]-a[10]*a[13],b10=a[9]*a[15]-a[11]*a[13],b11=a[10]*a[15]-a[11]*a[14];
 const d=1/(b00*b11-b01*b10+b02*b09+b03*b08-b04*b07+b05*b06);
 o[0]=(a[5]*b11-a[6]*b10+a[7]*b09)*d;o[1]=(a[2]*b10-a[1]*b11-a[3]*b09)*d;o[2]=(a[13]*b05-a[14]*b04+a[15]*b03)*d;o[3]=(a[10]*b04-a[9]*b05-a[11]*b03)*d;
 o[4]=(a[6]*b08-a[4]*b11-a[7]*b07)*d;o[5]=(a[0]*b11-a[2]*b08+a[3]*b07)*d;o[6]=(a[14]*b02-a[12]*b05-a[15]*b01)*d;o[7]=(a[8]*b05-a[10]*b02+a[11]*b01)*d;
 o[8]=(a[4]*b10-a[5]*b08+a[7]*b06)*d;o[9]=(a[1]*b08-a[0]*b10-a[3]*b06)*d;o[10]=(a[12]*b04-a[13]*b02+a[15]*b00)*d;o[11]=(a[9]*b02-a[8]*b04-a[11]*b00)*d;
 o[12]=(a[5]*b07-a[4]*b09-a[6]*b06)*d;o[13]=(a[0]*b09-a[1]*b07+a[2]*b06)*d;o[14]=(a[13]*b01-a[12]*b03-a[14]*b00)*d;o[15]=(a[8]*b03-a[9]*b01+a[10]*b00)*d;return o;}};
function sub(a,b){return[a[0]-b[0],a[1]-b[1],a[2]-b[2]];}function dot(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2];}
function cross(a,b){return[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];}function norm(a){const l=Math.hypot(...a);return a.map(x=>x/l);}
const sunDir=norm([-0.72,0.62,0.50]),sky=[0.26,0.48,0.86],hor=[0.78,0.83,0.88];
const LC=[5,0,2],LE=[LC[0]+sunDir[0]*80,LC[1]+sunDir[1]*80,LC[2]+sunDir[2]*80];
const LVP=M4.mul(M4.ortho(-42,42,-42,42,1,180),M4.look(LE,LC,[0,1,0]));
function U(p,n){return gl.getUniformLocation(p,n);}
let shadowDone=false;
function render(eye,target,time,fov){
 const w=canvas.width,h=canvas.height;
 if(!shadowDone){gl.bindFramebuffer(gl.FRAMEBUFFER,fb);gl.viewport(0,0,SH,SH);gl.clear(gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);
  gl.useProgram(PS);gl.uniformMatrix4fv(U(PS,'uL'),false,LVP);gl.enable(gl.POLYGON_OFFSET_FILL);gl.polygonOffset(2,4);
  gl.bindVertexArray(VO.v);gl.drawArrays(gl.TRIANGLES,0,VO.n);gl.disable(gl.POLYGON_OFFSET_FILL);gl.bindFramebuffer(gl.FRAMEBUFFER,null);shadowDone=true;}
 gl.viewport(0,0,w,h);gl.clearColor(0,0,0,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
 const VP=M4.mul(M4.persp((fov||55)*Math.PI/180,w/h,0.1,900),M4.look(eye,target,[0,1,0]));
 gl.disable(gl.DEPTH_TEST);gl.useProgram(PK);gl.uniformMatrix4fv(U(PK,'uIVP'),false,M4.inv(VP));
 gl.uniform3fv(U(PK,'uSun'),sunDir);gl.uniform3fv(U(PK,'uSky'),sky);gl.uniform3fv(U(PK,'uHor'),hor);gl.bindVertexArray(KV);gl.drawArrays(gl.TRIANGLES,0,3);
 gl.enable(gl.DEPTH_TEST);gl.useProgram(P);gl.uniformMatrix4fv(U(P,'uVP'),false,VP);gl.uniformMatrix4fv(U(P,'uL'),false,LVP);
 gl.uniform3fv(U(P,'uSun'),sunDir);gl.uniform3fv(U(P,'uEye'),eye);gl.uniform3fv(U(P,'uSky'),sky);gl.uniform3fv(U(P,'uHor'),hor);gl.uniform1f(U(P,'uTime'),time);
 gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,shTex);gl.uniform1i(U(P,'uSh'),0);
 gl.disable(gl.BLEND);gl.depthMask(true);gl.bindVertexArray(VO.v);gl.drawArrays(gl.TRIANGLES,0,VO.n);
 gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);gl.bindVertexArray(VT.v);gl.drawArrays(gl.TRIANGLES,0,VT.n);gl.depthMask(true);gl.disable(gl.BLEND);}
return {render,gl};
};

// ===================== walkthrough path =====================
window.CHIPUTA_TOUR=[ // [t, eye, target, caption]
 [0, [34,26,-42],[5,2,-4],'Proposed link slab, glass canopy, garden & pool — Chiputa'],
 [6, [5.4,1.7,-30],[5.4,1.8,-8],'Central entry from the north — garden with flowering trees'],
 [11,[5.4,1.65,-17],[5.4,2.0,-2.5],'Entry path leads to the link slab'],
 [16,[5.4,1.6,-7],[5.4,1.5,2],'Ground-floor walkway under the link, clear ≈ 2.55 m'],
 [21,[5.4,1.6,-2.8],[5.4,0.6,6],'Pool deck with 300 mm grated drains along both buildings'],
 [25,[5.6,1.6,-0.1],[5.4,0.0,6],'Swimming pool 10.0 × 6.0 m (design to follow)'],
 [29,[5.4,6.2,13],[5.4,3.6,-2.5],'Glass shed on 8 MS posts over the RCC columns + glass railing'],
 [34,[0.7,4.6,-2.5],[10.8,4.3,-2.5],'Walk across the link at first floor, FFL +3.00'],
 [39,[6.5,4.6,-2.4],[6.0,0.5,8],'View to the pool from the link'],
 [43,[6.0,4.6,-2.6],[12.5,4.2,-2.6],'Entry gap between the existing veranda columns'],
 [47,[4.6,4.7,-2.6],[4.8,0.8,-20],'View back over the entry garden'],
 [52,[-20,22,-38],[5,2,-4],'M/s LEE ENTERPRISE — Design & Survey']];
window.chiputaCam=function(t){const K=window.CHIPUTA_TOUR;t=Math.max(0,Math.min(K[K.length-1][0]-1e-6,t));
 let i=0;while(K[i+1][0]<=t)i++;const k0=K[Math.max(0,i-1)],k1=K[i],k2=K[i+1],k3=K[Math.min(K.length-1,i+2)];
 let u=(t-k1[0])/(k2[0]-k1[0]);u=u*u*(3-2*u)*0.5+u*0.5;
 const cr=(a,b,c,d)=>a.map((_,j)=>0.5*((2*b[j])+(-a[j]+c[j])*u+(2*a[j]-5*b[j]+4*c[j]-d[j])*u*u+(-a[j]+3*b[j]-3*c[j]+d[j])*u*u*u));
 return {eye:cr(k0[1],k1[1],k2[1],k3[1]),target:cr(k0[2],k1[2],k2[2],k3[2]),cap:(u<0.85?k1[3]:k2[3])};};
