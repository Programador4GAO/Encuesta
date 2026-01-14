
import os
import hashlib
import requests
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.conf import settings

from .models import User, Roles

VALIDADOR_API_URL = getattr(settings, 'VALIDADOR_API_URL', 'http://localhost:5050')


class AuthViewSet(viewsets.ViewSet):
    permission_classes = [AllowAny]

    def _call_validador(self, endpoint, method='GET', data=None):
        """Llama al ValidadorAPI (C#)"""
        url = f"{VALIDADOR_API_URL}{endpoint}"
        try:
            if method == 'GET':
                response = requests.get(url, timeout=10)
            else:
                response = requests.post(url, json=data, timeout=10)
            return response.json()
        except requests.exceptions.ConnectionError:
            return {'success': False, 'message': 'ValidadorAPI no disponible. ¿Está corriendo en localhost:5050?'}
        except Exception as e:
            return {'success': False, 'message': f'Error: {str(e)}'}

    def _hash_password(self, password):
        """Hashea la contraseña con SHA256"""
        return hashlib.sha256(password.encode()).hexdigest()

    def _get_user_data(self, usuario, display_name=None):
        """Obtiene datos del usuario incluyendo rol y nivel"""
        rol_info = None
        nivel_base = None
        
        if usuario.id_rol:
            try:
                rol = Roles.objects.get(id_rol=usuario.id_rol)
                rol_info = rol.rol
                nivel_base = rol.nivel_base
            except Roles.DoesNotExist:
                pass

        return {
            'id': usuario.user_id,
            'username': usuario.user_dom,
            'nombre': usuario.nombre_user,
            'displayName': display_name or usuario.nombre_user,
            'rol_id': usuario.id_rol,
            'rol': rol_info,
            'nivel_base': nivel_base
        }

    def _set_session(self, request, usuario, display_name=None):
        """Establece la sesión del usuario"""
        user_data = self._get_user_data(usuario, display_name)
        request.session['ad_user'] = {
            'user_id': usuario.user_id,
            'username': usuario.user_dom,
            'nombre': usuario.nombre_user,
            'displayName': display_name or usuario.nombre_user,
            'rol_id': usuario.id_rol,
            'rol': user_data['rol'],
            'nivel_base': user_data['nivel_base']
        }
        request.session['is_authenticated'] = True
        return user_data

    @action(detail=False, methods=['get'], url_path='current-user')
    def current_user(self, request):
        """
        GET /api/auth/current-user/
        Detecta usuario de Windows automáticamente
        """
        result = self._call_validador('/api/auth/current-user')

        if result.get('success'):
            return Response({
                'success': True,
                'detected': True,
                'username': result.get('username'),
                'domain': result.get('domain'),
                'fullUsername': result.get('fullUsername'),
                'displayName': result.get('displayName')
            })
        
        # Fallback: variables de entorno
        windows_user = os.environ.get('USERNAME', '')
        windows_domain = os.environ.get('USERDOMAIN', '')
        if windows_user:
            return Response({
                'success': True,
                'detected': True,
                'username': windows_user,
                'domain': windows_domain,
                'fullUsername': f"{windows_domain}\\{windows_user}" if windows_domain else windows_user
            })

        return Response({'success': False, 'detected': False, 'message': result.get('message')})

    @action(detail=False, methods=['post'], url_path='login')
    def login(self, request):
        """
        POST /api/auth/login/
        
        Parámetros:
        - username: Usuario (con o sin dominio)
        - password: Contraseña
        - manualMode: boolean - Si es true, valida contra BD directamente
        
        Modos:
        - manualMode=false: Valida contra AD (ValidadorAPI) y luego BD
        - manualMode=true:  Valida solo contra BD (tabla Users, campo Pass_user)
        """
        username = request.data.get('username', '').strip()
        password = request.data.get('password', '')
        manual_mode = request.data.get('manualMode', False)

        if not username or not password:
            return Response({'success': False, 'message': 'Usuario y contraseña requeridos'})

        # Limpiar username (quitar dominio si existe)
        clean_username = username.split('\\')[1] if '\\' in username else username

        # ============================================================
        # MODO MANUAL: Validación directa contra Base de Datos
        # ============================================================
        if manual_mode:
            return self._login_database(request, clean_username, password)
        
        # ============================================================
        # MODO AUTOMÁTICO: Validación contra Active Directory
        # ============================================================
        return self._login_active_directory(request, username, clean_username, password)

    def _login_database(self, request, username, password):
        """
        Login directo contra la base de datos SQL Server
        Compara el hash SHA256 del password con Pass_user
        """
        try:
            usuario = User.objects.get(user_dom=username)
            
            # Verificar si tiene contraseña guardada
            if not usuario.pass_user or usuario.pass_user.strip() == '':
                return Response({
                    'success': False,
                    'message': 'Usuario sin contraseña configurada. Use el modo automático primero.'
                })
            
            # Comparar hash de contraseña
            password_hash = self._hash_password(password)
            
            if usuario.pass_user != password_hash:
                return Response({
                    'success': False,
                    'message': 'Contraseña incorrecta'
                })
            
            # Login exitoso
            user_data = self._set_session(request, usuario, usuario.nombre_user)
            
            return Response({
                'success': True,
                'message': 'Login exitoso (Base de datos)',
                'authMode': 'database',
                'user': user_data
            })

        except User.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Usuario no encontrado en el sistema'
            })

    def _login_active_directory(self, request, full_username, clean_username, password):
        """
        Login contra Active Directory usando ValidadorAPI
        Luego verifica existencia en tabla Users
        """
        # PASO 1: Validar contra AD
        ad_result = self._call_validador('/api/auth/validate', method='POST', data={
            'username': full_username,
            'password': password
        })

        if not ad_result.get('success'):
            return Response({
                'success': False,
                'message': ad_result.get('message', 'Credenciales incorrectas')
            })

        # PASO 2: Buscar en tabla Users
        try:
            usuario = User.objects.get(user_dom=clean_username)

            # PASO 3: Si Pass_user está vacío, guardar la contraseña hasheada
            if not usuario.pass_user or usuario.pass_user.strip() == '':
                usuario.pass_user = self._hash_password(password)
                usuario.save()

            # Login exitoso
            display_name = ad_result.get('displayName', usuario.nombre_user)
            user_data = self._set_session(request, usuario, display_name)

            return Response({
                'success': True,
                'message': 'Login exitoso (Active Directory)',
                'authMode': 'activeDirectory',
                'user': user_data
            })

        except User.DoesNotExist:
            return Response({
                'success': False,
                'adValidated': True,
                'message': 'Usuario no registrado en el sistema. Contacte al administrador.'
            })

    @action(detail=False, methods=['get'], url_path='me')
    def me(self, request):
        """GET /api/auth/me/ - Usuario actual de la sesión"""
        if request.session.get('is_authenticated'):
            return Response({
                'success': True,
                'authenticated': True,
                'user': request.session.get('ad_user')
            })
        return Response({'success': True, 'authenticated': False, 'user': None})

    @action(detail=False, methods=['post'], url_path='logout')
    def logout(self, request):
        """POST /api/auth/logout/"""
        request.session.flush()
        return Response({'success': True, 'message': 'Sesión cerrada'})

    @action(detail=False, methods=['get'], url_path='ping')
    def ping(self, request):
        """GET /api/auth/ping/ - Health check"""
        result = self._call_validador('/api/auth/ping')
        return Response({
            'status': 'ok' if result.get('status') == 'ok' else 'error',
            'validadorApi': {
                'url': VALIDADOR_API_URL,
                'connected': result.get('status') == 'ok'
            }
        })