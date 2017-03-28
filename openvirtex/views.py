#!/usr/bin/env python
# -*- coding: utf-8 -*-
import json
import string
import random
import time
import os
import pika
import subprocess   
import commands

import paramiko
import yaml
import re
import traceback
from pymongo import MongoClient

from openstack_dashboard.dashboards.project.openvirtex.lib import ssh
from openstack_dashboard import api

from django.conf import settings
from django.core.urlresolvers import reverse
from django.core.urlresolvers import reverse_lazy
from django.http import HttpResponse  # noqa
from django.views.generic import TemplateView  # noqa
from django.views.generic import View  # noqa
from django.core.context_processors import csrf
from django.shortcuts import render_to_response
from django.views.decorators.csrf import csrf_exempt


# openstack import
from horizon import views
from horizon import tabs

def hello(request):
    return HttpResponse("Hello world")

class IndexView (TemplateView):
    template_name = 'project/openvirtex/index.html'

class Mongodb():
    def __init__(self):
        self.client = MongoClient('localhost',27017)
        self.db = self.client.neutron_ovx  #database name
        self.db_collection = self.db.map_virtual # collection name

@csrf_exempt
def autoVirtualTopo(request): #auto generate virtual networkTopology
    if request.method == 'POST':
        response = {}
        file_dir = os.getcwd()+'/static/openvirtex/tmp/temp_auto.json'
        autoTopo = json.loads(request.body)
        temp=open(file_dir,'w')
        temp.write(json.dumps(autoTopo))
        temp.close()
        try:
            rel = os.popen("curl localhost:8000 -X POST -d @"+file_dir).read()
            json_rel = json.loads(rel)
        except Exception,e:
            response = {"_type":"Error","_message":traceback.format_exc()}
            return HttpResponse(json.dumps(response))
        if json_rel.has_key('result'):
            try:
                tenant_id = request.user.tenant_id
                username = request.user.username
                ovx_id = json_rel['result']['tenantId']
                physical_topo = request.body
                controller_ip = autoTopo["params"]["network"]["controller"]["ctrls"][0][4:-5]
                Mongodb().db_collection.insert_one({"tenant_id":tenant_id,'username':username,
                                                    'ovx_id':ovx_id,'controller_ip':controller_ip,
                                                    'physical_topo':physical_topo})
                response = {"_type":"Success","_message":"Create a virtual with ID: "+str(ovx_id)}
            except Exception,e:
                response = {"_type":"Error","_message":traceback.format_exc()}
                return HttpResponse(json.dumps(response))
        else: 
            response = {"_type":"Error","_message":str(json_rel['error'])}
        return HttpResponse(json.dumps(response))
        # virtual_id=autoTopo.get("id")     #获取租户的id
        # tcp_port =str(int(virtual_id)+6633)         #监听端口号为租户id+6634
        # wsapi_port =str(int(virtual_id)+8081)  
        # shell_command_ryu='ryu-manager --ofp-tcp-listen-port='+tcp_port+' --wsapi-port='+wsapi_port+" --observe-links"
        # subprocess.Popen(shell_command_ryu,shell=True)  #启动ryu
        # time.sleep(2)                                            #休眠2秒
        # subprocess.Popen("curl localhost:8000 -X POST -d @"+file_dir,shell=True)
        # time.sleep(1)
        # temp_out=open('/home/ebupt1/work/OpenVirteX_TEMP/utils/temp_output.txt','r')
        # try:
        #     text=json.dumps(temp_out.read())
        # finally:
        #     temp_out.close() 
        # return HttpResponse(text)

@csrf_exempt
def removeVirtualTopo(request): #remove virtual NetwoekTopology
    if request.method == 'POST':
        tenant_id = request.user.tenant_id
        username = request.user.username
        response = {}
        manualTopo = json.loads(request.body)
        try:
            ovx_virtual = Mongodb().db_collection.find_one({"tenant_id":tenant_id,'username':username})
        except Exception,e:
            response = {"_type":"Error","_message":traceback.format_exc()}
            return HttpResponse(json.dumps(response))
        if ovx_virtual is None:
            response = {"_type":"Warning","_message":"The tenant or the user doesn't have a SDN virtual network."}
        else:
            try:
                manualTopo["params"]["network"]["tenantId"] = int(ovx_virtual['ovx_id'])
                file_dir = os.getcwd()+'/static/openvirtex/tmp/removeTopo.json'
                temp=open(file_dir,'w')
                temp.write(json.dumps(manualTopo))
                temp.close()
                rel = os.popen("curl localhost:8000 -X POST -d @"+file_dir).read()
                Mongodb().db_collection.delete_one({"tenant_id":tenant_id,'username':username}) 
                response = {"_type":"Success","_message":"remove the SDN virtual network: "+str(manualTopo["params"]["network"]["tenantId"])}
            except Exception,e:
                response = {"_type":"Error","_message":traceback.format_exc()}
                return HttpResponse(json.dumps(response))
        return HttpResponse(json.dumps(response))
        #subprocess.Popen("curl localhost:8000 -X POST -d @/home/ebupt1/work/OpenVirteX_TEMP/utils/removeTopo.json",shell=True)
        #virtual_id=manualTopo.get("id")       #获取租户的id
        #tcp_port=int(virtual_id)+6633         #监听端口号为租户id+6633
        #subprocess.Popen('kill `netstat -nlp | grep :%s | awk \'{print $7}\' | awk -F"/" \'{ print $1 }\'`'%tcp_port,shell=True) #结束ryu进程
        # temp_out=open('/home/ebupt1/work/OpenVirteX_TEMP/utils/temp_output.txt','r')
        # try:
        #     text=json.dumps(temp_out.read())
        # finally:
        #     temp_out.close()
        # return HttpResponse(text) 

