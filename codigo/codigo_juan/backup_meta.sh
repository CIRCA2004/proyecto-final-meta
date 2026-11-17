#!/bin/bash
FECHA=$(date +%Y%m%d_%H%M%S)
DEST="/var/backups/meta"
LOG="/var/log/backup_meta.log"

mkdir -p "$DEST"

tar -czf "$DEST/samba_meta_$FECHA.tar.gz" /srv/samba/meta 2>/dev/null
tar -czf "$DEST/configs_meta_$FECHA.tar.gz" /etc/samba /etc/cups /etc/ufw 2>/dev/null

# Eliminar respaldos con más de 7 días de antigüedad
find "$DEST" -type f -name "*.tar.gz" -mtime +7 -delete

echo "[$FECHA] Respaldo completado exitosamente en $DEST" >> "$LOG"
