// Quietloom: weaves a deterministic pattern from a string.
// FNV-1a hash seeds a mulberry32 PRNG (both public-domain algorithms).
function hash(s){var h=2166136261;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function rng(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
var WORDS=["rain","lantern","moss","harbor","thistle","ember","salt","orchard","fog","kite","quarry","willow"];
// Each structure decides, per crossing, whether the warp thread lies over the weft.
var STRUCTURES=[
  {name:"twill",make:function(p,s){return function(i,j){return((i+j*s)%p)<p/2}}},
  {name:"plain weave",make:function(){return function(i,j){return(i+j)%2===0}}},
  {name:"basket weave",make:function(p){var b=2+p%2;return function(i,j){return(Math.floor(i/b)+Math.floor(j/b))%2===0}}},
  {name:"diamond twill",make:function(p){var m=p+2;return function(i,j){var a=i%(2*m),b=j%(2*m);a=a<m?a:2*m-1-a;b=b<m?b:2*m-1-b;return(a+b)%3===0}}},
  {name:"satin",make:function(p){var k=p%2?2:3;return function(i,j){return(i+k*j)%5!==0}}},
  {name:"herringbone",make:function(p){var m=3+p;return function(i,j){var a=i%(2*m);a=a<m?a:2*m-1-a;return(a+j)%4<2}}}
];
var back=false;
function weave(word){
  var cv=document.getElementById("c"),x=cv.getContext("2d"),N=cv.width,R=rng(hash(word.toLowerCase().trim()));
  var cells=24+Math.floor(R()*24),cs=N/cells,hue=Math.floor(R()*360);
  var pal=[0,1,2,3].map(function(){return"hsl("+((hue+Math.floor(R()*100)-50+360)%360)+","+(35+Math.floor(R()*40))+"%,"+(25+Math.floor(R()*50))+"%)"});
  var warp=[],weft=[],i,j;
  for(i=0;i<cells;i++){warp.push(pal[Math.floor(R()*4)]);weft.push(pal[Math.floor(R()*4)])}
  var period=2+Math.floor(R()*4),shift=1+Math.floor(R()*3),mir=R()<.5;
  var S=rng(hash(word.toLowerCase().trim()+"|structure")),structure=STRUCTURES[Math.floor(S()*STRUCTURES.length)];
  structure.f=structure.make(period,shift,cells);
  x.fillStyle="#222";x.fillRect(0,0,N,N);
  function row(j){for(var i=0;i<cells;i++){
    var ii=mir&&i>=cells/2?cells-1-i:i;
    var over=structure.f(ii,j)!==back;
    x.fillStyle=over?warp[ii]:weft[j];
    var g=over?x.createLinearGradient(i*cs,0,(i+1)*cs,0):x.createLinearGradient(0,j*cs,0,(j+1)*cs);
    g.addColorStop(0,"rgba(0,0,0,.35)");g.addColorStop(.5,"rgba(255,255,255,.12)");g.addColorStop(1,"rgba(0,0,0,.35)");
    x.fillRect(i*cs+1,j*cs+1,cs-2,cs-2);x.fillStyle=g;x.fillRect(i*cs+1,j*cs+1,cs-2,cs-2);
  }}
  // Weave row by row unless the visitor prefers reduced motion; a newer cloth cancels an older one.
  var token=weave.t=(weave.t||0)+1,calm=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
  if(calm)for(j=0;j<cells;j++)row(j);
  else{j=0;(function step(){if(weave.t!==token)return;for(var k=0;k<2&&j<cells;k++)row(j++);if(j<cells)requestAnimationFrame(step)})()}
  var sw=document.getElementById("sw");sw.textContent="";
  pal.forEach(function(c){var d=document.createElement("span");d.style.background=c;d.title=c;sw.appendChild(d)});
  document.getElementById("cap").textContent="“"+word+"”: "+cells+" threads, "+structure.name+(mir?", mirrored":"")+(back?", back side":"")+".";
  cv.setAttribute("aria-label","Woven cloth for “"+word+"”: "+cells+" by "+cells+" threads in "+structure.name+(mir?", mirrored left to right":"")+(back?", seen from the back":"")+", in a palette of four related colors.");
}
var inp=document.getElementById("w");
document.getElementById("f").addEventListener("submit",function(e){e.preventDefault();show(inp.value||"quiet")});
document.getElementById("r").addEventListener("click",function(){show(WORDS[Math.floor(Math.random()*WORDS.length)])});
var gal=document.getElementById("g");
WORDS.forEach(function(w){var b=document.createElement("button");b.type="button";b.textContent=w;b.addEventListener("click",function(){show(w)});gal.appendChild(b)});
function show(w){inp.value=w;weave(w);try{history.replaceState(null,"","#"+encodeURIComponent(w))}catch(e){}}
var start="rain";try{start=decodeURIComponent(location.hash.slice(1))||start}catch(e){}
start=start.slice(0,60);show(start);
document.getElementById("d").addEventListener("click",function(){
  var a=document.createElement("a");a.download="quietloom-"+(inp.value||"quiet").toLowerCase().replace(/[^a-z0-9]+/g,"-").slice(0,40)+".png";
  a.href=document.getElementById("c").toDataURL("image/png");a.click();
});
// Press "/" anywhere outside a text box to jump to the word field.
document.addEventListener("keydown",function(e){if(e.key==="/"&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&document.activeElement!==inp){e.preventDefault();inp.focus();inp.select()}});
// The back of a cloth shows every crossing the other way round.
var bk=document.getElementById("b");
bk.addEventListener("click",function(){back=!back;bk.textContent=back?"Show the front":"Show the back";bk.setAttribute("aria-pressed",back);weave(inp.value||"quiet")});
// Copy the address of the current cloth; the clipboard is written only when the visitor clicks.
var lk=document.getElementById("l");
lk.addEventListener("click",function(){
  var done=function(t){lk.textContent=t;setTimeout(function(){lk.textContent="Copy link"},1600)};
  try{navigator.clipboard.writeText(location.href).then(function(){done("Copied")},function(){done("Copy failed")})}catch(e){done("Copy failed")}
});
// Replay the weave of the current cloth from the first row.
document.getElementById("p").addEventListener("click",function(){weave(inp.value||"quiet")});
// Look closer magnifies the middle of the cloth so single crossings are easy to see.
var zb=document.getElementById("z");
zb.addEventListener("click",function(){var on=document.getElementById("frame").classList.toggle("close");zb.textContent=on?"Step back":"Look closer";zb.setAttribute("aria-pressed",on)});
