from django.db import models


class Departamento(models.Model):
    """Tabla: Departamento"""
    id_departamento = models.AutoField(primary_key=True, db_column='ID_DEPARTAMENTO')
    codigo_departamento = models.CharField(max_length=10, db_column='CODIGO_DEPARTAMENTO', null=True)
    descripcion_departamento = models.CharField(max_length=100, db_column='DESCRIPCION_DEPARTAMENTO', null=True)

    class Meta:
        db_table = 'Departamento'
        managed = False

    def __str__(self):
        return self.descripcion_departamento or f"Depto {self.id_departamento}"


class Roles(models.Model):
    id_rol = models.AutoField(primary_key=True, db_column='Id_rol')
    rol = models.CharField(max_length=50, db_column='rol')
    id_departamento = models.IntegerField(db_column='ID_DEPARTAMENTO', null=True)
    nivel_base = models.IntegerField(db_column='nivel_base', null=True)

    class Meta:
        db_table = 'ROLES'
        managed = False

    def __str__(self):
        return self.rol

    def get_departamento(self):
        """Obtiene el objeto Departamento relacionado"""
        if self.id_departamento:
            try:
                return Departamento.objects.get(id_departamento=self.id_departamento)
            except Departamento.DoesNotExist:
                return None
        return None

    def get_roles_subordinados(self):
        """Obtiene los IDs de roles que este rol supervisa"""
        return RolSubordinados.objects.filter(
            rol_supervisor_id=self.id_rol
        ).values_list('rol_subordinado_id', flat=True)


class RolSubordinados(models.Model):
    """
    Tabla: ROL_SUBORDINADOS
    Define la jerarquía: qué roles tiene a cargo cada supervisor
    """
    id = models.AutoField(primary_key=True)
    rol_supervisor_id = models.IntegerField(db_column='rol_supervisor_id')
    rol_subordinado_id = models.IntegerField(db_column='rol_subordinado_id')

    class Meta:
        db_table = 'ROL_SUBORDINADOS'
        managed = False
        unique_together = ('rol_supervisor_id', 'rol_subordinado_id')

    def __str__(self):
        return f"Supervisor {self.rol_supervisor_id} -> Subordinado {self.rol_subordinado_id}"


class User(models.Model):
    """
    Modelo de Usuario - Tabla: Users
    Columnas: User_id, User_dom, Nombre_user, Pass_user, Id_rol
    """
    user_id = models.AutoField(primary_key=True, db_column='User_id')
    user_dom = models.CharField(max_length=100, db_column='User_dom')
    nombre_user = models.CharField(max_length=200, db_column='Nombre_user')
    pass_user = models.CharField(max_length=255, db_column='Pass_user', null=True, blank=True)
    id_rol = models.IntegerField(db_column='Id_rol', null=True)

    class Meta:
        db_table = 'Users'
        managed = False

    def __str__(self):
        return self.nombre_user or self.user_dom

    def get_rol(self):
        """Obtiene el objeto Roles relacionado"""
        if self.id_rol:
            try:
                return Roles.objects.get(id_rol=self.id_rol)
            except Roles.DoesNotExist:
                return None
        return None

    def get_departamento(self):
        """Obtiene el departamento del usuario a través del rol"""
        rol = self.get_rol()
        if rol:
            return rol.get_departamento()
        return None

    def get_departamento_id(self):
        """Obtiene el ID del departamento del usuario"""
        rol = self.get_rol()
        if rol:
            return rol.id_departamento
        return None


class Resp(models.Model):
    res_id = models.AutoField(primary_key=True, db_column='Res_id')
    user_id = models.ForeignKey(User, on_delete=models.CASCADE, db_column='User_id')
    q1 = models.FloatField(db_column='q1')
    q2 = models.FloatField(db_column='q2')
    q3 = models.FloatField(db_column='q3')
    status = models.BooleanField(default=True, db_column='Status')
    departament = models.CharField(max_length=100, db_column='Departament', null=True, blank=True)
    date_m = models.CharField(max_length=20, db_column='Date_M')
    date_y = models.SmallIntegerField(db_column='Date_Y')

    class Meta:
        db_table = 'RESP'
        managed = False

    @property
    def promedio(self):
        return round((self.q1 + self.q2 + self.q3) / 3, 2)