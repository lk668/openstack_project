//{% load staticfiles %}
/******识别所操作节点的ID******/
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
/**********计费相关存储************/
var clusterSpec = [];
var clusterPrice = 0;
var currentClusterPrice;
var instancePrice_array = [];

var physicalTopo;
var switch_id = [];
var autoHostList = [];
var autoSwitchList = [];
var switchRoutes = [];
var switch_vSwitch_ports = [];
var vSwitchLinks = [];
var phyLink = [];
var x_loc;
var y_loc;
var shc_connections;
var switch_host_cpu = [];
var butId;


var d3_nodes = []
var d3_edges = []
var manualTopo = []




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
	xmlhttp.open("GET","physicaljson",false);
	xmlhttp.send();
	return xmlhttp.responseText;
}

function postData(obj,url){
	payload = obj;
	xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function()
   {
          if (xmlhttp.readyState == 4){
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
  var res = []
  var a = {};  
  for (var i=0; i<data.length; i++) {  
    if (!a[data[i]]){
      res.push(data[i]);  
      a[data[i]] = 1; 
    } 
  }    
  return res;  
}  
// function uniqueArray(data){  
// data = data || [];  
// var a = {};  
// for (var i=0; i<data.length; i++) {  
// var v = data[i];  
// if (typeof(a[v]) == 'undefined'){  
//     a[v] = 1;  
// }  
// };  
// data.length=0;  
// for (var i in a){  
// data[data.length] = i;  
// }  
// return data;  
// }  
/***
***生成拓扑结构的json格式
***/
function generateLocalTopology(){
	var connectionList = jsPlumb.getConnections();
	var connections = [];
	var vmDevice = [];

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
for(var index in connections)
{
vmDevice.push(connections[index].source);
vmDevice.push(connections[index].target);
}
var vmDevices = uniqueArray(vmDevice);
localjson.vmDevice = vmDevices;
localjson.connections = connections;
//console.log(connections);
//console.log(vmCluster);
/**
for(var index in connections)
{
   var tempSource = connections[index].source;
   var tempTarget = connections[index].target;
    var networksList = [];
    var cc;
   //switch
   if(tempSource[0]=="S")
   {
        var networkData ;
        for(var j in switchNetwork)
        {
          if(tempSource==switchNetwork[j].switchId)
          {
            networkData = switchNetwork[j].NetworkName;
       //   console.log(networkData);
          }
        }
        //switch -------vm
        if(tempTarget[0]=="V")
        {
             for(var i =0;i< vmCluster.length;i++)
             {
                 if(tempTarget==vmCluster[i].instanceId)
                  {
                    cc = parseInt(vmCluster[i].ClusterIndexID);
                      vmCluster[i].networks.push(networkData);
 
                 
                  }
             }
        }

        //switch-------router
        if(tempTarget[0]=="R")
        {
               for(var i in RouterNetworkInfo)
               {
                if (tempTarget == RouterNetworkInfo[i].RouterID)
                {
                  RouterNetworkInfo[i].networks.push(networkData);
                }
               }
        }
        //switch-------loadbalancer
        if(tempTarget[0]=="L")
        {
                 for(var i in LBNetworkInfo)
               {
                if (tempTarget == LBNetworkInfo[i].loadbalanceID)
                {
                  LBNetworkInfo[i].networks=networkData;
                }
               }
        }
   }
   //vm
   if (tempSource[0]=="V") 
    {
      var tempVmID = tempSource;
      //vm-----------switch
      if(tempTarget[0]=="S")
      {
        var networkData;
             for(var j in switchNetwork)
             {
                    if(switchNetwork[j].switchId == tempTarget)
                    {
                         networkData = switchNetwork[j].NetworkName;
                    }
             }
             for(var j in vmCluster)
             {
               if (vmCluster[j].instanceId == tempVmID)
               {
                       vmCluster[j].networks.push(networkData);
               }
             }
      }
      //vm
      if(tempTarget[0]=="")
      {

      }
      //error
      else{

      }

    }
    //LB
    if(tempSource[0]=="L")
    {

      //lb--------switch
      if(tempTarget[0]=="S")
      {
               var networkData ;
        for(var j in switchNetwork)
        {
          if(tempTarget==switchNetwork[j].switchId)
          {
            networkData = switchNetwork[j].NetworkName;
       //   console.log(networkData);
          }
        }

               for(var i in LBNetworkInfo)
               {
                if (tempSource == LBNetworkInfo[i].loadbalanceID)
                {
                  LBNetworkInfo[i].networks=networkData;
                }
               }
      }
      //lb--------router
      if(tempTarget[0]=="R")
      {

      }
      //error
      else{

      }
    }
    //Router
    if(tempSource[0]=="R")
    {
      for(var k in RouterNetworkInfo)
      {
        if(tempSource == RouterNetworkInfo[k].RouterID)
        {
          var temprouterId = RouterNetworkInfo[k].RouterIndex;
         }
      }
      //router----------firewall
      if(tempTarget[0]=="F")
      {

      }
      //router-----------lb
      if(tempTarget[0]=="L")
      {

      }
      //router------------switch
      if(tempTarget[0]=="S")
      {
        var networkData ;
        for(var j in switchNetwork)
        {
          if(tempTarget==switchNetwork[j].switchId)
          {
            networkData = switchNetwork[j].NetworkName;

       //   console.log(networkData);
          }        
              RouterNetworkInfo[temprouterId].networks.push(networkData);
        } 
      }
    }
   //firewall
   if(tempSource[0]=="F")
   {
    //error
    if(tempTarget[0]=="L"||tempTarget[0]=="S"||tempTarget[0]=="V")
      { }
   }
}
/********
*******/

console.log(RouterNetworkInfo);
console.log(vmCluster);
console.log(LBNetworkInfo);
for(var index in vmCluster)
{
  var tempArr = uniqueArray(vmCluster[index].networks);
  vmCluster[index].networks = tempArr;
}
for(var index in vmCluster)
{
   ClusterNetworkInfo[vmCluster[index].ClusterIndexID]=
                    {
                        "networks":vmCluster[index].networks,
                    }     
}
console.log(ClusterNetworkInfo);
for(var index in ClusterInfo)
{
  ClusterInfo[index].networks.length = 0;
  for(var i in ClusterNetworkInfo[index].networks)
  {
    ClusterInfo[index].networks.push({"name":ClusterNetworkInfo[index].networks[i]});
   }
}
console.log(ClusterInfo);
for(var index in RouterNetworkInfo)
{
  var tempArr = uniqueArray(RouterNetworkInfo[index].networks);
  RouterNetworkInfo[index].networks = tempArr;
}
for(var index in RouterNetworkInfo)
{
  RTInfo[index].networks.length = 0;
  for(var i in RouterNetworkInfo[index].networks)
  {
    RTInfo[index].networks.push({"name":RouterNetworkInfo[index].networks[i]});
   }
}

for(var index in LBNetworkInfo)
{
  var tempArr = uniqueArray(LBNetworkInfo[index].networks);
  LBNetworkInfo[index].networks = tempArr;
}
for(var index in LBNetworkInfo)
{
  
    LBInfo[index].network={"name":LBNetworkInfo[index].networks};
    LBInfo[index].vip.network = {"name":LBNetworkInfo[index].networks};
}


}


function serverToNetwork(servers,networks,ports,routers)
{
      serversInfo = servers;
      networksInfo = networks;
      portsInfo = ports;
      routerInfo = routers;
       /***虚拟机和网络连接关系***/
      for(var index in serversInfo)
      {
        var server_network = [];

        for (var i in portsInfo) 
        {
          if ((serversInfo[index].id == portsInfo[i].device_id) && portsInfo[i].device_owner == "compute:nova")
          {
            for (var j in networksInfo)
            {
              if(networksInfo[j].id == portsInfo[i].network_id)
              {
                server_network.push(networksInfo[j].id);
              }
            }
          }
        }
        serversInfo[index].connectNetwork = server_network;
        serversInfo[index].topoId = "VM"+index;    
      }

       /***网络和虚拟机连接关系***/
      for(var index in networksInfo)
      {
        var network_server = [];
        for (var i in serversInfo)
        {
          for(var j in serversInfo[i].connectNetwork)
          {
            if(serversInfo[i].connectNetwork[j]==networksInfo[index].id)
            {
               network_server.push(serversInfo[i].id);
            }
          }
        }
        networksInfo[index].connectServer = network_server;
      }

      /***路由器和网络连接关系***/
      for(var index in networksInfo)
      {
        var network_router = [];
        for(var i in portsInfo)
        {
          if((portsInfo[i].network_id == networksInfo[index].id)&&portsInfo[i].device_owner =="network:router_interface")
          {
            network_router.push(portsInfo[i].device_id);
          }
        }
        networksInfo[index].connectRouter = network_router;
      }

      /***负载均衡器和网络连接关系***/
      for(var index in networksInfo)
      {
        var network_loadBalancer = [];
        for(var i in portsInfo)
        {
          if((portsInfo[i].network_id == networksInfo[index].id)&&portsInfo[i].device_owner =="neutron:LOADBALANCER")
          {
            network_loadBalancer.push(portsInfo[i].device_id);
          }
        }
        networksInfo[index].connectLoadBalancer = network_loadBalancer;
      }

      /***路由器和外部网关连接关系***/
      for(var index in networksInfo)
      {
        var extnetwork_router = [];
        for(var i in portsInfo)
        {
          if((portsInfo[i].network_id == networksInfo[index].id))
          {
            var tempHeader = "gateway"+networksInfo[index].id;
            if(tempHeader == portsInfo[i].id)
            {
              extnetwork_router.push(portsInfo[i].device_id);
            }
            
          }
        }
        networksInfo[index].extConnectRouter = extnetwork_router;
      }

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

function d3_manualSwitchListCollection(manualTopo){
  var tmp_switches = [];
  for(var index in manualTopo){
    for(var i in physicalTopo.switches){
      if(manualTopo[index].src == physicalTopo.switches[i].swid){
        tmp_switches.push(physicalTopo.switches[i].dpid);
      }
      if(manualTopo[index].dst == physicalTopo.switches[i].swid){
        tmp_switches.push(physicalTopo.switches[i].dpid);
      }
    }
  }
  return uniqueArray(tmp_switches);
}

function d3_hostListCollection(manualTopo)
{
  var tmp_host = []
  for(var index in manualTopo){
    for(var i in physicalTopo.hosts){
      if(manualTopo[index].src== physicalTopo.hosts[i].name || manualTopo[index].dst== physicalTopo.hosts[i].name){
        var host_info = {
          "mac":physicalTopo.hosts[i].mac,
          "dpid":physicalTopo.hosts[i].dpid,
          "port":physicalTopo.hosts[i].port
        }
        tmp_host.push(host_info);
      }
    }
  }
  return tmp_host;
}

function d3_linkListCollection(manualTopo){
  var tmp_links = [];
  for(var index in manualTopo){
    if(manualTopo[index].src[0]=="S" && manualTopo[index].dst[0]=="S"){
      for(var i in physicalTopo.links){
        if(manualTopo[index].src == physicalTopo.links[i].src.swid && manualTopo[index].dst == physicalTopo.links[i].dst.swid){
          var link_info = {
            "src":{"dpid":physicalTopo.links[i].src.dpid,"port":physicalTopo.links[i].src.port},
            "dst":{"dpid":physicalTopo.links[i].dst.dpid,"port":physicalTopo.links[i].dst.port}
          }
          tmp_links.push(link_info);
        }
      }
    }
  }
  return tmp_links;
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
PaintStyle : 
{
lineWidth:3,
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
  
/***
****************根据服务器端数据生成节点******************
***/	
/**
  function networkTopoDisplay()
  {
    VmLink = serversInfo;
    switchLink = networksInfo;
    routerLink = networksInfo;
    lbLink = networksInfo;
    var swCount = 0;
    var lbCount = 0;
    var rtCount = 0;
    var swNum = 0;
    var rtNum = 0;
    var lbNum = 0;

    for(var index in VmLink)
    {
      VmLink[index].vmId = "VM"+index;
    }
    for(var index in switchLink)
    {
      if(switchLink[index]["router:external"] == false)
       {        
         switchLink[index].swId = "Switch"+swCount;
         swCount++;
      }

    }
    for(var index in lbLink)
    {
      
      if(lbLink[index].connectLoadBalancer.length != 0)
      {
        lbLink[index].lbId = "LB"+lbCount;
        lbCount++;
      }
    }
    for (var index in routerInfo)
    {
      routerInfo[index].rtId = "Router"+index;
    }
    addFW("FW");
    $("#FW0").css("left","100px");
    $("#FW0").css("top","20px");
    for(var index in VmLink)
    {
      addInstance("VM");
      var Crelamove = index*100+200;
      $('#'+VmLink[index].topoId).css("left", Crelamove);
      $('#'+VmLink[index].topoId).css("top", "400px");
    }
    for(var index in switchLink)
    {
      if(switchLink[index].swId)
      {        
        addSwitch("Switch");
        var Srelamove = swNum*100+200;
        $('#'+switchLink[index].swId).css("left", Srelamove);
        $('#'+switchLink[index].swId).css("top", "280px");
          swNum++;
      }
    }
    for(var index in lbLink)
    {
      if(lbLink[index].lbId)
      {
        addLB("LB");
         var relativeMove = (lbNum-1)*100+200;
         $('#'+lbLink[index].lbId).css("left", relativeMove);
         $('#'+lbLink[index].lbId).css("top", "180px");
      }
    }
        for(var index in routerInfo)
    {
        addRouter("Router");
        var rtmove = rtNum*100+200;
        $('#'+routerInfo[index].rtId).css("left",rtmove);
        $('#'+routerInfo[index].rtId).css("top","100px");
        rtNum++;
    }



    console.log(VmLink);
    console.log(switchLink);
    console.log(lbLink);
    console.log(routerLink);
  }

 function topoLink()
  {
    console.log(routerInfo);
    var lineColor = ["#56ABE4","blue","green","purple","grey","yellow","red"]
    for (var index in routerInfo)
    {
 
        jsPlumb.connect({source:"FW0",target:routerInfo[index].rtId,paintStyle:{lineWidth:3,strokeStyle:lineColor[0]}});
    
    }

    for(var index in switchLink)
    {
      if(switchLink[index].swId)
      {
        if(switchLink[index].lbId)
        {
        jsPlumb.connect({source:switchLink[index].lbId,
                                            target:switchLink[index].swId,
                                            paintStyle:{lineWidth:3,strokeStyle:lineColor[0]}});
        if(switchLink[index].connectRouter.length> 0 )
        {
          for (var cR in switchLink[index].connectRouter)
          {
                    for(var x in routerInfo)
                {
                       if(routerInfo[x].id == switchLink[index].connectRouter[cR])
                       {
                                     jsPlumb.connect({
                                        source:routerInfo[x].rtId,
                                        target:switchLink[index].swId,paintStyle:{lineWidth:3,strokeStyle:lineColor[0]}});
                       }
                 }
        }
        }
        }
        else if(switchLink[index].connectRouter.length> 0 )
        {
          for (var cR in switchLink[index].connectRouter)
          {
                    for(var x in routerInfo)
                {
                       if(routerInfo[x].id == switchLink[index].connectRouter[cR])
                       {
                                     jsPlumb.connect({
                                        source:routerInfo[x].rtId,
                                        target:switchLink[index].swId,paintStyle:{lineWidth:3,strokeStyle:lineColor[0]}});
                       }
                 }
        }
        }
        if(switchLink[index].connectServer.length!= 0)
        {
        //  console.log(switchLink[index].connectServer);
          for(var i in switchLink[index].connectServer)
          {
            for(var j in VmLink)
            {
              if(switchLink[index].connectServer[i]==VmLink[j].id)
              {
                jsPlumb.connect({source:switchLink[index].swId,target:VmLink[j].topoId,paintStyle:{lineWidth:3,strokeStyle:lineColor[0]}});
              }
            }
          }
        }
      }
    }

  }

**/
        function addInstance(str_name,str_id,sw_id)
        {
		if(!Idx[str_name] || Idx[str_name] < 0)
		{
			Idx[str_name] = 0;
		}

                var newItem = $('<div>').attr('id', str_name + Idx[str_name]).addClass(str_name);
                 var title = $('<div>').addClass('title').text(str_id);
                 var img = $('<img/>');
                var insId = str_name + Idx[str_name];
				img.attr({"src":"/static/openvirtex/instance.svg","width":"40px","height":"40px"});      
            //    img.attr({"src":"{% static 'openvirtex/instance.svg' %}","width":"50px","height":"50px"});     
                 img.appendTo(newItem);       
        
			newItem.append(title);
			$("#mininet-container").append(newItem);
                        $('#'+insId).css("left", x_loc-200);
                        $('#'+insId).css("top", y_loc-250);
                        jsPlumb.connect({source:sw_id,
                     target:newItem,
                     endpoint:[ "Dot", { radius:2} ],
                     anchor:"AutoDefault"});	
			jsPlumb.draggable(newItem, {
			  	containment: 'parent'
			});
			Idx[str_name]++;    
	}
		
		
	function addSwitch(str_name,str_id)
	{
		if(!Idx[str_name] || Idx[str_name] < 0)
		{
			Idx[str_name] = 0;
		}

		var newSwitch = $('<div>').attr('id', str_name + Idx[str_name]).addClass(str_name);
		var title = $('<div>').addClass('title').text( str_name + Idx[str_name]);
    		        var img = $('<img/>');
                      var tempswitch_id = {
                        "swid":str_name + Idx[str_name],
                        "dpid":str_id
                      }
					img.attr({"src":"/static/openvirtex/switch.svg","width":"50px","height":"50px"});

                      //img.attr({"src":"{% static 'openvirtex/switch.svg' %}","width":"50px","height":"50px"});       
                      img.appendTo(newSwitch);  
                			newSwitch.append(title);
                			$("#mininet-container").append(newSwitch);
                			jsPlumb.makeTarget(newSwitch, params(newSwitch));
                			jsPlumb.makeSource(title, params(newSwitch));     
                			jsPlumb.draggable(newSwitch, {
                			  	containment: 'parent'
                			});

                			Idx[str_name]++;   
                      return tempswitch_id; 
	}

        function addRouter(str_name,sw_id,port_id)
        {
                if(!Idx[str_name] || Idx[str_name] < 0)
                {
                  Idx[str_name] = 0;
                }

                var newRouter = $('<div>').attr('id', str_name + Idx[str_name]).addClass(str_name);
                var vs_id = str_name + Idx[str_name];
                var title = $('<div>').addClass('title').text(port_id);
                var img = $('<img/>');      
                   img.attr({"src":"/static/openvirtex/router.svg","width":"30px","height":"30px"});   
                   img.appendTo(newRouter);    
                newRouter.append(title);
                $("#mininet-container").append(newRouter);
                $('#'+vs_id).css("left", x_loc-200);
                $('#'+vs_id).css("top", y_loc-180);
                jsPlumb.connect({source:sw_id,
                     target:newRouter,
                     Connector:"Bezier",
                     endpoint:[ "Dot", { radius:2} ],
                     PaintStyle : {lineWidth:3,strokeStyle: '#11CD6E'},
                     anchor:"AutoDefault"});  
                jsPlumb.makeTarget(newRouter, params(newRouter));
                jsPlumb.makeSource(title, params(newRouter));     
                jsPlumb.draggable(newRouter, {
                    containment: 'parent'
                });

                Idx[str_name]++;    
                return vs_id;
        }
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
      //  console.log("x:"+x_loc+'<br>'+"y:"+y_loc);
      });

$(".refreshCpu").click(function()
{
	console.log("click");

}
);

/***
***交换机右键菜单***
***/

$(function(){
    $('#mininet-container').contextMenu({
        selector: '.Switch', 
        items: {
            "fold1a-key1": {name: "host-port1", icon: "edit",callback:function()
            {
              SWID=$(this).attr("id"); 
              addInstance("VM","host1",SWID);
	      linkListing();
	      update_shc();
              hostListCollection(SWID,"1");
              switchListCollection(SWID);

            }},
            "fold1a-key2": {name: "host-port2", icon: "edit",callback:function()
            {
              SWID=$(this).attr("id"); 
              addInstance("VM","host2",SWID);
		linkListing();
		update_shc();
              hostListCollection(SWID,"2");
              switchListCollection(SWID);
            }},
            "fold1a-key3": {name: "host-port3", icon: "edit",callback:function()
            {
              SWID=$(this).attr("id"); 
              addInstance("VM","host3",SWID);
		linkListing();
		update_shc();
              hostListCollection(SWID,"3");
              switchListCollection(SWID);
            }},
            "fold1a-key4": {name: "host-port4", icon: "edit",callback:function()
            {
              SWID=$(this).attr("id"); 
              addInstance("VM","host4",SWID);
		linkListing();
		update_shc();
              hostListCollection(SWID,"4");
              switchListCollection(SWID);
            }},
            "fold1a-key5": {name: "switch-port5", icon: "edit",callback:function()
            {
              SWID=$(this).attr("id");
              var vsid = addRouter("vSwitch",SWID,"port5");
              switchVportsCollection(SWID,vsid,"port5");
            }},
            "fold1a-key6": {name: "switch-port6", icon: "edit",callback:function()
            {
              SWID=$(this).attr("id");
              var vsid = addRouter("vSwitch",SWID,"port6");
                switchVportsCollection(SWID,vsid,"port6");
            }},
            "fold1a-key7": {name: "switch-port7", icon: "edit",callback:function()
            {
              SWID=$(this).attr("id");
              var vsid = addRouter("vSwitch",SWID,"port7");
                switchVportsCollection(SWID,vsid,"port7");
            }},
            "sep1": "---------",
            "quit": {name: "Quit", icon: "quit",callback: $.noop}
        } 
    });



});

/***
***虚拟机右键菜单***
***/
$(function(){
    $('#mininet-container').contextMenu({
        selector: '.VM', 
        items: {
            "edit": {name: "Edit", icon: "edit",callback:function()
            {
              VMID=$(this).attr("id");
              $('#myModal').modal({keyboard: true});
            }},

            "delete": {name: "Delete", icon: "delete",callback: function()
            {
             VMID=$(this).attr("id");
              jsPlumb.detachAllConnections($('#'+VMID));
             $('#'+VMID).remove();
             Idx['VM']--;
            }},
            "sep1": "---------",
            "quit": {name: "Quit", icon: "quit",callback: $.noop}
        } 
    });
});



/**
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
    for(spc_index=0 ;spc_index <= 10; spc_index++)
	{
		if(swIds == switch_host_cpu[spc_index].swid){

		   cpu_util = switch_host_cpu[spc_index].cpuUtil;
		   break;
                  }	
	}
//    console.log(spc_index);
//    console.log(switch_host_cpu[spc_index].cpuUtil);
     return "交换机ID: "+switchId+"<br>"+"名称: "+swIds;
}
**/



$("#clean").click(function() {
    cleanTopo();          
});

function cleanTopo()
{
  autoHostList.length = 0;
  autoSwitchList.length = 0;
  switch_vSwitch_ports.length = 0;
  vSwitchLinks.length = 0;
  switch_id.length = 0;
  d3_nodes.length = 0;
  d3_edges.length = 0;
  manualTopo.length = 0;
  $('svg').each(function(){
      $(this).remove();
   })

  ClusterCounter = 0;
   $('.VM').each(function(){
      jsPlumb.detachAllConnections($(this));
      $(this).remove();
   })

   Idx['VM']=-1;
   $('.Switch').each(function(){
      jsPlumb.detachAllConnections($(this));
      $(this).remove();
   })
   Idx['Switch']=-1;
    
  $('.vSwitch').each(function(){
      jsPlumb.detachAllConnections($(this));
      $(this).remove();
   })
   Idx['vSwitch']=-1;
}

		//Connection Listener
		//Deal with multiple connections between two Endpoints
/**$("#initPhysical").click(function()
{
  cleanTopo();  
  var remotePhysical = getData();
  physicalTopo = JSON.parse(remotePhysical);
  console.log(physicalTopo);

  for(var index in physicalTopo.switches)
  {
    switch_id.push(addSwitch("Switch",physicalTopo.switches[index]));

  }
  
    $("#Switch1").css("top","80px");
    $("#Switch2").css("top","80px");
    $("#Switch5").css("top","80px");
    $("#Switch7").css("top","80px");
    $("#Switch8").css("top","80px");

    $("#Switch4").css("top","380px");
    $("#Switch9").css("top","380px");
    $("#Switch0").css("top","380px");
    $("#Switch6").css("top","380px");
    $("#Switch3").css("top","380px");

    $("#Switch10").css("top","200px");

    $("#Switch8").css("left","40px");
    $("#Switch1").css("left","200px");
    $("#Switch2").css("left","360px");
    $("#Switch5").css("left","520px");
    $("#Switch7").css("left","680px");

    $("#Switch4").css("left","40px");
    $("#Switch9").css("left","200px");
    $("#Switch0").css("left","360px");
    $("#Switch6").css("left","520px");
    $("#Switch3").css("left","680px");

    $("#Switch10").css("left","950px");

  
  console.log(switch_id);
  
  
  for(var index in physicalTopo.links)
  {
    for(var i in switch_id)
    {
      if(physicalTopo.links[index].dst.dpid == switch_id[i].dpid)
        {
          physicalTopo.links[index].dst.swid = switch_id[i].swid;
        }
    }
    for(var i in switch_id)
    {
      if(physicalTopo.links[index].src.dpid == switch_id[i].dpid)
        {
          physicalTopo.links[index].src.swid = switch_id[i].swid;
        }
    }
  }

  console.log(physicalTopo);

  for(var index in physicalTopo.links)
  { 
    var linkLabel = physicalTopo.links[index].linkId;
    phyLink[index] = jsPlumb.connect({source:physicalTopo.links[index].src.swid,
                     target:physicalTopo.links[index].dst.swid,
    overlays:[
       [ "Label", {label:"", id:"label"+index}]
             ]
		
                     });
  }
 init_switch_host_cpu();

   $(".Switch").each(function(){
              
              SWID=$(this).attr("id");
              $('#'+SWID).popover(
          {
            trigger:'click',
            template:'<div class="popover" role="tooltip"><div class="arrow"></div><h3 class="popover-title">name</h3><div class="popover-content">setting</div>',
            html: true,
            title:"交换机信息",
            content: getNetworkInfo(SWID),
     });
});

});

**/

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
      toastr.error("Error! "+message)
      break;
    case "Warning":
      toastr.warning("Warning! "+message)
      break;
    default:
      toastr.success("Success! "+message)
      break;
  }
}

function initphysical(topo){
  cleanTopo();  
  // var remotePhysical = getData();
  // physicalTopo = JSON.parse(remotePhysical);
  physicalTopo = JSON.parse(topo);
  for(var index in physicalTopo.switches)
  {
    switch_id.push({"swid":"Switch"+index,"dpid":physicalTopo.switches[index].dpid});

  }
  
  for(var index in physicalTopo.links)
  {
    for(var i in switch_id)
    {
      if(physicalTopo.links[index].dst.dpid == switch_id[i].dpid)
        {
          physicalTopo.links[index].dst.swid = switch_id[i].swid;
        }
    }
    for(var i in switch_id)
    {
      if(physicalTopo.links[index].src.dpid == switch_id[i].dpid)
        {
          physicalTopo.links[index].src.swid = switch_id[i].swid;
        }
    }
  }

  for(var index in physicalTopo.switches){
    for(var i in switch_id){
      if(physicalTopo.switches[index].dpid == switch_id[i].dpid){
        physicalTopo.switches[index].swid = switch_id[i].swid;
        physicalTopo.switches[index].name = switch_id[i].swid;
        physicalTopo.switches[index].pro = "switch";
      }
    }
  }

  for(var index in physicalTopo.switches){
    d3_nodes.push(physicalTopo.switches[index]);
  }

  for(var index in physicalTopo.hosts){
    physicalTopo.hosts[index].name = "host"+index
    physicalTopo.hosts[index].hostDomId = "host"+index
    physicalTopo.hosts[index].pro = "host"
    d3_nodes.push(physicalTopo.hosts[index])
  }

  console.log(d3_nodes);

   for (var index in physicalTopo.links){
    for (var i in d3_nodes){
      if(physicalTopo.links[index].src.dpid == d3_nodes[i].dpid && d3_nodes[i].pro == "switch"){
        physicalTopo.links[index].source = parseInt(i);
      }
      if(physicalTopo.links[index].dst.dpid == d3_nodes[i].dpid && d3_nodes[i].pro == "switch"){
        physicalTopo.links[index].target = parseInt(i);
      }
    }
    d3_edges.push(physicalTopo.links[index])
  }
  for(var index in physicalTopo.hosts){
    if(physicalTopo.hosts[index].dpid =="") continue;
    var link = {}
    for(var i in d3_nodes){
      if(physicalTopo.hosts[index].name ==d3_nodes[i].name){
        link.source = parseInt(i)
      }
      if(physicalTopo.hosts[index].dpid ==d3_nodes[i].dpid && d3_nodes[i].pro == "switch"){
        link.target = parseInt(i)
      }
    }
    d3_edges.push(link)
  }
  console.log(d3_edges);
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
              .size([1000,800])
              .linkDistance(100)
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
                .attr("type","button")
                .attr("width",function(d){
                  if(d.pro=="switch"){
                    return 50;
                  }
                  else return 40
                })
                .attr("height",function(d){
                  if(d.pro=="switch"){
                    return 50;
                  }
                  else return 40;
                })
                // .attr("type","button")
                .attr("xlink:href",function(d){
                  if(d.pro=="switch"){
                    if(d.node=="br-int"){
                      return "/static/virtualnetwork/br-int.svg"
                    }
                    else
                      return "/static/virtualnetwork/switch.svg"
                  }
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
            .attr("class","tooltip")
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
        image_info = "<strong>主机信息:</strong>"+"<br />"+"MAC ID: "+d.mac+"<br />"+"IP: "+d.ip
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
                  if (d.pro=="switch"){
                    return 20
                  }
                  else return 8
                })
                .text(function(d){
                  if(d.pro=="host")
                    return d.relname;
                  else return d.name;
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
      //$("#"+this.id).css("stroke","#11CD6E") //绿
      $("#"+this.id).css("stroke","#B15BFF") //紫
      // console.log($("#"+this.id).css("stroke"))
      var tempLink = {
         "src":e.target.__data__.source.name,
         "dst":e.target.__data__.target.name
      }
      manualTopo.push(tempLink);
      //console.log(e.target.__data__.source.name)
    }
    else{
      $("#"+this.id).css("stroke","#56ABE4") //蓝
      for(var index in manualTopo)
      {
        if(manualTopo[index].src == e.target.__data__.source.name && manualTopo[index].dst == e.target.__data__.target.name)
        {
          manualTopo.splice(index,1);
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
      //if($("#"+this.id).css("stroke")=="rgb(17, 205, 110)"){  //绿
      if($("#"+this.id).css("stroke")=="rgb(177, 91, 255)"){  //紫
    }
    else $("#"+this.id).css("stroke","#56ABE4")   //蓝
  });
}

$("#initPhysical").click(function()
{
  $.ajax({
    type:"GET",
    url:"physicaljson",
    cache:false,
    async:true,
    success:function(result){
      var rel = JSON.parse(result)
      insert_box(rel._type,rel._message)
      // $('.alert').animate({"width":"300px"});
      initphysical(result);
    }
  })
});

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
    data:JSON.stringify(removeTopo),
    cache:false,
    async:true,
    success:function(result){
      var rel = JSON.parse(result)
      insert_box(rel._type,rel._message)
      // $('.alert').animate({"width":"300px"});
    }
  })
});
/**
$("#getVirtual").click(function(){

});
**/
$("#autoVirtual").click(function(){
  var controller_ip = $("#controller_ip").val();
  if (controller_ip){
    var ctrls ="tcp:"+controller_ip+":6633"
    linkListCollection();
    var autoSwitchList = manualSwitchListCollection();
    var physicalClone = {
      "id": "1",
      "jsonrpc": "2.0",
      "method": "createNetwork",
      "params": {
          "network": {
              "controller": {
                  "ctrls": [
                      // "tcp:localhost:6634"
                      ctrls
                  ],
                  "type": "custom"
              },
              "hosts": autoHostList,
              "switches":autoSwitchList,
              "links": vSwitchLinks,
              "routing": {
                  "algorithm": "spf",
                  "backup_num": 1
              },
              "subnet": "192.168.0.0/24",
              "type": "custom_auto"
          }
      }
    }
    console.log(json_autoVirtual);
    $.ajax({
    type:"POST",
    url:"autoVirtualTopo",
    data:JSON.stringify(physicalClone),
    cache:false,
    async:true,
    success:function(result){
      var rel = JSON.parse(result)
      insert_box(rel._type,rel._message)
      // $('.alert').animate({"width":"300px"});
    }
  })
  }
  else {
    insert_box("Warning",'请输入控制器IP')
    // $('.alert').animate({"width":"300px"});
    $("#controller_ip").focus();
  }   
});
/**
$("#manualVirtual").click(function(){

  linkListCollection();
  var manualSwitchList = manualSwitchListCollection();
  var physicalmanual = {
    "id": "1",
    "jsonrpc": "2.0",
    "method": "createNetwork",
    "params": {
        "network": {
            "controller": {
                "ctrls": [
                    "tcp:localhost:6634"
                ],
                "type": "custom"
            },
            "copy-dpid": false,
            "hosts": autoHostList,
            "switches": manualSwitchList,
            "links": vSwitchLinks,
            "routing": {
                "algorithm": "spf",
                "backup_num": 1
            },
            "subnet": "192.168.0.0/24",
            "type": "custom_manual"
        }
    }
  }
  var json_manualVirtual = JSON.stringify(physicalmanual);
  console.log(json_manualVirtual);

  var temTest = {
    "id": "1",
    "jsonrpc": "2.0",
    "method": "createNetwork",
    "params": {
        "network": {
            "controller": {
                "ctrls": [
                    "tcp:localhost:6634"
                ],
                "type": "custom"
            },
            "copy-dpid": false,
            "hosts": [
                {
                    "dpid": "00:00:00:00:00:00:01:00",
                    "mac": "00:00:00:00:01:01",
                    "port": 1
                },
                {
                    "dpid": "00:00:00:00:00:00:04:00",
                    "mac": "00:00:00:00:04:02",
                    "port": 2
                },
                {
                    "dpid": "00:00:00:00:00:00:08:00",
                    "mac": "00:00:00:00:08:03",
                    "port": 3
                }
            ],
            "switches": [
                    "00:00:00:00:00:00:01:00",
                    "00:00:00:00:00:00:04:00",        
                    "00:00:00:00:00:00:07:00",
                    "00:00:00:00:00:00:08:00",
                    "00:00:00:00:00:00:09:00"
            ],
            "links":[                                 
                {"src":{"dpid":"00:00:00:00:00:00:01:00",
                        "port":6
                       },
                 "dst":{"dpid":"00:00:00:00:00:00:07:00",
                        "port":5
                       }
                },
                {"src":{"dpid":"00:00:00:00:00:00:07:00",
                        "port":7
                       },
                 "dst":{"dpid":"00:00:00:00:00:00:08:00",
                        "port":5
                       }
                },
                {"src":{"dpid":"00:00:00:00:00:00:08:00",
                        "port":7
                       },
                 "dst":{"dpid":"00:00:00:00:00:00:09:00",
                        "port":5
                       }
                },
                {"src":{"dpid":"00:00:00:00:00:00:09:00",
                        "port":6
                       },
                 "dst":{"dpid":"00:00:00:00:00:00:04:00",
                        "port":6
                       }
                },

            ],
            "routing": {
                "algorithm": "spf",
                "backup_num": 1
            },
            "subnet": "192.168.0.0/24",
            "type": "custom"
        }
    }
}

//  var tem = JSON.stringify(temTest);
//  console.log(tem);
//  var rete = postData(tem,"manualVirtualTopo");
  var res = postData(json_manualVirtual,"manualVirtualTopo");
  console.log(res);
 // console.log(rete);
 // autoHostList.length = 0;
 // autoSwitchList.length = 0;
  vSwitchLinks.length = 0;

});


**/