@csrf_exempt
def test_Bandwidth(request): #Test physical network bandwidth
    switch_name = [{"ip":"10.108.125.234","bridges":['br-int','br-test3','br-test4']},{"ip":"10.108.126.3","bridges":['br-int','br-test0','br-test1']},{"ip":"10.108.126.4","bridges":['br-int','br-test5','br-test6']}]
    if request.method == 'POST':
        response = {}
        band_set = json.loads(request.body)
        band_links = band_set['links']
        f = open(os.getcwd()+"/static/openvirtex/config/config.yml")
        config = yaml.load(f)
        try:  
            for i in range(0,2):
                switch_flow_tmp = []
                switch_flow = {}
                for server in switch_name:
                    for bridge in server["bridges"]:
                        cmd = "ovs-ofctl dump-flows "+bridge
                        rel = ssh.ssh_save_exec(server['ip'],config['username'],config['passwd'],cmd)
                        switch_flow_tmp.append({'ip':server['ip'],"bridge":bridge,"flows":rel})
                for flow in switch_flow_tmp:
                    for switch in band_set["switches"]:
                        if flow['ip']==switch['local_ip'] and flow['bridge'] == switch['node']:
                            switch_flow[switch['dpid']] = flow['flows']    
                for j in range(0,len(band_links)):
                    in_port1 = band_links[j]['src']['port']
                    in_port2 = band_links[j]['dst']['port']
                    rel_src = switch_flow[band_links[j]['src']['dpid']]
                    rel_dst = switch_flow[band_links[j]['dst']['dpid']]
                    band_links[j]['time'+str(i)] = time.time()
                    band_links[j]['bytes'+str(i)] = 0
                    if len(rel_src)>1:
                        band_links[j]['bytes'+str(i)] += get_Bytes(rel_src,in_port1)
                    if len(rel_dst)>1:
                        band_links[j]['bytes'+str(i)] += get_Bytes(rel_dst,in_port2)
            response['links'] = band_links
            response["_type"] = "Success"
            response["_message"] = "Test physical network bandwidth success"
        except Exception,e:
            response = {"_type":"Error","_message":traceback.format_exc(),"links":[]}
        return HttpResponse(json.dumps(response))

@csrf_exempt
def manualVirtualTopo(request): #manual generate virtual networkTopology
    if request.method == 'POST':
        response = {}
        manualTopo = json.loads(request.body)
        file_dir = os.getcwd()+ '/static/openvirtex/tmp/temp.json'
        temp=open(file_dir,'w')
        temp.write(json.dumps(manualTopo))
        temp.close()
        try:
            rel = os.popen("curl localhost:8000 -X POST -d @"+file_dir).read()
            json_rel = json.loads(rel)
        except Exception,e:
            response = {"_type":"Error","_message":traceback.format_exc()}
            return HttpResponse(json.dumps(response))  
        if json_rel.has_key('result'):
            try:
                tenant_id = request.user.tenant_id
                username = request.user.username
                ovx_id = json_rel['result']['tenantId']
                physical_topo = json.dumps(manualTopo)
                controller_ip = manualTopo["params"]["network"]["controller"]["ctrls"][0][4:-5]
                Mongodb().db_collection.insert_one({"tenant_id":tenant_id,'username':username,
                                                    'ovx_id':ovx_id,'controller_ip':controller_ip,
                                                    'physical_topo':physical_topo})
                response = {"_type":"Success","_message":"Create a virtual with ID: "+str(ovx_id)}
            except Exception,e:
                response = {"_type":"Error","_message":traceback.format_exc()}
                return HttpResponse(json.dumps(response)) 
        else: 
            response = {"_type":"Error","_message":str(json_rel['error'])}
        return HttpResponse(json.dumps(response))
        #virtual_id=manualTopo.get("id")     #获取租户的id
        #tcp_port =str(int(virtual_id)+6633)         #监听端口号为租户id+6634
        #wsapi_port =str(int(virtual_id)+8081)  
        #shell_command_ryu='ryu-manager --ofp-tcp-listen-port='+tcp_port+' --wsapi-port='+wsapi_port+" --observe-links"
        #subprocess.Popen(shell_command_ryu,shell=True)  #启动ryu
        #time.sleep(2)                                            #休眠2秒
        #subprocess.Popen("curl localhost:8000 -X POST -d @/home/ebupt1/work/OpenVirteX_TEMP/utils/temp.json",shell=True)
        #time.sleep(3)
        #temp_out=open('/home/ebupt1/work/OpenVirteX_TEMP/utils/temp_output.txt','r')
        # try:
        #     text=json.dumps(temp_out.read())
        # finally:
        #     temp_out.close() 

