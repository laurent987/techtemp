# 🔧 Admin Scripts

> **System administration** scripts for TechTemp server management and troubleshooting.

---

## 📊 **Database Management**

### **`db-overview.sh`**
*Complete database overview and statistics*

```bash
./scripts/admin/db-overview.sh
```

Shows: devices, rooms, readings count, recent activity, system health.

### **`db-inspect-device.sh`**
*Detailed history for a specific device*

```bash
./scripts/admin/db-inspect-device.sh aht20-f49c53
```

Shows: device placement history, readings timeline, configuration changes.

### **`db-latest-readings.sh`**
*Recent sensor readings with details*

```bash
./scripts/admin/db-latest-readings.sh 50
```

Shows: last N readings with full device and room context.

### **`db-health-check.sh`**
*Database integrity and performance check*

```bash
./scripts/admin/db-health-check.sh
```

Validates: database structure, indexes, data consistency, disk usage.

---

## 🚀 **Deployment & Provisioning**

### **`deploy-robust-pi.sh`**
*Deploy TechTemp to production Raspberry Pi server*

```bash
./scripts/admin/deploy-robust-pi.sh pi@192.168.1.100
```

Enterprise deployment with backup, rollback, health checks.

### **`batch-provision.js`**
*Provision multiple devices from JSON config*

```bash
node scripts/admin/batch-provision.js devices.json
```

Automate setup of many sensors at once.

---

## 🌐 **Remote Management**

### **`remote-db-inspect.sh`**
*Database inspection on remote TechTemp server*

```bash
./scripts/admin/remote-db-inspect.sh user@server.example.com
```

Access database tools on remote servers via SSH.

---

## 📋 **Usage Examples**

**🔍 Quick system check:**
```bash
./scripts/admin/db-health-check.sh
./scripts/admin/db-overview.sh
```

**📊 Investigate device issues:**
```bash
./scripts/admin/db-inspect-device.sh problematic-device-id
./scripts/admin/db-latest-readings.sh 100 | grep problematic-device
```

**🚀 Production deployment:**
```bash
./scripts/admin/deploy-robust-pi.sh pi@production-server
./scripts/admin/db-health-check.sh  # verify after deployment
```

---

## ⚠️ **Important Notes**

- **Database scripts** require Docker containers to be running
- **Deployment scripts** need SSH access to target machines  
- **Always backup** before running deployment scripts
- **Test on staging** before production deployments

## 🔒 **Security**

- Scripts use Docker containers for database access (no direct DB credentials)
- Deployment scripts use SSH key authentication
- Remote scripts validate server identity

---

## 📖 **Documentation**

- **[Database Inspection Guide](../../docs/INTERNAL/development/DATABASE_INSPECTION.md)** - Complete DB tools reference
- **[Deployment Guide](../../docs/INTERNAL/deployment/)** - Production deployment procedures
- **[Admin Documentation](../../docs/CONTRIBUTOR/README.md)** - System administration guide

---

<div align="center">

**⚙️ For system administrators and DevOps**

**[👤 User Scripts](../user/)** • **[💻 Dev Scripts](../dev/)** • **[📖 Documentation](../../docs/)**

</div>
