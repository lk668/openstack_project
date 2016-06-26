
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

function postData(obj){
	payload = obj;
	xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function()
   {
          if (xmlhttp.readyState == 4){
				if((xmlhttp.status >= 200 &&xmlhttp.status < 300)||xmlhttp.status == 304){
					alert("任务已成功提交，等待响应");
                }
                else {
                    alert("Request was unsuccessful: "+ xmlhttp.status);
                }
          }
   };
	xmlhttp.open("POST","json",true);
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
          "port": hostid
  }
  autoHostList.push(hostInfo);
  console.log(autoHostList);
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
            img.attr({"src":"static/mysite/instance.svg","width":"50px","height":"50px"});     
            img.appendTo(newItem);       
        
			newItem.append(title);
			$("#mininet-container").append(newItem);
      jsPlumb.connect({source:sw_id,
                     target:newItem,
                     endpoint:[ "Dot", { radius:2} ],
                     anchor:"AutoDefault"});
		//	jsPlumb.makeTarget(newItem, params(newItem));		
		//	jsPlumb.makeSource(title, params(newItem));     		
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
			var title = $('<div>').addClass('title').text("交换机");
		  var img = $('<img/>');
      var tempswitch_id = {
        "swid":str_name + Idx[str_name],
        "dpid":str_id
      }
      img.attr({"src":"/static/mysite/switch.svg","width":"50px","height":"50px"});       
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


/***
***交换机右键菜单***
***/

