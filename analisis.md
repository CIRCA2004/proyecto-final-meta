# Análisis de Infraestructura TI — META Platforms Inc. (Sede Operativa)

## 1. Justificación de Servicios Compartidos, Impresión y Seguridad

La sede operativa de **META** cuenta con un entorno heterogéneo compuesto por estaciones de ingeniería en **Linux Mint**, equipos administrativos en **Windows** y un servidor central **Ubuntu Server**[cite: 1, 4]. Para garantizar la interoperabilidad entre plataformas, la disponibilidad de recursos físicos y el aseguramiento perimetral, se implementan los siguientes servicios nativos:

* **Samba (SMB/CIFS):** Permite compartir directorios corporativos (`/srv/samba/meta`) de forma centralizada entre estaciones Windows y Linux Mint[cite: 3, 6]. Mediante el uso de grupos de seguridad (`sambausers`) y autenticación obligatoria (`guest ok = no`), se asegura que únicamente el personal autorizado tenga acceso de lectura y escritura sobre los archivos internos[cite: 6].
* **CUPS (Common Unix Printing System):** Centraliza la gestión de colas y trabajos de impresión en red bajo el protocolo IPP y una interfaz web administrativa en el puerto `631`[cite: 3, 5, 6]. Se integra el controlador virtual `printer-driver-cups-pdf` para procesar documentos digitales de auditoría y reportes operativos sin depender de hardware físico dedicado.
* **UFW (Uncomplicated Firewall):** Aplica el principio de mínimo privilegio a nivel de red en el servidor Ubuntu[cite: 4]. Bloquea por defecto todo el tráfico entrante (`deny incoming`) y autoriza exclusivamente los puertos requeridos por la arquitectura corporativa (SSH, HTTP/HTTPS, Samba, CUPS, NTP y segmentos autorizados LAN/VPN para RPC de NFS y NIS)[cite: 1, 4].
* **Copias de Seguridad Automatizadas (Backups):** Mitiga el riesgo de pérdida de información ante fallos lógicos o corrupción de archivos[cite: 4]. Mediante el script `backup_meta.sh` programado en `cron`, se empaquetan y comprimen diariamente tanto los datos compartidos de Samba como los archivos críticos de configuración (`/etc/samba`, `/etc/cups`, `/etc/ufw`), manteniendo una política de retención de 7 días[cite: 4].
* **Monitoreo y Auditoría de Registros:** Garantiza la observabilidad continua de la infraestructura mediante el script `monitoreo_meta.sh` (ejecutado cada 15 minutos vía `cron`), el cual supervisa el estado de los demonios (`smbd`, `nmbd`, `cups`, `ufw`), audita sesiones activas con `smbstatus`, inspecciona eventos mediante `journalctl` y registra alertas en `/var/log/monitoreo_meta.log`[cite: 1, 4].

---

## 2. Matriz de Requisitos Técnico-Red (Servicios de Juan)

| Servicio / Componente | IP del Servidor | Puerto(s) | Protocolo | Tipo de Servicio | Descripción Funcional |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Samba (Direct SMB)** | `192.168.1.18` (LAN)<br>`100.65.203.79` (VPN) | `445` | TCP | Compartición de Archivos | Transferencia directa de archivos SMB/CIFS entre clientes Windows y Linux Mint[cite: 2, 3]. |
| **Samba (NetBIOS)** | `192.168.1.18` (LAN)<br>`100.65.203.79` (VPN) | `139`<br>`137, 138` | TCP<br>UDP | Sesión y Resolución de Nombres | Descubrimiento y compatibilidad de recursos compartidos en red local[cite: 2, 3]. |
| **CUPS (IPP / Web UI)** | `192.168.1.18` (LAN)<br>`100.65.203.79` (VPN) | `631` | TCP / UDP | Impresión en Red | Servidor de colas de impresión e interfaz web de administración HTTPS[cite: 2, 3, 5, 6]. |
| **UFW (Política Base / SSH)** | `192.168.1.18` (LAN)<br>`100.65.203.79` (VPN) | `22` | TCP | Seguridad Perimetral / Admin | Filtrado de tráfico entrante/saliente y administración remota segura por SSH[cite: 2]. |
| **Backups y Monitoreo** | Local (`Ubuntu Server`) | N/A | Local (`cron`) | Mantenimiento y Auditoría | Automatización de respaldos diarios (`02:00`) y verificación de servicios cada 15 min[cite: 4]. |

## 3. Justificación de Servicios Base de Red Linux (NTP, NFS y NIS)

Para garantizar la coherencia temporal, el acceso centralizado a repositorios de desarrollo y la gestión unificada de identidades en las estaciones de ingeniería **Linux Mint** de **META**, se implementan los siguientes servicios nativos sobre el servidor central **Ubuntu Server**:

* **NTP (`ntpsec` — Network Time Protocol):** Sincroniza el reloj interno del servidor central con fuentes públicas de estrato 2 (`0.co.ntp.edgeuno.c`), posicionándolo como referencia horaria oficial de **estrato 3** para toda la red corporativa. Mediante directivas `restrict` con `nomodify notrap` en `/etc/ntpsec/ntp.conf`, se autoriza la consulta desde los segmentos LAN y VPN protegiendo la integridad del servicio, lo cual es indispensable para la auditoría de registros (*logs*), la validación de certificados SSL/TLS y la autenticación en red.
* **NFS (`nfs-kernel-server` — Network File System):** Centraliza el almacenamiento colaborativo para entornos Linux mediante la exportación del directorio `/srv/nfs/meta_dev` hacia las subredes autorizadas (`192.168.1.0/24` y `100.64.0.0/10`). Permite que las estaciones de trabajo Linux Mint monten recursos compartidos de forma nativa y transparente con permisos unificados (`rw,sync,no_root_squash`), evitando la dispersión de archivos locales.
* **NIS (`ypserv` — Network Information Service):** Unifica la autenticación y administración de cuentas de usuario, contraseñas y grupos bajo el dominio corporativo **`meta.local`**. Configurado como servidor maestro con puerto estático `834` y control de acceso mediante `/etc/ypserv.securenets`, permite que los colaboradores validen sus credenciales (`meta_user`) desde cualquier estación Linux Mint sin depender de cuentas locales aisladas.

---

## 4. Matriz de Requisitos Técnico-Red (Servicios de Diana)

| Servicio / Componente | IP del Servidor | Puerto(s) | Protocolo | Tipo de Servicio | Descripción Funcional |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **NTP (`ntpsec`)** | `192.168.1.18` (LAN)<br>`100.65.203.79` (VPN) | `123` | UDP | Sincronización Horaria | Servidor de referencia temporal (estrato 3) para estaciones y servicios de red. |
| **NFS (`nfs-kernel-server`)** | `192.168.1.18` (LAN)<br>`100.65.203.79` (VPN) | `2049`<br>`111` | TCP / UDP | Compartición de Archivos Linux | Exportación nativa del directorio `/srv/nfs/meta_dev` para clientes Linux Mint. |
| **NIS (`ypserv` / `rpcbind`)** | `192.168.1.18` (LAN)<br>`100.65.203.79` (VPN) | `834`<br>`111` | TCP / UDP | Autenticación Centralizada | Gestión unificada de identidades y credenciales bajo el dominio `meta.local`. |