$("#manualVirtual").click(function(){
  var controller_ip = $("#controller_ip").val();
  if(controller_ip){
    console.log(manualTopo)
    var d3_manualSwitchList = d3_manualSwitchListCollection(manualTopo);
    var d3_autoHostList = d3_hostListCollection(manualTopo);
    var d3_vSwitchLinks = d3_linkListCollection(manualTopo);
    var ctrls ="tcp:"+controller_ip+":6633"

    var physicalmanual = {
      "id": "1",
      "jsonrpc": "2.0",
      "method": "createNetwork",
      "params": {
          "network": {
              "controller": {
                  "ctrls": [
                      //"tcp:localhost:6634"
                       ctrls 
                  ],
                  "type": "custom"
              },
              "copy-dpid": false,
              "hosts": d3_autoHostList,
              "switches": d3_manualSwitchList,
              "links": d3_vSwitchLinks,
              "routing": {
                  "algorithm": "spf",
                  "backup_num": 1
              },
              "subnet": "192.168.0.0/24",
              "type": "custom_manual"
          }
      }
    }
    $.ajax({
    type:"POST",
    url:"manualVirtualTopo",
    data:JSON.stringify(physicalmanual),
    cache:false,
    async:true,
    success:function(result){
      var rel = JSON.parse(result)
      insert_box(rel._type,rel._message)
      // $('.alert').animate({"width":"300px"});
    }
  })
  }
  else {
    insert_box("Warning",'请输入控制器IP')
    // $('.alert').animate({"width":"300px"});
    $("#controller_ip").focus();
  } 
});