@csrf_exempt
def physicaljson(request): #get physicalTopo json data
    if request.method == 'GET':
        response = {}
        data = open(os.getcwd()+'/static/openvirtex/openstack_topo.json','r')
        try:
            topoInfo = json.loads(data.read()) # json dict  
            serversInfo = get_servers(request)  # list
            portsInfo = get_neutron_ports(request)      #list
            ovsPortsInfo = get_ovsPorts()       #list
            vlan_ids = get_vlan_id()            #dict
        except Exception,e:
            response = {"_type":"Error","_message":traceback.format_exc()}
            return HttpResponse(json.dumps(response)) 
        for ovs_port in ovsPortsInfo:
            for switch in topoInfo["switches"]:
                if ovs_port["ip"] == switch["ip"]:
                    ovs_port["dpid"] = switch["dpid"]
        for server in serversInfo:
            relname = server["name"]
            server_id = server["id"]
            port_id = ""
            port_num = 0
            mac = ""
            dpid = ""
            ip = ""
            for port in portsInfo:
                if port["device_id"] == server_id:
                    port_id = port["id"]
                    mac = port["mac_address"]
                    ip = port["fixed_ips"][0]["ip_address"]
                    break
            for bridge in ovsPortsInfo:
                for port in bridge["ports"]:
                    a = re.search(r"\(.+\)",port).group()
                    if a[4:-1] == port_id[:11]:
                        dpid = bridge['dpid']
                        port_num = int(re.search(r"\d+",port).group())
                        if vlan_ids.has_key(a[1:-1]):
                            vlan_id = vlan_ids[a[1:-1]]
                        else:
                            vlan_id = 'null'
                        break
            topoInfo["hosts"].append({"dpid":dpid,"mac":mac,"port":port_num,"relname":relname,"ip":ip, "vlan":vlan_id})
        topoInfo["_type"] = "Success"
        topoInfo["_message"] = "Init physical topology success"
        return HttpResponse(json.dumps(topoInfo))

# gain the nova servers
def get_servers(request):
    try:
        servers, more = api.nova.server_list(request)
    except Exception:
        servers = []
    data = [{'name': server.name,
             'status': server.status,
             'image_name':server.image_name,
             'task': getattr(server, 'OS-EXT-STS:task_state'),
             'id': server.id} for server in servers]
    return data

#gain the neutron port_list
def get_neutron_ports(request):
    try:
        neutron_ports = api.neutron.port_list(request)
    except Exception:
        neutron_ports = []
    ports = [{'id': port.id,
              'device_id': port.device_id,
              'device_owner': port.device_owner,
              'fixed_ips': port.fixed_ips,
              'status': port.status,
              'mac_address': port.mac_address}
             for port in neutron_ports]
    return ports

#gain the port num of the br-int
def get_ovsPorts():
    ovs_ports = []
    f = open(os.getcwd()+"/static/openvirtex/config/config.yml")
    config = yaml.load(f)
    cmd = config['execs']
    username = config['username']
    passwd = config['passwd']
    ips = config['ips']
    for ip in ips:
        rel = ssh.ssh_save_exec(ip,username,passwd,cmd)
        s = []
        if rel is not "Error":
            for port in rel:
                port_num = re.match(r"^\d+.+",port.strip())
                if port_num is not None:
                    s.append(port_num.group().split(' ')[0])
            a = {'ip':ip,'ports':s}
            ovs_ports.append(a)
    return ovs_ports

def get_vlan_id():
    vlan_ids = {}
    f = open(os.getcwd()+"/static/openvirtex/config/config.yml")
    config = yaml.load(f)
    cmd = 'ovs-vsctl show'
    username = config['username']
    passwd = config['passwd']
    ips = config['ips']
    for ip in ips:
        rel = ssh.ssh_save_exec(ip, username, passwd, cmd)
        if rel is not "Error":
            for i in range(len(rel)):
                line1 = rel[i].strip()
                if line1.startswith('Port'):
                    line2 = rel[i + 1].strip()
                    if line2.startswith('tag'):
                        vlan_ids[str(line1[5:])] = str(line2[5:])
    return vlan_ids

def get_Bytes(rel,in_port):
    byte = 0
    for i in range(1,len(rel)):
        tmp = rel[i].split(',')
        in_p = tmp[6].strip()[8:]  # get in_port
        if(str(in_p) == str(in_port)):
            byte += int(tmp[4].strip()[8:])  #get bytes
    return byte