$(function(){
    $('#mininet-container').contextMenu({
        selector: '.Switch', 
        items: {
            "fold1a-key1": {name: "Host1", icon: "edit",callback:function()
            {
              SWID=$(this).attr("id"); 
              addInstance("VM","host1",SWID);
              hostListCollection(SWID,"1");

            }},
            "fold1a-key2": {name: "Host2", icon: "edit",callback:function()
            {
              SWID=$(this).attr("id"); 
              addInstance("VM","host2",SWID);
              hostListCollection(SWID,"2");
            }},
            "fold1a-key3": {name: "Host3", icon: "edit",callback:function()
            {
              SWID=$(this).attr("id"); 
              addInstance("VM","host3",SWID);
              hostListCollection(SWID,"3");
            }},
            "fold1a-key4": {name: "Host4", icon: "edit",callback:function()
            {
              SWID=$(this).attr("id"); 
              addInstance("VM","host4",SWID);
              hostListCollection(SWID,"4");
            }},
            "fold1a-key5": {name: "交换机", icon: "edit",callback:function()
            {
              SWID=$(this).attr("id");

              $('#NetworkModal').modal({keyboard: true});
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


function getRouterInfo(rtIds)
{
    var routerId;
    var routerName;
    var routerStatus;
    var routerUrl;
    var routerTempUrl;
    for(var index in routerInfo)
    {
          if(rtIds==routerInfo[index].rtId)
          {
            routerId = routerInfo[index].id;
            routerName = routerInfo[index].name;
            routerStatus = routerInfo[index].status;
            routerUrl = routerInfo[index].url;
          }
    }
    routerTempUrl = "<a target='_blank' href='"+routerUrl+"'>>>路由器详情</a>";
     return "路由器ID: "+routerId+"<br>"+"路由器名称: "+routerName+"<br>"+"路由器状态: "+routerStatus+"<br>"+routerTempUrl;
}

function getNetworkInfo(swIds)
{
    var switchId;
    for(var index in switch_id)
    {
         if(switch_id[index].swid == swIds)
         {
            switchId = switch_id[index].dpid;
         }
    }
     return "交换机ID: "+switchId+"<br>"+"名称: "+swIds;
}



        $("#clean").click(function() {
            cleanTopo();          
        });

      function cleanTopo()
      {
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
        autoHostList.length = 0;
      }


/***
        $(function(){  
           setInterval(initTopo(),3000);  
        });
          
function initTopo()
{
             cleanTopo();
             remoteData = getData();
             parseData = JSON.parse(remoteData);
             console.log(parseData);
             serverToNetwork(parseData.servers,parseData.networks,parseData.ports,parseData.routers);
             networkTopoDisplay();
             topoLink();
              $(".VM").each(function(){
                    var $pElem = $(this);
                    VMID = $(this).attr("id");

                              var instanceID = VmLink[VMID[2]].id;
            var instanceName = VmLink[VMID[2]].name;
            var instanceStatus = VmLink[VMID[2]].status;
            var instanceConsole = VmLink[VMID[2]].url+"vnc";
            var instanceUrl = VmLink[VMID[2]].url;
            var vmUrl="<a target='_blank' href='"+instanceUrl+"'>>>云主机详情</a>";
            var vmvncUrl="<a target='_blank' href='"+instanceConsole+"'>>>控制台</a>"
                        $('#'+VMID).popover(
                          {
                            trigger:'click', 
                            template:'<div class="popover" role="tooltip"><div class="arrow"></div><h3 class="popover-title"></h3><div class="popover-content"></div>', 
                            html: true,
                            title:"实例信息",
                            content:'云主机ID: '+instanceID+'<br>云主机名称: '+instanceName+'<br>云主机状态: '+instanceStatus+'<br>'+vmUrl+'   '+ vmvncUrl,
                           }
             );            
            });
            $(".Router").each(function(){
                    var $rElem = $(this);
                    RTID = $(this).attr("id");
                        $('#'+RTID).popover(
                          {
                            trigger:'click', 
                            template:'<div class="popover" role="tooltip"><div class="arrow"></div><h3 class="popover-title">name</h3><div class="popover-content">setting</div>', 
                            html: true,
                            title:"路由器信息",
                            content: getRouterInfo(RTID),
                           
               });        
            });
               $(".Switch").each(function(){
                    var $sElem = $(this);
                    SWID = $(this).attr("id");
                        $('#'+SWID).popover(
                          {
                            trigger:'click', 
                            template:'<div class="popover" role="tooltip"><div class="arrow"></div><h3 class="popover-title">name</h3><div class="popover-content">setting</div>', 
                            html: true,
                            title:"网络信息",
                            content: getNetworkInfo(SWID),
                           
               });        
            });
              $(".FW").each(function(){
                        $(".FW").popover(
                          {
                            trigger:'click', 
                            template:'<div class="popover" role="tooltip"><div class="arrow"></div><h3 class="popover-title">name</h3><div class="popover-content">setting</div>', 
                            html: true,
                            title:"防火墙信息",
                            content: "<a target='_blank' href='/horizon/project/firewalls/'>>>防火墙详情</a>",
                           
               });        
            });
              $(".LB").each(function(){
                        $(".LB").popover(
                          {
                            trigger:'click', 
                            template:'<div class="popover" role="tooltip"><div class="arrow"></div><h3 class="popover-title">name</h3><div class="popover-content">setting</div>', 
                            html: true,
                            title:"负载均衡信息",
                            content: "<a target='_blank' href='/horizon/project/loadbalancers/'>>>负载均衡详情</a>",
                           
               });        
            });

            
}


**/

		//Connection Listener
		//Deal with multiple connections between two Endpoints
$("#initPhysical").click(function()
{
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
    var phyLink = jsPlumb.connect({source:physicalTopo.links[index].src.swid,
                     target:physicalTopo.links[index].dst.swid});
    //phyLink.setLabel(linkLabel);
  }

 $(".Switch").each(function(){
    var $sElem = $(this);
    SWID = $(this).attr("id");
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
$("#autoVirtual").click(function(){
  var physicalClone = {
    "id": "1",
    "jsonrpc": "2.0",
    "method": "createNetwork",
    "params": {
        "network": {
            "controller": {
                "ctrls": [
                    "tcp:localhost:20000"
                ],
                "type": "custom"
            },
            "copy-dpid": true,
            "hosts": autoHostList,
            "routing": {
                "algorithm": "spf",
                "backup_num": 1
            },
            "subnet": "192.168.0.0/24",
            "type": "physical"
        }
    }
  }
  var json_autoVirtual = JSON.stringify(physicalClone);
  console.log(json_autoVirtual);

});
	   
     jsPlumb.bind('connection',function(info){
		 var connsList = jsPlumb.getConnections();
    		for(var index in connsList)
     		 {
         		 connsList[index].bind("click",function(){
					   console.log(connsList[index].sourceId+connsList[index].targetId);
         		 $('#connModal').modal({keyboard: true});});
        	}

  			

			var connection = info.connection;
			var arr1 = jsPlumb.select({source:connection.sourceId,target:connection.targetId});
			var arr2 = jsPlumb.select({source:connection.targetId,target:connection.sourceId});
			var endpoints = connection.endpoints;
			if(arr1.length + arr2.length>1){
				jsPlumb.detach(connection);
				return ;
			}
			var connectionIdx = Idx['Connection'];
			var cidr = "10.1."+connectionIdx+".0/24";
			//connection.setLabel(cidr);
			Idx['Connection']++;
		});
		
	});