/**
$("#check_cpu_status").click(function()
{
    $("#cpu_band_table").animate({height:'toggle',opacity:'0.9'});
    $("#s_c_0").html(switch_host_cpu[0].cpuUtil+"%");
    $("#s_c_1").html(switch_host_cpu[1].cpuUtil+"%");
    $("#s_c_2").html(switch_host_cpu[2].cpuUtil+"%");
    $("#s_c_3").html(switch_host_cpu[3].cpuUtil+"%");
    $("#s_c_4").html(switch_host_cpu[4].cpuUtil+"%");
    $("#s_c_5").html(switch_host_cpu[5].cpuUtil+"%");
    $("#s_c_6").html(switch_host_cpu[6].cpuUtil+"%");
    $("#s_c_7").html(switch_host_cpu[7].cpuUtil+"%");
    $("#s_c_8").html(switch_host_cpu[8].cpuUtil+"%");
    $("#s_c_9").html(switch_host_cpu[9].cpuUtil+"%");
    $("#s_c_10").html(switch_host_cpu[10].cpuUtil+"%");
});

**/

$("#check_bandwidth_status").click(function()
{
    $.ajax({
      type:"POST",
      url:"test_Bandwidth",
      data:JSON.stringify(physicalTopo),
      cache:false,
      async: true,
      success:function(result){
        console.log(result)
        rel = JSON.parse(result)
        insert_box(rel._type,rel._message)
        // $('.alert').animate({"width":"300px"});
        res = rel.links;
        for(var index=0; index<res.length;index++ ){
            var lab = "label"+index;
            console.log(res[index].bytes1)
            var band = (res[index].bytes1 - res[index].bytes0)/(res[index].time1-res[index].time0);
		        var band_txt = 0;
		        if((band/1024)>1024)
		          band_txt = ((band/1024)/1024).toFixed(2) +"MB/s";
            else if (band>1024) 
			        band_txt = (band/1024).toFixed(2) +"KB/s";
		        else band_txt = band.toFixed(2) + "Byte/s";
            $("#linetext"+index).html(band_txt);
        }

      }
    })
}); 

$.ajax({
  type:"GET",
  url:"physicaljson",
  cache:false,
  async:true,
  success:function(result){
    var rel = JSON.parse(result)
    insert_box(rel._type,rel._message)
    // $('.alert').animate({"width":"300px"});
    initphysical(result);
  }
})

/**
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
	//		console.log(connection);
	//		connection.setLabel(cidr);
			Idx['Connection']++;
		});	
    **/	
});

