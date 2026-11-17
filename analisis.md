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