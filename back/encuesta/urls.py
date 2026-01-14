"""
urls.py - URLs de la app encuesta
Ubicación: BackEnd/back/encuesta/urls.py
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EncuestaViewSet, RolesViewSet, DepartamentoViewSet
from .views_auth import AuthViewSet

router = DefaultRouter()
router.register(r'auth', AuthViewSet, basename='auth')
router.register(r'encuestas', EncuestaViewSet, basename='encuestas')
router.register(r'roles', RolesViewSet, basename='roles')
router.register(r'departamentos', DepartamentoViewSet, basename='departamentos')

urlpatterns = [
    path('', include(router.urls)),
]

"""
ENDPOINTS:
  GET  /api/auth/current-user/     -> Detectar usuario Windows
  POST /api/auth/login/            -> Login (AD + BD)
  GET  /api/auth/me/               -> Usuario actual
  POST /api/auth/logout/           -> Cerrar sesión

  POST /api/encuestas/submit/                  -> Enviar respuesta
  GET  /api/encuestas/my-status/               -> ¿Ya respondió?
  GET  /api/encuestas/my-history/              -> Historial
  GET  /api/encuestas/mi-departamento/         -> Departamento del usuario (NUEVO)
  GET  /api/encuestas/supervisor/estadisticas/ -> Stats supervisor (NUEVO)
  GET  /api/encuestas/summary/{y}/{m}/         -> Resumen mensual

  GET  /api/roles/list/            -> Lista roles
  GET  /api/departamentos/list/    -> Lista departamentos (NUEVO)
"""