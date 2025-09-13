# 💻 Development Scripts

> **Development tools** for TechTemp contributors and maintainers.

---

## 🧪 **Testing & Validation**

### **`test-hardware.sh`**
*Test hardware sensors and I2C communication*

```bash
./scripts/dev/test-hardware.sh
```

**What it tests:**
- I2C bus availability and device detection
- AHT20 sensor communication and readings
- MQTT client functionality
- Network connectivity

**When to use:** 
- Debugging sensor hardware issues
- Validating new Pi setup before software install
- Troubleshooting communication problems

### **`verify-docs-structure.sh`**
*Validate documentation structure and completeness*

```bash
./scripts/dev/verify-docs-structure.sh
```

**What it validates:**
- All required documentation files exist
- Documentation structure follows standards
- Cross-references and links are valid
- Audience-based organization is correct

**When to use:**
- Before committing documentation changes
- After restructuring docs
- CI/CD pipeline validation

---

## 📊 **Development Workflow**

**🔧 Before contributing:**
```bash
./scripts/dev/verify-docs-structure.sh      # Check docs
npm test                                     # Run tests
./scripts/dev/test-hardware.sh              # Test on Pi (if available)
```

**📋 Documentation work:**
```bash
./scripts/dev/verify-docs-structure.sh      # Validate structure
# Make your changes
./scripts/dev/verify-docs-structure.sh      # Re-validate
```

**🧪 Hardware debugging:**
```bash
./scripts/dev/test-hardware.sh              # Full hardware test
sudo i2cdetect -y 1                         # Manual I2C scan
./scripts/admin/db-latest-readings.sh 5     # Check recent data
```

---

## 🛠️ **Script Development**

### **Adding New Development Scripts**

```bash
# Create new script
touch scripts/dev/my-new-tool.sh
chmod +x scripts/dev/my-new-tool.sh

# Follow the template:
#!/bin/bash
#
# TechTemp Dev - Tool Description
# Brief description of what this tool does
#
# Usage: ./my-new-tool.sh [options]
#

set -e  # Exit on any error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 TechTemp Dev - Tool Name${NC}"
# ... rest of script
```

### **Script Standards**

- ✅ Use `set -e` for error handling
- ✅ Include colored output for readability
- ✅ Provide usage examples in comments
- ✅ Follow consistent naming: `verb-noun.sh`
- ✅ Include error checking and validation
- ✅ Document in this README

---

## 🧩 **Integration with Development Flow**

### **Pre-commit Hooks** *(Planned)*
```bash
# Will automatically run:
./scripts/dev/verify-docs-structure.sh
npm run lint
npm test
```

### **CI/CD Pipeline** *(Planned)*
```bash
# GitHub Actions will run:
./scripts/dev/verify-docs-structure.sh      # Docs validation
./scripts/dev/test-hardware.sh --mock       # Hardware tests (mocked)
npm run test:coverage                        # Full test suite
```

---

## 🔍 **Debugging Utilities**

**📋 Quick development checks:**
```bash
# Documentation
./scripts/dev/verify-docs-structure.sh

# Hardware (on Pi)
./scripts/dev/test-hardware.sh

# Database (with Docker)
./scripts/admin/db-overview.sh
./scripts/admin/db-health-check.sh
```

**🐛 Common debugging workflow:**
1. Check docs structure
2. Validate hardware (if Pi available)
3. Check database integrity  
4. Run application tests
5. Deploy to test environment

---

## 📖 **Documentation**

- **[Contributing Guide](../../docs/CONTRIBUTOR/README.md)** - How to contribute
- **[Development Setup](../../docs/CONTRIBUTOR/README.md#development-setup)** - Dev environment
- **[Architecture Guide](../../docs/CONTRIBUTOR/aht20.md)** - Technical details
- **[Testing Strategy](../../docs/INTERNAL/archive/journaux/)** - Development journals

---

<div align="center">

**💻 For developers and contributors**

**[👤 User Scripts](../user/)** • **[🔧 Admin Scripts](../admin/)** • **[📖 Documentation](../../docs/)**

</div>
