# Infraestructura TI Corporativa — META Platforms Inc. (Sede Operativa)

Implementación, aseguramiento y validación de servicios de red, almacenamiento compartido, impresión, automatización y despliegue web sobre un servidor central **Ubuntu Server** con soporte para estaciones cliente **Linux Mint** y **Windows / Mac**.

* **Asignatura:** Administración de Infraestructura de TI
* **Institución:** Universidad del Quindío
* **Fecha:** Noviembre de 2026

---

## 1. Equipo y Distribución de Roles

| Integrante | Rol en la Arquitectura | Servicios Implementados |
| :--- | :--- | :--- |
| **Santiago** | Plataforma PaaS y Aplicaciones Web | Dokploy / Traefik, Aplicación Web Institucional (`HTTPS 443`), Bases de Datos (`MySQL / PostgreSQL`) |
| **Diana** | Servicios Base de Red Linux | Sincronización Horaria (`NTP 123/UDP`), Almacenamiento Linux (`NFS /srv/nfs/meta_dev`), Autenticación Centralizada (`NIS meta.local - 834`) |
| **Juan** | Servicios Compartidos, Impresión y Seguridad | Compartición Multiplataforma (`Samba /srv/samba/meta - 139,445/TCP`), Impresión en Red (`CUPS - 631/TCP`), Firewall `UFW`, Backups y Monitoreo (`cron`) |

---

## 2. Resumen de Conectividad del Servidor

* **Sistema Operativo Servidor:** Ubuntu Server
* **Red Local Bridged (`192.168.1.0/24`):** `192.168.1.18`
* **Red VPN Tailscale (`100.64.0.0/10`):** `100.65.203.79`
* **Estaciones Cliente:** Linux Mint y Windows / Mac

---

## 3. Estructura del Repositorio

```text
├── README.md                  # Portada y guía general del proyecto
├── analisis.md                # Justificación técnica de servicios y matriz de puertos/protocolos
├── documentacion.md           # Guía paso a paso de instalación, pruebas y solución de problemas
├── Diagrama.mmd               # Diagrama de arquitectura de red y servicios en formato Mermaid
├── docker-compose.yml         # Orquestación de contenedores de la plataforma web
├── package.json               # Dependencias de la aplicación institucional
├── src/                       # Código fuente de la aplicación web institucional
├── capturas/                  # Evidencias visuales de configuración y validación en servidor y clientes
└── codigo/                    # Respaldos de configuración y scripts de automatización
    ├── codigo_diana/          # Configuraciones de servicios base Linux (NTP, NFS y NIS)
    │   ├── exports            # Directorios exportados por NFS (/etc/exports)
    │   ├── nis                # Configuración de puerto estático 834 (/etc/default/nis)
    │   ├── ntp.conf           # Reglas de sincronización y acceso NTP (/etc/ntpsec/ntp.conf)
    │   └── ypserv.securenets  # Subredes autorizadas para autenticación NIS (/etc/ypserv.securenets)
    └── codigo_juan/           # Configuraciones y scripts de servicios compartidos y seguridad
        ├── backup_meta.sh     # Script de copias de seguridad diarias (Samba, CUPS, UFW)
        ├── crontab_root.txt   # Tareas programadas en cron
        ├── cupsd.conf         # Configuración del servidor de impresión CUPS
        ├── monitoreo_meta.sh  # Script de auditoría de servicios y logs
        ├── smb.conf           # Configuración de recursos compartidos Samba
        └── ufw_reglas.txt     # Reglas activas del firewall UFW
```

---

## 4. Navegación Rápida

* **[Análisis de Infraestructura (`analisis.md`)](analisis.md):** Justificación operativa de cada servicio y matriz consolidada de red.
* **[Documentación Técnica (`documentacion.md`)](documentacion.md):** Comandos ejecutados, verificación desde estaciones cliente y registro de incidencias resueltas.
* **[Diagrama de Arquitectura (`Diagrama.mmd`)](Diagrama.mmd):** Topología completa de red, firewall y servicios por integrante.

---

## Equipo

> Proyecto desarrollado como trabajo académico para la asignatura  
> **Administracion de infraestructura de TI — Universidad del Quindío**  
> **Santiago Marin Serna, Juan Jose Suarez Moncaleano, Diana Maria Garcia Alzate**    
> Armenia, Quindío, Colombia · 2026

*Sistema desarrollado con fines académicos.*
