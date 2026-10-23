// Quietloom: weaves a deterministic pattern from a string.
// FNV-1a hash seeds a mulberry32 PRNG (both public-domain algorithms).
function hash(s){var h=2166136261;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function rng(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
var WORDS=["rain","lantern","moss","harbor","thistle","ember","salt","orchard","fog","kite","quarry","willow"];
function weave(word){
  var cv=document.getElementById("c"),x=cv.getContext("2d"),N=cv.width,R=rng(hash(word.toLowerCase().trim()));
  var cells=24+Math.floor(R()*24),cs=N/cells,hue=Math.floor(R()*360);
  var pal=[0,1,2,3].map(function(){return"hsl("+((hue+Math.floor(R()*100)-50+360)%360)+","+(35+Math.floor(R()*40))+"%,"+(25+Math.floor(R()*50))+"%)"});
  var warp=[],weft=[],i,j;
  for(i=0;i<cells;i++){warp.push(pal[Math.floor(R()*4)]);weft.push(pal[Math.floor(R()*4)])}
  var period=2+Math.floor(R()*4),shift=1+Math.floor(R()*3),mir=R()<.5;
  x.fillStyle="#222";x.fillRect(0,0,N,N);
  for(j=0;j<cells;j++)for(i=0;i<cells;i++){
    var ii=mir&&i>=cells/2?cells-1-i:i;
    var over=((ii+j*shift)%period)<period/2;
    x.fillStyle=over?warp[ii]:weft[j];
    var g=over?x.createLinearGradient(i*cs,0,(i+1)*cs,0):x.createLinearGradient(0,j*cs,0,(j+1)*cs);
    g.addColorStop(0,"rgba(0,0,0,.35)");g.addColorStop(.5,"rgba(255,255,255,.12)");g.addColorStop(1,"rgba(0,0,0,.35)");
    x.fillRect(i*cs+1,j*cs+1,cs-2,cs-2);x.fillStyle=g;x.fillRect(i*cs+1,j*cs+1,cs-2,cs-2);
  }
  document.getElementById("cap").textContent="“"+word+"”: "+cells+" threads, repeat of "+period+", step "+shift+(mir?", mirrored":"")+".";
}
var inp=document.getElementById("w");
document.getElementById("f").addEventListener("submit",function(e){e.preventDefault();weave(inp.value||"quiet")});
document.getElementById("r").addEventListener("click",function(){inp.value=WORDS[Math.floor(Math.random()*WORDS.length)];weave(inp.value)});
inp.value="rain";weave("rain");
