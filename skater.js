// we need an 'aggregator' i.e the field that will determine a color
// we need an 'informator' i.e the list of fields that will display on point
// we need a  'plotter'    i.e the list of fields to be plotted (multiplot)
// if multi aggr, see directly with the tablity aggregator, let's assume only one column determines the color

// skater('gph1',"$name"dt,ww,wh,'"$title"','"$source"','"$xax"','"$categy"','"$pts"','"$lns"','"$tgs"')
function skater(name,df,wth,hgt,title,src,xax,aggr,seri,ln,tgs,target,vals,redln,blueln){

    // ########################### STYLING MAIN PARAMS (margins, fonts, label size)
    // margins [0]: top, [1]: right, [2]: bottom (space between charts), [3]: left margin
    var mg=[],ptch=[0,1,4,5,8,9]; mg[0]=hgt*.05; mg[1]=wth*.04; mg[2]=hgt*.1; mg[3]=wth*.045;
    var margin={top:mg[0]*1.8,right:mg[1],bottom:mg[2],left:mg[3]}; var h=hgt-margin.top-margin.bottom,w=wth-margin.left-margin.right;
    var fontax="Helvetica", fontg="Calibri"; 

    // colors
    if(bg==undefined)  var bg="#ffffff";  if(fg==undefined)  var fg="#47525C";  if(red==undefined) var red="#C00000";
    if(grn==undefined) var grn="#006600"; if(ylw==undefined) var ylw="#CC8C00"; if(blu==undefined) var blu="#002060";
    if(mag==undefined) var mag="#7BB8D9"; if(cyn==undefined) var cyn="#7F7F7F"; if(wht==undefined) var wht="#dbd7b8";
    if(bwht==undefined) var bwht="#dfdfdf";    
    var colors=[blu,cyn,ylw,red,grn,mag,"#003893","#E2BC13","#CE1126","#7BB8D9","#800080","#778899","#B22222","#9ACD32","#FFA500","#2F4F4F","#000000","#8B008B","#C71585","#008B8B","#ADFF2F","#20B2AA","#CD853F","#C71587","#4682B4"];

    // ########################### MAIN DIV
    if(d3.select("#"+name).node()==null)
	d3.select("body").append("div").attr("id",name+"-dv").style("margin-left","2em").style("margin-top","3em").style("position","relative");//position relative to place absolute objects
    else
	d3.select("#"+name).append("div").attr("id",name+"-dv").style("margin-left","2em").style("margin-top","3em").style("position","relative");//position relative to place absolute objects
 
    // initialize dimensions and margins
    var svg=d3.select("#"+name+"-dv").append("svg").attr("id",name+"-svg").attr("width",wth).attr("height",hgt);
    // main chart areas + definitions (clip-path)
    svg.append("defs").append("clipPath").attr("id","clip").append("rect").attr("width",w+margin.left+margin.top).attr("height",h);
    var focus=svg.append("g").attr("class","focus").attr("transform","translate("+margin.left+","+margin.top+")");

    // masked area
    var mfocus=svg.append("g").attr("class","mfocus").attr("transform","translate("+margin.left+","+margin.top+")").attr("clip-path","url(#clip)");
    
    // zoom
    // var zoom=d3.zoom().scaleExtent([1, Infinity]).extent([[0,0],[w,h]]).on("zoom",zoomer);//.on("end",zoomerend);
    var zoom=d3.zoom().scaleExtent([-100, Infinity]).extent([[0,0],[w,h]]).on("zoom",zoomer);//.on("end",zoomerend);
    svg.call(zoom);


    // console.log("update 11");

    // define arrows
    svg.append("svg:defs")
	.append("svg:marker")
	.attr("id", "arrow_grn")
	.attr("viewBox", "-5 -5 15 15")
	.attr("refX", 10)
	.attr("refY", 0)
	.attr("markerWidth", 8)
	.attr("markerHeight", 8)
	.attr("orient", "auto")
	.append("svg:path")
	.attr("d", "M0,-5L10,0L0,5").attr("fill",grn);

    svg.append("svg:defs")
	.append("svg:marker")
	.attr("id", "arrow_blu")
	.attr("viewBox", "-5 -5 15 15")
	.attr("refX", 10)
	.attr("refY", 0)
	.attr("markerWidth", 8)
	.attr("markerHeight", 8)
	.attr("orient", "auto")
	.append("svg:path")
	.attr("d", "M0,-5L10,0L0,5").attr("fill",blu);

    svg.append("svg:defs")
	.append("svg:marker")
	.attr("id", "arrow_red")
	.attr("viewBox", "-5 -5 15 15")
	.attr("refX", 10)
	.attr("refY", 0)
	.attr("markerWidth", 8)
	.attr("markerHeight", 8)
	.attr("orient", "auto")
	.append("svg:path")
	.attr("d", "M0,-5L10,0L0,5").attr("fill",red);

    /*
    svg.append("svg:defs")
	.append("svg:marker")
	.attr("id", "arrow_blu")
	.attr("viewBox", "0 -5 10 10")
	.attr("refX", 15)
	.attr("refY", 0)
	.attr("markerWidth", 5)
	.attr("markerHeight", 5)
	.attr("orient", "auto")
	.append("svg:path")
	.attr("d", "M0,-5L10,0L0,5").attr("fill",blu);
    */

    // params
    //var xax=3,xtitle=df.cn[xax],series=[4],lns=[5],aggr=0,inform=[2,3,4]; var nc=df.cn.length, nr=df.vec[0].length; var src="source: Bloomberg"; var ytitle=df.cn[series[0]];
    xax-=1; aggr-=1; var xtitle=df.cn[xax],series=seri.split(","),inform=tgs.split(","); var nc=df.cn.length, nr=df.vec[0].length; 
    // adjustment for indexation from 1
    for(var i=0;i<series.length;i++) series[i]-=1;
    var ytitle=df.cn[series[0]];
    
    if(ln!=""){ var lns=ln.split(","); for(var i=0;i<lns.length;i++) lns[i]-=1; }
    else var lns=[];
    for(var i=0;i<inform.length;i++) inform[i]-=1; 

    // compute line data aggregates
    function abs(x){ if(x<0) return -x; else return x; }
    if(lns.length>0){
	var aln={},tgts={},mxpts={};
	for(var i=0;i<nr;i++){
	    
	    if(aln[df.vec[aggr][i]]==undefined) aln[df.vec[aggr][i]]=[]; aln[df.vec[aggr][i]].push({x:df.vec[xax][i],y:df.vec[lns[0]][i]});
	    
	    if(target){
		if(tgts[df.vec[aggr][i]]==undefined){
		    tgts[df.vec[aggr][i]]=df.vec[series[0]][i]-df.vec[lns[0]][i];
		    mxpts[df.vec[aggr][i]]={x:df.vec[xax][i],y:df.vec[series[0]][i] };
		}// init distance in new category
		for(var k=0;k<series.length;k++){
		    if(tgts[df.vec[aggr][i]]<df.vec[series[k]][i]-df.vec[lns[0]][i]){
			tgts[df.vec[aggr][i]]=df.vec[series[k]][i]-df.vec[lns[0]][i];
			mxpts[df.vec[aggr][i]]={x:df.vec[xax][i],y:df.vec[series[k]][i] };
		    }
		}
	    }
	}
    }
    
    // attribute colors to the cluster -> legends
    var aclr={},k=0; for(var i=0;i<nr;i++){ if(aclr[df.vec[aggr][i]]==undefined){ aclr[df.vec[aggr][i]]=colors[k]; k++; } }// console.log(aclr);

    // ########################### AXIS WORK
    // axis -> compute min max if numbers (we'll start with numbers: no min max or range with labels)
    var pymx=df.vec[series[0]][0],pymn=pymx;
    for(var j=0;j<series.length;j++){
	for(var i=0;i<nr;i++){ if(pymx<df.vec[series[j]][i]) pymx=df.vec[series[j]][i]; if(pymn>df.vec[series[j]][i]) pymn=df.vec[series[j]][i]; } }

    if(lns.length>0){
	// curve compute
	var cymx=df.vec[lns[0]][0],cymn=cymx;
	for(var j=0;j<lns.length;j++){
	    for(var i=0;i<nr;i++){ if(cymx<df.vec[lns[j]][i]) cymx=df.vec[lns[j]][i]; if(cymn>df.vec[lns[j]][i]) cymn=df.vec[lns[j]][i]; } }
    }else{ var cymx=pymx,cymn=pymn; }
    var ymx,ymn; if(pymx>cymx) ymx=pymx; else ymx=cymx; if(pymn<cymn) ymn=pymn; else ymn=cymn;

    xmx=df.vec[xax][0],xmn=xmx;for(var i=0;i<nr;i++){ if(xmx<df.vec[xax][i]) xmx=df.vec[xax][i]; if(xmn>df.vec[xax][i]) xmn=df.vec[xax][i]; }
    var xext=(xmx-xmn),yext=(ymx-ymn),xmgn=0.05,ymgn=0.05;
    
    // setup scales and domains + ticks, but we want to avoid points on axis (later)
    var xscl=d3.scaleLinear().range([0,w]); xscl.domain([xmn-xmgn*xext,xmx]),xAxis=d3.axisBottom(xscl).ticks(8).tickSize(-h);
    var yscl=d3.scaleLinear().range([h,0]); yscl.domain([ymn-ymgn*yext,ymx]),yAxis=d3.axisLeft(yscl).ticks(8).tickSize(-w);
    yAxis.tickSizeOuter(.8); xAxis.tickSizeOuter(.8);

    // style axis X&Y
    var faxylab=".9em",faxxlab=".9em";
    focus.append("g").attr("class", "axis-x").attr("transform","translate(0,"+h+")").call(xAxis).style("font-family",fontax).style("font-size",faxxlab);
    svg.append("text").attr("x",w+margin.left).attr("y",h+margin.top+10).text(xtitle).attr("dy","1.8em").style("text-anchor","end").attr("id","xtitle").style("fill",blu).attr("font-family",fontax);
    focus.select(".axis-x").selectAll(".tick text").style("fill",blu);
    focus.select(".axis-x").selectAll(".domain").style("stroke",blu).style("stroke-width",2);
    focus.select(".axis-x").selectAll(".tick line").style("stroke",blu).style("stroke-width",.6).style("stroke-dasharray",("3,3"));

    focus.append("g").attr("class", "axis-y").call(yAxis).attr("font-family",fontax).style("font-size",faxylab);
    svg.append("text").attr("transform","rotate(-90)").attr("y",margin.left).attr("x",-0.4*margin.top).text(ytitle).attr("dy","-1.2em").style("text-anchor","end").attr("id","ytitle").style("fill",red).attr("font-family",fontax);
    focus.select(".axis-y").selectAll(".tick text").style("fill",red);
    focus.select(".axis-y").selectAll(".domain").style("stroke",red).style("stroke-width",2);
    focus.select(".axis-y").selectAll(".tick line").style("stroke",red).style("stroke-width",.6).style("stroke-dasharray",("3,3"));

    // ########################### INFORMATIVE DISPLAY
    // source
    svg.append("text").attr("class","source").attr("id","source-"+name).attr("x",(w/2)+margin.left).attr("y",h+margin.top+.8*margin.bottom)
	.attr("text-anchor","middle").text(src).style("fill",cyn);

    // tips (on mouse over)
    var tip=d3.tip().attr("class","d3-tip").offset([-10,0])
	.html(function(d){
	    var i=d3.select(this).attr("i"),str="";
	    for(var k=0;k<inform.length;k++){ str=str+"<b>"+df.cn[inform[k]]+"</b>:"+df.vec[inform[k]][i]+"<br/>"; }
	    return str;
	});
    svg.call(tip);
    
    // preview declarations
    var magn,prev,pxscl,pyscl,pxAxis,pyAxis,ratio=5,isprev=false;

    // var redln=4, blueln=0.3;

    // ########################### DRAW POINTS
    function skate(xscl,yscl,csz, redln, blueln){

	// console.log(redln+":"+blueln+" ---2");
	d3.selectAll(".spt"+name).remove(); d3.selectAll(".lab").remove(); 
	d3.selectAll(".line_last").remove(); d3.selectAll(".line_dlast").remove(); 

	d3.select(".axis-x").call(xAxis.scale(xscl)); d3.select(".axis-y").call(yAxis.scale(yscl));
	focus.select(".axis-x").selectAll(".tick text").style("fill",blu); focus.select(".axis-y").selectAll(".tick text").style("fill",red);
	focus.select(".axis-y").selectAll(".tick line").style("stroke",red).style("stroke-width",.6).style("stroke-dasharray",("3,3"));
	focus.select(".axis-x").selectAll(".tick line").style("stroke",blu).style("stroke-width",.6).style("stroke-dasharray",("3,3"));
	var line=d3.line().x(function(d){ return xscl(d.x); }).y(function(d){ return yscl(d.y); });

	if(target){
	    for(cat in mxpts){
		//console.log(test+":"+JSON.stringify(mxpts[test]));
		mfocus.append("circle").attr("class","sptg"+name+" "+cat)
		    .attr("cx",xscl(mxpts[cat].x)).attr("cy",yscl(mxpts[cat].y)).attr("r",4)
		    .attr("x",mxpts[cat].x).attr("y",mxpts[cat].y).attr("stroke","red").attr("fill","none").style("opacity",0.8);
	    }
	}
	
	// actual plot of points
	for(var j=0;j<series.length;j++){
	    for(var k=0;k<(nr-1);k++){
		// add the line k as attribute to retrieve the information in the tip
		mfocus.append("circle").attr("class","spt"+name+" "+df.vec[aggr][k])
		    .attr("cx",xscl(df.vec[xax][k])).attr("cy",yscl(df.vec[series[j]][k])).attr("r",csz).attr("i",k)
		    .attr("x",df.vec[xax][k]).attr("y",df.vec[series[j]][k]).attr("fill",aclr[df.vec[aggr][k]]).style("opacity",0.8)
		    .on("mouseover",tip.show).on("mouseout",tip.hide);
	    }
	    mfocus.append("circle").attr("class","spt"+name+" "+df.vec[aggr][(nr-1)])
		.attr("cx",xscl(df.vec[xax][(nr-1)])).attr("cy",yscl(df.vec[series[j]][(nr-1)])).attr("r",2*csz).attr("i",(nr-1))
		.attr("x",df.vec[xax][(nr-1)]).attr("y",df.vec[series[j]][(nr-1)]).attr("fill",aclr[df.vec[aggr][(nr-1)]]).style("opacity",0.8)
		.on("mouseover",tip.show).on("mouseout",tip.hide);
	    var lstx=df.vec[xax][(nr-1)],lsty=df.vec[series[j]][(nr-1)];
	    // console.log(lstx + ':' + lsty+ ":" + (lsty+redln));
	    mfocus.append("path").attr("class","line_last").attr("id","line_last_x").style("stroke",red).style("stroke-width",3).attr("d",line([{x:lstx,y:lsty},{x:lstx,y:(lsty+redln)}])).attr("marker-end","url(#arrow_red)");
	    mfocus.append("path").attr("class","line_last").attr("id","line_last_y").style("stroke",blu).style("stroke-width",3).attr("d",line([{x:lstx,y:lsty},{x:(lstx+blueln),y:lsty}])).attr("marker-end","url(#arrow_blu)");
	    mfocus.append("path").attr("class","line_last").attr("id","line_last_xy").style("stroke",grn).style("stroke-width",3).attr("d",line([{x:lstx,y:lsty},{x:(lstx+blueln),y:(lsty+redln)}])).attr("marker-end","url(#arrow_grn)");
	    mfocus.append("path").attr("class","line_dlast").style("stroke",cyn).style("stroke-width",1).attr("d",line([{x:lstx,y:(lsty+redln)},{x:(lstx+blueln),y:(lsty+redln)}])).style("stroke-dasharray",("3,3"));
	    mfocus.append("path").attr("class","line_dlast").style("stroke",cyn).style("stroke-width",1).attr("d",line([{x:(lstx+blueln),y:lsty},{x:(lstx+blueln),y:(lsty+redln)}])).style("stroke-dasharray",("3,3"));

	    svg.append("text").attr("class","lab").attr("x",xscl(lstx)+margin.left).attr("y",(h+margin.bottom*1.1)).text(Math.round(lstx*1000)/1000).style("fill",blu).style("font-size",".75em")
	    svg.append("text").attr("class","lab").attr("x",-0.05*margin.left).attr("y",yscl(lsty)+margin.top).text(Math.round(lsty*1000)/1000).style("fill",red).style("font-size",".75em")
	}

	for(cat in aln){
	    mfocus.append("path").attr("class","line "+cat).attr("id","ln-"+j).style("stroke",aclr[cat]).style("stroke-width",2).attr("d",line(aln[cat]));
	    // console.log(aln[cat]);
	}

    }
    // ########################### ZOOM FUNCTIONS
    // performances are lower if we redraw everything
    function zoomerend(){
	d3.selectAll(".spt"+name).remove(); d3.selectAll(".lab").remove(); 
	d3.selectAll(".line_last").remove(); d3.selectAll(".line_dlast").remove(); 

	nxscl=d3.event.transform.rescaleX(xscl); nyscl=d3.event.transform.rescaleY(yscl);
	skate(nxscl,nyscl,2*d3.event.transform.k,redln, blueln);//console.log(d3.event.transform.k);
    }
    // way better perf
    function zoomer(){
	if(!isprev){ isprev=true; prev(); } // if we zoom for the first time we init preview
	nxscl=d3.event.transform.rescaleX(xscl); nyscl=d3.event.transform.rescaleY(yscl);
	d3.select(".axis-x").call(xAxis.scale(d3.event.transform.rescaleX(xscl)));
	d3.select(".axis-y").call(yAxis.scale(d3.event.transform.rescaleY(yscl)));
	focus.select(".axis-x").selectAll(".tick text").style("fill",blu); focus.select(".axis-y").selectAll(".tick text").style("fill",red);
	focus.select(".axis-y").selectAll(".tick line").style("stroke",red).style("stroke-width",.8).style("stroke-dasharray",("3,3"));
	focus.select(".axis-x").selectAll(".tick line").style("stroke",blu).style("stroke-width",.8).style("stroke-dasharray",("3,3"));
	mfocus.selectAll(".spt"+name).attr("transform",d3.event.transform);// move all points
	mfocus.selectAll(".sptg"+name).attr("transform",d3.event.transform);// move all points
	mfocus.selectAll(".line").attr("transform",d3.event.transform);// move curve
	mfocus.selectAll(".line_last").attr("transform",d3.event.transform);// move curve
	mfocus.selectAll(".line_dlast").attr("transform",d3.event.transform);// move curve
	svg.selectAll(".lab").attr("transform",d3.event.transform);// move curve

	// draw zoom area in preview
	// not there yet, issue y 
	prev.selectAll(".prect").remove();
	prev.append("rect").attr("class","prect").attr("x",function(){ return pxscl(nxscl.domain()[0]); })
	    .attr("y",function(){ return pyscl(nyscl.domain()[0])-(pyscl(nyscl.domain()[0])-pyscl(nyscl.domain()[1])); })
	    .attr("width",(pxscl(nxscl.domain()[1])-pxscl(nxscl.domain()[0])))
	    .attr("height",(pyscl(nyscl.domain()[0])-pyscl(nyscl.domain()[1])))
	    .attr("fill",blu).style("opacity",.3);
    }
    // ########################### LEGENDS
    function lgds(){
	var i=0;
	for(var k in aclr){
	    var key=k.split(' ').join('.'); // clean labels
	    svg.append("text").attr("class","leg").attr("id","lg-"+name+"-"+k)
		.attr("x",function(){ return 1.45*margin.left+i*w/(Object.keys(aclr).length+1); }).attr("y",function(){ return (.10*h); })
		.text(k).style("fill",cyn).style("font-size",".85em").attr("key",key)
	    	.on("mouseover",function(){
		    mfocus.selectAll(".spt"+name).style("opacity",0.2); mfocus.selectAll(".line").style("opacity",0.2);
		    mfocus.selectAll("."+d3.select(this).attr("key")).style("opacity",1).attr("r",4);
		})
		.on("mouseout",function(){ mfocus.selectAll(".spt"+name).style("opacity",1).attr("r",2.5);mfocus.selectAll(".line").style("opacity",1); });
	    svg.append("circle").attr("class","cleg").attr("id","clg-"+name+"-"+k)
		.attr("cx",function(){ return 1.15*margin.left+i*w/(Object.keys(aclr).length+1); }).attr("cy",function(){ return (.085*h); })
		.attr("r",5).style("fill",aclr[k]).attr("key",key)
	    	.on("mouseover",function(){
		    mfocus.selectAll(".spt"+name).style("opacity",0.2); mfocus.selectAll(".line").style("opacity",0.2);
		    mfocus.selectAll("."+d3.select(this).attr("key")).style("opacity",1).attr("r",4);
		})
		.on("mouseout",function(){ mfocus.selectAll(".spt"+name).style("opacity",1).attr("r",2.5); mfocus.selectAll(".line").style("opacity",1); });
	    i++;
	}
    }
    // ########################### PREVIEW ON ZOOM OR TRANSLATE
    // preview (video game map style)
    function prev(){
	var magn=svg.append("g").attr("class","magn").attr("transform","translate("+(margin.left*.5+w-w/ratio)+","+1.2*margin.top+")");
	svg.append("defs").append("clipPath").attr("id","pclip").append("rect").attr("width",w/ratio+2).attr("height",h/ratio+2);
	// masked area
	prev=svg.append("g").attr("class","prev").attr("transform","translate("+(margin.left*.5+w-w/ratio)+","+1.2*margin.top+")")
	    .attr("clip-path","url(#pclip)");
	pxscl=d3.scaleLinear().range([0,w/ratio]); pxscl.domain([xmn-xmgn*xext,xmx]),pxAxis=d3.axisBottom(pxscl).ticks(3).tickSize(-h/ratio);
	pyscl=d3.scaleLinear().range([h/ratio,0]); pyscl.domain([ymn-ymgn*yext,ymx]),pyAxis=d3.axisLeft(pyscl).ticks(3).tickSize(-w/ratio);
	var tksyp=d3.range(pyscl.domain()[0],pyscl.domain()[1],(pyscl.domain()[1]-pyscl.domain()[0])/3);// tick domain/range
	var tksxp=d3.range(pxscl.domain()[0],pxscl.domain()[1],(pxscl.domain()[1]-pxscl.domain()[0])/3);
	pxAxis.tickValues(tksxp); pxAxis.tickSizeOuter(.5);
	pyAxis.tickValues(tksyp); pyAxis.tickSizeOuter(.5); // hard mgmt of ticks

	// style axis
	var faxylab="1em",faxxlab="1em";
	prev.append("g").attr("class", "paxis-x").attr("transform","translate(0,"+h/ratio+")").call(pxAxis).selectAll("text").remove();
	prev.select(".paxis-x").selectAll(".domain").style("stroke",cyn).style("stroke-width",1).style("opacity",.7);
	prev.select(".paxis-x").selectAll(".tick line").style("stroke",cyn).style("stroke-width",.6);//.style("stroke-dasharray",("3,3"));

	prev.append("g").attr("class", "paxis-y").call(pyAxis).selectAll("text").remove();//("font-family",fontax);//.style("font-size",faxylab);
	prev.select(".paxis-y").selectAll(".domain").style("stroke",cyn).style("stroke-width",1).style("opacity",.7);
	prev.select(".paxis-y").selectAll(".tick line").style("stroke",cyn).style("stroke-width",.6);

	// closing preview border
	prev.append("line").attr("class","ul").attr("x1",0).attr("y1",pyscl(pyscl.domain()[1])).attr("x2",w/ratio).attr("y2",pyscl(pyscl.domain()[1])).style("stroke",cyn).style("opacity",.7);
	prev.append("line").attr("class","rl").attr("x1",pxscl(pxscl.domain()[1])).attr("y1",0).attr("x2",pxscl(pxscl.domain()[1])).attr("y2",h/ratio).style("stroke",cyn).style("opacity",.7);

	for(var j=0;j<series.length;j++){
	    for(var k=0;k<nr;k++){
		prev.append("circle").attr("class","pspt"+name)
		    .attr("cx",pxscl(df.vec[xax][k])).attr("cy",pyscl(df.vec[series[j]][k])).attr("r",1.2)
		    .attr("fill",aclr[df.vec[aggr][k]]).style("opacity",0.8);
	    }
	}
	var line2=d3.line().x(function(d){ return pxscl(d.x); }).y(function(d){ return pyscl(d.y); });
	for(cat in aln){
	    prev.append("path").attr("class","line2").attr("id","ln2-"+j).style("stroke",aclr[cat]).style("stroke-width",1).attr("d",line2(aln[cat]));
	}
	
    }
    // ########################### INIT: LEGENDS AND POINTS
    lgds(); skate(xscl,yscl,2.5, redln, blueln);// init drawing
}

