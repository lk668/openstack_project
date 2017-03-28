#!/usr/bin/env python
# -*- coding: utf-8 -*-
import json
import string
import random
import time
import os
import pika
import subprocess
import socket     
import traceback

from pymongo import MongoClient
from openstack_dashboard.dashboards.project.virtualnetwork.lib import ovxctl

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
from horizon import messages
#`from openstack_dashboard.dashboards.project.openvirtex import tabs as openvirtex_tabs

def hello(request):
    return HttpResponse("Hello world")

#class IndexView (TemplateView):
#    template_name = 'project/virtualnetwork/index.html'

class IndexView (TemplateView):
    template_name = 'project/virtualnetwork/index.html'

class Mongodb():
    def __init__(self):
        self.client = MongoClient('localhost',27017)
        self.db = self.client.neutron_ovx  #database name
        self.db_collection = self.db.map_virtual # collection name

class RPC(object):
    def __init__(self,host_ip):
        self.connection = pika.BlockingConnection(pika.ConnectionParameters(
                host=host_ip))
 
        self.channel = self.connection.channel()
         
        #定义接收返回消息的队列
        result = self.channel.queue_declare(exclusive=True)
        self.callback_queue = result.method.queue
 
        self.channel.basic_consume(self.on_response,
                                   no_ack=True,
                                   queue=self.callback_queue)
 
    #定义接收到返回消息的处理方法
    def on_response(self, ch, method, props, body):
        self.response = body

    def request(self, message):
        self.response = None
        #发送计算请求，并声明返回队列
        self.channel.basic_publish(exchange='',
                                   routing_key='ryu_',
                                   properties=pika.BasicProperties(
                                         reply_to = self.callback_queue,
                                         ),
                                   body=message)
        #接收返回的数据
        while self.response is None:
            self.connection.process_data_events()
        return self.response

@csrf_exempt
def selectVirtualLinks(request): #get virtual NetworkLinks
    if request.method == 'POST':
        tenant_id = request.user.tenant_id
        username = request.user.username
        response = {}
        manualLink = json.loads(request.body)
        try:
            ovx_virtual = Mongodb().db_collection.find_one({"tenant_id":tenant_id,'username':username})
        except Exception,e:
            response = {"_type":"Error","_message":traceback.format_exc()}
            return HttpResponse(json.dumps(response))
        if ovx_virtual is None:
            response = {"_type":"Warning","_message":"The tenant or the user doesn't have a SDN virtual network."}
        else:
            try:
                ovx_id = ovx_virtual['ovx_id']
                command = ['-n', 'getVirtualAddressMapping', str(ovx_id)]
                (gopts, rargs, parser) = ovxctl.parse_global_args(command[0:])
                (parse_args, do_func) = ovxctl.CMDS[rargs[0]]
                (opts, args) = parse_args(rargs[1:], rargs[0])
                res = get_addr_mapping(gopts, opts, args)

                params = manualLink.get("params")
                network = params.get("network")
                req_hosts = network.get("hosts")

                phy_topo = json.loads(ovx_virtual['physical_topo'])
                phy_hosts = phy_topo["params"]["network"]["hosts"]

                for host in req_hosts:
                    pass
                ip = ovx_virtual['controller_ip']
                rpc = RPC(ip)
                response = rpc.request(request.body)
                if re.search(r"^Success",response) is not None:
                    response = {"_type":"Success","_message":"Link selection status: successful"}
                else:
                    response = {"_type":"Error","_message":"Link selection status: failed"}
            except Exception,e:
                response = {"_type":"Error","_message":traceback.format_exc()}
        # send_queue(json.dumps(manualLink))
        # time.sleep(2)
        # temp_out=open('/home/ebupt1/work/flow_status.txt','r')
        # text=temp_out.read()
        # if text=="":
        #     text="id:"+data.get("id")+"; "+"link_selection_status: "+"unsuccessful"
        # temp_out.close()
        # temp_updating=open('/home/ebupt1/work/flow_status.txt','w')
        # temp_updating.truncate()
        # temp_updating.close()
        return HttpResponse(json.dumps(response)) 

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
        # subprocess.Popen("curl localhost:8000 -X POST -d @/home/ebupt1/work/OpenVirteX_TEMP/utils/removeTopo.json",shell=True)
        #virtual_id=manualTopo.get("id")       #获取租户的id
        #tcp_port=int(virtual_id)+6633         #监听端口号为租户id+6633
        #subprocess.Popen('kill `netstat -nlp | grep :%s | awk \'{print $7}\' | awk -F"/" \'{ print $1 }\'`'%tcp_port,shell=True) #结束ryu进程
        # temp_out=open('/home/ebupt1/work/OpenVirteX_TEMP/utils/temp_output.txt','r')
        # try:
        #     text=json.dumps(temp_out.read())
        # finally:
        #     temp_out.close()
        # return HttpResponse(text) 

