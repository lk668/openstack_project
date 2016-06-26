
from django.utils.translation import ugettext_lazy as _

import horizon
from openstack_dashboard.dashboards.project import dashboard


class VirtualNetwork(horizon.Panel):
    name = _("VirtualNetwork")
    slug = 'virtualnetwork'
    permissions = ('openstack.services.network',)


dashboard.Project.register(VirtualNetwork)

