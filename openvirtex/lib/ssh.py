#!/usr/bin/python
# -*- coding: utf-8 -*- 

import paramiko
import threading
import yaml

import re

def ssh_save_exec(ip, username,passwd,command):
    """
    采用paramiko的方式来执行，并利用多线程同时执行多个命令
    """
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(ip,22,username,passwd,timeout=5)
    stdin, stdout ,stderr = ssh.exec_command(command)
    stdin.write("Y")
    out = stdout.readlines()
    ssh.close()
    return out
