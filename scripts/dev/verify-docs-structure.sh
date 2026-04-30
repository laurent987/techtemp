#!/bin/bash

# Script pour vérifier l'intégrité de la nouvelle structure de documentation
# TechTemp - Vérification des liens et structure

echo "🔍 Vérification de la structure de documentation TechTemp"
echo "========================================================="

# Variables
DOCS_DIR="/Users/user/Documents/informatique/techtemp/docs"
ERRORS=0

# Fonction pour vérifier qu'un fichier existe
check_file() {
    local file="$1"
    local description="$2"
    
    if [ -f "$file" ]; then
        echo "✅ $description: $file"
    else
        echo "❌ $description: $file (MANQUANT)"
        ((ERRORS++))
    fi
}

# Fonction pour vérifier qu'un dossier existe
check_dir() {
    local dir="$1"
    local description="$2"
    
    if [ -d "$dir" ]; then
        echo "✅ $description: $dir"
    else
        echo "❌ $description: $dir (MANQUANT)"
        ((ERRORS++))
    fi
}

echo
echo "📁 Vérification de la structure principale..."
echo "----------------------------------------------"

# Structure principale
check_dir "$DOCS_DIR/USER" "Dossier USER"
check_dir "$DOCS_DIR/DEVELOPER" "Dossier DEVELOPER"
check_dir "$DOCS_DIR/CONTRIBUTOR" "Dossier CONTRIBUTOR"
check_dir "$DOCS_DIR/INTERNAL" "Dossier INTERNAL"

echo
echo "📋 Vérification des guides principaux..."
echo "----------------------------------------"

# Guides principaux
check_file "$DOCS_DIR/USER/README.md" "Guide Utilisateur"
check_file "$DOCS_DIR/DEVELOPER/README.md" "Guide Développeur"
check_file "$DOCS_DIR/CONTRIBUTOR/README.md" "Guide Contributeur"
check_file "$DOCS_DIR/INTERNAL/README.md" "Documentation Interne"

echo
echo "🔗 Vérification de l'API documentation..."
echo "-----------------------------------------"

# Documentation API
check_dir "$DOCS_DIR/DEVELOPER/api" "Dossier API"
check_file "$DOCS_DIR/DEVELOPER/api/README.md" "API Overview"
check_file "$DOCS_DIR/DEVELOPER/api/DEVICES.md" "API Devices"
check_file "$DOCS_DIR/DEVELOPER/api/READINGS.md" "API Readings"
check_file "$DOCS_DIR/DEVELOPER/api/ERRORS.md" "API Errors"
check_file "$DOCS_DIR/DEVELOPER/api/EXAMPLES.md" "API Examples"

echo
echo "📱 Vérification des guides devices..."
echo "------------------------------------"

# Documentation devices utilisateur
check_dir "$DOCS_DIR/USER/devices" "Dossier Devices"
check_file "$DOCS_DIR/USER/devices/README.md" "Devices Overview"
check_dir "$DOCS_DIR/USER/devices/hardware" "Hardware Documentation"
check_dir "$DOCS_DIR/USER/devices/setup" "Setup Guides"
check_dir "$DOCS_DIR/USER/devices/troubleshooting" "Troubleshooting"

echo
echo "🗃️ Vérification de la documentation interne..."
echo "----------------------------------------------"

# Documentation interne
check_dir "$DOCS_DIR/INTERNAL/archive" "Archive"
check_dir "$DOCS_DIR/INTERNAL/legacy" "Legacy Documentation"
check_dir "$DOCS_DIR/INTERNAL/archive/journaux" "Development Journals"
check_file "$DOCS_DIR/INTERNAL/legacy/ARCHITECTURE.md" "Legacy Architecture"
check_file "$DOCS_DIR/INTERNAL/legacy/SETUP.md" "Legacy Setup"

echo
echo "📊 Résumé de la vérification..."
echo "==============================="

if [ $ERRORS -eq 0 ]; then
    echo "🎉 Toute la structure de documentation est correcte !"
    echo "📂 Structure organisée avec succès :"
    echo "   - USER/     : Guides pour utilisateurs finaux"
    echo "   - DEVELOPER/: Documentation API et intégration"
    echo "   - CONTRIBUTOR/: Guides pour contributeurs"
    echo "   - INTERNAL/ : Documentation interne et archives"
    
    echo
    echo "🚀 Prochaines étapes recommandées :"
    echo "   1. Tester les liens dans les README"
    echo "   2. Valider les exemples de code API"
    echo "   3. Considérer l'activation du Wiki GitHub"
    echo "   4. Commit et push de la nouvelle structure"
    
else
    echo "⚠️  $ERRORS erreur(s) détectée(s) dans la structure"
    echo "   Veuillez corriger les fichiers manquants avant de continuer"
fi

echo
echo "📈 Statistiques :"
echo "   - $(find "$DOCS_DIR" -name "*.md" | wc -l | tr -d ' ') fichiers Markdown"
echo "   - $(find "$DOCS_DIR" -type d | wc -l | tr -d ' ') dossiers"
echo "   - Structure à 4 niveaux d'audience"

exit $ERRORS
