# 🛠️ TechTemp Scripts

> **Organized scripts** for all TechTemp users - from end users to system administrators.

---

## 🎯 **Choose Your Scripts**

<table>
<tr>
<th width="33%" style="text-align: center;">👤 <strong>END USER</strong></th>
<th width="33%" style="text-align: center;">🔧 <strong>ADMIN</strong></th>
<th width="33%" style="text-align: center;">💻 <strong>DEVELOPER</strong></th>
</tr>
<tr>
<td valign="top">

*Using TechTemp at home?*

**You need:** Simple room monitoring  
**Scripts:** User-friendly tools

**[📁 user/](user/)**
- Setup new room sensors
- Check system status  
- View your rooms data
- Simple troubleshooting

</td>
<td valign="top">

*Managing TechTemp servers?*

**You need:** System administration  
**Scripts:** Database & deployment tools

**[📁 admin/](admin/)**
- Database management
- Production deployment
- Remote server tools
- Health monitoring

</td>
<td valign="top">

*Contributing to TechTemp?*

**You need:** Development tools  
**Scripts:** Testing & validation

**[📁 dev/](dev/)**
- Hardware testing
- Documentation validation
- Development utilities
- CI/CD tools

</td>
</tr>
</table>

---

## 🚀 **Quick Start by Role**

### **👤 Home User**
```bash
# Add a new room sensor
./scripts/user/setup-room-sensor.sh 192.168.1.100

# Check if everything is working
./scripts/user/check-system.sh

# See current readings
./scripts/user/view-rooms.sh
```

### **🔧 System Admin**
```bash
# Database overview
./scripts/admin/db-overview.sh

# Deploy to production server
./scripts/admin/deploy-robust-pi.sh pi@server

# Health check
./scripts/admin/db-health-check.sh
```

### **💻 Developer** 
```bash
# Validate documentation
./scripts/dev/verify-docs-structure.sh

# Test hardware (on Pi)
./scripts/dev/test-hardware.sh

# Check database structure
./scripts/admin/db-overview.sh
```

---

## 📁 **Directory Structure**

```
scripts/
├── 📖 README.md              # This overview
├── 📄 example-devices.json   # Sample device configurations
│
├── 👤 user/                  # End user scripts
│   ├── 📖 README.md          # User script guide
│   ├── 🏠 setup-room-sensor.sh
│   ├── 📊 view-rooms.sh
│   └── 🔍 check-system.sh
│
├── 🔧 admin/                 # System administration
│   ├── 📖 README.md          # Admin script guide
│   ├── 📊 db-overview.sh
│   ├── 🔍 db-inspect-device.sh
│   ├── 📋 db-latest-readings.sh
│   ├── 🏥 db-health-check.sh
│   ├── 🌐 remote-db-inspect.sh
│   ├── 🚀 deploy-robust-pi.sh
│   └── 📦 batch-provision.js
│
└── 💻 dev/                   # Development tools
    ├── 📖 README.md          # Dev script guide
    ├── 🧪 test-hardware.sh
    └── 📝 verify-docs-structure.sh
```

---

## 🔧 **Migration from Old Scripts**

**Old structure → New structure:**
- `db-*.sh` → `admin/db-*.sh`
- `test-*.sh` → `dev/test-*.sh`
- `deploy-*.sh` → `admin/deploy-*.sh`
- User-facing scripts → `user/` with friendly names

**Legacy scripts moved to:** `docs/INTERNAL/legacy/`

---

## 📋 **Prerequisites**

### **All Scripts**
- TechTemp repository cloned **on your work computer** (laptop/desktop)
- Run from repository root directory (`cd techtemp/`)

### **User Scripts**
- Docker and docker-compose installed (on your work computer)
- TechTemp server running (local or remote)

### **Admin Scripts**
- Docker access for database tools
- SSH access for deployment scripts
- Backup procedures in place

### **Dev Scripts**
- Development environment setup
- Hardware access (for hardware tests)
- Git and development tools

---

## 🆘 **Getting Help**

### **� Documentation**
- **[User Guide](../docs/USER/README.md)** - End user documentation
- **[Admin Guide](../docs/CONTRIBUTOR/README.md)** - System administration
- **[Developer Guide](../docs/CONTRIBUTOR/README.md)** - Contributing and development

### **💬 Community**
- **[GitHub Discussions](https://github.com/laurent987/techtemp/discussions)** - Ask questions
- **[Issue Tracker](https://github.com/laurent987/techtemp/issues)** - Report bugs
- **[Contributing Guide](../docs/CONTRIBUTOR/README.md)** - How to contribute

---

<div align="center">

**🛠️ Professional tools for every TechTemp user**

**[👤 User](user/)** • **[🔧 Admin](admin/)** • **[💻 Dev](dev/)** • **[📖 Documentation](../docs/)**

</div>
