
from django.utils.translation import ugettext_lazy as _

import horizon
from openstack_dashboard.dashboards.project import dashboard


class OpenVirtex(horizon.Panel):
    name = _("OpenVirtex")
    slug = 'openvirtex'
    permissions = ('openstack.services.network',)


dashboard.Project.register(OpenVirtex)

