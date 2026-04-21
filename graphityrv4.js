function graphity(name,bld,wth,hgt,title,src,rbsd,maxis,stats,ftrat){

     var gosum=false; var goeql252=false;
     
    // LIST OF IMPROVEMENTS
    //
    // MAJORS
    // d3 v4 upgrade
    // summary | stats
    // CW without copy (bld object matching lisp + optim on subsets) and many performance boost (sized arrays, less json, domain/range computations...)
    // perfect 100 for rebase (single and multi axis)
    // brush adjustment (not matching mouse click on graphity v3)
    // zoom on scroll from brush
    // clean call, less variables
    // code factorization (code base almost /2)
    // made offline (through bash script)
    // underlying data download as csv
    //
    // MINORS
    // labels/points colored rendering ++
    // responsive margins
    // gray ids when removed on click
    // multi axis: tick concurrency, mono axis
    // slight tilt in domains to avoid line path cut
    // button to reload (X button)
    //
    // PERFORMANCES
    // scripting time /4 (on action like brushing but /2 overall)
    // rendering time /3
    // painting time /2
    // max heap memory -25%

    // ################################## COMPONENTS SETUP #####################################
    
    // cleaning name then creating the graph div (split+join is 10% faster than nm=name.replace(/\s+/g,"_"))
    // this can be done in the bash var nm=name.split(' ').join('_');
    // IF THE DIV IS MANUALLY ADDED, WE DON'T CREATE IT (allows for styling flexibility)
    if(d3.select("#"+name).node()==null){
	d3.select("body").append("div").attr("id",name+"-dv").style("margin-left","1em").style("margin-top","2em").style("position","relative").style("overflow","visible");
    }
    else
	d3.select("#"+name).append("div").attr("id",name+"-dv").style("margin-left","1em").style("margin-top","2em").style("position","relative").style("overflow","visible");

    function grptycsv(x){
	var str='date,',nc=x.cn.length,nr=x.rn.length;
	str+=x.cn.join(',')+'\n'; for(var i=0;i<nr;i++){ str+=x.rn[i]; for(var j=0;j<nc;j++){ str+=','+x.vec[j][i]; } str+='\n'; }	
	return str;
    }
    
    // function dlx(x,nm){ var hiddn=document.createElement('a'); hiddn.href='data:text/csv;charset=utf-8,'+encodeURI(x); hiddn.target='_blank'; hiddn.download=nm+'.csv'; hiddn.click(); }// download
    function dlx(x,nm){
	// console.log(x);
	function saveAs(content, name) {
	    const isBlob = typeof content.type === 'string';
	    const link = Object.assign(window.document.createElement('a'), { download: name, target: '_blank', href: isBlob ? window.URL.createObjectURL(content) : content });
	    clickElement.call(window, link); isBlob && global.setTimeout(function() { window.URL.revokeObjectURL(link.href); }, 1000);
	};

	function clickElement(element) {
	    const evt = window.document.createEvent('MouseEvents'); evt.initEvent('click', true, true); element.dispatchEvent(evt);
	    return element;
	}
	saveAs(new Blob([x],{type:'text/csv;charset=utf-8;'}),nm+'.csv');
    }

    
    // colors
    if(bg==undefined)  var bg="#ffffff";  if(fg==undefined)  var fg="#47525C";  if(red==undefined) var red="#C00000";
    if(grn==undefined) var grn="#006600"; if(ylw==undefined) var ylw="#CC8C00"; if(blu==undefined) var blu="#002060";
    if(mag==undefined) var mag="#7BB8D9"; if(cyn==undefined) var cyn="#7F7F7F"; if(wht==undefined) var wht="#dbd7b8";
    if(bwht==undefined) var bwht="#dfdfdf";    
    var avgcolor="#999999",eqlcolor="#E8740C";
    var colors=[blu,"#6A0DAD","#0097A7","#C71585","#4682B4",mag,"#20B2AA","#8B008B","#003893","#008B8B","#CD853F","#50BFE6","#2F4F4F","#9C27B0","#00838F","#5D4037","#1565C0","#6D4C41","#00695C","#7B1FA2","#0277BD","#4527A0","#00796B","#283593","#00579B","#4A148C"];

    var cynd=d3.hsl(cyn).darker(2);
    // put mag instead of bg and "#B7E500" for ylw
    var brgt=1.5;// how much brighter should the arrows and labels be

    var mg=[],mg2=[],legofst=0,ids=bld.cn;var ptch=[0,1,4,5,8,9];var st=0,ed=(bld.rn.length-1);// global var from the domain of xscale

    // ########################### STYLING MAIN PARAMS (margins, fonts, label size)
    // margins [0]: top, [1]: right, [2]: bottom (space between charts), [3]: left margin
    mg[0]=hgt*.14; mg[1]=wth*.04; mg[2]=hgt*.31; mg[3]=wth*.045;
    hgt2=hgt*.97; mg2[0]=hgt2*.77; mg2[1]=wth*.024; mg2[2]=hgt2*.15; mg2[3]=wth*.045;

    if(title=="") mg[0]=hgt*.08;

    // initialize dimensions and margins
    var svg=d3.select("#"+name+"-dv").append("svg").attr("id",name+"-svg").attr("width",wth).attr("height",hgt)//.attr("clip-path", "url(#clip)");;//.style("border","1px solid black"),
	margin={top:mg[0],right:mg[1],bottom:mg[2],left:mg[3]},margin2={top:mg2[0],right:mg2[1],bottom:mg2[2],left:mg2[3]};
    h=hgt-margin.top-margin.bottom,h2=hgt-margin2.top-margin2.bottom,w=wth-margin.left-margin.right;
    // focus axis-y lab size, prev axis-y labsize ... etc, source lab size, options (chkboxes lab size), title lab size, legend lab size
    // var faxylab=".92em",paxylab=".85em",faxxlab=".85em",paxxlab=".85em",srclab="2em",optlab="1.1em",titlab="2em",leglab="1.1em",arrwlab="1em";   
    // var faxylab="1.1em",paxylab="1.1em",faxxlab="1.1em",paxxlab="1.1em",srclab="1.8em",optlab="1.3em",titlab="2.1em",leglab="1em",arrwlab="1em";

    // calibrate fonts accordingly
    var ratio=1.2*wth/window.innerWidth;
    var faxylab=(Math.round(1.5*ftrat*ratio*10)/10)+"em",faxxlab=(Math.round(1.5*ftrat*ratio*10)/10)+"em";
    var paxxlab=(Math.round(1.3*ftrat*ratio*10)/10)+"em",paxylab=(Math.round(1.3*ftrat*ratio*10)/10)+"em",srclab=(Math.round(2.4*ftrat*ratio*10)/10)+"em",optlab=(Math.round(1.4*ftrat*ratio*10)/10)+"em"
    var titlab=(Math.round(2.4*ftrat*ratio*10)/10)+"em",leglab=(Math.round(1.05*ftrat*ratio*10)/10)+"em",arrwlab=(Math.round(1.2*ftrat*ratio*10)/10)+"em";
    var fontax="Helvetica", fontg="Calibri";
    
    // main chart areas + definitions (clip-path and arrow heads for mdd)
    svg.append("defs").append("clipPath").attr("id","clip").append("rect").attr("width",w).attr("height",h).style("border","1px solid black");
    svg.append("defs").selectAll("marker").data(ids).enter().append("svg:marker").attr("id",function(d,i){ return "arw-"+name+"-"+i; })
	.attr("viewBox","0 -5 10 10").attr("refX",5).attr("refY",0).attr("markerWidth",6).attr("markerHeight",5).attr("orient","auto")
	.attr("fill",function(d,i){ return d3.color(colors[i]).brighter(); }).append("path").attr("d", "M0,-5L10,0L0,5").attr("class","arrowhd");
    svg.append("defs").selectAll("marker").data(ids).enter().append("svg:marker").attr("id",function(d,i){ return "aruw-"+name+"-"+i; })
	.attr("viewBox","0 -5 10 10").attr("refX",5).attr("refY",0).attr("markerWidth",6).attr("markerHeight",5).attr("orient","auto")
	.attr("fill",function(d,i){ return d3.color(colors[i]).brighter(); }).append("path").attr("d", "M0,-5L10,0L0,5").attr("class","arrowhd");

    var focus=svg.append("g").attr("class","focus").attr("transform","translate("+margin.left+","+margin.top+")");
    var prev=svg.append("g").attr("class","prev").attr("transform", "translate("+margin2.left+","+margin2.top+")");

    // ########################### INPUTS (CHECKBOXES AND DATES + RELOAD BUTTON)
    // building the div for inputs
     d3.select("#"+name+"-dv").append("div").attr("id","chkdv-"+name).style("position","absolute")
	.style("top",(h+margin.bottom+margin.top/2)+"px").style("left",margin.left+"px").style("width",w+"px");
    // building the checkboxes
    d3.select("#chkdv-"+name).append("input").attr("type","checkbox").attr("class","box-"+name).attr("id","rb-"+name).on("click",function(){ rbsd=!rbsd; graphit(st,ed,false,true); });
    d3.select("#chkdv-"+name).append("label").attr("class","lab-"+name).html("rebase | ").attr("for","rb-"+name);
    d3.select("#chkdv-"+name).append("input").attr("type","checkbox").attr("class","box-"+name).attr("id","mx-"+name).on("click",function(){ maxis=!maxis; graphit(st,ed,true,true); });
    d3.select("#chkdv-"+name).append("label").attr("class","lab-"+name).html("maxis | ").attr("for","mx-"+name);
    d3.select("#chkdv-"+name).append("input").attr("type","checkbox").attr("class","box").attr("id","st-"+name).on("click",function(){ stats=!stats; graphit(st,ed,false,true);  });
    d3.select("#chkdv-"+name).append("label").attr("class","lab-"+name).html("stats | ").attr("for","st-"+name);
    d3.select("#chkdv-"+name).append("input").attr("type","checkbox").attr("class","box-"+name).attr("id","sm-"+name).on("click",function(){ gosum=!gosum; if(gosum&&!rbsd){ rbsd=true; d3.select("#rb-"+name).property("checked",true); } graphit(st,ed,true,true); });
    d3.select("#chkdv-"+name).append("label").attr("class","lab-"+name).html("avg | ").attr("for","sm-"+name);
    d3.select("#chkdv-"+name).append("input").attr("type","checkbox").attr("class","box-"+name).attr("id","eq252-"+name).on("click",function(){ goeql252=!goeql252; if(goeql252&&!rbsd){ rbsd=true; d3.select("#rb-"+name).property("checked",true); } graphit(st,ed,true,true); });
    d3.select("#chkdv-"+name).append("label").attr("class","lab-"+name).html("eql_252 | ").attr("for","eq252-"+name);
    d3.select("#chkdv-"+name).append("label").attr("class","rlab-"+name).html("&#10226; |").on("click",function(){ graphit(0,bld.rn.length,true,true); for(var i=0;i<ids.length;i++) viss[i]=true; prev.select(".brush").call(brush.move,null); });// reload label
     d3.select("#chkdv-"+name).append("label").attr("class","dlab-"+name).attr("download",name).html(" &#8681; ").on("click",function(){ dlx(grptycsv(bld),name); });// download
     if(rbsd) d3.select("#rb-"+name).attr("checked",""); if(maxis) d3.select("#mx-"+name).attr("checked",""); if(stats) d3.select("#st-"+name).attr("checked","");
     if(gosum) d3.select("#sm-"+name).attr("checked",""); if(goeql252) d3.select("#eq252-"+name).attr("checked","");
     
    // style checkboxes and labels
    //d3.selectAll(".tbox").style("font-size","1.2em").style("cursor","pointer").style("color",cyn);
    d3.selectAll(".lab-"+name).style("color",cyn).style("font-family",fontg).style("font-size",optlab).style("cursor","pointer");
    d3.select(".rlab-"+name).style("color",cyn).style("font-size",(Math.round(1.2*ftrat*ratio*10)/10)+"em").style("cursor","pointer");
     d3.select(".dlab-"+name).style("color",cyn).style("font-size",(Math.round(1.2*ftrat*ratio*10)/10)+"em").style("cursor","pointer");
    // building the date inputs
    d3.select("#chkdv-"+name).append("div").attr("id","inp-"+name);
    // getting date range from input
    function inpd(){
	var std=d3.timeParse("%Y-%m-%d")(d3.select("#lin-"+name).node().value),edd=d3.timeParse("%Y-%m-%d")(d3.select("#rin-"+name).node().value),ik=0,il=0;
	edd=d3.timeHour.offset(edd,2);std=d3.timeHour.offset(std,2);
	while(bld.rn.indexOf(String(std.toISOString().substr(0,10)))==-1 && ik<bld.rn.length){ std=d3.timeDay.offset(std,1);ik++; }
	while(bld.rn.indexOf(String(edd.toISOString().substr(0,10)))==-1 && il<bld.rn.length){ edd=d3.timeDay.offset(edd,-1);il++; }
	st=bld.rn.indexOf(std.toISOString().substr(0,10));ed=bld.rn.indexOf(edd.toISOString().substr(0,10)); // if(ed!=bld.rn.length) ed=ed+1;
	d3.select("#lin-"+name).node().value=std.toISOString().substr(0,10);d3.select("#rin-"+name).node().value=edd.toISOString().substr(0,10);xscl.domain([std,edd]);// re-adjust domain and input
	focus.select(".axis-x").call(xAxis);
	graphit(st,ed,false,true);
    }
    d3.select("#inp-"+name).append("input").attr("type","text").attr("class","ginp").attr("id","lin-"+name).attr("value",bld.rn[0]).on("blur",inpd);
    d3.select("#inp-"+name).append("input").attr("type","text").attr("class","ginp").attr("id","rin-"+name).attr("value",bld.rn[bld.rn.length-1]).on("blur",inpd);
    d3.selectAll(".ginp").style("border","1px solid "+cyn).style("background","transparent").style("color",cyn).style("padding-left",(Math.round(.5*ratio*10)/10)+"em").attr("size",8).style("font-size",(Math.round(0.8*ftrat*ratio*10)/10)+"em").style("font-family",fontg)
	.style("margin-left",(Math.round(.15*ratio*10)/10)+"em"); // .75
    d3.select("#inp-"+name).style("position","absolute").style("right","0").style("top","0");
    
    // parsing dates for both xaxis + setting up the scales and axis 
    var prsdt=d3.timeParse("%Y-%m-%d");var dates=new Array(bld.rn.length); for(var i=0;i<bld.rn.length;i++) dates[i]=prsdt(bld.rn[i]);
    // precompute running drawdown for each series (used in prev chart)
    var ddvec=new Array(ids.length),ddmin=0;
    for(var k=0;k<ids.length;k++){
	ddvec[k]=new Array(bld.rn.length); var rmax=bld.vec[k][0];
	for(var i=0;i<bld.rn.length;i++){ if(bld.vec[k][i]>rmax) rmax=bld.vec[k][i]; ddvec[k][i]=(bld.vec[k][i]/rmax)-1; if(ddvec[k][i]<ddmin) ddmin=ddvec[k][i]; }
    }
    // legends variables
    var prf=new Array(ids.length),volat=new Array(ids.length),mddw=new Array(ids.length),mduw=new Array(ids.length),shrp=new Array(ids.length),lulu=new Array(ids.length),lgds=[],viss=[]; for(var i=0;i<ids.length;i++){ viss[i]=true;  }// legends and visible series

    // ########################### TITLE AND SOURCE
    if(title!=""){
	svg.append("text").attr("id","title-"+name).attr("x",(w/2)+margin.left).attr("y",.125*h).attr("text-anchor","middle").text(title)
	    .style("fill",cyn).style("font-family",fontg).style("font-size",titlab);
	legofst=.08*h;
    }
    svg.append("text").attr("class","source").attr("id","source-"+name).attr("x",(w/2)+margin.left).attr("y",h+margin.bottom+margin.top/2).attr("text-anchor","middle").text(src)
	.style("fill",cyn).style("font-family",fontg).style("font-size",srclab);

    // ########################### X-AXIS SETUP (domain will be set in graphit)
    var xscl=d3.scaleTime().range([0,w]), xAxis=d3.axisBottom(xscl),xscl2=d3.scaleTime().range([0,w]), xAxis2=d3.axisBottom(xscl2); xAxis.tickSizeOuter(.5);

    function graphit(ist,ied,init,end){
	// First remove all the previously drawn lines
	focus.selectAll(".line").remove(); focus.selectAll(".axis-y").remove(); focus.selectAll(".grd").remove(); svg.selectAll(".leg").remove(); svg.selectAll(".legl").remove();
	focus.selectAll(".mdarr-"+name).remove(); svg.selectAll(".mdlab-"+name).remove(); focus.selectAll(".mduarr-"+name).remove(); svg.selectAll(".mdulab-"+name).remove(); svg.selectAll(".mddurlab-"+name).remove();
	svg.selectAll(".stinfo-"+name).remove();focus.selectAll(".pan").remove();
	svg.selectAll(".ttrlab-"+name).remove(); focus.selectAll(".rec-"+name).remove(); focus.selectAll(".rec2-"+name).remove();
	
	// COMPUTE MIN, MAX, LAST and (if brush) SUBSET with indexes (all integers from ist to ied)
	// this subset method allows to record 1 array of integers of size ied-ist instead of #ids of arrays of double and access data without copying
	// we keep the optimization that avoids creating it for the whole chart
	var mx=new Array(ids.length),mn=new Array(ids.length),mx2=new Array(ids.length),mn2=new Array(ids.length),lst=new Array(ids.length),subst=new Array((ied-ist)+1);
	
	for(var i=ist;i<=ied;++i) subst[(i-ist)]=i; // console.log(subst);
	// processing data extent (tailor made on slice) and creating the data slice to be processed by brushed
	for(var j=0;j<ids.length;++j){
	    // if not init, then it's coming from brush or dates
	    var lmx=bld.vec[j][ist],lmn=lmx;


	    // if(devmode) 
	    
	    // filtering on line generator would force a loop on all bld.vec elts + if for the range is-ie, whereas here we just get the subset that we will feed the generator
	    for(var i=(ist+1);i<=ied;++i){ if(bld.vec[j][i]<lmn) lmn=bld.vec[j][i]; if(bld.vec[j][i]>lmx) lmx=bld.vec[j][i]; }
	    if(rbsd){ if(bld.vec[j][ist]<0){ mn[j]=100*lmx/bld.vec[j][ist];mx[j]=100*lmn/bld.vec[j][ist]; }
		      else{ mx[j]=100*lmx/bld.vec[j][ist];mn[j]=100*lmn/bld.vec[j][ist]; }
		      lst[j]=100*bld.vec[j][ied]/bld.vec[j][ist]; mx2[j]=lmx;mn2[j]=lmn; }
	    else{ mx[j]=lmx;mn[j]=lmn;lst[j]=bld.vec[j][ied]; if(init){ mx2[j]=lmx; mn2[j]=lmn; } }// prev should only be maxis or not otherwise no redraw (only computed on full domain)
	}
	// equal-weight average return series (when gosum is on)
	var sumvec,sumlst,summn,summx;
	if(gosum){
	    sumvec=new Array((ied-ist)+1); sumvec[0]=100; var nvis=0;
	    for(var k=0;k<ids.length;k++) if(viss[k]) nvis++;
	    if(nvis>0){
		for(var i=ist+1;i<=ied;i++){
		    var avgret=0;
		    for(var k=0;k<ids.length;k++) if(viss[k]) avgret+=(bld.vec[k][i]/bld.vec[k][i-1]-1);
		    avgret/=nvis; sumvec[i-ist]=sumvec[i-ist-1]*(1+avgret);
		}
		summn=sumvec[0]; summx=sumvec[0];
		for(var i=0;i<sumvec.length;i++){ if(sumvec[i]<summn) summn=sumvec[i]; if(sumvec[i]>summx) summx=sumvec[i]; }
		sumlst=sumvec[sumvec.length-1];
	    }
	}
	// risk parity (252d rolling vol) average return series
	var eql252vec,eql252mn,eql252mx;
	if(goeql252){
	    var nvis=0; for(var k=0;k<ids.length;k++) if(viss[k]) nvis++;
	    if(nvis>0){
		var lkb=252,gist=Math.max(0,ist-lkb);
		// precompute rolling vol for each visible series from gist to ied
		var rvol=new Array(ids.length);
		for(var k=0;k<ids.length;k++){
		    if(!viss[k]) continue;
		    rvol[k]=new Array(ied+1);
		    var sx=0,sx2=0,cnt=0;
		    for(var i=gist+1;i<=ied;i++){
			var r=bld.vec[k][i]/bld.vec[k][i-1]-1; sx+=r; sx2+=r*r; cnt++;
			if(cnt>lkb){ var oldr=bld.vec[k][i-lkb]/bld.vec[k][i-lkb-1]-1; sx-=oldr; sx2-=oldr*oldr; cnt--; }
			if(cnt>1) rvol[k][i]=Math.sqrt(252*(sx2-(sx*sx/cnt))/(cnt-1)); else rvol[k][i]=1;
			if(rvol[k][i]<0.001) rvol[k][i]=0.001;
		    }
		}
		eql252vec=new Array((ied-ist)+1); eql252vec[0]=100;
		for(var i=ist+1;i<=ied;i++){
		    var invVolSum=0;
		    for(var k=0;k<ids.length;k++) if(viss[k]) invVolSum+=1/rvol[k][i];
		    var portret=0;
		    for(var k=0;k<ids.length;k++){
			if(!viss[k]) continue;
			var r=bld.vec[k][i]/bld.vec[k][i-1]-1;
			portret+=((1/rvol[k][i])/invVolSum)*r;
		    }
		    eql252vec[i-ist]=eql252vec[i-ist-1]*(1+portret);
		}
		eql252mn=eql252vec[0]; eql252mx=eql252vec[0];
		for(var i=0;i<eql252vec.length;i++){ if(eql252vec[i]<eql252mn) eql252mn=eql252vec[i]; if(eql252vec[i]>eql252mx) eql252mx=eql252vec[i]; }
	    }
	}
	// re-arrange y axis ticks to have a tick on the x axis and one tick at the end of the axis
	var ymgn=1.00002;// margin above max (yscale domain + 6%) to avoid having lines too close to the top or cut by clip path

	// ################################# AXIS SETUP + GRID #####################################
	// X-AXIS MGMT (domain only)
	xscl.domain([dates[ist],dates[ied]]); // xscl.domain(s.map(xscl2.invert, xscl2));

	// Y-AXIS MGMT (depends on maxis)
	var myAxis=[],myscl=[],yAxis,yscl,myAxis2=[],myscl2=[],yAxis2,yscl2,mline=[],mline2=[];
	function axisIdx(i){ if(ids.length>5){ if(i%2==0) return (w-i*.24*margin.left); else return (i-1)*.24*margin.left; }else{ if(i%2==0) return w; else return 0;} }

	// ############ INIT FOR PREV REDRAW -> DRAWDOWN CHART
	if(init){
	    prev.selectAll(".line2").remove(); prev.selectAll(".grd").remove(); prev.selectAll(".axis-y2").remove(); prev.selectAll(".ddarea").remove();
	    xscl2.domain([dates[0],dates[dates.length-1]]);

	    yscl2=d3.scaleLinear().range([h2,0]),yAxis2=d3.axisLeft(yscl2).ticks(2).tickSize(0);
	    var ddtkn=3,ddtksd=d3.range(ddmin,0,-ddmin/ddtkn);
	    yAxis2.tickSizeOuter(.5); yAxis2.tickValues(ddtksd); yscl2.domain([ddmin,0]);
	    yAxis2.tickFormat(function(d){ return Math.round(d*100)+'%'; });
	    // 0% reference line at top
	    prev.append("line").attr("x1",0).attr("y1",yscl2(0)).attr("x2",w).attr("y2",yscl2(0)).style("stroke",cyn).style("stroke-width",1).attr("class","grd");
	    yAxis2.tickValues().forEach(function(d,i){
		if(i>0) prev.append("line").attr("x1",2).attr("y1",yscl2(d)).attr("x2",w).attr("y2",yscl2(d)).style("stroke",cyn).style("stroke-width",.5).style("stroke-dasharray","4,7").attr("class","grd");
	    });
	    var allIdx=new Array(bld.rn.length); for(var i=0;i<bld.rn.length;i++) allIdx[i]=i;
	    for(var k=0;k<ids.length;k++){
		var ddarea=d3.area().x(function(idx){ return xscl2(dates[idx]); }).y0(yscl2(0)).y1(function(idx){ return yscl2(ddvec[k][idx]); });
		prev.append("path").attr("class","ddarea").attr("id","dda-"+name+"-"+k).style("fill",colors[k]).style("opacity",.15).attr("d",ddarea(allIdx));
		mline2[k]=d3.line().x(function(idx){ return xscl2(dates[idx]); }).y(function(idx){ return yscl2(ddvec[k][idx]); });
		prev.append("path").attr("class","line2").attr("id","ln2-"+name+"-"+k).style("stroke",colors[k]).style("stroke-width",1.5).attr("d",mline2[k](allIdx));
	    }
	    prev.append("g").attr("class","axis-y2").call(yAxis2); prev.select(".axis-y2").selectAll(".tick text").style("fill",cynd).style("font-family",fontax).style("font-size",paxylab);
	    prev.select(".axis-y2").selectAll(".domain").style("stroke",cyn).style("stroke-width",2);
	}// end of only on init part
	
	// ############ FOCUS DRAW -> THE PART THAT WILL ALWAYS CHANGE (either brush move, rebase, or maxis toggle)
	if(maxis){
	    // if multiaxis we need to instanciate each
	    for(var k=0;k<ids.length;k++){
		if(viss[k]){
		    if(ptch.indexOf(k)!=-1){ tkn=3;tkn2=3; }else{ tkn=5;tkn2=4; }// # of ticks
		    myscl[k]=d3.scaleLinear().range([h,0]); myAxis[k]=d3.axisLeft(myscl[k]).ticks(tkn).tickSize(0);

		    //when rbsd we want 100 to be a perfect 100, not 100.07 or 100.007, so we need to round the closest tick to 100 there is, but not the others to keep a proper scale
		    var tksd=d3.range(mn[k],ymgn*mx[k],(ymgn*mx[k]-mn[k])/tkn),tksd2=d3.range(mn2[k],ymgn*mx2[k],(ymgn*mx2[k]-mn2[k])/tkn2);// tick domain/range	    
 		    if(rbsd){ var opt=100,optidx=0;for(var i=0;i<tksd.length;i++){ if(Math.abs(100-tksd[i])<opt){ opt=Math.abs(100-tksd[i]); optidx=i; }}; tksd[optidx]=100; }// perfect 100
		    
		    if(ptch.indexOf(k)!=-1) myAxis[k].tickValues(tksd); else myAxis[k].tickValues(tksd.slice(1,tksd.length-1)); myscl[k].domain([mn[k],ymgn*mx[k]]);// establish domains/range
		    // draw ticks lines one by one (grid lines)
		    myAxis[k].tickValues().forEach(function(d,i){
 			if(i>0) focus.append("line").attr("x1",2).attr("y1",myscl[k](d)).attr("x2",w).attr("y2",myscl[k](d))
			    .style("stroke",colors[k]).style("stroke-width",1.5).style("stroke-dasharray","4,7").style("opacity",.7).attr("class","grd");
		    });
		    // define line drawer, add rebased init behaviour
		    mline[k]=d3.line().x(function(idx){ return xscl(dates[idx]); }).y(function(idx){ if(rbsd) return myscl[k](100*bld.vec[k][idx]/bld.vec[k][ist]);
												     else return myscl[k](bld.vec[k][idx]); });
		    // draw lines
		    focus.append("path").attr("class","line").attr("id","ln-"+name+"-"+k).style("stroke",colors[k]).style("stroke-width",2).attr("d",mline[k](subst));		    
		    if(k%2==0) myAxis[k].tickPadding(-margin.right+margin.left*0.24); else myAxis[k].tickPadding(margin.left-margin.right); //right axis ticks, left axis ticks 		    
		    focus.append("g").attr("id", "axis-y"+name+"-"+k).attr("class","axis-y").call(myAxis[k]).attr("transform","translate("+axisIdx(k)+",0)");
		    focus.select("#axis-y"+name+"-"+k).selectAll(".tick text").style("fill",colors[k]).style("font-family",fontax).style("font-size",faxylab);
		    focus.select("#axis-y"+name+"-"+k).selectAll(".domain").style("stroke",cyn).style("stroke-width",2);// domain is the main line
		}
	    }
	}else{
	    yscl=d3.scaleLinear().range([h,0]), yAxis=d3.axisLeft(yscl).ticks(8).tickSize(0);// setup y axis

	    // we manually compute the max and min for those to avoid the invisible series
	    var mmn,mmx,mminit=false; for(var l=0;l<ids.length;++l){ if(viss[l]){ if(mminit){ if(mmn>mn[l]) mmn=mn[l]; if(mmx<mx[l]) mmx=mx[l]; }else{ mmn=mn[l];mmx=mx[l];mminit=true; } }  };
	    if(gosum && summn!=undefined){ if(summn<mmn) mmn=summn; if(summx>mmx) mmx=summx; }
	    if(goeql252 && eql252mn!=undefined){ if(eql252mn<mmn) mmn=eql252mn; if(eql252mx>mmx) mmx=eql252mx; }
	    
	    // when rbsd we want 100 to be a perfect 100, not 100.07 or 100.007, so we need to round the closest tick to 100 there is, but not the others to keep a proper scale
	    var tksd=d3.range(mmn,ymgn*mmx,(ymgn*mmx-mmn)/8);// tick domain/range
 	    if(rbsd){ var opt=100,optidx=0;for(var i=0;i<tksd.length;i++){ if(Math.abs(100-tksd[i])<opt){ opt=Math.abs(100-tksd[i]); optidx=i; }}; tksd[optidx]=100; }
	    
	    yscl.domain([mmn,ymgn*mmx]); yAxis.tickValues(tksd);yAxis.tickSizeOuter(.5); // hard mgmt of ticks (this way, xaxis matches first y tick)
	    // draw ticks one by one
	    yAxis.tickValues().forEach(function(d,k){
 		if(k>0) focus.append("line").attr("x1",2).attr("y1",yscl(d)).attr("x2",w).attr("y2",yscl(d)).style("stroke",cyn).style("stroke-width",.5).attr("class","grd");
	    });
	    // define line drawer and draw
	    for(var k=0;k<ids.length;k++){
		if(viss[k]){
		    mline[k]=d3.line().x(function(idx){ return xscl(dates[idx]); }).y(function(idx){ if(rbsd) return yscl(100*bld.vec[k][idx]/bld.vec[k][ist]); else return yscl(bld.vec[k][idx]); });
		    focus.append("path").attr("class","line").attr("id","ln-"+name+"-"+k).style("stroke",colors[k]).style("stroke-width",2).attr("d",mline[k](subst));// draw lines
		}
	    }
	    // equal-weight average line
	    if(gosum && sumvec!=undefined){
		var sumline=d3.line().x(function(d,i){ return xscl(dates[ist+i]); }).y(function(d){ return yscl(d); });
		focus.append("path").attr("class","line").attr("id","ln-"+name+"-sum").style("stroke",avgcolor).style("stroke-width",3).style("stroke-dasharray","8,4").attr("d",sumline(sumvec));
	    }
	    // risk parity 252d line
	    if(goeql252 && eql252vec!=undefined){
		var eqlline=d3.line().x(function(d,i){ return xscl(dates[ist+i]); }).y(function(d){ return yscl(d); });
		focus.append("path").attr("class","line").attr("id","ln-"+name+"-eql252").style("stroke",eqlcolor).style("stroke-width",3).style("stroke-dasharray","12,4").attr("d",eqlline(eql252vec));
	    }
	    // drawing the axis in main graph area (focus) then context graph area (prev)
	    focus.append("g").attr("class", "axis-y").call(yAxis);
	    focus.select(".axis-y").selectAll(".tick text").style("fill",cynd).style("font-family",fontax).style("font-size",faxylab);
	    focus.select(".axis-y").selectAll(".domain").style("stroke",cyn).style("stroke-width",2);
	}

	// ##################### SUMMARY COMPUTE (on brush end)
	function cyscl(i){ if(maxis) return myscl[i]; else return yscl; }
	function fmtdur(d){ var s="",e=""; if(d>60){ if(d>360){ if(Math.round(d/360)>1) e="s"; s=Math.round(d*10/360)/10+" year"+e; }else{ if(Math.round(d/60)>1) e="s"; s=Math.round(d*10/60)/10+" month"+e; }}else{ if(Math.round(d)>1) e="s"; s=Math.round(d*10)/10+" day"+e; } return s; }
	function computeStats(vec,len,ist_,ied_,sid,scolor,syf,mddcol){
	    if(!mddcol) mddcol=scolor;
	    var dlg=new Array(len),l=0,x=0,x2=0;
	    for(var k=1;k<len;k++){ dlg[l]=(vec[k]/vec[k-1]-1); x+=dlg[l]; x2+=dlg[l]*dlg[l]; l++; }
	    var svol=Math.sqrt(252*(x2-(x*x/len))/(len-1))*100;
	    var sperf=(vec[len-1]/vec[0]-1)*100*(252/len);
	    var sshrp=(252*100*x/len)/svol;
	    var scnt=0,mdd=0,mdds=0,mdde=0,mdu=0,mdus=0,mdue=0;
	    while(scnt<l){ var comp=dlg[scnt]; for(var j=scnt+1;j<l;j++){ if((comp+dlg[j])<mdd){ mdds=scnt;mdde=j;mdd=(comp+dlg[j]); } if((comp+dlg[j])>mdu){ mdus=scnt;mdue=j;mdu=(comp+dlg[j]); } comp+=dlg[j]; } scnt++; }
	    var vls=vec[mdds],vle=vec[mdde+1]; var smddw=(vle/vls)-1; var vlus=vec[mdus],vlue=vec[mdue+1]; var smduw=(vlue/vlus)-1;
	    // draw mdd/mdu arrows and labels
	    var ddur=Math.ceil(Math.abs(dates[ist_+mdde+1].getTime()-dates[ist_+mdds].getTime())/(1000*3600*24));
	    svg.append("text").attr("class","mddurlab-"+name).attr("x",xscl(dates[ist_+mdds])+margin.left+5).attr("y",syf(vls)+margin.top-10).attr("id","lddur-"+name+"-"+sid)
		.text(fmtdur(ddur)).style("font-family",fontg).style("font-size",arrwlab).style("font-weight","bold").style("fill",d3.color(mddcol).brighter(brgt)).style("stroke",fg).style("stroke-width",.5);
	    focus.append("line").attr("class","mdarr-"+name).attr("x1",xscl(dates[ist_+mdds])).attr("x2",xscl(dates[ist_+mdde+1])).attr("id","larw-"+name+"-"+sid)
		.attr("y1",syf(vls)).attr("y2",syf(vle)).style("stroke",d3.color(mddcol).brighter(brgt)).style("stroke-width",2).style("stroke-dasharray","5,5");
	    focus.append("line").attr("class","mduarr-"+name).attr("x1",xscl(dates[ist_+mdus])).attr("x2",xscl(dates[ist_+mdue+1])).attr("id","laruw-"+name+"-"+sid)
		.attr("y1",syf(vlus)).attr("y2",syf(vlue)).style("stroke",d3.color(scolor).brighter(brgt)).style("stroke-width",2).style("stroke-dasharray","5,5");
	    svg.append("text").attr("class","mdlab-"+name).attr("x",xscl(dates[ist_+mdde+1])+margin.left-20).attr("y",syf(vle)+margin.top+20).attr("id","lbarw-"+name+"-"+sid)
		.text(Math.round(smddw*100*100)/100+'%').style("font-family",fontg).style("font-size",arrwlab).style("font-weight","bold").style("fill",d3.color(mddcol).brighter(brgt)).style("stroke",fg).style("stroke-width",.5);
	    svg.append("text").attr("class","mdulab-"+name).attr("x",xscl(dates[ist_+mdue+1])+margin.left-20).attr("y",syf(vlue)+margin.top-10).attr("id","lbaruw-"+name+"-"+sid)
		.text(Math.round(smduw*100*100)/100+'%').style("font-family",fontg).style("font-size",arrwlab).style("font-weight","bold").style("fill",d3.color(scolor).brighter(brgt)).style("stroke",fg).style("stroke-width",.5);
	    // time to recovery
	    var hpt=vec[mdds],hpti=mdds,fnd=false;
	    for(var k=mdds+1;k<len;k++) if(vec[k]>hpt){ hpti=k; fnd=true; break; }
	    if(fnd){
		var reccol=mddcol!=scolor?grn:scolor;
		focus.append("circle").attr("class","rec-"+name).attr("cx",xscl(dates[ist_+hpti])).attr("cy",syf(vec[hpti])).attr("r",ratio*10).style("fill",reccol).style("opacity",.4).attr("id","cttr-"+name+"-"+sid);
		focus.append("circle").attr("class","rec2-"+name).attr("cx",xscl(dates[ist_+hpti])).attr("cy",syf(vec[hpti])).attr("r",ratio*4).style("fill",reccol).attr("id","cttr2-"+name+"-"+sid).style("stroke",cyn);
		var ttr=Math.ceil(Math.abs(dates[ist_+hpti].getTime()-dates[ist_+mdde].getTime())/(1000*3600*24));
		svg.append("text").attr("class","ttrlab-"+name).attr("x",xscl(dates[ist_+hpti])+margin.left-20).attr("y",syf(vec[hpti])+margin.top-20).attr("id","lttr-"+name+"-"+sid)
		    .text(fmtdur(ttr)).style("font-family",fontg).style("font-size",arrwlab).style("font-weight","bold").style("fill",d3.color(reccol).brighter(brgt)).style("stroke",fg).style("stroke-width",.5);
	    }
	    return {"p":sperf,"v":svol,"s":sshrp,"m":smddw,"u":smduw,"mddcol":mddcol};
	}

	if(end && stats){
	    var len=subst.length;
	    if(len>15){
		for(var i=0;i<ids.length;i++){
		    if(viss[i]){
			// build rebased array for this series over the visible window
			var svec=new Array(len); for(var k=0;k<len;k++) svec[k]=rbsd?100*bld.vec[i][subst[k]]/bld.vec[i][subst[0]]:bld.vec[i][subst[k]];
			var sr=computeStats(svec,len,ist,ied,i,colors[i],cyscl(i),ids.length==1?red:null);
			prf[i]=sr.p; volat[i]=sr.v; shrp[i]=sr.s; mddw[i]=sr.m; mduw[i]=sr.u; lulu[i]=sr.mddcol;
		    }
		}
		// stats for synthetic series
		if(gosum && sumvec!=undefined){
		    var sr=computeStats(sumvec,len,ist,ied,"sum",avgcolor,yscl);
		    prf["sum"]=sr.p; volat["sum"]=sr.v; shrp["sum"]=sr.s; mddw["sum"]=sr.m; mduw["sum"]=sr.u;
		}
		if(goeql252 && eql252vec!=undefined){
		    var sr=computeStats(eql252vec,len,ist,ied,"eql252",eqlcolor,yscl);
		    prf["eql252"]=sr.p; volat["eql252"]=sr.v; shrp["eql252"]=sr.s; mddw["eql252"]=sr.m; mduw["eql252"]=sr.u;
		}
	    }else svg.append("text").attr("class","stinfo-"+name).attr("x",margin.left).attr("y",.96*(margin2.top+h2+margin2.bottom)).text("warning: not enough data to compute stats").style("font-family",fontg).style("fill",cyn);
	}

	// ##################### LEGEND SETTER (right-side vertical list, sorted by performance)
	lgds=[];
	ids.forEach(function(id,i){ lgds.push({"id":id,"ix":i,"lp":lst[i],"p":prf[i],"v":volat[i],"m":mddw[i],"u":mduw[i],"s":shrp[i],"syn":false,"color":colors[i],"mddcol":lulu[i] }); });
	if(gosum && sumvec!=undefined) lgds.push({"id":"avg","ix":"sum","lp":sumvec[sumvec.length-1],"p":prf["sum"],"v":volat["sum"],"m":mddw["sum"],"u":mduw["sum"],"s":shrp["sum"],"syn":true,"color":avgcolor});
	if(goeql252 && eql252vec!=undefined) lgds.push({"id":"eql_252","ix":"eql252","lp":eql252vec[eql252vec.length-1],"p":prf["eql252"],"v":volat["eql252"],"m":mddw["eql252"],"u":mduw["eql252"],"s":shrp["eql252"],"syn":true,"color":eqlcolor});
	function stord(x,y){ return y.lp - x.lp; } lgds.sort(stord);

	d3.select("#legdv-"+name).remove();
	var legdv=d3.select("#"+name+"-dv").append("div").attr("id","legdv-"+name)
	    .style("position","absolute").style("top",margin.top+"px").style("left",(margin.left+w+10)+"px")
	    .style("max-height",(h+h2+margin.bottom)+"px").style("overflow-y","auto")
	    .style("font-family",fontg).style("font-size",Math.max(ratio*11,9)+"px");

	lgds.forEach(function(lg,i){
	    var row=legdv.append("div").attr("id","lgr-"+name+"-"+lg.ix).style("padding","2px 4px").style("cursor","pointer")
		.style("opacity",function(){ if(lg.syn) return 1; return viss[lg.ix]?1:.4; }).style("white-space","nowrap");
	    row.append("span").style("display","inline-block").style("width","10px").style("height","10px")
		.style("background",lg.color).style("margin-right","5px").style("vertical-align","middle");
	    if(stats && lg.p!=undefined && lg.mddcol){
		row.append("span").text(lg.id+' ('+Math.round(lg.lp*10)/10+'): '+Math.round(100*lg.p)/100+'% | '+Math.round(lg.v*100)/100+'% | '+Math.round(100*lg.s)/100+' | ').style("color",lg.color);
		row.append("span").text(Math.round(lg.m*100*100)/100+'%').style("color",lg.mddcol);
		row.append("span").text(' | '+Math.round(lg.u*100*100)/100+'% | ').style("color",lg.color);
		row.append("span").text(Math.round(100*100*lg.m/lg.v)/100).style("color",lg.mddcol);
	    }else{
		var ltxt=lg.id+' ('+Math.round(lg.lp*10)/10+')';
		if(stats && lg.p!=undefined) ltxt=lg.id+' ('+Math.round(lg.lp*10)/10+'): '+Math.round(100*lg.p)/100+'% | '+Math.round(lg.v*100)/100+'% | '+Math.round(100*lg.s)/100+' | '+Math.round(lg.m*100*100)/100+'% | '+Math.round(lg.u*100*100)/100+'% | '+Math.round(100*100*lg.m/lg.v)/100;
		row.append("span").text(ltxt).style("color",lg.color);
	    }

	    row.on("mouseover",function(){
		svg.selectAll(".mdlab-"+name).style("opacity",.2); svg.select("#lbarw-"+name+"-"+lg.ix).style("opacity",1);
		focus.selectAll(".mdarr-"+name).style("opacity",.2); focus.select("#larw-"+name+"-"+lg.ix).style("opacity",1).style("stroke-width",3);
		svg.selectAll(".mdulab-"+name).style("opacity",.2); svg.select("#lbaruw-"+name+"-"+lg.ix).style("opacity",1);
		focus.selectAll(".mduarr-"+name).style("opacity",.2); focus.select("#laruw-"+name+"-"+lg.ix).style("opacity",1).style("stroke-width",3);
		svg.selectAll(".mddurlab-"+name).style("opacity",.2); svg.select("#lddur-"+name+"-"+lg.ix).style("opacity",1);
		focus.selectAll(".line").style("opacity",.2); focus.select("#ln-"+name+"-"+lg.ix).style("stroke-width",4).style("opacity",1);
		focus.selectAll(".rec2-"+name).style("opacity",.2); focus.selectAll(".rec-"+name).style("opacity",.2);
		focus.select("#cttr-"+name+"-"+lg.ix).style("opacity",.6);
		svg.selectAll(".ttrlab-"+name).style("opacity",.2); svg.select("#lttr-"+name+"-"+lg.ix).style("opacity",1);
	    })
	    .on("mouseout",function(){
		focus.selectAll(".mdlab-"+name).style("opacity",1);focus.selectAll(".mdarr-"+name).style("opacity",1);svg.selectAll(".mdlab-"+name).style("opacity",1);
		svg.selectAll(".mddurlab-"+name).style("opacity",1);
		focus.selectAll(".line").style("opacity",1); focus.select("#ln-"+name+"-"+lg.ix).style("stroke-width",2);
		focus.select("#larw-"+name+"-"+lg.ix).style("stroke-width",2);
		focus.selectAll(".rec2-"+name).style("opacity",1); focus.selectAll(".rec-"+name).style("opacity",.4); svg.selectAll(".ttrlab-"+name).style("opacity",1);
	    })
	    .on("click",function(){ if(!lg.syn){ viss[lg.ix]=!viss[lg.ix]; svg.selectAll(".ttrlab-"+name).remove();focus.selectAll(".pan").remove(); graphit(ist,ied,false,true); } });
	});

	// MOUSE TRACKER (on brush end)
	if(end){
	    var val,trk; focus.selectAll(".det"+name).remove();
	    focus.selectAll(".det"+name).data(subst).enter().append("rect").attr("class","det"+name).attr("x",function(idx){return xscl(dates[idx]);}).attr("y",function(d){return 0;})
		.attr("width",w/subst.length).attr("height",h).style("fill",fg).attr("clip-path", "url(#clip)").style("opacity",0)
		.on("mouseover",function(idx){
		    if(xscl(dates[idx])<(w/2)){ flpdt=5; flppt=15; }else{ flpdt=-65; flppt=-35; }// flip the text when half way
		    focus.selectAll(".pan").remove();
		    if(title==""){
			focus.append("text").attr("class","pan").attr("x",xscl(dates[idx])+flpdt).attr("y",-.05*h).text(bld.rn[idx]).style("fill",cyn)
			    .style("font-family",fontax).style("font-size",faxylab);
		    }else{
			focus.append("text").attr("class","pan").attr("x",xscl(dates[idx])+flpdt).attr("y",(.8*legofst)).text(bld.rn[idx]).style("fill",cyn)
			    .style("font-family",fontax).style("font-size",faxylab);
		    }

		    focus.append("line").attr("class","pan").attr("x1",xscl(dates[idx])).attr("y1",0).attr("x2",xscl(dates[idx])).attr("y2",h).style("stroke",cyn);
		    for(var k=0;k<ids.length;k++){
			if(viss[k]){
			    // get the right value (mouse traker value)
			    if(rbsd) trk=100*bld.vec[k][idx]/bld.vec[k][ist]; else trk=bld.vec[k][idx]; 
			    if(maxis) val=myscl[k](trk); else val=yscl(trk);
			    // tracker style
			    focus.append("text").attr("class","pan").attr("x",xscl(dates[idx])+flppt).attr("y",val).text(Math.round(trk*10)/10)
				.style("fill",colors[k]).style("font-family",fontax).style("font-size",faxylab);
			    focus.append("circle").attr("class","pan").attr("cx",xscl(dates[idx])).attr("cy",val).attr("r",ratio*10).style("fill",colors[k]).style("opacity",0.3); 
			    focus.append("line").attr("class","pan").attr("x1",0).attr("y1",val).attr("x2",w).attr("y2",val)
				.style("stroke",fg).style("stroke",colors[k]).style("opacity",0.6).style("stroke-dasharray",("5,5"));
			    focus.append("circle").attr("class","pan").attr("cx",xscl(dates[idx])).attr("cy",val).attr("r",ratio*3).style("fill",colors[k]).style("stroke",fg).style("opacity",0.75); 
			}
		    }
		});
	}
    }
    // INITIAL DRAW
    graphit(st,ed,true,true);//initial draw

    // ############ INIT INVARIANT X AXIS and BRUSH + ZOOM
    // draw and style x axis and ticks
    prev.append("g").attr("class", "axis-x").attr("transform","translate(0,"+h2+")").call(xAxis2);
    prev.select(".axis-x").selectAll(".tick text").style("fill",cynd).style("font-family",fontax).style("font-size",paxxlab); prev.select(".axis-x").selectAll(".domain").style("stroke",cyn).style("stroke-width",2)
    prev.select(".axis-x").selectAll(".tick line").style("stroke",cyn).style("stroke-width",2);

    focus.append("g").attr("class", "axis-x").attr("transform","translate(0,"+h+")").call(xAxis);
    focus.select(".axis-x").selectAll(".tick text").style("fill",cynd).style("font-family",fontax).style("font-size",faxxlab); focus.select(".axis-x").selectAll(".domain").style("stroke",cyn).style("stroke-width",2);
    focus.select(".axis-x").selectAll(".tick line").style("stroke",cyn).style("stroke-width",2);
    
    // setting up brush and zoom
    var brush = d3.brushX().extent([[0,-4],[w,h2]]).on("brush", brushed).on("end", brushend);

    prev.append("g").attr("class","brush").call(brush);//.call(brush.move,xscl.range());
    prev.select(".brush .selection").attr("fill","navy").style("opacity",.4);
    prev.select(".brush .overlay").style("opacity",0);  prev.selectAll(".brush .handle").style("opacity",0);

    var zoom = d3.zoom().scaleExtent([1, Infinity]).translateExtent([[0,0],[w,h]]).extent([[0,0],[w,h]]).on("zoom",null);// only for scrolling events, we don't want the classic zoom scaling on both sides
    prev.call(zoom).on("wheel.zoom",rgtzoom);//.on("MozMousePixelScroll.zoom",rgtzoom);
    
    function brushed() {
	if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom
	var s=d3.event.selection || xscl2.range();
	focus.selectAll(".pan").remove(); xscl.domain(s.map(xscl2.invert, xscl2));
	
	var std=xscl.domain()[0],edd=xscl.domain()[1],ik=0,il=0;
	edd=d3.timeHour.offset(edd,2);std=d3.timeHour.offset(std,2);
	while(bld.rn.indexOf(String(std.toISOString().substr(0,10)))==-1 && ik<bld.rn.length){ std=d3.timeDay.offset(std,1);ik++; }
	while(bld.rn.indexOf(String(edd.toISOString().substr(0,10)))==-1 && il<bld.rn.length){ edd=d3.timeDay.offset(edd,1);il++; }
	st=bld.rn.indexOf(std.toISOString().substr(0,10));ed=bld.rn.indexOf(edd.toISOString().substr(0,10)); xscl.domain([std,edd]);// re-adjust domain 

	d3.select("#lin-"+name).node().value=std.toISOString().substr(0,10);d3.select("#rin-"+name).node().value=edd.toISOString().substr(0,10);xscl.domain([std,edd]);// re-adjust domain and input
	focus.select(".axis-x").call(xAxis); focus.select(".axis-x").selectAll(".tick text").style("fill",cynd).style("font-family",fontax).style("font-size",faxxlab)
	focus.select(".axis-x").selectAll(".domain").style("stroke",cyn).style("stroke-width",2);
	focus.select(".axis-x").selectAll(".tick line").style("stroke",cyn).style("stroke-width",2);
	graphit(st,ed,false,false);
	
    }
    function brushend() {
	if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom
	var s=d3.event.selection || xscl2.range();
	focus.selectAll(".pan").remove(); xscl.domain(s.map(xscl2.invert, xscl2));
	
	var std=xscl.domain()[0],edd=xscl.domain()[1],ik=0,il=0;
	edd=d3.timeHour.offset(edd,2);std=d3.timeHour.offset(std,2);
	while(bld.rn.indexOf(String(std.toISOString().substr(0,10)))==-1 && ik<bld.rn.length){ std=d3.timeDay.offset(std,1);ik++; }
	while(bld.rn.indexOf(String(edd.toISOString().substr(0,10)))==-1 && il<bld.rn.length){ edd=d3.timeDay.offset(edd,1);il++; }
	st=bld.rn.indexOf(std.toISOString().substr(0,10));ed=bld.rn.indexOf(edd.toISOString().substr(0,10)); xscl.domain([std,edd]);// re-adjust domain 

	d3.select("#lin-"+name).node().value=std.toISOString().substr(0,10);d3.select("#rin-"+name).node().value=edd.toISOString().substr(0,10);xscl.domain([std,edd]);// re-adjust domain and input
	focus.select(".axis-x").call(xAxis);focus.select(".axis-x").selectAll(".tick text").style("fill",cynd).style("font-family",fontax).style("font-size",faxxlab);focus.select(".axis-x").selectAll(".domain").style("stroke",cynd).style("stroke-width",2);
	focus.select(".axis-x").selectAll(".tick line").style("stroke",cyn).style("stroke-width",2);	
	graphit(st,ed,false,true);
    }

    function rgtzoom(){
	focus.selectAll(".pan").remove();
	var ndscrl; //scrolling nb of days should be proportional to the number of data, 10 yrs, 2500, each should move 25 days (min 1d)

	if(d3.brushSelection(prev.select(".brush").node())!=null){ // if no brush don't zoom
	    var s=d3.brushSelection(prev.select(".brush").node());
	    // firefox requires d3.event.deltaY
	    // console.log(d3.event.wheelDeltaY); on chrome but deltaY ok
	    if(d3.event.deltaY>0) ndscrl=-Math.round(bld.vec[0].length/100)+1; else ndscrl=Math.round(bld.vec[0].length/100)+1;
	    
	    var nwdt=d3.timeDay.offset(xscl2.invert(s[1]),ndscrl);
	    if(Math.ceil(Math.abs(nwdt.getTime()-xscl.domain()[0].getTime())/(1000*3600*24))>Math.abs(ndscrl)){
	       
		if(nwdt<=xscl2.domain()[1] && nwdt>=xscl2.domain()[0]) prev.select(".brush").call(brush.move,[s[0],xscl2(d3.timeDay.offset(xscl2.invert(s[1]),ndscrl))]);
		else console.log("ALL");
	    }else{ prev.select(".brush").call(brush.move,null); }
	}
    }

}
