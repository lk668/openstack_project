"""mysite URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/1.8/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  url(r'^$', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  url(r'^$', Home.as_view(), name='home')
Including another URLconf
    1. Add an import:  from blog import urls as blog_urls
    2. Add a URL to urlpatterns:  url(r'^blog/', include(blog_urls))
"""
from django.conf.urls import include, url
from django.conf.urls import patterns
#from django.contrib import admin
from openstack_dashboard.dashboards.project.virtualnetwork import views
#from mysite.views import index
urlpatterns = patterns(
	'openstack_dashboard.dashboards.project.virtualnetwork.views',
    url(r'^$', views.IndexView.as_view(), name='index'),
    url('^hello/$',views.hello),
    url(r'^removeVirtualTopo$', 'removeVirtualTopo', name='removeVirtualTopo'),
    #url(r'^getVirtualTopo$', 'getVirtualTopo', name= 'getVirtualTopo'),
    url(r'^selectVirtualLinks$', 'selectVirtualLinks', name= 'selectVirtualLinks'),
    url(r'^getVirtualTopo$', 'getVirtualTopo', name= 'getVirtualTopo'),
    url(r'^test_Delay_virtual$', 'test_Delay_virtual', name= 'test_Delay_virtual'),
    url(r'^test_Band_virtual$', 'test_Band_virtual', name= 'test_Band_virtual'),
)
