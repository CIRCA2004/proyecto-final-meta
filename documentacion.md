# Documentación Técnica — Servicios Compartidos, Impresión y Seguridad (META)

**Responsable:** Juan  
**Sistema Operativo Servidor:** Ubuntu Server (`192.168.1.18` / VPN `100.65.203.79`)  
**Estación Cliente de Pruebas:** Linux Mint (`juan-Victus-by-HP-Gaming-Laptop`)

---

## 1. Implementación de Samba (Compartición de Archivos Multiplataforma)

### 1.1 Instalación y Configuración de Permisos
Se instalaron los paquetes `samba` y `smbclient`, se creó el grupo de seguridad `sambausers` y se configuró el directorio `/srv/samba/meta` con el bit **SGID (`2775`)** para garantizar la herencia de grupo en todos los archivos creados por los colaboradores:

```bash
sudo apt update && sudo apt install samba smbclient -y
sudo groupadd -f sambausers
sudo mkdir -p /srv/samba/meta
sudo chown -R root:sambausers /srv/samba/meta
sudo chmod -R 2775 /srv/samba/meta
sudo usermod -aG sambausers $USER
sudo smbpasswd -a $USER
```

### 1.2 Declaración del Recurso Compartido (`/etc/samba/smb.conf`)
Se anexó el bloque `[meta]` restringiendo el acceso exclusivamente a usuarios autenticados del grupo `@sambausers`:

```ini
[meta]
   comment = Carpeta Compartida Corporativa META
   path = /srv/samba/meta
   browseable = yes
   writable = yes
   guest ok = no
   valid users = @sambausers
   create mask = 0664
   directory mask = 2775
```

### 1.3 Validación y Activación del Servicio
```bash
testparm -s
sudo systemctl enable --now smbd nmbd
sudo systemctl status smbd nmbd --no-pager
```

* **Evidencia:**  
  ![Configuración y estado de Samba](capturas/samba_estado.png)

---

## 2. Implementación de CUPS (Servidor de Impresión en Red)

### 2.1 Instalación y Habilitación de Acceso Remoto
Se instaló `cups` junto con el controlador de impresora virtual `printer-driver-cups-pdf`. Posteriormente se modificó `/etc/cups/cupsd.conf` para escuchar en todas las interfaces (`0.0.0.0:631`) y permitir administración remota desde la red:

```bash
sudo apt install cups printer-driver-cups-pdf -y
sudo usermod -aG lpadmin $USER
sudo cp /etc/cups/cupsd.conf /etc/cups/cupsd.conf.bak

sudo sed -i 's/Listen localhost:631/Listen 0.0.0.0:631/' /etc/cups/cupsd.conf
sudo sed -i '/Listen 0.0.0.0:631/a ServerAlias *' /etc/cups/cupsd.conf
sudo sed -i '/<Location \/>/,/<\/Location>/ s/Order allow,deny/Order allow,deny\n  Allow all/' /etc/cups/cupsd.conf
sudo sed -i '/<Location \/admin>/,/<\/Location>/ s/Order allow,deny/Order allow,deny\n  Allow all/' /etc/cups/cupsd.conf
sudo sed -i '/<Location \/admin\/conf>/,/<\/Location>/ s/Order allow,deny/Order allow,deny\n  Allow all/' /etc/cups/cupsd.conf

sudo systemctl enable --now cups && sudo systemctl restart cups
```

### 2.2 Verificación del Servicio
```bash
sudo systemctl status cups --no-pager && ss -tulpn | grep 631
```

* **Evidencia:**  
  ![Servicio CUPS escuchando en puerto 631](capturas/cups_puerto_631.png)

---

## 3. Automatización de Copias de Seguridad (`backup_meta.sh` + `cron`)

Se implementó el script `/usr/local/bin/backup_meta.sh` encargado de comprimir diariamente en `/var/backups/meta` los datos compartidos de Samba (`/srv/samba/meta`) y los archivos de configuración (`/etc/samba`, `/etc/cups`, `/etc/ufw`), aplicando rotación automática de archivos mayores a 7 días:

```bash
#!/bin/bash
FECHA=$(date +%Y%m%d_%H%M%S)
DEST="/var/backups/meta"
LOG="/var/log/backup_meta.log"

mkdir -p "$DEST"

tar -czf "$DEST/samba_meta_$FECHA.tar.gz" /srv/samba/meta 2>/dev/null
tar -czf "$DEST/configs_meta_$FECHA.tar.gz" /etc/samba /etc/cups /etc/ufw 2>/dev/null

find "$DEST" -type f -name "*.tar.gz" -mtime +7 -delete
echo "[$FECHA] Respaldo completado exitosamente en $DEST" >> "$LOG"
```

Se programó en el `crontab` de `root` para ejecutarse todos los días a las `02:00 AM`:
```bash
0 2 * * * /usr/local/bin/backup_meta.sh
```

