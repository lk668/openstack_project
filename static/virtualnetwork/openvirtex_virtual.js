var VMID;       //虚拟机id，区分虚拟机
var RTID;       //路由器
var FWID;       //防火墙
var SWID;       //交换机
var LBID;       //负载均衡器
/***用户生成网络拓扑所存数据***/
var vmCluster = [];//
var switchNetwork = [];
var loadBanlancerName = [];
var RouterName = [];
var ClusterInfo = [];  //集群信息
var LBInfo = []; //负载均衡器信息
var VMInfo = [];
var FWInfo = [];
var RTInfo = [];
var NETInfo = [];
var ClusterNetworkInfo= [];
var LBNetworkInfo = [];
var RouterNetworkInfo = [];

var TopoJson = {};   //整体拓扑JSON全部数据
var ClusterJson = [];
var NetworksJson = [];
var RoutersJson = [];
var LoadBalancersJson = [];
var FireWallsJson = [];
var KeyPairsJson = [];
var ClusterNetworkJson = [];
var FWrules = []; 
var rulesRow = 0;

var lbNetworkData = [];
var ClusterNetworkData = [];
var RouterNetworkData = [];
/***从服务器获取网络状态信息保存的数据**/
var serversInfo = [];
var portsInfo = [];
var networksInfo = [];
var routerInfo = [];
/******服务器获取信息的对应数据*****/
var VmLink = [];
var switchLink = [];
var lbLink = [];
var routerLink = [];

var parseData;
var ClusterCounter = 0;

var physicalTopo;
var switch_id = [];
var host_switch = [];
var autoHostList = [];
var autoSwitchList = [];
var switchRoutes = [];
var switch_vSwitch_ports = [];
var vSwitchLinks = [];
var virtualLink = [];
var host_vSwitch_links = [];
var x_loc;
var y_loc;
var shc_connections;
var switch_host_cpu = [];
var butId;

var ryuLinks = [];  //ryu选路的路线
var topoInfo;   //整理好的虚拟拓扑信息

var center_left = 400;
var center_top = 300;
var circle_r = 200;

var d3_nodes = []
var d3_edges = []

function init_switch_host_cpu(){
	switch_host_cpu.length = 0;
	for(var i = 0;i<=10;i++)
        {
	var s_h_c = {
		"swid":"Switch"+i,
		"hostCount":0,
		"cpuUtil":100
	}
	switch_host_cpu.push(s_h_c);
        }
	console.log(switch_host_cpu);
}
function getData(){
	xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function(){
    if(xmlhttp.readystate == 4)
        {
           if(xmlhttp.status==200 )
                {
                    console.log(xmlhttp.responseText);
                }
                else
                {
                    console.log("Request was unsuccessful: "+ xmlhttp.status);
                }
       }
    }
	xmlhttp.open("GET","getVirtualTopo",false);
	xmlhttp.send();
	return xmlhttp.responseText;
}

function postData(obj,url){
	payload = obj;
	xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function()
   {
          if (xmlhttp.readyState == 4)
          {
				      if((xmlhttp.status >= 200 &&xmlhttp.status < 300)||xmlhttp.status == 304){
					          alert(xmlhttp.responseText);
                }
                else {
                    alert("Request was unsuccessful: "+ xmlhttp.status);
                }
          }
   };
	xmlhttp.open("POST",url,true);
  //xmlhttp.setRequestHeader("Content-Type","application/x-www-form-urlencoded;");
  xmlhttp.setRequestHeader("X-CSRFToken",getCookie('csrftoken'));
	xmlhttp.send(payload);
    return xmlhttp.responseText;
}


function getCookie(name){
	var cookieValue = null;
	if (document.cookie && document.cookie != ''){
		var cookies = document.cookie.split(';');
		for ( var i in cookies){
			var cookie = jQuery.trim(cookies[i]);
			if (cookie.substring(0,name.length+1) == (name+'=')){
				cookieValue = decodeURIComponent(cookie.substring(name.length+1));
				break;
			}
		}
	}
	return cookieValue;
}
var localjson = {};

/***
 ***数组去重***
 ***/
function uniqueArray(data){  
data = data || [];  
var a = {};  
for (var i=0; i<data.length; i++) {  
var v = data[i];  
if (typeof(a[v]) == 'undefined'){  
    a[v] = 1;  
}  
};  
data.length=0;  
for (var i in a){  
data[data.length] = i;  
}  
return data;  
}  


function hostListCollection(sw_id,hostid)
{
  var dp_id;
  var mac_id;
  var port_id;
  for(var index in switch_id)
  {
    if(switch_id[index].swid == sw_id)
    {
      dp_id = switch_id[index].dpid;
    }
  }
  var temp = dp_id.substr(6);
  var tempMac = temp.substring(0,16);
  var macid = tempMac.concat(hostid);
  var hostInfo = {
          "dpid": dp_id,
          "mac": macid,
          "port": parseInt(hostid)
  }
  autoHostList.push(hostInfo);
  console.log("host列表");
  console.log(autoHostList);
}

function switchListCollection(sw_id)
{
  var dp_id;
  for(var index in switch_id)
  {
     if(switch_id[index].swid == sw_id)
    {
      dp_id = switch_id[index].dpid;
    }
  }

  autoSwitchList.push(dp_id);
  console.log("switch列表");
  console.log(autoSwitchList);
}

function switchVportsCollection(sw_id,vSw_id,port_id)
{
    var dp_id;
    for(var index in switch_id)
    {
       if(switch_id[index].swid == sw_id)
      {
        dp_id = switch_id[index].dpid;
      }
    }
    var s_v_p = {
      "dpid":dp_id,
      "vSid":vSw_id,
      "port":port_id[4],
    }
    switch_vSwitch_ports.push(s_v_p);
}
function linkListing()
{
      
	var connectionList = jsPlumb.getConnections();
       var connections = [];
              for (var index in connectionList)
            {

                connections.push(
                  {
                    "source":connectionList[index].sourceId,
                    "target":connectionList[index].targetId,
                    //"cidr": connectionList[index].getLabel()
                  }
                );
            }
       console.log(connections);
	shc_connections = connections;

}
function update_shc(){
        init_switch_host_cpu();	
	for(var index in shc_connections)
	  {
	    if(shc_connections[index].target[0]=='V')
               {
		 for(var innerdex in switch_host_cpu)
                   {
			if(shc_connections[index].source == switch_host_cpu[innerdex].swid)
				{
				   switch_host_cpu[innerdex].hostCount++;
				}
                   }	
               } 
  	    
	  }
        for(var index in switch_host_cpu)
	{
	  var hostcount = switch_host_cpu[index].hostCount;
	  switch_host_cpu[index].cpuUtil = 100 - hostcount*20;
	}
        console.log(switch_host_cpu);

}


