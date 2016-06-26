#!/usr/bin/env python
# -*- coding: utf-8 -*-
import json
import string
import random
import time
import os
import pika
import subprocess
import ovxctl      

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
#`from openstack_dashboard.dashboards.project.openvirtex import tabs as openvirtex_tabs

def hello(request):
    return HttpResponse("Hello world")

class IndexView (TemplateView):
    template_name = 'project/openvirtex/index.html'

class VirtualView (views.APIView):
    template_name = 'project/openvirtex/virtual.html'

@csrf_exempt
def getVirtualLinks(request): #get virtual NetworkLinks
    if request.method == 'POST':
        manualLink = json.loads(request.body)
        temp=open('/home/ebupt1/work/OpenVirteX_TEMP/utils/getVirtualLinks.json','w')
        temp.write(json.dumps(manualLink))
        temp.close()
        send_queue(json.dumps(manualLink))
        time.sleep(1)
        temp_out=open('/home/ebupt1/work/flow_status.txt','r')
        text=temp_out.read()
        if text=="":
            text="id:"+data.get("id")+"; "+"link_selection_status: "+"unsuccessful"
        temp_out.close()
        temp_updating=open('/home/ebupt1/work/flow_status.txt','w')
        temp_updating.truncate()
        temp_updating.close()
        return HttpResponse(text) 
def autoVirtualTopo(request): #auto generate virtual networkTopology
    return HttpResponse("0")

@csrf_exempt
def removeVirtualTopo(request): #remove virtual NetwoekTopology
    if request.method == 'POST':
        manualTopo = json.loads(request.body)
        temp=open('/home/ebupt1/work/OpenVirteX_TEMP/utils/removeTopo.json','w')
        temp.write(json.dumps(manualTopo))
        temp.close()
        subprocess.Popen("curl localhost:8000 -X POST -d @/home/ebupt1/work/OpenVirteX_TEMP/utils/removeTopo.json",shell=True)
        virtual_id=manualTopo.get("id")       #获取租户的id
        tcp_port=int(virtual_id)+6633         #监听端口号为租户id+6633
        subprocess.Popen('kill `netstat -nlp | grep :%s | awk \'{print $7}\' | awk -F"/" \'{ print $1 }\'`'%tcp_port,shell=True) #结束ryu进程
        temp_out=open('/home/ebupt1/work/OpenVirteX_TEMP/utils/temp_output.txt','r')
        try:
            text=json.dumps(temp_out.read())
        finally:
            temp_out.close()
        return HttpResponse(text) 

@csrf_exempt
def getVirtualTopo(request): #get virtual NetwoekTopology
    if request.method == 'POST':
        manualTopo = json.loads(request.body)    
        temp=open('/home/ebupt1/work/OpenVirteX_TEMP/utils/getVirtualTopo.json','w')
        temp.write(json.dumps(manualTopo))
        temp.close()
        subprocess.Popen("curl localhost:8000 -X POST -d @/home/ebupt1/work/OpenVirteX_TEMP/utils/getVirtualTopo.json",shell=True)
        temp_out=open('/home/ebupt1/work/OpenVirteX_TEMP/utils/temp_output.txt','r')
        try:
            text=json.dumps(temp_out.read())
        finally:
            temp_out.close()
        return HttpResponse(text)
@csrf_exempt
def getVirtualTopo_test(request): #get virtual NetwoekTopology
    if request.method == 'GET':
        command=['-n','getVirtualTopology','1']
        (gopts, rargs, parser) = ovxctl.parse_global_args(command[0:])
        (parse_args, do_func) = ovxctl.CMDS[rargs[0]]
        (opts, args) = parse_args(rargs[1:], rargs[0])
        data=get_virtualTopology(gopts, opts, args)
        text=json.dumps(data)
        return HttpResponse(text)

class ManualVirtualTopo(View):
#@csrf_exempt
#def manualVirtualTopo(request): #manual generate virtual networkTopology
    @csrf_exempt
    def post(self,request): #manual generate virtual networkTopology
        if request.method == 'POST':
            manualTopo = json.loads(request.body)
            temp=open('/home/ebupt1/work/OpenVirteX_TEMP/utils/temp.json','w')
            temp.write(json.dumps(manualTopo))
            temp.close()
            virtual_id=manualTopo.get("id")     #获取租户的id
            tcp_port =str(int(virtual_id)+6633)         #监听端口号为租户id+6634
            wsapi_port =str(int(virtual_id)+8080)  
            shell_command_ryu='ryu-manager --ofp-tcp-listen-port='+tcp_port+' --wsapi-port='+wsapi_port+" --observe-links"
            subprocess.Popen(shell_command_ryu,shell=True)  #启动ryu
            time.sleep(2)                                            #休眠2秒
            subprocess.Popen("curl localhost:8000 -X POST -d @/home/ebupt1/work/OpenVirteX_TEMP/utils/temp.json",shell=True)
            time.sleep(1)
            temp_out=open('/home/ebupt1/work/OpenVirteX_TEMP/utils/temp_output.txt','r')
            try:
                text=json.dumps(temp_out.read())
            finally:
                temp_out.close() 
            return HttpResponse(text)