* **Evidencia:**  
  ![Respaldos generados y crontab configurado](capturas/backups_cron.png)

---

## 4. Monitoreo y Auditoría de Registros (`monitoreo_meta.sh`)

Se desarrolló `/usr/local/bin/monitoreo_meta.sh` para verificar la disponibilidad de los demonios `smbd`, `nmbd`, `cups` y `ufw`, registrar alertas ante caídas en `/var/log/monitoreo_meta.log`, consultar conexiones Samba (`smbstatus -b`) e inspeccionar registros mediante `journalctl`:

```bash
#!/bin/bash
LOG_ALERTAS="/var/log/monitoreo_meta.log"
FECHA=$(date "+%Y-%m-%d %H:%M:%S")

echo "=== REPORTE DE ESTADO META ($FECHA) ==="
for SERVICIO in smbd nmbd cups ufw; do
    if systemctl is-active --quiet "$SERVICIO"; then
        echo "[OK] Servicio $SERVICIO activo."
    else
        echo "[$FECHA] [ALERTA] Servicio $SERVICIO CAÍDO." | tee -a "$LOG_ALERTAS"
    fi
done

echo -e "\n--- Sesiones Samba Activas ---"
sudo smbstatus -b 2>/dev/null

echo -e "\n--- Últimos eventos de Samba y CUPS (journalctl) ---"
journalctl -u smbd -u cups -n 10 --no-pager
```

Se automatizó su ejecución cada 15 minutos en el `crontab` de `root` (`*/15 * * * *`).

* **Evidencia:**  
  ![Ejecución de script de monitoreo y journalctl](capturas/monitoreo_estado.png)

---

## 5. Seguridad Perimetral con Firewall UFW

Se configuraron políticas restrictivas por defecto (`deny incoming` / `allow outgoing`) habilitando únicamente los puertos de la infraestructura y los segmentos de red local (`192.168.0.0/16`) y VPN Tailscale (`100.64.0.0/10`) para garantizar la interoperabilidad con los servicios RPC de NFS y NIS:

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80,443/tcp
sudo ufw allow 631/tcp
sudo ufw allow 139,445/tcp
sudo ufw allow 137,138/udp
sudo ufw allow 123/udp
sudo ufw allow from 192.168.0.0/16
sudo ufw allow from 100.64.0.0/10
sudo ufw --force enable
sudo ufw status verbose
```

* **Evidencia:**  
  ![Reglas activas en UFW](capturas/ufw_status.png)

---

## 6. Pruebas de Verificación desde Cliente (Linux Mint)

1. **Conectividad HTTPS hacia CUPS:**
   ```bash
   curl -kI [https://100.65.203.79:631](https://100.65.203.79:631)
   ```
   Se obtuvo respuesta `HTTP/1.1 200 OK` desde `Server: CUPS/2.4 IPP/2.1` y se ejecutó la impresión de página de prueba (*Print Test Page*) en la impresora virtual `PDF`.
2. **Conectividad y Escritura en Samba:**
   ```bash
   smbclient //100.65.203.79/meta -U juan
   ```
   Se autenticó con éxito, transfiriendo y listando archivos en el recurso compartido remoto.

* **Evidencias:**  
  ![Respuesta HTTP 200 de CUPS desde Linux Mint](capturas/prueba_cups_cliente.png)  
  ![Conexión y transferencia en Samba desde Linux Mint](capturas/prueba_samba_cliente.png)

---

## 7. Solución de Problemas Encontrados

| Problema Identificado | Causa Raíz | Solución Aplicada |
| :--- | :--- | :--- |
| **Acceso web remoto a CUPS rechazado (`403 Forbidden` / `400 Bad Request`)** | Por defecto CUPS solo escucha en `localhost:631` y rechaza peticiones cuyo encabezado `Host` sea una IP externa. | Se cambió la escucha a `Listen 0.0.0.0:631`, se agregó `ServerAlias *` y se incluyó `Allow all` en las directivas `<Location>` de `/etc/cups/cupsd.conf`. |
| **Riesgo de bloqueo sobre servicios RPC (NFS/NIS) al activar UFW** | NFS y NIS negocian puertos dinámicos mediante `rpcbind`, por lo que abrir puertos estáticos individuales bloqueaba la comunicación desde clientes VPN y LAN. | Se autorizó el tráfico interno proveniente de los segmentos `192.168.0.0/16` (LAN bridged) y `100.64.0.0/10` (red VPN Tailscale) manteniendo el bloqueo por defecto hacia el exterior. |
| **Ausencia inicial de `/var/log/monitoreo_meta.log`** | El script de monitoreo escribe en el archivo de alertas únicamente cuando un servicio se encuentra detenido (`else`). | Se documentó el comportamiento esperado: al estar los 4 demonios activos (`[OK]`), el reporte se visualiza en salida estándar y `journalctl`, creándose el log solo ante incidencias reales. |