function linkListCollection()
{
       var connectionList = jsPlumb.getConnections();
       var connections = [];
              for (var index in connectionList)
            {
                 
                connections.push(
                  {
                    "source":connectionList[index].sourceId,
                    "target":connectionList[index].targetId,
                    //"cidr": connectionList[index].getLabel()
                  }
                );
            }
            for (var index in connections)
            {
              if(connections[index].source[0] =='v' && connections[index].target[0] == 'v')
              {
                for (var i in switch_vSwitch_ports)
                {
                  if (connections[index].source == switch_vSwitch_ports[i].vSid)
                  {
                    var srcPort = {
                      "dpid" : switch_vSwitch_ports[i].dpid,
                      "port" : parseInt(switch_vSwitch_ports[i].port),
                    }
                    for( var j in switch_vSwitch_ports)
                    {
                      if (connections[index].target == switch_vSwitch_ports[j].vSid)
                      {
                        var dstPort = {
                          "dpid" : switch_vSwitch_ports[j].dpid,
                          "port" : parseInt(switch_vSwitch_ports[j].port),
                        }
                      }
                    }  
                    var linkInfo = {
                      "src" : srcPort,
                      "dst" : dstPort
                    }
                    vSwitchLinks.push(linkInfo);
                  }
                }
              }
            }
  console.log(connections);
  console.log(switch_vSwitch_ports);
  console.log(vSwitchLinks);
}

function manualSwitchListCollection(){
	var temp_switch_list = [];
    for(var index in switch_vSwitch_ports)
	{
		temp_switch_list.push(switch_vSwitch_ports[index].dpid);
	}
    var manual_switch_list = uniqueArray(temp_switch_list);
	console.log("switch list");
	console.log(manual_switch_list);
	return manual_switch_list;

}
/**************
*******jsPlumb initial block*******
***************/