def physicaljson(request): #get physicalTopo json data
    if request.method == 'GET':
        data = {
            "switches": [
                "00:00:00:00:00:00:08:00",
                "00:00:00:00:00:00:03:00",
                "00:00:00:00:00:00:0b:00",
                "00:00:00:00:00:00:0a:00",
                "00:00:00:00:00:00:01:00",
                "00:00:00:00:00:00:04:00",
                "00:00:00:00:00:00:09:00",
                "00:00:00:00:00:00:05:00",
                "00:00:00:00:00:00:02:00",
                "00:00:00:00:00:00:07:00",
                "00:00:00:00:00:00:06:00"
            ],
            "links": [
                {
                    "linkId": 3,
                    "dst": {
                        "port": "6",
                        "dpid": "00:00:00:00:00:00:0a:00"
                    },
                    "src": {
                        "port": "6",
                        "dpid": "00:00:00:00:00:00:05:00"
                    }
                },
                {
                    "linkId": 18,
                    "dst": {
                        "port": "6",
                        "dpid": "00:00:00:00:00:00:03:00"
                    },
                    "src": {
                        "port": "6",
                        "dpid": "00:00:00:00:00:00:07:00"
                    }
                },
                {
                    "linkId": 16,
                    "dst": {
                        "port": "6",
                        "dpid": "00:00:00:00:00:00:02:00"
                    },
                    "src": {
                        "port": "5",
                        "dpid": "00:00:00:00:00:00:03:00"
                    }
                },
                {
                    "linkId": 1,
                    "dst": {
                        "port": "6",
                        "dpid": "00:00:00:00:00:00:06:00"
                    },
                    "src": {
                        "port": "7",
                        "dpid": "00:00:00:00:00:00:05:00"
                    }
                },
                {
                    "linkId": 28,
                    "dst": {
                        "port": "5",
                        "dpid": "00:00:00:00:00:00:05:00"
                    },
                    "src": {
                        "port": "7",
                        "dpid": "00:00:00:00:00:00:04:00"
                    }
                },
                {
                    "linkId": 27,
                    "dst": {
                        "port": "5",
                        "dpid": "00:00:00:00:00:00:07:00"
                    },
                    "src": {
                        "port": "6",
                        "dpid": "00:00:00:00:00:00:01:00"
                    }
                },
                {
                    "linkId": 14,
                    "dst": {
                        "port": "7",
                        "dpid": "00:00:00:00:00:00:05:00"
                    },
                    "src": {
                        "port": "6",
                        "dpid": "00:00:00:00:00:00:06:00"
                    }
                },
                {
                    "linkId": 22,
                    "dst": {
                        "port": "6",
                        "dpid": "00:00:00:00:00:00:09:00"
                    },
                    "src": {
                        "port": "6",
                        "dpid": "00:00:00:00:00:00:04:00"
                    }
                },
                {
                    "linkId": 10,
                    "dst": {
                        "port": "5",
                        "dpid": "00:00:00:00:00:00:03:00"
                    },
                    "src": {
                        "port": "6",
                        "dpid": "00:00:00:00:00:00:02:00"
                    }
                },
                {
                    "linkId": 26,
                    "dst": {
                        "port": "5",
                        "dpid": "00:00:00:00:00:00:09:00"
                    },
                    "src": {
                        "port": "7",
                        "dpid": "00:00:00:00:00:00:08:00"
                    }
                },
                {
                    "linkId": 2,
                    "dst": {
                        "port": "7",
                        "dpid": "00:00:00:00:00:00:04:00"
                    },
                    "src": {
                        "port": "5",
                        "dpid": "00:00:00:00:00:00:05:00"
                    }
                },
                {
                    "linkId": 23,
                    "dst": {
                        "port": "6",
                        "dpid": "00:00:00:00:00:00:05:00"
                    },
                    "src": {
                        "port": "6",
                        "dpid": "00:00:00:00:00:00:0a:00"
                    }
                },
                {
                    "linkId": 4,
                    "dst": {
                        "port": "5",
                        "dpid": "00:00:00:00:00:00:04:00"
                    },
                    "src": {
                        "port": "7",
                        "dpid": "00:00:00:00:00:00:0b:00"
                    }
                },
                {
                    "linkId": 19,
                    "dst": {
                        "port": "5",
                        "dpid": "00:00:00:00:00:00:08:00"
                    },
                    "src": {
                        "port": "7",
                        "dpid": "00:00:00:00:00:00:07:00"
                    }
                },
                {
                    "linkId": 8,
                    "dst": {
                        "port": "6",
                        "dpid": "00:00:00:00:00:00:04:00"
                    },
                    "src": {
                        "port": "6",
                        "dpid": "00:00:00:00:00:00:09:00"
                    }
                },
                {
                    "linkId": 7,
                    "dst": {
                        "port": "5",
                        "dpid": "00:00:00:00:00:00:0a:00"
                    },
                    "src": {
                        "port": "7",
                        "dpid": "00:00:00:00:00:00:09:00"
                    }
                },
                {
                    "linkId": 17,
                    "dst": {
                        "port": "6",
                        "dpid": "00:00:00:00:00:00:01:00"
                    },
                    "src": {
                        "port": "5",
                        "dpid": "00:00:00:00:00:00:07:00"
                    }
                },
                {
                    "linkId": 5,
                    "dst": {
                        "port": "5",
                        "dpid": "00:00:00:00:00:00:0b:00"
                    },
                    "src": {
                        "port": "7",
                        "dpid": "00:00:00:00:00:00:03:00"
                    }
                },
                {
                    "linkId": 20,
                    "dst": {
                        "port": "7",
                        "dpid": "00:00:00:00:00:00:07:00"
                    },
                    "src": {
                        "port": "5",
                        "dpid": "00:00:00:00:00:00:08:00"
                    }
                },
                {
                    "linkId": 21,
                    "dst": {
                        "port": "5",
                        "dpid": "00:00:00:00:00:00:02:00"
                    },
                    "src": {
                        "port": "5",
                        "dpid": "00:00:00:00:00:00:01:00"
                    }
                },
                {
                    "linkId": 24,
                    "dst": {
                        "port": "6",
                        "dpid": "00:00:00:00:00:00:08:00"
                    },
                    "src": {
                        "port": "6",
                        "dpid": "00:00:00:00:00:00:0b:00"
                    }
                },
                {
                    "linkId": 12,
                    "dst": {
                        "port": "7",
                        "dpid": "00:00:00:00:00:00:0b:00"
                    },
                    "src": {
                        "port": "5",
                        "dpid": "00:00:00:00:00:00:04:00"
                    }
                },
                {
                    "linkId": 15,
                    "dst": {
                        "port": "7",
                        "dpid": "00:00:00:00:00:00:03:00"
                    },
                    "src": {
                        "port": "5",
                        "dpid": "00:00:00:00:00:00:0b:00"
                    }
                },
                {
                    "linkId": 0,
                    "dst": {
                        "port": "7",
                        "dpid": "00:00:00:00:00:00:0a:00"
                    },
                    "src": {
                        "port": "5",
                        "dpid": "00:00:00:00:00:00:06:00"
                    }
                },
                {
                    "linkId": 25,
                    "dst": {
                        "port": "6",
                        "dpid": "00:00:00:00:00:00:07:00"
                    },
                    "src": {
                        "port": "6",
                        "dpid": "00:00:00:00:00:00:03:00"
                    }
                },
                {
                    "linkId": 13,
                    "dst": {
                        "port": "7",
                        "dpid": "00:00:00:00:00:00:09:00"
                    },
                    "src": {
                        "port": "5",
                        "dpid": "00:00:00:00:00:00:0a:00"
                    }
                },
                {
                    "linkId": 29,
                    "dst": {
                        "port": "5",
                        "dpid": "00:00:00:00:00:00:06:00"
                    },
                    "src": {
                        "port": "7",
                        "dpid": "00:00:00:00:00:00:0a:00"
                    }
                },
                {
                    "linkId": 11,
                    "dst": {
                        "port": "5",
                        "dpid": "00:00:00:00:00:00:01:00"
                    },
                    "src": {
                        "port": "5",
                        "dpid": "00:00:00:00:00:00:02:00"
                    }
                },
                {
                    "linkId": 9,
                    "dst": {
                        "port": "7",
                        "dpid": "00:00:00:00:00:00:08:00"
                    },
                    "src": {
                        "port": "5",
                        "dpid": "00:00:00:00:00:00:09:00"
                    }
                },
                {
                    "linkId": 6,
                    "dst": {
                        "port": "6",
                        "dpid": "00:00:00:00:00:00:0b:00"
                    },
                    "src": {
                        "port": "6",
                        "dpid": "00:00:00:00:00:00:08:00"
                    }
                }
            ]
        }
        json_string = json.dumps(data, ensure_ascii=False)
        return HttpResponse(json_string)
def send_queue(message):
    connection = pika.BlockingConnection(pika.ConnectionParameters(
        host='localhost'))
    channel = connection.channel()

    channel.exchange_declare(exchange='ryu',type='fanout')
    channel.queue_declare(queue='ryu_change_flow')
    channel.basic_publish(exchange='ryu',
                      routing_key='ryu_change_flow',
                      body=message) 
    connection.close()


def get_virtualTopology(gopts, opts, args):   #获取虚拟网络拓扑
    req={ "tenantId": int(args[0]) }
    result_topology = ovxctl.connect(gopts, "status", "getVirtualTopology", data=req, passwd=ovxctl.getPasswd(gopts)) #数据为json格式
    result_hosts = ovxctl.connect(gopts, "status", "getVirtualHosts", data=req, passwd=ovxctl.getPasswd(gopts))
    data=result_topology
    data["hosts"]=result_hosts
    return data

