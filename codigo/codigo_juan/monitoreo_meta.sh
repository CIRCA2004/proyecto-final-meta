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
