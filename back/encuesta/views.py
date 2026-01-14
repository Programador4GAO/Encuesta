from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.db.models import Avg, Count
from datetime import datetime
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

from .models import User, Roles, Resp, Departamento, RolSubordinados


@method_decorator(csrf_exempt, name='dispatch')
class EncuestaViewSet(viewsets.ViewSet):
    permission_classes = [AllowAny]
    authentication_classes = []

    def _get_current_user(self, request):
        """Obtiene el usuario actual desde la sesión"""
        if not request.session.get('is_authenticated'):
            return None

        ad_user = request.session.get('ad_user', {})
        user_id = ad_user.get('user_id')

        if user_id is not None:
            user = User.objects.filter(pk=user_id).first()
            if user:
                return user
            user = User.objects.filter(user_id=user_id).first()
            if user:
                return user

        username = ad_user.get('username')
        if username:
            user = User.objects.filter(user_dom=username).first()
            if user:
                return user

        return None

    def _get_month_name(self, month_num):
        meses = {1: 'Enero', 2: 'Febrero', 3: 'Marzo', 4: 'Abril',
                 5: 'Mayo', 6: 'Junio', 7: 'Julio', 8: 'Agosto',
                 9: 'Septiembre', 10: 'Octubre', 11: 'Noviembre', 12: 'Diciembre'}
        return meses.get(month_num, str(month_num))

    # ============================================================
    # ENDPOINT: Obtener departamento del usuario actual
    # ============================================================
    @action(detail=False, methods=['get'], url_path='mi-departamento')
    def mi_departamento(self, request):
        """GET /api/encuestas/mi-departamento/"""
        usuario = self._get_current_user(request)
        if not usuario:
            return Response({'success': False, 'message': 'No autenticado'}, status=401)

        rol = usuario.get_rol()
        if not rol:
            return Response({
                'success': True,
                'departamento_id': None,
                'departamento_nombre': None,
                'message': 'Usuario sin rol asignado'
            })

        depto = usuario.get_departamento()
        
        return Response({
            'success': True,
            'departamento_id': rol.id_departamento,
            'departamento_nombre': depto.descripcion_departamento if depto else None,
            'rol': rol.rol,
            'nivel_base': rol.nivel_base
        })

    # ============================================================
    # ENDPOINT: Submit encuesta (actualizado para obtener depto automáticamente)
    # ============================================================
    @action(detail=False, methods=['post'], url_path='submit')
    def submit(self, request):
        """POST /api/encuestas/submit/ - Enviar respuesta"""
        usuario = self._get_current_user(request)
        
        if not usuario:
            return Response({
                'success': False, 
                'message': 'No se detectó sesión activa. Por favor, inicie sesión nuevamente.'
            }, status=401)

        q1 = request.data.get('q1')
        q2 = request.data.get('q2')
        q3 = request.data.get('q3')
        
        # Obtener departamento automáticamente del rol del usuario
        departamento_id = usuario.get_departamento_id()

        try:
            q1, q2, q3 = float(q1), float(q2), float(q3)
        except (TypeError, ValueError):
            return Response({'success': False, 'message': 'Las respuestas deben ser números'})

        if not all(5 <= r <= 10 for r in [q1, q2, q3]):
            return Response({'success': False, 'message': 'Las respuestas deben estar entre 5 y 10'})

        now = datetime.now()
        mes_actual = self._get_month_name(now.month)
        anio_actual = now.year

        if Resp.objects.filter(user_id=usuario, date_m=mes_actual, date_y=anio_actual).exists():
            return Response({'success': False, 'message': 'Ya respondiste la encuesta este mes'})

        respuesta = Resp.objects.create(
            user_id=usuario,
            q1=q1, 
            q2=q2, 
            q3=q3,
            status=True,
            departament=str(departamento_id) if departamento_id else '',
            date_m=mes_actual, 
            date_y=anio_actual
        )

        return Response({
            'success': True,
            'message': 'Encuesta guardada correctamente',
            'data': {
                'id': respuesta.res_id,
                'q1': q1,
                'q2': q2,
                'q3': q3,
                'promedio': respuesta.promedio,
                'departamento_id': departamento_id,
                'mes': mes_actual,
                'anio': anio_actual
            }
        })

    # ============================================================
    # ENDPOINT: Estadísticas para Supervisor (nivel_base = 2)
    # ============================================================
    @action(detail=False, methods=['get'], url_path='supervisor/estadisticas')
    def supervisor_estadisticas(self, request):
        """GET /api/encuestas/supervisor/estadisticas/"""
        usuario = self._get_current_user(request)
        if not usuario:
            return Response({'success': False, 'message': 'No autenticado'}, status=401)

        rol_supervisor = usuario.get_rol()
        if not rol_supervisor or rol_supervisor.nivel_base != 2:
            return Response({'success': False, 'message': 'Acceso denegado. Solo supervisores.'}, status=403)

        departamento_id = rol_supervisor.id_departamento
        if not departamento_id:
            return Response({'success': False, 'message': 'Supervisor sin departamento asignado'})

        now = datetime.now()
        mes_actual = self._get_month_name(now.month)
        anio_actual = now.year

        # ============================================================
        # OBTENER ROLES SUBORDINADOS DESDE LA TABLA ROL_SUBORDINADOS
        # ============================================================
        roles_subordinados_ids = RolSubordinados.objects.filter(
            rol_supervisor_id=rol_supervisor.id_rol
        ).values_list('rol_subordinado_id', flat=True)

        # Si no hay roles configurados en la tabla, retornar mensaje
        if not roles_subordinados_ids:
            return Response({
                'success': True,
                'departamento_id': departamento_id,
                'departamento_nombre': Departamento.objects.filter(id_departamento=departamento_id).first().descripcion_departamento if departamento_id else '',
                'mes': mes_actual,
                'anio': anio_actual,
                'total_empleados': 0,
                'respondieron': 0,
                'pendientes': 0,
                'promedio_q1': 0,
                'promedio_q2': 0,
                'promedio_q3': 0,
                'promedio_general': 0,
                'usuarios_respondieron': [],
                'usuarios_pendientes': [],
                'message': 'No hay roles subordinados configurados para este supervisor en ROL_SUBORDINADOS'
            })
        
        # Usuarios con esos roles subordinados (excluyendo al supervisor actual por seguridad)
        usuarios_subordinados = User.objects.filter(
            id_rol__in=roles_subordinados_ids
        ).exclude(
            user_id=usuario.user_id
        )
        total_empleados = usuarios_subordinados.count()

        # Respuestas del mes actual solo de los subordinados
        ids_subordinados = usuarios_subordinados.values_list('user_id', flat=True)
        respuestas_mes = Resp.objects.filter(
            user_id__in=ids_subordinados,
            date_m=mes_actual,
            date_y=anio_actual
        )

        usuarios_respondieron_ids = respuestas_mes.values_list('user_id', flat=True)
        respondieron = respuestas_mes.count()
        pendientes = total_empleados - respondieron

        # Calcular promedios
        if respondieron > 0:
            stats = respuestas_mes.aggregate(
                prom_q1=Avg('q1'),
                prom_q2=Avg('q2'),
                prom_q3=Avg('q3')
            )
            promedio_q1 = round(stats['prom_q1'] or 0, 2)
            promedio_q2 = round(stats['prom_q2'] or 0, 2)
            promedio_q3 = round(stats['prom_q3'] or 0, 2)
            promedio_general = round((promedio_q1 + promedio_q2 + promedio_q3) / 3, 2)
        else:
            promedio_q1 = promedio_q2 = promedio_q3 = promedio_general = 0

        # Obtener info del departamento
        depto = Departamento.objects.filter(id_departamento=departamento_id).first()
        nombre_departamento = depto.descripcion_departamento if depto else f"Depto {departamento_id}"

        # Lista de usuarios que respondieron (solo subordinados)
        usuarios_respondieron = []
        for resp in respuestas_mes:
            user = resp.user_id
            # Obtener el nombre del rol del subordinado
            rol_sub = Roles.objects.filter(id_rol=user.id_rol).first()
            usuarios_respondieron.append({
                'id': user.user_id,
                'nombre': user.nombre_user or user.user_dom,
                'departamento': nombre_departamento,
                'rol': rol_sub.rol if rol_sub else '',
                'q1': resp.q1,
                'q2': resp.q2,
                'q3': resp.q3,
                'promedio': resp.promedio,
                'fecha': f"{resp.date_m} {resp.date_y}"
            })

        # Lista de usuarios pendientes (solo subordinados)
        usuarios_pendientes = []
        for user in usuarios_subordinados.exclude(user_id__in=usuarios_respondieron_ids):
            rol_sub = Roles.objects.filter(id_rol=user.id_rol).first()
            usuarios_pendientes.append({
                'id': user.user_id,
                'nombre': user.nombre_user or user.user_dom,
                'departamento': nombre_departamento,
                'rol': rol_sub.rol if rol_sub else ''
            })

        return Response({
            'success': True,
            'departamento_id': departamento_id,
            'departamento_nombre': nombre_departamento,
            'supervisor_rol': rol_supervisor.rol,
            'roles_supervisados': list(roles_subordinados_ids),
            'mes': mes_actual,
            'anio': anio_actual,
            'total_empleados': total_empleados,
            'respondieron': respondieron,
            'pendientes': pendientes,
            'promedio_q1': promedio_q1,
            'promedio_q2': promedio_q2,
            'promedio_q3': promedio_q3,
            'promedio_general': promedio_general,
            'usuarios_respondieron': usuarios_respondieron,
            'usuarios_pendientes': usuarios_pendientes
        })

    # ============================================================
    # ENDPOINT: Estadísticas para Gerente/Director (nivel_base = 3)
    # ============================================================
    @action(detail=False, methods=['get'], url_path='gerente/estadisticas')
    def gerente_estadisticas(self, request):
        """GET /api/encuestas/gerente/estadisticas/"""
        usuario = self._get_current_user(request)
        if not usuario:
            return Response({'success': False, 'message': 'No autenticado'}, status=401)

        rol_gerente = usuario.get_rol()
        if not rol_gerente or rol_gerente.nivel_base != 3:
            return Response({'success': False, 'message': 'Acceso denegado. Solo gerentes/directores.'}, status=403)

        departamento_id = rol_gerente.id_departamento
        if not departamento_id:
            return Response({'success': False, 'message': 'Gerente sin departamento asignado'})

        now = datetime.now()
        mes_actual = self._get_month_name(now.month)
        anio_actual = now.year

        # Obtener info del departamento
        depto = Departamento.objects.filter(id_departamento=departamento_id).first()
        nombre_departamento = depto.descripcion_departamento if depto else f"Depto {departamento_id}"

        # ============================================================
        # ESTADÍSTICAS POR NIVEL
        # ============================================================
        
        # Roles del departamento por nivel (excluyendo nivel 3 - gerentes)
        roles_nivel_1 = Roles.objects.filter(id_departamento=departamento_id, nivel_base=1).values_list('id_rol', flat=True)
        roles_nivel_2 = Roles.objects.filter(id_departamento=departamento_id, nivel_base=2).values_list('id_rol', flat=True)
        
        # Usuarios por nivel (excluyendo al gerente actual)
        usuarios_nivel_1 = User.objects.filter(id_rol__in=roles_nivel_1).exclude(user_id=usuario.user_id)
        usuarios_nivel_2 = User.objects.filter(id_rol__in=roles_nivel_2).exclude(user_id=usuario.user_id)
        
        total_nivel_1 = usuarios_nivel_1.count()
        total_nivel_2 = usuarios_nivel_2.count()
        total_general = total_nivel_1 + total_nivel_2

        # IDs de usuarios por nivel
        ids_nivel_1 = usuarios_nivel_1.values_list('user_id', flat=True)
        ids_nivel_2 = usuarios_nivel_2.values_list('user_id', flat=True)

        # Respuestas del mes actual por nivel
        respuestas_nivel_1 = Resp.objects.filter(
            user_id__in=ids_nivel_1,
            date_m=mes_actual,
            date_y=anio_actual
        )
        respuestas_nivel_2 = Resp.objects.filter(
            user_id__in=ids_nivel_2,
            date_m=mes_actual,
            date_y=anio_actual
        )

        respondieron_nivel_1 = respuestas_nivel_1.count()
        respondieron_nivel_2 = respuestas_nivel_2.count()
        respondieron_total = respondieron_nivel_1 + respondieron_nivel_2
        pendientes_total = total_general - respondieron_total

        # ============================================================
        # PROMEDIOS NIVEL 1 (Empleados)
        # ============================================================
        if respondieron_nivel_1 > 0:
            stats_n1 = respuestas_nivel_1.aggregate(
                prom_q1=Avg('q1'),
                prom_q2=Avg('q2'),
                prom_q3=Avg('q3')
            )
            promedio_n1_q1 = round(stats_n1['prom_q1'] or 0, 2)
            promedio_n1_q2 = round(stats_n1['prom_q2'] or 0, 2)
            promedio_n1_q3 = round(stats_n1['prom_q3'] or 0, 2)
            promedio_n1_general = round((promedio_n1_q1 + promedio_n1_q2 + promedio_n1_q3) / 3, 2)
        else:
            promedio_n1_q1 = promedio_n1_q2 = promedio_n1_q3 = promedio_n1_general = 0

        # ============================================================
        # PROMEDIOS NIVEL 2 (Supervisores)
        # ============================================================
        if respondieron_nivel_2 > 0:
            stats_n2 = respuestas_nivel_2.aggregate(
                prom_q1=Avg('q1'),
                prom_q2=Avg('q2'),
                prom_q3=Avg('q3')
            )
            promedio_n2_q1 = round(stats_n2['prom_q1'] or 0, 2)
            promedio_n2_q2 = round(stats_n2['prom_q2'] or 0, 2)
            promedio_n2_q3 = round(stats_n2['prom_q3'] or 0, 2)
            promedio_n2_general = round((promedio_n2_q1 + promedio_n2_q2 + promedio_n2_q3) / 3, 2)
        else:
            promedio_n2_q1 = promedio_n2_q2 = promedio_n2_q3 = promedio_n2_general = 0

        # ============================================================
        # PROMEDIO GENERAL (Todos los niveles)
        # ============================================================
        todas_respuestas = Resp.objects.filter(
            user_id__in=list(ids_nivel_1) + list(ids_nivel_2),
            date_m=mes_actual,
            date_y=anio_actual
        )
        if todas_respuestas.exists():
            stats_total = todas_respuestas.aggregate(
                prom_q1=Avg('q1'),
                prom_q2=Avg('q2'),
                prom_q3=Avg('q3')
            )
            promedio_total_q1 = round(stats_total['prom_q1'] or 0, 2)
            promedio_total_q2 = round(stats_total['prom_q2'] or 0, 2)
            promedio_total_q3 = round(stats_total['prom_q3'] or 0, 2)
            promedio_total_general = round((promedio_total_q1 + promedio_total_q2 + promedio_total_q3) / 3, 2)
        else:
            promedio_total_q1 = promedio_total_q2 = promedio_total_q3 = promedio_total_general = 0

        # ============================================================
        # LISTAS DE USUARIOS
        # ============================================================
        
        # Usuarios que respondieron (ambos niveles)
        usuarios_respondieron = []
        for resp in todas_respuestas:
            user = resp.user_id
            rol_user = Roles.objects.filter(id_rol=user.id_rol).first()
            usuarios_respondieron.append({
                'id': user.user_id,
                'nombre': user.nombre_user or user.user_dom,
                'rol': rol_user.rol if rol_user else '',
                'nivel_base': rol_user.nivel_base if rol_user else 0,
                'departamento': nombre_departamento,
                'q1': resp.q1,
                'q2': resp.q2,
                'q3': resp.q3,
                'promedio': resp.promedio,
                'fecha': f"{resp.date_m} {resp.date_y}"
            })

        # Usuarios pendientes (ambos niveles)
        usuarios_respondieron_ids = todas_respuestas.values_list('user_id', flat=True)
        todos_usuarios = list(usuarios_nivel_1) + list(usuarios_nivel_2)
        usuarios_pendientes = []
        for user in todos_usuarios:
            if user.user_id not in usuarios_respondieron_ids:
                rol_user = Roles.objects.filter(id_rol=user.id_rol).first()
                usuarios_pendientes.append({
                    'id': user.user_id,
                    'nombre': user.nombre_user or user.user_dom,
                    'rol': rol_user.rol if rol_user else '',
                    'nivel_base': rol_user.nivel_base if rol_user else 0,
                    'departamento': nombre_departamento
                })

        return Response({
            'success': True,
            'departamento_id': departamento_id,
            'departamento_nombre': nombre_departamento,
            'gerente_rol': rol_gerente.rol,
            'mes': mes_actual,
            'anio': anio_actual,
            # Totales generales
            'total_empleados': total_general,
            'respondieron': respondieron_total,
            'pendientes': pendientes_total,
            # Estadísticas Nivel 1 (Empleados)
            'nivel_1': {
                'nombre': 'Empleados',
                'total': total_nivel_1,
                'respondieron': respondieron_nivel_1,
                'pendientes': total_nivel_1 - respondieron_nivel_1,
                'promedio_q1': promedio_n1_q1,
                'promedio_q2': promedio_n1_q2,
                'promedio_q3': promedio_n1_q3,
                'promedio_general': promedio_n1_general
            },
            # Estadísticas Nivel 2 (Supervisores)
            'nivel_2': {
                'nombre': 'Supervisores',
                'total': total_nivel_2,
                'respondieron': respondieron_nivel_2,
                'pendientes': total_nivel_2 - respondieron_nivel_2,
                'promedio_q1': promedio_n2_q1,
                'promedio_q2': promedio_n2_q2,
                'promedio_q3': promedio_n2_q3,
                'promedio_general': promedio_n2_general
            },
            # Promedios totales
            'promedio_q1': promedio_total_q1,
            'promedio_q2': promedio_total_q2,
            'promedio_q3': promedio_total_q3,
            'promedio_general': promedio_total_general,
            # Listas
            'usuarios_respondieron': usuarios_respondieron,
            'usuarios_pendientes': usuarios_pendientes
        })

    # ============================================================
    # ENDPOINT: Estadísticas para Subdirectivo (nivel_base = 4)
    # ============================================================
    @action(detail=False, methods=['get'], url_path='subdirectivo/estadisticas')
    def subdirectivo_estadisticas(self, request):
        """GET /api/encuestas/subdirectivo/estadisticas/"""
        usuario = self._get_current_user(request)
        if not usuario:
            return Response({'success': False, 'message': 'No autenticado'}, status=401)

        rol_subdirectivo = usuario.get_rol()
        if not rol_subdirectivo or rol_subdirectivo.nivel_base != 4:
            return Response({'success': False, 'message': 'Acceso denegado. Solo subdirectivos.'}, status=403)

        departamento_id = rol_subdirectivo.id_departamento
        if not departamento_id:
            return Response({'success': False, 'message': 'Subdirectivo sin departamento asignado'})

        now = datetime.now()
        mes_actual = self._get_month_name(now.month)
        anio_actual = now.year

        # Obtener info del departamento
        depto = Departamento.objects.filter(id_departamento=departamento_id).first()
        nombre_departamento = depto.descripcion_departamento if depto else f"Depto {departamento_id}"

        # ============================================================
        # ESTADÍSTICAS POR NIVEL (1, 2 y 3)
        # ============================================================
        
        roles_nivel_1 = Roles.objects.filter(id_departamento=departamento_id, nivel_base=1).values_list('id_rol', flat=True)
        roles_nivel_2 = Roles.objects.filter(id_departamento=departamento_id, nivel_base=2).values_list('id_rol', flat=True)
        roles_nivel_3 = Roles.objects.filter(id_departamento=departamento_id, nivel_base=3).values_list('id_rol', flat=True)
        
        usuarios_nivel_1 = User.objects.filter(id_rol__in=roles_nivel_1).exclude(user_id=usuario.user_id)
        usuarios_nivel_2 = User.objects.filter(id_rol__in=roles_nivel_2).exclude(user_id=usuario.user_id)
        usuarios_nivel_3 = User.objects.filter(id_rol__in=roles_nivel_3).exclude(user_id=usuario.user_id)
        
        total_nivel_1 = usuarios_nivel_1.count()
        total_nivel_2 = usuarios_nivel_2.count()
        total_nivel_3 = usuarios_nivel_3.count()
        total_general = total_nivel_1 + total_nivel_2 + total_nivel_3

        ids_nivel_1 = usuarios_nivel_1.values_list('user_id', flat=True)
        ids_nivel_2 = usuarios_nivel_2.values_list('user_id', flat=True)
        ids_nivel_3 = usuarios_nivel_3.values_list('user_id', flat=True)

        respuestas_nivel_1 = Resp.objects.filter(user_id__in=ids_nivel_1, date_m=mes_actual, date_y=anio_actual)
        respuestas_nivel_2 = Resp.objects.filter(user_id__in=ids_nivel_2, date_m=mes_actual, date_y=anio_actual)
        respuestas_nivel_3 = Resp.objects.filter(user_id__in=ids_nivel_3, date_m=mes_actual, date_y=anio_actual)

        respondieron_nivel_1 = respuestas_nivel_1.count()
        respondieron_nivel_2 = respuestas_nivel_2.count()
        respondieron_nivel_3 = respuestas_nivel_3.count()
        respondieron_total = respondieron_nivel_1 + respondieron_nivel_2 + respondieron_nivel_3
        pendientes_total = total_general - respondieron_total

        # Promedios Nivel 1
        if respondieron_nivel_1 > 0:
            stats_n1 = respuestas_nivel_1.aggregate(prom_q1=Avg('q1'), prom_q2=Avg('q2'), prom_q3=Avg('q3'))
            promedio_n1_q1 = round(stats_n1['prom_q1'] or 0, 2)
            promedio_n1_q2 = round(stats_n1['prom_q2'] or 0, 2)
            promedio_n1_q3 = round(stats_n1['prom_q3'] or 0, 2)
            promedio_n1_general = round((promedio_n1_q1 + promedio_n1_q2 + promedio_n1_q3) / 3, 2)
        else:
            promedio_n1_q1 = promedio_n1_q2 = promedio_n1_q3 = promedio_n1_general = 0

        # Promedios Nivel 2
        if respondieron_nivel_2 > 0:
            stats_n2 = respuestas_nivel_2.aggregate(prom_q1=Avg('q1'), prom_q2=Avg('q2'), prom_q3=Avg('q3'))
            promedio_n2_q1 = round(stats_n2['prom_q1'] or 0, 2)
            promedio_n2_q2 = round(stats_n2['prom_q2'] or 0, 2)
            promedio_n2_q3 = round(stats_n2['prom_q3'] or 0, 2)
            promedio_n2_general = round((promedio_n2_q1 + promedio_n2_q2 + promedio_n2_q3) / 3, 2)
        else:
            promedio_n2_q1 = promedio_n2_q2 = promedio_n2_q3 = promedio_n2_general = 0

        # Promedios Nivel 3
        if respondieron_nivel_3 > 0:
            stats_n3 = respuestas_nivel_3.aggregate(prom_q1=Avg('q1'), prom_q2=Avg('q2'), prom_q3=Avg('q3'))
            promedio_n3_q1 = round(stats_n3['prom_q1'] or 0, 2)
            promedio_n3_q2 = round(stats_n3['prom_q2'] or 0, 2)
            promedio_n3_q3 = round(stats_n3['prom_q3'] or 0, 2)
            promedio_n3_general = round((promedio_n3_q1 + promedio_n3_q2 + promedio_n3_q3) / 3, 2)
        else:
            promedio_n3_q1 = promedio_n3_q2 = promedio_n3_q3 = promedio_n3_general = 0

        # Promedio General (todos los niveles)
        todas_respuestas = Resp.objects.filter(
            user_id__in=list(ids_nivel_1) + list(ids_nivel_2) + list(ids_nivel_3),
            date_m=mes_actual,
            date_y=anio_actual
        )
        if todas_respuestas.exists():
            stats_total = todas_respuestas.aggregate(prom_q1=Avg('q1'), prom_q2=Avg('q2'), prom_q3=Avg('q3'))
            promedio_total_q1 = round(stats_total['prom_q1'] or 0, 2)
            promedio_total_q2 = round(stats_total['prom_q2'] or 0, 2)
            promedio_total_q3 = round(stats_total['prom_q3'] or 0, 2)
            promedio_total_general = round((promedio_total_q1 + promedio_total_q2 + promedio_total_q3) / 3, 2)
        else:
            promedio_total_q1 = promedio_total_q2 = promedio_total_q3 = promedio_total_general = 0

        # Listas de usuarios
        usuarios_respondieron = []
        for resp in todas_respuestas:
            user = resp.user_id
            rol_user = Roles.objects.filter(id_rol=user.id_rol).first()
            usuarios_respondieron.append({
                'id': user.user_id,
                'nombre': user.nombre_user or user.user_dom,
                'rol': rol_user.rol if rol_user else '',
                'nivel_base': rol_user.nivel_base if rol_user else 0,
                'departamento': nombre_departamento,
                'q1': resp.q1, 'q2': resp.q2, 'q3': resp.q3,
                'promedio': resp.promedio,
                'fecha': f"{resp.date_m} {resp.date_y}"
            })

        usuarios_respondieron_ids = todas_respuestas.values_list('user_id', flat=True)
        todos_usuarios = list(usuarios_nivel_1) + list(usuarios_nivel_2) + list(usuarios_nivel_3)
        usuarios_pendientes = []
        for user in todos_usuarios:
            if user.user_id not in usuarios_respondieron_ids:
                rol_user = Roles.objects.filter(id_rol=user.id_rol).first()
                usuarios_pendientes.append({
                    'id': user.user_id,
                    'nombre': user.nombre_user or user.user_dom,
                    'rol': rol_user.rol if rol_user else '',
                    'nivel_base': rol_user.nivel_base if rol_user else 0,
                    'departamento': nombre_departamento
                })

        return Response({
            'success': True,
            'departamento_id': departamento_id,
            'departamento_nombre': nombre_departamento,
            'subdirectivo_rol': rol_subdirectivo.rol,
            'mes': mes_actual,
            'anio': anio_actual,
            'total_empleados': total_general,
            'respondieron': respondieron_total,
            'pendientes': pendientes_total,
            'nivel_1': {
                'nombre': 'Empleados', 'total': total_nivel_1,
                'respondieron': respondieron_nivel_1, 'pendientes': total_nivel_1 - respondieron_nivel_1,
                'promedio_q1': promedio_n1_q1, 'promedio_q2': promedio_n1_q2, 'promedio_q3': promedio_n1_q3,
                'promedio_general': promedio_n1_general
            },
            'nivel_2': {
                'nombre': 'Supervisores', 'total': total_nivel_2,
                'respondieron': respondieron_nivel_2, 'pendientes': total_nivel_2 - respondieron_nivel_2,
                'promedio_q1': promedio_n2_q1, 'promedio_q2': promedio_n2_q2, 'promedio_q3': promedio_n2_q3,
                'promedio_general': promedio_n2_general
            },
            'nivel_3': {
                'nombre': 'Gerentes', 'total': total_nivel_3,
                'respondieron': respondieron_nivel_3, 'pendientes': total_nivel_3 - respondieron_nivel_3,
                'promedio_q1': promedio_n3_q1, 'promedio_q2': promedio_n3_q2, 'promedio_q3': promedio_n3_q3,
                'promedio_general': promedio_n3_general
            },
            'promedio_q1': promedio_total_q1,
            'promedio_q2': promedio_total_q2,
            'promedio_q3': promedio_total_q3,
            'promedio_general': promedio_total_general,
            'usuarios_respondieron': usuarios_respondieron,
            'usuarios_pendientes': usuarios_pendientes
        })

    # ============================================================
    # Endpoints existentes (sin cambios)
    # ============================================================
    @action(detail=False, methods=['get'], url_path='my-status')
    def my_status(self, request):
        """GET /api/encuestas/my-status/"""
        usuario = self._get_current_user(request)
        if not usuario:
            return Response({'success': False, 'authenticated': False})

        now = datetime.now()
        mes_actual = self._get_month_name(now.month)

        try:
            resp = Resp.objects.get(user_id=usuario, date_m=mes_actual, date_y=now.year)
            return Response({
                'success': True, 
                'authenticated': True, 
                'hasResponded': True,
                'respuesta': {
                    'q1': resp.q1, 
                    'q2': resp.q2, 
                    'q3': resp.q3,
                    'promedio': resp.promedio
                }
            })
        except Resp.DoesNotExist:
            return Response({
                'success': True, 
                'authenticated': True, 
                'hasResponded': False,
                'currentMonth': mes_actual, 
                'currentYear': now.year
            })

    @action(detail=False, methods=['get'], url_path='my-history')
    def my_history(self, request):
        """GET /api/encuestas/my-history/"""
        usuario = self._get_current_user(request)
        if not usuario:
            return Response({'success': False, 'message': 'No autenticado'}, status=401)

        respuestas = Resp.objects.filter(user_id=usuario).order_by('-date_y', '-res_id')
        data = [{
            'id': r.res_id,
            'q1': r.q1, 
            'q2': r.q2, 
            'q3': r.q3,
            'promedio': r.promedio,
            'mes': r.date_m, 
            'anio': r.date_y
        } for r in respuestas]

        return Response({'success': True, 'total': len(data), 'respuestas': data})

    @action(detail=False, methods=['get'], url_path='summary/(?P<year>[0-9]{4})/(?P<month>[0-9]{1,2})')
    def summary(self, request, year=None, month=None):
        """GET /api/encuestas/summary/{year}/{month}/"""
        mes_nombre = self._get_month_name(int(month))
        respuestas = Resp.objects.filter(date_m=mes_nombre, date_y=int(year))

        if not respuestas.exists():
            return Response({
                'success': True, 
                'mes': mes_nombre, 
                'anio': year, 
                'estadisticas': {'totalRespuestas': 0}
            })

        stats = respuestas.aggregate(
            total=Count('res_id'),
            prom_q1=Avg('q1'), 
            prom_q2=Avg('q2'), 
            prom_q3=Avg('q3')
        )

        promedio_general = ((stats['prom_q1'] or 0) + (stats['prom_q2'] or 0) + (stats['prom_q3'] or 0)) / 3

        return Response({
            'success': True, 
            'mes': mes_nombre, 
            'anio': year,
            'estadisticas': {
                'totalRespuestas': stats['total'],
                'promedioGeneral': round(promedio_general, 2),
                'promedioQ1': round(stats['prom_q1'] or 0, 2),
                'promedioQ2': round(stats['prom_q2'] or 0, 2),
                'promedioQ3': round(stats['prom_q3'] or 0, 2)
            }
        })


class RolesViewSet(viewsets.ViewSet):
    permission_classes = [AllowAny]

    @action(detail=False, methods=['get'], url_path='list')
    def list_roles(self, request):
        roles = Roles.objects.all()
        return Response({
            'success': True, 
            'roles': [
                {
                    'id': r.id_rol, 
                    'rol': r.rol,
                    'id_departamento': r.id_departamento,
                    'nivel_base': r.nivel_base
                } for r in roles
            ]
        })


class DepartamentoViewSet(viewsets.ViewSet):
    permission_classes = [AllowAny]

    @action(detail=False, methods=['get'], url_path='list')
    def list_departamentos(self, request):
        """GET /api/departamentos/list/"""
        departamentos = Departamento.objects.all()
        return Response({
            'success': True,
            'departamentos': [
                {
                    'id': d.id_departamento,
                    'codigo': d.codigo_departamento,
                    'descripcion': d.descripcion_departamento
                } for d in departamentos
            ]
        })