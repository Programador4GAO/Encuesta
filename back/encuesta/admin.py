from django.contrib import admin
from .models import User, Roles, Resp


@admin.register(Roles)
class RolesAdmin(admin.ModelAdmin):
    list_display = ['id_rol', 'rol', 'nivel_base']


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['user_id', 'user_dom', 'nombre_user', 'id_rol']


@admin.register(Resp)
class RespAdmin(admin.ModelAdmin):
    list_display = ['res_id', 'user_id', 'q1', 'q2', 'q3', 'date_m', 'date_y']