# @csrf_exempt
# def getVirtualTopo(request): #get virtual NetwoekTopology
#     if request.method == 'POST':
#         manualTopo = json.loads(request.body)    
#         temp=open('/home/ebupt1/work/OpenVirteX_TEMP/utils/getVirtualTopo.json','w')
#         temp.write(json.dumps(manualTopo))
#         temp.close()
#         subprocess.Popen("curl localhost:8000 -X POST -d @/home/ebupt1/work/OpenVirteX_TEMP/utils/getVirtualTopo.json",shell=True)
#         temp_out=open('/home/ebupt1/work/OpenVirteX_TEMP/utils/temp_output.txt','r')
#         try:
#             text=json.dumps(temp_out.read())
#         finally:
#             temp_out.close()
#         return HttpResponse(text)
@csrf_exempt
def getVirtualTopo(request): #get virtual NetwoekTopology
    if request.method == 'GET':
        tenant_id = request.user.tenant_id
        username = request.user.username
        response = {}
        try:
            ovx_virtual = Mongodb().db_collection.find_one({"tenant_id":tenant_id,'username':username})
        except Exception,e:
            response = {"_type":"Error","_message":traceback.format_exc()}
            return HttpResponse(json.dumps(response))
        if ovx_virtual is None:
            response = {"_type":"Warning","_message":"The tenant or the user doesn't have a SDN virtual network."}
        else:
            try:
                ovx_id = ovx_virtual['ovx_id']
                command=['-n','getVirtualTopology',str(ovx_id)]
                (gopts, rargs, parser) = ovxctl.parse_global_args(command[0:])
                (parse_args, do_func) = ovxctl.CMDS[rargs[0]]
                (opts, args) = parse_args(rargs[1:], rargs[0])
                response=get_virtualTopology(gopts, opts, args)
                response["_type"] = "Success"
                response["_message"] = "Init virtual network with ID: "+str(ovx_id)
            except Exception,e:
                response = {"_type":"Error","_message":traceback.format_exc()}
        return HttpResponse(json.dumps(response))

@csrf_exempt
def test_Delay_virtual(request): #test virtual delay
    if request.method == 'POST':
        virtual_topo = request.body
        tenant_id = request.user.tenant_id
        username = request.user.username
        response = {}
        try:
            ovx_virtual = Mongodb().db_collection.find_one({"tenant_id":tenant_id,'username':username})
        except Exception,e:
            response = {"_type":"Error","_message":traceback.format_exc()}
            return HttpResponse(json.dumps(response))
        # result_delay = test_delay_socket(virtual_topo)
        if ovx_virtual is None:
            response = {"_type":"Warning","_message":"The tenant or the user doesn't have a SDN virtual network."}
        else:
            try:
                ip = ovx_virtual['controller_ip']
                rpc = RPC(ip)
                response["links"] = json.loads(rpc.request(virtual_topo))
                response["_type"] = "Success"
                response["_message"] = "Test virtual network delay success"
            except Exception,e:
                response = {"_type":"Error","_message":traceback.format_exc(),"links":[]}
        return HttpResponse(json.dumps(response))

