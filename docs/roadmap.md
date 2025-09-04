# Roadmap TechTemp

## 🟢 Lot 1 — MVP 

🎯 **Objectif :** avoir un système end-to-end minimal.  
📦 **Étapes prévues :**

1. **Infrastructure de base (RPi central)**  
   - Installer Mosquitto (broker MQTT).  
   - Créer la base SQLite avec tables minimales (`devices`, `readings_raw`).  
   - Mettre en place le service Node.js (`service-app`) avec :  
     - Connexion MQTT (subscribe `home/.../reading`),  
     - Insertion SQLite (ingestion),  
     - Endpoint `/health` qui répond `"ok"`.  
   👉 **Résultat attendu :** si un capteur publie → ça finit en DB.  


2. **Capteur test (un seul Pi, AHT20)**  
   - Script C (ou Python rapide) pour lire le capteur.  
   - Publier sur MQTT topic `home/<homeId>/sensors/<deviceId>/reading`.  
   - Vérifier insertion en DB.  
   👉 **Résultat attendu :** premier point de donnée stocké.  

3. **API simple**  
   - Dans `service-app`, ajouter endpoint :  
     - `GET /api/v1/readings/latest` → dernière valeur par device.  
   - Tester via Postman / curl.  
   👉 **Résultat attendu :** voir la température en JSON depuis PC/smartphone.  

4. **Vue web simple**  
   - Page HTML/JS qui appelle `/api/v1/readings/latest`.  
   - Affiche tableau : *pièce | température | humidité*.  
   👉 **Résultat attendu :** visualiser les données en direct (refresh manuel).  

---

## 🟡 Lot 2 — Phase 2 

🎯 **Objectif :** enrichir avec historique + monitoring.  
📦 Étapes principales :
- Agrégations horaires/journalières + rétention long terme.  
- Historique navigable (sélection par date).  
- Monitoring devices & pipeline ingestion.  
- Centre d’incidents (OPEN/ACK/RESOLVED).  
- Sécurité renforcée (JWT, ACL MQTT, logs sécurité).  
- CI/CD complet pour serveur + déploiement collectors via Ansible.

---

## 🔴 Lot 3 — Phase 3 (long terme, optionnel)

🎯 **Objectif :** domotique intégrée.  
📦 Étapes principales :
- Commandes chauffage/volets.  
- Automatisations règles.  
- Notifications enrichies (SMS, escalade).  
- Migration DB vers PostgreSQL (multi-sites).  
- Mise à jour OTA collectors.  


---

📌 Cette roadmap donne la **vue macro**.  
Pour les détails (contrats, décisions, code), se référer aux **journaux** dans `/docs/journal/`.
