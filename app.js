(()=>{'use strict';
const $=id=>document.getElementById(id),canvas=$('preview'),ctx=canvas.getContext('2d'),crop=$('cropcanvas'),cc=crop.getContext('2d');
const logo=new Image();logo.src='lukebox-logo.png';logo.onload=render;
let img=null,original=null,px=.5,py=.85,lx=.16,ly=.16,drag=null,calcPrice=null,sourceURL=null;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),num=id=>Math.max(0,Number($(id).value)||0),money=n=>'GYD$'+n.toLocaleString('en-US',{maximumFractionDigits:2});
function calculate(){
 const product=num('usd')*num('rate'),freight=num('shipping')*num('weight'),allow=freight*num('allowance')/100,base=product+freight+allow+num('fee'),profit=Math.max(base*num('markup')/100,num('minprofit'));
 $('converted').value=money(product);
 calcPrice=$('usd').value.trim()?Math.ceil((base+profit-1e-9)/100)*100:null;
 $('selling').textContent=calcPrice===null?'—':money(calcPrice);
 $('breakdown').textContent=calcPrice===null?'Enter a USD product price.':`Product ${money(product)} · Shipping ${money(freight)} · Allowance ${money(allow)} · Fee ${money(num('fee'))} · Profit ${money(profit)}`;
 if(!$('manual').checked)$('price').value=calcPrice===null?'':String(calcPrice);render();
}
['rate','usd','shipping','weight','allowance','markup','minprofit','fee'].forEach(id=>$(id).addEventListener('input',calculate));
$('manual').addEventListener('change',()=>{$('price').readOnly=!$('manual').checked;if(!$('manual').checked)$('price').value=calcPrice===null?'':String(calcPrice);render()});
['price','style','size','color','logosize','showlogo'].forEach(id=>$(id).addEventListener('input',render));
function priceText(){let s=$('price').value.trim();if(!s)return 'GYD$ —';let n=Number(s.replace(/[^\d.]/g,''));return Number.isFinite(n)&&/\d/.test(s)?money(n):s}
function font(){return Math.max(14,Math.round(Math.min(canvas.width,canvas.height)*num('size')/100))}
function tag(){const f=font();ctx.font=`900 ${f}px system-ui,Arial`;return {f,text:priceText(),w:ctx.measureText(priceText()).width+f*.9,h:f*1.7,x:px*canvas.width,y:py*canvas.height}}
function logoBox(){const w=canvas.width*num('logosize')/100,h=w*(logo.naturalHeight||1)/(logo.naturalWidth||1);return{x:lx*canvas.width,y:ly*canvas.height,w,h}}
function render(){
 ctx.clearRect(0,0,canvas.width,canvas.height);
 if(img)ctx.drawImage(img,0,0,canvas.width,canvas.height);
 else{ctx.fillStyle='#163246';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#c7e3ef';ctx.textAlign='center';ctx.font=`600 ${Math.round(canvas.width/26)}px system-ui`;ctx.fillText('Upload a product screenshot',canvas.width/2,canvas.height/2)}
 if($('showlogo').checked&&logo.complete&&logo.naturalWidth){let b=logoBox();ctx.drawImage(logo,b.x-b.w/2,b.y-b.h/2,b.w,b.h)}
 const g=tag(),style=$('style').value;ctx.save();ctx.translate(g.x,g.y);
 if(style!=='plain'){ctx.fillStyle=style==='pill'?'#60e3ed':style==='dark'?'#0a1c2b':'#fff';ctx.shadowColor='#0007';ctx.shadowBlur=g.f*.2;ctx.beginPath();ctx.roundRect(-g.w/2,-g.h/2,g.w,g.h,g.f*.35);ctx.fill();ctx.shadowColor='transparent'}
 ctx.font=`900 ${g.f}px system-ui,Arial`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=style==='pill'||style==='white'?'#0a2030':style==='dark'?'#fff':$('color').value;
 if(style==='plain'){ctx.shadowColor='#000';ctx.shadowBlur=g.f*.17}ctx.fillText(g.text,0,0);ctx.restore();
}
function loadFile(file){if(!file)return;if(sourceURL)URL.revokeObjectURL(sourceURL);sourceURL=URL.createObjectURL(file);const im=new Image();im.onload=()=>{original=im;setImage(im);$('status').textContent='Screenshot loaded. Crop or drag the price tag.'};im.onerror=()=>alert('Cannot open this image. Try JPG or PNG.');im.src=sourceURL}
function setImage(im){img=im;canvas.width=im.naturalWidth;canvas.height=im.naturalHeight;px=.5;py=.85;lx=.16;ly=.16;render()}
$('photo').addEventListener('change',e=>loadFile(e.target.files[0]));
$('resetimage').onclick=()=>{if(original)setImage(original)};
function point(e,el){const r=el.getBoundingClientRect();return{x:(e.clientX-r.left)*el.width/r.width,y:(e.clientY-r.top)*el.height/r.height}}
canvas.addEventListener('pointerdown',e=>{if(!img)return;const p=point(e,canvas),g=tag(),l=logoBox();if(Math.abs(p.x-g.x)<=g.w/2+g.f*.4&&Math.abs(p.y-g.y)<=g.h/2+g.f*.4)drag='tag';else if($('showlogo').checked&&Math.abs(p.x-l.x)<=l.w/2&&Math.abs(p.y-l.y)<=l.h/2)drag='logo';else return;canvas.setPointerCapture(e.pointerId);e.preventDefault()});
canvas.addEventListener('pointermove',e=>{if(!drag)return;const p=point(e,canvas),x=clamp(p.x/canvas.width,0,1),y=clamp(p.y/canvas.height,0,1);if(drag==='tag'){px=x;py=y}else{lx=x;ly=y}render();e.preventDefault()});
['pointerup','pointercancel','lostpointercapture'].forEach(ev=>canvas.addEventListener(ev,()=>drag=null));
$('center').onclick=()=>{px=.5;py=.5;render()};$('resetlogo').onclick=()=>{lx=.16;ly=.16;render()};
$('save').onclick=()=>{if(!img){alert('Upload an image first.');return}render();canvas.toBlob(blob=>{if(!blob){alert('PNG export failed.');return}const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='LukeBox_Price_Tag.png';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),20000);$('status').textContent='PNG export started.'},'image/png')};
// Crop editor v2: coordinates are always in source pixels; visible handle hit zones use CSS pixels.
let rect=null,operation=null,start=null,initial=null,activePointer=null;
const minSize=8;
function aspect(){return $('cropaspect').value==='4:5'?.8:$('cropaspect').value==='1:1'?1:null}
function fitCrop(){if(!img)return;const maxW=Math.min(window.innerWidth-48,780),maxH=Math.max(150,window.innerHeight*.53),scale=Math.min(maxW/crop.width,maxH/crop.height,1);crop.style.width=Math.max(1,Math.round(crop.width*scale))+'px';crop.style.height=Math.max(1,Math.round(crop.height*scale))+'px'}
function resetRect(){if(!img)return;const a=aspect(),W=crop.width,H=crop.height;let w=W*.8,h=H*.8;if(a){w=Math.min(W*.85,H*.85*a);h=w/a}rect={x:(W-w)/2,y:(H-h)/2,w,h};drawCrop()}
function drawCrop(){if(!img||!rect)return;cc.clearRect(0,0,crop.width,crop.height);cc.drawImage(img,0,0);const r=rect;
 cc.fillStyle='rgba(0,0,0,.60)';cc.fillRect(0,0,crop.width,r.y);cc.fillRect(0,r.y,r.x,r.h);cc.fillRect(r.x+r.w,r.y,crop.width-r.x-r.w,r.h);cc.fillRect(0,r.y+r.h,crop.width,crop.height-r.y-r.h);
 const display=crop.getBoundingClientRect(),scale=crop.width/Math.max(display.width,1),lw=Math.max(1.5*scale,1),handle=11*scale;
 cc.lineWidth=lw;cc.strokeStyle='#5ff4ec';cc.strokeRect(r.x,r.y,r.w,r.h);cc.fillStyle='#5ff4ec';
 for(const [x,y] of [[r.x,r.y],[r.x+r.w,r.y],[r.x,r.y+r.h],[r.x+r.w,r.y+r.h]]){cc.beginPath();cc.arc(x,y,handle/2,0,Math.PI*2);cc.fill()}
 cc.strokeStyle='#ffffff88';cc.lineWidth=lw/2;for(let i=1;i<=2;i++){let x=r.x+r.w*i/3,y=r.y+r.h*i/3;cc.beginPath();cc.moveTo(x,r.y);cc.lineTo(x,r.y+r.h);cc.moveTo(r.x,y);cc.lineTo(r.x+r.w,y);cc.stroke()}
}
$('cropopen').onclick=()=>{if(!img){alert('Upload a product image first.');return}crop.width=img.naturalWidth;crop.height=img.naturalHeight;$('cropoverlay').classList.add('open');fitCrop();resetRect()};
$('cropcancel').onclick=()=>{$('cropoverlay').classList.remove('open');operation=null};
$('cropreset').onclick=resetRect;$('cropaspect').onchange=resetRect;
window.addEventListener('resize',()=>{if($('cropoverlay').classList.contains('open')){fitCrop();drawCrop()}});
function inside(p,r){return p.x>=r.x&&p.x<=r.x+r.w&&p.y>=r.y&&p.y<=r.y+r.h}
function hit(p){const r=rect,display=crop.getBoundingClientRect(),t=23*crop.width/Math.max(display.width,1);for(const [key,x,y] of [['nw',r.x,r.y],['ne',r.x+r.w,r.y],['sw',r.x,r.y+r.h],['se',r.x+r.w,r.y+r.h]])if(Math.hypot(p.x-x,p.y-y)<t)return key;return inside(p,r)?'move':'new'}
function boundedRect(anchor,corner,a){
 const sx=corner.x>=anchor.x?1:-1,sy=corner.y>=anchor.y?1:-1;
 let w=Math.abs(corner.x-anchor.x),h=Math.abs(corner.y-anchor.y);
 const limW=sx>0?crop.width-anchor.x:anchor.x,limH=sy>0?crop.height-anchor.y:anchor.y;
 if(a){w=Math.min(w,limW);h=Math.min(h,limH);if(w/h>a)w=h*a;else h=w/a;
  if(w<minSize||h<minSize){w=Math.min(limW,limH*a,Math.max(minSize,minSize*a));h=w/a}}
 else{w=Math.min(limW,Math.max(minSize,w));h=Math.min(limH,Math.max(minSize,h))}
 return{x:sx>0?anchor.x:anchor.x-w,y:sy>0?anchor.y:anchor.y-h,w,h};
}
crop.addEventListener('pointerdown',e=>{if(!rect||activePointer!==null)return;start=point(e,crop);initial={...rect};operation=hit(start);activePointer=e.pointerId;crop.setPointerCapture(e.pointerId);e.preventDefault()});
crop.addEventListener('pointermove',e=>{if(!operation||e.pointerId!==activePointer)return;const p=point(e,crop),dx=p.x-start.x,dy=p.y-start.y,a=aspect(),W=crop.width,H=crop.height;
 if(operation==='move'){rect={...initial,x:clamp(initial.x+dx,0,W-initial.w),y:clamp(initial.y+dy,0,H-initial.h)}}
 else if(operation==='new'){rect=boundedRect(start,p,a)}
 else{
  const anchor={x:operation.includes('w')?initial.x+initial.w:initial.x,y:operation.includes('n')?initial.y+initial.h:initial.y};
  const movingCorner={x:operation.includes('w')?initial.x+dx:initial.x+initial.w+dx,y:operation.includes('n')?initial.y+dy:initial.y+initial.h+dy};
  rect=boundedRect(anchor,movingCorner,a);
 }drawCrop();e.preventDefault()});
function stop(e){if(activePointer===e.pointerId){operation=null;activePointer=null}}
['pointerup','pointercancel','lostpointercapture'].forEach(ev=>crop.addEventListener(ev,stop));
$('cropapply').onclick=()=>{if(!img||!rect||rect.w<3||rect.h<3){alert('Select a crop area first.');return}const r=rect,out=document.createElement('canvas');out.width=Math.max(1,Math.round(r.w));out.height=Math.max(1,Math.round(r.h));out.getContext('2d').drawImage(img,r.x,r.y,r.w,r.h,0,0,out.width,out.height);const im=new Image();im.onload=()=>{setImage(im);$('cropoverlay').classList.remove('open');$('status').textContent='Crop applied. Original upload is available with Restore original.'};im.src=out.toDataURL('image/png')};
calculate();render();
if('serviceWorker' in navigator&&location.protocol.startsWith('http'))window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
})();