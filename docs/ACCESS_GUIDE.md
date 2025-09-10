# 🚀 Guide d'Accès Rapide - Scripts TechTemp

## **Comment récupérer les scripts sur votre Raspberry Pi ?**

> **🎯 Testé sur :** Raspberry Pi Zero 2W (config recommandée pour capteurs TechTemp)  
> **Compatible :** Tous Pi 3B+, 4B, Zero 2W avec Raspberry Pi OS

### **🎯 Solution 1 : One-Liner Bootstrap (RECOMMANDÉ)**
```bash
# Une seule commande - Télécharge tout automatiquement
curl -sSL https://raw.githubusercontent.com/laurent987/techtemp/feature/journal-008-premier-capteur-physique/scripts/bootstrap.sh | bash
```

**Résultat :** Installation complète dans `/home/pi/techtemp/`

---

### **🎯 Solution 2 : Clone Repository**
```bash
cd /home/pi
git clone https://github.com/laurent987/techtemp.git
cd techtemp
git checkout feature/journal-008-premier-capteur-physique
chmod +x scripts/*.sh
```

---

### **🎯 Solution 3 : Scripts Individuels**
```bash
# Créer répertoire
mkdir -p /home/pi/techtemp-scripts
cd /home/pi/techtemp-scripts

# Télécharger chaque script
wget https://raw.githubusercontent.com/laurent987/techtemp/feature/journal-008-premier-capteur-physique/scripts/bootstrap.sh
wget https://raw.githubusercontent.com/laurent987/techtemp/feature/journal-008-premier-capteur-physique/scripts/install-device.sh
wget https://raw.githubusercontent.com/laurent987/techtemp/feature/journal-008-premier-capteur-physique/scripts/test-hardware.sh

# Permissions
chmod +x *.sh
```

---

## **📂 Que fait chaque script ?**

| Script | Usage | Description |
|--------|-------|-------------|
| `bootstrap.sh` | One-liner setup | Clone repo + permissions + setup initial |
| `install-device.sh` | Installation complète | Dépendances + compilation + configuration |
| `test-hardware.sh` | Diagnostic matériel | Test I2C + AHT20 + GPIO |

---

## **🚀 Workflow Recommandé**

1. **Bootstrap** (1 commande)
   ```bash
   curl -sSL https://raw.githubusercontent.com/laurent987/techtemp/feature/journal-008-premier-capteur-physique/scripts/bootstrap.sh | bash
   ```

2. **Test Hardware** (vérifier AHT20)
   ```bash
   cd /home/pi/techtemp
   ./scripts/test-hardware.sh
   ```

3. **Démarrer Client**
   ```bash
   ./device/bin/techtemp-device
   ```

---

## **❓ Dépannage Accès**

### **Problème : Pas d'internet sur Pi**
```bash
# Vérifier connexion
ping -c 3 8.8.8.8

# Télécharger scripts depuis un autre PC puis copier via USB
```

### **Problème : Git non installé**
```bash
sudo apt update
sudo apt install -y git curl wget
```

### **Problème : Permissions**
```bash
# Après téléchargement, toujours faire :
chmod +x *.sh
```

---

## **🎯 URLs de Référence**

- **Repository Principal :** https://github.com/laurent987/techtemp
- **Branche Capteur :** `feature/journal-008-premier-capteur-physique`
- **Bootstrap Direct :** https://raw.githubusercontent.com/laurent987/techtemp/feature/journal-008-premier-capteur-physique/scripts/bootstrap.sh

---

*Journal #008 - Premier Capteur Physique - Phase 3 Déploiement*