jsPlumb.ready(function() 
{

	var Idx = {
		'Instance':0,
		'Connection':0,
		'Name':0,
	};

jsPlumb.importDefaults(
{
Connector:"Flowchart",
//Connector:"Straight",
PaintStyle : 
{
lineWidth:4,
strokeStyle: '#56ABE4'
},
DragOptions : { cursor: "crosshair" },
 ConnectionsDetachable:false,
});
function params(self) 
{
		  return {
		  parent: self,
			endpoint: 'Blank',//Work around for connection deletion
			deleteEndpointsOnDetach: true,
			maxConnections:-1,
			//uniqueEndpoint:true,
			anchor: 'Continuous',
		};
	}
  

  function addInstance(str_name,sw_id)
  {
		if(!Idx[str_name] || Idx[str_name] < 0)
		 {
			Idx[str_name] = 0;
     }
     var newItem = $('<div>').attr('id', str_name + Idx[str_name]).addClass(str_name);
     var title = $('<div>').addClass('title').text(str_name);
     var img = $('<img/>');
     var insId = str_name + Idx[str_name];      
      img.attr({"src":"/static/virtualnetwork/instance.svg","width":"50px","height":"50px"});     
      img.appendTo(newItem);       
        
			newItem.append(title);
     
			$("#mininet-container").append(newItem);
      $("#"+str_name + Idx[str_name]).css("top",(Math.floor($("#"+sw_id).offset().top)-150)+"px");
      $("#"+str_name + Idx[str_name]).css("left",(Math.floor($("#"+sw_id).offset().left)-150)+"px");
      
      var host_vSwitch_link = jsPlumb.connect({source:sw_id,
                     target:newItem,
                     endpoint:[ "Dot", { radius:2} ],
                     anchor:"AutoDefault",hoverPaintStyle:{ strokeStyle:"#FDB45C" }});
      host_vSwitch_link.bind("click",function(conn){
            //alert("选中"+conn.sourceId+"与"+conn.targetId+"之间的连接！");
            console.log(conn);
            if(conn._jsPlumb.paintStyle.strokeStyle == "#56ABE4")
            {
            conn.setPaintStyle({ strokeStyle:"#11CD6E" });
            var tempLink = {
              "src":conn.sourceId,
              "dst":conn.targetId
            }
            ryuLinks.push(tempLink);
            }
            else{
              conn.setPaintStyle({ strokeStyle:"#56ABE4" });
              for(var index in ryuLinks)
              {
                if(ryuLinks[index].src == conn.sourceId && ryuLinks[index].dst == conn.targetId)
                {
                  ryuLinks.splice(index,1);
                }
              }
            }
        
          });
      host_vSwitch_links.push(host_vSwitch_link);
      //console.log(host_vSwitch_links);


			jsPlumb.draggable(newItem, {
			  	containment: 'parent'
			});
			Idx[str_name]++;
      return insId;    
	}
		
		
	// function addSwitch(str_name,str_id)
	// {
	// 	if(!Idx[str_name] || Idx[str_name] < 0)
	// 	{
	// 		Idx[str_name] = 0;
	// 	}

	// 	var newSwitch = $('<div>').attr('id', str_name + Idx[str_name]).addClass(str_name)
	// 	var title = $('<div>').addClass('title').text( str_name + Idx[str_name]);
 //    		        var img = $('<img/>');
 //                      var tempswitch_id = {
 //                        "swid":str_name + Idx[str_name],
 //                        "dpid":str_id
 //                      }
 //                      img.attr({"src":"/static/virtualnetwork/switch.svg","width":"50px","height":"50px"});       
 //                      img.appendTo(newSwitch);  
 //                			newSwitch.append(title);
 //                			$("#mininet-container").append(newSwitch);
 //                			jsPlumb.makeTarget(newSwitch, params(newSwitch));
 //                			jsPlumb.makeSource(title, params(newSwitch));     
 //                			jsPlumb.draggable(newSwitch, {
 //                			  	containment: 'parent'
 //                			});

 //                			Idx[str_name]++;   
 //                      return tempswitch_id; 
	// }

   function vswitch_top(index,sum){
    var t = Math.floor(center_top+circle_r*Math.sin(Math.PI*2*index/sum));
    return t+"px";
  }

  function vswitch_left(index,sum){
    var l = Math.floor(center_left+circle_r*Math.cos(Math.PI*2*index/sum));
    return l+"px";
  }

  function addvSwitch(str_name,str_id,sum)
  {
    if(!Idx[str_name] || Idx[str_name] < 0)
    {
      Idx[str_name] = 0;
    }

    var newSwitch = $('<div>').attr('id', str_name + Idx[str_name]).addClass(str_name)
    var title = $('<div>').addClass('title').text( str_name + Idx[str_name]);
    var img = $('<img/>');
    var tempswitch_id = {
      "swid":str_name + Idx[str_name],
      "dpid":str_id
    }
    img.attr({"src":"/static/virtualnetwork/switch.svg","width":"50px","height":"50px"});       
    img.appendTo(newSwitch);  
    newSwitch.append(title);
    $("#mininet-container").append(newSwitch);
    $("#"+str_name + Idx[str_name]).css("top",vswitch_top(Idx[str_name],sum));
    $("#"+str_name + Idx[str_name]).css("left",vswitch_left(Idx[str_name],sum));
    jsPlumb.makeTarget(newSwitch, params(newSwitch));
    jsPlumb.makeSource(title, params(newSwitch));     
    jsPlumb.draggable(newSwitch, {
        containment: 'parent'
    });

    Idx[str_name]++;   
    return tempswitch_id; 
  }

        // function addRouter(str_name,sw_id,port_id)
        // {
        //         if(!Idx[str_name] || Idx[str_name] < 0)
        //         {
        //           Idx[str_name] = 0;
        //         }

        //         var newRouter = $('<div>').attr('id', str_name + Idx[str_name]).addClass(str_name);
        //         var vs_id = str_name + Idx[str_name];
        //         var title = $('<div>').addClass('title').text(port_id);
        //         var img = $('<img/>');      
        //            img.attr({"src":"/static/virtualnetwork/router.svg" ,"width":"30px","height":"30px"});   
        //            img.appendTo(newRouter);    
        //         newRouter.append(title);
        //         $("#mininet-container").append(newRouter);
        //         $('#'+vs_id).css("left", x_loc);
        //         $('#'+vs_id).css("top", y_loc-150);
        //         jsPlumb.connect({source:sw_id,
        //              target:newRouter,
        //              Connector:"Bezier",
        //              //connector : "Straight",  //设置连线为直线
        //              endpoint:[ "Dot", { radius:2} ],
        //              PaintStyle : {lineWidth:3,strokeStyle: '#11CD6E'},
        //              anchor:"AutoDefault"});  
        //         jsPlumb.makeTarget(newRouter, params(newRouter));
        //         jsPlumb.makeSource(title, params(newRouter));     
        //         jsPlumb.draggable(newRouter, {
        //             containment: 'parent'
        //         });

        //         Idx[str_name]++;    
        //         return vs_id;
        // }
/**********
交换机网络信息收集
***********/
$("#NetworkInfoCollection").click(function(){
     var json_networkname = document.getElementById("networksName");
     var json_networkcidr = document.getElementById("subnetIp");
      if(SWID){
        var Networkindex= parseInt(SWID[6]);
        NETInfo[Networkindex]={
          "name" : json_networkname.value,
          "cidr" : json_networkcidr.value
        }
        switchNetwork[Networkindex] = 
        {
                "switchId":SWID,
                "NetworkName":json_networkname.value                  
        }
         var jsonData = JSON.stringify(NETInfo[Networkindex]);
        
        console.log(jsonData);      
         }
else{
        NETInfo[0]={
          "name" : json_networkname.value,
          "cidr" : json_networkcidr.value
        }
         switchNetwork[0] = 
        {
                "switchId":"Switch0",
                "NetworkName":json_networkname.value                  
        }
 var jsonData = JSON.stringify(NETInfo[Networkindex]);
        console.log(jsonData);     
}    

});

$(document).mousemove(function(e)
      {
         x_loc = e.pageX;
         y_loc = e.pageY;
      });

$(".refreshCpu").click(function()
{
	console.log("click");

}
);

/***
***交换机右键菜单***
***/

// $(function(){
//     $('#mininet-container').contextMenu({
//         selector: '.Switch', 
//         items: {
//             "fold1a-key1": {name: "host-port1", icon: "edit",callback:function()
//             {
//               SWID=$(this).attr("id"); 
//               addInstance("VM","host1",SWID);
// 	      linkListing();
// 	      update_shc();
//               hostListCollection(SWID,"1");
//               switchListCollection(SWID);

//             }},
//             "fold1a-key2": {name: "host-port2", icon: "edit",callback:function()
//             {
//               SWID=$(this).attr("id"); 
//               addInstance("VM","host2",SWID);
// 		linkListing();
// 		update_shc();
//               hostListCollection(SWID,"2");
//               switchListCollection(SWID);
//             }},
//             "fold1a-key3": {name: "host-port3", icon: "edit",callback:function()
//             {
//               SWID=$(this).attr("id"); 
//               addInstance("VM","host3",SWID);
// 		linkListing();
// 		update_shc();
//               hostListCollection(SWID,"3");
//               switchListCollection(SWID);
//             }},
//             "fold1a-key4": {name: "host-port4", icon: "edit",callback:function()
//             {
//               SWID=$(this).attr("id"); 
//               addInstance("VM","host4",SWID);
// 		linkListing();
// 		update_shc();
//               hostListCollection(SWID,"4");
//               switchListCollection(SWID);
//             }},
//             "fold1a-key5": {name: "switch-port5", icon: "edit",callback:function()
//             {
//               SWID=$(this).attr("id");
//               var vsid = addRouter("vSwitch",SWID,"port5");
//               switchVportsCollection(SWID,vsid,"port5");
//             }},
//             "fold1a-key6": {name: "switch-port6", icon: "edit",callback:function()
//             {
//               SWID=$(this).attr("id");
//               var vsid = addRouter("vSwitch",SWID,"port6");
//                 switchVportsCollection(SWID,vsid,"port6");
//             }},
//             "fold1a-key7": {name: "switch-port7", icon: "edit",callback:function()
//             {
//               SWID=$(this).attr("id");
//               var vsid = addRouter("vSwitch",SWID,"port7");
//                 switchVportsCollection(SWID,vsid,"port7");
//             }},
//             "sep1": "---------",
//             "quit": {name: "Quit", icon: "quit",callback: $.noop}
//         } 
//     });



// });

// /***
// ***虚拟机右键菜单***
// ***/
// $(function(){
//     $('#mininet-container').contextMenu({
//         selector: '.VM', 
//         items: {
//             "edit": {name: "Edit", icon: "edit",callback:function()
//             {
//               VMID=$(this).attr("id");
//               $('#myModal').modal({keyboard: true});
//             }},

//             "delete": {name: "Delete", icon: "delete",callback: function()
//             {
//              VMID=$(this).attr("id");
//               jsPlumb.detachAllConnections($('#'+VMID));
//              $('#'+VMID).remove();
//              Idx['VM']--;
//             }},
//             "sep1": "---------",
//             "quit": {name: "Quit", icon: "quit",callback: $.noop}
//         } 
//     });
// });



function getNetworkInfo(swIds)
{
    var switchId;
    var cpu_util;
    var spc_index;
    for(var index in switch_id)
    {
         if(switch_id[index].swid == swIds)
         {
            switchId = switch_id[index].dpid;
         }
    }

     return "交换机ID: "+switchId+"<br>"+"名称: "+swIds;
}

function getHostInfo(hostid,hosts)
{
    var macId;
    var hostId;

    for(var index in hosts)
    {
         if(hosts[index].hostDomId == hostid)
         {
            hostId = hosts[index].hostId;
            macId = hosts[index].mac;
         }
    }

     return "主机ID: "+hostId+"<br>"+"MAC ID: "+macId;
}



  $("#clean").click(function() {
      cleanTopo();          
  });

function cleanTopo()
{
  $('svg').each(function(){
      $(this).remove();
   })

  ClusterCounter = 0;
  //  $('.host').each(function(){
  //     jsPlumb.detachAllConnections($(this));
  //     $(this).remove();
  //  })

  //  Idx['host']=-1;
  //  $('.Switch').each(function(){
  //     jsPlumb.detachAllConnections($(this));
  //     $(this).remove();
  //  })
  //  Idx['Switch']=-1;
    
  // $('.vSwitch').each(function(){
  //     jsPlumb.detachAllConnections($(this));
  //     $(this).remove();
  //  })
  Idx['vSwitch']=-1;
  autoHostList.length = 0;
  autoSwitchList.length = 0;
  switch_vSwitch_ports.length = 0;
  vSwitchLinks.length = 0;
  switch_id.length = 0;
  ryuLinks.length = 0;
  d3_nodes.length = 0;
  d3_edges.length = 0;
}

// function insert_box(type,message){
//   var label = ""
//   if(type =="Error"){
//     label = "danger";
//   }
//   else label = type.toLowerCase()
//   $(".navbar-custom-menu").append('<div class="alert alert-'+label+' alert-dismissible" role="alert"></div>')
//   $('.alert').html('<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>\
//       <strong>'+type+"!</strong> "+message)
// }
function insert_box(type,message){
  toastr.options = {
      "closeButton": false,
      "debug": false,
      "newestOnTop": false,
      "progressBar": false,
      "positionClass": "toast-top-right",
      "preventDuplicates": false,
      "onclick": null,
      "showDuration": "100",
      "hideDuration": "1000",
      "timeOut": "6000",
      "extendedTimeOut": "1000",
      "showMethod": 'slideDown',
      "hideMethod": "fadeOut"
    }
  switch(type){
    case "Error":
      toastr.options.timeOut = 20000;
      toastr.error("Error! "+message);
      break;
    case "Warning":
      toastr.warning("Warning! "+message)
      break;
    default:
      toastr.success("Success! "+message)
      break;
  }
}

function initvirtual(topo){
  // cleanTopo();
  // var remoteVirtual = getData();
  var obj_remoteVirtual = JSON.parse(topo);
  for(var index in obj_remoteVirtual.switches)
  {
    //switch_id.push(addvSwitch("vSwitch",obj_remoteVirtual.switches[index].dpid,obj_remoteVirtual.switches.length));
    switch_id.push({"swid":"vSwitch"+index,"dpid":obj_remoteVirtual.switches[index].dpid});
  }
  for(var index in obj_remoteVirtual.links)
  {
    for(var i in switch_id)
    {
      if(obj_remoteVirtual.links[index].dst.dpid == switch_id[i].dpid)
        {
          obj_remoteVirtual.links[index].dst.swid = switch_id[i].swid;
        }
    }
    for(var i in switch_id)
    {
      if(obj_remoteVirtual.links[index].src.dpid == switch_id[i].dpid)
        {
          obj_remoteVirtual.links[index].src.swid = switch_id[i].swid;
        }
    }
  }
  for(var index in obj_remoteVirtual.switches)
  {
    for(var i in switch_id)
    {
      if(obj_remoteVirtual.switches[index].dpid == switch_id[i].dpid)
      {
        obj_remoteVirtual.switches[index].swid = switch_id[i].swid;
      }
    }
  }
  for(var index in obj_remoteVirtual.switches){
    obj_remoteVirtual.switches[index].name = obj_remoteVirtual.switches[index].swid
    obj_remoteVirtual.switches[index].pro = "switch"
    d3_nodes.push(obj_remoteVirtual.switches[index])
  }

  for(var index in obj_remoteVirtual.hosts){
    obj_remoteVirtual.hosts[index].name = "host"+index
    obj_remoteVirtual.hosts[index].hostDomId = "host"+index
    obj_remoteVirtual.hosts[index].pro = "host"
    d3_nodes.push(obj_remoteVirtual.hosts[index])
  }
  console.log(d3_nodes);

  for (var index in obj_remoteVirtual.links){
    for (var i in d3_nodes){
      if(obj_remoteVirtual.links[index].src.dpid == d3_nodes[i].dpid && d3_nodes[i].pro == "switch"){
        obj_remoteVirtual.links[index].source = parseInt(i);
      }
      if(obj_remoteVirtual.links[index].dst.dpid == d3_nodes[i].dpid && d3_nodes[i].pro == "switch"){
        obj_remoteVirtual.links[index].target = parseInt(i);
      }
    }
    d3_edges.push(obj_remoteVirtual.links[index])
  }

  for(var index in obj_remoteVirtual.hosts){
    var link = {}
    for(var i in d3_nodes){
      if(obj_remoteVirtual.hosts[index].name ==d3_nodes[i].name){
        link.source = parseInt(i)
      }
      if(obj_remoteVirtual.hosts[index].dpid ==d3_nodes[i].dpid && d3_nodes[i].pro == "switch"){
        link.target = parseInt(i)
      }
    }
    d3_edges.push(link)
  }
  topoInfo = obj_remoteVirtual; 
  var img_w = 50;
  var img_h = 50;
  var text_dx = -20;
  var text_dy = 20;
  var svg = d3.select("#mininet-container").append("svg")
              .attr("width","100%")
              .attr("height","100%");

  var force = d3.layout.force()
              .nodes(d3_nodes)
              .links(d3_edges)
              .size([600,600])
              .linkDistance(150)
              .charge(-1500)
              .start();
  var edges_line = svg.selectAll("line")
                .data(d3_edges)
                .enter()
                .append("line")
                .style("stroke","#56ABE4")
                .attr("id",function(d,i){
                  return "line"+i;
                })
                .style("stroke-width",3);
  var nodes_img = svg.selectAll("image")
                .data(d3_nodes)
                .enter()
                .append("image")
                .attr("width",function(d){
                  if(d.pro=="switch"){
                    return 50;
                  }
                  else return 40;
                })
                .attr("height",function(d){
                  if(d.pro=="switch"){
                    return 50;
                  }
                  else return 40;
                })
                // .attr("type","button")
                .attr("xlink:href",function(d){
                  if(d.pro=="switch")
                    return "/static/virtualnetwork/switch.svg"
                  else 
                    return "/static/virtualnetwork/instance.svg"
                })
                .attr("class",function(d){
                  return d.pro
                })
                .attr("id",function(d){
                  return d.name
                })
                .call(force.drag);
                // .attr("data-container","#mininet-container")
                // .attr("title",function(e){
                //   if(e.pro=="host"){
                //     return "主机信息"
                //   }
                //   else return "交换机信息"
                // })
                // .attr("data-toggle","popover")
                // .attr("data-placement","top")
                // .attr("data-content",function(e){
                //   if(e.pro=="host"){
                //     return "MAC ID: "+e.mac
                //   }
                //   else return "DPID: "+e.dpid
                // })
                // .call(force.drag);
  // $(function ()  //图片的点击显示
  //   { $("[data-toggle='popover']").popover();
  // });

                  //添加一个提示框
  var tooltip = d3.select("body")
            .append("div")
            .attr("class","tooltip_virtual")
            .style("opacity",0.0);
  
  nodes_img.on("mouseover",function(d){
      /*
      鼠标移入时，
      （1）通过 selection.html() 来更改提示框的文字
      （2）通过更改样式 left 和 top 来设定提示框的位置
      （3）设定提示框的透明度为1.0（完全不透明）
      */
      var image_info = ""
      if(d.pro =="host"){
        image_info = "<strong>主机信息:</strong>"+"<br />"+"MAC ID: "+d.mac
      }
      else {
        image_info = "<strong>交换机信息:</strong>"+"<br />"+"DPID: "+d.dpid
      }
      tooltip.html(image_info)
        .style("left", (d3.event.pageX ) + "px")
        .style("top", (d3.event.pageY +20) + "px")
        .style("opacity",1.0);
      })
      
    .on("mousemove",function(d){
      /* 鼠标移动时，更改样式 left 和 top 来改变提示框的位置 */
      
      tooltip.style("left", (d3.event.pageX) + "px")
          .style("top", (d3.event.pageY + 20) + "px");
    })
    .on("mouseout",function(d){
      /* 鼠标移出时，将透明度设定为0.0（完全透明）*/
      
      tooltip.style("opacity",0.0);
    });
  
  var nodes_text = svg.selectAll(".nodetext")
                .data(d3_nodes)
                .enter()
                .append("text")
                .attr("class","nodetext")
                .attr("dx",-20)
                .attr("dy",function(d){
                  if(d.pro=="switch"){
                    return 20;
                  }
                  else return 8;
                })
                .text(function(d){
                  return d.name;
                });

  var edges_text = svg.selectAll(".linetext")
                .data(d3_edges)
                .enter()
                .append("text")
                .style("fill-opacity",1)
                .attr("class","linetext")
                .attr("id",function(d,i){
                  return "linetext"+i;
                })
                .text(function(d){
                  return "";
      });
  force.on("tick", function(){
    //限制结点的边界
    d3_nodes.forEach(function(d,i){
      d.x = d.x - img_w/2 < 0     ? img_w/2 : d.x ;
      d.x = d.x + img_w/2 > width ? width - img_w/2 : d.x ;
      d.y = d.y - img_h/2 < 0      ? img_h/2 : d.y ;
      d.y = d.y + img_h/2 + text_dy > height ? height - img_h/2 - text_dy : d.y ;
    });
  
    //更新连接线的位置
     edges_line.attr("x1",function(d){ return d.source.x; });
     edges_line.attr("y1",function(d){ return d.source.y; });
     edges_line.attr("x2",function(d){ return d.target.x; });
     edges_line.attr("y2",function(d){ return d.target.y; });
     
     //更新连接线上文字的位置
     edges_text.attr("x",function(d){ return (d.source.x + d.target.x) / 2 ; });
     edges_text.attr("y",function(d){ return (d.source.y + d.target.y) / 2 ; });
     
     
     //更新结点图片和文字
     nodes_img.attr("x",function(d){ return d.x - img_w/2; });
     nodes_img.attr("y",function(d){ return d.y - img_h/2; });
     
     nodes_text.attr("x",function(d){ return d.x });
     nodes_text.attr("y",function(d){ return d.y + img_w/2; });
  });

  force.drag().on("dragstart",function(d,i){
    d.fixed = true;    //拖拽开始后设定被拖拽对象为固定
  })

  nodes_img.on("dblclick",function(d,i){
      d.fixed = false; //双击图标解除锁定
  })
  
  $('line').click(function(e){
    //console.log($("#"+this.id).css("stroke"))
    if($("#"+this.id).css("stroke")=="rgb(253, 180, 92)"){ //黄
      $("#"+this.id).css("stroke","#11CD6E") //绿
      var tempLink = {
         "src":e.target.__data__.source.name,
         "dst":e.target.__data__.target.name
      }
      ryuLinks.push(tempLink);
      //console.log(e.target.__data__.source.name)
    }
    else{
      $("#"+this.id).css("stroke","#56ABE4") //蓝
      for(var index in ryuLinks)
      {
        if(ryuLinks[index].src == e.target.__data__.source.name && ryuLinks[index].dst == e.target.__data__.target.name)
        {
          ryuLinks.splice(index,1);
        }
      }
      //console.log(e.target.__data__)
    }  
  }) 

  $("line").hover(function(e){
    if($("#"+this.id).css("stroke")=="rgb(86, 171, 228)"){ //蓝
        $("#"+this.id).css("stroke","#FDB45C") //黄
      }
    },function(){
      if($("#"+this.id).css("stroke")=="rgb(17, 205, 110)"){  //绿
    }
    else $("#"+this.id).css("stroke","#56ABE4")   //蓝
  });

}


		//Connection Listener
		//Deal with multiple connections between two Endpoints
$("#initVirtual").click(function(){
  $.ajax({
    type:"GET",
    url:"getVirtualTopo",
    cache:false,
    async:true,
    success:function(result){
      var rel = JSON.parse(result)
      insert_box(rel._type,rel._message)
      // $('.alert').animate({"width":"300px"});
      initvirtual(result);
    }
  })
//   $(".switch").each(function(){    
//   SWID=$(this).attr("id");
//   $('#'+SWID).popover(
//   {
//     trigger:'click',
//     template:'<div class="popover" role="tooltip"><div class="arrow"></div><h3 class="popover-title">name</h3><div class="popover-content">setting</div>',
//     html: true,
//     title:"交换机信息",
//     content: getNetworkInfo(SWID),
//     viewport:"#mainbody",
//   });
// });
// $(".host").each(function(){    
//   hostID=$(this).attr("id");
//   $('#'+hostID).popover(
//   {
//     trigger:'click',
//     template:'<div class="popover" role="tooltip"><div class="arrow"></div><h3 class="popover-title">name</h3><div class="popover-content">setting</div>',
//     html: true,
//     title:"主机信息",
//     content: getHostInfo(hostID,obj_remoteVirtual.hosts),
//     placement:"right",
//   });
// });    

//   // for(var index in obj_remoteVirtual.links)
//   // { 
//   //   var linkLabel = obj_remoteVirtual.links[index].linkId;
//   //   virtualLink[index] = jsPlumb.connect({source:obj_remoteVirtual.links[index].src.swid,
//   //                    target:obj_remoteVirtual.links[index].dst.swid,hoverPaintStyle:{ strokeStyle:"#FDB45C" },
//   //    overlays:[ 
//   //          [ "Label", { label:"", id:"label"+index } ]
//   //        ],
//   //                    });
//   //   virtualLink[index].bind("click",function(conn){
//   //           //alert("选中"+conn.sourceId+"与"+conn.targetId+"之间的连接！");
//   //           console.log(conn);
//   //           if(conn._jsPlumb.paintStyle.strokeStyle == "#56ABE4")
//   //           {
//   //           conn.setPaintStyle({ strokeStyle:"#11CD6E" });
//   //           var tempLink = {
//   //             "src":conn.sourceId,
//   //             "dst":conn.targetId
//   //           }
//   //           ryuLinks.push(tempLink);
//   //           }
//   //           else{
//   //             conn.setPaintStyle({ strokeStyle:"#56ABE4" });
//   //             for(var index in ryuLinks)
//   //             {
//   //               if(ryuLinks[index].src == conn.sourceId && ryuLinks[index].dst == conn.targetId)
//   //               {
//   //                 ryuLinks.splice(index,1);
//   //               }
//   //             }
//   //           }
//   //         });
//   // }
//   // console.log(virtualLink);
  
//   // for(var index in obj_remoteVirtual.hosts)
//   // {
//   //   for(var i in obj_remoteVirtual.switches)
//   //     {
//   //       if(obj_remoteVirtual.switches[i].dpid == obj_remoteVirtual.hosts[index].dpid)
//   //       {
//   //         obj_remoteVirtual.hosts[index].swid = obj_remoteVirtual.switches[i].swid;
//   //       }
//   //     }
      
//   // }
//   // console.log(obj_remoteVirtual);

});

// $("#initVirtual").click(function()
// {
//   cleanTopo();
//   var remoteVirtual = getData();
//   //console.log(remoteVirtual);
//   var obj_remoteVirtual = JSON.parse(remoteVirtual);
//   console.log(obj_remoteVirtual);
//   for(var index in obj_remoteVirtual.switches)
//   {
//     switch_id.push(addvSwitch("vSwitch",obj_remoteVirtual.switches[index].dpid,obj_remoteVirtual.switches.length));
//   }
//   for(var index in obj_remoteVirtual.links)
//   {
//     for(var i in switch_id)
//     {
//       if(obj_remoteVirtual.links[index].dst.dpid == switch_id[i].dpid)
//         {
//           obj_remoteVirtual.links[index].dst.swid = switch_id[i].swid;
//         }
//     }
//     for(var i in switch_id)
//     {
//       if(obj_remoteVirtual.links[index].src.dpid == switch_id[i].dpid)
//         {
//           obj_remoteVirtual.links[index].src.swid = switch_id[i].swid;
//         }
//     }
//   }
//   for(var index in obj_remoteVirtual.switches)
//   {
//     for(var i in switch_id)
//     {
//       if(obj_remoteVirtual.switches[index].dpid == switch_id[i].dpid)
//       {
//         obj_remoteVirtual.switches[index].swid = switch_id[i].swid;
//       }
//     }
//   }
//   console.log(obj_remoteVirtual);

//   for(var index in obj_remoteVirtual.links)
//   { 
//     var linkLabel = obj_remoteVirtual.links[index].linkId;
//     virtualLink[index] = jsPlumb.connect({source:obj_remoteVirtual.links[index].src.swid,
//                      target:obj_remoteVirtual.links[index].dst.swid,hoverPaintStyle:{ strokeStyle:"#FDB45C" },
// 			overlays:[ 
//       			[ "Label", { label:"", id:"label"+index } ]
//     			],
//                      });
//     virtualLink[index].bind("click",function(conn){
//             //alert("选中"+conn.sourceId+"与"+conn.targetId+"之间的连接！");
//             console.log(conn);
//             if(conn._jsPlumb.paintStyle.strokeStyle == "#56ABE4")
//             {
//             conn.setPaintStyle({ strokeStyle:"#11CD6E" });
//             var tempLink = {
//               "src":conn.sourceId,
//               "dst":conn.targetId
//             }
//             ryuLinks.push(tempLink);
//             }
//             else{
//               conn.setPaintStyle({ strokeStyle:"#56ABE4" });
//               for(var index in ryuLinks)
//               {
//                 if(ryuLinks[index].src == conn.sourceId && ryuLinks[index].dst == conn.targetId)
//                 {
//                   ryuLinks.splice(index,1);
//                 }
//               }
//             }
//           });
//   }
//   console.log(virtualLink);
  
//   for(var index in obj_remoteVirtual.hosts)
//   {
//     for(var i in obj_remoteVirtual.switches)
//       {
//         if(obj_remoteVirtual.switches[i].dpid == obj_remoteVirtual.hosts[index].dpid)
//         {
//           obj_remoteVirtual.hosts[index].swid = obj_remoteVirtual.switches[i].swid;
//         }
//       }
      
//   }
  
  
//   for(var index in obj_remoteVirtual.hosts)
//   {
    
//       obj_remoteVirtual.hosts[index].hostDomId = addInstance("host",obj_remoteVirtual.hosts[index].swid);
    
//   }
//   console.log(obj_remoteVirtual);
//   topoInfo = obj_remoteVirtual;
//    $(".vSwitch").each(function(){
              
//               SWID=$(this).attr("id");
//               $('#'+SWID).popover(
//           {
//             trigger:'click',
//             template:'<div class="popover" role="tooltip"><div class="arrow"></div><h3 class="popover-title">name</h3><div class="popover-content">setting</div>',
//             html: true,
//             title:"交换机信息",
//             content: getNetworkInfo(SWID),
//      });
// });
//       $(".host").each(function(){
              
//               hostID=$(this).attr("id");
//               $('#'+hostID).popover(
//           {
//             trigger:'click',
//             template:'<div class="popover" role="tooltip"><div class="arrow"></div><h3 class="popover-title">name</h3><div class="popover-content">setting</div>',
//             html: true,
//             title:"主机信息",
//             content: getHostInfo(hostID,obj_remoteVirtual.hosts),
//      });
// });

// });

$("#removeVirtual").click(function(){
  var removeTopo = {
    "id": "1",
    "jsonrpc": "2.0",
    "method": "removeNetwork",
    "params": {
        "network": {
            "tenantId":1
        }
    }
   }
 $.ajax({
    type:"POST",
    url:"removeVirtualTopo",
    data: JSON.stringify(removeTopo),
    cache:false,
    async:true,
    success:function(result){
      var rel = JSON.parse(result)
      insert_box(rel._type,rel._message)
      // $('.alert').animate({"width":"300px"});
    }
  })
});

$("#selectLinks").click(function(){
  console.log(ryuLinks);
  //console.log(topoInfo.hosts);
  var hostList = [];       
  var switchList = [];
  var hostDomList = [];   //已选的host节点domID
  var host_dp = [];
  var selectedLink = [];  //已选的links
  var onewayLink_a = [];
  var onewayLink_b = [];
  var onewayLink = [];

  for(var i in ryuLinks)
  {
    if(ryuLinks[i].src[0] == 'h')
    {
      hostDomList.push(ryuLinks[i].src);
    }
    if(ryuLinks[i].dst[0] == 'h')
    {
      hostDomList.push(ryuLinks[i].dst);
    }
  }
  
  for(var j in hostDomList)
  {   
    for(var index in topoInfo.hosts)
      {
        if(hostDomList[j] == topoInfo.hosts[index].hostDomId)
        {
          var host_info = {
              "dpid":topoInfo.hosts[index].dpid,
              "mac":topoInfo.hosts[index].mac,
              "port":topoInfo.hosts[index].port
            }
          hostList.push(host_info);
          var host_dpid = {
            "id":hostDomList[j],
            "dpid":topoInfo.hosts[index].dpid,
            "port":topoInfo.hosts[index].port
          }
          host_dp.push(host_dpid);
        }
      }
  }
  //console.log(hostList);
  //console.log(host_dp);  
  for(var index in ryuLinks)
  {
    for(var i in topoInfo.links)
    {
      if((ryuLinks[index].dst == topoInfo.links[i].dst.swid &&ryuLinks[index].src == topoInfo.links[i].src.swid )||(ryuLinks[index].dst == topoInfo.links[i].src.swid &&ryuLinks[index].src == topoInfo.links[i].dst.swid))
      {
        selectedLink.push(topoInfo.links[i]);
      }
    }
  }
  var json_selectLink = JSON.stringify(selectedLink);
  console.log("选出的link（双向）");
  console.log(json_selectLink);
/*
  for(var index in selectedLink)
  {
    var dp_src = selectedLink[index].src.dpid;
    var dp_dst = selectedLink[index].dst.dpid;
    onewayLink_a.push(selectedLink[index]);

    for(var i in selectedLink)
    {
      if((selectedLink[i].src.dpid == dp_dst) && (selectedLink[i].dst.dpid == dp_src))
      {
        //console.log("第"+i+"次删掉");
        //console.log(selectedLink[i]);
        selectedLink.splice(i,1);

      }
      if(selectedLink[i].src.dpid == dp_src && selectedLink[i].dst.dpid != dp_dst)
      {
        //console.log("第"+i+"次删掉");
        //console.log(selectedLink[i]);
        selectedLink.splice(i,1);
      }
      if(selectedLink[i].dst.dpid == dp_dst && selectedLink[i].src.dpid != dp_src)
      {
        //console.log("第"+i+"次删掉");
        //console.log(selectedLink[i]);
        selectedLink.splice(i,1);
      }
    }
    //console.log(index +"次");
    //console.log(onewayLink_a);
    //console.log(selectedLink);
  }
  console.log("选出的link（单向）")
  console.log(onewayLink_a);
*/
  if (selectedLink.length!=0){
    var dp_src = selectedLink[0].src.dpid;
    var dp_dst = selectedLink[0].dst.dpid;
    var sign=0;
    onewayLink_a.push(selectedLink[0]);
    do{
      sign=0
      for(var i in selectedLink){
        if(selectedLink[i].src.dpid == dp_dst && selectedLink[i].dst.dpid != dp_src){
          onewayLink_a.push(selectedLink[i]);
          dp_src = selectedLink[i].src.dpid;
          dp_dst = selectedLink[i].dst.dpid;
          sign=1; 
          break;
       }
     }
    }while(sign==1);
    var dp_src = selectedLink[0].src.dpid;
    var dp_dst = selectedLink[0].dst.dpid;
    do{
      sign=0;
      for(var i in selectedLink){
        if(selectedLink[i].dst.dpid == dp_src && selectedLink[i].src.dpid != dp_dst){
          onewayLink_a.push(selectedLink[i]);
          dp_src = selectedLink[i].src.dpid;
          dp_dst = selectedLink[i].dst.dpid;
          sign=1;
          break;
       }
      }
    }while(sign==1);
    console.log("选出的link（单向）");
    console.log(onewayLink_a);
    sign=0
    for(var index in onewayLink_a)
    {
      if(host_dp[0].dpid == onewayLink_a[index].src.dpid)
      {
        var temp_switches = {
          "dpid":onewayLink_a[index].src.dpid,
          "out_port":parseInt(onewayLink_a[index].src.port),
          "in_port":host_dp[0].port
        }
        switchList.push(temp_switches);
        sign=1
      }
      if(host_dp[1].dpid == onewayLink_a[index].src.dpid)
      {
        var temp_switches = {
          "dpid":onewayLink_a[index].src.dpid,
          "out_port":parseInt(onewayLink_a[index].src.port),
          "in_port":host_dp[1].port
        }
        switchList.push(temp_switches);
      }
      if(host_dp[1].dpid == onewayLink_a[index].dst.dpid) 
      {
        var temp_switches = {
          "dpid":onewayLink_a[index].dst.dpid,
          "out_port": host_dp[1].port,
          "in_port": parseInt(onewayLink_a[index].dst.port),
        }
        switchList.push(temp_switches);
      }
      if(host_dp[0].dpid == onewayLink_a[index].dst.dpid) 
      {
        var temp_switches = {
          "dpid":onewayLink_a[index].dst.dpid,
          "out_port": host_dp[0].port,
          "in_port": parseInt(onewayLink_a[index].dst.port),
        }
        switchList.push(temp_switches);
      }
    }
    if(sign==0)
    {
      var exchange = hostList[0];
      hostList[0]=hostList[1];
      hostList[1]=exchange;
    }
    console.log("host information");
    console.log(hostList);
  }

  for(var index in onewayLink_a)
  {
    var dpid = onewayLink_a[index].src.dpid;
    var dst_dpid = onewayLink_a[index].dst.dpid;
    var dst_port = onewayLink_a[index].dst.port;
    var in_port;
    var out_port = onewayLink_a[index].src.port;

    for(var i in onewayLink_a)
    {
      if(onewayLink_a[i].src.dpid == dst_dpid)
      {
        var temp_switch_info = {
          "dpid":onewayLink_a[i].src.dpid,
          "out_port":parseInt(onewayLink_a[i].src.port),
          "in_port":parseInt(dst_port)
        }
        switchList.push(temp_switch_info);
      }
    }
  }
  
  //console.log(switchList);
  //var json_switchList = JSON.stringify(switchList);
  //console.log(json_switchList);
  var testCase = {
  "pro":"link",
  "id": "1",
  "jsonrpc": "2.0",
  "method": "createNetwork",
  "params": {
      "network": {
          "hosts": hostList,
          "switches":switchList
      }
    }
  }
  $.ajax({
    type:"POST",
    url:"selectVirtualLinks",
    data:JSON.stringify(testCase),
    cache:false,
    async:true,
    success:function(result){
      var rel = JSON.parse(result)
      insert_box(rel._type,rel._message)
      // $('.alert').animate({"width":"300px"});
    }
  })
    //console.log(selectLinkResult);

});

// Test bandwidth of the virtual network
$('#testBand').click(function(){
  $.ajax({
    type:"POST",
    url:"test_Band_virtual",
    data:JSON.stringify(topoInfo),
    cache:false,
    async:true,
    success:function(result){
      var rel = JSON.parse(result)
      insert_box(rel._type,rel._message)
      // $('.alert').animate({"width":"300px"});
      var virtual_result = rel.links
      console.log(result)
      for(var index in virtual_result){
        var band = (virtual_result[index].bytes1 - virtual_result[index].bytes0)/(virtual_result[index].time1-virtual_result[index].time0);
        var band_txt = 0;
        if((band/1024)>1024)
          band_txt = ((band/1024)/1024).toFixed(2) +"MB/s";
        else if (band>1024) 
          band_txt = (band/1024).toFixed(2) +"KB/s";
        else band_txt = band.toFixed(2) + "Byte/s";
        $("#linetext"+index).html(band_txt);
        for(var i=0;i<index;i++){
          if (virtual_result[index].src.dpid ==virtual_result[i].dst.dpid && virtual_result[index].dst.dpid ==virtual_result[i].src.dpid){
            $("#linetext"+index).html("");
          }
        }
      }
    }
  })
});


// $('#testBand').click(function(){
//   $.ajax({
//     type:"POST",
//     url:"test_Band_virtual",
//     data:JSON.stringify(topoInfo),
//     cache:false,
//     async:true,
//     success:function(result){
//       console.log(result)
//       var virtual_result = JSON.parse(result)
//       for(var index in virtual_result){
//         var lab = "label"+index;
//         var band = (virtual_result[index].bytes1 - virtual_result[index].bytes0)/(virtual_result[index].time1-virtual_result[index].time0);
//         var band_txt = 0;
//           if((band/1024)>1024)
//             band_txt = ((band/1024)/1024).toFixed(2) +"MB/s";
//           else if (band>1024) 
//             band_txt = (band/1024).toFixed(2) +"KB/s";
//           else band_txt = band.toFixed(2) + "Byte/s";
//           try{
//               var lab_i = virtualLink[index].getOverlay(lab)
//               lab_i.setLabel(band_txt);
//             }catch(e){
//               continue;
//           }
//       }
//     }
//   })
// });


// Test Delay of the virtual network
$('#testDelay').click(function(){
  console.log(topoInfo)
  $.ajax({
    type:"POST",
    url:"test_Delay_virtual",
    data:JSON.stringify(topoInfo),
    cache:false,
    async:true,
    success:function(result){
      console.log(result)
      var rel = JSON.parse(result)
      var virtual_result = rel.links
      insert_box(rel._type,rel._message)
      // $('.alert').animate({"width":"300px"});
      for (var index in virtual_result){
        var a =0;
        for(var i=0;i<index;i++){
          if (virtual_result[index].src.dpid ==virtual_result[i].dst.dpid && virtual_result[index].dst.dpid ==virtual_result[i].src.dpid)
          a = 1;
        }
        if(a==0){
          $("#linetext"+index).html(virtual_result[index]['delay']);
        }
      }
    }
  })
});

$.ajax({
    type:"GET",
    url:"getVirtualTopo",
    cache:false,
    async:true,
    success:function(result){
      rel = JSON.parse(result)
      insert_box(rel._type,rel._message)
      // $('.alert').animate({"width":"300px"});
      initvirtual(result);
    }
})
// $('#testDelay').click(function(){
//   $.ajax({
//     type:"POST",
//     url:"test_Delay_virtual",
//     data:JSON.stringify(topoInfo),
//     cache:false,
//     async:true,
//     success:function(result){
//       console.log(result)
//       var virtual_result = JSON.parse(result)
//       for(var index in virtual_result){
//         try {
//           var lab = 'label'+index;
//           var lab_i = virtualLink[index].getOverlay(lab);
//           lab_i.setLabel(virtual_result[index]['delay']);
//         }catch(e){
//           continue;
//         }
//       }
//     }
//   })
// });

     jsPlumb.bind('connection',function(info){
		 var connsList = jsPlumb.getConnections();
		   	var connection = info.connection;
			var arr1 = jsPlumb.select({source:connection.sourceId,target:connection.targetId});
			var arr2 = jsPlumb.select({source:connection.targetId,target:connection.sourceId});
			var endpoints = connection.endpoints;
			if(arr1.length + arr2.length>1){
				jsPlumb.detach(connection);
				return ;
			}
		      	var connectionIdx = Idx['Connection'];
		       	var cidr = "100M";

			Idx['Connection']++;
		});		
	});

