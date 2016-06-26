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
from openstack_dashboard.dashboards.project.openvirtex import views
#from mysite.views import index
urlpatterns = patterns(
	'openstack_dashboard.dashboards.project.openvirtex.views',
    url(r'^$', views.IndexView.as_view(), name='index'),
    #url(r'^virtual',views.VirtualView.as_view(), name='virtual'),
    #url(r'^admin/', include(admin.site.urls)),
    url('^hello/$',views.hello),
    url(r'^physicaljson/$', 'physicaljson', name='physicaljson'),
    url(r'^autoVirtualTopo$', 'autoVirtualTopo', name='autoVirtualTopo'),
    #url(r'^manualVirtualTopo$', views.ManualVirtualTopo.as_view(), name='manualVirtualTopo'),
    url(r'^manualVirtualTopo$', 'manualVirtualTopo', name='manualVirtualTopo'),
    url(r'^removeVirtualTopo$', 'removeVirtualTopo', name='removeVirtualTopo'),
    #url(r'^getVirtualTopo$', 'getVirtualTopo', name= 'getVirtualTopo'),
    #url(r'^getVirtualLinks$', 'getVirtualLinks', name= 'getVirtualLinks'),
    #url(r'^getVirtualTopo_test$', 'getVirtualTopo_test', name= 'getVirtualTopo_test'),
	url(r'^test_Bandwidth$', 'test_Bandwidth', name= 'test_Bandwidth'),
)