@csrf_exempt
def test_Band_virtual(request): #test virtual band
    if request.method == 'POST':
        virtual_topo_band = json.loads(request.body)
        tenant_id = request.user.tenant_id
        username = request.user.username
        response = {}
        try:
            ovx_virtual = Mongodb().db_collection.find_one({"tenant_id":tenant_id,'username':username})
        except Exception,e:
            response = {"_type":"Error","_message":traceback.format_exc()}
            return HttpResponse(json.dumps(response))
        # wsapi_port = int(virtual_topo_band['links'][0]['tenantId']) + 8081
        if ovx_virtual is None:
            response = {"_type":"Warning","_message":"The tenant or the user doesn't have a SDN virtual network."}
        else:
            try:
                ip = ovx_virtual['controller_ip']
                wsapi_port = 8080
                command_shell = "curl -X 'GET' http://"+ip+':'+str(wsapi_port)+"/stats/flow/"
                response['links'] = test_band(virtual_topo_band,command_shell)
                response["_type"] = "Success"
                response["_message"] = "Test virtual network bandwidth success"
            except Exception,e:
                response = {"_type":"Error","_message":traceback.format_exc(),"links":[]}
        return HttpResponse(json.dumps(response))

# def send_queue(message):
#     connection = pika.BlockingConnection(pika.ConnectionParameters(
#         host='localhost'))
#     channel = connection.channel()

#     channel.exchange_declare(exchange='ryu',type='fanout')
#     channel.queue_declare(queue='ryu_change_flow')
#     channel.basic_publish(exchange='ryu',
#                       routing_key='ryu_change_flow',
#                       body=message) 
#     connection.close()


def get_virtualTopology(gopts, opts, args):   #获取虚拟网络拓扑
    req={ "tenantId": int(args[0]) }
    result_topology = ovxctl.connect(gopts, "status", "getVirtualTopology", data=req, passwd=ovxctl.getPasswd(gopts)) #数据为json格式
    result_hosts = ovxctl.connect(gopts, "status", "getVirtualHosts", data=req, passwd=ovxctl.getPasswd(gopts))
    data=result_topology
    data["hosts"]=result_hosts
    return data

def test_band(virtual_topo_band,command_shell):
    band_links = virtual_topo_band['links']
    for i in range(0, 2):
        for j in range(0, len(band_links)):
            dpid_src = int(band_links[j]['src']['dpid'].replace(':',''),16)
            dpid_dst = int(band_links[j]['dst']['dpid'].replace(':',''),16)
            in_port1 = band_links[j]['src']['port']
            in_port2 = band_links[j]['dst']['port']
            tmp1 = command_shell+str(dpid_src)
            tmp2 = command_shell+str(dpid_dst)
            rel_src = os.popen(tmp1).readlines()
            rel_dst = os.popen(tmp2).readlines()
            band_links[j]['time'+str(i)] = time.time()
            band_links[j]['bytes'+str(i)] = 0
            band_links[j]['bytes'+str(i)]+= get_Bytes(rel_src,in_port1,dpid_src)
            band_links[j]['bytes'+str(i)]+= get_Bytes(rel_dst,in_port2,dpid_dst)
        if (i==0):
            time.sleep(10)
    return band_links

def get_Bytes(rel,in_port,dpid):
    req = json.loads(rel[0])
    flow_virtual = req[str(dpid)]
    byt = 0
    for i in range(0,len(flow_virtual)):
        if(int(in_port)==int(flow_virtual[i]['match']['in_port'])):
            byt += flow_virtual[i]['byte_count']
    return byt


# def send_queue(message):
#     connection = pika.BlockingConnection(pika.ConnectionParameters(
#         host='localhost'))
#     channel = connection.channel()

#     channel.exchange_declare(exchange='delay',type='fanout')
#     channel.queue_declare(queue='ryu_test_delay')
#     channel.basic_publish(exchange='delay',
#                       routing_key='ryu_test_delay',
#                       body=message) 
#     connection.close()
